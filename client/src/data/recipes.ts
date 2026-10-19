// 内置示例菜谱数据 — 模块化设计，方便后续替换为社区贡献或 JSON / API。
// 字段约定见 README.md「数据模型」一节。

export type Cuisine = "川菜" | "粤菜" | "江浙" | "鲁菜" | "西北" | "东北" | "家常";
export type Course = "main" | "soup" | "veggie" | "staple";
/** 子门类标签 — 与 Course 正交，用于「甜品 / 饮品 / 小吃」等浏览。
 *  null/undefined 表示常规家常菜；甜品/烘焙等通常 course="staple"，但可通过 category 单独过滤。
 */
export type Category =
  | "甜品"
  | "饮品"
  | "小吃"
  | "早餐"
  | "夜宵"
  | "烘焙"
  | "轻食"
  | "下午茶";
export type Difficulty = "简单" | "中等" | "进阶";
export type Taste = "清淡" | "咸鲜" | "酸甜" | "微辣" | "重辣" | "麻辣";
export type Restriction = "素食" | "无猪肉" | "无牛肉" | "无海鲜" | "无辣" | "无蛋" | "无奶" | "无花生";

// === 环境/餐次相关可选标签 ===
export type Season = "春" | "夏" | "秋" | "冬";
export type WeatherTag = "热" | "冷" | "雨" | "晴" | "潮湿" | "干燥";
export type RegionTag = "华北" | "华东" | "华南" | "华中" | "西南" | "西北" | "东北";
export type MealSlotTag = "breakfast" | "lunch" | "dinner";
/** 烹饪能量/状态标签，用于天气/餐次匹配（汤、炖、清爽、暖胃 等） */
export type EnergyTag =
  | "暖胃"
  | "清爽"
  | "解暑"
  | "驱寒"
  | "下饭"
  | "快手"
  | "慢炖"
  | "适合冷"
  | "适合热"
  | "适合雨天";

export type IngredientCategory = "蔬菜" | "肉蛋豆制品" | "调味/主食";

export interface Ingredient {
  name: string;
  qty: string; // 用文字描述 (例如 "300g", "2 根", "1 把")
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  name: string;
  course: Course;
  cuisine: Cuisine;
  difficulty: Difficulty;
  /** 估计用时 (分钟)，准备 + 烹饪 */
  timeMinutes: number;
  /** 主要口味标签 */
  tastes: Taste[];
  /** 不适合的人群 / 限制 (如果该菜含此，则会被对应限制过滤掉) */
  contains: Restriction[];
  /** 简单烹饪步骤摘要 */
  steps: string[];
  /** 一句话介绍：为什么会推荐这道 */
  reason: string;
  /** 适合的人数下限（按份计算） */
  serves: number;
  ingredients: Ingredient[];
  /** 视频搜索关键词（可选）；不填会用 `name + " 做法"` 自动生成 Bilibili 搜索 URL */
  videoQuery?: string;
  /** 适合的季节（可选，用于推荐加分） */
  seasons?: Season[];
  /** 适合的天气（可选） */
  weathers?: WeatherTag[];
  /** 适合的地区（可选；空表示通吃） */
  regions?: RegionTag[];
  /** 适合的餐次（可选） */
  slots?: MealSlotTag[];
  /** 烹饪能量标签 */
  energy?: EnergyTag[];
  /** 子门类（与 course 正交）：甜品 / 饮品 / 小吃 / 早餐 / 夜宵 / 烘焙 / 轻食 / 下午茶。
   *  常规家常菜留空。 */
  category?: Category;
}

