// 菜品可视化：
//  - 不使用网络照片。先前用 Unsplash 随机图，关键词命中无法核验，
//    实测出现「鸡肉菜显示 Tacos」之类的严重错配，反而误导用户。
//  - 现在统一返回「氛围图」：渐变背景 + emoji + 菜名覆盖 + 明确的「示意图」标识。
//  - 渐变与 emoji 由菜名/课程/菜系决定，多个相似菜也能保持视觉差异。

import type { Course, Cuisine } from "@/data/recipes";

export interface DishVisual {
  /** 主背景渐变色（from→to） */
  gradient: [string, string];
  /** 副渐变色（用于卡片底部装饰条） */
  accent: string;
  /** 主 emoji */
  emoji: string;
  /** 次 emoji（菜系角标） */
  badge: string;
  /** 关键字（用于 alt / debug） */
  query: string;
}

const COURSE_VISUAL: Record<Course, Omit<DishVisual, "query">> = {
  main: { gradient: ["#fbb273", "#c8552a"], accent: "#a13e1d", emoji: "🍱", badge: "🥢" },
  veggie: { gradient: ["#bce39a", "#5e9c45"], accent: "#3f7028", emoji: "🥗", badge: "🌿" },
  soup: { gradient: ["#f5c08d", "#a8794a"], accent: "#7a5532", emoji: "🍲", badge: "🥄" },
  staple: { gradient: ["#f5d97a", "#bd9445"], accent: "#8a6826", emoji: "🍜", badge: "🌾" },
};

const CUISINE_EMOJI: Partial<Record<Cuisine, string>> = {
  川菜: "🌶️",
  粤菜: "🦐",
  江浙: "🍤",
  鲁菜: "🥟",
  西北: "🌾",
  东北: "🥬",
  家常: "🏠",
};

// 关键字 → emoji。先匹配优先，命中靠前的更细。
const NAME_EMOJI: { keys: string[]; emoji: string }[] = [
  { keys: ["番茄炒蛋", "西红柿炒蛋"], emoji: "🍅" },
  { keys: ["番茄", "西红柿"], emoji: "🍅" },
  { keys: ["蛋花", "蛋汤", "炖蛋", "蒸蛋", "卤蛋", "皮蛋"], emoji: "🥚" },
  { keys: ["饺", "馄饨", "包子", "烧麦"], emoji: "🥟" },
  { keys: ["虾", "蟹", "贝", "蛤"], emoji: "🍤" },
  { keys: ["鱼"], emoji: "🐟" },
  { keys: ["鸡腿", "鸡翅", "宫保鸡", "口水鸡", "白斩鸡", "辣子鸡", "鸡丁", "鸡丝", "鸡块"], emoji: "🍗" },
  { keys: ["鸡"], emoji: "🍗" },
  { keys: ["牛"], emoji: "🥩" },
  { keys: ["羊"], emoji: "🍖" },
  { keys: ["排骨"], emoji: "🍖" },
  { keys: ["猪", "肉"], emoji: "🥓" },
  { keys: ["豆腐", "豆干", "腐竹"], emoji: "🟦" },
  { keys: ["茄"], emoji: "🍆" },
  { keys: ["土豆", "马铃薯"], emoji: "🥔" },
  { keys: ["黄瓜"], emoji: "🥒" },
  { keys: ["菠菜", "白菜", "青菜", "包菜", "生菜"], emoji: "🥬" },
  { keys: ["椒", "辣"], emoji: "🌶️" },
  { keys: ["蘑菇", "菌"], emoji: "🍄" },
  { keys: ["饭", "焖饭"], emoji: "🍚" },
  { keys: ["面", "粉条", "粉丝"], emoji: "🍜" },
  { keys: ["饼"], emoji: "🥞" },
  { keys: ["粥"], emoji: "🥣" },
  { keys: ["年糕"], emoji: "🍡" },
  { keys: ["汤", "羹"], emoji: "🍲" },
  { keys: ["玉米"], emoji: "🌽" },
  { keys: ["胡萝卜"], emoji: "🥕" },
  { keys: ["西兰花"], emoji: "🥦" },
  { keys: ["洋葱"], emoji: "🧅" },
];

/** djb2 hash → 非负整数。用来在多种渐变里挑一种，让相似菜也能拉开视觉差。 */
function stableHash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// 同 course 下也用一组色调微调，避免一屏全是同色。
const COURSE_TINTS: Record<Course, [string, string][]> = {
  main: [
    ["#fbb273", "#c8552a"],
    ["#f3a35a", "#b14a25"],
    ["#f29f58", "#9c4520"],
    ["#f0c179", "#a85a2c"],
  ],
  veggie: [
    ["#bce39a", "#5e9c45"],
    ["#cce8a4", "#6da94f"],
    ["#a8d97f", "#4f8a3a"],
    ["#bde6a3", "#629447"],
  ],
  soup: [
    ["#f5c08d", "#a8794a"],
    ["#f1bb86", "#9c6c40"],
    ["#f7c89a", "#aa7c4f"],
    ["#eebd8b", "#a5734a"],
  ],
  staple: [
    ["#f5d97a", "#bd9445"],
    ["#f1d273", "#b08a3c"],
    ["#fadf86", "#c69948"],
    ["#efce6e", "#aa863a"],
  ],
};

export function dishVisual(name: string, course: Course, cuisine: Cuisine): DishVisual {
  const base = COURSE_VISUAL[course];
  let emoji = base.emoji;
  for (const item of NAME_EMOJI) {
    if (item.keys.some((k) => name.includes(k))) {
      emoji = item.emoji;
      break;
    }
  }
  const tints = COURSE_TINTS[course];
  const gradient = tints[stableHash(name + cuisine) % tints.length];
  return {
    ...base,
    gradient,
    emoji,
    badge: CUISINE_EMOJI[cuisine] ?? base.badge,
    query: `${course},${cuisine}`,
  };
}

// === 多平台搜索 URL（保留原行为）===

export function bilibiliSearchUrl(name: string, customQuery?: string): string {
  const q = customQuery?.trim() || `${name} 做法`;
  return `https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`;
}

export function douyinSearchUrl(name: string, customQuery?: string): string {
  const q = customQuery?.trim() || `${name} 家常做法`;
  return `https://www.douyin.com/search/${encodeURIComponent(q)}`;
}

export function baiduSearchUrl(name: string, customQuery?: string): string {
  const q = customQuery?.trim() || `${name} 家常做法`;
  return `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
}

/** 兼容旧调用：旧 videoSearchUrl 等同于 bilibiliSearchUrl。 */
export function videoSearchUrl(name: string, customQuery?: string): string {
  return bilibiliSearchUrl(name, customQuery);
}

export interface SearchEntry {
  id: "bilibili" | "douyin" | "baidu";
  label: string;
  hint: string;
  url: string;
}

/** 一次性给出三个平台的搜索入口。 */
export function buildSearchEntries(name: string, customQuery?: string): SearchEntry[] {
  return [
    {
      id: "bilibili",
      label: "Bilibili 视频",
      hint: "看完整教程",
      url: bilibiliSearchUrl(name, customQuery),
    },
    {
      id: "douyin",
      label: "抖音短视频",
      hint: "看抖音做法",
      url: douyinSearchUrl(name, customQuery),
    },
    {
      id: "baidu",
      label: "百度搜索",
      hint: "看图文 / 知乎",
      url: baiduSearchUrl(name, customQuery),
    },
  ];
}
