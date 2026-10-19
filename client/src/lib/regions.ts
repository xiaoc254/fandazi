// 省份 + 城市选择（替代旧的 7 大区粗粒度选择）。
// 内部仍映射回 RegionTag，以兼容已有的「区域加分」推荐逻辑。
// 列表覆盖 34 个省级行政区 + 主要省会/直辖市/副省级城市（不要求覆盖全国所有县区）。

import type { RegionTag } from "@/data/recipes";

export interface ProvinceDef {
  /** 省/直辖市/特区名 */
  province: string;
  /** 大区映射 */
  region: RegionTag;
  /** 主要城市（排序后第一位会作为默认城市） */
  cities: string[];
}

export const PROVINCES: ProvinceDef[] = [
  { province: "北京", region: "华北", cities: ["北京"] },
  { province: "天津", region: "华北", cities: ["天津"] },
  { province: "河北", region: "华北", cities: ["石家庄", "唐山", "保定", "秦皇岛", "邯郸", "廊坊"] },
  { province: "山西", region: "华北", cities: ["太原", "大同", "临汾", "运城", "晋中"] },
  { province: "内蒙古", region: "华北", cities: ["呼和浩特", "包头", "鄂尔多斯", "赤峰"] },
  { province: "辽宁", region: "东北", cities: ["沈阳", "大连", "鞍山", "丹东", "抚顺"] },
  { province: "吉林", region: "东北", cities: ["长春", "吉林", "延吉"] },
  { province: "黑龙江", region: "东北", cities: ["哈尔滨", "齐齐哈尔", "大庆", "牡丹江"] },
  { province: "上海", region: "华东", cities: ["上海"] },
  { province: "江苏", region: "华东", cities: ["南京", "苏州", "无锡", "常州", "南通", "扬州", "徐州"] },
  { province: "浙江", region: "华东", cities: ["杭州", "宁波", "温州", "绍兴", "嘉兴", "金华"] },
  { province: "安徽", region: "华东", cities: ["合肥", "芜湖", "马鞍山", "黄山"] },
  { province: "福建", region: "华东", cities: ["福州", "厦门", "泉州", "漳州"] },
  { province: "江西", region: "华东", cities: ["南昌", "九江", "赣州", "上饶"] },
  { province: "山东", region: "华东", cities: ["济南", "青岛", "烟台", "潍坊", "威海", "淄博"] },
  { province: "河南", region: "华中", cities: ["郑州", "洛阳", "开封", "新乡", "南阳"] },
  { province: "湖北", region: "华中", cities: ["武汉", "宜昌", "襄阳", "黄石"] },
  { province: "湖南", region: "华中", cities: ["长沙", "株洲", "湘潭", "衡阳", "岳阳"] },
  { province: "广东", region: "华南", cities: ["广州", "深圳", "珠海", "佛山", "东莞", "中山", "汕头"] },
  { province: "广西", region: "华南", cities: ["南宁", "柳州", "桂林", "北海"] },
  { province: "海南", region: "华南", cities: ["海口", "三亚"] },
  { province: "重庆", region: "西南", cities: ["重庆"] },
  { province: "四川", region: "西南", cities: ["成都", "绵阳", "德阳", "宜宾", "南充"] },
  { province: "贵州", region: "西南", cities: ["贵阳", "遵义", "六盘水"] },
  { province: "云南", region: "西南", cities: ["昆明", "大理", "丽江", "曲靖"] },
  { province: "西藏", region: "西南", cities: ["拉萨", "日喀则"] },
  { province: "陕西", region: "西北", cities: ["西安", "咸阳", "宝鸡", "渭南"] },
  { province: "甘肃", region: "西北", cities: ["兰州", "天水", "酒泉"] },
  { province: "青海", region: "西北", cities: ["西宁", "海东"] },
  { province: "宁夏", region: "西北", cities: ["银川", "石嘴山"] },
  { province: "新疆", region: "西北", cities: ["乌鲁木齐", "喀什", "伊犁", "石河子"] },
  { province: "台湾", region: "华东", cities: ["台北", "高雄", "台中"] },
  { province: "香港", region: "华南", cities: ["香港"] },
  { province: "澳门", region: "华南", cities: ["澳门"] },
];

export function findProvinceByName(name?: string | null): ProvinceDef | null {
  if (!name) return null;
  const norm = name.replace(/省|市|自治区|特别行政区|维吾尔|回族|壮族|藏族/g, "").trim();
  return PROVINCES.find(
    (p) =>
      p.province === name ||
      p.province === norm ||
      norm.includes(p.province) ||
      p.province.includes(norm),
  ) ?? null;
}

export function findProvinceByCity(city?: string | null): ProvinceDef | null {
  if (!city) return null;
  const norm = city.replace(/市|区|县|新区/g, "").trim();
  for (const p of PROVINCES) {
    if (p.cities.some((c) => c === city || c === norm || norm.includes(c) || c.includes(norm))) {
      return p;
    }
  }
  return null;
}

/** 把省份映射到 RegionTag；找不到 → "未指定" */
export function provinceToRegionTag(province?: string | null): RegionTag | "未指定" {
  const p = findProvinceByName(province);
  return p ? p.region : "未指定";
}

export function regionTagOfCity(city?: string | null): RegionTag | "未指定" {
  const p = findProvinceByCity(city);
  return p ? p.region : "未指定";
}
