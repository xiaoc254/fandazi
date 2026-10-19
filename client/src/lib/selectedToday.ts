// v2: 「今日已选」状态 — 一个全局轻量发布订阅，记录用户今日决定的菜 / 外卖 / 零食 / 水果 / 饮料。
// 使用 localStorage 持久化（safe），刷新后保留；并提供事件订阅给浮窗。

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON } from "./storage";

export type SelectedKind = "dish" | "takeout" | "snack" | "fruit" | "drink" | "watch" | "topic";

export interface SelectedItem {
  id: string;
  kind: SelectedKind;
  name: string;
  /** 单价估算（人民币元） */
  price?: number;
  /** 热量估算 (kcal) */
  calories?: number;
  /** 备注（适合谁/品牌等） */
  note?: string;
  /** 时间戳 */
  ts: number;
}

const KEY = "chishenme.selectedToday.v1";

let cache: SelectedItem[] | null = null;
/** 稳定快照引用：只有数据变化时才换新数组，给 useSyncExternalStore 用。 */
let snapshot: SelectedItem[] = [];
const listeners = new Set<() => void>();

function load(): SelectedItem[] {
  if (cache) return cache;
  cache = readJSON<SelectedItem[]>(KEY, []);
  snapshot = cache.slice();
  return cache;
}

function bumpSnapshot(): void {
  snapshot = (cache ?? []).slice();
}

function persist(): void {
  if (!cache) return;
  writeJSON(KEY, cache);
  bumpSnapshot();
  listeners.forEach((l) => l());
}

export function listSelected(): SelectedItem[] {
  load();
  return snapshot;
}

export function addSelected(item: Omit<SelectedItem, "ts">): void {
  const list = load();
  // 同 kind 同 id 视为更新
  const idx = list.findIndex((x) => x.kind === item.kind && x.id === item.id);
  const full: SelectedItem = { ...item, ts: Date.now() };
  if (idx >= 0) list[idx] = full;
  else list.push(full);
  cache = list;
  persist();
}

export function removeSelected(kind: SelectedKind, id: string): void {
  const list = load();
  const next = list.filter((x) => !(x.kind === kind && x.id === id));
  if (next.length !== list.length) {
    cache = next;
    persist();
  }
}

export function clearSelected(): void {
  cache = [];
  persist();
}

export function totalsSelected(): { price: number; calories: number; count: number } {
  const list = load();
  let price = 0, calories = 0;
  for (const x of list) {
    if (x.price) price += x.price;
    if (x.calories) calories += x.calories;
  }
  return { price, calories, count: list.length };
}

export function subscribeSelected(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** React 18 useSyncExternalStore：浮窗徽标 / 总价 / 总热量都从这里读，加入后立即刷新。 */
export function useSelectedToday(): SelectedItem[] {
  return useSyncExternalStore(subscribeSelected, listSelected, listSelected);
}
