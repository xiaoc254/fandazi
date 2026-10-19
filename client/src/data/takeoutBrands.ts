// 外卖品牌库：305 条真实品牌（A+B 高置信连锁/区域品牌）+ 推荐菜单 + 适合预算 / 人数 / 口味 / 热量。
// 数据由 script/import-real-data.ts 从 real_takeout_brands_research.json 自动生成；
// 不抓取任何商户 / 平台 API；图片用首字 + emoji + 类目渐变 fallback，避免商标硬链。
//
// 主推荐池 = REAL_TAKEOUT_BRANDS（A+B 真实品牌）。
// 品类模板（C 层）单独存放在 takeoutCategoryFallback.generated.ts，仅作品类备选展示，
// 名称带「（品类）」后缀，且不会进入 pickTakeout 的主推荐结果。

import { REAL_TAKEOUT_BRANDS } from "./takeoutBrands.generated";
import { TAKEOUT_CATEGORY_FALLBACK } from "./takeoutCategoryFallback.generated";
import type {
  TakeoutBrand,
  TakeoutCategory,
  TakeoutTaste,
} from "./takeoutBrands.types";
import {
  matchCoverageForPlace,
  resolveTakeoutPlace,
  type CoverageMatch,
} from "../lib/takeoutCoverage";

export type { TakeoutBrand, TakeoutCategory, TakeoutTaste } from "./takeoutBrands.types";

/** 主推荐池：305 条真实 A/B 品牌。 */
export const TAKEOUT_BRANDS: TakeoutBrand[] = REAL_TAKEOUT_BRANDS;

/** 品类模板（C 层）：仅作品类备选展示，不进入 pickTakeout 主推荐。 */
export const TAKEOUT_CATEGORY_TEMPLATES: TakeoutBrand[] = TAKEOUT_CATEGORY_FALLBACK;

export const TAKEOUT_CATEGORIES: TakeoutCategory[] = [
  "汉堡炸鸡", "中式快餐", "披萨意面", "粉面", "饭团便当",
  "烤肉烧烤", "饺子小笼", "茶饮咖啡", "奶茶饮品", "小吃零嘴",
  "火锅麻辣烫", "粥早餐", "甜品下午茶", "海鲜日料", "健康轻食", "面包烘焙",
];

export interface TakeoutPickInput {
  city?: string;
  /** 省份 / 直辖市；省略时会从 city 反推。两者都给时以 city 为准定位、province 兜底。 */
  province?: string;
  budget: number;
  people: number;
  tastes: TakeoutTaste[];
  slot?: "breakfast" | "lunch" | "dinner" | "midnight";
  lowCalorie?: boolean;
  /** v4: 用户在 chip / 搜索框点名置顶的真实品牌 id（必须出现在主推荐池）。 */
  pinnedBrandId?: string;
  /** v4: 关键词模糊搜索（按 name / picks 匹配）。 */
  searchQuery?: string;
  /** v11: 调用方用 seed 驱动确定性轮换 — 同一筛选条件下每次 seed 变化都应换主推。 */
  seed?: number;
  /** v11: 最近几次刷出过的品牌 id；这些会被惩罚分以避免连续两次刷到同一家。 */
  recentBrandIds?: string[];
}

export interface TakeoutPickResult {
  special: TakeoutBrand;
  alternatives: TakeoutBrand[];
  decisionLine: string;
  perPerson: number;
  /** v4: 命中 pinned 但预算不匹配时的友好提示（不隐藏品牌）。 */
  budgetWarn?: string;
  /**
   * 地区覆盖判定，key = brand.id。仅包含本次 special + alternatives。
   * 未选城市（或选「其他」）时为空对象 —— 此时不做地区分层。
   */
  coverageById: Record<string, CoverageMatch>;
}

/** v4: 「热门真实品牌」chips —— 用户点名要求一定要可发现的连锁。
 *  数据顺序 = chip 显示顺序；name 必须能在 TAKEOUT_BRANDS 中按 includes 命中。 */
