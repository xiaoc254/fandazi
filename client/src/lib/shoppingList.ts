// 统一购物清单（#/shopping）—— 把家庭饭/冰箱缺料/剩菜改造/一周菜单/手动等
// 多个来源的「要买的食材」统一聚合到一个清单，支持勾选、删除、复制、清空已完成。
//
// 设计原则：
// - 走 safeGet/safeSet（隐私模式自动退回内存态），不直接读写 localStorage。
// - 同名食材（按 normalize 后的 name）合并，保留来源备注，避免一堆重复行。
// - 仅做本地清单聚合，不接外部买菜平台 API；不做真实价格比价。

import { useSyncExternalStore } from "react";
import { readJSON, writeJSON, safeRemove } from "./storage";
import { normalizeIngredient } from "./ingredientAliases";

export type ShoppingSource =
  | "family-tonight"
  | "tonight-plan"
  | "fridge"
  | "leftover"
  | "weekly"
  | "manual";

export const SOURCE_LABEL: Record<ShoppingSource, string> = {
  "family-tonight": "家庭今晚饭",
  "tonight-plan": "今晚最终方案",
  fridge: "冰箱缺料",
  leftover: "剩菜改造",
  weekly: "一周菜单",
  manual: "手动添加",
};

export type ShoppingCategory =
  | "肉蛋奶"
  | "蔬菜"
  | "水果"
  | "主食豆制品"
  | "调味杂项"
  | "其他";

export const CATEGORY_ORDER: ShoppingCategory[] = [
  "肉蛋奶",
  "蔬菜",
  "水果",
  "主食豆制品",
  "调味杂项",
  "其他",
];

export const CATEGORY_EMOJI: Record<ShoppingCategory, string> = {
  肉蛋奶: "🥩",
  蔬菜: "🥬",
  水果: "🍎",
  主食豆制品: "🍚",
  调味杂项: "🧂",
  其他: "🛒",
};

export interface ShoppingItem {
  id: string;
  /** 规范化后的标准名（合并 key） */
  name: string;
  /** 原始名（首次输入用于展示，后续合并保留首次） */
  rawName: string;
  category: ShoppingCategory;
  /** 数量/分量描述，可选；多个来源累加为「适量 · 一份」之类的文本 */
  amount?: string;
  /** 来源集合（去重） */
  sources: ShoppingSource[];
  /** 来源备注：例如「番茄炒蛋 · 红烧肉」用于回溯 */
  note?: string;
  checked: boolean;
  createdAt: number;
}

const KEY = "fanda.shoppingList.v1";
const EVT = "fanda:shoppingList";

let cache: ShoppingItem[] | null = null;
const reactListeners = new Set<() => void>();

function load(): ShoppingItem[] {
  if (cache) return cache;
  cache = readJSON<ShoppingItem[]>(KEY, []);
  return cache!;
}