// 手写核心菜谱（覆盖经典款）。
// 数据库总条目 = CORE_RECIPES + GENERATED_RECIPES（脚本扩展）。运行 `npm run gen:recipes` 重新生成。
const CORE_RECIPES: Recipe[] = [
  // ===== 主菜 =====
  {
    id: "tomato-egg",
    name: "番茄炒蛋",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "永远的国民下饭菜，番茄出汁配米饭，孩子大人都爱。",
    steps: ["番茄切块，鸡蛋打散加少许盐", "热油滑炒鸡蛋至嫩", "下番茄炒出汁，加糖盐少许，回锅鸡蛋翻匀"],
    ingredients: [
      { name: "番茄", qty: "2 个 (约 300g)", category: "蔬菜" },
      { name: "鸡蛋", qty: "3 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 小把", category: "蔬菜" },
      { name: "白糖", qty: "1 小勺", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "kungpao-chicken",
    name: "宫保鸡丁",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["微辣", "酸甜"],
    contains: ["无花生"],
    serves: 3,
    reason: "经典荔枝口，下饭神器；花生与鸡丁口感对比明显。",
    steps: ["鸡腿肉切丁，料酒+生抽+淀粉腌 10 分钟", "调汁：醋+糖+生抽+淀粉+少水", "热油爆干辣椒花椒，下鸡丁炒变色", "加葱姜蒜、花生米，倒入碗汁翻炒收汁"],
    ingredients: [
      { name: "鸡腿肉", qty: "300g", category: "肉蛋豆制品" },
      { name: "花生米", qty: "60g", category: "调味/主食" },
      { name: "干辣椒", qty: "8 根", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "葱姜蒜", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "料酒", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "redbraised-pork",
    name: "红烧肉",
    course: "main",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 70,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "肥而不腻、入口即化，家庭餐桌的硬菜担当。",
    steps: ["五花肉冷水下锅焯水切块", "炒糖色至枣红", "下肉翻炒上色，加料酒/生抽/老抽/八角", "加热水没过肉，炖 50 分钟收汁"],
    ingredients: [
      { name: "五花肉", qty: "600g", category: "肉蛋豆制品" },
      { name: "冰糖", qty: "30g", category: "调味/主食" },
      { name: "葱", qty: "2 根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
      { name: "料酒", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "mapo-tofu",
    name: "麻婆豆腐",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 20,
    tastes: ["麻辣", "咸鲜"],
    contains: ["无牛肉"],
    serves: 3,
    reason: "麻、辣、烫、香、酥、嫩、鲜、活，米饭杀手。",
    steps: ["豆腐切块焯水", "牛肉末炒香，加豆瓣酱+蒜末出红油", "加水/高汤、酱油，下豆腐小火煮 5 分钟", "勾芡两次，撒花椒粉葱花"],
    ingredients: [
      { name: "嫩豆腐", qty: "1 盒 (400g)", category: "肉蛋豆制品" },
      { name: "牛肉末", qty: "100g", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "蒜末", qty: "2 大勺", category: "蔬菜" },
      { name: "豆瓣酱", qty: "2 大勺", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "soy-chicken-wing",
    name: "可乐鸡翅",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 25,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    serves: 3,
    reason: "零失败的甜咸鸡翅，孩子最爱。",
    steps: ["鸡翅划两刀，焯水", "热油煎至两面金黄", "倒入可乐没过鸡翅，加生抽+姜片，中小火 15 分钟收汁"],
    ingredients: [
      { name: "鸡翅", qty: "10 个", category: "肉蛋豆制品" },
      { name: "可乐", qty: "1 罐 (330ml)", category: "调味/主食" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "料酒", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "steamed-fish",
    name: "清蒸鲈鱼",
    course: "main",
    cuisine: "粤菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["清淡", "咸鲜"],
    contains: ["无海鲜"],
    serves: 3,
    reason: "大火 8 分钟出锅，原汁原味鲜嫩，是家宴撑面子的菜。",
    steps: ["鱼洗净在两面划刀，腹内塞葱姜", "盘底垫葱条，开水上锅大火 8 分钟", "倒掉腥水，铺葱丝姜丝，淋蒸鱼豉油", "热油浇上激香"],
    ingredients: [
      { name: "鲈鱼", qty: "1 条 (约 500g)", category: "肉蛋豆制品" },
      { name: "大葱", qty: "2 根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "蒸鱼豉油", qty: "2 大勺", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "scrambled-shrimp",
    name: "滑蛋虾仁",
    course: "main",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡", "咸鲜"],
    contains: ["无海鲜"],
    serves: 2,
    reason: "鲜虾配滑蛋，清爽温柔，老人小孩都好接受。",
    steps: ["虾仁加盐、料酒、淀粉抓匀", "蛋液加少许牛奶/盐打匀", "滑炒虾仁至变色盛出", "倒蛋液小火炒至半凝固，回锅虾仁拌匀"],
    ingredients: [
      { name: "鲜虾仁", qty: "200g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "4 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "牛奶", qty: "1 大勺", category: "调味/主食" },
      { name: "料酒", qty: "1 小勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "twice-cooked-pork",
    name: "回锅肉",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 35,
    tastes: ["微辣", "咸鲜"],
    contains: ["无猪肉"],
    serves: 3,
    reason: "灯盏窝、焦香酱香，川人下饭头牌。",
    steps: ["五花肉煮 20 分钟切薄片", "热锅煸肉出油至卷边", "加豆瓣酱+甜面酱炒香", "下青蒜段、彩椒翻匀"],
    ingredients: [
      { name: "五花肉", qty: "300g", category: "肉蛋豆制品" },
      { name: "青蒜", qty: "3 根", category: "蔬菜" },
      { name: "彩椒", qty: "1 个", category: "蔬菜" },
      { name: "豆瓣酱", qty: "2 大勺", category: "调味/主食" },
      { name: "甜面酱", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "braised-eggplant",
    name: "鱼香茄子",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["微辣", "酸甜"],
    contains: [],
    serves: 3,
    reason: "鱼香味型经典素菜，下饭量超大；可加肉末更香。",
    steps: ["茄子切条撒盐杀水后挤干", "调鱼香汁：糖+醋+生抽+淀粉+水", "热油煎茄子至软糯", "下姜蒜泡椒末炒香，倒鱼香汁收浓"],
    ingredients: [
      { name: "茄子", qty: "2 根 (约 400g)", category: "蔬菜" },
      { name: "猪肉末", qty: "100g", category: "肉蛋豆制品" },
      { name: "泡椒", qty: "3 个", category: "蔬菜" },
      { name: "葱姜蒜", qty: "适量", category: "蔬菜" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "garlic-shrimp",
    name: "蒜蓉粉丝虾",
    course: "main",
    cuisine: "粤菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["咸鲜"],
    contains: ["无海鲜"],
    serves: 3,
    reason: "粉丝吸饱蒜香虾汁，宴客不会失手。",
    steps: ["虾开背去虾线", "粉丝泡软铺底，码虾", "热油爆蒜末调金银蒜，加生抽糖", "蒜汁淋虾，蒸 6-8 分钟"],
    ingredients: [
      { name: "鲜虾", qty: "12 只", category: "肉蛋豆制品" },
      { name: "粉丝", qty: "1 把 (80g)", category: "调味/主食" },
      { name: "大蒜", qty: "1 整头 (40g)", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "蒸鱼豉油", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "salt-pepper-tofu",
    name: "椒盐豆腐",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["咸鲜", "微辣"],
    contains: [],
    serves: 2,
    reason: "外酥内嫩、椒盐扎实，素食朋友也能吃得很满足。",
    steps: ["老豆腐切块裹薄淀粉", "中火煎至四面金黄", "下蒜末小米辣翻炒", "撒椒盐和葱花起锅"],
    ingredients: [
      { name: "老豆腐", qty: "1 块 (400g)", category: "肉蛋豆制品" },
      { name: "小米辣", qty: "3 个", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "椒盐", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "beef-onion",
    name: "洋葱炒牛肉",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["咸鲜"],
    contains: ["无牛肉"],
    serves: 3,
    reason: "牛肉滑嫩、洋葱清甜，家常快手硬菜。",
    steps: ["牛肉逆纹切片，加生抽+料酒+淀粉+油腌 15 分钟", "热锅快炒牛肉至变色盛出", "下洋葱炒香", "回锅牛肉，淋蚝油黑椒翻匀"],
    ingredients: [
      { name: "牛里脊", qty: "250g", category: "肉蛋豆制品" },
      { name: "洋葱", qty: "1 个", category: "蔬菜" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
      { name: "黑胡椒", qty: "1 小勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "chicken-mushroom",
    name: "小鸡炖蘑菇",
    course: "main",
    cuisine: "东北",
    difficulty: "中等",
    timeMinutes: 60,
    tastes: ["咸鲜"],
    contains: [],
    serves: 4,
    reason: "炖出来满屋子香，冬天最治愈。",
    steps: ["鸡块焯水", "热油下鸡块煸炒，加葱姜八角", "加生抽老抽料酒糖，倒水", "下泡发的榛蘑炖 40 分钟，加粉条收汁"],
    ingredients: [
      { name: "三黄鸡", qty: "半只 (约 800g)", category: "肉蛋豆制品" },
      { name: "干榛蘑", qty: "30g", category: "蔬菜" },
      { name: "粉条", qty: "1 把 (80g)", category: "调味/主食" },
      { name: "葱", qty: "2 根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "salt-baked-chicken",
    name: "葱油白切鸡",
    course: "main",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 40,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 4,
    reason: "皮爽肉嫩，配葱油蘸料，年夜饭都体面。",
    steps: ["整鸡冷水下锅，加姜葱料酒煮 25 分钟关火焖 10 分钟", "捞出过冰水", "切块装盘，淋葱姜蒜末+热油+生抽"],
    ingredients: [
      { name: "三黄鸡", qty: "半只 (约 800g)", category: "肉蛋豆制品" },
      { name: "葱", qty: "2 根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "蒜末", qty: "2 大勺", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  // ===== 新增主菜 =====
  {
    id: "yuxiang-pork",
    name: "鱼香肉丝",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["微辣", "酸甜"],
    contains: ["无猪肉"],
    serves: 3,
    reason: "酸甜咸辣四味平衡，配米饭能吃两碗。",
    steps: ["猪里脊切丝加料酒淀粉腌 10 分钟", "调鱼香汁：糖+醋+生抽+淀粉+水", "肉丝滑炒变色盛出", "下泡椒姜蒜炒香，加木耳青笋丝，回锅肉丝倒鱼香汁收浓"],
    ingredients: [
      { name: "猪里脊", qty: "250g", category: "肉蛋豆制品" },
      { name: "木耳", qty: "20g", category: "蔬菜" },
      { name: "莴笋", qty: "1 根 (200g)", category: "蔬菜" },
      { name: "胡萝卜", qty: "半根", category: "蔬菜" },
      { name: "泡椒", qty: "3 个", category: "蔬菜" },
      { name: "葱姜蒜", qty: "适量", category: "蔬菜" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "mushroom-rape",
    name: "香菇油菜",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "蚝油香菇浇在嫩绿油菜上，清爽下饭。",
    steps: ["油菜对半切，焯水过凉摆盘", "香菇切片，蒜末爆香", "下香菇翻炒，加蚝油生抽水煮 1 分钟", "勾薄芡淋在油菜上"],
    ingredients: [
      { name: "小白菜", qty: "300g", category: "蔬菜" },
      { name: "香菇", qty: "6 朵 (150g)", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 小勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "diced-chicken-cashew",
    name: "腰果鸡丁",
    course: "main",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "腰果香脆鸡肉嫩滑，比花生版更温和不上火。",
    steps: ["鸡胸切丁腌生抽料酒淀粉", "腰果小火煸至金黄盛出", "鸡丁滑炒变色，加彩椒/葱姜", "回锅腰果，调蚝油生抽糖翻匀"],
    ingredients: [
      { name: "鸡胸肉", qty: "300g", category: "肉蛋豆制品" },
      { name: "腰果", qty: "60g", category: "调味/主食" },
      { name: "彩椒", qty: "1 个", category: "蔬菜" },
      { name: "葱", qty: "1 根", category: "蔬菜" },
      { name: "姜", qty: "3 片", category: "蔬菜" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "stewed-beef-potato",
    name: "土豆烧牛肉",
    course: "main",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 80,
    tastes: ["咸鲜"],
    contains: ["无牛肉"],
    serves: 4,
    reason: "牛肉酥烂土豆吸饱汤汁，是冬天里最暖的主菜。",
    steps: ["牛腩切块焯水", "热油爆姜蒜八角桂皮，下牛腩煸香", "加生抽老抽料酒糖+热水炖 50 分钟", "加土豆胡萝卜再炖 20 分钟收汁"],
    ingredients: [
      { name: "牛腩", qty: "500g", category: "肉蛋豆制品" },
      { name: "土豆", qty: "2 个 (约 360g)", category: "蔬菜" },
      { name: "胡萝卜", qty: "1 根", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
      { name: "料酒", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "boiled-fish",
    name: "酸菜鱼",
    course: "main",
    cuisine: "川菜",
    difficulty: "进阶",
    timeMinutes: 50,
    tastes: ["微辣", "酸甜"],
    contains: ["无海鲜"],
    serves: 4,
    reason: "酸辣开胃，鱼片滑嫩，是聚会必杀技。",
    steps: ["鱼片用蛋清淀粉盐料酒腌制 15 分钟", "酸菜炒香，下泡椒姜蒜煮汤底", "汤滚下鱼骨煮 5 分钟，再下鱼片煮 1 分半", "撒葱花，热油浇辣椒花椒激香"],
    ingredients: [
      { name: "草鱼", qty: "1 条 (约 1kg)", category: "肉蛋豆制品" },
      { name: "酸菜", qty: "300g", category: "蔬菜" },
      { name: "鸡蛋", qty: "1 个 (取蛋清)", category: "肉蛋豆制品" },
      { name: "泡椒", qty: "5 个", category: "蔬菜" },
      { name: "干辣椒", qty: "10 根", category: "调味/主食" },
      { name: "花椒", qty: "1 大勺", category: "调味/主食" },
      { name: "葱姜蒜", qty: "适量", category: "蔬菜" },
      { name: "淀粉", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "braised-ribs-sweet-sour",
    name: "糖醋排骨",
    course: "main",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 50,
    tastes: ["酸甜"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "亮红色糖醋汁挂在排骨上，孩子最爱。",
    steps: ["排骨焯水", "炒糖色至枣红下排骨上色", "加料酒生抽老抽水炖 30 分钟", "倒醋糖收汁，撒白芝麻"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "冰糖", qty: "30g", category: "调味/主食" },
      { name: "醋", qty: "3 大勺", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "料酒", qty: "2 大勺", category: "调味/主食" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
    ],
  },
  {
    id: "sanbei-chicken",
    name: "三杯鸡",
    course: "main",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 40,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "九层塔的香气一冲鼻，瞬间像在台南。",
    steps: ["鸡腿切块焯水沥干", "麻油爆姜片至焦黄，下蒜瓣", "鸡块煎香，加酱油料酒糖收汁", "起锅前丢入九层塔翻匀"],
    ingredients: [
      { name: "鸡腿肉", qty: "500g", category: "肉蛋豆制品" },
      { name: "九层塔", qty: "1 把 (30g)", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "蒜", qty: "10 瓣", category: "蔬菜" },
      { name: "香油", qty: "2 大勺", category: "调味/主食" },
      { name: "生抽", qty: "3 大勺", category: "调味/主食" },
      { name: "料酒", qty: "3 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "stir-fried-pork-pepper",
    name: "尖椒肉丝",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["微辣", "咸鲜"],
    contains: ["无猪肉"],
    serves: 2,
    reason: "10 分钟一道下饭硬菜，青椒爽辣里脊滑嫩。",
    steps: ["猪里脊切丝腌生抽料酒淀粉", "尖椒切丝", "肉丝滑炒变色盛出", "下尖椒炒断生，回锅肉丝调味翻匀"],
    ingredients: [
      { name: "猪里脊", qty: "200g", category: "肉蛋豆制品" },
      { name: "尖椒", qty: "5 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "料酒", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "lions-head",
    name: "红烧狮子头",
    course: "main",
    cuisine: "江浙",
    difficulty: "进阶",
    timeMinutes: 75,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "肥三瘦七的肉丸软嫩，浓汤淋饭一绝。",
    steps: ["猪肉末加葱姜水蛋液淀粉摔打上劲", "团成大丸子煎至定型", "汤锅加生抽老抽糖+水，下狮子头小火炖 40 分钟", "起锅前烫白菜叶围边"],
    ingredients: [
      { name: "猪肉末", qty: "500g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "1 个", category: "肉蛋豆制品" },
      { name: "包菜", qty: "几片叶", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "spicy-shredded-potato-beef",
    name: "孜然牛肉",
    course: "main",
    cuisine: "西北",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["微辣", "咸鲜"],
    contains: ["无牛肉"],
    serves: 3,
    reason: "孜然辣椒粉的香气一冲鼻，西北烧烤味直接搬上桌。",
    steps: ["牛里脊切片腌生抽料酒淀粉油 15 分钟", "热油大火炒牛肉至变色盛出", "下洋葱蒜片爆香，回锅牛肉", "撒孜然辣椒粉熟白芝麻翻匀"],
    ingredients: [
      { name: "牛里脊", qty: "300g", category: "肉蛋豆制品" },
      { name: "洋葱", qty: "半个", category: "蔬菜" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "孜然", qty: "1 大勺", category: "调味/主食" },
      { name: "辣椒粉", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "saliva-chicken",
    name: "口水鸡",
    course: "main",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 40,
    tastes: ["麻辣"],
    contains: [],
    serves: 3,
    reason: "凉拌鸡肉浇上麻辣红油，夏天必点。",
    steps: ["整鸡腿冷水下锅+姜葱料酒煮 20 分钟焖 5 分钟", "捞出过冰水切块", "调料：生抽+醋+糖+花椒油+辣椒油+蒜末", "淋在鸡上撒花生熟芝麻"],
    ingredients: [
      { name: "鸡腿", qty: "2 个 (500g)", category: "肉蛋豆制品" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "辣油", qty: "3 大勺", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
      { name: "花生米", qty: "30g", category: "调味/主食" },
    ],
  },
  {
    id: "braised-tofu",
    name: "家常豆腐",
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "煎豆腐外焦里嫩+蘑菇彩椒同烩，简单可素。",
    steps: ["老豆腐切三角煎至两面金黄", "蒜片爆香下香菇彩椒翻炒", "加生抽蚝油糖少水煮 1 分钟", "回锅豆腐翻匀勾薄芡"],
    ingredients: [
      { name: "老豆腐", qty: "1 块 (400g)", category: "肉蛋豆制品" },
      { name: "香菇", qty: "5 朵", category: "蔬菜" },
      { name: "彩椒", qty: "1 个", category: "蔬菜" },
      { name: "蒜", qty: "4 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
    ],
  },

  // ===== 素菜 / 小炒 =====
  {
    id: "stirfry-bokchoy",
    name: "蒜蓉小白菜",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "5 分钟绿叶菜，平衡油腻主菜。",
    steps: ["小白菜洗净切段", "蒜末爆香", "下小白菜大火快炒，盐糖少许"],
    ingredients: [
      { name: "小白菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "cucumber-salad",
    name: "拍黄瓜",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 5,
    tastes: ["清淡", "酸甜"],
    contains: [],
    serves: 2,
    reason: "夏天必备，拍碎后入味更快。",
    steps: ["黄瓜拍裂切段，撒盐杀水 5 分钟", "蒜末+生抽+醋+糖+香油+辣油拌匀"],
    ingredients: [
      { name: "黄瓜", qty: "2 根", category: "蔬菜" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
      { name: "辣油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "stir-broccoli",
    name: "蒜炒西兰花",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡"],
    contains: [],
    serves: 3,
    reason: "颜色好看营养均衡，是经典配角。",
    steps: ["西兰花切小朵，加盐焯水 1 分钟过凉", "蒜片爆香", "下西兰花快炒，调味起锅"],
    ingredients: [
      { name: "西兰花", qty: "1 颗 (400g)", category: "蔬菜" },
      { name: "蒜片", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "蚝油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "mushroom-cabbage",
    name: "手撕包菜",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["微辣", "酸甜"],
    contains: [],
    serves: 3,
    reason: "酸辣开胃、嘎嘣脆。",
    steps: ["包菜手撕成片", "干辣椒花椒爆香", "下包菜大火快炒，醋+生抽+糖+盐调味"],
    ingredients: [
      { name: "包菜", qty: "半颗 (400g)", category: "蔬菜" },
      { name: "干辣椒", qty: "5 根", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "tigerskin-pepper",
    name: "虎皮青椒",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "煎到起泡的青椒带焦香，下饭神器。",
    steps: ["青椒去籽不切", "少油小火煎至两面起虎皮", "倒生抽+醋+糖+盐+少水焖 1 分钟"],
    ingredients: [
      { name: "尖椒", qty: "8 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 小勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "mashed-eggplant",
    name: "凉拌茄子",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "蒸出来软糯入味，夏天清爽。",
    steps: ["茄子切条蒸 12 分钟", "撕条装盘", "蒜末+生抽+醋+香油+小米辣淋上"],
    ingredients: [
      { name: "长茄子", qty: "2 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "小米辣", qty: "1 个", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "potato-shred",
    name: "酸辣土豆丝",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["微辣", "酸甜"],
    contains: [],
    serves: 2,
    reason: "脆生生酸辣开胃，国民下饭素菜。",
    steps: ["土豆切丝泡水去淀粉", "干辣椒花椒爆香", "土豆丝大火快炒 2 分钟，下醋盐糖出锅"],
    ingredients: [
      { name: "土豆", qty: "2 个", category: "蔬菜" },
      { name: "青椒", qty: "1 个", category: "蔬菜" },
      { name: "干辣椒", qty: "3 根", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "spinach-peanut",
    name: "凉拌菠菜花生米",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡"],
    contains: ["无花生"],
    serves: 3,
    reason: "凉菜里的清新派，补铁。",
    steps: ["菠菜焯水过凉切段", "花生米提前炸至酥脆", "蒜末+生抽+醋+香油+花生米拌匀"],
    ingredients: [
      { name: "菠菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "花生米", qty: "60g", category: "调味/主食" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  // ===== 新增素菜 =====
  {
    id: "garlic-greens",
    name: "蒜蓉空心菜",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "夏天必点的脆嫩绿叶，蒜香轰炸鼻腔。",
    steps: ["空心菜洗净掐段", "热油爆蒜末小米辣", "下空心菜大火快炒 1 分钟，加盐糖出锅"],
    ingredients: [
      { name: "空心菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "小米辣", qty: "1 个 (可选)", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "fungus-cucumber",
    name: "凉拌木耳黄瓜",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡", "酸甜"],
    contains: [],
    serves: 3,
    reason: "脆爽降火，宿醉第二天上桌最贴心。",
    steps: ["木耳泡发焯水过凉", "黄瓜拍碎切段", "蒜末+生抽+醋+糖+香油+小米辣拌匀"],
    ingredients: [
      { name: "木耳", qty: "20g (干)", category: "蔬菜" },
      { name: "黄瓜", qty: "1 根", category: "蔬菜" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "小米辣", qty: "1 个", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "stir-cabbage-vinegar",
    name: "醋溜白菜",
    course: "veggie",
    cuisine: "鲁菜",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    serves: 3,
    reason: "白菜帮子吸醋香，爽脆开胃比肉好吃。",
    steps: ["白菜帮切片，叶切大块", "干辣椒花椒爆香", "下白菜帮大火炒 1 分钟，再下叶", "倒醋糖生抽淀粉水勾汁翻匀"],
    ingredients: [
      { name: "白菜", qty: "半颗 (500g)", category: "蔬菜" },
      { name: "干辣椒", qty: "3 根", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "stir-snowpea",
    name: "清炒荷兰豆",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡"],
    contains: [],
    serves: 2,
    reason: "翠绿脆嫩 5 分钟出锅，配重口主菜最合适。",
    steps: ["荷兰豆撕掉两端筋", "蒜片爆香", "大火快炒 1 分钟，加盐少许"],
    ingredients: [
      { name: "豆角", qty: "300g", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "crisp-lotus-root",
    name: "酸辣藕片",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["微辣", "酸甜"],
    contains: [],
    serves: 3,
    reason: "脆藕加干辣椒花椒，清爽解腻。",
    steps: ["莲藕切薄片泡水防黑", "热油爆干辣椒花椒葱姜", "藕片大火快炒 2 分钟", "倒醋盐糖生抽出锅"],
    ingredients: [
      { name: "莲藕", qty: "1 节 (300g)", category: "蔬菜" },
      { name: "干辣椒", qty: "3 根", category: "调味/主食" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "stir-mushroom-celery",
    name: "芹菜炒香干",
    course: "veggie",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 3,
    reason: "脆芹菜+豆干+花椒油，安静好吃的家常素菜。",
    steps: ["芹菜切段焯水 10 秒", "豆干切条", "热油爆姜蒜，下豆干芹菜大火快炒", "调盐生抽香油起锅"],
    ingredients: [
      { name: "芹菜", qty: "300g", category: "蔬菜" },
      { name: "豆干", qty: "200g", category: "肉蛋豆制品" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "garlic-luffa",
    name: "蒜蓉丝瓜",
    course: "veggie",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "丝瓜出汁清甜，是夏天最舒服的素菜。",
    steps: ["丝瓜削皮滚刀切块", "蒜末爆香", "下丝瓜炒 2 分钟，加少量水盐糖煮 2 分钟出锅"],
    ingredients: [
      { name: "丝瓜", qty: "2 根 (400g)", category: "蔬菜" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "carrot-fried-egg",
    name: "胡萝卜炒蛋",
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["咸鲜"],
    contains: ["无蛋"],
    serves: 2,
    reason: "三色家常，给孩子配饭超合适。",
    steps: ["胡萝卜切丝", "鸡蛋打散", "热油滑炒鸡蛋盛出", "下胡萝卜丝炒软回锅鸡蛋调盐"],
    ingredients: [
      { name: "胡萝卜", qty: "2 根", category: "蔬菜" },
      { name: "鸡蛋", qty: "3 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },

  // ===== 汤 =====
  {
    id: "tomato-egg-soup",
    name: "番茄蛋花汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["酸甜", "清淡"],
    contains: [],
    serves: 3,
    reason: "5 分钟出锅的家常汤，酸甜开胃。",
    steps: ["番茄切块，热油炒出汁", "加水煮开", "倒入打散蛋液成蛋花，盐糖少许，撒葱花"],
    ingredients: [
      { name: "番茄", qty: "1 个", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "winter-melon-rib-soup",
    name: "冬瓜排骨汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 70,
    tastes: ["清淡", "咸鲜"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "清润不腻，老人孩子都喜欢的炖汤。",
    steps: ["排骨焯水", "排骨+姜片+水炖 50 分钟", "加冬瓜块再炖 15 分钟，调盐"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "冬瓜", qty: "400g", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "seaweed-egg-soup",
    name: "紫菜虾皮汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: ["无海鲜"],
    serves: 3,
    reason: "极简补钙汤，懒人最爱。",
    steps: ["紫菜虾皮放碗里", "热水冲入，加蛋花", "调香油生抽盐，撒葱花"],
    ingredients: [
      { name: "紫菜", qty: "10g", category: "调味/主食" },
      { name: "虾皮", qty: "1 大勺", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "1 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
      { name: "生抽", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "spinach-tofu-soup",
    name: "菠菜豆腐汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡"],
    contains: [],
    serves: 3,
    reason: "清淡爽口，搭配重口主菜很合适。",
    steps: ["豆腐切块焯水去豆腥", "锅中加水烧开下豆腐", "加菠菜煮 1 分钟，调盐和香油"],
    ingredients: [
      { name: "嫩豆腐", qty: "1 盒", category: "肉蛋豆制品" },
      { name: "菠菜", qty: "1 把", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "corn-rib-soup",
    name: "玉米胡萝卜排骨汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 90,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "清甜润口，孩子最爱的汤。",
    steps: ["排骨焯水", "排骨+姜片+水大火 10 分钟转小火", "加玉米胡萝卜炖 60 分钟，调盐"],
    ingredients: [
      { name: "排骨", qty: "400g", category: "肉蛋豆制品" },
      { name: "玉米", qty: "1 根", category: "蔬菜" },
      { name: "胡萝卜", qty: "1 根", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "wonton-soup",
    name: "鲜肉小馄饨",
    course: "soup",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 30,
    tastes: ["清淡", "咸鲜"],
    contains: ["无猪肉"],
    serves: 3,
    reason: "汤鲜皮滑的家庭治愈系。",
    steps: ["猪肉末加葱姜水生抽白胡椒搅匀", "馄饨皮包馅", "锅中烧水，下馄饨煮至浮起", "碗底放紫菜虾皮香菜+生抽+香油，浇热汤"],
    ingredients: [
      { name: "馄饨皮", qty: "30 张", category: "调味/主食" },
      { name: "猪肉末", qty: "200g", category: "肉蛋豆制品" },
      { name: "紫菜", qty: "5g", category: "蔬菜" },
      { name: "虾皮", qty: "1 大勺", category: "肉蛋豆制品" },
      { name: "香菜", qty: "1 把", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "白胡椒", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  // ===== 新增汤 =====
  {
    id: "egg-drop-laver",
    name: "蛋花海带汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    serves: 3,
    reason: "极简家庭汤底，配饺子或拌面都顺。",
    steps: ["海带切丝煮开 5 分钟", "倒入打散蛋液成蛋花", "加生抽盐香油撒葱花"],
    ingredients: [
      { name: "海带", qty: "100g", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "yam-rib-soup",
    name: "山药排骨汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 75,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "山药粉糯排骨油润，秋冬养胃。",
    steps: ["排骨焯水", "排骨姜片冷水下锅大火烧开转小火 50 分钟", "加山药再炖 15 分钟", "调盐撒葱花"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "山药", qty: "300g", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "loofah-egg-soup",
    name: "丝瓜蛋汤",
    course: "soup",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["清淡"],
    contains: [],
    serves: 3,
    reason: "夏夜里 10 分钟一锅清香解暑汤。",
    steps: ["丝瓜削皮切片", "热油炒丝瓜出汁加水烧开", "倒入蛋液成蛋花调盐起锅"],
    ingredients: [
      { name: "丝瓜", qty: "2 根 (400g)", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "姜片", qty: "2 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "lotus-root-rib-soup",
    name: "莲藕排骨汤",
    course: "soup",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 100,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    serves: 4,
    reason: "粉藕配排骨炖到酥烂，秋冬必备。",
    steps: ["排骨焯水", "莲藕切块", "排骨莲藕姜片冷水下锅，大火烧开转小火炖 80 分钟", "调盐撒葱花"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "莲藕", qty: "1 节 (300g)", category: "蔬菜" },
      { name: "姜", qty: "3 片", category: "蔬菜" },
      { name: "葱", qty: "1 根", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },

  // ===== 主食 =====
  {
    id: "egg-fried-rice",
    name: "蛋炒饭",
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["咸鲜"],
    contains: [],
    serves: 2,
    reason: "剩饭升华神器，5 分钟搞定。",
    steps: ["隔夜米饭打散", "鸡蛋打散滑炒，下米饭翻炒至粒粒分明", "加盐生抽，撒葱花"],
    ingredients: [
      { name: "隔夜米饭", qty: "2 碗 (400g)", category: "调味/主食" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "scallion-noodle",
    name: "葱油拌面",
    course: "staple",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["咸鲜"],
    contains: [],
    serves: 2,
    reason: "上海经典，葱香扑鼻拌一拌就开吃。",
    steps: ["小葱切段，小火慢熬至焦黄出葱油", "煮面过凉", "面条+葱油+生抽老抽糖拌匀"],
    ingredients: [
      { name: "细面条", qty: "200g", category: "调味/主食" },
      { name: "小香葱", qty: "1 大把 (100g)", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 小勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
      { name: "食用油", qty: "3 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "scallion-pancake",
    name: "葱花鸡蛋饼",
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["咸鲜"],
    contains: [],
    serves: 2,
    reason: "早餐 / 主食兼用，配粥一绝。",
    steps: ["面粉 + 水调成稀面糊", "加鸡蛋葱花盐胡椒粉拌匀", "平底锅刷油倒面糊摊薄，两面金黄"],
    ingredients: [
      { name: "面粉", qty: "150g", category: "调味/主食" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "小葱", qty: "1 把", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "白胡椒", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "congee",
    name: "皮蛋瘦肉粥",
    course: "staple",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 50,
    tastes: ["清淡", "咸鲜"],
    contains: ["无猪肉", "无蛋"],
    serves: 3,
    reason: "胃口不好时的最佳选择，温润熨贴。",
    steps: ["大米加水煮 30 分钟成粥", "瘦肉切丝腌料酒生抽淀粉", "下瘦肉煮散，加皮蛋粒", "调盐胡椒，撒葱花姜丝"],
    ingredients: [
      { name: "大米", qty: "1 杯 (180g)", category: "调味/主食" },
      { name: "皮蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "瘦肉", qty: "150g", category: "肉蛋豆制品" },
      { name: "葱", qty: "1 根", category: "蔬菜" },
      { name: "姜", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "白胡椒", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "tomato-noodle",
    name: "番茄牛腩面",
    course: "staple",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 90,
    tastes: ["酸甜", "咸鲜"],
    contains: ["无牛肉"],
    serves: 3,
    reason: "一碗顶饱，番茄炖软的牛腩浓郁酸香。",
    steps: ["牛腩焯水切块", "番茄炒出沙", "加牛腩+水+八角桂皮炖 60 分钟", "煮面盛碗淋汤，撒葱花"],
    ingredients: [
      { name: "牛腩", qty: "400g", category: "肉蛋豆制品" },
      { name: "番茄", qty: "3 个", category: "蔬菜" },
      { name: "面条", qty: "300g", category: "调味/主食" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
      { name: "桂皮", qty: "1 块", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "fried-rice-cake",
    name: "上海炒年糕",
    course: "staple",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "Q 弹软糯一锅出，孩子大人都爱。",
    steps: ["年糕泡软", "肉丝腌好滑炒变色盛出", "下青菜+笋片翻炒", "下年糕+水+生抽老抽糖煮入味，回锅肉丝"],
    ingredients: [
      { name: "切片年糕", qty: "300g", category: "调味/主食" },
      { name: "猪肉丝", qty: "100g", category: "肉蛋豆制品" },
      { name: "小青菜", qty: "1 把 (200g)", category: "蔬菜" },
      { name: "笋片", qty: "100g", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 小勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  {
    id: "knife-cut-noodle",
    name: "西红柿打卤面",
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    serves: 2,
    reason: "热乎乎一碗，番茄+鸡蛋两相宜。",
    steps: ["煮面备用", "番茄炒出汁，加水煮开", "倒入蛋液成蛋花", "盐糖香油调味，浇在面上"],
    ingredients: [
      { name: "手擀面", qty: "200g", category: "调味/主食" },
      { name: "番茄", qty: "2 个", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
  },
  // ===== 新增主食 =====
  {
    id: "yangzhou-fried-rice",
    name: "扬州炒饭",
    course: "staple",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 20,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "颗颗分明，虾仁火腿玉米豌豆五彩齐全。",
    steps: ["米饭打散", "鸡蛋打散滑炒", "下虾仁火腿丁炒香", "加豌豆玉米粒", "下米饭翻炒至粒粒分明，调盐生抽撒葱花"],
    ingredients: [
      { name: "隔夜米饭", qty: "3 碗 (600g)", category: "调味/主食" },
      { name: "虾仁", qty: "100g", category: "肉蛋豆制品" },
      { name: "火腿", qty: "100g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "豌豆", qty: "50g", category: "蔬菜" },
      { name: "玉米粒", qty: "50g", category: "蔬菜" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
  },
  {
    id: "zhajiang-noodle",
    name: "炸酱面",
    course: "staple",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 30,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    serves: 3,
    reason: "黄豆酱+甜面酱+五花肉丁，浓油赤酱拌一拌。",
    steps: ["五花肉切丁煸炒出油", "下黄豆酱+甜面酱小火炒 10 分钟", "加水糖煮 5 分钟收稠", "煮面过凉，淋酱配黄瓜丝"],
    ingredients: [
      { name: "面条", qty: "300g", category: "调味/主食" },
      { name: "五花肉", qty: "200g", category: "肉蛋豆制品" },
      { name: "黄豆酱", qty: "3 大勺", category: "调味/主食" },
      { name: "甜面酱", qty: "2 大勺", category: "调味/主食" },
      { name: "黄瓜", qty: "1 根", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
    ],
  },
  {
    id: "leek-egg-pancake",
    name: "韭菜鸡蛋盒子",
    course: "staple",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 40,
    tastes: ["咸鲜"],
    contains: [],
    serves: 3,
    reason: "韭菜鸡蛋粉丝三件套，外焦里嫩。",
    steps: ["面粉烫面揉光", "鸡蛋炒散，韭菜切碎，粉丝泡软切短", "拌馅：调香油盐生抽", "面皮包馅捏边，平底锅小火两面金黄"],
    ingredients: [
      { name: "面粉", qty: "300g", category: "调味/主食" },
      { name: "韭菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "鸡蛋", qty: "3 个", category: "肉蛋豆制品" },
      { name: "粉丝", qty: "30g", category: "调味/主食" },
      { name: "香油", qty: "1 大勺", category: "调味/主食" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
  },
  {
    id: "fried-rice-pickled",
    name: "酱油炒饭",
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["咸鲜"],
    contains: ["无蛋"],
    serves: 2,
    reason: "懒人极简版炒饭，香气却毫不打折。",
    steps: ["米饭加生抽老抽拌匀染色", "热油下米饭翻炒 3 分钟", "撒葱花猪油起锅"],
    ingredients: [
      { name: "隔夜米饭", qty: "2 碗", category: "调味/主食" },
      { name: "葱花", qty: "1 大把", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 小勺", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
    ],
  },
];

import { GENERATED_RECIPES } from "./recipes.generated";

// 合并并按 id 去重（手写优先）。
function mergeUniqueById(...lists: Recipe[][]): Recipe[] {
  const seen = new Set<string>();
  const out: Recipe[] = [];
  for (const list of lists) {
    for (const r of list) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

// === 硬忌口关键词推断 ===
// 历史上 contains 全靠手写/生成器维护，难免漏标。这里用食材 + 步骤里的关键词
// 反向推断每道菜应当带的硬忌口，并在 RECIPES 暴露之前补齐。
// 规则要保守：只在出现「明确含某禁忌成分」时打标签；模糊词（蛋黄酱用作替代名等）忽略。
// 检测脚本（script/check-recommend.ts）会再校验一遍，避免新增菜谱再次漏标。
type RestrictionRule = {
  restriction: Restriction;
  /** 出现在 ingredient name 或 steps 文本中即触发 */
  patterns: RegExp[];
  /** 例外：命中 patterns 但出现这些词时不打标（避免误伤） */
  excludePatterns?: RegExp[];
};

export const RESTRICTION_KEYWORD_RULES: RestrictionRule[] = [
  {
    restriction: "无蛋",
    patterns: [/鸡蛋/, /鸭蛋/, /鹌鹑蛋/, /蛋花/, /蛋液/, /蛋黄(?!酱)/, /蛋白(?!质)/, /皮蛋/, /咸蛋/, /茶叶蛋/, /荷包蛋/, /煎蛋/, /炒蛋/, /滑蛋/],
    // 「蛋糕粉」「蛋挞皮」之类成品如果出现就保留（含蛋）；但如「西红柿打卤」并不含蛋，
    // 这里不需要排除——既然食材里写了鸡蛋就说明真含蛋。
  },
  {
    restriction: "无奶",
    patterns: [/牛奶/, /鲜奶/, /酸奶/, /奶油/, /淡奶油/, /炼乳/, /奶酪/, /芝士/, /马苏里拉/, /黄油/, /奶粉/],
    excludePatterns: [/椰奶/, /豆奶/, /杏仁奶/, /燕麦奶/], // 植物奶不算乳制品忌口
  },
  {
    restriction: "无花生",
    patterns: [/花生(?!油)/, /花生米/, /花生碎/, /花生酱/],
    // 花生油在国内绝大多数过敏忌口语境下不视为致敏物（精炼油），保守起见排除。
  },
  {
    restriction: "无海鲜",
    patterns: [
      /虾/, /鱼(?!香|肉肠|丸|饼|蛋)/, /蟹/, /贝/, /蛤/, /蛎/, /鲍/, /扇贝/,
      /鱿鱼/, /墨鱼/, /章鱼/, /带鱼/, /鲈鱼/, /鲫鱼/, /草鱼/, /三文鱼/, /鳕鱼/, /黄鱼/,
      /海带/, /紫菜/, /虾皮/, /虾米/, /海米/, /干贝/, /瑶柱/, /蛤蜊/, /扇贝/, /蚝/, /生蚝/, /蛏/, /鱼丸/, /鱼豆腐/, /鱼露/,
    ],
    // 「鱼香肉丝」叫鱼香但不含鱼 — 通过 patterns 里的 (?!香|肉肠...) 已排除。
    excludePatterns: [/鱼香/], // 双保险
  },
  {
    restriction: "无猪肉",
    patterns: [
      /猪肉/, /猪里脊/, /猪排/, /猪蹄/, /猪肝/, /猪心/, /猪肚/, /猪耳/, /猪头/, /猪皮/, /猪骨/,
      /五花肉/, /里脊肉/, /梅花肉/, /排骨/, /肉末/, /肉馅/, /肉丝/, /肉片/, /肉丁/,
      /培根/, /火腿(?!肠)/, /火腿肠/, /腊肠/, /香肠/, /叉叉/, /叉烧/, /腊肉/, /午餐肉/, /肉松/,
    ],
    // 「肉丝/肉末/肉片」在中文厨房默认指猪肉。如果是鸡肉/牛肉，会写「鸡丝」「牛肉丝」。
    excludePatterns: [/牛肉|鸡肉|羊肉|鸭肉|鱼肉|虾肉|蟹肉|蛋肉|素肉|植物肉/],
  },
  {
    restriction: "无牛肉",
    patterns: [/牛肉/, /牛腩/, /牛排/, /牛筋/, /牛百叶/, /牛舌/, /牛尾/, /雪花牛/, /肥牛/, /牛肚/, /牛骨/],
  },
];

/** 根据食材 + 步骤文字推断该菜应当带的硬忌口 contains 标签。 */
export function inferContainsFromText(text: string): Restriction[] {
  const out = new Set<Restriction>();
  for (const rule of RESTRICTION_KEYWORD_RULES) {
    const hit = rule.patterns.some((p) => p.test(text));
    if (!hit) continue;
    if (rule.excludePatterns && rule.excludePatterns.length > 0) {
      // exclude 仅当全部正向命中都被 exclude 命中时才豁免；这里采取保守做法：
      // 若文本里仅出现「鱼香」而无其他鱼相关命中，则不打无海鲜。
      // 简化：若把所有命中位置抽出来，只要存在不被 exclude 命中的命中，就打标。
      const matches: string[] = [];
      for (const p of rule.patterns) {
        const m = text.match(new RegExp(p.source, "g"));
        if (m) matches.push(...m);
      }
      const realHits = matches.filter(
        (m) => !rule.excludePatterns!.some((ex) => ex.test(m)),
      );
      if (realHits.length === 0) continue;
    }
    out.add(rule.restriction);
  }
  return Array.from(out);
}

/** 推断单道菜应该补齐的 contains（不会移除已存在的）。 */
export function inferContainsForRecipe(r: Recipe): Restriction[] {
  const blob = [
    ...r.ingredients.map((i) => i.name),
    ...r.steps,
    r.name,
  ].join(" ");
  return inferContainsFromText(blob);
}

/** 用关键词扫描补齐 contains；返回（菜id -> 新增的限制数组）的修复报告。 */
export function autofixContains(recipes: Recipe[]): Record<string, Restriction[]> {
  const report: Record<string, Restriction[]> = {};
  for (const r of recipes) {
    const inferred = inferContainsForRecipe(r);
    const missing = inferred.filter((x) => !r.contains.includes(x));
    if (missing.length > 0) {
      r.contains = [...r.contains, ...missing];
      report[r.id] = missing;
    }
  }
  return report;
}

const merged = mergeUniqueById(CORE_RECIPES, GENERATED_RECIPES);
// 在 RECIPES 暴露之前用关键词扫描补齐 contains，确保「无蛋 / 无奶 / 无花生 /
// 无海鲜 / 无猪肉 / 无牛肉」等硬忌口对全库始终一致。
autofixContains(merged);

export const RECIPES: Recipe[] = merged;

export const ALL_CUISINES: Cuisine[] = ["家常", "川菜", "粤菜", "江浙", "鲁菜", "西北", "东北"];
export const ALL_TASTES: Taste[] = ["清淡", "咸鲜", "酸甜", "微辣", "重辣", "麻辣"];
export const ALL_RESTRICTIONS: Restriction[] = ["素食", "无猪肉", "无牛肉", "无海鲜", "无辣", "无蛋", "无奶", "无花生"];
export const ALL_DIFFICULTIES: Difficulty[] = ["简单", "中等", "进阶"];
export const ALL_CATEGORIES: Category[] = ["甜品", "饮品", "小吃", "早餐", "夜宵", "烘焙", "轻食", "下午茶"];
