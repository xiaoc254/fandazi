// 家庭一周菜单 + 预算买菜清单核心算法。
// 输入：家庭人数（成人/孩子/长辈）、月/周预算、外卖次数、目标、忌口。
// 输出：7 天菜单（午+晚），频次统计，每日 / 每周估价，分组买菜清单。
//
// 设计：
//  - 用 RECIPES 已有数据；自带 contains/cuisine/timeMinutes/serves。
//  - 每天结构 = 蛋白主菜 + 蔬菜 + 主食/汤/小菜（避免全凉菜/全汤）。
//  - 频次控制：依据 goal + budget 给出鸡 / 牛 / 鱼虾 / 豆腐蛋 / 外卖 7 天目标。
//  - 估价：人均一餐价，按食材类目粗估。
//  - 买菜清单：按类目去重并合并数量。

import type { Recipe, Restriction } from "@/data/recipes";
import { RECIPES } from "@/data/recipes";

export type FamilyGoal =
  | "省钱"
  | "均衡"
  | "减脂"
  | "增肌"
  | "长辈友好"
  | "儿童友好";

export interface FamilyInput {
  /** 总人数 */
  people: number;
  adults: number;
  kids: number;
  elders: number;
  /** 月预算 */
  monthlyBudget: number;
  /** 周预算（默认 monthly/4，可手调） */
  weeklyBudget: number;
  /** 一周外卖次数（午/晚算一次） */
  takeoutCount: number;
  /** 主目标 */
  goal: FamilyGoal;
  /** 忌口列表 */
  restrictions: Restriction[];
}

export type ProteinKind = "鸡肉" | "牛肉" | "猪肉" | "鱼虾" | "豆腐蛋" | "外卖";

export interface DayMenuSlot {
  /** 角色：main 蛋白主菜 / veggie 蔬菜 / extra 汤或主食或小菜 */
  role: "main" | "veggie" | "extra";
  recipe?: Recipe;
  /** 外卖占位 */
  takeoutHint?: string;
  /** 菜品标签：老人友好 / 儿童友好 */
  flags: string[];
  /** 整桌人均估价（一份） */
  perPersonCost: number;
}

export interface DayMenu {
  day: number; // 1-7
  label: string; // 周一 ...
  /** 中午 / 晚上 */
  meals: { slot: "lunch" | "dinner"; slotLabel: string; dishes: DayMenuSlot[]; cost: number; isTakeout: boolean }[];
  cost: number;
}

export interface ProteinFrequency {
  kind: ProteinKind;
  count: number;
}

export interface ShoppingGroup {
  /** 肉蛋奶 / 蔬菜 / 主食豆制品 / 调味杂项 */
  group: "肉蛋奶" | "蔬菜" | "主食豆制品" | "调味杂项";
  items: {
    name: string;
    qty: string;
    /** 估价（元） */
    cost: number;
    /** 来自哪些菜 */
    fromRecipes: string[];
    /** 替代品建议 */
    alt?: string;
  }[];
  subtotal: number;
}

export interface WeeklyMenuResult {
  days: DayMenu[];
  totalCost: number;
  proteinFreq: ProteinFrequency[];
  /** 每周蔬菜餐次 */
  veggieMeals: number;
  /** 外卖次数 */
  takeoutCount: number;
  /** 与周预算差额（>0 超支） */
  budgetDelta: number;
  /** 降级建议（超预算时显示） */
  downgradeTips: string[];
  shopping: ShoppingGroup[];
  shoppingTotal: number;
  notes: string[];
}

const DEFAULT_INPUT: FamilyInput = {
  people: 3,
  adults: 2,
  kids: 1,
  elders: 0,
  monthlyBudget: 1500,
  weeklyBudget: 380,
  takeoutCount: 2,
  goal: "均衡",
  restrictions: [],
};

export function defaultFamilyInput(): FamilyInput {
  return { ...DEFAULT_INPUT };
}

// === 蛋白频次目标 ===

