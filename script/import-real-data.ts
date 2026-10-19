// 把研究输出（real_takeout_brands_research.json / real_snacks_research.json）
// 转成项目内置的 TS 数据。生成的文件：
//   - client/src/data/takeoutBrands.generated.ts （A+B 真实品牌主推荐池）
//   - client/src/data/takeoutCategoryFallback.generated.ts （C 品类模板，仅作品类备选）
//   - client/src/data/snacks.generated.ts （301 真实零食/饮料）
// 设计：纯导入脚本，本地运行一次写出文件后即可不再依赖原始 JSON。
// 运行：npx tsx script/import-real-data.ts

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const TAKEOUT_JSON = resolve("/home/user/workspace/real_takeout_brands_research.json");
const SNACKS_JSON = resolve("/home/user/workspace/real_snacks_research.json");

// ---------- helpers ----------

function slugify(name: string, fallback: string): string {
  // 中英混合 → 拼音/转写难以保留唯一性。改用「name + fallback hash」短 id。
  const trimmed = (name || "").trim();
  // 提取 ASCII 字母数字
  const ascii = trimmed.toLowerCase().match(/[a-z0-9]+/g);
  if (ascii && ascii.length > 0) return ascii.join("-");
  // 回退：用名称的字符码哈希
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) h = ((h << 5) - h + trimmed.charCodeAt(i)) | 0;
  return `${fallback}-${Math.abs(h).toString(36)}`;
}

function emojiFor(category: string): string {
  if (/汉堡|炸鸡/.test(category)) return "🍔";
  if (/披萨/.test(category)) return "🍕";
  if (/快餐|正餐/.test(category)) return "🍱";
  if (/粉面/.test(category)) return "🍜";
  if (/麻辣烫|冒菜/.test(category)) return "🥘";
  if (/火锅/.test(category)) return "🍲";
  if (/茶饮|咖啡/.test(category)) return "☕";
  if (/甜品|烘焙/.test(category)) return "🍰";
  if (/卤味/.test(category)) return "🦆";
  if (/烧烤/.test(category)) return "🍖";
  if (/小吃/.test(category)) return "🥟";
  if (/轻食|沙拉/.test(category)) return "🥗";
  return "🍽️";
}

function gradFor(category: string): [string, string] {
  // 类别 → 渐变色，避免硬链商标
  const map: Record<string, [string, string]> = {
    汉堡炸鸡: ["#e4001b", "#7e0010"],
    披萨: ["#cc2027", "#581015"],
    中式快餐: ["#e08434", "#7c4015"],
    中式正餐: ["#a13d20", "#491708"],
    粉面: ["#bd6b20", "#552d09"],
    麻辣烫冒菜: ["#c8000a", "#5b0006"],
    火锅: ["#cf2421", "#5d0d0c"],
    茶饮咖啡: ["#3a7c5e", "#143725"],
    甜品烘焙: ["#d99a3a", "#7c531a"],
    卤味熟食: ["#5c1a18", "#2a0807"],
    烧烤: ["#a8351c", "#451208"],
    特色小吃: ["#c44a25", "#5d180a"],
    轻食沙拉: ["#3aae66", "#125a30"],
    其他: ["#7a3c1e", "#34170a"],
  };
  return map[category] ?? ["#a8431a", "#491b08"];
}

function mapCategory(category: string): string {
  // 映射到现有 TakeoutCategory 类型（保留兼容）
  if (/汉堡|炸鸡/.test(category)) return "汉堡炸鸡";
  if (/披萨/.test(category)) return "披萨意面";
  if (/中式快餐|中式正餐/.test(category)) return "中式快餐";
  if (/粉面/.test(category)) return "粉面";
  if (/麻辣烫|冒菜|火锅/.test(category)) return "火锅麻辣烫";
  if (/茶饮|咖啡/.test(category)) return "茶饮咖啡";
  if (/甜品|烘焙/.test(category)) return "面包烘焙";
  if (/卤味/.test(category)) return "小吃零嘴";
  if (/烧烤/.test(category)) return "烤肉烧烤";
  if (/小吃/.test(category)) return "小吃零嘴";
  if (/轻食|沙拉/.test(category)) return "健康轻食";
  return "中式快餐";
}