function persist(list: ShoppingItem[]): void {
  cache = list;
  writeJSON(KEY, list);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVT));
    } catch {}
  }
  reactListeners.forEach((l) => l());
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallthrough
    }
  }
  return `sl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// === 分类推断 ===
// 与 familyWeekly.ts 中的 categorize 保持一致的语义，并补充水果。
const RE_MEAT = /鸡(?!蛋)|猪|牛|羊|肉|排骨|五花|里脊|火腿|香肠|腊肉|鱼|虾|蟹|海鲜|鱿鱼|带鱼|鳕鱼|三文鱼|鸭|鹅|肝|肚|腰花|蛋|奶|酸奶|牛奶|奶酪/;
const RE_TOFU_STAPLE = /豆腐|豆干|腐竹|百叶|千张|豆皮|腐乳|米|饭|面|粉|馒头|饺子|花卷|包子|年糕|粥|燕麦|玉米|红薯|土豆|薯条|藕粉/;
const RE_FRUIT = /苹果|香蕉|橙|柚|橘|梨|葡萄|提子|草莓|蓝莓|樱桃|车厘子|芒果|桃|杏|李|西瓜|哈密瓜|甜瓜|火龙果|猕猴桃|奇异果|柿子|榴莲|椰|柠檬|青柠|百香果|山竹|荔枝|龙眼|桂圆|杨梅|枇杷|石榴|无花果|枣|葡萄柚|菠萝|凤梨|果/;
const RE_SEASONING = /盐|糖|酱油|生抽|老抽|醋|料酒|蚝油|豆瓣|甜面|辣椒酱|辣椒油|麻油|香油|油|花椒|八角|桂皮|香叶|孜然|胡椒|淀粉|面粉|鸡精|味精|蜂蜜|芝麻|辣椒粉|五香粉|咖喱|蒜蓉酱|番茄酱|沙拉酱|芥末|柴鱼|味噌|海苔/;
const RE_VEG = /菜|椒|瓜|菇|耳|笋|藕|姜|葱|蒜|韭|香菜|芹|茄|萝卜|苗|薹|豆角|四季豆|豇豆|西兰花|花椰菜|生菜|莴笋|莲|芦笋|秋葵|苦瓜|番茄|西红柿/;

export function inferCategory(rawName: string): ShoppingCategory {
  const n = (rawName || "").trim();
  if (!n) return "其他";
  if (RE_FRUIT.test(n)) return "水果";
  if (RE_SEASONING.test(n)) return "调味杂项";
  if (RE_MEAT.test(n)) return "肉蛋奶";
  if (RE_TOFU_STAPLE.test(n)) return "主食豆制品";
  if (RE_VEG.test(n)) return "蔬菜";
  return "其他";
}

// === 公共 API ===

export function listShoppingItems(): ShoppingItem[] {
  return [...load()];
}

export function subscribeShoppingList(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}

export interface AddShoppingInput {
  name: string;
  source: ShoppingSource;
  category?: ShoppingCategory;
  amount?: string;
  note?: string;
}

/**
 * 添加单个食材：自动规范化 + 同名合并。
 * - 同 normalize 名称已存在：合并 sources，叠加 note，amount 取首次（不覆盖）。
 * - 不存在：新建一行。
 * 返回 { item, merged }：merged 表示是否命中合并。
 */
export function addShoppingItem(input: AddShoppingInput): { item: ShoppingItem; merged: boolean } {
  const raw = (input.name || "").trim();
  if (!raw) {
    // 兜底：返回一个空 item 但不写入。调用方应在外层先校验。
    return {
      item: {
        id: "",
        name: "",
        rawName: "",
        category: "其他",
        sources: [input.source],
        checked: false,
        createdAt: Date.now(),
      },
      merged: false,
    };
  }
  const normalized = normalizeIngredient(raw) || raw;
  const list = load().slice();
  const existing = list.find((it) => it.name === normalized);
  if (existing) {
    const sources = existing.sources.includes(input.source)
      ? existing.sources
      : [...existing.sources, input.source];
    const noteParts = new Set<string>();
    if (existing.note) existing.note.split(" · ").forEach((s) => noteParts.add(s.trim()));
    if (input.note) noteParts.add(input.note.trim());
    const merged: ShoppingItem = {
      ...existing,
      sources,
      note: noteParts.size > 0 ? Array.from(noteParts).filter(Boolean).join(" · ") : existing.note,
      amount: existing.amount ?? input.amount,
      // 重新加入时取消勾选，避免「以前买过」状态干扰新一波采购
      checked: false,
    };
    const next = list.map((it) => (it.id === existing.id ? merged : it));
    persist(next);
    return { item: merged, merged: true };
  }
  const item: ShoppingItem = {
    id: genId(),
    name: normalized,
    rawName: raw,
    category: input.category ?? inferCategory(normalized || raw),
    amount: input.amount,
    sources: [input.source],
    note: input.note,
    checked: false,
    createdAt: Date.now(),
  };
  persist([item, ...list]);
  return { item, merged: false };
}

/**
 * 批量添加；返回 { added, merged }。
 * 用于「家庭今晚饭缺料一键加入」「冰箱缺料一键加入」等场景。
 */
export function addShoppingItems(inputs: AddShoppingInput[]): { added: number; merged: number } {
  let added = 0;
  let merged = 0;
  for (const it of inputs) {
    if (!(it.name || "").trim()) continue;
    const r = addShoppingItem(it);
    if (r.merged) merged++;
    else added++;
  }
  return { added, merged };
}

export function toggleShoppingItem(id: string): void {
  const list = load().map((it) => (it.id === id ? { ...it, checked: !it.checked } : it));
  persist(list);
}

export function setShoppingItemChecked(id: string, checked: boolean): void {
  const list = load().map((it) => (it.id === id ? { ...it, checked } : it));
  persist(list);
}

export function removeShoppingItem(id: string): void {
  persist(load().filter((it) => it.id !== id));
}

export function updateShoppingItem(id: string, patch: Partial<Pick<ShoppingItem, "amount" | "note" | "category" | "rawName">>): void {
  const list = load().map((it) => (it.id === id ? { ...it, ...patch } : it));
  persist(list);
}

export function clearCheckedShoppingItems(): number {
  const list = load();
  const remaining = list.filter((it) => !it.checked);
  const removed = list.length - remaining.length;
  persist(remaining);
  return removed;
}

export function clearAllShoppingItems(): void {
  cache = [];
  safeRemove(KEY);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVT));
    } catch {}
  }
  reactListeners.forEach((l) => l());
}

export interface GroupedShoppingList {
  category: ShoppingCategory;
  items: ShoppingItem[];
}

/** 按分类分组，按 CATEGORY_ORDER 排序，未勾选靠前。 */
export function groupByCategory(items: ShoppingItem[]): GroupedShoppingList[] {
  const buckets = new Map<ShoppingCategory, ShoppingItem[]>();
  for (const c of CATEGORY_ORDER) buckets.set(c, []);
  for (const it of items) {
    const arr = buckets.get(it.category) ?? buckets.get("其他")!;
    arr.push(it);
  }
  // 每个分类内：未勾选靠前；同状态内按 createdAt 倒序（新加的靠上）
  buckets.forEach((arr) => {
    arr.sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  });
  return CATEGORY_ORDER.map((c) => ({ category: c, items: buckets.get(c) ?? [] })).filter(
    (g) => g.items.length > 0,
  );
}

/** 复制清单文本：分类小标题 + 未勾选食材。已勾选默认不进入复制（已经买好）。 */
export function shoppingListToText(items: ShoppingItem[], opts?: { includeChecked?: boolean }): string {
  const includeChecked = opts?.includeChecked ?? false;
  const filtered = items.filter((it) => includeChecked || !it.checked);
  if (filtered.length === 0) {
    return "（购物清单是空的）";
  }
  const groups = groupByCategory(filtered);
  const lines: string[] = ["【今天买菜】"];
  let total = 0;
  for (const g of groups) {
    if (g.items.length === 0) continue;
    lines.push(`${CATEGORY_EMOJI[g.category]} ${g.category}（${g.items.length}）`);
    for (const it of g.items) {
      const tag = it.amount ? ` · ${it.amount}` : "";
      const checkedMark = it.checked ? "[已买] " : "";
      lines.push(`  - ${checkedMark}${it.rawName || it.name}${tag}`);
      total++;
    }
    lines.push("");
  }
  lines.push(`共 ${total} 项 — 来自「今天吃什么 · 饭搭子」`);
  return lines.join("\n").replace(/\n+$/g, "\n");
}

/** 统计：总数 / 已勾选 / 剩余 */
export interface ShoppingStats {
  total: number;
  checked: number;
  remaining: number;
}

export function shoppingStats(items: ShoppingItem[]): ShoppingStats {
  const checked = items.filter((it) => it.checked).length;
  return {
    total: items.length,
    checked,
    remaining: items.length - checked,
  };
}

// === React hook ===
function subscribe(fn: () => void): () => void {
  reactListeners.add(fn);
  return () => {
    reactListeners.delete(fn);
  };
}

function getSnapshot(): ShoppingItem[] {
  return load();
}

export function useShoppingList(): ShoppingItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
