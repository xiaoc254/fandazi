// 早餐 / 午餐 / 晚餐主题：通过给 <html> 加 data-meal=... 切换主题色变量。
// CSS 在 index.css 中按 [data-meal] 选择器覆盖背景渐变与 primary 色调。

import type { MealSlot } from "./profile";

export interface MealTheme {
  slot: MealSlot;
  label: string;
  emoji: string;
  description: string;
  /** 简短主色描述（仅文字提示，不直接用） */
  toneHint: string;
}

export const MEAL_THEMES: Record<MealSlot, MealTheme> = {
  breakfast: {
    slot: "breakfast",
    label: "早餐",
    emoji: "🌅",
    description: "清爽明亮，让人想起一天的开始。",
    toneHint: "鹅黄 + 清晨蓝",
  },
  lunch: {
    slot: "lunch",
    label: "午餐",
    emoji: "🌞",
    description: "活力饱满，配工作日午休。",
    toneHint: "暖橙 + 米白",
  },
  dinner: {
    slot: "dinner",
    label: "晚餐",
    emoji: "🌙",
    description: "温暖沉稳，留住一天的香气。",
    toneHint: "陶红 + 沉色",
  },
};

export function applyMealTheme(slot: MealSlot): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-meal", slot);
}
