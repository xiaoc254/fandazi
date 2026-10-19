// 「懒人决定」海报与浮窗共享的 estimate helper。
// 把每一个推荐结果（菜 / 外卖 / 零食 / 水果 / 饮料）映射成同一份 SelectedItem-like estimate，
// 这样海报上的 priceEst/caloriesEst 与一键加入「今日已选」后浮窗看到的总价/总热量完全一致。

import type { SelectedItem, SelectedKind } from "./selectedToday";

export interface LazyEstimateInput {
  recipe?: { name: string; cuisine: string } | null;
  takeoutBrand: { id: string; name: string; intro: string; budgetMin: number; budgetMax: number };
  snack: { id: string; name: string; price: string; calories: number };
  fruit: { id: string; name: string; calories: number };
  drink: string;
}

export type LazyItem = Omit<SelectedItem, "ts">;

/** 解析零食单价，零食字段是字符串如 "¥6.5"。 */
function parseSnackPrice(s: string): number {
  const m = s.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : 5;
}

/**
 * 把一次「懒人决定」结果映射成一组 SelectedItem-like estimate。
 * 顺序与 UI tile 顺序保持一致：菜 → 外卖 → 零食 → 水果 → 饮料。
 *
 * 单一口径：海报与浮窗都从这里求和，避免出现「海报 1130 / 浮窗 1680」这种偏差。
 *
 * 自炊菜（recipe）只挂占位价格 0；热量按一份口粮 600 kcal 估算。
 * 外卖品牌：单价 = 区间中点；热量按 700 kcal 估算（一份正餐外卖）。
 * 零食 / 水果：直接用数据本身的 calories，水果价格统一估 12 元。
 * 饮料：18 元 / 150 kcal（瓶装无糖更低，奶茶更高，取平均）。
 */
export function buildLazyItems(input: LazyEstimateInput): LazyItem[] {
  const items: LazyItem[] = [];
  if (input.recipe) {
    items.push({
      id: `lazy-recipe-${input.recipe.name}`,
      kind: "dish" satisfies SelectedKind,
      name: input.recipe.name,
      price: 0,
      calories: 600,
      note: input.recipe.cuisine,
    });
  }
  const takeoutPrice = Math.round(
    (input.takeoutBrand.budgetMin + input.takeoutBrand.budgetMax) / 2,
  );
  items.push({
    id: input.takeoutBrand.id,
    kind: "takeout",
    name: input.takeoutBrand.name,
    price: takeoutPrice,
    calories: 700,
    note: input.takeoutBrand.intro.slice(0, 12),
  });
  items.push({
    id: input.snack.id,
    kind: "snack",
    name: input.snack.name,
    price: parseSnackPrice(input.snack.price),
    calories: input.snack.calories,
  });
  items.push({
    id: input.fruit.id,
    kind: "fruit",
    name: input.fruit.name,
    price: 12,
    calories: input.fruit.calories,
  });
  items.push({
    id: `drink-${input.drink.slice(0, 10)}`,
    kind: "drink",
    name: input.drink,
    price: 18,
    calories: 150,
  });
  return items;
}

export function totalsOfLazyItems(items: LazyItem[]): { price: number; calories: number; count: number } {
  let price = 0;
  let calories = 0;
  for (const x of items) {
    if (x.price) price += x.price;
    if (x.calories) calories += x.calories;
  }
  return { price: Math.round(price), calories: Math.round(calories), count: items.length };
}
