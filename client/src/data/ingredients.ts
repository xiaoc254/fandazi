// 食材主数据：用于在菜品详情中估算热量和价格，并提供稳定的可视化（emoji + 渐变色）。
// 数据来源参考：USDA/FDC、中国食物成分表（人卫第六版）、社区菜场零售均价（2024-2025）。
// 数值为每 100g 估算，单位：卡路里 (kcal) / 元（人民币）。仅供参考。

export interface IngredientInfo {
  /** 用于匹配 Recipe.ingredients[i].name 中的关键字（包含匹配） */
  keys: string[];
  /** 标准化展示名 */
  name: string;
  /** 每 100g 热量 kcal */
  caloriesPer100g: number;
  /** 每公斤价格（元，含损耗的市场零售估算） */
  pricePerKg: number;
  /** 视觉 emoji，作为食材图 fallback */
  emoji: string;
  /** 视觉渐变色（CSS 颜色 from→to） */
  gradient: [string, string];
  /** 该食材买菜归类（与 IngredientCategory 对齐） */
  category: "蔬菜" | "肉蛋豆制品" | "调味/主食";
}

// 主表（按使用频率/匹配优先级；越前面越优先）
// 注意：keys 顺序很重要 — `lookupIngredient` 用「最长匹配优先」选最具体的条目。
export const INGREDIENT_TABLE: IngredientInfo[] = [
  // ===== 蔬菜 =====
  { keys: ["番茄", "西红柿"], name: "番茄", caloriesPer100g: 19, pricePerKg: 6, emoji: "🍅", gradient: ["#ff7a59", "#e64b3a"], category: "蔬菜" },
  { keys: ["黄瓜"], name: "黄瓜", caloriesPer100g: 16, pricePerKg: 5, emoji: "🥒", gradient: ["#a4e08a", "#6aa84f"], category: "蔬菜" },
  { keys: ["土豆", "马铃薯"], name: "土豆", caloriesPer100g: 81, pricePerKg: 4, emoji: "🥔", gradient: ["#e2c08d", "#b08151"], category: "蔬菜" },
  { keys: ["茄子"], name: "茄子", caloriesPer100g: 23, pricePerKg: 7, emoji: "🍆", gradient: ["#a06cd5", "#5d3a91"], category: "蔬菜" },
  { keys: ["青椒", "尖椒", "螺丝椒"], name: "青椒", caloriesPer100g: 22, pricePerKg: 8, emoji: "🫑", gradient: ["#7ed957", "#3f9d2b"], category: "蔬菜" },
  { keys: ["彩椒", "红椒"], name: "彩椒", caloriesPer100g: 26, pricePerKg: 10, emoji: "🌶️", gradient: ["#ff6b3d", "#c92e1f"], category: "蔬菜" },
  { keys: ["小米辣", "辣椒"], name: "辣椒", caloriesPer100g: 40, pricePerKg: 16, emoji: "🌶️", gradient: ["#ff5640", "#a91515"], category: "蔬菜" },
  { keys: ["洋葱"], name: "洋葱", caloriesPer100g: 40, pricePerKg: 4, emoji: "🧅", gradient: ["#f5d6c0", "#b07a5b"], category: "蔬菜" },
  { keys: ["大葱"], name: "大葱", caloriesPer100g: 30, pricePerKg: 5, emoji: "🥬", gradient: ["#cfe89c", "#7aa14e"], category: "蔬菜" },
  { keys: ["小香葱", "葱花", "香葱", "小葱"], name: "小香葱", caloriesPer100g: 30, pricePerKg: 12, emoji: "🌿", gradient: ["#bce28b", "#5e9c3d"], category: "蔬菜" },
  { keys: ["姜片", "姜丝", "姜末", "生姜", "姜"], name: "姜", caloriesPer100g: 80, pricePerKg: 16, emoji: "🫚", gradient: ["#e6cd95", "#a0793c"], category: "蔬菜" },
  { keys: ["蒜末", "蒜瓣", "蒜片", "大蒜", "蒜"], name: "蒜", caloriesPer100g: 126, pricePerKg: 14, emoji: "🧄", gradient: ["#f5e6c4", "#c5a86c"], category: "蔬菜" },
  { keys: ["葱姜蒜", "葱姜", "蒜姜"], name: "葱姜蒜", caloriesPer100g: 60, pricePerKg: 12, emoji: "🧄", gradient: ["#dde7a4", "#8aa56a"], category: "蔬菜" },
  { keys: ["小白菜", "上海青", "小青菜"], name: "小白菜", caloriesPer100g: 13, pricePerKg: 6, emoji: "🥬", gradient: ["#c4e69b", "#6aa64a"], category: "蔬菜" },
  { keys: ["菠菜"], name: "菠菜", caloriesPer100g: 24, pricePerKg: 8, emoji: "🥬", gradient: ["#9bd16f", "#3f7d2c"], category: "蔬菜" },
  { keys: ["西兰花", "花椰菜"], name: "西兰花", caloriesPer100g: 36, pricePerKg: 10, emoji: "🥦", gradient: ["#88c25d", "#3a7032"], category: "蔬菜" },
  { keys: ["白菜", "包菜", "圆白菜", "卷心菜"], name: "包菜", caloriesPer100g: 22, pricePerKg: 4, emoji: "🥬", gradient: ["#d3e9a5", "#7aa14e"], category: "蔬菜" },
  { keys: ["胡萝卜"], name: "胡萝卜", caloriesPer100g: 41, pricePerKg: 5, emoji: "🥕", gradient: ["#ff924d", "#c75a17"], category: "蔬菜" },
  { keys: ["白萝卜"], name: "白萝卜", caloriesPer100g: 23, pricePerKg: 4, emoji: "🥕", gradient: ["#f5f1e0", "#b8b09c"], category: "蔬菜" },
  { keys: ["冬瓜"], name: "冬瓜", caloriesPer100g: 11, pricePerKg: 4, emoji: "🥒", gradient: ["#cfe9c0", "#7fa279"], category: "蔬菜" },
  { keys: ["丝瓜"], name: "丝瓜", caloriesPer100g: 20, pricePerKg: 8, emoji: "🥒", gradient: ["#b9d96c", "#5e8038"], category: "蔬菜" },
  { keys: ["豆角", "四季豆"], name: "豆角", caloriesPer100g: 31, pricePerKg: 10, emoji: "🫛", gradient: ["#a4cf6f", "#4a7b32"], category: "蔬菜" },
  { keys: ["玉米"], name: "玉米", caloriesPer100g: 86, pricePerKg: 7, emoji: "🌽", gradient: ["#ffd23f", "#c8941b"], category: "蔬菜" },
  { keys: ["香菇", "蘑菇", "榛蘑", "金针菇", "杏鲍菇", "口蘑"], name: "香菇", caloriesPer100g: 27, pricePerKg: 18, emoji: "🍄", gradient: ["#c8a88a", "#7a553a"], category: "蔬菜" },
  { keys: ["木耳"], name: "木耳", caloriesPer100g: 25, pricePerKg: 80, emoji: "🍄", gradient: ["#5a3e2b", "#2b1c10"], category: "蔬菜" },
  { keys: ["青蒜"], name: "青蒜", caloriesPer100g: 35, pricePerKg: 14, emoji: "🌿", gradient: ["#bde08c", "#598e34"], category: "蔬菜" },
  { keys: ["香菜"], name: "香菜", caloriesPer100g: 23, pricePerKg: 20, emoji: "🌿", gradient: ["#a9d56e", "#4f7f30"], category: "蔬菜" },
  { keys: ["韭菜"], name: "韭菜", caloriesPer100g: 25, pricePerKg: 8, emoji: "🌿", gradient: ["#9cc861", "#3d7423"], category: "蔬菜" },
  { keys: ["豆芽"], name: "豆芽", caloriesPer100g: 30, pricePerKg: 5, emoji: "🌱", gradient: ["#e8f0c5", "#a4b878"], category: "蔬菜" },
  { keys: ["莴笋"], name: "莴笋", caloriesPer100g: 14, pricePerKg: 6, emoji: "🥒", gradient: ["#bbd96c", "#67852f"], category: "蔬菜" },
  { keys: ["笋", "竹笋"], name: "竹笋", caloriesPer100g: 27, pricePerKg: 14, emoji: "🎍", gradient: ["#dde6a4", "#8a9b56"], category: "蔬菜" },
  { keys: ["莲藕"], name: "莲藕", caloriesPer100g: 73, pricePerKg: 10, emoji: "🪷", gradient: ["#f5edd8", "#b8a36b"], category: "蔬菜" },
  { keys: ["紫菜"], name: "紫菜", caloriesPer100g: 207, pricePerKg: 60, emoji: "🌊", gradient: ["#5a466a", "#1f1530"], category: "调味/主食" },
  { keys: ["泡椒"], name: "泡椒", caloriesPer100g: 25, pricePerKg: 18, emoji: "🌶️", gradient: ["#ff7a59", "#a32a18"], category: "蔬菜" },

  // ===== 肉蛋豆制品 =====
  { keys: ["五花肉"], name: "五花肉", caloriesPer100g: 395, pricePerKg: 50, emoji: "🥓", gradient: ["#ffb59d", "#c75a45"], category: "肉蛋豆制品" },
  { keys: ["猪肉末", "肉末", "猪肉丝", "猪里脊", "瘦肉", "里脊", "猪肉"], name: "猪肉", caloriesPer100g: 143, pricePerKg: 40, emoji: "🐖", gradient: ["#ff9b8a", "#c0524a"], category: "肉蛋豆制品" },
  { keys: ["排骨"], name: "排骨", caloriesPer100g: 278, pricePerKg: 60, emoji: "🍖", gradient: ["#e6957c", "#a04c39"], category: "肉蛋豆制品" },
  { keys: ["鸡腿肉", "鸡腿", "鸡胸肉", "鸡胸"], name: "鸡腿肉", caloriesPer100g: 167, pricePerKg: 24, emoji: "🍗", gradient: ["#f4c78a", "#a06b2c"], category: "肉蛋豆制品" },
  { keys: ["鸡中翅", "鸡翅"], name: "鸡翅", caloriesPer100g: 194, pricePerKg: 36, emoji: "🍗", gradient: ["#f5b97c", "#a25c1b"], category: "肉蛋豆制品" },
  { keys: ["三黄鸡", "童子鸡", "整鸡", "鸡"], name: "整鸡", caloriesPer100g: 167, pricePerKg: 22, emoji: "🐔", gradient: ["#f8d28a", "#a87520"], category: "肉蛋豆制品" },
  { keys: ["牛腩"], name: "牛腩", caloriesPer100g: 250, pricePerKg: 110, emoji: "🥩", gradient: ["#d97053", "#7a2c1e"], category: "肉蛋豆制品" },
  { keys: ["牛里脊", "牛肉末", "牛肉"], name: "牛肉", caloriesPer100g: 250, pricePerKg: 120, emoji: "🥩", gradient: ["#e87a5a", "#7c2820"], category: "肉蛋豆制品" },
  { keys: ["羊肉"], name: "羊肉", caloriesPer100g: 203, pricePerKg: 110, emoji: "🥩", gradient: ["#d8826c", "#7c2c22"], category: "肉蛋豆制品" },
  { keys: ["鲈鱼"], name: "鲈鱼", caloriesPer100g: 105, pricePerKg: 60, emoji: "🐟", gradient: ["#a2c8e8", "#3a6991"], category: "肉蛋豆制品" },
  { keys: ["草鱼", "鲫鱼", "鱼"], name: "鱼", caloriesPer100g: 113, pricePerKg: 30, emoji: "🐟", gradient: ["#a8d0e8", "#3c6c8e"], category: "肉蛋豆制品" },
  { keys: ["鲜虾仁", "虾仁"], name: "虾仁", caloriesPer100g: 87, pricePerKg: 120, emoji: "🍤", gradient: ["#ffb59d", "#c0533e"], category: "肉蛋豆制品" },
  { keys: ["鲜虾", "对虾", "虾"], name: "鲜虾", caloriesPer100g: 87, pricePerKg: 80, emoji: "🍤", gradient: ["#ffae90", "#bf4f3a"], category: "肉蛋豆制品" },
  { keys: ["虾皮"], name: "虾皮", caloriesPer100g: 153, pricePerKg: 80, emoji: "🦐", gradient: ["#ffd4ae", "#b07744"], category: "肉蛋豆制品" },
  { keys: ["鸡蛋", "蛋"], name: "鸡蛋", caloriesPer100g: 144, pricePerKg: 14, emoji: "🥚", gradient: ["#fff0c2", "#caa648"], category: "肉蛋豆制品" },
  { keys: ["皮蛋"], name: "皮蛋", caloriesPer100g: 171, pricePerKg: 30, emoji: "🥚", gradient: ["#9c8866", "#3f3322"], category: "肉蛋豆制品" },
  { keys: ["嫩豆腐"], name: "嫩豆腐", caloriesPer100g: 57, pricePerKg: 8, emoji: "🧈", gradient: ["#fff5d8", "#c9b074"], category: "肉蛋豆制品" },
  { keys: ["老豆腐", "北豆腐"], name: "老豆腐", caloriesPer100g: 81, pricePerKg: 8, emoji: "🧈", gradient: ["#fff0c2", "#bca065"], category: "肉蛋豆制品" },
  { keys: ["豆腐"], name: "豆腐", caloriesPer100g: 76, pricePerKg: 8, emoji: "🧈", gradient: ["#fff5d8", "#c5a563"], category: "肉蛋豆制品" },
  { keys: ["豆干", "腐竹"], name: "豆制品", caloriesPer100g: 200, pricePerKg: 20, emoji: "🧈", gradient: ["#e7c98c", "#8a6526"], category: "肉蛋豆制品" },

  // ===== 调味 / 主食 =====
  { keys: ["大米", "米饭", "隔夜米饭", "米"], name: "大米", caloriesPer100g: 346, pricePerKg: 8, emoji: "🍚", gradient: ["#fdf6e0", "#c8b86a"], category: "调味/主食" },
  { keys: ["手擀面", "面条", "细面条", "面"], name: "面条", caloriesPer100g: 280, pricePerKg: 10, emoji: "🍜", gradient: ["#fdedb8", "#bd9745"], category: "调味/主食" },
  { keys: ["面粉"], name: "面粉", caloriesPer100g: 354, pricePerKg: 6, emoji: "🌾", gradient: ["#fdf6e0", "#c0a96e"], category: "调味/主食" },
  { keys: ["馄饨皮", "饺子皮"], name: "馄饨皮", caloriesPer100g: 290, pricePerKg: 14, emoji: "🥟", gradient: ["#fff5d8", "#c2a66a"], category: "调味/主食" },
  { keys: ["切片年糕", "年糕"], name: "年糕", caloriesPer100g: 233, pricePerKg: 14, emoji: "🍡", gradient: ["#fffbe8", "#b8a76a"], category: "调味/主食" },
  { keys: ["粉条", "粉丝"], name: "粉丝", caloriesPer100g: 335, pricePerKg: 16, emoji: "🍝", gradient: ["#f5ecd8", "#a89466"], category: "调味/主食" },
  { keys: ["花生米", "花生"], name: "花生米", caloriesPer100g: 567, pricePerKg: 30, emoji: "🥜", gradient: ["#e6c08d", "#9c6e34"], category: "调味/主食" },
  { keys: ["可乐"], name: "可乐", caloriesPer100g: 42, pricePerKg: 8, emoji: "🥤", gradient: ["#5a2418", "#2a0e08"], category: "调味/主食" },
  { keys: ["牛奶"], name: "牛奶", caloriesPer100g: 54, pricePerKg: 14, emoji: "🥛", gradient: ["#fffaf0", "#cfc6b3"], category: "调味/主食" },
  { keys: ["冰糖"], name: "冰糖", caloriesPer100g: 397, pricePerKg: 14, emoji: "🍬", gradient: ["#fff8d8", "#c9b96a"], category: "调味/主食" },
  { keys: ["白糖", "糖"], name: "糖", caloriesPer100g: 397, pricePerKg: 8, emoji: "🍬", gradient: ["#fffbe8", "#c8b87a"], category: "调味/主食" },
  { keys: ["食用油", "油"], name: "食用油", caloriesPer100g: 899, pricePerKg: 14, emoji: "🫒", gradient: ["#f5e08d", "#b3923a"], category: "调味/主食" },
  { keys: ["香油"], name: "香油", caloriesPer100g: 898, pricePerKg: 30, emoji: "🫒", gradient: ["#f5d066", "#a07626"], category: "调味/主食" },
  { keys: ["醋"], name: "醋", caloriesPer100g: 21, pricePerKg: 8, emoji: "🧴", gradient: ["#a0805c", "#3f2c1a"], category: "调味/主食" },
  { keys: ["料酒"], name: "料酒", caloriesPer100g: 90, pricePerKg: 10, emoji: "🍶", gradient: ["#f8e3a8", "#a8843e"], category: "调味/主食" },
  { keys: ["生抽", "老抽", "酱油", "蒸鱼豉油"], name: "酱油", caloriesPer100g: 60, pricePerKg: 12, emoji: "🧴", gradient: ["#5a3a1d", "#1f130a"], category: "调味/主食" },
  { keys: ["蚝油"], name: "蚝油", caloriesPer100g: 114, pricePerKg: 22, emoji: "🧴", gradient: ["#7a4a26", "#2a1808"], category: "调味/主食" },
  { keys: ["豆瓣酱", "甜面酱", "黄豆酱"], name: "豆瓣酱", caloriesPer100g: 178, pricePerKg: 18, emoji: "🌶️", gradient: ["#a83423", "#4a1108"], category: "调味/主食" },
  { keys: ["盐"], name: "盐", caloriesPer100g: 0, pricePerKg: 4, emoji: "🧂", gradient: ["#fafafa", "#bcbcbc"], category: "调味/主食" },
  { keys: ["白胡椒", "胡椒粉", "胡椒", "黑胡椒"], name: "胡椒粉", caloriesPer100g: 251, pricePerKg: 80, emoji: "🌶️", gradient: ["#5a4a36", "#241c10"], category: "调味/主食" },
  { keys: ["花椒"], name: "花椒", caloriesPer100g: 258, pricePerKg: 60, emoji: "🌶️", gradient: ["#7a3818", "#2c1208"], category: "调味/主食" },
  { keys: ["八角", "桂皮", "香叶"], name: "香料", caloriesPer100g: 250, pricePerKg: 60, emoji: "🌰", gradient: ["#7a4a26", "#2c1808"], category: "调味/主食" },
  { keys: ["椒盐"], name: "椒盐", caloriesPer100g: 30, pricePerKg: 30, emoji: "🧂", gradient: ["#cfc4ae", "#7a6c4f"], category: "调味/主食" },
  { keys: ["淀粉"], name: "淀粉", caloriesPer100g: 345, pricePerKg: 12, emoji: "🌾", gradient: ["#fdf6e0", "#bca770"], category: "调味/主食" },
  { keys: ["干辣椒"], name: "干辣椒", caloriesPer100g: 282, pricePerKg: 60, emoji: "🌶️", gradient: ["#a8281a", "#3a0a06"], category: "调味/主食" },
  { keys: ["辣油", "辣椒油"], name: "辣油", caloriesPer100g: 850, pricePerKg: 30, emoji: "🌶️", gradient: ["#d63a1f", "#5a1208"], category: "调味/主食" },
];

