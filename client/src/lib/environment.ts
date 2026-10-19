// 环境上下文：地区 / 天气 / 日期。
// 推荐评分的「软加分」输入。
// 用户可手动选择，也可通过浏览器定位 + 公开天气 API 自动填充（geoWeather.ts）。

import { readJSON, writeJSON } from "./storage";
import {
  PROVINCES,
  provinceToRegionTag,
  regionTagOfCity,
} from "./regions";

// 旧版 7 大区枚举依然保留（向后兼容历史 storage）；UI 已切到 province + city。
export type Region =
  | "华北"
  | "华东"
  | "华南"
  | "华中"
  | "西南"
  | "西北"
  | "东北"
  | "未指定";

export type Weather =
  | "热"
  | "冷"
  | "雨"
  | "晴"
  | "潮湿"
  | "干燥"
  | "未指定";

export type Season = "春" | "夏" | "秋" | "冬";

export type DayKind = "weekday" | "weekend";

export interface EnvContext {
  /** 兼容旧版：粗粒度大区（自动从 province / city 推导）。 */
  region: Region;
  /** 省份（v2 新增） */
  province?: string;
  /** 城市（v2 新增） */
  city?: string;
  weather: Weather;
  /** 当前真实温度（°C），来自 Open-Meteo（仅展示，不参与推荐） */
  temperatureC?: number;
  /** 是否由浏览器定位/天气 API 自动填充 */
  autoFilled?: boolean;
  /** 用户可选覆盖；不设置则按当前日期自动推断 */
  seasonOverride?: Season;
  /** 用户可选覆盖；不设置则按当前 Date 自动推断 */
  dayKindOverride?: DayKind;
  /** ISO 日期字符串（用户选择"今天"以外的日期可手动覆盖） */
  dateOverride?: string;
}

export const DEFAULT_ENV: EnvContext = {
  region: "未指定",
  weather: "未指定",
};

export const ALL_REGIONS: Region[] = ["未指定", "华北", "华东", "华南", "华中", "西南", "西北", "东北"];
export const ALL_WEATHERS: Weather[] = ["未指定", "热", "冷", "雨", "晴", "潮湿", "干燥"];
export const ALL_SEASONS: Season[] = ["春", "夏", "秋", "冬"];

export function inferSeason(date: Date = new Date()): Season {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return "春";
  if (m >= 6 && m <= 8) return "夏";
  if (m >= 9 && m <= 11) return "秋";
  return "冬";
}

export function inferDayKind(date: Date = new Date()): DayKind {
  const d = date.getDay();
  return d === 0 || d === 6 ? "weekend" : "weekday";
}

export interface ResolvedEnv extends EnvContext {
  season: Season;
  dayKind: DayKind;
  date: Date;
}

export function resolveEnv(env: EnvContext): ResolvedEnv {
  const date = env.dateOverride ? new Date(env.dateOverride) : new Date();
  const season = env.seasonOverride ?? inferSeason(date);
  const dayKind = env.dayKindOverride ?? inferDayKind(date);
  // 如果 region 没设但 province / city 有值，自动推断
  let region = env.region;
  if ((!region || region === "未指定") && env.province) {
    const t = provinceToRegionTag(env.province);
    if (t !== "未指定") region = t;
  }
  if ((!region || region === "未指定") && env.city) {
    const t = regionTagOfCity(env.city);
    if (t !== "未指定") region = t;
  }
  return { ...env, region, season, dayKind, date };
}

const ENV_KEY = "chishenme.env.v1";

export function loadEnv(): EnvContext {
  return readJSON<EnvContext>(ENV_KEY, DEFAULT_ENV);
}

export function saveEnv(env: EnvContext): void {
  writeJSON(ENV_KEY, env);
}

/** 重新导出常用列表，方便 UI 直接 import。 */
export { PROVINCES };
