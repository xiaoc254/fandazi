// 多场景模块：每个场景预设了人数 / 餐次 / 难度 / 时间 / 口味偏好等。
// 模块名称中性友好（不使用「家庭主妇」等词），覆盖常见做饭场景。

import type { Difficulty, Restriction, Taste } from "@/data/recipes";
import type { MealSlot } from "./profile";
import type { Preferences } from "./recommend";

export type ScenarioId =
  | "personal-cut"
  | "family-dinner"
  | "quick-work"
  | "kid-friendly"
  | "elder-light"
  | "fitness-bulk"
  | "weekend-cook";

export interface ScenarioPreset {
  id: ScenarioId;
  /** 中性友好的展示名 */
  label: string;
  /** 一句话场景描述 */
  description: string;
  /** Emoji，用作 tab/卡片图标 */
  emoji: string;
  /** 默认人数 */
  defaultServings: number;
  /** 默认餐次 */
  defaultSlot: MealSlot;
  /** 默认时间上限（分钟） */
  defaultMaxTime: number;
  /** 默认主菜数 */
  defaultMainCount: number;
  /** 默认是否带汤 / 素菜 */
  defaultWithSoup: boolean;
  defaultWithVeggie: boolean;
  /** 默认难度（空 = 不限） */
  defaultDifficulties: Difficulty[];
  /** 倾向口味（仅作软偏好） */
  preferTastes: Taste[];
  /** 默认忌口（如「儿童友好」会自动加无辣） */
  defaultRestrictions: Restriction[];
  /** 餐次目标热量软系数：基础 1，越大表示这个场景对热量越敏感 */
  caloriePriority: number;
  /** 评分调权：偏好快手 / 慢炖 / 健康清淡 等。 */
  energyHints: ("快手" | "慢炖" | "暖胃" | "清爽" | "下饭")[];
  /** 桌面结构性偏好（v7）。
   * - family: 一桌多人，主菜+素+汤+主食组合，避免清一色凉拌；
   * - elder: 长辈友好，软烂蒸炖优先但仍需热菜+蛋白；
   * - kid: 儿童友好，避免全辣/骨刺多，蛋白+蔬菜均衡；
   * - solo: 单人控卡，无需「一桌结构」。
   */
  tableStyle?: "family" | "elder" | "kid" | "solo";
}

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: "personal-cut",
    label: "个人控卡",
    description: "一个人吃，注重热量、清淡、营养均衡。",
    emoji: "🥗",
    defaultServings: 1,
    defaultSlot: "dinner",
    defaultMaxTime: 30,
    defaultMainCount: 1,
    defaultWithSoup: false,
    defaultWithVeggie: true,
    defaultDifficulties: ["简单", "中等"],
    preferTastes: ["清淡", "咸鲜"],
    defaultRestrictions: [],
    caloriePriority: 1.6,
    energyHints: ["清爽", "快手"],
    tableStyle: "solo",
  },
  {
    id: "family-dinner",
    label: "全家晚餐",
    description: "三四口人晚饭，主菜 + 素 + 汤，尝试不同菜系。",
    emoji: "🍱",
    defaultServings: 4,
    defaultSlot: "dinner",
    defaultMaxTime: 60,
    defaultMainCount: 2,
    defaultWithSoup: true,
    defaultWithVeggie: true,
    defaultDifficulties: [],
    preferTastes: ["咸鲜", "酸甜"],
    defaultRestrictions: [],
    caloriePriority: 0.9,
    energyHints: ["下饭", "暖胃"],
    tableStyle: "family",
  },
  {
    id: "quick-work",
    label: "快手上班餐",
    description: "工作日下班后 30 分钟内搞定，一菜一汤。",
    emoji: "⏱️",
    defaultServings: 2,
    defaultSlot: "dinner",
    defaultMaxTime: 25,
    defaultMainCount: 1,
    defaultWithSoup: false,
    defaultWithVeggie: true,
    defaultDifficulties: ["简单"],
    preferTastes: ["咸鲜"],
    defaultRestrictions: [],
    caloriePriority: 1.0,
    energyHints: ["快手"],
    tableStyle: "solo",
  },
  {
    id: "kid-friendly",
    label: "儿童友好",
    description: "适合小朋友：不辣、清淡、营养均衡、易咀嚼。",
    emoji: "🧒",
    defaultServings: 3,
    defaultSlot: "dinner",
    defaultMaxTime: 45,
    defaultMainCount: 1,
    defaultWithSoup: true,
    defaultWithVeggie: true,
    defaultDifficulties: ["简单", "中等"],
    preferTastes: ["酸甜", "清淡", "咸鲜"],
    defaultRestrictions: ["无辣"],
    caloriePriority: 0.9,
    energyHints: ["暖胃", "清爽"],
    tableStyle: "kid",
  },
  {
    id: "elder-light",
    label: "长辈清淡",
    description: "适合长辈：清淡、好咀嚼、暖胃，少油少辣。",
    emoji: "👴",
    defaultServings: 2,
    defaultSlot: "dinner",
    defaultMaxTime: 50,
    defaultMainCount: 1,
    defaultWithSoup: true,
    defaultWithVeggie: true,
    defaultDifficulties: ["简单", "中等"],
    preferTastes: ["清淡", "咸鲜"],
    defaultRestrictions: ["无辣"],
    caloriePriority: 1.0,
    energyHints: ["暖胃", "清爽"],
    tableStyle: "elder",
  },
  {
    id: "fitness-bulk",
    label: "健身增肌",
    description: "高蛋白、高热量、节奏感强，午晚餐均可。",
    emoji: "💪",
    defaultServings: 1,
    defaultSlot: "lunch",
    defaultMaxTime: 35,
    defaultMainCount: 2,
    defaultWithSoup: false,
    defaultWithVeggie: true,
    defaultDifficulties: ["简单", "中等"],
    preferTastes: ["咸鲜"],
    defaultRestrictions: [],
    caloriePriority: 1.4,
    energyHints: ["下饭"],
    tableStyle: "solo",
  },
  {
    id: "weekend-cook",
    label: "周末下厨",
    description: "周末有时间慢炖、试新菜、给家人惊喜。",
    emoji: "👨‍🍳",
    defaultServings: 4,
    defaultSlot: "dinner",
    defaultMaxTime: 100,
    defaultMainCount: 2,
    defaultWithSoup: true,
    defaultWithVeggie: true,
    defaultDifficulties: ["中等", "进阶"],
    preferTastes: ["咸鲜", "酸甜", "麻辣"],
    defaultRestrictions: [],
    caloriePriority: 0.8,
    energyHints: ["慢炖", "下饭"],
    tableStyle: "family",
  },
];

