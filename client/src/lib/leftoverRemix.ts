// F3 — 剩菜变花样 匹配 + 量级排序 + 与冰箱联动
//
// 输入剩菜名 + 剩余量，返回若干变形方案（含步骤/额外食材/缺什么）。
// 没有规则匹配时返回兜底方案（万能炒饭/汤/粥）。

import { LEFTOVER_RULES, FALLBACK_REMIXES, type LeftoverRule, type RemixOption } from "@/data/leftoverRules";
import { normalizeIngredient } from "./ingredientAliases";
import type { FridgeItem } from "./fridge";
import { fridgeHas } from "./fridge";
import { readJSON, writeJSON } from "./storage";

export type LeftoverQuantity = "small" | "half" | "most";

export const LEFTOVER_QTY_LABEL: Record<LeftoverQuantity, string> = {
  small: "一小碗",
  half: "约半份",
  most: "大半份",
};

export interface LeftoverRecord {
  id: string;
  name: string;
  normalized: string;
  quantity: LeftoverQuantity;
  recordedAt: number;
  remixedInto?: string;
}

export interface RemixWithFridgeInfo extends RemixOption {
  /** 冰箱里已有哪些额外食材（标准名） */
  fridgeAvailable: string[];
  /** 还需要购买/补足哪些 */
  fridgeMissing: string[];
}

// ============== Storage（最近 30 条） ==============
const KEY = "fanda.leftovers.v1";

function loadHistory(): LeftoverRecord[] {
  return readJSON<LeftoverRecord[]>(KEY, []);
}

function saveHistory(list: LeftoverRecord[]): void {
  writeJSON(KEY, list.slice(0, 30));
}

export function recordLeftover(name: string, quantity: LeftoverQuantity): LeftoverRecord {
  const trimmed = (name || "").trim() || "剩菜";
  const r: LeftoverRecord = {
    id: `lv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    normalized: normalizeIngredient(trimmed),
    quantity,
    recordedAt: Date.now(),
  };
  const next = [r, ...loadHistory()];
  saveHistory(next);
  return r;
}

export function listLeftoverHistory(): LeftoverRecord[] {
  return loadHistory();
}

// ============== 匹配 ==============

function ruleMatches(rule: LeftoverRule, leftover: string, normalized: string): boolean {
  for (const kw of rule.keywords) {
    if (leftover.includes(kw) || normalized.includes(kw) || kw.includes(normalized)) {
      return true;
    }
  }
  return false;
}

/** 根据剩菜名找出所有匹配的变形方案。 */
export function findRemixes(leftoverName: string, opts: { quantity?: LeftoverQuantity; fridge?: FridgeItem[] } = {}): RemixWithFridgeInfo[] {
  const trimmed = (leftoverName || "").trim();
  const normalized = normalizeIngredient(trimmed);
  const seen = new Set<string>();
  const collected: RemixOption[] = [];

  // 1) 精确规则匹配
  for (const rule of LEFTOVER_RULES) {
    if (ruleMatches(rule, trimmed, normalized)) {
      for (const r of rule.remixes) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        collected.push(r);
      }
    }
  }

  // 2) 没匹配 → 兜底
  let useFallback = false;
  if (collected.length === 0) {
    useFallback = true;
    collected.push(...FALLBACK_REMIXES);
  } else if (collected.length < 3) {
    // 匹配少时把兜底拼一两条进来，丰富选择
    for (const r of FALLBACK_REMIXES) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      collected.push(r);
      if (collected.length >= 4) break;
    }
  }

  // 3) 排序：按剩余量软调整 + 难度
  const qty = opts.quantity ?? "half";
  const sorted = collected.slice().sort((a, b) => {
    const aBoost = quantityBoost(a, qty);
    const bBoost = quantityBoost(b, qty);
    if (bBoost !== aBoost) return bBoost - aBoost;
    return diffOrder(a.difficulty) - diffOrder(b.difficulty);
  });

  // 4) 计算冰箱已有 / 缺少
  const fridge = opts.fridge ?? [];
  return sorted.slice(0, 6).map((r) => withFridgeInfo(r, fridge));
}

function diffOrder(d: RemixOption["difficulty"]): number {
  return d === "easy" ? 0 : d === "medium" ? 1 : 2;
}

function quantityBoost(r: RemixOption, q: LeftoverQuantity): number {
  // small：偏好低耗时
  if (q === "small") return r.extraMinutes <= 10 ? 1 : 0;
  // most：可接受较费工
  if (q === "most") return r.difficulty === "hard" ? 0 : r.difficulty === "medium" ? 1 : 0.5;
  // half：默认
  return 0.5;
}

function withFridgeInfo(r: RemixOption, fridge: FridgeItem[]): RemixWithFridgeInfo {
  const available: string[] = [];
  const missing: string[] = [];
  for (const ing of r.additionalIngredients) {
    if (fridgeHas(fridge, ing.name)) available.push(ing.name);
    else if (!ing.optional) missing.push(ing.name);
  }
  return { ...r, fridgeAvailable: available, fridgeMissing: missing };
}

/** 把剩菜变形需要的额外食材汇总成一段可加入买菜清单的文本。 */
export function remixMissingToShoppingText(remix: RemixWithFridgeInfo): string {
  if (remix.fridgeMissing.length === 0) return "";
  return remix.fridgeMissing.map((m) => `${m}（做${remix.title}用）`).join("\n");
}

export { LEFTOVER_RULES, FALLBACK_REMIXES };
