// 真实菜品图片提供器（免费、无密钥、CORS 友好）：
//   1. Wikimedia Commons API（origin=*） — 中文 / 英文菜名搜索缩略图。
//   2. TheMealDB 公开接口（不需要 KEY，免费） — 国际通用菜 / 食材图片。
//   3. 命中失败或网络错误 → 返回 null，调用方 fallback 到 DishImage 渲染。
//
// 设计原则：
//   - 永远 best-effort，绝不破坏 UI；任何异常 catch 后返回 null。
//   - 命中结果缓存到 localStorage（24h），失败也缓存为 null（10min）以避免反复请求。
//   - localStorage 不可用时退回内存态。
//   - 图片仅作为「示意」覆盖在本地渲染氛围图上，加载失败 onError 立刻 fallback。

import { readJSON, writeJSON } from "./storage";

const CACHE_KEY = "chishenme.imageCache.v1";
const CACHE_HIT_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MISS_TTL_MS = 10 * 60 * 1000; // 10min — 让用户隔一阵后能重新尝试
const MAX_CACHE_ENTRIES = 400;

interface CacheEntry {
  /** null = 命中过、但没找到合适的图 */
  url: string | null;
  /** 来源：wikimedia / themealdb / none */
  source: "wikimedia" | "themealdb" | "none";
  /** 命中时间戳 */
  ts: number;
}

type CacheMap = Record<string, CacheEntry>;

function loadCache(): CacheMap {
  return readJSON<CacheMap>(CACHE_KEY, {});
}

function saveCache(cache: CacheMap): void {
  // 简单 LRU：超过 MAX_CACHE_ENTRIES 时删除最旧 1/4
  const entries = Object.entries(cache);
  if (entries.length > MAX_CACHE_ENTRIES) {
    entries.sort((a, b) => a[1].ts - b[1].ts);
    const keep = entries.slice(Math.floor(MAX_CACHE_ENTRIES * 0.25));
    const next: CacheMap = {};
    for (const [k, v] of keep) next[k] = v;
    writeJSON(CACHE_KEY, next);
    return;
  }
  writeJSON(CACHE_KEY, cache);
}

function cacheGet(key: string): CacheEntry | null {
  const cache = loadCache();
  const entry = cache[key];
  if (!entry) return null;
  const ttl = entry.url === null ? CACHE_MISS_TTL_MS : CACHE_HIT_TTL_MS;
  if (Date.now() - entry.ts > ttl) return null;
  return entry;
}

function cacheSet(key: string, entry: CacheEntry): void {
  const cache = loadCache();
  cache[key] = entry;
  saveCache(cache);
}