function mapPriceBand(band: string): { budgetMin: number; budgetMax: number } {
  switch (band) {
    case "极低": return { budgetMin: 8, budgetMax: 18 };
    case "低":  return { budgetMin: 10, budgetMax: 25 };
    case "低中": return { budgetMin: 15, budgetMax: 35 };
    case "中":  return { budgetMin: 25, budgetMax: 60 };
    case "中高": return { budgetMin: 50, budgetMax: 120 };
    case "高":  return { budgetMin: 100, budgetMax: 250 };
    default:    return { budgetMin: 20, budgetMax: 60 };
  }
}

function inferTastes(category: string, keywords: string[] = []): string[] {
  const all = [category, ...(keywords || [])].join(" ");
  const out: string[] = [];
  if (/麻辣|川|辣|火锅|串/.test(all)) out.push("辣");
  if (/麻辣/.test(all)) out.push("麻辣");
  if (/粤|粥|清淡|轻食|沙拉|蒸|养生/.test(all)) out.push("清淡");
  if (/茶饮|奶茶|甜品|蛋糕|烘焙|甜/.test(all)) out.push("甜");
  if (/酸|酸辣|酸菜/.test(all)) out.push("酸辣");
  if (/烧烤|炸鸡|汉堡|披萨|鸭脖/.test(all)) out.push("油腻");
  if (/沙拉|轻食|低卡/.test(all)) out.push("热量低");
  if (out.length === 0) out.push("咸鲜");
  return Array.from(new Set(out));
}

function inferScenes(category: string): string[] {
  if (/茶饮|咖啡|甜品|烘焙/.test(category)) return ["下午茶"];
  if (/火锅|烧烤/.test(category)) return ["朋友聚会", "家庭聚餐"];
  if (/卤味/.test(category)) return ["朋友聚会", "深夜"];
  if (/中式正餐/.test(category)) return ["家庭聚餐"];
  if (/麻辣烫|粉面|快餐|轻食|小吃/.test(category)) return ["一人食", "工作餐"];
  return ["一人食", "工作餐"];
}

function inferSpread(coverage: string = ""): "全国" | "一二线" | "高线" {
  if (/全国/.test(coverage)) return "全国";
  if (/一二线|大型|连锁/.test(coverage)) return "一二线";
  if (/区域|地方|主要在|限于|本地|当地/.test(coverage)) return "高线";
  return "全国";
}

function inferPeople(category: string): { peopleMin: number; peopleMax: number } {
  if (/火锅|烧烤|中式正餐|披萨/.test(category)) return { peopleMin: 2, peopleMax: 6 };
  if (/汉堡|炸鸡|快餐|粉面|轻食/.test(category)) return { peopleMin: 1, peopleMax: 3 };
  return { peopleMin: 1, peopleMax: 4 };
}

