// 个性化画像（Persona）— 一个轻量的「我是谁 / 我现在想吃什么」结构。
// 与已有的 Profile（健康/餐次计划）解耦：persona 偏「现在的我」，profile 偏「数值参数」。
// 数据完全保存在浏览器本地（localStorage 不可用时退回内存态），不上传任何服务器。

import { readJSON, writeJSON, safeRemove } from "./storage";
import type { ScenarioId } from "./scenarios";
import type { MainTabId } from "@/components/MainTabs";

/** 使用目的 / 角色 — 影响入口跳转和推荐侧重 */
export type RoleId =
  | "lazy"          // 一键决定
  | "family-cook"   // 家庭掌勺
  | "fitness-cut"   // 减脂控卡
  | "health-watch"  // 健康忌口（糖尿病、高血压等）
  | "takeout"       // 外卖党
  | "travel-foodie" // 旅行美食
  | "table-talk";   // 饭桌陪伴

export interface RoleDef {
  id: RoleId;
  label: string;
  description: string;
  emoji: string;
  /** 选了这个角色后建议跳到的 Tab */
  preferredTab: MainTabId;
  /** 默认要不要带上场景预设 */
  defaultScenario?: ScenarioId;
}

export const ROLES: RoleDef[] = [
  { id: "lazy",          label: "一个人选择困难", description: "替我决定今晚怎么过",   emoji: "🧍", preferredTab: "solo" },
  { id: "family-cook",   label: "我负责一家人吃饭", description: "一桌饭老人小孩都能吃", emoji: "👨‍👩‍👧", preferredTab: "family-tonight", defaultScenario: "family-dinner" },
  { id: "fitness-cut",   label: "减脂控卡",     description: "热量蛋白盯紧一些",     emoji: "🥗", preferredTab: "health",  defaultScenario: "personal-cut" },
  { id: "health-watch",  label: "健康忌口",     description: "低盐低糖低嘌呤",       emoji: "🩺", preferredTab: "health" },
  { id: "takeout",       label: "外卖党",       description: "懒得动，凑个外卖",     emoji: "🛵", preferredTab: "takeout" },
  { id: "travel-foodie", label: "旅行美食",     description: "出门玩，吃当地",       emoji: "🧳", preferredTab: "travel" },
  { id: "table-talk",    label: "饭桌陪伴",     description: "想找点话题/影音",      emoji: "🎙️", preferredTab: "companion" },
];

export function getRole(id: RoleId): RoleDef | undefined {
  return ROLES.find((r) => r.id === id);
}

/** 心情 / 当下状态 — 影响推荐口味、热量、节奏 */
export type MoodId =
  | "happy"     // 想犒劳
  | "tired"     // 累了，想安慰餐
  | "busy"      // 没时间
  | "saving"    // 想省钱
  | "light"     // 想清淡
  | "spicy";    // 想吃辣过瘾

export interface MoodDef {
  id: MoodId;
  label: string;
  emoji: string;
}

export const MOODS: MoodDef[] = [
  { id: "happy",  label: "想犒劳一下", emoji: "🎉" },
  { id: "tired",  label: "累了想安慰", emoji: "🥱" },
  { id: "busy",   label: "没时间快手", emoji: "⏱️" },
  { id: "saving", label: "想省钱",     emoji: "💸" },
  { id: "light",  label: "想清淡",     emoji: "🍵" },
  { id: "spicy",  label: "想过瘾",     emoji: "🌶️" },
];

/** 健康关注 — 与 profile.flavor.restrictions 解耦：这里偏「软偏好」，可叠加 */
export type HealthFocusId =
  | "diabetes"     // 糖尿病：低糖低 GI
  | "hypertension" // 高血压：低盐
  | "gout"         // 痛风：低嘌呤
  | "elder"        // 老人友好：软烂
  | "low-fat"
  | "low-sugar"
  | "low-salt";

export const HEALTH_FOCUS: { id: HealthFocusId; label: string; emoji: string; hint: string }[] = [
  { id: "diabetes",     label: "糖尿病",   emoji: "🩸", hint: "低糖、低 GI" },
  { id: "hypertension", label: "高血压",   emoji: "💗", hint: "低盐少油" },
  { id: "gout",         label: "痛风",     emoji: "🦶", hint: "少海鲜内脏" },
  { id: "elder",        label: "老年友好", emoji: "👴", hint: "软烂蒸炖" },
  { id: "low-fat",      label: "低脂",     emoji: "🥬", hint: "" },
  { id: "low-sugar",    label: "低糖",     emoji: "🚫🍬", hint: "" },
  { id: "low-salt",     label: "低盐",     emoji: "🧂", hint: "" },
];