// === Wikimedia Commons ===
// API 文档：https://commons.wikimedia.org/w/api.php
// origin=* 允许任意来源跨域；返回缩略图 URL。
async function tryWikimedia(query: string): Promise<string | null> {
  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${query} food`);
    url.searchParams.set("gsrlimit", "5");
    url.searchParams.set("gsrnamespace", "6"); // File:
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime");
    url.searchParams.set("iiurlwidth", "320");

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) return null;
    const data: any = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    for (const id of Object.keys(pages)) {
      const p = pages[id];
      const ii = p?.imageinfo?.[0];
      if (!ii) continue;
      const mime: string = ii.mime ?? "";
      if (!/^image\/(jpeg|png|webp|gif)$/i.test(mime)) continue;
      const thumb = ii.thumburl || ii.url;
      if (typeof thumb === "string" && thumb.startsWith("https://")) {
        return thumb;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// === TheMealDB ===
// 免费 API（test key "1"）— https://www.themealdb.com/api.php
// 主要用作国际菜 / 通用关键词的图片兜底（中文菜不一定命中）。
async function tryMealDb(query: string): Promise<string | null> {
  try {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return null;
    const data: any = await res.json();
    const meals = data?.meals;
    if (!Array.isArray(meals) || meals.length === 0) return null;
    const first = meals[0];
    const thumb = first?.strMealThumb;
    if (typeof thumb === "string" && thumb.startsWith("https://")) return thumb;
    return null;
  } catch {
    return null;
  }
}

/** 中文菜名 → 英文/拼音查询关键词的简单映射（提高命中率）。
 *  匹配规则按数组顺序「先到先得」，越具体的关键词放越前面（如「扬州炒饭」放在「炒饭」之前）。
 *  没匹配到就直接用原名搜索（Wikimedia 也支持中文）。 */
const NAME_HINT: { keys: string[]; en: string }[] = [
  // 经典川菜
  { keys: ["麻婆豆腐"], en: "mapo tofu" },
  { keys: ["宫保鸡丁"], en: "kung pao chicken" },
  { keys: ["回锅肉"], en: "twice cooked pork" },
  { keys: ["鱼香肉丝"], en: "yu xiang shredded pork" },
  { keys: ["夫妻肺片"], en: "fuqi feipian" },
  { keys: ["水煮鱼"], en: "shuizhuyu boiled fish" },
  { keys: ["水煮肉片"], en: "shuizhu sliced pork" },
  { keys: ["酸菜鱼"], en: "suancaiyu pickled cabbage fish" },
  { keys: ["毛血旺"], en: "mao xue wang" },
  { keys: ["麻辣香锅"], en: "mala xiangguo" },
  { keys: ["麻辣烫"], en: "malatang" },
  { keys: ["担担面"], en: "dan dan noodles" },
  { keys: ["钵钵鸡"], en: "bobo chicken sichuan" },
  { keys: ["口水鸡"], en: "saliva chicken" },
  { keys: ["辣子鸡"], en: "chongqing chili chicken" },
  // 粤菜 / 港式
  { keys: ["白切鸡", "葱油白切鸡"], en: "white cut chicken" },
  { keys: ["叉烧"], en: "char siu pork" },
  { keys: ["烧鹅"], en: "roast goose cantonese" },
  { keys: ["烧鸭"], en: "roast duck cantonese" },
  { keys: ["烤鸭", "北京烤鸭"], en: "peking duck" },
  { keys: ["盐焗鸡"], en: "salt baked chicken" },
  { keys: ["椰子鸡"], en: "coconut chicken hot pot" },
  { keys: ["猪肚鸡"], en: "pig stomach chicken soup" },
  { keys: ["佛跳墙"], en: "buddha jumps over the wall" },
  { keys: ["豉汁排骨"], en: "black bean spareribs" },
  { keys: ["蜜汁叉烧"], en: "honey char siu" },
  { keys: ["云吞面"], en: "wonton noodle" },
  { keys: ["馄饨", "云吞"], en: "wonton" },
  { keys: ["肠粉"], en: "rice noodle roll" },
  { keys: ["虾饺"], en: "har gow" },
  { keys: ["凤爪"], en: "chicken feet dim sum" },
  { keys: ["菠萝包"], en: "pineapple bun" },
  { keys: ["丝袜奶茶"], en: "hong kong milk tea" },
  // 江浙 / 沪 / 徽
  { keys: ["东坡肉"], en: "dongpo pork" },
  { keys: ["西湖醋鱼"], en: "west lake fish vinegar" },
  { keys: ["龙井虾仁"], en: "longjing shrimp" },
  { keys: ["松鼠鳜鱼"], en: "squirrel mandarin fish" },
  { keys: ["臭鳜鱼"], en: "stinky mandarin fish" },
  { keys: ["生煎"], en: "shengjian sheng jian bao" },
  { keys: ["小笼包", "灌汤包"], en: "xiaolongbao" },
  { keys: ["蟹粉小笼"], en: "crab xiaolongbao" },
  { keys: ["腌笃鲜"], en: "yan du xian soup" },
  { keys: ["盐水鸭"], en: "nanjing salted duck" },
  { keys: ["鸭血粉丝汤"], en: "duck blood vermicelli soup" },
  { keys: ["糖醋小排"], en: "sweet sour pork ribs" },
  { keys: ["糖醋排骨"], en: "sweet sour pork ribs" },
  { keys: ["糖醋里脊"], en: "sweet and sour pork" },
  { keys: ["葱油拌面", "拌面"], en: "scallion oil noodles" },
  { keys: ["阳春面"], en: "yang chun noodle" },
  { keys: ["片儿川"], en: "pian er chuan" },
  // 鄂 / 湘 / 赣
  { keys: ["热干面"], en: "wuhan hot dry noodles" },
  { keys: ["豆皮"], en: "wuhan doupi" },
  { keys: ["剁椒鱼头"], en: "chopped pepper fish head" },
  { keys: ["臭豆腐"], en: "stinky tofu" },
  { keys: ["糖油粑粑"], en: "sweet rice cake" },
  { keys: ["瓦罐汤"], en: "nanchang clay pot soup" },
  // 西北 / 北方
  { keys: ["羊肉泡馍"], en: "yangrou paomo" },
  { keys: ["肉夹馍"], en: "rou jia mo chinese burger" },
  { keys: ["臊子面"], en: "saozi mian noodles" },
  { keys: ["biangbiang面"], en: "biangbiang noodles" },
  { keys: ["凉皮"], en: "liangpi cold skin noodles" },
  { keys: ["油泼面"], en: "youpomian oil splashed noodles" },
  { keys: ["手抓羊肉"], en: "hand grabbed lamb xinjiang" },
  { keys: ["大盘鸡"], en: "dapanji big plate chicken" },
  { keys: ["羊肉串"], en: "lamb skewers chuan" },
  { keys: ["拉条子"], en: "lagman noodles xinjiang" },
  { keys: ["刀削面"], en: "shanxi knife shaved noodles" },
  { keys: ["过油肉"], en: "shanxi guoyou rou" },
  { keys: ["胡辣汤"], en: "hulatang spicy soup" },
  { keys: ["驴肉火烧"], en: "donkey meat burger" },
  { keys: ["卤煮"], en: "lu zhu beijing" },
  { keys: ["豆汁"], en: "douzhi fermented mung bean" },
  { keys: ["焦圈"], en: "jiaoquan crispy ring" },
  { keys: ["爆肚"], en: "baodu beijing tripe" },
  { keys: ["驴打滚"], en: "lvdagun glutinous roll" },
  // 东北
  { keys: ["锅包肉"], en: "guo bao rou" },
  { keys: ["地三鲜"], en: "di san xian" },
  { keys: ["小鸡炖蘑菇"], en: "chicken mushroom stew" },
  { keys: ["猪肉炖粉条"], en: "northeast pork vermicelli stew" },
  { keys: ["杀猪菜"], en: "northeast sour cabbage stew" },
  // 火锅 / 烧烤
  { keys: ["重庆火锅"], en: "chongqing hot pot" },
  { keys: ["火锅"], en: "hot pot" },
  { keys: ["铁板"], en: "sizzling iron plate" },
  // 红烧 / 家常
  { keys: ["红烧肉"], en: "red braised pork belly" },
  { keys: ["红烧排骨"], en: "red braised spareribs" },
  { keys: ["红烧鱼"], en: "red braised fish" },
  { keys: ["红烧牛肉"], en: "red braised beef" },
  { keys: ["可乐鸡翅"], en: "coca cola chicken wings" },
  { keys: ["三杯鸡"], en: "three cup chicken" },
  { keys: ["白菜豆腐汤"], en: "tofu cabbage soup" },
  { keys: ["番茄炒蛋", "西红柿炒蛋"], en: "tomato scrambled egg" },
  { keys: ["蒜蓉粉丝"], en: "garlic vermicelli" },
  { keys: ["凉拌黄瓜"], en: "smashed cucumber salad" },
  { keys: ["拍黄瓜"], en: "smashed cucumber salad" },
  { keys: ["凉拌木耳"], en: "wood ear salad" },
  // 主食 / 米饭
  { keys: ["扬州炒饭"], en: "yangzhou fried rice" },
  { keys: ["腊肠饭", "煲仔饭"], en: "claypot rice cantonese" },
  { keys: ["炒饭", "蛋炒饭"], en: "fried rice" },
  { keys: ["卤肉饭"], en: "lu rou fan taiwanese" },
  { keys: ["盖浇饭"], en: "rice with topping" },
  { keys: ["焖饭"], en: "donabe rice" },
  { keys: ["白米饭"], en: "steamed white rice" },
  { keys: ["寿司"], en: "sushi" },
  // 主食 / 面食
  { keys: ["饺子", "锅贴"], en: "dumplings" },
  { keys: ["蒸饺"], en: "steamed dumpling" },
  { keys: ["包子"], en: "baozi" },
  { keys: ["叉烧包"], en: "char siu bao" },
  { keys: ["烧麦", "烧卖"], en: "shaomai" },
  { keys: ["油条"], en: "youtiao" },
  { keys: ["煎饼果子", "煎饼"], en: "jianbing chinese crepe" },
  { keys: ["螺蛳粉"], en: "luosifen rice noodle" },
  { keys: ["桂林米粉"], en: "guilin rice noodles" },
  { keys: ["米线"], en: "rice noodles" },
  { keys: ["过桥米线"], en: "crossing bridge noodles" },
  { keys: ["云南米线"], en: "yunnan rice noodles" },
  { keys: ["炸酱面"], en: "zhajiangmian noodles" },
  { keys: ["牛肉面"], en: "taiwan beef noodle" },
  { keys: ["兰州拉面"], en: "lanzhou lamian beef noodle" },
  { keys: ["重庆小面"], en: "chongqing xiaomian" },
  { keys: ["麻酱凉面"], en: "sesame cold noodles" },
  // 汤 / 粥
  { keys: ["蛋花汤", "番茄蛋花汤"], en: "egg drop soup" },
  { keys: ["紫菜汤", "紫菜虾皮汤"], en: "seaweed soup" },
  { keys: ["排骨汤"], en: "pork rib soup" },
  { keys: ["排骨藕汤"], en: "lotus root pork soup" },
  { keys: ["冬瓜汤"], en: "winter melon soup" },
  { keys: ["丝瓜汤"], en: "luffa soup chinese" },
  { keys: ["白粥"], en: "congee plain" },
  { keys: ["皮蛋瘦肉粥"], en: "century egg pork congee" },
  { keys: ["小米粥"], en: "millet porridge" },
  { keys: ["八宝粥"], en: "eight treasure congee" },
  { keys: ["银耳莲子汤"], en: "tremella lotus seed soup" },
  { keys: ["酒酿圆子"], en: "fermented rice dessert" },
  { keys: ["豆腐脑"], en: "douhua tofu pudding" },
  // 早餐 / 街头
  { keys: ["豆浆"], en: "soy milk" },
  { keys: ["茶叶蛋"], en: "tea egg" },
  { keys: ["包子稀饭"], en: "baozi congee breakfast" },
  // 甜品 / 饮品 / 烘焙
  { keys: ["双皮奶"], en: "double skin milk" },
  { keys: ["杨枝甘露"], en: "mango pomelo sago" },
  { keys: ["龟苓膏"], en: "guilinggao" },
  { keys: ["奶茶", "珍珠奶茶"], en: "bubble tea milk tea" },
  { keys: ["蛋挞"], en: "egg tart" },
  { keys: ["葡式蛋挞"], en: "portuguese egg tart" },
  { keys: ["马卡龙"], en: "macaron" },
  { keys: ["布丁"], en: "pudding" },
  { keys: ["提拉米苏"], en: "tiramisu" },
  { keys: ["芝士蛋糕"], en: "cheesecake" },
  { keys: ["戚风蛋糕"], en: "chiffon cake" },
  { keys: ["纸杯蛋糕"], en: "cupcake" },
  { keys: ["黑森林"], en: "black forest cake" },
  { keys: ["松饼"], en: "pancake" },
  { keys: ["华夫饼"], en: "waffle" },
  { keys: ["可丽饼"], en: "crepe" },
  { keys: ["甜甜圈"], en: "donut" },
  { keys: ["司康"], en: "scone" },
  { keys: ["费南雪"], en: "financier pastry" },
  { keys: ["可颂"], en: "croissant" },
  { keys: ["三明治"], en: "sandwich" },
  { keys: ["汉堡"], en: "hamburger" },
  { keys: ["薯条"], en: "french fries" },
  { keys: ["披萨", "比萨"], en: "pizza" },
  { keys: ["意面", "意大利面"], en: "spaghetti pasta" },
  { keys: ["千层"], en: "mille feuille" },
  { keys: ["拿破仑"], en: "napoleon pastry" },
  { keys: ["甜品"], en: "dessert chinese" },
  // 其它常见
  { keys: ["凉拌"], en: "cold dish chinese" },
  { keys: ["清蒸鲈鱼", "清蒸鱼"], en: "steamed fish cantonese" },
  { keys: ["啤酒鸭"], en: "beer duck stew" },
  { keys: ["啤酒鱼"], en: "beer fish guilin" },
  { keys: ["醉鸡"], en: "drunken chicken" },
  { keys: ["醉虾"], en: "drunken shrimp" },
  { keys: ["剁椒"], en: "chopped chili dish" },
  { keys: ["饭", "盖饭"], en: "rice bowl" },
];

function pickEnglishHint(name: string): string | null {
  for (const item of NAME_HINT) {
    if (item.keys.some((k) => name.includes(k))) return item.en;
  }
  return null;
}

export interface ImageResult {
  url: string;
  source: "wikimedia" | "themealdb";
}

/** 取菜品真实示意图。返回 null 表示未命中或失败 — 调用方 fallback。 */
export async function fetchDishImage(name: string): Promise<ImageResult | null> {
  if (!name || typeof fetch === "undefined") return null;
  const cacheKey = `dish::${name}`;
  const cached = cacheGet(cacheKey);
  if (cached) {
    if (cached.url && cached.source !== "none") {
      return { url: cached.url, source: cached.source as "wikimedia" | "themealdb" };
    }
    return null;
  }

  const enHint = pickEnglishHint(name);

  // 顺序尝试：Wikimedia(中文) → Wikimedia(英文) → TheMealDB(英文)
  const queries: { q: string; provider: "wikimedia" | "themealdb" }[] = [
    { q: name, provider: "wikimedia" },
  ];
  if (enHint) {
    queries.push({ q: enHint, provider: "wikimedia" });
    queries.push({ q: enHint, provider: "themealdb" });
  }

  for (const { q, provider } of queries) {
    let url: string | null = null;
    if (provider === "wikimedia") url = await tryWikimedia(q);
    else url = await tryMealDb(q);
    if (url) {
      cacheSet(cacheKey, { url, source: provider, ts: Date.now() });
      return { url, source: provider };
    }
  }

  cacheSet(cacheKey, { url: null, source: "none", ts: Date.now() });
  return null;
}

/** 清空整个图片缓存（暴露给设置面板，不在主 UI 调用）。 */
export function clearImageCache(): void {
  saveCache({});
}
