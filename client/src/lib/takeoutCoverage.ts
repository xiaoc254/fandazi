// 外卖地区覆盖：根据城市 / 省份判断品牌是否值得推荐。
// 不接平台实时门店 API，用品牌简介 + 城市铺货口径做「本地可点」软判断。
// 全国连锁永远可点；区域品牌出了主场会降权，但不让结果空白。

import type { TakeoutBrand } from "../data/takeoutBrands.types";
import type { RegionTag } from "../data/recipes";
import {
  PROVINCES,
  findProvinceByCity,
  findProvinceByName,
  type ProvinceDef,
} from "./regions";

// 注意：这里刻意不引入 data/cityFoods。
// takeoutBrands → takeoutCoverage 在首屏主链上（manualChunks 把 takeout.ts 与
// takeoutBrands.ts 合并成 data-takeout），一旦这里依赖 cityFoods，
// 首屏就会白白预加载那 18KB 城市美食数据。
// 「本地特色菜」相关逻辑因此在 ./takeoutLocalDishes 里单独实现。

export type CoverageLevel =
  | "local"
  | "province"
  | "region"
  | "national"
  | "tier"
  | "rare"
  | "unknown";

export interface BrandCoverage {
  cities: string[];
  provinces: string[];
  regions: RegionTag[];
  national: boolean;
  highTierOnly: boolean;
  origin?: string;
}

export interface CoverageMatch {
  level: CoverageLevel;
  score: number;
  label: string;
  reason: string;
  available: boolean;
}

export interface TakeoutPlace {
  city?: string;
  province?: string;
  region?: RegionTag;
  tier: "t1" | "t2" | "other";
}

const T1 = new Set([
  "北京", "上海", "广州", "深圳", "杭州", "成都", "重庆", "武汉",
  "南京", "西安", "天津", "苏州", "长沙", "郑州", "青岛", "宁波",
  "东莞", "佛山", "合肥", "无锡",
]);

const T2 = new Set([
  "厦门", "福州", "济南", "大连", "沈阳", "昆明", "哈尔滨", "长春",
  "南昌", "石家庄", "太原", "南宁", "贵阳", "兰州", "乌鲁木齐", "海口",
  "呼和浩特", "银川", "西宁", "拉萨", "温州", "泉州", "珠海", "中山",
  "嘉兴", "常州", "南通", "徐州", "烟台", "洛阳", "唐山", "保定",
  "金华", "绍兴", "台州", "廊坊", "扬州", "镇江", "惠州", "汕头",
]);

const REGION_WORDS: [RegExp, RegionTag][] = [
  [/华北|京津冀/, "华北"],
  [/华东|长三角|江浙沪/, "华东"],
  [/华南|珠三角|两广/, "华南"],
  [/华中|中部/, "华中"],
  [/西南|川渝|成渝|云贵/, "西南"],
  [/西北|丝路/, "西北"],
  [/东北|关东/, "东北"],
];

function stripPlace(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/省|市|自治区|特别行政区|维吾尔|回族|壮族|藏族|盟|州|地区/g, "")
    .replace(/新区|区|县/g, "")
    .trim();
}

export function samePlace(a?: string | null, b?: string | null): boolean {
  const x = stripPlace(a);
  const y = stripPlace(b);
  if (!x || !y) return false;
  return x === y || x.includes(y) || y.includes(x);
}

function cityTier(city?: string): TakeoutPlace["tier"] {
  const n = stripPlace(city);
  if (!n) return "other";
  if (T1.has(n) || Array.from(T1).some((c) => n.includes(c))) return "t1";
  if (T2.has(n) || Array.from(T2).some((c) => n.includes(c))) return "t2";
  return "other";
}

export function resolveTakeoutPlace(
  city?: string | null,
  province?: string | null,
): TakeoutPlace {
  const cleanCity = city && city !== "不限" && city !== "其他" ? city : undefined;
  const byCity = findProvinceByCity(cleanCity);
  const byProv = findProvinceByName(province);
  const def: ProvinceDef | null = byCity ?? byProv;
  return {
    city: cleanCity,
    province: def?.province ?? (province || undefined),
    region: def?.region,
    tier: cityTier(cleanCity),
  };
}

const cache = new WeakMap<TakeoutBrand, BrandCoverage>();

export function inferCoverage(brand: TakeoutBrand): BrandCoverage {
  const hit = cache.get(brand);
  if (hit) return hit;

  const text = `${brand.name}。${brand.intro}`;
  const cities = new Set<string>();
  const provinces = new Set<string>();
  const regions = new Set<RegionTag>();
  let origin: string | undefined;

  for (const p of PROVINCES) {
    if (text.includes(p.province)) {
      provinces.add(p.province);
      regions.add(p.region);
    }
    for (const c of p.cities) {
      if (c.length >= 2 && text.includes(c)) {
        cities.add(c);
        provinces.add(p.province);
        regions.add(p.region);
      }
    }
  }

  if (/川渝|成渝/.test(text)) {
    provinces.add("四川");
    provinces.add("重庆");
    regions.add("西南");
  }
  if (text.includes("粤式") || text.includes("广式") || text.includes("潮汕")) {
    provinces.add("广东");
    regions.add("华南");
  }
  if (text.includes("本帮") || text.includes("沪上") || text.includes("魔都")) {
    cities.add("上海");
    provinces.add("上海");
    regions.add("华东");
  }
  if (text.includes("京味") || text.includes("老北京") || text.includes("北派")) {
    cities.add("北京");
    provinces.add("北京");
    regions.add("华北");
  }

  for (const [re, tag] of REGION_WORDS) {
    if (re.test(text)) regions.add(tag);
  }

  const originHit = text.match(/([\u4e00-\u9fa5]{2,6})起家/);
  if (originHit) origin = originHit[1];

  const mentionsNational = /全国/.test(brand.intro) || /全国/.test(brand.name);
  const strongLocal =
    /(为主|连锁|老字号)/.test(brand.intro) &&
    (cities.size > 0 || provinces.size > 0 || regions.size > 0);
  const national = mentionsNational || (brand.citySpread === "全国" && !strongLocal);
  const highTierOnly =
    brand.citySpread === "一二线" ||
    brand.citySpread === "高线" ||
    /一线|二线/.test(brand.intro);

  const cov: BrandCoverage = {
    cities: Array.from(cities),
    provinces: Array.from(provinces),
    regions: Array.from(regions),
    national,
    highTierOnly,
    origin,
  };
  cache.set(brand, cov);
  return cov;
}