export const DEFAULT_SCENARIO: ScenarioId = "family-dinner";

export function getScenario(id: ScenarioId): ScenarioPreset {
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

/** 把场景预设合并进 prefs（不覆盖用户在 chips 上选过的具体口味/菜系） */
export function applyScenarioToPrefs(
  prefs: Preferences,
  scenarioId: ScenarioId,
): Preferences {
  const s = getScenario(scenarioId);
  const mergedRestrictions = Array.from(
    new Set([...prefs.restrictions, ...s.defaultRestrictions]),
  );
  return {
    ...prefs,
    servings: s.defaultServings,
    maxTimeMinutes: s.defaultMaxTime,
    mainCount: s.defaultMainCount,
    withSoup: s.defaultWithSoup,
    withVeggie: s.defaultWithVeggie,
    difficulties: s.defaultDifficulties,
    restrictions: mergedRestrictions,
    // tastes / cuisines 不强行覆盖：用户随机选过就保留
    tastes: prefs.tastes.length > 0 ? prefs.tastes : [],
  };
}

const SCENARIO_KEY = "chishenme.scenario.v1";
const ONBOARDED_KEY = "chishenme.onboarded.v1";

import { readJSON, writeJSON, safeGet, safeSet } from "./storage";

export function loadScenario(): ScenarioId {
  return readJSON<ScenarioId>(SCENARIO_KEY, DEFAULT_SCENARIO);
}

export function saveScenario(id: ScenarioId): void {
  writeJSON(SCENARIO_KEY, id);
}

export function hasOnboarded(): boolean {
  return safeGet(ONBOARDED_KEY) === "1";
}

export function markOnboarded(): void {
  safeSet(ONBOARDED_KEY, "1");
}
