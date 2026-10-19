// 零食 / 饮料数据：301 条真实超市 / 便利店 / 美团闪购可买的具体商品
// 来源：real_snacks_research.json（已通过 script/import-real-data.ts 生成）。
// 字段含 大致热量 / 糖 / 脂肪 / 蛋白质 / 适合人群 / 真实品牌名。
// 这不是医疗建议。

import { REAL_SNACKS } from "./snacks.generated";
import type { Snack, SnackAudience, SnackCategory } from "./snacks.types";

export type { Snack, SnackAudience, SnackCategory } from "./snacks.types";

/** v6 runtime normalize: 修正 import 脚本里 mapSnackCategory 的串类问题。
 *
 *  历史 bug 链：
 *  v4: 「德芙丝滑牛奶巧克力」被分到「酸奶乳品」（/牛奶/ 先于 /巧克力/ 命中）。
 *  v5: 「徐福记核桃酥」「徐福记沙琪玛」被分到「巧克力糖果」
 *      （regex 含「徐福记」品牌名，把品牌下的酥饼/沙琪玛拽进巧克力池）。
 *  v6: 「酸奶乳品」混入纯牛奶（特仑苏/金典/认养一头牛/旺仔牛奶），
 *      标签叫「酸奶乳品」但内容包含纯牛奶，UI 误导。
 *      「巧克力糖果」混入糖果（曼妥思/大白兔/奶糖），名义是「巧克力」但内容含奶糖。
 *
 *  v6 解法：拆类目，并把判断顺序改成「具体型态优先」：
 *    1) 冰品（雪糕/冰淇淋）
 *    2) 蛋白棒
 *    3) 烘焙糕点（核桃酥/沙琪玛/月饼/酥饼/吐司/面包/派/蛋糕/曲奇/饼干）
 *       —— 这一步必须在「巧克力 / 糖果 / 乳品」之前，否则品牌字段会把烘焙误拉走。
 *    4) 巧克力（必须含 "巧克力" 字样或国际巧克力品牌；纯品牌名不够）
 *    5) 糖果（奶糖 / 软糖 / 硬糖 / 口香糖 / 薄荷糖 / 雅客 / 大白兔 / 曼妥思 / 阿尔卑斯 / 益达）
 *    6) 酸奶（酸奶 / 发酵乳 / 优酸乳 / 优酪乳 / 安慕希 / 纯甄 / 莫斯利安 / 简爱 / 卡士 / 优倍 / 味可滋）
 *    7) 牛奶乳饮（纯牛奶 / 舒化奶 / 特仑苏 / 金典 / 认养一头牛 / 娟姗 / AD钙 / 旺仔牛奶 / 营养快线）
 *
 *  这样：
 *  - 选「巧克力」chip → 不会出现核桃酥 / 沙琪玛 / 奶糖 / 旺仔牛奶。
 *  - 选「糖果」chip → 不会出现核桃酥（糕点）/ 巧克力 / 牛奶。
 *  - 选「酸奶」chip → 不会出现纯牛奶；只是真酸奶。
 *  - 选「牛奶乳饮」chip → 才是金典 / 特仑苏 / 旺仔。
 *  - 选「饼干曲奇」chip → 包含核桃酥 / 沙琪玛 / 奥利奥 等所有酥饼饼干。
 */
