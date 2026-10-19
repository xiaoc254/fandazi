// 简单的「人均热量」估算 — 复用 detail 页面里的 estimateIngredient。
// 用于推荐算法把 recipe 与目标餐次热量做软匹配。

import type { Recipe } from "@/data/recipes";
import { estimateIngredient } from "@/data/ingredients";

const cache = new Map<string, number>();

export function totalCaloriesOf(recipe: Recipe): number {
  if (cache.has(recipe.id)) return cache.get(recipe.id)!;
  let total = 0;
  for (const ing of recipe.ingredients) {
    const e = estimateIngredient(ing.name, ing.qty);
    if (e.grams !== null) total += e.calories;
  }
  cache.set(recipe.id, total);
  return total;
}

export function perPersonCaloriesOf(recipe: Recipe): number {
  return Math.round(totalCaloriesOf(recipe) / Math.max(recipe.serves, 1));
}