function targetProteinPlan(goal: FamilyGoal, weeklyBudget: number, takeoutCount: number, kids: number, elders: number) {
  // 14 餐 (7 午 + 7 晚) 中的蛋白主菜分配
  let chicken = 3, beef = 1, pork = 2, fish = 2, tofuEgg = 4;
  if (goal === "省钱") {
    chicken = 2; beef = 0; pork = 2; fish = 1; tofuEgg = 7;
  } else if (goal === "均衡") {
    chicken = 3; beef = 1; pork = 2; fish = 2; tofuEgg = 4;
  } else if (goal === "减脂") {
    chicken = 5; beef = 1; pork = 0; fish = 3; tofuEgg = 3;
  } else if (goal === "增肌") {
    chicken = 4; beef = 3; pork = 1; fish = 2; tofuEgg = 2;
  } else if (goal === "长辈友好") {
    chicken = 3; beef = 1; pork = 2; fish = 3; tofuEgg = 3;
  } else if (goal === "儿童友好") {
    chicken = 4; beef = 1; pork = 2; fish = 2; tofuEgg = 3;
  }
  // 预算调整
  if (weeklyBudget < 250) {
    beef = Math.max(0, beef - 1);
    fish = Math.max(0, fish - 1);
    tofuEgg += 2;
  }
  if (weeklyBudget > 600) {
    fish = Math.min(4, fish + 1);
    beef = Math.min(4, beef + 1);
  }
  // 外卖挤占：每次外卖减 1 个家做主菜
  let total = chicken + beef + pork + fish + tofuEgg;
  let remaining = 14 - takeoutCount;
  // 等比缩放，但保留至少各 1
  while (total > remaining) {
    if (tofuEgg > 1) tofuEgg--;
    else if (chicken > 1) chicken--;
    else if (pork > 1) pork--;
    else if (beef > 0) beef--;
    else if (fish > 0) fish--;
    total = chicken + beef + pork + fish + tofuEgg;
  }
  while (total < remaining) {
    tofuEgg++;
    total = chicken + beef + pork + fish + tofuEgg;
  }
  return { chicken, beef, pork, fish, tofuEgg };
}

// === 食材关键词（用于判定一道菜的蛋白类型） ===
const KW_BEEF = /牛肉|牛腩|牛排|肥牛|牛筋|雪花牛/;
const KW_PORK = /猪|排骨|五花|里脊|肉末|香肠|腊肉|火腿(?!肠)|肉丝|红烧肉|回锅肉|青椒肉丝|梅菜扣肉|糖醋里脊|蒜泥白肉/;
const KW_CHICKEN = /鸡(?!蛋)|鸡丁|鸡腿|鸡翅|鸡胸|宫保鸡|口水鸡|白切鸡|盐焗鸡|香酥鸡|烧鸡/;
const KW_FISH = /鱼|虾|蟹|鱿鱼|带鱼|鲈鱼|鳕鱼|三文鱼|海参|海鲜|墨鱼/;
const KW_TOFU_EGG = /豆腐|豆干|腐竹|百叶|千张|蛋(?!糕|挞)|皮蛋|鸡蛋/;
const KW_COLD = /凉拌|拌(?!饭|面|粉)|沙拉|凉菜|凉面|凉皮|皮蛋豆腐|拍黄瓜|呛|腌/;

function proteinOfRecipe(r: Recipe): ProteinKind | null {
  const blob = r.name + " " + r.ingredients.map((i) => i.name).join(" ");
  if (KW_BEEF.test(blob)) return "牛肉";
  if (KW_FISH.test(blob)) return "鱼虾";
  if (KW_CHICKEN.test(blob)) return "鸡肉";
  if (KW_PORK.test(blob)) return "猪肉";
  if (KW_TOFU_EGG.test(blob)) return "豆腐蛋";
  return null;
}

function isCold(r: Recipe): boolean {
  return KW_COLD.test(r.name);
}

function violatesRestrictions(r: Recipe, restrictions: Restriction[]): boolean {
  return restrictions.some((rs) => r.contains.includes(rs));
}