export const HOT_TAKEOUT_BRANDS: { label: string; matchName: string }[] = [
  { label: "肯德基", matchName: "肯德基" },
  { label: "麦当劳", matchName: "麦当劳" },
  { label: "达美乐", matchName: "达美乐" },
  { label: "牛约堡", matchName: "牛约堡" },
  { label: "正新鸡排", matchName: "正新鸡排" },
  { label: "德克士", matchName: "德克士" },
  { label: "华莱士", matchName: "华莱士" },
  { label: "塔斯汀", matchName: "塔斯汀" },
  { label: "必胜客", matchName: "必胜客" },
  { label: "老乡鸡", matchName: "老乡鸡" },
  { label: "乡村基", matchName: "乡村基" },
  { label: "大米先生", matchName: "大米先生" },
  { label: "茶百道", matchName: "茶百道" },
  { label: "霸王茶姬", matchName: "霸王茶姬" },
  { label: "瑞幸", matchName: "瑞幸" },
];

/** v4: 按精确名命中或前缀命中找到一个真实品牌（用于 chip 点击 / search 提交）。 */
export function findBrandByQuery(q: string): TakeoutBrand | undefined {
  const trimmed = (q || "").trim();
  if (!trimmed) return undefined;
  const exact = TAKEOUT_BRANDS.find((b) => b.name === trimmed);
  if (exact) return exact;
  const startsWith = TAKEOUT_BRANDS.find((b) => b.name.startsWith(trimmed));
  if (startsWith) return startsWith;
  const contains = TAKEOUT_BRANDS.find(
    (b) => b.name.includes(trimmed) || (b.picks || []).some((p) => p.name.includes(trimmed)),
  );
  return contains;
}

/** v4: 用 query 过滤出全部命中的品牌列表（最多 8 条）。 */
export function searchBrands(q: string, limit = 8): TakeoutBrand[] {
  const trimmed = (q || "").trim();
  if (!trimmed) return [];
  const hits: TakeoutBrand[] = [];
  for (const b of TAKEOUT_BRANDS) {
    if (
      b.name.includes(trimmed) ||
      (b.picks || []).some((p) => p.name.includes(trimmed)) ||
      b.intro.includes(trimmed)
    ) {
      hits.push(b);
      if (hits.length >= limit) break;
    }
  }
  return hits;
}

const SLOT_BIAS: Record<NonNullable<TakeoutPickInput["slot"]>, TakeoutCategory[]> = {
  breakfast: ["粥早餐", "面包烘焙", "茶饮咖啡"],
  lunch: ["中式快餐", "粉面", "汉堡炸鸡", "饺子小笼", "健康轻食"],
  dinner: ["火锅麻辣烫", "披萨意面", "中式快餐", "烤肉烧烤", "海鲜日料"],
  midnight: ["小吃零嘴", "汉堡炸鸡", "粉面"],
};

// v7: 品类平衡 — 区分「饮品/下午茶」与「正餐/小吃」。除非用户明确选择了下午茶/早餐场景，
// 候选不能让饮品（茶饮咖啡 / 奶茶饮品 / 甜品下午茶）刷屏。
const DRINK_CATEGORIES: TakeoutCategory[] = ["茶饮咖啡", "奶茶饮品", "甜品下午茶"];
const MAIN_MEAL_CATEGORIES: TakeoutCategory[] = [
  "中式快餐", "粉面", "汉堡炸鸡", "饭团便当", "饺子小笼",
  "披萨意面", "火锅麻辣烫", "烤肉烧烤", "健康轻食", "海鲜日料", "粥早餐",
];

function isDrinkBrand(b: TakeoutBrand): boolean {
  return DRINK_CATEGORIES.includes(b.category);
}
function isMainMealBrand(b: TakeoutBrand): boolean {
  return MAIN_MEAL_CATEGORIES.includes(b.category);
}