function escapeStr(s: string): string {
  return (s || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ---------- generate takeout ----------

interface RawBrand {
  brand_name: string;
  category: string;
  cuisine_or_type: string;
  common_menu_keywords: string[];
  price_band: string;
  audience: string;
  calories_hint: string;
  coverage_note: string;
  source_url_or_source_name: string;
  confidence: string;
  tier: "A" | "B" | "C";
}

const takeoutData = JSON.parse(readFileSync(TAKEOUT_JSON, "utf-8"));
const raw: RawBrand[] = takeoutData.brands;

const seenIds = new Set<string>();
function uniqueId(base: string, fallback: string): string {
  let id = slugify(base, fallback);
  let i = 2;
  let candidate = id;
  while (seenIds.has(candidate)) {
    candidate = `${id}-${i++}`;
  }
  seenIds.add(candidate);
  return candidate;
}

const realBrands = raw.filter((b) => b.tier === "A" || b.tier === "B");
const fallbackTpls = raw.filter((b) => b.tier === "C");

function buildBrandObj(b: RawBrand, idx: number): string {
  const id = uniqueId(b.brand_name, `brand-${idx}`);
  const cat = mapCategory(b.category);
  const grad = gradFor(b.category);
  const emoji = emojiFor(b.category);
  const { budgetMin, budgetMax } = mapPriceBand(b.price_band);
  const { peopleMin, peopleMax } = inferPeople(b.category);
  const tastes = inferTastes(b.category, b.common_menu_keywords);
  const scenes = inferScenes(b.category);
  const spread = inferSpread(b.coverage_note);
  const intro = `${b.cuisine_or_type || b.category}。${(b.coverage_note || "").slice(0, 60)}`;
  const picks = (b.common_menu_keywords || []).slice(0, 4).map((k) =>
    `{ name: "${escapeStr(k)}" }`,
  ).join(", ");
  const couponHint = "美团 / 饿了么常驻满减；新人首单立减；周一/周四品牌日叠券更稳。";
  const calorieHint = b.calories_hint || "套餐 600-900 kcal";
  const tier = b.tier;
  return `  {
    id: "${id}",
    name: "${escapeStr(b.brand_name)}",
    emoji: "${emoji}",
    gradient: ["${grad[0]}", "${grad[1]}"],
    category: "${cat}",
    budgetMin: ${budgetMin}, budgetMax: ${budgetMax},
    peopleMin: ${peopleMin}, peopleMax: ${peopleMax},
    tastes: [${tastes.map((t) => `"${t}"`).join(", ")}],
    intro: "${escapeStr(intro)}",
    picks: [${picks || "{ name: \"招牌菜\" }"}],
    couponHint: "${escapeStr(couponHint)}",
    calorieHint: "${escapeStr(calorieHint)}",
    citySpread: "${spread}",
    scenes: [${scenes.map((s) => `"${s}"`).join(", ")}],
    realTier: "${tier}",
    sourceNote: "${escapeStr(b.source_url_or_source_name || "").slice(0, 80)}",
  }`;
}

const brandObjs = realBrands.map((b, i) => buildBrandObj(b, i)).join(",\n");
const fallbackObjs = fallbackTpls.map((b, i) => {
  // C 模板：剥掉「【品类模板】」前缀，作为「品类餐厅」呈现
  const cleanName = b.brand_name.replace(/^【品类模板】/, "").trim();
  const id = uniqueId(`tpl-${cleanName}`, `tpl-${i}`);
  const cat = mapCategory(b.category);
  const grad = gradFor(b.category);
  const emoji = emojiFor(b.category);
  const { budgetMin, budgetMax } = mapPriceBand(b.price_band);
  const { peopleMin, peopleMax } = inferPeople(b.category);
  const tastes = inferTastes(b.category, b.common_menu_keywords);
  const scenes = inferScenes(b.category);
  const intro = `品类餐厅（非具体品牌）：${b.cuisine_or_type}。`;
  const picks = (b.common_menu_keywords || []).slice(0, 3).map((k) =>
    `{ name: "${escapeStr(k)}" }`,
  ).join(", ");
  return `  {
    id: "${id}",
    name: "${escapeStr(cleanName)}（品类）",
    emoji: "${emoji}",
    gradient: ["${grad[0]}", "${grad[1]}"],
    category: "${cat}",
    budgetMin: ${budgetMin}, budgetMax: ${budgetMax},
    peopleMin: ${peopleMin}, peopleMax: ${peopleMax},
    tastes: [${tastes.map((t) => `"${t}"`).join(", ")}],
    intro: "${escapeStr(intro)}",
    picks: [${picks || "{ name: \"招牌\" }"}],
    couponHint: "品类参考，建议在外卖 App 内搜索具体品牌或就近门店。",
    calorieHint: "${escapeStr(b.calories_hint || "")}",
    citySpread: "全国",
    scenes: [${scenes.map((s) => `"${s}"`).join(", ")}],
    realTier: "C",
    sourceNote: "C 品类模板，仅作品类备选展示，非真实品牌。",
  }`;
}).join(",\n");

const takeoutHeader = `// 由 script/import-real-data.ts 从 real_takeout_brands_research.json 自动生成。
// 不要手工修改 — 修改源 JSON 后重新运行脚本。
// 数据池：A 高置信全国连锁 + B 区域真实品牌（共 ${realBrands.length} 条），全部为可在公开榜单 / 媒体核验的真实品牌。
// 所有「南方轻食联盟」之类查不到的虚构名都已清出。

import type { TakeoutBrand } from "./takeoutBrands.types";

export const REAL_TAKEOUT_BRANDS: TakeoutBrand[] = [
${brandObjs}
];
`;

const takeoutFallbackHeader = `// 由 script/import-real-data.ts 从 real_takeout_brands_research.json (tier=C) 自动生成。
// 这里是「品类模板」— 不是真实品牌，仅作品类备选展示，名称带「（品类）」后缀。
// 不会进入 pickTakeout 的主推荐池。

import type { TakeoutBrand } from "./takeoutBrands.types";

export const TAKEOUT_CATEGORY_FALLBACK: TakeoutBrand[] = [
${fallbackObjs}
];
`;

writeFileSync(resolve(ROOT, "client/src/data/takeoutBrands.generated.ts"), takeoutHeader);
writeFileSync(resolve(ROOT, "client/src/data/takeoutCategoryFallback.generated.ts"), takeoutFallbackHeader);
console.log(`✓ takeoutBrands.generated.ts: ${realBrands.length} 条真实品牌 (A+B)`);
console.log(`✓ takeoutCategoryFallback.generated.ts: ${fallbackTpls.length} 条品类模板 (C)`);

// ---------- generate snacks ----------

interface RawSnack {
  id: string;
  item_name: string;
  brand_name: string;
  category: string;
  common_spec: string;
  calories_hint: string;
  sugar_fat_protein_hint: string;
  audience_tags: string[];
  caution: string;
  search_keywords: string[];
  source_or_basis: string;
  confidence: string;
}

const snacksData = JSON.parse(readFileSync(SNACKS_JSON, "utf-8"));
const rawSnacks: RawSnack[] = snacksData.items;

function snackEmojiFor(cat: string): string {
  if (/碳酸|可乐|汽水/.test(cat)) return "🥤";
  if (/果汁|果味/.test(cat)) return "🧃";
  if (/茶|无糖/.test(cat)) return "🍵";
  if (/咖啡/.test(cat)) return "☕";
  if (/水/.test(cat)) return "💧";
  if (/酸奶|乳品|牛奶/.test(cat)) return "🥛";
  if (/薯片|膨化/.test(cat)) return "🥔";
  if (/饼干|曲奇/.test(cat)) return "🍪";
  if (/面包|糕点|蛋糕/.test(cat)) return "🍞";
  if (/巧克力/.test(cat)) return "🍫";
  if (/糖果|糖/.test(cat)) return "🍬";
  if (/坚果/.test(cat)) return "🥜";
  if (/肉|脯|干/.test(cat)) return "🥩";
  if (/海/.test(cat)) return "🦑";
  if (/雪糕|冰/.test(cat)) return "🍦";
  if (/果干|蜜饯/.test(cat)) return "🍇";
  if (/速食|泡|冲泡|方便/.test(cat)) return "🍜";
  if (/蛋白棒|蛋白/.test(cat)) return "🍫";
  return "🍪";
}

function mapSnackCategory(cat: string): string {
  // 现有 SnackCategory 列表
  // v4 修正：把「巧克力 / 蛋白棒 / 饼干 / 冰淇淋」这些更具体的判别放在「乳品」之前，
  // 否则「巧克力糖果-牛奶巧克力」「冰淇淋雪糕-脆皮巧克力」会被先判为「酸奶乳品」。
  if (/碳酸|可乐|汽水|果汁|功能性|能量|乳酸/.test(cat)) return "饮料";
  if (/茶|水|零卡|无糖/.test(cat)) return "无糖饮料";
  if (/咖啡/.test(cat)) return "速食冲泡";
  if (/雪糕|冰淇淋|冰品/.test(cat)) return "冰品冰淇淋";
  if (/蛋白棒|蛋白零食|代餐/.test(cat)) return "蛋白零食";
  if (/巧克力/.test(cat)) return "巧克力糖果";
  if (/糖果|软糖|硬糖|口香糖|奶糖|薄荷糖/.test(cat)) return "巧克力糖果";
  if (/饼干|曲奇/.test(cat)) return "饼干曲奇";
  if (/面包|糕点|蛋糕|月饼|蛋挞/.test(cat)) return "面包糕点";
  if (/牛奶|酸奶|乳品|奶酪/.test(cat)) return "酸奶乳品";
  if (/薯片|膨化|爆米花/.test(cat)) return "薯片膨化";
  if (/坚果/.test(cat)) return "坚果";
  if (/肉|脯|干|海味/.test(cat)) return "肉脯肉干";
  if (/果干|蜜饯/.test(cat)) return "果干蜜饯";
  if (/方便|速食|泡面|自热|冲泡/.test(cat)) return "速食冲泡";
  return "速食冲泡";
}

function parseCalories(hint: string): number {
  if (!hint) return 100;
  // 提取所有 「数字 + kcal」
  const m = hint.match(/(\d+)\s*kcal/i);
  if (m) return parseInt(m[1], 10);
  const n = hint.match(/约\s*(\d+)/);
  if (n) return parseInt(n[1], 10);
  return 100;
}

function parseNutr(hint: string): { sugar?: number; fat?: number; protein?: number } {
  if (!hint) return {};
  const out: { sugar?: number; fat?: number; protein?: number } = {};
  const sm = hint.match(/糖\s*(\d+(?:\.\d+)?)/);
  if (sm) out.sugar = parseFloat(sm[1]);
  const fm = hint.match(/脂肪?\s*(\d+(?:\.\d+)?)/);
  if (fm) out.fat = parseFloat(fm[1]);
  const pm = hint.match(/蛋白质?\s*(\d+(?:\.\d+)?)/);
  if (pm) out.protein = parseFloat(pm[1]);
  return out;
}

function priceForCategory(cat: string): string {
  if (/碳酸|可乐/.test(cat)) return "约 3 元";
  if (/茶|水/.test(cat)) return "约 5 元";
  if (/咖啡/.test(cat)) return "约 10 元";
  if (/酸奶|乳品|牛奶/.test(cat)) return "约 6 元";
  if (/薯片|膨化/.test(cat)) return "约 7 元";
  if (/坚果/.test(cat)) return "约 12 元";
  if (/巧克力/.test(cat)) return "约 8 元";
  if (/雪糕|冰/.test(cat)) return "约 8 元";
  if (/速食|方便|自热/.test(cat)) return "约 10 元";
  if (/肉|脯|干/.test(cat)) return "约 15 元";
  if (/蛋白棒|蛋白/.test(cat)) return "约 12 元";
  if (/月饼|糕点/.test(cat)) return "约 8 元";
  return "约 8 元";
}

function mapAudiences(tags: string[]): string[] {
  // SnackAudience: 减脂/控糖/增肌/儿童/长辈/深夜/学生党/通勤/解压/朋友聚会
  const valid = new Set(["减脂", "控糖", "增肌", "儿童", "长辈", "深夜", "学生党", "通勤", "解压", "朋友聚会"]);
  const out = (tags || []).filter((t) => valid.has(t));
  if (out.length === 0) out.push("学生党");
  return out;
}

const snackSeenIds = new Set<string>();
function uniqueSnackId(base: string): string {
  let id = base;
  let i = 2;
  while (snackSeenIds.has(id)) id = `${base}-${i++}`;
  snackSeenIds.add(id);
  return id;
}

const snackObjs = rawSnacks.map((s, i) => {
  const id = uniqueSnackId(s.id?.toLowerCase() || `snack-${i}`);
  const cat = mapSnackCategory(s.category);
  const emoji = snackEmojiFor(s.category);
  const calories = parseCalories(s.calories_hint);
  const nutr = parseNutr(s.sugar_fat_protein_hint);
  const audiences = mapAudiences(s.audience_tags);
  const price = priceForCategory(s.category);
  const reason = `${s.brand_name}${s.common_spec ? " · " + s.common_spec : ""}`;
  return `  { id: "${id}", name: "${escapeStr(s.item_name)}", emoji: "${emoji}", category: "${cat}", calories: ${calories}${nutr.sugar !== undefined ? ", sugar: " + nutr.sugar : ""}${nutr.fat !== undefined ? ", fat: " + nutr.fat : ""}${nutr.protein !== undefined ? ", protein: " + nutr.protein : ""}, price: "${price}", audiences: [${audiences.map((a) => `"${a}"`).join(", ")}], reason: "${escapeStr(reason)}"${s.caution ? ", caution: \"" + escapeStr(s.caution) + "\"" : ""}, brand: "${escapeStr(s.brand_name)}", searchKeywords: [${(s.search_keywords || []).slice(0, 3).map((k) => `"${escapeStr(k)}"`).join(", ")}], confidence: "${s.confidence}" }`;
}).join(",\n");

const snacksHeader = `// 由 script/import-real-data.ts 从 real_snacks_research.json 自动生成。
// 不要手工修改 — 修改源 JSON 后重新运行脚本。
// ${rawSnacks.length} 条真实超市/便利店/线上可买的零食饮料商品（含品牌、规格、热量、营养与受众标签）。

import type { Snack } from "./snacks.types";

export const REAL_SNACKS: Snack[] = [
${snackObjs}
];
`;

writeFileSync(resolve(ROOT, "client/src/data/snacks.generated.ts"), snacksHeader);
console.log(`✓ snacks.generated.ts: ${rawSnacks.length} 条真实零食/饮料`);

console.log("\n=== 完成。下一步：在 takeoutBrands.ts / snacks.ts 中导入并替换主推荐池。 ===");