/** 默认估算值，未匹配到任何食材时使用（保守估计 + 标记 unknown） */
const DEFAULT_INFO: IngredientInfo = {
  keys: [],
  name: "未识别食材",
  caloriesPer100g: 80,
  pricePerKg: 10,
  emoji: "🍽️",
  gradient: ["#e6dccc", "#8a7a5a"],
  category: "调味/主食",
};

/**
 * 在主表里查找最具体的匹配项。优先匹配最长 key（更具体），
 * 例如 "鸡腿肉" 会先匹配 "鸡腿肉" 而不是 "鸡"；"郫县豆瓣酱" 命中 "豆瓣酱"。
 */
export function lookupIngredient(name: string): IngredientInfo {
  const normalized = name.toLowerCase();
  let best: { info: IngredientInfo; len: number } | null = null;
  for (const info of INGREDIENT_TABLE) {
    for (const key of info.keys) {
      if (normalized.includes(key.toLowerCase())) {
        if (!best || key.length > best.len) {
          best = { info, len: key.length };
        }
      }
    }
  }
  return best?.info ?? DEFAULT_INFO;
}

/**
 * 解析「食材数量描述」中的克重 / 个数 / 把 / 根，统一估算为克。
 * 失败或写「适量」「各适量」时返回 null（让上层决定是否纳入估算）。
 */