// v7: alternatives 平衡器：饮品最多 maxDrinks 个；至少 minMains 个正餐；同一 category 不超过 maxPerCat。
// 当候选不够时，从 fallbackPool（按分数排序）补齐。
function balanceAlternatives(
  initial: TakeoutBrand[],
  fallbackPool: TakeoutBrand[],
  special: TakeoutBrand,
  drinkAllowed: boolean,
  size = 4,
): TakeoutBrand[] {
  const maxDrinks = drinkAllowed ? 2 : 1;
  const minMains = drinkAllowed ? 1 : 2;
  const maxPerCat = 2;

  const out: TakeoutBrand[] = [];
  const seen = new Set<string>([special.id]);
  const catCount: Record<string, number> = {};
  let drinkCount = 0;

  function tryAdd(b: TakeoutBrand): boolean {
    if (seen.has(b.id)) return false;
    if ((catCount[b.category] ?? 0) >= maxPerCat) return false;
    if (isDrinkBrand(b) && drinkCount >= maxDrinks) return false;
    out.push(b);
    seen.add(b.id);
    catCount[b.category] = (catCount[b.category] ?? 0) + 1;
    if (isDrinkBrand(b)) drinkCount++;
    return true;
  }

  // 1) 先按原顺序加入
  for (const b of initial) {
    if (out.length >= size) break;
    tryAdd(b);
  }
  // 2) 若正餐不够，从 fallbackPool 主餐补齐
  if (out.filter(isMainMealBrand).length < minMains) {
    for (const b of fallbackPool) {
      if (out.length >= size) break;
      if (out.filter(isMainMealBrand).length >= minMains) break;
      if (!isMainMealBrand(b)) continue;
      tryAdd(b);
    }
  }
  // 3) 若数量不够，再从 fallbackPool 补齐
  for (const b of fallbackPool) {
    if (out.length >= size) break;
    tryAdd(b);
  }
  // 4) 兜底：如果还是不足（极小池），允许同 category 第三个
  for (const b of fallbackPool) {
    if (out.length >= size) break;
    if (seen.has(b.id)) continue;
    out.push(b);
    seen.add(b.id);
  }
  return out.slice(0, size);
}