// 一份菜在桌上分给 N 人吃的成本：基础 + sublinear 食材增量。
// 1 人吃只用 1 份；2-3 人时基本 1 份就够；4+ 人需要稍多食材。
function dishCostForTable(perPersonCost: number, people: number): number {
  // 等价 = perPerson × max(1, people * 0.4)，2 人 ≈ 0.8 份，3 人 ≈ 1.2 份，5 人 ≈ 2 份
  const factor = Math.max(1, people * 0.42);
  return perPersonCost * factor;
}

// === 一道菜的人均估价（一份）===
// 真实参考：1500 元/月 / 30 天 / 3 人 ≈ 16 元/人/天，每餐 ≈ 5-8 元/人。
// 同一桌菜分给 N 人吃，主菜成本主要由蛋白食材主导，调味品按全餐摊薄。
function estPerPersonCost(r: Recipe): number {
  // 蛋白主导食材：取最贵的一项作为基准
  let proteinCost = 0;
  let veggieCost = 0;
  for (const ing of r.ingredients) {
    if (ing.category === "肉蛋豆制品") {
      let p = 2;
      if (KW_BEEF.test(ing.name)) p = 6;
      else if (KW_FISH.test(ing.name)) p = 5;
      else if (KW_CHICKEN.test(ing.name)) p = 4;
      else if (KW_PORK.test(ing.name)) p = 4;
      else if (KW_TOFU_EGG.test(ing.name)) p = 1.5;
      proteinCost = Math.max(proteinCost, p);
    } else if (ing.category === "蔬菜") {
      veggieCost += 0.8;
    }
  }
  // 配菜量 cap 在 3 元，调味摊在 0.5
  veggieCost = Math.min(3, veggieCost);
  let c = proteinCost + veggieCost + 0.5;
  if (r.course === "veggie") c = Math.min(c, 3);
  if (r.course === "soup") c = Math.min(c, 4);
  if (r.course === "staple") c = Math.min(c, 2.5);
  return Math.max(2, Math.min(11, Math.round(c)));
}

// === 选菜辅助 ===
interface PoolItem {
  recipe: Recipe;
  protein: ProteinKind | null;
  cold: boolean;
  cost: number;
}

function buildPool(restrictions: Restriction[]): PoolItem[] {
  const ok = RECIPES.filter((r) => !violatesRestrictions(r, restrictions));
  return ok.map((r) => ({
    recipe: r,
    protein: proteinOfRecipe(r),
    cold: isCold(r),
    cost: estPerPersonCost(r),
  }));
}