export type AgeBand = "18-25" | "26-35" | "36-45" | "46-55" | "56+";
export type Sex = "female" | "male" | "skip";

export interface Persona {
  /** 用户主要使用目的，最多 1 个（用于跳转） */
  role?: RoleId;
  /** 多个心情/场景倾向 */
  moods: MoodId[];
  /** 多个健康关注（软偏好） */
  healthFocus: HealthFocusId[];

  // 基本信息（可全部跳过）
  sex?: Sex;
  ageBand?: AgeBand;
  /** 身高 cm */
  heightCm?: number;
  /** 体重 kg */
  weightKg?: number;
  /** 目标体重 kg（可选） */
  targetWeightKg?: number;

  /** 默认人数 / 预算 / 城市 */
  servings?: number;
  budgetPerMeal?: number;
  province?: string;
  city?: string;

  /** 创建时间戳 */
  createdAt: number;
  updatedAt: number;
}

const PERSONA_KEY = "chishenme.persona.v1";
const SETUP_KEY = "chishenme.persona.setup.v1";

export function loadPersona(): Persona | null {
  return readJSON<Persona | null>(PERSONA_KEY, null);
}

export function savePersona(p: Persona): void {
  writeJSON(PERSONA_KEY, { ...p, updatedAt: Date.now() });
}

export function clearPersona(): void {
  safeRemove(PERSONA_KEY);
  safeRemove(SETUP_KEY);
}

export function emptyPersona(): Persona {
  const now = Date.now();
  return { moods: [], healthFocus: [], createdAt: now, updatedAt: now };
}

export function hasPersonaSetupShown(): boolean {
  return readJSON<boolean>(SETUP_KEY, false) === true;
}

export function markPersonaSetupShown(): void {
  writeJSON(SETUP_KEY, true);
}

/** 从 persona.healthFocus 推算 recommend 的 healthFilter 软标签 */
export function personaHealthFilters(p: Persona | null): string[] {
  if (!p) return [];
  const out = new Set<string>();
  for (const id of p.healthFocus) {
    if (id === "diabetes" || id === "low-sugar") out.add("low-sugar");
    if (id === "hypertension" || id === "low-salt") out.add("low-salt");
    if (id === "low-fat") out.add("low-oil");
    if (id === "gout") out.add("low-purine");
    if (id === "elder") out.add("soft-easy-digest");
  }
  return Array.from(out);
}

/** 从 persona.moods 推断「快手」「下饭」「清爽」等场景能量提示 */
export function personaEnergyHints(p: Persona | null): string[] {
  if (!p) return [];
  const out = new Set<string>();
  for (const m of p.moods) {
    if (m === "busy") out.add("快手");
    if (m === "tired") out.add("暖胃");
    if (m === "happy") out.add("下饭");
    if (m === "light") out.add("清爽");
    if (m === "spicy") out.add("下饭");
  }
  return Array.from(out);
}

/**
 * 简化 BMI / BMR / TDEE / 推荐摄入估算。
 * 仅用作展示参考，绝非医学/营养建议。
 */
export interface PersonaPlanEstimate {
  bmi?: number;
  bmiBand?: "underweight" | "normal" | "overweight" | "obese";
  bmr?: number;
  tdeeRough?: number;
  /** 推荐每日摄入（默认按 maintain；fitness-cut 时 -15%） */
  dailyKcal?: number;
}

export function estimatePersonaPlan(p: Persona | null): PersonaPlanEstimate {
  if (!p || !p.heightCm || !p.weightKg) return {};
  const h = p.heightCm;
  const w = p.weightKg;
  const bmi = +(w / Math.pow(h / 100, 2)).toFixed(1);
  let bmiBand: PersonaPlanEstimate["bmiBand"] = "normal";
  if (bmi < 18.5) bmiBand = "underweight";
  else if (bmi >= 28) bmiBand = "obese";
  else if (bmi >= 24) bmiBand = "overweight";

  const ageMid: Record<AgeBand, number> = {
    "18-25": 22, "26-35": 30, "36-45": 40, "46-55": 50, "56+": 60,
  };
  const age = p.ageBand ? ageMid[p.ageBand] : 30;
  const sexAdj = p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78; // skip = 取中
  const bmr = Math.round(10 * w + 6.25 * h - 5 * age + sexAdj);
  const tdeeRough = Math.round(bmr * 1.4); // 默认轻度活动
  let dailyKcal = tdeeRough;
  if (p.role === "fitness-cut") dailyKcal = Math.round(tdeeRough * 0.85);

  return { bmi, bmiBand, bmr, tdeeRough, dailyKcal };
}
