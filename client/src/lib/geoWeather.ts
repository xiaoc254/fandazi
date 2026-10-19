// 浏览器定位 + 公开无 key 天气 API（Open-Meteo），用于「使用当前位置推荐」。
// 用户拒绝授权 / 浏览器不支持 / API 失败时，全部 graceful fallback：调用方负责回退到手动设置。
//
// 关键考虑：
//  - 静态站点（GitHub Pages）无后端，不能藏 API key —— 选用 Open-Meteo（开源、无需 key、CORS 允许）。
//  - 反向地理编码使用 BigDataCloud 的 client-free reverse-geocode endpoint（CORS 允许，限速宽松）。
//  - 任何阶段失败都返回 null，由调用方决定提示文案与回退路径。

import type { Weather } from "./environment";

export interface GeoPosition {
  lat: number;
  lon: number;
}

export interface GeoLocation extends GeoPosition {
  country?: string;
  province?: string;
  city?: string;
}

export interface CurrentWeather {
  /** 摄氏度 */
  temperatureC: number;
  /** WMO weather code, https://open-meteo.com/en/docs */
  code: number;
  /** 是否在下雨/雪/雾 */
  precip?: boolean;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function getCurrentPosition(timeoutMs = 8000): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("浏览器不支持定位"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600_000 },
    );
  });
}

/** 反向地理编码：调用 BigDataCloud 的免 key 端点（CORS 允许）。失败返回 null。 */
export async function reverseGeocode(pos: GeoPosition): Promise<GeoLocation | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.lat}&longitude=${pos.lon}&localityLanguage=zh`;
    const resp = await fetch(url, { method: "GET" });
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const province: string | undefined =
      data.principalSubdivision || data.localityInfo?.administrative?.[1]?.name;
    const city: string | undefined =
      data.city || data.locality || data.localityInfo?.administrative?.[2]?.name;
    return {
      ...pos,
      country: data.countryName,
      province,
      city,
    };
  } catch {
    return null;
  }
}

/** Open-Meteo 当前天气（无 key，CORS 允许）。失败返回 null。 */
export async function fetchCurrentWeather(pos: GeoPosition): Promise<CurrentWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&current=temperature_2m,weather_code,precipitation`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const cur = data.current;
    if (!cur) return null;
    return {
      temperatureC: Math.round(cur.temperature_2m),
      code: cur.weather_code,
      precip: (cur.precipitation ?? 0) > 0,
    };
  } catch {
    return null;
  }
}

/** 把 Open-Meteo 的天气信息映射到内部 Weather 标签（粗粒度）。 */
export function weatherTagFromCurrent(w: CurrentWeather): Weather {
  // 优先看 precip / weather_code（雨雪雾）
  // WMO codes: 51-67=雨/毛毛雨；71-77=雪；80-82=阵雨；95-99=雷暴；45-48=雾
  if (w.precip || (w.code >= 51 && w.code <= 99)) {
    if (w.code >= 71 && w.code <= 77) return "冷";
    return "雨";
  }
  if (w.temperatureC >= 28) return "热";
  if (w.temperatureC <= 8) return "冷";
  if (w.code === 0 || w.code === 1) return "晴";
  if (w.code === 45 || w.code === 48) return "潮湿";
  if (w.temperatureC >= 22) return "热";
  return "晴";
}

/** 一个完整的「定位 + 反向地理 + 天气」流程，可单独失败但不抛错。 */
export interface AutoLocateResult {
  position?: GeoPosition;
  location?: GeoLocation;
  weather?: CurrentWeather;
  weatherTag?: Weather;
  /** 失败原因，UI 可用来给提示 */
  error?: "denied" | "unsupported" | "timeout" | "network" | "unknown";
  errorMessage?: string;
}

export async function autoLocate(): Promise<AutoLocateResult> {
  const out: AutoLocateResult = {};
  if (!isGeolocationSupported()) {
    out.error = "unsupported";
    out.errorMessage = "你的浏览器不支持定位 API。";
    return out;
  }
  try {
    out.position = await getCurrentPosition();
  } catch (e: any) {
    if (e && typeof e === "object" && "code" in e) {
      const code = (e as GeolocationPositionError).code;
      if (code === 1) out.error = "denied";
      else if (code === 3) out.error = "timeout";
      else out.error = "network";
    } else {
      out.error = "unknown";
    }
    out.errorMessage = e?.message ?? "未能获取你的位置。";
    return out;
  }
  // 反向地理 / 天气并行
  const [loc, w] = await Promise.all([
    reverseGeocode(out.position),
    fetchCurrentWeather(out.position),
  ]);
  if (loc) out.location = loc;
  if (w) {
    out.weather = w;
    out.weatherTag = weatherTagFromCurrent(w);
  }
  return out;
}