// 简单确定性洗牌（基于 seed）
function shuffleBy(seed: number, n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  let s = seed | 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickFirst<T>(arr: T[], pred: (x: T) => boolean, used: Set<string>, getId: (x: T) => string): T | undefined {
  for (const x of arr) {
    if (!used.has(getId(x)) && pred(x)) return x;
  }
  return undefined;
}

const DAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// === 主算法 ===
export function planFamilyWeek(input: FamilyInput, seed = 1): WeeklyMenuResult {
  const target = targetProteinPlan(input.goal, input.weeklyBudget, input.takeoutCount, input.kids, input.elders);
  const pool = buildPool(input.restrictions);

  // 给定预算系数
  const proteinPlan: { kind: ProteinKind; count: number }[] = [
    { kind: "鸡肉", count: target.chicken },
    { kind: "牛肉", count: target.beef },
    { kind: "猪肉", count: target.pork },
    { kind: "鱼虾", count: target.fish },
    { kind: "豆腐蛋", count: target.tofuEgg },
    { kind: "外卖", count: input.takeoutCount },
  ];
  // 期望主菜序列 (14 项)
  const mainSlots: ProteinKind[] = [];
  for (const p of proteinPlan) {
    for (let i = 0; i < p.count; i++) mainSlots.push(p.kind);
  }
  // 不足 14 用豆腐蛋补
  while (mainSlots.length < 14) mainSlots.push("豆腐蛋");
  while (mainSlots.length > 14) mainSlots.pop();
  // 洗牌让分布均匀
  const order = shuffleBy(seed, 14);
  const orderedMains = order.map((i) => mainSlots[i]);

  // 主菜池按 protein 分组并洗牌
  const mainsByProtein: Record<ProteinKind, Recipe[]> = {
    鸡肉: [], 牛肉: [], 猪肉: [], 鱼虾: [], 豆腐蛋: [], 外卖: [],
  };
  for (const p of pool) {
    if (p.recipe.course !== "main") continue;
    if (p.cold) continue; // 主菜避开凉菜
    if (p.protein) mainsByProtein[p.protein].push(p.recipe);
  }
  for (const k of Object.keys(mainsByProtein) as ProteinKind[]) {
    const o = shuffleBy(seed * 7 + k.length, mainsByProtein[k].length);
    mainsByProtein[k] = o.map((i) => mainsByProtein[k][i]);
  }

  // 蔬菜 / 汤 / 主食池
  const veggies = pool.filter((p) => p.recipe.course === "veggie" && !p.cold);
  const veggiesShuffled = shuffleBy(seed * 13, veggies.length).map((i) => veggies[i]);
  const soups = pool.filter((p) => p.recipe.course === "soup");
  const soupsShuffled = shuffleBy(seed * 17, soups.length).map((i) => soups[i]);
  const staples = pool.filter((p) => p.recipe.course === "staple");
  const staplesShuffled = shuffleBy(seed * 19, staples.length).map((i) => staples[i]);

  const usedRecipeIds = new Set<string>();
  const days: DayMenu[] = [];
  const proteinCount: Record<ProteinKind, number> = {
    鸡肉: 0, 牛肉: 0, 猪肉: 0, 鱼虾: 0, 豆腐蛋: 0, 外卖: 0,
  };
  let veggieMealCount = 0;
  const allRecipes: Recipe[] = [];

  let mainIdx = 0;
  for (let d = 0; d < 7; d++) {
    const day: DayMenu = { day: d + 1, label: DAY_LABELS[d], meals: [], cost: 0 };
    for (const slot of ["lunch", "dinner"] as const) {
      const slotLabel = slot === "lunch" ? "中午" : "晚上";
      const proteinKind = orderedMains[mainIdx++];
      const dishes: DayMenuSlot[] = [];
      let mealCost = 0;
      let isTakeout = false;

      if (proteinKind === "外卖") {
        const perPersonTakeout = input.goal === "省钱" ? 18 : input.goal === "减脂" ? 28 : 24;
        dishes.push({
          role: "main",
          takeoutHint: pickTakeoutHint(input.goal, slot),
          flags: [],
          perPersonCost: perPersonTakeout,
        });
        mealCost = perPersonTakeout * input.people;
        proteinCount["外卖"]++;
        isTakeout = true;
      } else {
        // 选主菜
        const candidates = mainsByProtein[proteinKind];
        let chosenMain: Recipe | undefined = candidates.find((r) => !usedRecipeIds.has(r.id));
        if (!chosenMain) {
          // 重置 used 但仅本类
          chosenMain = candidates[0];
        }
        // 如果该 protein 类压根没有菜（极端忌口），降级到豆腐蛋
        if (!chosenMain) {
          chosenMain = mainsByProtein["豆腐蛋"].find((r) => !usedRecipeIds.has(r.id))
            ?? mainsByProtein["豆腐蛋"][0];
        }
        if (chosenMain) {
          usedRecipeIds.add(chosenMain.id);
          allRecipes.push(chosenMain);
          const c = estPerPersonCost(chosenMain);
          dishes.push({
            role: "main",
            recipe: chosenMain,
            flags: friendlyFlags(chosenMain, input),
            perPersonCost: c,
          });
          mealCost += dishCostForTable(c, input.people);
          proteinCount[proteinKind]++;
        }
        // 蔬菜
        const veg = veggiesShuffled.find((p) => !usedRecipeIds.has(p.recipe.id))
          ?? veggiesShuffled[0];
        if (veg) {
          usedRecipeIds.add(veg.recipe.id);
          allRecipes.push(veg.recipe);
          dishes.push({
            role: "veggie",
            recipe: veg.recipe,
            flags: friendlyFlags(veg.recipe, input),
            perPersonCost: veg.cost,
          });
          mealCost += dishCostForTable(veg.cost, input.people);
          veggieMealCount++;
        }
        // 第三道：晚餐倾向汤；午餐倾向主食/小菜
        let extraPick: PoolItem | undefined;
        if (slot === "dinner") {
          extraPick = soupsShuffled.find((p) => !usedRecipeIds.has(p.recipe.id))
            ?? staplesShuffled.find((p) => !usedRecipeIds.has(p.recipe.id))
            ?? soupsShuffled[0]
            ?? staplesShuffled[0];
        } else {
          extraPick = staplesShuffled.find((p) => !usedRecipeIds.has(p.recipe.id))
            ?? soupsShuffled.find((p) => !usedRecipeIds.has(p.recipe.id))
            ?? staplesShuffled[0]
            ?? soupsShuffled[0];
        }
        if (extraPick) {
          usedRecipeIds.add(extraPick.recipe.id);
          allRecipes.push(extraPick.recipe);
          dishes.push({
            role: "extra",
            recipe: extraPick.recipe,
            flags: friendlyFlags(extraPick.recipe, input),
            perPersonCost: extraPick.cost,
          });
          mealCost += dishCostForTable(extraPick.cost, input.people);
        }
      }
      day.meals.push({ slot, slotLabel, dishes, cost: Math.round(mealCost), isTakeout });
      day.cost += Math.round(mealCost);
    }
    days.push(day);
  }

  const totalCost = days.reduce((acc, d) => acc + d.cost, 0);
  const budgetDelta = totalCost - input.weeklyBudget;
  const downgradeTips: string[] = [];
  if (budgetDelta > 50) {
    if (proteinCount["牛肉"] > 0) downgradeTips.push("牛肉减 1 次，换鸡蛋豆腐");
    if (proteinCount["外卖"] > 1) downgradeTips.push("外卖减 1 次，换家做");
    if (proteinCount["鱼虾"] > 1) downgradeTips.push("鱼虾减 1 次，换冷冻鱼柳或鸡蛋");
    downgradeTips.push("用应季蔬菜替代反季蔬菜，每周省 20-40 元");
    downgradeTips.push("买当地菜场而非生鲜电商，每周省 30-60 元");
  } else if (budgetDelta < -120) {
    downgradeTips.push("仍有结余 — 可加一次牛肉或鱼虾改善伙食");
  }

  const proteinFreq: ProteinFrequency[] = (["鸡肉", "牛肉", "猪肉", "鱼虾", "豆腐蛋", "外卖"] as ProteinKind[])
    .map((k) => ({ kind: k, count: proteinCount[k] }));

  const shoppingResult = buildFamilyShoppingList(allRecipes, input.people);

  return {
    days,
    totalCost,
    proteinFreq,
    veggieMeals: veggieMealCount,
    takeoutCount: proteinCount["外卖"],
    budgetDelta,
    downgradeTips,
    shopping: shoppingResult.groups,
    shoppingTotal: shoppingResult.total,
    notes: buildNotes(input, proteinCount, totalCost),
  };
}

function friendlyFlags(r: Recipe, input: FamilyInput): string[] {
  const flags: string[] = [];
  const blob = r.name + " " + r.ingredients.map((i) => i.name).join(" ");
  // 长辈友好：清淡 / 软烂 / 蒸 / 鱼汤
  const elderOk = /蒸|炖|煲|粥|清淡|软|鱼汤|豆腐|青菜/.test(r.name) || r.tastes.includes("清淡");
  const elderBad = /麻辣|重辣|辣子|烤|炸/.test(blob);
  if (input.elders > 0 && elderOk && !elderBad) flags.push("长辈友好");
  // 孩子友好：番茄 / 鸡蛋 / 糖醋 / 不辣
  const kidOk = /番茄|鸡蛋|糖醋|可乐|玉米|肉末|肉丸|蒸蛋/.test(blob);
  const kidBad = /麻辣|重辣|辣子|花椒/.test(blob);
  if (input.kids > 0 && kidOk && !kidBad) flags.push("儿童友好");
  return flags;
}

function pickTakeoutHint(goal: FamilyGoal, slot: "lunch" | "dinner"): string {
  if (goal === "省钱") return slot === "lunch" ? "中式快餐 / 拌粉拌面" : "套餐拼单";
  if (goal === "减脂") return "轻食沙拉 / 蒸菜便当";
  if (goal === "增肌") return "鸡胸轻食 / 牛肉饭";
  if (goal === "长辈友好") return "粥铺 / 清淡菜套餐";
  if (goal === "儿童友好") return "番茄面 / 蒸蛋套餐";
  return slot === "lunch" ? "盖浇饭 / 简餐" : "干净家常套餐";
}

// === 买菜清单 ===
interface ShoppingResultLocal {
  groups: ShoppingGroup[];
  total: number;
}

const GROUP_KEYWORDS = {
  肉蛋奶: /(牛|猪|鸡|鸭|鱼|虾|蟹|肉|排骨|蛋|奶|火腿|腊肠|肝)/,
  蔬菜: /(菜|瓜|笋|豆角|茄子|番茄|西红柿|土豆|萝卜|姜|蒜|葱|椒|菇|耳|莲|藕|韭|蒜苗|香菜|芹|苗|苔)/,
  主食豆制品: /(米|面|饭|粉|粥|馒头|饺|包|豆腐|腐竹|豆干|百叶|千张|豆芽|玉米|薯)/,
};

function categorize(name: string): ShoppingGroup["group"] {
  if (GROUP_KEYWORDS.肉蛋奶.test(name)) return "肉蛋奶";
  if (GROUP_KEYWORDS.主食豆制品.test(name)) return "主食豆制品";
  if (GROUP_KEYWORDS.蔬菜.test(name)) return "蔬菜";
  return "调味杂项";
}

function priceOfIngredient(name: string, group: ShoppingGroup["group"], people: number): number {
  // 一周 14 餐使用，估单价（一周量）
  if (group === "肉蛋奶") {
    if (KW_BEEF.test(name)) return 50 + people * 10;
    if (KW_FISH.test(name)) return 30 + people * 8;
    if (KW_CHICKEN.test(name)) return 20 + people * 6;
    if (KW_PORK.test(name)) return 18 + people * 6;
    if (/蛋/.test(name)) return 12 + people * 2;
    if (/奶|火腿|腊/.test(name)) return 18;
    return 20;
  }
  if (group === "蔬菜") return 4 + people * 2;
  if (group === "主食豆制品") {
    if (/米|面/.test(name)) return 20;
    if (/豆腐|腐竹|豆干|百叶/.test(name)) return 6;
    if (/玉米|薯/.test(name)) return 8;
    return 10;
  }
  return 3; // 调味
}

function altOfIngredient(name: string, group: ShoppingGroup["group"]): string | undefined {
  if (group === "肉蛋奶") {
    if (KW_BEEF.test(name)) return "可换里脊或鸡蛋豆腐";
    if (KW_FISH.test(name)) return "可换冷冻鱼柳或鸡胸";
    if (KW_CHICKEN.test(name)) return "可换鸡胸或鸡腿，整鸡更划算";
    if (KW_PORK.test(name)) return "可换鸡腿或鸡胸";
    if (/蛋/.test(name)) return "盒装蛋更便宜";
  }
  if (group === "蔬菜") return "应季蔬菜更便宜";
  if (group === "主食豆制品" && /米|面/.test(name)) return "5 公斤大袋更划算";
  return undefined;
}

function buildFamilyShoppingList(recipes: Recipe[], people: number): ShoppingResultLocal {
  const map = new Map<string, { name: string; group: ShoppingGroup["group"]; qty: string[]; from: Set<string>; cost: number }>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const group = categorize(ing.name);
      const key = `${group}::${ing.name}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty.push(ing.qty);
        existing.from.add(r.name);
      } else {
        map.set(key, {
          name: ing.name,
          group,
          qty: [ing.qty],
          from: new Set([r.name]),
          cost: priceOfIngredient(ing.name, group, people),
        });
      }
    }
  }
  const groupedMap: Record<ShoppingGroup["group"], ShoppingGroup["items"]> = {
    肉蛋奶: [], 蔬菜: [], 主食豆制品: [], 调味杂项: [],
  };
  for (const v of Array.from(map.values())) {
    groupedMap[v.group].push({
      name: v.name,
      qty: v.qty.slice(0, 3).join(" / "),
      cost: v.cost,
      fromRecipes: Array.from(v.from).slice(0, 4),
      alt: altOfIngredient(v.name, v.group),
    });
  }
  // 调味雷同较多，合并并降权
  const seasoningCap = 30;
  let seasoningSum = 0;
  groupedMap["调味杂项"].forEach((it) => { seasoningSum += it.cost; });
  if (seasoningSum > seasoningCap) {
    const factor = seasoningCap / seasoningSum;
    groupedMap["调味杂项"].forEach((it) => { it.cost = Math.round(it.cost * factor); });
  }
  const groups: ShoppingGroup[] = (["肉蛋奶", "蔬菜", "主食豆制品", "调味杂项"] as ShoppingGroup["group"][]).map((g) => {
    const items = groupedMap[g].sort((a, b) => b.cost - a.cost);
    const subtotal = items.reduce((acc, it) => acc + it.cost, 0);
    return { group: g, items, subtotal };
  });
  const total = groups.reduce((acc, g) => acc + g.subtotal, 0);
  return { groups, total };
}

function buildNotes(input: FamilyInput, freq: Record<ProteinKind, number>, totalCost: number): string[] {
  const notes: string[] = [];
  notes.push(`本周 ${input.people} 人 · 14 餐（午+晚）+ 外卖 ${freq["外卖"]} 次`);
  if (input.elders > 0) notes.push("已为长辈优先选清淡 / 蒸炖菜");
  if (input.kids > 0) notes.push("已为孩子优先选番茄 / 蛋类 / 糖醋");
  if (input.goal === "省钱") notes.push("省钱方案：豆腐蛋为主，肉类聚焦鸡肉与猪肉");
  if (input.goal === "减脂") notes.push("减脂方案：高蛋白 + 低油，外卖优先轻食");
  notes.push(`周估价 ¥${totalCost} · 月估价 ¥${totalCost * 4}`);
  return notes;
}

// === 复制为文本 ===
export function weeklyMenuToText(input: FamilyInput, plan: WeeklyMenuResult): string {
  const lines: string[] = [];
  lines.push(`【家庭一周菜单 · ${input.people} 人 / ${input.goal}】`);
  lines.push(`月预算 ¥${input.monthlyBudget}（周 ¥${input.weeklyBudget}） · 实际本周估价 ¥${plan.totalCost}`);
  lines.push(`蛋白频次：${plan.proteinFreq.map((p) => `${p.kind}×${p.count}`).join(" / ")}`);
  lines.push("");
  for (const day of plan.days) {
    lines.push(`${day.label} (¥${day.cost})`);
    for (const meal of day.meals) {
      const names = meal.dishes.map((d) => d.recipe?.name ?? `外卖：${d.takeoutHint ?? ""}`).join(" + ");
      lines.push(`  ${meal.slotLabel}：${names}`);
    }
  }
  lines.push("");
  lines.push(`【买菜清单】 (¥${plan.shoppingTotal})`);
  for (const g of plan.shopping) {
    if (g.items.length === 0) continue;
    lines.push(`◇ ${g.group} (¥${g.subtotal})`);
    for (const it of g.items) {
      lines.push(`  · ${it.name} ${it.qty}  ¥${it.cost}${it.alt ? `  · ${it.alt}` : ""}`);
    }
  }
  return lines.join("\n");
}
