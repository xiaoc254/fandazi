// 历史记录与收藏 — 全部本地 localStorage，不上传任何服务器。
// 历史记录保存「就吃这个了」的菜品组合，以便：
//   1) 用户回顾「上一次吃了什么」
//   2) 推荐时支持「不吃重复的」（软降权）

import { readJSON, writeJSON, safeRemove } from "./storage";

const HISTORY_KEY = "chishenme.history.v1";
const FAVORITES_KEY = "chishenme.favorites.v1";
const NO_REPEAT_KEY = "chishenme.noRepeat.v1";

export interface HistoryEntry {
  /** 时间戳（ms） */
  ts: number;
  /** 当时锁定的所有菜品 id（按 plan 顺序） */
  recipeIds: string[];
  /** 当时菜名（冗余存一份方便展示，避免菜单数据更新后无法显示） */
  names: string[];
  /** 当时餐次（用于显示） */
  slot?: string;
  /** 当时场景（可选） */
  scenario?: string;
}

const MAX_HISTORY = 30;

export function loadHistory(): HistoryEntry[] {
  return readJSON<HistoryEntry[]>(HISTORY_KEY, []);
}

export function saveHistoryEntry(entry: HistoryEntry): void {
  const all = [entry, ...loadHistory()].slice(0, MAX_HISTORY);
  writeJSON(HISTORY_KEY, all);
}

export function clearHistory(): void {
  safeRemove(HISTORY_KEY);
}

/** 取最近 N 条历史中出现过的菜品 id 集合（用于「不吃重复」降权）。 */
export function recentRecipeIds(limit = 7): Set<string> {
  const out = new Set<string>();
  const list = loadHistory().slice(0, limit);
  for (const e of list) {
    for (const id of e.recipeIds) out.add(id);
  }
  return out;
}

// === 收藏 ===
export function loadFavorites(): Set<string> {
  return new Set(readJSON<string[]>(FAVORITES_KEY, []));
}

export function isFavorite(id: string): boolean {
  return loadFavorites().has(id);
}

export function toggleFavorite(id: string): boolean {
  const set = loadFavorites();
  if (set.has(id)) set.delete(id);
  else set.add(id);
  writeJSON(FAVORITES_KEY, Array.from(set));
  return set.has(id);
}

// === 「不吃重复的」开关 ===
export function loadNoRepeat(): boolean {
  return readJSON<boolean>(NO_REPEAT_KEY, false);
}

export function saveNoRepeat(v: boolean): void {
  writeJSON(NO_REPEAT_KEY, v);
}