function originLabel(cov: BrandCoverage): string {
  if (cov.origin) return cov.origin;
  if (cov.cities[0]) return cov.cities[0];
  if (cov.provinces[0]) return cov.provinces[0];
  if (cov.regions[0]) return cov.regions[0];
  return "部分城市";
}

/**
 * 用「已解析好的 place」匹配覆盖度。
 * 与 matchCoverage 逻辑一致，但省掉重复的省份解析 —— pickTakeout 需要对 300+ 品牌
 * 逐个打分，每次都重新 resolveTakeoutPlace（内部要遍历 34 个省）会明显拖慢。
 */
export function matchCoverageForPlace(
  brand: TakeoutBrand,
  place: TakeoutPlace,
): CoverageMatch {
  return matchCoverageCore(brand, inferCoverage(brand), place);
}

export function matchCoverage(
  brand: TakeoutBrand,
  city?: string | null,
  province?: string | null,
): CoverageMatch {
  return matchCoverageForPlace(brand, resolveTakeoutPlace(city, province));
}

function matchCoverageCore(
  brand: TakeoutBrand,
  cov: BrandCoverage,
  place: TakeoutPlace,
): CoverageMatch {
  if (!place.city && !place.province) {
    if (cov.national) {
      return {
        level: "national",
        score: 6,
        label: "全国连锁",
        reason: "未选城市时优先全国覆盖品牌",
        available: true,
      };
    }
    return {
      level: "unknown",
      score: 1,
      label: "区域品牌",
      reason: "选城市后会按本地覆盖重新排序",
      available: true,
    };
  }

  const cityHit = !!(place.city && cov.cities.some((c) => samePlace(c, place.city)));
  const provHit = !!(place.province && cov.provinces.some((p) => samePlace(p, place.province)));
  const regionHit = !!(place.region && cov.regions.includes(place.region));

  if (cityHit) {
    return {
      level: "local",
      score: 34,
      label: `${place.city}本地常见`,
      reason: `${brand.name} 在${place.city}门店更密，外卖更好点到`,
      available: true,
    };
  }
  if (provHit) {
    return {
      level: "province",
      score: 22,
      label: `${place.province}常见`,
      reason: `这是${place.province}常见连锁，本城通常能搜到`,
      available: true,
    };
  }
  if (regionHit) {
    return {
      level: "region",
      score: 14,
      label: `${place.region}常见`,
      reason: `在${place.region}铺得开，作为本地口味备选更稳`,
      available: true,
    };
  }
  if (cov.national) {
    return {
      level: "national",
      score: 8,
      label: "全国连锁",
      reason: "大多数城市都能点到，当作保底更稳",
      available: true,
    };
  }
  if (cov.regions.length && place.region && !regionHit && !cov.national) {
    return {
      level: "rare",
      score: -18,
      label: "外地连锁",
      reason: `主要在${originLabel(cov)}，${place.city ?? place.province}不一定能点到`,
      available: false,
    };
  }
  if (cov.highTierOnly && (place.tier === "t1" || place.tier === "t2")) {
    return {
      level: "tier",
      score: 10,
      label: "一二线常见",
      reason: "这类品牌多开在一二线，当前城市一般能搜到",
      available: true,
    };
  }
  if (cov.highTierOnly) {
    return {
      level: "rare",
      score: -8,
      label: "该地可能较少",
      reason: "偏一二线品牌，下沉城市门店不一定全",
      available: true,
    };
  }
  if (cov.cities.length || cov.provinces.length || cov.regions.length) {
    return {
      level: "rare",
      score: -26,
      label: "本地较少见",
      reason: `主要在${originLabel(cov)}，${place.city ?? place.province}门店可能不多`,
      available: false,
    };
  }
  return {
    level: "unknown",
    score: 3,
    label: "连锁品牌",
    reason: "覆盖信息不完整，建议先搜索确认门店",
    available: true,
  };
}

export function coverageTone(level: CoverageLevel): string {
  if (level === "local" || level === "province") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200";
  }
  if (level === "region" || level === "national" || level === "tier") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200";
  }
  if (level === "rare") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  }
  return "border-border bg-muted/60 text-muted-foreground";
}

export function localHotBrandNames(
  brands: TakeoutBrand[],
  city?: string | null,
  province?: string | null,
  limit = 8,
): TakeoutBrand[] {
  const scored = brands
    .map((b) => ({ b, m: matchCoverage(b, city, province) }))
    .filter((x) => x.m.level === "local" || x.m.level === "province")
    .sort((a, b) => b.m.score - a.m.score);
  const out: TakeoutBrand[] = [];
  const seen = new Set<string>();
  for (const x of scored) {
    if (seen.has(x.b.name)) continue;
    seen.add(x.b.name);
    out.push(x.b);
    if (out.length >= limit) break;
  }
  return out;
}
