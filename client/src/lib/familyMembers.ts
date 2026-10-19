// F1 — 家庭成员口味协调
// 数据：本地 safe storage（沙箱安全），最多 6 位成员
// 评分：Hard filter（过敏/绝对不吃）→ Soft penalty（不喜欢 / 健康冲突 / 口味偏好）
// 与现有个人 Profile 协同：getActiveProfile() 自动作为"我"，未注册时一键同步

import { readJSON, writeJSON } from "./storage";
import {
  normalizeIngredient,
  recipeSearchableText,
  textIncludesIngredient,
  extractCoreIngredientNames,
  COMMON_DISLIKE_TAGS,
  COMMON_ALLERGEN_TAGS,
} from "./ingredientAliases";
import type { Recipe } from "@/data/recipes";
import { getActiveProfile } from "./profile";

export type FamilyRole = "self" | "partner" | "child" | "elder" | "other";

export type HealthGoal =
  | "balanced"
  | "low_fat"
  | "low_salt"
  | "low_sugar"
  | "low_purine"
  | "high_protein"
  | "soft_easy"; // 老人 / 病后软烂

export interface FamilyMember {
  id: string;
  name: string; // 最多 6 字
  role: FamilyRole;
  emoji: string;
  /** 软偏好：忌口 / 不喜欢的食材或风味（标准化前）。例 ["香菜","苦瓜"]。 */
  dislikedIngredients: string[];
  /** 硬约束：过敏 / 绝对不吃（出现就过滤）。 */
  allergicIngredients: string[];
  /** 健康目标，软评分。可多选。 */
  healthGoals: HealthGoal[];
  /** 是否参与本次推荐计算（出差时可临时关闭）。 */
  active: boolean;
}

const KEY = "fanda.family.members.v1";
const EVT = "fanda:family";

// ============== Storage ==============

let cache: FamilyMember[] | null = null;

function load(): FamilyMember[] {
  if (cache) return cache;
  cache = readJSON<FamilyMember[]>(KEY, []);
  return cache!;
}

function persist(list: FamilyMember[]): void {
  cache = list;
  writeJSON(KEY, list);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(EVT));
    } catch {}
  }
}

export function listMembers(): FamilyMember[] {
  return [...load()];
}

export function activeMembers(): FamilyMember[] {
  return load().filter((m) => m.active);
}

