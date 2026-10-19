// 整站主题：通过 data-theme 属性切换 CSS 颜色变量。
// 不动 dark/light 切换；不影响 data-meal 餐次主题（meal 仍可叠加）。
// 持久化到 localStorage；不可写时仅保留会话内态。

import { safeGet, safeSet } from "./storage";

const STORAGE_KEY = "chishenme.theme.v1";

export type ThemeId =
  | "fresh"
  | "cream"
  | "mint"
  | "midnight"
  | "vibrant"
  | "minimal"
  | "warm";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  hint: string;
  /** 简单的 4 色色卡，UI 选择器用 */
  swatch: [string, string, string, string];
}

// 默认顺序：清爽优先，最后是原 warm（旧版默认）。
export const THEMES: ThemeMeta[] = [
  { id: "fresh",    label: "清爽蓝白", hint: "推荐 · 干净明亮", swatch: ["#f6fbff", "#e6f0ff", "#1e7eef", "#0b264a"] },
  { id: "cream",    label: "奶油暖色", hint: "柔和米色", swatch: ["#fbf6ec", "#f1e4cd", "#c3884a", "#3a2410"] },
  { id: "mint",     label: "薄荷绿色", hint: "清新薄荷", swatch: ["#f3fbf6", "#dff1e4", "#2eaa6e", "#0d3a25"] },
  { id: "midnight", label: "夜宵深色", hint: "深色模式 · 夜间舒服", swatch: ["#15171c", "#212530", "#5fa9ff", "#e6ecf3"] },
  { id: "vibrant",  label: "活力粉橘", hint: "粉橘明快", swatch: ["#fff6f4", "#ffe4d4", "#ff5b67", "#5a1320"] },
  { id: "minimal",  label: "极简黑白", hint: "极简 · 不分散", swatch: ["#fbfbfb", "#ededed", "#1a1a1a", "#000000"] },
  { id: "warm",     label: "经典暖橘", hint: "原版温暖陶土感", swatch: ["#f7eedf", "#ecdec1", "#c14a26", "#3b1e0a"] },
];

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function loadTheme(): ThemeId {
  const raw = safeGet(STORAGE_KEY);
  if (raw && THEMES.some((t) => t.id === raw)) return raw as ThemeId;
  return "fresh";
}

export function saveTheme(id: ThemeId): void {
  safeSet(STORAGE_KEY, id);
}

export function applyTheme(id: ThemeId): void {
  if (typeof document === "undefined") return;
  try {
    document.documentElement.dataset.theme = id;
    // 夜间主题需要让 .dark 类生效，方便复用 tailwind dark variant
    if (id === "midnight") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch {
    /* ignore */
  }
}