function normalizeSnackCategory(s: Snack): SnackCategory {
  const text = `${s.name} ${s.brand ?? ""} ${(s.searchKeywords ?? []).join(" ")} ${s.reason ?? ""}`;

  // 1) 冰品
  if (/雪糕|冰淇淋|甜筒|脆皮/.test(text) || s.category === "冰品冰淇淋") return "冰品冰淇淋";
  // 2) 蛋白棒
  if (/蛋白棒|蛋白谷物棒|代餐棒/.test(text) || s.category === "蛋白零食") return "蛋白零食";

  // 3a) 面包糕点（含蛋糕 / 吐司 / 派 / 月饼）—— 注意：派含「巧克力派」「香蕉派」，仍属糕点
  const isBreadCake = /面包|吐司|蛋糕|月饼|司康|可颂|麻薯|大福|蛋黄派|巧克力派|香蕉派|草莓派|奶油派|手撕面包|沙琪玛/.test(text);
  if (isBreadCake) return "面包糕点";

  // 3b) 饼干 / 曲奇 / 酥饼（核桃酥 / 花生酥 / 奥利奥 / 趣多多 / 威化饼 / 苏打饼 / 消化饼 / 米饼）
  //    威化巧克力（KitKat / 雅客威化巧克力）是「巧克力」而非「饼干」—— 用 "威化巧克力" 显式排除。
  const isBiscuit =
    /饼干|曲奇|苏打饼|消化饼|米饼|仙贝|奥利奥|趣多多|核桃酥|花生酥|凤梨酥|蛋黄酥|百奇|Pocky/.test(text) ||
    (/威化/.test(text) && !/威化巧克力|巧克力威化/.test(text));
  if (isBiscuit) return "饼干曲奇";

  // 4) 巧克力 —— 必须明确含「巧克力 / chocolate / 巧」类关键词或国际巧克力品牌专属字样
  //    「徐福记」「大白兔」这种 candy 品牌不能作为巧克力关键字。
  const isChocolate =
    /巧克力|chocolate|可可粉|cocoa/i.test(text) ||
    /Hershey|Dove(?!\s*酱)|Meiji.*巧克力|Lindt|Kisses|KitKat|Snickers|士力架|费列罗|Ferrero|瑞士莲|怡浓|Enon|奇巧|Nestle.*KitKat/i.test(text);
  if (isChocolate) return "巧克力";

  // 5) 糖果 —— 奶糖 / 软糖 / 硬糖 / 口香糖 / 薄荷糖 / 棒棒糖；含曼妥思 / 大白兔 / 阿尔卑斯 / 益达 / 雅客
  const isCandy =
    /奶糖|软糖|硬糖|果糖(?!果糖醇)|水果糖|薄荷糖|口香糖|棒棒糖|阿尔卑斯|大白兔|曼妥思|Mentos|益达|Extra|雅客|White\s*Rabbit|徐福记奶糖|徐福记软糖/i.test(text);
  if (isCandy) return "糖果";

  // 6) 酸奶 —— 必须是发酵乳 / 含活性菌：酸奶 / 酸牛奶 / 优酸乳 / 优酪乳 / 希腊酸奶 / 安慕希 / 纯甄 / 莫斯利安 / 简爱 / 卡士 / 优倍 / 味可滋 / 风味发酵乳
  const isYogurt =
    /酸奶|酸牛奶|优酸乳|优酪乳|希腊酸奶|发酵乳|乳酸菌饮料|安慕希|纯甄|莫斯利安|简爱|卡士|优倍|味可滋/.test(text);
  if (isYogurt) return "酸奶";

  // 7) 牛奶乳饮 —— 纯牛奶 / 舒化奶 / 高端纯奶 / 调制乳 / 含奶饮料 / AD钙 / 营养快线
  const isMilk =
    /纯牛奶|牛奶|舒化奶|特仑苏|金典|认养一头牛|娟姗|AD钙|旺仔牛奶|营养快线|奶昔|奶酪|奶粉|乳品|乳制品|早餐奶|每日鲜语|真果粒|果粒牛奶/.test(text);
  if (isMilk) return "牛奶乳饮";

  // 8) 旧标签兜底映射：generated.ts 里残留的「巧克力糖果」「酸奶乳品」走默认改写。
  if (s.category === "巧克力糖果") return "巧克力";
  if (s.category === "酸奶乳品") return "牛奶乳饮";

  return s.category;
}

export const SNACKS: Snack[] = REAL_SNACKS.map((s) => {
  const fixed = normalizeSnackCategory(s);
  return fixed === s.category ? s : { ...s, category: fixed };
});

export interface SnackPickInput {
  audiences: SnackAudience[];
  maxCalories?: number;
  preferCategories?: SnackCategory[];
  /** 用户标记「喜欢」的零食 id（加分，下次更可能推） */
  likedIds?: Set<string>;
  /** 用户标记「不喜欢」的零食 id（强降权，从候选池中剔除） */
  dislikedIds?: Set<string>;
}