export function subscribeFamily(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallthrough
    }
  }
  return `fm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const ROLE_LABEL: Record<FamilyRole, string> = {
  self: "我",
  partner: "伴侣",
  child: "孩子",
  elder: "老人",
  other: "其他",
};

export const ROLE_EMOJI: Record<FamilyRole, string> = {
  self: "👤",
  partner: "💑",
  child: "🧒",
  elder: "👴",
  other: "🙂",
};

export const HEALTH_GOAL_LABEL: Record<HealthGoal, string> = {
  balanced: "均衡",
  low_fat: "减脂低油",
  low_salt: "低盐",
  low_sugar: "低糖",
  low_purine: "低嘌呤",
  high_protein: "高蛋白",
  soft_easy: "软烂清淡",
};

export const MAX_MEMBERS = 6;

/** 给某种角色一个合理的默认值。孩子默认避开过辣 / 内脏；老人默认低盐+软烂。 */
export function defaultsForRole(role: FamilyRole): Pick<FamilyMember, "dislikedIngredients" | "healthGoals" | "emoji"> {
  switch (role) {
    case "child":
      return {
        emoji: "🧒",
        dislikedIngredients: ["辣椒", "花椒", "苦瓜", "内脏"],
        healthGoals: ["balanced"],
      };
    case "elder":
      return {
        emoji: "👴",
        dislikedIngredients: ["辣椒"],
        healthGoals: ["low_salt", "soft_easy"],
      };
    case "partner":
      return { emoji: "💑", dislikedIngredients: [], healthGoals: [] };
    case "self":
      return { emoji: "👤", dislikedIngredients: [], healthGoals: [] };
    default:
      return { emoji: "🙂", dislikedIngredients: [], healthGoals: [] };
  }
}

export function createMember(input: Partial<FamilyMember> & { name: string; role: FamilyRole }): FamilyMember | null {
  const list = load();
  if (list.length >= MAX_MEMBERS) return null;
  const defaults = defaultsForRole(input.role);
  const m: FamilyMember = {
    id: genId(),
    name: (input.name || "").slice(0, 6) || ROLE_LABEL[input.role],
    role: input.role,
    emoji: input.emoji || defaults.emoji,
    dislikedIngredients: input.dislikedIngredients ?? defaults.dislikedIngredients ?? [],
    allergicIngredients: input.allergicIngredients ?? [],
    healthGoals: input.healthGoals ?? defaults.healthGoals ?? [],
    active: input.active ?? true,
  };
  persist([...list, m]);
  return m;
}

export function updateMember(id: string, patch: Partial<FamilyMember>): void {
  const list = load();
  const next = list.map((m) =>
    m.id === id
      ? {
          ...m,
          ...patch,
          name: patch.name != null ? patch.name.slice(0, 6) : m.name,
        }
      : m,
  );
  persist(next);
}

export function deleteMember(id: string): void {
  persist(load().filter((m) => m.id !== id));
}

export function toggleActive(id: string): void {
  const list = load();
  persist(list.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
}

/**
 * 把当前 active Profile 同步进家庭成员（作为 self 角色）。
 * 已有 self 成员则更新，否则插入。
 * 自动从 profile.flavor.restrictions 推断 allergicIngredients，从 disliked tastes 转换 disliked。
 */
export function syncActiveProfileAsMember(): FamilyMember | null {
  const profile = getActiveProfile();
  const list = load();

  // 不强制要求 profile 存在 — 没有也插一个空白 self
  const restrictions = profile?.flavor.restrictions ?? [];
  const disliked: string[] = [];
  if (profile?.flavor.disliked.includes("微辣") || profile?.flavor.disliked.includes("重辣") || profile?.flavor.disliked.includes("麻辣")) {
    disliked.push("辣椒");
  }
  // 把 restriction 翻译为 allergic / disliked 词
  const allergic: string[] = [];
  for (const r of restrictions) {
    if (r === "无猪肉") allergic.push("猪肉");
    else if (r === "无牛肉") allergic.push("牛肉");
    else if (r === "无海鲜") allergic.push("海鲜", "虾", "鱼");
    else if (r === "无蛋") allergic.push("鸡蛋");
    else if (r === "无奶") allergic.push("牛奶");
    else if (r === "无花生") allergic.push("花生");
  }

  const existingSelf = list.find((m) => m.role === "self");
  if (existingSelf) {
    const merged: FamilyMember = {
      ...existingSelf,
      name: existingSelf.name || profile?.nickname || "我",
      // 只在合并时追加，不覆盖用户编辑过的
      dislikedIngredients: Array.from(new Set([...existingSelf.dislikedIngredients, ...disliked])),
      allergicIngredients: Array.from(new Set([...existingSelf.allergicIngredients, ...allergic])),
    };
    updateMember(existingSelf.id, merged);
    return merged;
  }
  return createMember({
    name: profile?.nickname || "我",
    role: "self",
    emoji: "👤",
    dislikedIngredients: disliked,
    allergicIngredients: allergic,
    healthGoals: ["balanced"],
    active: true,
  });
}

// ============== 评分 ==============

export interface MemberConflict {
  memberId: string;
  memberName: string;
  emoji: string;
  /** 原因：allergic（硬冲突） / disliked（软冲突） / health（健康目标冲突） / flavor（辣度等） */
  reasons: string[];
  /** 是否硬冲突（过敏/绝对不吃） */
  hard: boolean;
}

export interface FamilyMatchResult {
  /** 0–100，越高越兼容；含硬冲突时降为 0–30。 */
  score: number;
  /** 摘要标签：'green' = 全家兼容；'amber' = 部分兼容；'red' = 有硬冲突。 */
  level: "green" | "amber" | "red";
  /** 冲突明细 */
  conflicts: MemberConflict[];
  /** 已计算的成员数（active）；为 0 时不参与排序 */
  consideredMembers: number;
}

const HEALTH_PENALTY_KEYWORDS: Record<HealthGoal, { keywords: RegExp; label: string; weight: number }[]> = {
  balanced: [],
  low_fat: [{ keywords: /(红烧|油炸|油焖|爆炒|煎|炸|五花肉|肥|油)/, label: "偏油", weight: 20 }],
  low_salt: [{ keywords: /(腊|咸|酱|卤|火腿|腌)/, label: "偏咸", weight: 25 }],
  low_sugar: [{ keywords: /(糖醋|拔丝|蜜汁|甜|冰糖)/, label: "偏甜", weight: 20 }],
  low_purine: [{ keywords: /(海鲜|动物内脏|内脏|猪肝|腰花|啤酒|高汤|浓汤)/, label: "高嘌呤", weight: 30 }],
  high_protein: [],
  soft_easy: [{ keywords: /(干煸|爆炒|油炸|麻辣|辛辣)/, label: "偏硬辛辣", weight: 25 }],
};

function detectHardConflict(member: FamilyMember, recipe: Recipe, searchable: string, coreNames: string[]): string[] {
  const hits: string[] = [];
  for (const a of member.allergicIngredients) {
    const norm = normalizeIngredient(a);
    if (!norm) continue;
    if (coreNames.includes(norm) || textIncludesIngredient(searchable, norm)) {
      hits.push(norm);
    }
  }
  // 孩子 / 老人若没有显式忌辣，但选了 low_salt / soft_easy，碰到重辣菜直接降级（不算 hard，但兜底）
  return hits;
}

function detectSoftConflict(member: FamilyMember, recipe: Recipe, searchable: string, coreNames: string[]): { reasons: string[]; penalty: number } {
  let penalty = 0;
  const reasons: string[] = [];

  for (const d of member.dislikedIngredients) {
    const norm = normalizeIngredient(d);
    if (!norm) continue;
    if (coreNames.includes(norm)) {
      penalty += 30;
      reasons.push(`不爱${norm}`);
    } else if (textIncludesIngredient(searchable, norm)) {
      penalty += 12;
      reasons.push(`含${norm}`);
    }
  }

  // 健康目标软扣
  for (const g of member.healthGoals) {
    const rules = HEALTH_PENALTY_KEYWORDS[g] ?? [];
    for (const rule of rules) {
      if (rule.keywords.test(searchable) || rule.keywords.test(recipe.name)) {
        penalty += rule.weight;
        reasons.push(rule.label);
        break;
      }
    }
  }

  // 角色特殊处理：孩子默认对辣度敏感
  if (member.role === "child") {
    if (recipe.tastes.some((t) => t === "重辣" || t === "麻辣")) {
      penalty += 35;
      if (!reasons.includes("太辣")) reasons.push("太辣");
    } else if (recipe.tastes.some((t) => t === "微辣")) {
      penalty += 12;
      if (!reasons.includes("略辣")) reasons.push("略辣");
    }
  }
  if (member.role === "elder" && recipe.tastes.some((t) => t === "重辣" || t === "麻辣")) {
    penalty += 25;
    reasons.push("老人不宜");
  }

  return { reasons: Array.from(new Set(reasons)), penalty: Math.min(penalty, 100) };
}

export function evaluateFamilyMatch(recipe: Recipe, members: FamilyMember[]): FamilyMatchResult {
  const active = members.filter((m) => m.active);
  if (active.length === 0) {
    return { score: 100, level: "green", conflicts: [], consideredMembers: 0 };
  }

  const coreNames = extractCoreIngredientNames(recipe.ingredients);
  const searchable = recipeSearchableText({
    name: recipe.name,
    ingredientNames: recipe.ingredients.map((i) => i.name),
    tastes: recipe.tastes,
    steps: recipe.steps,
    reason: recipe.reason,
  });

  const conflicts: MemberConflict[] = [];
  let totalScore = 0;
  let hasHard = false;

  for (const m of active) {
    const hard = detectHardConflict(m, recipe, searchable, coreNames);
    const soft = detectSoftConflict(m, recipe, searchable, coreNames);
    let s = 100 - soft.penalty;
    const reasons: string[] = [...soft.reasons];
    if (hard.length > 0) {
      hasHard = true;
      // 硬冲突大幅降分（不直接 0，避免后续兜底无法显示）
      s = Math.min(s, 25);
      for (const h of hard) reasons.unshift(`不能吃${h}`);
    }
    if (reasons.length > 0) {
      conflicts.push({
        memberId: m.id,
        memberName: m.name,
        emoji: m.emoji,
        reasons,
        hard: hard.length > 0,
      });
    }
    totalScore += Math.max(0, s);
  }

  const score = Math.round(totalScore / active.length);
  let level: FamilyMatchResult["level"];
  if (hasHard) level = "red";
  else if (score >= 88) level = "green";
  else if (score >= 65) level = "amber";
  else level = "amber"; // 不直接红，避免被 hard 占用

  return { score, level, conflicts, consideredMembers: active.length };
}

/** 给一组菜按家庭兼容分排序，并返回每个的匹配信息。可选 limit。 */
export function rankByFamily(
  recipes: Recipe[],
  members: FamilyMember[],
  opts: { limit?: number; minScore?: number } = {},
): { recipe: Recipe; match: FamilyMatchResult }[] {
  const list = recipes.map((r) => ({ recipe: r, match: evaluateFamilyMatch(r, members) }));
  const min = opts.minScore ?? 0;
  const filtered = list.filter((x) => x.match.score >= min);
  filtered.sort((a, b) => b.match.score - a.match.score);
  return opts.limit ? filtered.slice(0, opts.limit) : filtered;
}

/** 一句话冲突摘要（卡片小字用）。 */
export function summarizeConflicts(match: FamilyMatchResult): string {
  if (match.conflicts.length === 0) return "全家都能吃";
  const parts = match.conflicts.slice(0, 2).map((c) => `${c.emoji}${c.memberName}：${c.reasons.slice(0, 1).join("·")}`);
  if (match.conflicts.length > 2) parts.push(`等${match.conflicts.length}人`);
  return parts.join(" ｜ ");
}

export { COMMON_DISLIKE_TAGS, COMMON_ALLERGEN_TAGS };