export function estimateGrams(qty: string, name: string): number | null {
  if (!qty) return null;
  const q = qty.trim();
  if (/^适量|各适量|少许|按口味|个人喜好/.test(q)) return null;

  // 优先抓"约 300g"、"300g"、"500 g"等明确克重
  const gramMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:克|g)/i);
  if (gramMatch) return Number(gramMatch[1]);
  const kgMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:公斤|千克|kg)/i);
  if (kgMatch) return Number(kgMatch[1]) * 1000;

  // 毫升 / 升（液体食材按 1g/ml 估算）
  const mlMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:毫升|ml)/i);
  if (mlMatch) return Number(mlMatch[1]);
  const lMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:升|l)\b/i);
  if (lMatch) return Number(lMatch[1]) * 1000;

  // 个 / 根 / 瓣 / 片 / 把 / 罐 / 杯 / 颗
  const numMatch = q.match(/(\d+(?:\.\d+)?)\s*(个|只|根|瓣|片|把|罐|杯|颗|盒|块|条|大勺|小勺|勺)/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    const unit = numMatch[2];
    return n * unitToGrams(unit, name);
  }
  return null;
}

// 各单位经验质量（克）— 用于把「2 个番茄」「3 瓣蒜」估算成克重。
function unitToGrams(unit: string, name: string): number {
  const n = name;
  // 蛋 / 个 / 只
  if (unit === "个" || unit === "只") {
    if (/鸡蛋|皮蛋|蛋/.test(n)) return 55;
    if (/番茄|西红柿/.test(n)) return 150;
    if (/土豆|马铃薯/.test(n)) return 180;
    if (/茄子/.test(n)) return 200;
    if (/洋葱/.test(n)) return 180;
    if (/玉米/.test(n)) return 250;
    if (/胡萝卜/.test(n)) return 120;
    if (/虾/.test(n)) return 15;
    if (/西兰花/.test(n)) return 400;
    if (/鸡翅/.test(n)) return 60;
    return 100;
  }
  if (unit === "根") {
    if (/黄瓜/.test(n)) return 200;
    if (/茄子/.test(n)) return 250;
    if (/葱|香葱/.test(n)) return 15;
    if (/辣椒|尖椒|青椒/.test(n)) return 30;
    if (/胡萝卜/.test(n)) return 150;
    if (/玉米/.test(n)) return 250;
    return 80;
  }
  if (unit === "瓣") return 5; // 蒜瓣
  if (unit === "片") {
    if (/姜/.test(n)) return 3;
    return 10;
  }
  if (unit === "把") {
    if (/菠菜|小白菜|青菜|韭菜|香菜/.test(n)) return 200;
    if (/葱/.test(n)) return 50;
    if (/粉丝|粉条/.test(n)) return 80;
    return 120;
  }
  if (unit === "颗") {
    if (/西兰花/.test(n)) return 400;
    if (/包菜|圆白菜|白菜/.test(n)) return 800;
    return 200;
  }
  if (unit === "罐") return 330; // 可乐标准罐
  if (unit === "杯") return 200;
  if (unit === "盒") {
    if (/豆腐/.test(n)) return 400;
    return 250;
  }
  if (unit === "块") {
    if (/豆腐/.test(n)) return 400;
    if (/姜/.test(n)) return 30;
    return 100;
  }
  if (unit === "条") {
    if (/鱼/.test(n)) return 500;
    return 150;
  }
  if (unit === "大勺") return 15;
  if (unit === "小勺" || unit === "勺") return 5;
  return 50;
}

/** 给定食材名 + 数量描述，估算热量(kcal)和价格(元)。无法估算 grams 时按 0 返回。 */
export interface IngredientEstimate {
  info: IngredientInfo;
  grams: number | null;
  calories: number;
  price: number;
}

export function estimateIngredient(name: string, qty: string): IngredientEstimate {
  const info = lookupIngredient(name);
  const grams = estimateGrams(qty, name);
  if (grams === null) {
    return { info, grams: null, calories: 0, price: 0 };
  }
  const calories = Math.round((grams / 100) * info.caloriesPer100g);
  const price = Math.round(((grams / 1000) * info.pricePerKg) * 10) / 10;
  return { info, grams, calories, price };
}
