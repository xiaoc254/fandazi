// 「本地特色外卖」建议：把城市美食数据和外卖地区覆盖分开。
//
// 为什么单独一个文件：takeoutCoverage 在首屏主链上（被 takeoutBrands 引用，
// 而 manualChunks 把 takeout.ts / takeoutBrands.ts 合并进 data-takeout）。
// cityFoods 有 18KB，放进 takeoutCoverage 会让首屏白白多预加载一个 chunk。
// 这里只在真正打开外卖面板 / 旅行美食面板时才会被加载。

import { CITY_FOODS, type CityFoodItem } from "../data/cityFoods";
import { resolveTakeoutPlace, samePlace } from "./takeoutCoverage";

export interface LocalDishSuggestion {
  city: string;
  vibe: string;
  cuisine?: string;
  items: CityFoodItem[];
}

export function localTakeoutDishes(
  city?: string | null,
  province?: string | null,
): LocalDishSuggestion | null {
  const place = resolveTakeoutPlace(city, province);
  if (!place.city && !place.province) return null;
  const hit =
    CITY_FOODS.find((c) => place.city && samePlace(c.city, place.city)) ??
    CITY_FOODS.find((c) => place.province && samePlace(c.province, place.province));
  if (!hit) return null;
  return {
    city: hit.city,
    vibe: hit.vibe,
    cuisine: hit.cuisine,
    items: hit.items.slice(0, 6),
  };
}