export interface SnackPickResult {
  special: Snack;
  alternatives: Snack[];
  decisionLine: string;
}

export function pickSnack(input: SnackPickInput): SnackPickResult {
  // v5: 当用户勾选了 preferCategories，必须严格按当前所选分类过滤候选池——
  // 主推荐 + 备选都只能从这些分类里出。否则会出现「点了巧克力糖果，
  // 主卡却显示伊利优酸乳（酸奶乳品）」的串类问题。
  const filterByCategory = input.preferCategories && input.preferCategories.length > 0;
  let pool = filterByCategory
    ? SNACKS.filter((s) => input.preferCategories!.includes(s.category))
    : SNACKS;
  if (input.dislikedIds && input.dislikedIds.size > 0) {
    const filtered = pool.filter((s) => !input.dislikedIds!.has(s.id));
    if (filtered.length >= 3) pool = filtered;
  }
  // pool 为空（理论上不会，因为 SNACKS 覆盖每个 category 都有数据）时，
  // 兜底回到全量池，避免 UI 崩溃。
  const candidates = pool.length > 0 ? pool : SNACKS;

  const scored = candidates.map((s) => {
    let score = 0;
    const aHits = input.audiences.filter((a) => s.audiences.includes(a)).length;
    score += aHits * 12;
    if (input.preferCategories?.includes(s.category)) score += 10;
    if (input.maxCalories && s.calories > input.maxCalories) score -= 14;
    if (input.audiences.includes("减脂") || input.audiences.includes("控糖")) {
      if ((s.sugar ?? 0) <= 5) score += 8;
      if ((s.fat ?? 0) <= 6) score += 6;
      if (s.category === "无糖饮料" || s.category === "蛋白零食") score += 8;
    }
    if (input.audiences.includes("增肌")) {
      if ((s.protein ?? 0) >= 8) score += 12;
    }
    if (input.audiences.includes("儿童")) {
      if (s.category === "酸奶" || s.category === "牛奶乳饮" || s.category === "面包糕点" || s.category === "果干蜜饯") score += 8;
      if (s.caution?.includes("控糖") || (s.sugar ?? 0) > 30) score -= 6;
    }
    if (input.audiences.includes("长辈")) {
      if ((s.sugar ?? 0) <= 8) score += 6;
      if (s.category === "酸奶" || s.category === "牛奶乳饮" || s.category === "坚果") score += 8;
    }
    // A 真实商品加权（regenerated.ts 全部为真实商品，但保留逻辑兼容）
    if (s.confidence === "A") score += 4;
    if (input.likedIds && input.likedIds.has(s.id)) score += 9;
    if (input.dislikedIds && input.dislikedIds.has(s.id)) score -= 30;
    score += Math.random() * 5;
    return { snack: s, score };
  }).sort((a, b) => b.score - a.score);

  const special = scored[0].snack;
  const alternatives = scored.slice(1, 6).map((s) => s.snack);
  const decisionLine = (() => {
    const tags = input.audiences.length > 0 ? input.audiences.join("·") : "随手买";
    return `今天替你决定：${special.name} — 适合「${tags}」`;
  })();
  return { special, alternatives, decisionLine };
}

/** 美团闪购 / 京东到家 / 淘宝 / 百度兜底搜索入口。
 *  v4: 全部走稳定搜索入口（百度站内 / 平台搜索）。美团 H5 直达多次改版常 error_page，已彻底移除。
 *  优先用 brand + 商品名拼接，命中率更高。
 */
export function snackSearchLinks(name: string, extraKeywords?: string[]): { label: string; href: string; note?: string }[] {
  const q = encodeURIComponent(name);
  const expanded = encodeURIComponent([name, ...(extraKeywords || [])].join(" "));
  return [
    { label: "美团闪购搜（百度站内）", href: `https://www.baidu.com/s?wd=${encodeURIComponent("美团闪购 " + name)}` },
    { label: "京东搜", href: `https://search.jd.com/Search?keyword=${q}` },
    { label: "淘宝搜", href: `https://s.taobao.com/search?q=${q}` },
    { label: "百度搜", href: `https://www.baidu.com/s?wd=${expanded}` },
  ];
}
