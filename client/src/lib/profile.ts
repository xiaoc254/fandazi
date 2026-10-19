// 本地用户档案 + 饮食计划 + 环境上下文。
// ⚠️ 健康相关字段（身高/体重/热量）仅作饮食规划参考，不构成医学/营养建议。
// 所有数据保存在浏览器本地（localStorage），不上传到任何服务器。

import type { Cuisine, Restriction, Taste } from "@/data/recipes";
import { readJSON, writeJSON, safeRemove } from "./storage";

export type Sex = "female" | "male";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "maintain" | "cut" | "bulk";
export type MealSlot = "breakfast" | "lunch" | "dinner";

export interface BodyInfo {
  sex: Sex;
  /** 年龄（岁） */
  age: number;
  /** 身高（cm） */
  heightCm: number;
  /** 体重（kg） */
  weightKg: number;
  activity: ActivityLevel;
  goal: GoalType;
}

export interface FlavorPreference {
  /** 喜爱的口味（任一命中加分） */
  liked: Taste[];
  /** 不喜欢的口味（命中扣分；不会硬过滤） */
  disliked: Taste[];
  /** 偏好菜系（不限即空） */
  cuisines: Cuisine[];
  /** 忌口（硬过滤） */
  restrictions: Restriction[];
}

export interface PlanResult {
  /** 基础代谢率 kcal/day */
  bmr: number;
  /** 总日消耗 kcal/day */
  tdee: number;
  /** 调整目标后的每日推荐摄入 kcal/day */
  targetCalories: number;
  /** 目标餐次摄入 kcal */
  mealCalories: number;
  /** 当前选择的餐次 */
  slot: MealSlot;
  /** 餐次占日热量比例 */
  slotShare: number;
}

export interface Profile {
  /** 内部 id（uuid 风格） */
  id: string;
  /** 昵称 */
  nickname: string;
  body?: BodyInfo;
  flavor: FlavorPreference;
  /** 选择的餐次（默认晚餐） */
  slot: MealSlot;
  /** 是否启用饮食计划 */
  planEnabled: boolean;
  /** 创建时间戳 */
  createdAt: number;
  /** 最近更新 */
  updatedAt: number;
}

const PROFILES_KEY = "chishenme.profiles.v1";
const ACTIVE_KEY = "chishenme.activeProfile.v1";

export const DEFAULT_FLAVOR: FlavorPreference = {
  liked: [],
  disliked: [],
  cuisines: [],
  restrictions: [],
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "几乎不动 (久坐)",
  light: "轻度活动 (1-3 天/周)",
  moderate: "中度活动 (3-5 天/周)",
  active: "较多活动 (6-7 天/周)",
  very_active: "高强度运动/体力劳动",
};

export const GOAL_LABELS: Record<GoalType, string> = {
  maintain: "维持体重",
  cut: "减脂 (-15%)",
  bulk: "增肌 (+10%)",
};

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export const SLOT_DEFAULT_SHARE: Record<MealSlot, number> = {
  breakfast: 0.25,
  lunch: 0.4,
  dinner: 0.35,
};

// === BMR / TDEE / 目标摄入 ===
// Mifflin-St Jeor 公式：
//   男性 BMR = 10 * 体重(kg) + 6.25 * 身高(cm) - 5 * 年龄 + 5
//   女性 BMR = 10 * 体重(kg) + 6.25 * 身高(cm) - 5 * 年龄 - 161
export function computePlan(body: BodyInfo, slot: MealSlot): PlanResult {
  const base = 10 * body.weightKg + 6.25 * body.heightCm - 5 * body.age;
  const bmr = Math.round(base + (body.sex === "male" ? 5 : -161));
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[body.activity]);
  let targetCalories = tdee;
  if (body.goal === "cut") targetCalories = Math.round(tdee * 0.85);
  if (body.goal === "bulk") targetCalories = Math.round(tdee * 1.1);
  const slotShare = SLOT_DEFAULT_SHARE[slot];
  const mealCalories = Math.round(targetCalories * slotShare);
  return { bmr, tdee, targetCalories, mealCalories, slot, slotShare };
}

// === Profile CRUD ===
function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      // 继续到 fallback
    }
  }
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listProfiles(): Profile[] {
  return readJSON<Profile[]>(PROFILES_KEY, []);
}

export function getActiveProfileId(): string | null {
  return readJSON<string | null>(ACTIVE_KEY, null);
}

export function setActiveProfileId(id: string | null): void {
  if (id) writeJSON(ACTIVE_KEY, id);
  else safeRemove(ACTIVE_KEY);
}

export function getActiveProfile(): Profile | null {
  const id = getActiveProfileId();
  if (!id) return null;
  return listProfiles().find((p) => p.id === id) ?? null;
}

export function createProfile(nickname: string): Profile {
  const now = Date.now();
  const profile: Profile = {
    id: genId(),
    nickname: nickname.trim() || "我",
    flavor: { ...DEFAULT_FLAVOR },
    slot: "dinner",
    planEnabled: false,
    createdAt: now,
    updatedAt: now,
  };
  const next = [...listProfiles(), profile];
  writeJSON(PROFILES_KEY, next);
  setActiveProfileId(profile.id);
  return profile;
}

export function saveProfile(profile: Profile): void {
  const all = listProfiles();
  const idx = all.findIndex((p) => p.id === profile.id);
  const updated = { ...profile, updatedAt: Date.now() };
  if (idx === -1) all.push(updated);
  else all[idx] = updated;
  writeJSON(PROFILES_KEY, all);
}

export function deleteProfile(id: string): void {
  const next = listProfiles().filter((p) => p.id !== id);
  writeJSON(PROFILES_KEY, next);
  if (getActiveProfileId() === id) {
    setActiveProfileId(next[0]?.id ?? null);
  }
}

/**
 * 把 Persona（首次弹窗 / 个性化 Tab 的数据）合并到 active Profile.body。
 * 用途：让首次弹窗保存后，「我的档案」里也能看到对应的身高/体重/性别等。
 * 没有 active profile 时会自动创建一个昵称为 "我" 的本地档案。
 */
export function syncPersonaToProfile(persona: {
  sex?: "male" | "female" | "skip";
  ageBand?: "18-25" | "26-35" | "36-45" | "46-55" | "56+";
  heightCm?: number;
  weightKg?: number;
}): Profile | null {
  const hasAnyBodyField =
    persona.heightCm != null ||
    persona.weightKg != null ||
    persona.sex != null ||
    persona.ageBand != null;
  if (!hasAnyBodyField) {
    // 没有身体相关字段，无需同步
    return getActiveProfile();
  }

  const ageMid = {
    "18-25": 22, "26-35": 30, "36-45": 40, "46-55": 50, "56+": 60,
  } as const;

  let active = getActiveProfile();
  if (!active) {
    active = createProfile("我");
  }
  const personaSex: Sex | undefined =
    persona.sex === "male" ? "male" : persona.sex === "female" ? "female" : undefined;
  const mergedBody: BodyInfo = {
    sex: personaSex ?? active.body?.sex ?? "female",
    age: persona.ageBand ? ageMid[persona.ageBand] : active.body?.age ?? 28,
    heightCm: persona.heightCm ?? active.body?.heightCm ?? 165,
    weightKg: persona.weightKg ?? active.body?.weightKg ?? 60,
    activity: active.body?.activity ?? "light",
    goal: active.body?.goal ?? "maintain",
  };
  const updated: Profile = { ...active, body: mergedBody };
  saveProfile(updated);
  return updated;
}
