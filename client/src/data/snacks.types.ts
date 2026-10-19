// 零食类型（拆分到独立文件，避免 generated.ts 循环依赖）。
// v6: 把过去会误导的「巧克力糖果」拆为「巧克力」+「糖果」，
//      把「酸奶乳品」拆为「酸奶」+「牛奶乳饮」。
//      老的合并标签保留为类型 union 的一部分，便于 generated.ts 中残留的旧值
//      在编译期通过；运行时 normalizeSnackCategory 会把它们重新映射成新的细分类目。

export type SnackCategory =
  | "饮料"
  | "无糖饮料"
  | "薯片膨化"
  | "饼干曲奇"
  | "面包糕点"
  | "巧克力"
  | "糖果"
  | "巧克力糖果"
  | "坚果"
  | "酸奶"
  | "牛奶乳饮"
  | "酸奶乳品"
  | "蛋白零食"
  | "肉脯肉干"
  | "果干蜜饯"
  | "速食冲泡"
  | "冰品冰淇淋";

export type SnackAudience =
  | "减脂"
  | "控糖"
  | "增肌"
  | "儿童"
  | "长辈"
  | "深夜"
  | "学生党"
  | "通勤"
  | "解压"
  | "朋友聚会";

export interface Snack {
  id: string;
  name: string;
  emoji: string;
  category: SnackCategory;
  calories: number;
  sugar?: number;
  fat?: number;
  protein?: number;
  price: string;
  audiences: SnackAudience[];
  reason: string;
  caution?: string;
  /** v3: 真实数据带的字段 */
  brand?: string;
  searchKeywords?: string[];
  confidence?: string;
}
