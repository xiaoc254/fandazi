// 外卖品牌类型（拆分到独立文件，避免 generated.ts 循环依赖 takeoutBrands.ts）。

export type TakeoutTaste =
  | "辣"
  | "麻辣"
  | "清淡"
  | "甜"
  | "咸鲜"
  | "酸辣"
  | "油腻"
  | "热量低";

export type TakeoutCategory =
  | "汉堡炸鸡"
  | "中式快餐"
  | "披萨意面"
  | "粉面"
  | "饭团便当"
  | "烤肉烧烤"
  | "饺子小笼"
  | "茶饮咖啡"
  | "奶茶饮品"
  | "小吃零嘴"
  | "火锅麻辣烫"
  | "粥早餐"
  | "甜品下午茶"
  | "海鲜日料"
  | "健康轻食"
  | "面包烘焙";

export interface TakeoutBrand {
  id: string;
  name: string;
  emoji: string;
  /** 渐变 fallback */
  gradient: [string, string];
  category: TakeoutCategory;
  budgetMin: number;
  budgetMax: number;
  peopleMin: number;
  peopleMax: number;
  tastes: TakeoutTaste[];
  intro: string;
  picks: { name: string; price?: string; cal?: string; note?: string }[];
  couponHint: string;
  calorieHint: string;
  citySpread: "全国" | "一二线" | "高线";
  scenes: ("一人食" | "工作餐" | "家庭聚餐" | "朋友聚会" | "下午茶" | "深夜")[];
  /** v3: 真实置信度 — A/B 真实品牌；C 仅作品类备选 */
  realTier?: "A" | "B" | "C";
  /** v3: 来源备注（榜单 / 媒体），用于「数据可信」展示 */
  sourceNote?: string;
}