export function pickTakeout(input: TakeoutPickInput): TakeoutPickResult {
  const perPerson = Math.max(8, Math.round(input.budget / Math.max(1, input.people)));
  const slotCats = input.slot ? SLOT_BIAS[input.slot] : [];
  const recent = new Set(input.recentBrandIds ?? []);
  const hasSeed = typeof input.seed === "number";
  // 确定性 seed → [0,1) 抖动；不同 brand id 哈希 + seed 让顺序整体重排。
  function seedJitter(brandId: string, salt: number): number {
    if (!hasSeed) return Math.random();
    let h = 2166136261 ^ salt;
    for (let i = 0; i < brandId.length; i++) {
      h = Math.imul(h ^ brandId.charCodeAt(i), 16777619);
    }
    h ^= (input.seed ?? 0) * 2654435761;
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return ((h >>> 0) % 100000) / 100000;
  }

  // v12: 地区定位 —— 只解析一次，避免 300+ 品牌各自重复遍历省份表。
  const place = resolveTakeoutPlace(input.city, input.province);
  const hasPlace = !!(place.city || place.province);
  const covCache = new Map<string, CoverageMatch>();

  // 主推荐池：仅 A+B 真实品牌；C 模板永不进入主推荐。
  const scored = TAKEOUT_BRANDS.map((b) => {
    let score = 0;
    if (perPerson >= b.budgetMin && perPerson <= b.budgetMax) score += 30;
    else if (perPerson >= b.budgetMin * 0.85 && perPerson <= b.budgetMax * 1.15) score += 18;
    else score += Math.max(0, 10 - Math.abs(perPerson - (b.budgetMin + b.budgetMax) / 2) / 4);
    if (input.people >= b.peopleMin && input.people <= b.peopleMax) score += 18;
    const tasteHits = input.tastes.filter((t) => b.tastes.includes(t)).length;
    score += tasteHits * 8;
    if (slotCats.includes(b.category)) score += 12;
    if (input.lowCalorie) {
      if (b.tastes.includes("油腻")) score -= 10;
      if (b.tastes.includes("热量低") || b.category === "健康轻食" || b.category === "粥早餐") score += 14;
    }
    if (hasPlace) {
      // v12: 「本城能不能点到」是外卖的第一性问题，权重高于口味/时段等偏好。
      // 覆盖分区间：local +34 / province +22 / region +14 / tier +10 / national +8 / rare -26。
      const cover = matchCoverageForPlace(b, place);
      covCache.set(b.id, cover);
      score += cover.score;
    } else if (b.citySpread === "全国") {
      // 未选城市时保留原有的全国连锁轻微加权。
      score += 4;
    }
    // A 层加权（高置信全国连锁优先）
    if (b.realTier === "A") score += 6;
    // v11: seed 驱动的抖动 — 比之前的 Math.random()*6 更大，确保不同 seed 能撼动顶部。
    score += seedJitter(b.id, 1) * 14;
    // v11: 最近刷出过的品牌惩罚分（避免连续两次刷到同一家），刚刷过的扣最多。
    if (recent.has(b.id)) score -= 22;
    return { brand: b, score };
  }).sort((a, b) => b.score - a.score);

  // v12: 地区可用性分层 —— 把「本城可点」的品牌整体提到「外地连锁 / 本地少见」之前。
  // 只做软分层，不硬过滤：小城市品牌池稀疏时仍必须出得来结果。
  let ranked = scored;
  if (hasPlace) {
    const reachable = scored.filter((s) => {
      const m = covCache.get(s.brand.id);
      return !m || (m.available && m.level !== "rare");
    });
    if (reachable.length >= 5) {
      const reachableIds = new Set(reachable.map((s) => s.brand.id));
      ranked = [...reachable, ...scored.filter((s) => !reachableIds.has(s.brand.id))];
    }
  }

  // v7: 品类平衡 — 除非时段是「早餐」/「下午茶」或用户明显在挑饮品，否则正餐优先。
  // - 用户没勾「热量低」+ 没勾任何饮品口味 + 时段是 lunch/dinner/midnight → 强制正餐为 special。
  // - alternatives：饮品最多 1 个；保证至少 2 个正餐/主食。
  const drinkSlot = input.slot === "breakfast"; // 早餐允许多茶饮咖啡
  const explicitlyDrink =
    input.tastes.includes("甜") && input.tastes.length === 1 && (input.slot === undefined || input.slot === "breakfast");
  const allowDrinkSpecial = drinkSlot || explicitlyDrink || !!input.pinnedBrandId || !!input.searchQuery;

  if (!allowDrinkSpecial) {
    const topMain = ranked.find((s) => isMainMealBrand(s.brand));
    if (topMain && isDrinkBrand(ranked[0].brand)) {
      // 把第一个非饮品提到前面
      const idx = ranked.indexOf(topMain);
      if (idx > 0) {
        ranked.splice(idx, 1);
        ranked.unshift(topMain);
      }
    }
  }

  // v11: 顶部多样性 — 当调用方传 seed 时，从分数最高的若干个候选里轮换 special，
  // 避免「健康轻食 lunch + 高预算」这类筛选条件下分数差距大让单一品牌长期霸榜。
  // 轮换池：在分数最高的 12 名内，剔除掉与 #1 相同 category 的并列候选不超过 3 个，
  // 同时尊重正餐/饮品平衡（不允许在 !allowDrinkSpecial 下从饮品选）。
  if (hasSeed && ranked.length > 1) {
    const TOP = Math.min(12, ranked.length);
    const pool: TakeoutBrand[] = [];
    const catCount: Record<string, number> = {};
    for (let i = 0; i < TOP; i++) {
      const b = ranked[i].brand;
      if (!allowDrinkSpecial && isDrinkBrand(b)) continue;
      // v12: 轮换池同样排除本城点不到的品牌，避免「换一批」换出外地连锁。
      const cover = covCache.get(b.id);
      if (cover && (!cover.available || cover.level === "rare")) continue;
      const cat = b.category;
      if ((catCount[cat] ?? 0) >= 3) continue;
      pool.push(b);
      catCount[cat] = (catCount[cat] ?? 0) + 1;
    }
    if (pool.length >= 2) {
      // 用 seed 决定从前 min(pool.length, 8) 中挑哪一个；权重略偏向高分（前几个被选概率高）。
      const k = Math.min(pool.length, 8);
      const j = Math.floor(seedJitter("__rot__", 7) * k);
      const chosen = pool[j] ?? pool[0];
      // 把 chosen 提到 ranked 顶部
      const idx = ranked.findIndex((s) => s.brand.id === chosen.id);
      if (idx > 0) {
        const [hit] = ranked.splice(idx, 1);
        ranked.unshift(hit);
      }
    }
  }

  // v4: pinnedBrandId 强制置顶 — 即便预算不符，也用品牌作为 special，并给出预算提示。
  let special = ranked[0].brand;
  let alternatives = ranked.slice(1, 5).map((s) => s.brand);
  let budgetWarn: string | undefined;
  if (input.pinnedBrandId) {
    const pinned = TAKEOUT_BRANDS.find((b) => b.id === input.pinnedBrandId);
    if (pinned) {
      const inBudget = perPerson >= pinned.budgetMin && perPerson <= pinned.budgetMax;
      if (!inBudget) {
        if (perPerson < pinned.budgetMin) {
          budgetWarn = `${pinned.name} 人均 ¥${pinned.budgetMin}-${pinned.budgetMax}，可能超出当前 ¥${perPerson} 预算 · 建议加预算或拼单`;
        } else {
          budgetWarn = `${pinned.name} 客单价低于当前预算 ¥${perPerson}，可能更适合多人共享或加菜`;
        }
      }
      special = pinned;
      // alternatives: 去重后从 ranked 取 4 个
      alternatives = ranked.filter((s) => s.brand.id !== pinned.id).slice(0, 4).map((s) => s.brand);
    }
  } else if (input.searchQuery) {
    const hits = searchBrands(input.searchQuery, 6);
    if (hits.length > 0) {
      special = hits[0];
      const fillerScore = ranked.filter((s) => s.brand.id !== hits[0].id).map((s) => s.brand);
      const rest = [...hits.slice(1), ...fillerScore].slice(0, 4);
      const seen = new Set<string>([special.id]);
      alternatives = [];
      for (const b of rest) {
        if (seen.has(b.id)) continue;
        seen.add(b.id);
        alternatives.push(b);
        if (alternatives.length >= 4) break;
      }
      const inBudget = perPerson >= special.budgetMin && perPerson <= special.budgetMax;
      if (!inBudget) {
        budgetWarn = perPerson < special.budgetMin
          ? `${special.name} 人均 ¥${special.budgetMin}-${special.budgetMax}，可能超出当前 ¥${perPerson} 预算 · 建议加预算或拼单`
          : `${special.name} 客单价低于当前预算 ¥${perPerson}，可能更适合多人共享或加菜`;
      }
    }
  }

  // v7: 候选去刷屏 — 饮品最多 1 个；至少 2 个正餐/主食；保留多样化品类。
  alternatives = balanceAlternatives(alternatives, ranked.map((s) => s.brand), special, allowDrinkSpecial);

  // v12: 只回传本次结果涉及的覆盖判定，避免每次都复制 300+ 条对象。
  const coverageById: Record<string, CoverageMatch> = {};
  if (hasPlace) {
    for (const b of [special, ...alternatives]) {
      const cover = covCache.get(b.id);
      if (cover) coverageById[b.id] = cover;
    }
  }

  const specialCoverage = coverageById[special.id];
  const decisionLine = (() => {
    const parts: string[] = [];
    if (input.pinnedBrandId || input.searchQuery) parts.push("已置顶你点名的品牌");
    if (input.lowCalorie) parts.push("减脂友好优先");
    if (input.tastes.length > 0) parts.push(`偏好「${input.tastes.join("·")}」`);
    if (input.slot === "breakfast") parts.push("早餐场景");
    if (input.slot === "midnight") parts.push("深夜");
    if (parts.length === 0) parts.push(`人均 ${perPerson} 元 · ${input.people} 人`);
    // 地区标签放最后：不能挤掉上面的「人均」兜底说明
    if (specialCoverage) parts.push(specialCoverage.label);
    return `今天替你决定：${special.name} — ${parts.join(" / ")}`;
  })();

  return { special, alternatives, decisionLine, perPerson, budgetWarn, coverageById };
}
