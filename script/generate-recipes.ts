// 生成补充菜谱（GeneratedRecipes）— 与手写的核心菜谱合并后总数 >= 300。
// 运行：`npx tsx script/generate-recipes.ts`
// 产出：client/src/data/recipes.generated.ts （ts 文件，可被 recipes.ts 直接 import）。
//
// 设计要点：
//  - 每条菜谱都基于「主料 × 做法风格」组合扩展。
//  - 食材列表必须包含至少一个可被 lookupIngredient() 识别的关键字，便于详情页估算热量/价格。
//  - `contains` 严格根据食材列表机械填充，确保「忌口」推荐不会泄漏。
//  - 标注 seasons/weathers/regions/slots/energy 用于上下文推荐加分。

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  Category,
  Course,
  Cuisine,
  Difficulty,
  EnergyTag,
  MealSlotTag,
  RegionTag,
  Restriction,
  Season,
  Taste,
  WeatherTag,
} from "../client/src/data/recipes";

interface GenIngredient {
  name: string;
  qty: string;
  category: "蔬菜" | "肉蛋豆制品" | "调味/主食";
}

interface GenRecipe {
  id: string;
  name: string;
  course: Course;
  cuisine: Cuisine;
  difficulty: Difficulty;
  timeMinutes: number;
  tastes: Taste[];
  contains: Restriction[];
  steps: string[];
  reason: string;
  serves: number;
  ingredients: GenIngredient[];
  videoQuery?: string;
  seasons?: Season[];
  weathers?: WeatherTag[];
  regions?: RegionTag[];
  slots?: MealSlotTag[];
  energy?: EnergyTag[];
  category?: Category;
}

// === 主料库（按 course 分） ===
// 每条主料附带：默认菜系倾向、含的 Restriction、关键 emoji、视觉/食材库匹配字段。
type Protein = {
  key: string; // 用于 id
  display: string; // 中文显示
  ingName: string; // 写入 ingredient 时使用的 name (必须能命中 ingredients.ts)
  qty: string;
  category: GenIngredient["category"];
  contains: Restriction[]; // 例如 五花肉 -> ["无猪肉"]
  cuisine?: Cuisine;
};

const MAIN_PROTEINS: Protein[] = [
  { key: "porkbelly", display: "五花肉", ingName: "五花肉", qty: "300g", category: "肉蛋豆制品", contains: ["无猪肉"] },
  { key: "lean-pork", display: "猪里脊", ingName: "猪里脊", qty: "250g", category: "肉蛋豆制品", contains: ["无猪肉"] },
  { key: "minced-pork", display: "猪肉末", ingName: "猪肉末", qty: "200g", category: "肉蛋豆制品", contains: ["无猪肉"] },
  { key: "ribs", display: "排骨", ingName: "排骨", qty: "500g", category: "肉蛋豆制品", contains: ["无猪肉"] },
  { key: "chicken-thigh", display: "鸡腿肉", ingName: "鸡腿肉", qty: "400g", category: "肉蛋豆制品", contains: [] },
  { key: "chicken-breast", display: "鸡胸肉", ingName: "鸡胸肉", qty: "300g", category: "肉蛋豆制品", contains: [] },
  { key: "chicken-wing", display: "鸡翅", ingName: "鸡翅", qty: "10 个 (约 600g)", category: "肉蛋豆制品", contains: [] },
  { key: "whole-chicken", display: "整鸡", ingName: "整鸡", qty: "半只 (800g)", category: "肉蛋豆制品", contains: [] },
  { key: "beef", display: "牛肉", ingName: "牛肉", qty: "300g", category: "肉蛋豆制品", contains: ["无牛肉"] },
  { key: "beef-brisket", display: "牛腩", ingName: "牛腩", qty: "500g", category: "肉蛋豆制品", contains: ["无牛肉"] },
  { key: "lamb", display: "羊肉", ingName: "羊肉", qty: "400g", category: "肉蛋豆制品", contains: [], cuisine: "西北" },
  { key: "fish", display: "草鱼", ingName: "草鱼", qty: "1 条 (约 1kg)", category: "肉蛋豆制品", contains: ["无海鲜"] },
  { key: "perch", display: "鲈鱼", ingName: "鲈鱼", qty: "1 条 (约 500g)", category: "肉蛋豆制品", contains: ["无海鲜"], cuisine: "粤菜" },
  { key: "shrimp", display: "鲜虾", ingName: "鲜虾", qty: "12 只 (约 250g)", category: "肉蛋豆制品", contains: ["无海鲜"] },
  { key: "shrimp-meat", display: "虾仁", ingName: "虾仁", qty: "200g", category: "肉蛋豆制品", contains: ["无海鲜"] },
  { key: "egg", display: "鸡蛋", ingName: "鸡蛋", qty: "4 个", category: "肉蛋豆制品", contains: ["无蛋"] },
  { key: "tofu-firm", display: "老豆腐", ingName: "老豆腐", qty: "1 块 (400g)", category: "肉蛋豆制品", contains: [] },
  { key: "tofu-soft", display: "嫩豆腐", ingName: "嫩豆腐", qty: "1 盒 (400g)", category: "肉蛋豆制品", contains: [] },
];

// === 蔬菜配料 ===
type Veg = {
  key: string;
  display: string;
  ingName: string;
  qty: string;
  contains?: Restriction[];
};
const COMMON_VEG: Veg[] = [
  { key: "potato", display: "土豆", ingName: "土豆", qty: "2 个 (约 360g)" },
  { key: "eggplant", display: "茄子", ingName: "茄子", qty: "2 根 (400g)" },
  { key: "pepper-green", display: "青椒", ingName: "青椒", qty: "2 个" },
  { key: "pepper-color", display: "彩椒", ingName: "彩椒", qty: "1 个" },
  { key: "onion", display: "洋葱", ingName: "洋葱", qty: "1 个" },
  { key: "carrot", display: "胡萝卜", ingName: "胡萝卜", qty: "1 根" },
  { key: "broccoli", display: "西兰花", ingName: "西兰花", qty: "1 颗 (400g)" },
  { key: "bokchoy", display: "小白菜", ingName: "小白菜", qty: "1 把 (300g)" },
  { key: "spinach", display: "菠菜", ingName: "菠菜", qty: "1 把 (300g)" },
  { key: "cabbage", display: "包菜", ingName: "包菜", qty: "半颗 (400g)" },
  { key: "cucumber", display: "黄瓜", ingName: "黄瓜", qty: "2 根" },
  { key: "winter-melon", display: "冬瓜", ingName: "冬瓜", qty: "500g" },
  { key: "loofah", display: "丝瓜", ingName: "丝瓜", qty: "2 根 (400g)" },
  { key: "beans", display: "豆角", ingName: "豆角", qty: "300g" },
  { key: "corn", display: "玉米", ingName: "玉米", qty: "1 根" },
  { key: "mushroom", display: "香菇", ingName: "香菇", qty: "150g" },
  { key: "fungus", display: "木耳", ingName: "木耳", qty: "20g (干)" },
  { key: "lotus", display: "莲藕", ingName: "莲藕", qty: "1 节 (300g)" },
  { key: "leek", display: "韭菜", ingName: "韭菜", qty: "1 把 (300g)" },
  { key: "celery", display: "芹菜", ingName: "芹菜", qty: "300g" },
  { key: "radish", display: "白萝卜", ingName: "白萝卜", qty: "半根 (300g)" },
  { key: "bamboo", display: "竹笋", ingName: "竹笋", qty: "200g" },
  { key: "tomato", display: "番茄", ingName: "番茄", qty: "2 个 (300g)" },
  { key: "tofu-firm", display: "老豆腐", ingName: "老豆腐", qty: "1 块 (400g)" },
  { key: "tofu-soft", display: "嫩豆腐", ingName: "嫩豆腐", qty: "1 盒 (400g)" },
  { key: "doudou", display: "豆干", ingName: "豆干", qty: "200g" },
  { key: "rape", display: "油菜心", ingName: "小白菜", qty: "300g" },
];

// === 通用调味组合 ===
const GINGER_GARLIC: GenIngredient = { name: "葱姜蒜", qty: "适量", category: "蔬菜" };
const SOY_SAUCE: GenIngredient = { name: "生抽", qty: "1 大勺", category: "调味/主食" };
const DARK_SOY: GenIngredient = { name: "老抽", qty: "1 小勺", category: "调味/主食" };
const COOKING_WINE: GenIngredient = { name: "料酒", qty: "1 大勺", category: "调味/主食" };
const SUGAR: GenIngredient = { name: "糖", qty: "1 小勺", category: "调味/主食" };
const VINEGAR: GenIngredient = { name: "醋", qty: "1 大勺", category: "调味/主食" };
const SALT: GenIngredient = { name: "盐", qty: "适量", category: "调味/主食" };
const STARCH: GenIngredient = { name: "淀粉", qty: "1 小勺", category: "调味/主食" };
const OYSTER: GenIngredient = { name: "蚝油", qty: "1 大勺", category: "调味/主食" };
const PEPPER: GenIngredient = { name: "胡椒粉", qty: "1 小勺", category: "调味/主食" };
const COOKING_OIL: GenIngredient = { name: "食用油", qty: "1 大勺", category: "调味/主食" };
const DOUBANJIANG: GenIngredient = { name: "豆瓣酱", qty: "1 大勺", category: "调味/主食" };
const DRY_CHILI: GenIngredient = { name: "干辣椒", qty: "5 根", category: "调味/主食" };
const HUAJIAO: GenIngredient = { name: "花椒", qty: "1 小勺", category: "调味/主食" };

// === 做法风格 ===
type Style = {
  key: string;
  zh: string; // "红烧" "清蒸" "酸辣" 等
  difficulty: Difficulty;
  timeBase: number; // 基础时长
  tastes: Taste[];
  contains: Restriction[]; // 风格固有的（如 麻辣 -> 无辣）
  cuisine: Cuisine;
  steps: (m: string) => string[];
  extraIngs: GenIngredient[];
  reasonTpl: (m: string) => string;
  energy: EnergyTag[];
};

const STYLES: Style[] = [
  {
    key: "redbraised",
    zh: "红烧",
    difficulty: "中等",
    timeBase: 50,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "家常",
    steps: (m) => [
      `${m}处理切块焯水`,
      "炒糖色至枣红",
      "下主料煸炒上色，加葱姜八角",
      "加生抽老抽料酒+热水炖 30-40 分钟",
      "大火收汁亮油",
    ],
    extraIngs: [
      GINGER_GARLIC,
      { name: "冰糖", qty: "20g", category: "调味/主食" },
      SOY_SAUCE,
      DARK_SOY,
      COOKING_WINE,
      { name: "八角", qty: "2 个", category: "调味/主食" },
    ],
    reasonTpl: (m) => `红烧${m}浓油赤酱、咸甜下饭，是冬天最暖的硬菜。`,
    energy: ["驱寒", "暖胃", "下饭", "慢炖", "适合冷"],
  },
  {
    key: "kungpao",
    zh: "宫保",
    difficulty: "中等",
    timeBase: 25,
    tastes: ["微辣", "酸甜"],
    contains: ["无花生"],
    cuisine: "川菜",
    steps: (m) => [
      `${m}切丁加料酒淀粉腌 10 分钟`,
      "调汁：醋+糖+生抽+淀粉+水",
      "热油爆干辣椒花椒",
      "下主料炒变色，加葱姜蒜花生",
      "倒碗汁翻炒收汁",
    ],
    extraIngs: [
      { name: "花生米", qty: "60g", category: "调味/主食" },
      DRY_CHILI,
      HUAJIAO,
      GINGER_GARLIC,
      VINEGAR,
      SUGAR,
      SOY_SAUCE,
      STARCH,
    ],
    reasonTpl: (m) => `宫保${m}经典荔枝口，米饭杀手。`,
    energy: ["下饭"],
  },
  {
    key: "blackpepper",
    zh: "黑椒",
    difficulty: "简单",
    timeBase: 18,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}切片腌生抽料酒淀粉油 15 分钟`,
      "热锅快炒至变色盛出",
      "下洋葱彩椒炒香",
      "回锅主料，淋黑胡椒蚝油酱汁翻匀",
    ],
    extraIngs: [
      { name: "洋葱", qty: "半个", category: "蔬菜" },
      { name: "彩椒", qty: "1 个", category: "蔬菜" },
      { name: "黑胡椒", qty: "1 大勺", category: "调味/主食" },
      OYSTER,
      SOY_SAUCE,
    ],
    reasonTpl: (m) => `黑椒${m}咸香微辛，10 几分钟出锅的快手硬菜。`,
    energy: ["快手", "下饭"],
  },
  {
    key: "twicecooked",
    zh: "回锅",
    difficulty: "中等",
    timeBase: 35,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    cuisine: "川菜",
    steps: (m) => [
      `${m}煮 20 分钟切薄片`,
      "热锅煸至卷边出油",
      "加豆瓣酱+甜面酱炒香",
      "下青蒜段彩椒翻匀",
    ],
    extraIngs: [
      DOUBANJIANG,
      { name: "甜面酱", qty: "1 大勺", category: "调味/主食" },
      { name: "青蒜", qty: "3 根", category: "蔬菜" },
      { name: "彩椒", qty: "1 个", category: "蔬菜" },
    ],
    reasonTpl: (m) => `回锅${m}灯盏窝焦香、酱香扎实，川人下饭头牌。`,
    energy: ["下饭"],
  },
  {
    key: "yuxiang",
    zh: "鱼香",
    difficulty: "中等",
    timeBase: 25,
    tastes: ["微辣", "酸甜"],
    contains: [],
    cuisine: "川菜",
    steps: (m) => [
      `${m}切丝（或丁）加生抽料酒淀粉腌 10 分钟`,
      "调鱼香汁：糖+醋+生抽+淀粉+水",
      "滑炒主料变色盛出",
      "下泡椒姜蒜炒香，加木耳莴笋丝",
      "回锅主料倒鱼香汁收浓",
    ],
    extraIngs: [
      { name: "木耳", qty: "20g (干)", category: "蔬菜" },
      { name: "莴笋", qty: "1 根", category: "蔬菜" },
      { name: "胡萝卜", qty: "半根", category: "蔬菜" },
      { name: "泡椒", qty: "3 个", category: "蔬菜" },
      GINGER_GARLIC,
      SUGAR,
      VINEGAR,
      SOY_SAUCE,
      STARCH,
    ],
    reasonTpl: (m) => `鱼香${m}酸甜咸辣四味平衡，配米饭能吃两碗。`,
    energy: ["下饭"],
  },
  {
    key: "spicy-cumin",
    zh: "孜然",
    difficulty: "中等",
    timeBase: 22,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    cuisine: "西北",
    steps: (m) => [
      `${m}切片腌生抽料酒淀粉油 15 分钟`,
      "热油大火快炒至变色盛出",
      "下洋葱蒜片爆香",
      "回锅主料，撒孜然辣椒粉熟白芝麻翻匀",
    ],
    extraIngs: [
      { name: "洋葱", qty: "半个", category: "蔬菜" },
      { name: "孜然", qty: "1 大勺", category: "调味/主食" },
      { name: "辣椒粉", qty: "1 大勺", category: "调味/主食" },
      SOY_SAUCE,
    ],
    reasonTpl: (m) => `孜然${m}西北烧烤味直接搬上桌，下啤酒贼爽。`,
    energy: ["下饭"],
  },
  {
    key: "steamed",
    zh: "清蒸",
    difficulty: "中等",
    timeBase: 25,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}处理干净，腹内塞葱姜`,
      "盘底垫葱条，开水上锅大火 8 分钟",
      "倒掉腥水，铺葱丝姜丝，淋蒸鱼豉油",
      "热油浇上激香",
    ],
    extraIngs: [
      { name: "大葱", qty: "2 根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "蒸鱼豉油", qty: "2 大勺", category: "调味/主食" },
      COOKING_OIL,
    ],
    reasonTpl: (m) => `清蒸${m}原汁原味，鲜嫩到能拌饭。`,
    energy: ["清爽", "适合热"],
  },
  {
    key: "sourspicy",
    zh: "酸辣",
    difficulty: "简单",
    timeBase: 15,
    tastes: ["微辣", "酸甜"],
    contains: [],
    cuisine: "川菜",
    steps: (m) => [
      `${m}切丝/片，泡水沥干`,
      "干辣椒花椒爆香",
      "大火快炒 2 分钟",
      "倒醋盐糖生抽出锅",
    ],
    extraIngs: [DRY_CHILI, HUAJIAO, VINEGAR, SUGAR, SOY_SAUCE],
    reasonTpl: (m) => `酸辣${m}爽口开胃，3 分钟出锅。`,
    energy: ["快手", "解暑", "适合热"],
  },
  {
    key: "garlic",
    zh: "蒜蓉",
    difficulty: "简单",
    timeBase: 10,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}洗净切段或拍碎`,
      "热油爆蒜末小米辣",
      "大火快炒 1 分钟",
      "加盐少许出锅",
    ],
    extraIngs: [
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "小米辣", qty: "1 个 (可选)", category: "蔬菜" },
      SALT,
    ],
    reasonTpl: (m) => `蒜蓉${m}蒜香轰炸鼻腔，5 分钟出绿叶菜。`,
    energy: ["快手", "清爽"],
  },
  {
    key: "vinegar-stir",
    zh: "醋溜",
    difficulty: "简单",
    timeBase: 12,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    cuisine: "鲁菜",
    steps: (m) => [
      `${m}切片或撕段`,
      "干辣椒爆香",
      "大火快炒 1 分钟",
      "倒醋糖生抽淀粉水勾汁翻匀",
    ],
    extraIngs: [DRY_CHILI, VINEGAR, SUGAR, SOY_SAUCE, STARCH],
    reasonTpl: (m) => `醋溜${m}爽脆开胃，鲁菜里的国民下饭素菜。`,
    energy: ["快手", "解暑"],
  },
  {
    key: "stewed-soup",
    zh: "炖汤",
    difficulty: "简单",
    timeBase: 70,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}焯水撇沫`,
      "加葱姜枸杞红枣",
      "小火慢炖 60 分钟",
      "起锅前调盐少许",
    ],
    extraIngs: [
      GINGER_GARLIC,
      { name: "枸杞", qty: "10g", category: "调味/主食" },
      { name: "红枣", qty: "5 颗", category: "调味/主食" },
      SALT,
    ],
    reasonTpl: (m) => `${m}慢炖一锅汤，喝一口暖到胃。`,
    energy: ["暖胃", "驱寒", "慢炖", "适合冷"],
  },
  {
    key: "cold-shred",
    zh: "凉拌",
    difficulty: "简单",
    timeBase: 12,
    tastes: ["清淡", "酸甜"],
    contains: [],
    cuisine: "家常",
    steps: (m) => [
      `${m}焯水/切丝`,
      "调料：蒜末+生抽+醋+糖+香油",
      "拌匀冷藏 5 分钟更入味",
    ],
    extraIngs: [
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      SOY_SAUCE,
      VINEGAR,
      SUGAR,
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    reasonTpl: (m) => `凉拌${m}清爽降温，夏天必备下酒小菜。`,
    energy: ["解暑", "清爽", "适合热", "快手"],
  },
  {
    key: "soup-light",
    zh: "清汤",
    difficulty: "简单",
    timeBase: 18,
    tastes: ["清淡"],
    contains: [],
    cuisine: "家常",
    steps: (m) => [
      `${m}处理干净切块`,
      "热水下锅，加姜片",
      "煮 10 分钟撇沫",
      "调盐胡椒粉撒葱花",
    ],
    extraIngs: [{ name: "姜片", qty: "3 片", category: "蔬菜" }, SALT, PEPPER, { name: "葱花", qty: "适量", category: "蔬菜" }],
    reasonTpl: (m) => `${m}清汤清润，配着主菜整顿饭刚刚好。`,
    energy: ["清爽", "暖胃"],
  },
  {
    key: "stew-warm",
    zh: "汤煲",
    difficulty: "中等",
    timeBase: 90,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}焯水洗净`,
      "砂锅加足量水，下姜片料酒",
      "小火煲 80 分钟",
      "起锅前调盐撒葱花",
    ],
    extraIngs: [{ name: "姜", qty: "1 块", category: "蔬菜" }, COOKING_WINE, SALT],
    reasonTpl: (m) => `${m}煲到酥烂，汤奶白浓鲜，最适合冬夜。`,
    energy: ["驱寒", "暖胃", "慢炖", "适合冷"],
  },
  {
    key: "stir-simple",
    zh: "小炒",
    difficulty: "简单",
    timeBase: 12,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "家常",
    steps: (m) => [
      `${m}处理切好`,
      "热油爆姜蒜",
      "下主料大火快炒 2 分钟",
      "调生抽蚝油盐起锅",
    ],
    extraIngs: [GINGER_GARLIC, SOY_SAUCE, OYSTER, SALT],
    reasonTpl: (m) => `家常小炒${m}快手不出错，下班 15 分钟开饭。`,
    energy: ["快手", "下饭"],
  },
  {
    key: "douban-braise",
    zh: "豆瓣烧",
    difficulty: "中等",
    timeBase: 30,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    cuisine: "川菜",
    steps: (m) => [
      `${m}切块焯水沥干`,
      "豆瓣酱小火炒出红油",
      "下主料煸炒上色，加葱姜蒜",
      "加生抽糖+热水煮 15 分钟",
      "勾薄芡撒葱花",
    ],
    extraIngs: [DOUBANJIANG, GINGER_GARLIC, SOY_SAUCE, SUGAR, STARCH],
    reasonTpl: (m) => `豆瓣烧${m}红亮咸辣，川菜下饭代表。`,
    energy: ["下饭"],
  },
  {
    key: "honey-glaze",
    zh: "蜜汁",
    difficulty: "简单",
    timeBase: 25,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}腌生抽料酒蜂蜜 10 分钟`,
      "热油煎至两面金黄",
      "加蜂蜜+生抽+少水中小火收汁",
      "起锅前刷一层蜂蜜",
    ],
    extraIngs: [
      { name: "蜂蜜", qty: "2 大勺", category: "调味/主食" },
      SOY_SAUCE,
      COOKING_WINE,
    ],
    reasonTpl: (m) => `蜜汁${m}亮红色挂汁，孩子最爱的甜口主菜。`,
    energy: ["下饭"],
  },
  {
    key: "salty-sour",
    zh: "番茄烧",
    difficulty: "简单",
    timeBase: 25,
    tastes: ["酸甜", "咸鲜"],
    contains: [],
    cuisine: "家常",
    steps: (m) => [
      `番茄切块炒出汁`,
      `下${m}煎香或腌后下锅`,
      "加生抽糖少水煮 10 分钟",
      "勾芡撒葱花",
    ],
    extraIngs: [
      { name: "番茄", qty: "2 个", category: "蔬菜" },
      SOY_SAUCE,
      SUGAR,
      STARCH,
    ],
    reasonTpl: (m) => `番茄${m}酸甜清爽，米饭杀手。`,
    energy: ["下饭"],
  },
  {
    key: "fragrant-sauce",
    zh: "酱爆",
    difficulty: "简单",
    timeBase: 18,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "鲁菜",
    steps: (m) => [
      `${m}切丁腌料酒淀粉`,
      "甜面酱+黄豆酱小火炒香",
      "下主料快炒变色",
      "加葱花起锅",
    ],
    extraIngs: [
      { name: "甜面酱", qty: "1 大勺", category: "调味/主食" },
      { name: "黄豆酱", qty: "1 大勺", category: "调味/主食" },
      GINGER_GARLIC,
    ],
    reasonTpl: (m) => `酱爆${m}酱香浓郁，老北京风味直接上桌。`,
    energy: ["下饭"],
  },
  {
    key: "shacha",
    zh: "沙茶",
    difficulty: "简单",
    timeBase: 20,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "粤菜",
    steps: (m) => [
      `${m}切片腌料酒淀粉`,
      "热油快炒至变色盛出",
      "下洋葱青椒煸香",
      "回锅主料调沙茶酱+蚝油+少水翻匀",
    ],
    extraIngs: [
      { name: "沙茶酱", qty: "2 大勺", category: "调味/主食" },
      OYSTER,
      { name: "洋葱", qty: "半个", category: "蔬菜" },
      { name: "青椒", qty: "1 个", category: "蔬菜" },
    ],
    reasonTpl: (m) => `沙茶${m}咸香微辛，潮汕排档招牌。`,
    energy: ["下饭"],
  },
  {
    key: "soybean-sauce-stew",
    zh: "黄豆酱烧",
    difficulty: "中等",
    timeBase: 40,
    tastes: ["咸鲜"],
    contains: [],
    cuisine: "东北",
    steps: (m) => [
      `${m}处理切块焯水`,
      "热油下八角桂皮葱姜爆香",
      "加黄豆酱炒香",
      "下主料和热水炖 30 分钟",
      "大火收汁",
    ],
    extraIngs: [
      { name: "黄豆酱", qty: "2 大勺", category: "调味/主食" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
      GINGER_GARLIC,
      DARK_SOY,
    ],
    reasonTpl: (m) => `酱香${m}炖到酥烂，东北铁锅炖味道。`,
    energy: ["暖胃", "驱寒", "适合冷"],
  },
];

// === 主食模板 ===
type StapleTpl = {
  id: string;
  name: string;
  cuisine: Cuisine;
  difficulty: Difficulty;
  timeMinutes: number;
  tastes: Taste[];
  contains: Restriction[];
  reason: string;
  steps: string[];
  ingredients: GenIngredient[];
  seasons?: Season[];
  weathers?: WeatherTag[];
  regions?: RegionTag[];
  slots?: MealSlotTag[];
  energy?: EnergyTag[];
};
const STAPLES: StapleTpl[] = [
  {
    id: "scallion-noodles",
    name: "葱油拌面",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["咸鲜"],
    contains: [],
    reason: "小香葱小火慢熬出葱油，一拌一勺鲜。",
    steps: ["小香葱切段，小火慢熬至焦黄出油", "煮面过凉", "拌入葱油+生抽+老抽+糖+少许虾米"],
    ingredients: [
      { name: "面条", qty: "300g", category: "调味/主食" },
      { name: "小香葱", qty: "1 大把", category: "蔬菜" },
      { name: "虾皮", qty: "10g", category: "肉蛋豆制品" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 小勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["春", "秋"],
    weathers: ["晴", "潮湿"],
    regions: ["华东"],
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  },
  {
    id: "egg-fried-rice-classic",
    name: "黄金蛋炒饭",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["咸鲜"],
    contains: ["无蛋"],
    reason: "蛋液裹米饭粒粒金黄，泡饭神器。",
    steps: ["米饭打散，鸡蛋打散倒入米饭拌匀", "热油下蛋裹米饭炒散", "加葱花生抽起锅"],
    ingredients: [
      { name: "隔夜米饭", qty: "2 碗", category: "调味/主食" },
      { name: "鸡蛋", qty: "3 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["春", "夏", "秋", "冬"],
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  },
  {
    id: "scallion-pancake",
    name: "葱花鸡蛋饼",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["咸鲜"],
    contains: ["无蛋"],
    reason: "面糊+葱花+蛋液一摊一翻，5 分钟出早餐。",
    steps: ["面粉+水+蛋液+盐调成糊，加葱花", "平底锅刷油倒一勺面糊", "中小火两面金黄"],
    ingredients: [
      { name: "面粉", qty: "200g", category: "调味/主食" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
    ],
    slots: ["breakfast", "lunch"],
    energy: ["快手"],
  },
  {
    id: "millet-porridge",
    name: "小米南瓜粥",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 35,
    tastes: ["清淡"],
    contains: [],
    reason: "金黄润胃，适合早餐或加班后晚餐替代。",
    steps: ["小米淘洗，南瓜切块", "冷水下锅大火煮开", "转小火 25 分钟煮至浓稠"],
    ingredients: [
      { name: "大米", qty: "30g", category: "调味/主食" },
      { name: "玉米", qty: "30g", category: "蔬菜" },
      { name: "南瓜", qty: "200g", category: "蔬菜" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    slots: ["breakfast", "dinner"],
    energy: ["暖胃", "清爽"],
  },
  {
    id: "tomato-egg-noodles",
    name: "番茄鸡蛋面",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["酸甜", "咸鲜"],
    contains: ["无蛋"],
    reason: "国民晚餐，番茄出汁鸡蛋滑嫩，一碗暖胃。",
    steps: ["番茄切块炒出汁", "鸡蛋打散倒入炒散", "加水煮开下面条 4 分钟", "调盐生抽撒葱花"],
    ingredients: [
      { name: "面条", qty: "150g", category: "调味/主食" },
      { name: "番茄", qty: "2 个", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["春", "秋", "冬"],
    weathers: ["冷", "雨"],
    slots: ["lunch", "dinner"],
    energy: ["暖胃", "快手"],
  },
  {
    id: "wonton-shrimp",
    name: "鲜虾小馄饨",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 35,
    tastes: ["清淡", "咸鲜"],
    contains: ["无海鲜"],
    reason: "汤清馅嫩，撒一把紫菜虾皮一秒回上海弄堂。",
    steps: ["虾仁剁茸+猪肉末+葱姜水+盐+蛋清打上劲", "馄饨皮包馅", "汤底：紫菜虾皮+小香葱+生抽+猪油", "馄饨煮浮起即捞入碗"],
    ingredients: [
      { name: "馄饨皮", qty: "1 包 (约 200g)", category: "调味/主食" },
      { name: "虾仁", qty: "150g", category: "肉蛋豆制品" },
      { name: "猪肉末", qty: "150g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "1 个 (取蛋清)", category: "肉蛋豆制品" },
      { name: "紫菜", qty: "5g", category: "调味/主食" },
      { name: "虾皮", qty: "10g", category: "肉蛋豆制品" },
      { name: "小香葱", qty: "1 把", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷", "雨"],
    regions: ["华东"],
    slots: ["lunch", "dinner"],
    energy: ["暖胃", "适合冷"],
  },
  {
    id: "scallion-rice",
    name: "葱油猪油饭",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["咸鲜"],
    contains: [],
    reason: "猪油+生抽+葱花，十秒拌饭征服全家。",
    steps: ["米饭刚出锅", "趁热拌入猪油+生抽+老抽+葱花", "撒糖糖少许提鲜"],
    ingredients: [
      { name: "米饭", qty: "2 碗", category: "调味/主食" },
      { name: "葱花", qty: "1 大把", category: "蔬菜" },
      { name: "猪油", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 小勺", category: "调味/主食" },
    ],
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  },
  {
    id: "potato-rice",
    name: "土豆排骨焖饭",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 50,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    reason: "电饭煲一键到底，排骨吸饱酱汁香。",
    steps: ["排骨腌生抽老抽蚝油糖姜片 15 分钟", "土豆胡萝卜切块", "电饭煲底铺米，铺排骨土豆胡萝卜", "加水至没过米 1 指节，煮饭键到底"],
    ingredients: [
      { name: "大米", qty: "300g", category: "调味/主食" },
      { name: "排骨", qty: "400g", category: "肉蛋豆制品" },
      { name: "土豆", qty: "1 个", category: "蔬菜" },
      { name: "胡萝卜", qty: "1 根", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "老抽", qty: "1 大勺", category: "调味/主食" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    slots: ["dinner"],
    energy: ["暖胃", "下饭"],
  },
  {
    id: "leek-dumplings",
    name: "韭菜猪肉饺子",
    cuisine: "东北",
    difficulty: "中等",
    timeMinutes: 60,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    reason: "皮薄馅大，沾醋一口一个，节日仪式感爆棚。",
    steps: ["面粉冷水揉光醒 30 分钟", "韭菜+猪肉末+葱姜水+生抽+香油+盐拌馅", "擀皮包饺子", "水开下锅煮至浮起加冷水共 2 次"],
    ingredients: [
      { name: "面粉", qty: "300g", category: "调味/主食" },
      { name: "韭菜", qty: "300g", category: "蔬菜" },
      { name: "猪肉末", qty: "300g", category: "肉蛋豆制品" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["冬"],
    weathers: ["冷"],
    regions: ["东北", "华北"],
    slots: ["lunch", "dinner"],
    energy: ["暖胃", "驱寒"],
  },
  {
    id: "century-egg-porridge",
    name: "皮蛋瘦肉粥",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 40,
    tastes: ["清淡", "咸鲜"],
    contains: ["无猪肉"],
    reason: "粤式经典夜宵，温和暖胃，感冒嗓子疼必点。",
    steps: ["猪里脊腌生抽淀粉胡椒粉", "大米淘洗加足量水煮 30 分钟至米花开", "下肉滑炒变色加皮蛋", "调盐胡椒撒葱花"],
    ingredients: [
      { name: "大米", qty: "100g", category: "调味/主食" },
      { name: "猪里脊", qty: "150g", category: "肉蛋豆制品" },
      { name: "皮蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "胡椒粉", qty: "1 小勺", category: "调味/主食" },
    ],
    weathers: ["雨", "冷"],
    regions: ["华南", "华东"],
    slots: ["breakfast", "dinner"],
    energy: ["暖胃", "清爽"],
  },
  {
    id: "lanzhou-noodle",
    name: "兰州牛肉面",
    cuisine: "西北",
    difficulty: "中等",
    timeMinutes: 90,
    tastes: ["咸鲜", "微辣"],
    contains: ["无牛肉"],
    reason: "一清二白三红四绿五黄，西北灵魂面食。",
    steps: ["牛腩冷水下锅焯水", "加葱姜八角桂皮花椒草果煮 60 分钟", "汤滤清调盐胡椒", "煮面过凉，码牛肉萝卜片香菜葱花辣油"],
    ingredients: [
      { name: "面条", qty: "300g", category: "调味/主食" },
      { name: "牛腩", qty: "400g", category: "肉蛋豆制品" },
      { name: "白萝卜", qty: "半根", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "香菜", qty: "1 把", category: "蔬菜" },
      { name: "辣油", qty: "1 大勺", category: "调味/主食" },
      { name: "八角", qty: "2 个", category: "调味/主食" },
    ],
    regions: ["西北"],
    seasons: ["秋", "冬"],
    slots: ["lunch", "dinner"],
    energy: ["暖胃", "驱寒"],
  },
  {
    id: "shrimp-fried-rice",
    name: "扬州炒饭",
    cuisine: "江浙",
    difficulty: "中等",
    timeMinutes: 18,
    tastes: ["咸鲜"],
    contains: ["无海鲜"],
    reason: "金镶玉，五彩齐全，宴客也不失礼。",
    steps: ["米饭打散", "鸡蛋滑炒", "下虾仁火腿丁炒香", "加豌豆玉米下米饭翻炒至粒粒分明"],
    ingredients: [
      { name: "隔夜米饭", qty: "3 碗", category: "调味/主食" },
      { name: "虾仁", qty: "100g", category: "肉蛋豆制品" },
      { name: "火腿", qty: "100g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "玉米", qty: "50g", category: "蔬菜" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    regions: ["华东"],
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  },
  {
    id: "soft-bao",
    name: "蒸馒头夹辣子",
    cuisine: "西北",
    difficulty: "简单",
    timeMinutes: 20,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    reason: "馒头掰开夹油泼辣子，简单也满足。",
    steps: ["馒头蒸热", "辣椒粉葱花花椒+热油泼香+蒜末盐", "馒头掰开夹辣子"],
    ingredients: [
      { name: "馒头", qty: "4 个", category: "调味/主食" },
      { name: "辣椒粉", qty: "2 大勺", category: "调味/主食" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "食用油", qty: "2 大勺", category: "调味/主食" },
    ],
    regions: ["西北", "华北"],
    seasons: ["秋", "冬"],
    slots: ["breakfast", "lunch"],
    energy: ["快手", "暖胃"],
  },
  {
    id: "biangbiang-noodle",
    name: "油泼面",
    cuisine: "西北",
    difficulty: "中等",
    timeMinutes: 30,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    reason: "宽面+辣椒粉+葱姜蒜+热油一泼，西北人的灵魂晚餐。",
    steps: ["手擀面或买的宽面煮熟过凉", "面上铺辣椒粉+蒜末+葱花+花椒粉", "热油大火烧到冒烟泼上去", "倒生抽醋拌匀"],
    ingredients: [
      { name: "手擀面", qty: "300g", category: "调味/主食" },
      { name: "辣椒粉", qty: "3 大勺", category: "调味/主食" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "葱花", qty: "1 把", category: "蔬菜" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
      { name: "食用油", qty: "3 大勺", category: "调味/主食" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
    ],
    regions: ["西北"],
    slots: ["lunch", "dinner"],
    energy: ["快手", "下饭"],
  },
  {
    id: "rice-cake-stir",
    name: "炒年糕",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["咸鲜"],
    contains: ["无猪肉"],
    reason: "Q 弹年糕配青菜肉丝，江浙人的童年。",
    steps: ["年糕泡软", "肉丝腌生抽淀粉滑炒变色盛出", "下青菜炒软加年糕翻炒", "回锅肉丝加生抽糖少水翻匀"],
    ingredients: [
      { name: "切片年糕", qty: "300g", category: "调味/主食" },
      { name: "猪里脊", qty: "100g", category: "肉蛋豆制品" },
      { name: "小白菜", qty: "200g", category: "蔬菜" },
      { name: "生抽", qty: "2 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
    regions: ["华东"],
    slots: ["lunch", "dinner"],
    energy: ["下饭"],
  },
  {
    id: "soy-milk",
    name: "原味豆浆",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 30,
    tastes: ["清淡"],
    contains: [],
    reason: "热豆浆配油条，国民级早餐双子星。",
    steps: ["黄豆泡 8 小时", "破壁机磨浆", "煮沸 5 分钟撇沫", "加糖或加盐随口"],
    ingredients: [
      { name: "黄豆", qty: "100g", category: "肉蛋豆制品" },
      { name: "白糖", qty: "1 大勺 (可选)", category: "调味/主食" },
    ],
    slots: ["breakfast"],
    energy: ["快手", "暖胃"],
  },
  {
    id: "youtiao",
    name: "现炸油条",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 60,
    tastes: ["咸鲜"],
    contains: [],
    reason: "蓬松金黄，配豆浆是万年经典。",
    steps: ["面粉+酵母+小苏打+盐+水揉光", "醒发 30 分钟", "切条两两叠压拉长", "180℃ 油炸至金黄"],
    ingredients: [
      { name: "面粉", qty: "300g", category: "调味/主食" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "食用油", qty: "1 锅", category: "调味/主食" },
    ],
    slots: ["breakfast"],
    energy: [],
  },
  {
    id: "steamed-bun",
    name: "蒸花卷",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 90,
    tastes: ["清淡"],
    contains: [],
    reason: "麦香松软，配粥喝最熨贴。",
    steps: ["面粉+酵母+水揉光发酵", "擀薄抹油+葱花+椒盐", "切段卷成花卷", "蒸 20 分钟"],
    ingredients: [
      { name: "面粉", qty: "400g", category: "调味/主食" },
      { name: "葱花", qty: "1 大把", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    slots: ["breakfast", "lunch"],
    energy: ["暖胃"],
  },
  {
    id: "congee-plain",
    name: "白粥",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 50,
    tastes: ["清淡"],
    contains: [],
    reason: "胃不舒服时最暖的一碗，配咸菜或皮蛋都行。",
    steps: ["米淘洗加足量水", "大火煮开转小火", "煮 40 分钟至开花浓稠"],
    ingredients: [{ name: "大米", qty: "100g", category: "调味/主食" }],
    slots: ["breakfast", "dinner"],
    energy: ["暖胃", "清爽"],
  },
  {
    id: "egg-bread-toast",
    name: "蛋液吐司",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["咸鲜"],
    contains: ["无蛋", "无奶"],
    reason: "5 分钟早餐，鸡蛋牛奶裹吐司外焦内嫩。",
    steps: ["鸡蛋打散加牛奶盐", "吐司切片浸蛋液", "黄油煎至金黄"],
    ingredients: [
      { name: "面包", qty: "4 片", category: "调味/主食" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "牛奶", qty: "100ml", category: "调味/主食" },
      { name: "黄油", qty: "10g", category: "调味/主食" },
    ],
    slots: ["breakfast"],
    energy: ["快手"],
  },
  {
    id: "rice-noodle-souffle",
    name: "桂林米粉",
    cuisine: "粤菜",
    difficulty: "中等",
    timeMinutes: 30,
    tastes: ["咸鲜", "微辣"],
    contains: ["无猪肉"],
    reason: "卤味浓郁的桂林街头味，一碗比饭店还好吃。",
    steps: ["米粉煮 2 分钟过凉", "卤汁淋上", "码花生酸豆角脆豆+葱花辣椒油", "拌匀大快朵颐"],
    ingredients: [
      { name: "米粉", qty: "300g", category: "调味/主食" },
      { name: "卤猪肉", qty: "150g", category: "肉蛋豆制品" },
      { name: "花生米", qty: "30g", category: "调味/主食" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "辣油", qty: "1 大勺", category: "调味/主食" },
    ],
    regions: ["华南"],
    slots: ["lunch", "dinner"],
    energy: ["下饭"],
  },
  {
    id: "breakfast-omelet",
    name: "鸡蛋灌饼",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["咸鲜"],
    contains: ["无蛋"],
    reason: "薄饼里灌进金黄蛋液+生菜+辣酱，街边最爱。",
    steps: ["面粉+水揉光擀薄", "平底锅烙至两面起泡分层", "撕开口灌入蛋液", "再煎到熟夹生菜抹辣酱"],
    ingredients: [
      { name: "面粉", qty: "200g", category: "调味/主食" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "生菜", qty: "几片", category: "蔬菜" },
      { name: "甜面酱", qty: "1 大勺", category: "调味/主食" },
      { name: "辣油", qty: "1 小勺", category: "调味/主食" },
    ],
    slots: ["breakfast", "lunch"],
    energy: ["快手"],
  },
  {
    id: "summer-cool-noodle",
    name: "凉皮",
    cuisine: "西北",
    difficulty: "中等",
    timeMinutes: 30,
    tastes: ["微辣", "酸甜"],
    contains: [],
    reason: "夏天救命主食，酸辣酱汁让你瞬间清醒。",
    steps: ["凉皮泡软切条", "黄瓜切丝", "调汁：蒜泥+生抽+醋+辣油+糖+盐", "拌入芝麻酱"],
    ingredients: [
      { name: "凉皮", qty: "300g", category: "调味/主食" },
      { name: "黄瓜", qty: "1 根", category: "蔬菜" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "辣油", qty: "2 大勺", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "芝麻酱", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    regions: ["西北", "华北"],
    slots: ["lunch", "dinner"],
    energy: ["解暑", "清爽", "适合热"],
  },
];

// === 汤模板 ===
type SoupTpl = StapleTpl;
const SOUPS: SoupTpl[] = [
  {
    id: "tomato-egg-soup",
    name: "番茄蛋花汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["酸甜", "清淡"],
    contains: ["无蛋"],
    reason: "国民开胃汤，酸甜清爽，3 分钟出锅。",
    steps: ["番茄切块煸出汁", "加水煮开", "鸡蛋打散淋成蛋花", "调盐撒葱花"],
    ingredients: [
      { name: "番茄", qty: "2 个", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    energy: ["快手", "清爽"],
  },
  {
    id: "winter-melon-rib-soup",
    name: "冬瓜排骨汤",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 80,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    reason: "汤清排骨酥烂，夏日清润代表。",
    steps: ["排骨焯水", "下姜片煮 60 分钟", "加冬瓜煮 15 分钟", "调盐少许"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "冬瓜", qty: "500g", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    energy: ["清爽", "解暑", "适合热", "慢炖"],
  },
  {
    id: "radish-rib-soup",
    name: "白萝卜排骨汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 75,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    reason: "白萝卜化痰润肺，秋冬最暖。",
    steps: ["排骨焯水", "白萝卜切块", "砂锅加水煮 60 分钟", "调盐撒葱花"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "白萝卜", qty: "1 根 (500g)", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    energy: ["暖胃", "驱寒", "适合冷", "慢炖"],
  },
  {
    id: "seaweed-egg-soup",
    name: "紫菜蛋花汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: ["无蛋"],
    reason: "5 分钟出锅，鲜味满分。",
    steps: ["紫菜虾皮泡碗里", "热水冲开", "加鸡蛋液成花", "调盐胡椒香油"],
    ingredients: [
      { name: "紫菜", qty: "5g", category: "调味/主食" },
      { name: "虾皮", qty: "10g", category: "肉蛋豆制品" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    energy: ["快手", "清爽"],
  },
  {
    id: "corn-rib-soup",
    name: "玉米排骨汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 75,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    reason: "玉米的甜+排骨的香，孩子最爱的家庭汤。",
    steps: ["排骨焯水", "玉米切段，胡萝卜切块", "砂锅加水煮 60 分钟", "调盐"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "玉米", qty: "2 根", category: "蔬菜" },
      { name: "胡萝卜", qty: "1 根", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
    ],
    seasons: ["秋", "冬"],
    energy: ["暖胃", "慢炖"],
  },
  {
    id: "kelp-pork-soup",
    name: "海带豆腐汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 25,
    tastes: ["清淡"],
    contains: [],
    reason: "海带+嫩豆腐，简单清淡刮油又补碘。",
    steps: ["海带泡发切块", "热水煮开", "下豆腐煮 5 分钟", "调盐胡椒撒葱花"],
    ingredients: [
      { name: "海带", qty: "100g", category: "蔬菜" },
      { name: "嫩豆腐", qty: "1 盒 (400g)", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    energy: ["清爽"],
  },
  {
    id: "tofu-fish-soup",
    name: "鲫鱼豆腐汤",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 35,
    tastes: ["清淡"],
    contains: ["无海鲜"],
    reason: "汤奶白浓鲜，月子期的国民补汤。",
    steps: ["鱼煎至两面金黄", "冲入开水大火煮 15 分钟出奶白", "下豆腐煮 10 分钟", "调盐撒葱花"],
    ingredients: [
      { name: "鲫鱼", qty: "1 条 (约 500g)", category: "肉蛋豆制品" },
      { name: "嫩豆腐", qty: "1 盒", category: "肉蛋豆制品" },
      { name: "姜片", qty: "5 片", category: "蔬菜" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    weathers: ["冷"],
    energy: ["暖胃", "适合冷"],
  },
  {
    id: "sour-pickle-soup",
    name: "酸菜鱼片汤",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["微辣", "酸甜"],
    contains: ["无海鲜"],
    reason: "酸辣开胃汤，下饭也好喝。",
    steps: ["鱼片用蛋清淀粉腌", "酸菜炒香加水煮汤底", "下鱼片煮 1 分半", "撒葱花辣椒油"],
    ingredients: [
      { name: "草鱼", qty: "300g (鱼片)", category: "肉蛋豆制品" },
      { name: "酸菜", qty: "200g", category: "蔬菜" },
      { name: "鸡蛋", qty: "1 个 (取蛋清)", category: "肉蛋豆制品" },
      { name: "辣油", qty: "1 大勺", category: "调味/主食" },
    ],
    energy: ["下饭"],
  },
  {
    id: "mushroom-chicken-soup",
    name: "香菇鸡汤",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 80,
    tastes: ["清淡"],
    contains: [],
    reason: "鸡肉酥烂菇香入味，全家通补冬日必喝。",
    steps: ["鸡块焯水", "下姜片香菇煮 60 分钟", "加红枣枸杞煮 10 分钟", "调盐少许"],
    ingredients: [
      { name: "整鸡", qty: "半只 (800g)", category: "肉蛋豆制品" },
      { name: "香菇", qty: "100g", category: "蔬菜" },
      { name: "红枣", qty: "5 颗", category: "调味/主食" },
      { name: "枸杞", qty: "10g", category: "调味/主食" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    energy: ["驱寒", "暖胃", "慢炖", "适合冷"],
  },
  {
    id: "lamb-radish-soup",
    name: "羊肉萝卜汤",
    cuisine: "西北",
    difficulty: "中等",
    timeMinutes: 90,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    reason: "羊肉酥香萝卜清润，零下天气最暖。",
    steps: ["羊肉焯水", "下姜片葱段花椒煮 60 分钟", "加白萝卜煮 20 分钟", "调盐撒香菜"],
    ingredients: [
      { name: "羊肉", qty: "500g", category: "肉蛋豆制品" },
      { name: "白萝卜", qty: "半根", category: "蔬菜" },
      { name: "姜", qty: "1 块", category: "蔬菜" },
      { name: "香菜", qty: "1 把", category: "蔬菜" },
      { name: "花椒", qty: "1 小勺", category: "调味/主食" },
    ],
    seasons: ["冬"],
    weathers: ["冷"],
    regions: ["西北", "华北"],
    energy: ["驱寒", "暖胃", "适合冷", "慢炖"],
  },
  {
    id: "potato-tomato-beef-soup",
    name: "番茄土豆牛肉汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 60,
    tastes: ["酸甜"],
    contains: ["无牛肉"],
    reason: "酸酸甜甜，胃口不好的傍晚来一碗。",
    steps: ["牛腩焯水", "番茄炒出汁", "下牛腩煮 40 分钟", "加土豆煮 15 分钟调盐"],
    ingredients: [
      { name: "牛腩", qty: "300g", category: "肉蛋豆制品" },
      { name: "番茄", qty: "3 个", category: "蔬菜" },
      { name: "土豆", qty: "2 个", category: "蔬菜" },
      { name: "葱姜", qty: "适量", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    energy: ["暖胃"],
  },
  {
    id: "cabbage-tofu-soup",
    name: "白菜豆腐汤",
    cuisine: "东北",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["清淡"],
    contains: [],
    reason: "极简一锅汤，胃寒人士的救星。",
    steps: ["白菜手撕", "热油煸蒜片", "加水煮开下白菜豆腐", "调盐胡椒撒葱花"],
    ingredients: [
      { name: "白菜", qty: "300g", category: "蔬菜" },
      { name: "嫩豆腐", qty: "1 盒", category: "肉蛋豆制品" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "胡椒粉", qty: "1 小勺", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    regions: ["东北", "华北"],
    energy: ["暖胃", "适合冷"],
  },
  {
    id: "lotus-rib-soup",
    name: "莲藕排骨汤",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 90,
    tastes: ["清淡"],
    contains: ["无猪肉"],
    reason: "莲藕粉糯排骨酥烂，秋冬补养首选。",
    steps: ["排骨焯水", "莲藕切块加姜片煮 70 分钟", "调盐撒葱花"],
    ingredients: [
      { name: "排骨", qty: "500g", category: "肉蛋豆制品" },
      { name: "莲藕", qty: "1 节 (300g)", category: "蔬菜" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    regions: ["华中"],
    energy: ["暖胃", "驱寒", "慢炖"],
  },
  {
    id: "pumpkin-cream-soup",
    name: "南瓜浓汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 25,
    tastes: ["清淡"],
    contains: ["无奶"],
    reason: "金黄香浓，加点黑胡椒和奶油就是西餐厅味道。",
    steps: ["南瓜切块蒸熟", "破壁机加牛奶打成泥", "倒回锅煮 5 分钟", "调盐黑胡椒"],
    ingredients: [
      { name: "南瓜", qty: "500g", category: "蔬菜" },
      { name: "牛奶", qty: "200ml", category: "调味/主食" },
      { name: "黑胡椒", qty: "1 小勺", category: "调味/主食" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["秋"],
    energy: ["暖胃"],
  },
  {
    id: "luffa-egg-soup",
    name: "丝瓜蛋花汤",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡"],
    contains: ["无蛋"],
    reason: "翠绿丝瓜+金黄蛋花，夏天清润首选。",
    steps: ["丝瓜削皮切滚刀", "热油爆姜片下丝瓜", "加水煮 5 分钟", "鸡蛋打散淋入成花，调盐"],
    ingredients: [
      { name: "丝瓜", qty: "2 根", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "姜片", qty: "3 片", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    energy: ["解暑", "清爽", "适合热"],
  },
];

// === 素菜模板 ===
type VegTpl = StapleTpl;
const VEGGIES: VegTpl[] = [
  {
    id: "stir-spinach",
    name: "蒜炒菠菜",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    reason: "5 分钟绿叶菜，补铁解腻。",
    steps: ["菠菜洗净切段", "蒜片爆香", "大火快炒 1 分钟", "盐少许出锅"],
    ingredients: [
      { name: "菠菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    energy: ["快手", "清爽"],
  },
  {
    id: "stir-leek-bean",
    name: "韭菜炒豆芽",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡"],
    contains: [],
    reason: "脆嫩清爽 5 分钟出锅。",
    steps: ["韭菜切段，豆芽洗净", "热油爆蒜末", "下豆芽炒断生", "加韭菜段和盐翻匀"],
    ingredients: [
      { name: "韭菜", qty: "200g", category: "蔬菜" },
      { name: "豆芽", qty: "300g", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["春", "夏"],
    energy: ["快手", "清爽"],
  },
  {
    id: "spicy-cabbage",
    name: "干锅花菜",
    cuisine: "川菜",
    difficulty: "中等",
    timeMinutes: 18,
    tastes: ["微辣", "咸鲜"],
    contains: [],
    reason: "焦香花菜+腊肠+干辣椒，开胃下饭。",
    steps: ["花菜掰小朵焯水", "腊肠切片煸出油", "下干辣椒蒜末爆香", "回锅花菜调豆瓣酱生抽翻匀"],
    ingredients: [
      { name: "西兰花", qty: "1 颗 (400g)", category: "蔬菜" },
      { name: "腊肠", qty: "100g", category: "肉蛋豆制品" },
      { name: "干辣椒", qty: "5 根", category: "调味/主食" },
      { name: "豆瓣酱", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    energy: ["下饭"],
  },
  {
    id: "sour-fungus",
    name: "凉拌木耳",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡", "酸甜"],
    contains: [],
    reason: "脆爽降火，宿醉第二天首选。",
    steps: ["木耳泡发焯水过凉", "调料：蒜末+生抽+醋+香油+小米辣", "拌匀冷藏 5 分钟"],
    ingredients: [
      { name: "木耳", qty: "30g (干)", category: "蔬菜" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "小米辣", qty: "2 个", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    energy: ["解暑", "清爽", "适合热"],
  },
  {
    id: "stir-cabbage-pork",
    name: "醋溜白菜叶",
    cuisine: "鲁菜",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["酸甜"],
    contains: [],
    reason: "白菜帮子吸醋香，比肉好吃。",
    steps: ["白菜帮切片，叶切大块", "干辣椒爆香", "下白菜帮快炒 1 分钟再下叶", "倒醋糖生抽勾汁翻匀"],
    ingredients: [
      { name: "白菜", qty: "半颗", category: "蔬菜" },
      { name: "干辣椒", qty: "3 根", category: "调味/主食" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "淀粉", qty: "1 小勺", category: "调味/主食" },
    ],
    energy: ["快手"],
  },
  {
    id: "stir-luffa",
    name: "蒜炒丝瓜",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡"],
    contains: [],
    reason: "翠绿丝瓜+蒜香，夏天清润。",
    steps: ["丝瓜削皮切滚刀", "热油爆蒜末", "下丝瓜大火快炒 2 分钟", "调盐少许"],
    ingredients: [
      { name: "丝瓜", qty: "2 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    energy: ["解暑", "清爽", "适合热"],
  },
  {
    id: "tiger-pepper",
    name: "虎皮青椒",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["微辣"],
    contains: [],
    reason: "煎到起泡的青椒带焦香，饭杀手。",
    steps: ["青椒去籽不切", "少油小火煎至两面起虎皮", "倒生抽+醋+糖+少水焖 1 分钟"],
    ingredients: [
      { name: "尖椒", qty: "8 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 小勺", category: "调味/主食" },
      { name: "糖", qty: "1 小勺", category: "调味/主食" },
    ],
    energy: ["下饭"],
  },
  {
    id: "stir-kale-garlic",
    name: "蒜蓉芥蓝",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 8,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    reason: "脆嫩翠绿，粤式茶餐厅经典。",
    steps: ["芥蓝去筋切段焯水", "热油爆蒜末", "下芥蓝快炒，淋蚝油生抽糖"],
    ingredients: [
      { name: "小白菜", qty: "1 把 (300g)", category: "蔬菜" },
      { name: "蒜", qty: "5 瓣", category: "蔬菜" },
      { name: "蚝油", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    regions: ["华南"],
    energy: ["清爽", "快手"],
  },
  {
    id: "celery-tofu",
    name: "芹菜炒香干",
    cuisine: "江浙",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    reason: "脆芹菜+豆干，安静好吃的家常素菜。",
    steps: ["芹菜切段焯水 10 秒", "豆干切条", "热油爆姜蒜，下豆干芹菜大火快炒", "调盐生抽香油起锅"],
    ingredients: [
      { name: "芹菜", qty: "300g", category: "蔬菜" },
      { name: "豆干", qty: "200g", category: "肉蛋豆制品" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    energy: ["快手"],
  },
  {
    id: "carrot-sliver",
    name: "胡萝卜丝炒蛋",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["清淡", "咸鲜"],
    contains: ["无蛋"],
    reason: "胡萝卜素需油溶才能吸收，配蛋最对。",
    steps: ["胡萝卜切丝", "鸡蛋打散滑炒", "下胡萝卜丝炒软", "调盐少许"],
    ingredients: [
      { name: "胡萝卜", qty: "2 根", category: "蔬菜" },
      { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
      { name: "盐", qty: "适量", category: "调味/主食" },
      { name: "食用油", qty: "1 大勺", category: "调味/主食" },
    ],
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  },
  {
    id: "salt-cucumber",
    name: "腌脆黄瓜",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 30,
    tastes: ["酸甜", "微辣"],
    contains: [],
    reason: "脆得能听见声响，配粥神器。",
    steps: ["黄瓜切条加盐杀水 20 分钟", "挤干水分", "拌入糖醋蒜末小米辣冷藏 20 分钟"],
    ingredients: [
      { name: "黄瓜", qty: "2 根", category: "蔬菜" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "小米辣", qty: "2 个", category: "蔬菜" },
      { name: "醋", qty: "2 大勺", category: "调味/主食" },
      { name: "糖", qty: "1 大勺", category: "调味/主食" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
    ],
    seasons: ["夏"],
    weathers: ["热"],
    energy: ["解暑", "清爽", "适合热"],
  },
  {
    id: "celery-cashew",
    name: "腰果西芹百合",
    cuisine: "粤菜",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡"],
    contains: [],
    reason: "脆爽不腻、颜色淡雅，宴客拿得出手。",
    steps: ["西芹切段焯水", "腰果煸至金黄", "热油爆蒜，下西芹百合炒断生", "下腰果调盐起锅"],
    ingredients: [
      { name: "芹菜", qty: "300g", category: "蔬菜" },
      { name: "腰果", qty: "60g", category: "调味/主食" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "盐", qty: "适量", category: "调味/主食" },
    ],
    energy: ["清爽"],
  },
  {
    id: "cold-tofu-skin",
    name: "凉拌豆皮",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡", "微辣"],
    contains: [],
    reason: "豆皮吸汁，配饭配酒都行。",
    steps: ["豆皮切丝焯水过凉", "调料：蒜末+生抽+醋+辣油+香油", "拌匀冷藏 10 分钟"],
    ingredients: [
      { name: "豆干", qty: "300g", category: "肉蛋豆制品" },
      { name: "蒜末", qty: "1 大勺", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "醋", qty: "1 大勺", category: "调味/主食" },
      { name: "辣油", qty: "1 小勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    energy: ["清爽", "快手"],
  },
  {
    id: "soft-eggplant",
    name: "蒸茄子",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 18,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    reason: "蒸出来软糯，零油烟夏日好选。",
    steps: ["茄子切条蒸 12 分钟", "撕条装盘", "蒜末+生抽+醋+香油+小米辣淋上"],
    ingredients: [
      { name: "茄子", qty: "2 根", category: "蔬菜" },
      { name: "蒜", qty: "3 瓣", category: "蔬菜" },
      { name: "小米辣", qty: "1 个", category: "蔬菜" },
      { name: "生抽", qty: "1 大勺", category: "调味/主食" },
      { name: "香油", qty: "1 小勺", category: "调味/主食" },
    ],
    seasons: ["夏"],
    energy: ["清爽", "解暑"],
  },
];

// === 子门类模板（甜品 / 饮品 / 小吃 / 早餐 / 夜宵 / 烘焙 / 轻食 / 下午茶） ===
// 这些模板的 course 多为 staple；通过 category 标签暴露在「门类浏览」中。
type CatTpl = {
  id: string;
  name: string;
  cuisine: Cuisine;
  course: Course;
  category: Category;
  difficulty: Difficulty;
  timeMinutes: number;
  tastes: Taste[];
  contains: Restriction[];
  reason: string;
  steps: string[];
  ingredients: GenIngredient[];
  serves?: number;
  seasons?: Season[];
  weathers?: WeatherTag[];
  regions?: RegionTag[];
  slots?: MealSlotTag[];
  energy?: EnergyTag[];
};

// 甜品（中式 + 网红 + 简单家庭甜品）
const DESSERTS: CatTpl[] = [
  { id: "dessert-mango-pomelo-sago", name: "杨枝甘露", cuisine: "粤菜", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 25, tastes: ["酸甜", "清淡"], contains: ["无奶"], reason: "港式糖水扛把子，芒果果汁裹西米，一勺到底。", steps: ["西米煮 15 分钟过凉至透明", "芒果切丁榨汁", "椰汁+淡奶油+糖调底", "拌入西米芒果丁柚子粒"], ingredients: [{name:"芒果",qty:"2 个",category:"蔬菜"},{name:"椰浆",qty:"200ml",category:"调味/主食"},{name:"淡奶油",qty:"100ml",category:"调味/主食"},{name:"西米",qty:"60g",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], seasons:["夏"], weathers:["热"], slots:["lunch","dinner"], energy:["解暑","清爽"] },
  { id: "dessert-double-skin-milk", name: "双皮奶", cuisine: "粤菜", course: "staple", category: "甜品", difficulty: "中等", timeMinutes: 40, tastes: ["清淡", "酸甜"], contains: ["无奶","无蛋"], reason: "顺德经典，第一层奶皮+第二层蛋奶羹。", steps: ["牛奶煮沸放凉结奶皮", "倒出牛奶留奶皮在碗底", "蛋清+糖+牛奶搅匀过筛", "回倒进碗封保鲜膜中火蒸 12 分钟"], ingredients:[{name:"牛奶",qty:"500ml",category:"调味/主食"},{name:"鸡蛋",qty:"3 个 (取蛋清)",category:"肉蛋豆制品"},{name:"糖",qty:"40g",category:"调味/主食"}], regions:["华南"], slots:["dinner"], energy:["清爽"] },
  { id: "dessert-tangyuan", name: "黑芝麻汤圆", cuisine: "江浙", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 20, tastes: ["酸甜"], contains: [], reason: "圆滚滚甜蜜蜜，元宵冬至必备。", steps: ["糯米粉+温水揉光", "包入黑芝麻馅", "水开下锅煮至浮起再煮 2 分钟"], ingredients:[{name:"糯米粉",qty:"200g",category:"调味/主食"},{name:"黑芝麻馅",qty:"150g",category:"调味/主食"}], seasons:["冬"], slots:["breakfast","dinner"], energy:["暖胃"] },
  { id: "dessert-red-bean-soup", name: "红豆沙糖水", cuisine: "粤菜", course: "soup", category: "甜品", difficulty: "简单", timeMinutes: 90, tastes: ["酸甜"], contains: [], reason: "暖暖一碗，养胃又润。", steps: ["红豆泡 4 小时", "高压锅压 30 分钟至软", "加糖再煮 10 分钟收浓"], ingredients:[{name:"红豆",qty:"200g",category:"调味/主食"},{name:"陈皮",qty:"1 片",category:"调味/主食"},{name:"冰糖",qty:"60g",category:"调味/主食"}], seasons:["秋","冬"], regions:["华南"], slots:["dinner"], energy:["暖胃","慢炖"] },
  { id: "dessert-mung-bean-soup", name: "绿豆汤", cuisine: "家常", course: "soup", category: "甜品", difficulty: "简单", timeMinutes: 50, tastes: ["清淡"], contains: [], reason: "夏日消暑神器，冰镇尤佳。", steps: ["绿豆洗净", "冷水下锅煮 40 分钟", "加冰糖煮溶", "放凉冰镇"], ingredients:[{name:"绿豆",qty:"200g",category:"调味/主食"},{name:"冰糖",qty:"60g",category:"调味/主食"}], seasons:["夏"], weathers:["热"], slots:["lunch","dinner"], energy:["解暑","清爽","适合热"] },
  { id: "dessert-osmanthus-jelly", name: "桂花糕", cuisine: "江浙", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 30, tastes: ["酸甜"], contains: [], reason: "晶莹剔透，桂花香气袭人。", steps: ["糯米粉+水+糖搅匀", "倒入模具中火蒸 25 分钟", "撒桂花蜜冷藏切块"], ingredients:[{name:"糯米粉",qty:"150g",category:"调味/主食"},{name:"桂花",qty:"5g",category:"调味/主食"},{name:"糖",qty:"40g",category:"调味/主食"}], seasons:["秋"], regions:["华东"], energy:["清爽"] },
  { id: "dessert-egg-tart", name: "葡式蛋挞", cuisine: "粤菜", course: "staple", category: "烘焙", difficulty: "中等", timeMinutes: 50, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "外酥里嫩，烤箱新手挑战款。", steps: ["蛋黄+糖+牛奶+淡奶油拌匀过筛", "倒入挞皮 8 分满", "200℃ 烤 25 分钟出焦斑"], ingredients:[{name:"蛋挞皮",qty:"10 个",category:"调味/主食"},{name:"鸡蛋",qty:"2 个 (取蛋黄)",category:"肉蛋豆制品"},{name:"淡奶油",qty:"100ml",category:"调味/主食"},{name:"牛奶",qty:"80ml",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], slots:["lunch","dinner"], energy:["清爽"] },
  { id: "dessert-bobing", name: "驴打滚", cuisine: "鲁菜", course: "staple", category: "甜品", difficulty: "中等", timeMinutes: 50, tastes: ["酸甜"], contains: [], reason: "豆面香浓糯米弹牙，老北京小吃。", steps: ["糯米粉+水蒸 25 分钟", "炒熟黄豆面铺底", "糯米团擀薄抹豆沙卷起"], ingredients:[{name:"糯米粉",qty:"200g",category:"调味/主食"},{name:"黄豆粉",qty:"50g",category:"调味/主食"},{name:"红豆沙",qty:"150g",category:"调味/主食"}], regions:["华北"], energy:["清爽"] },
  { id: "dessert-jiaobing", name: "焦糖布丁", cuisine: "家常", course: "staple", category: "甜品", difficulty: "中等", timeMinutes: 40, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "焦糖+蛋奶香，舀一勺幸福满满。", steps: ["糖小火熬焦糖倒入碗底", "鸡蛋+牛奶+糖搅匀过筛", "倒入碗中盖锡纸蒸 25 分钟", "冷藏脱模"], ingredients:[{name:"鸡蛋",qty:"3 个",category:"肉蛋豆制品"},{name:"牛奶",qty:"300ml",category:"调味/主食"},{name:"糖",qty:"60g",category:"调味/主食"}], energy:["清爽"] },
  { id: "dessert-tofu-pudding", name: "红糖豆腐花", cuisine: "粤菜", course: "staple", category: "甜品", difficulty: "中等", timeMinutes: 25, tastes: ["酸甜"], contains: [], reason: "嫩豆花配红糖姜汁，秋冬温补。", steps: ["内酯倒入碗", "热豆浆冲入静置 15 分钟", "红糖加水熬化", "淋糖姜汁"], ingredients:[{name:"豆浆",qty:"500ml",category:"调味/主食"},{name:"内酯",qty:"3g",category:"调味/主食"},{name:"红糖",qty:"30g",category:"调味/主食"},{name:"姜",qty:"1 块",category:"蔬菜"}], seasons:["秋","冬"], regions:["华南"], energy:["暖胃"] },
  { id: "dessert-purple-rice", name: "紫米露", cuisine: "粤菜", course: "soup", category: "甜品", difficulty: "简单", timeMinutes: 60, tastes: ["酸甜"], contains: [], reason: "紫米+椰浆，糯而不腻。", steps: ["紫米泡 4 小时", "煮 40 分钟至软", "加椰浆冰糖煮 5 分钟"], ingredients:[{name:"紫米",qty:"100g",category:"调味/主食"},{name:"椰浆",qty:"200ml",category:"调味/主食"},{name:"冰糖",qty:"40g",category:"调味/主食"}], regions:["华南"], slots:["dinner"], energy:["暖胃"] },
  { id: "dessert-sticky-rice-cake", name: "南瓜糯米饼", cuisine: "家常", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 25, tastes: ["酸甜"], contains: [], reason: "金黄可爱，外脆内软，连小朋友都抢。", steps: ["南瓜蒸熟压泥", "+糯米粉+糖揉光", "搓圆压扁", "平底锅小火煎至两面金黄"], ingredients:[{name:"南瓜",qty:"300g",category:"蔬菜"},{name:"糯米粉",qty:"200g",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], seasons:["秋"], slots:["breakfast","lunch"], energy:["暖胃"] },
  { id: "dessert-snowflake-crisp", name: "雪花酥", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "中等", timeMinutes: 40, tastes: ["酸甜"], contains: ["无奶","无花生"], reason: "棉花糖+饼干+果仁，年货新宠。", steps: ["黄油棉花糖小火融化", "加奶粉拌匀离火", "拌入饼干蔓越莓花生", "压平冷却切块"], ingredients:[{name:"棉花糖",qty:"150g",category:"调味/主食"},{name:"饼干",qty:"200g",category:"调味/主食"},{name:"奶粉",qty:"80g",category:"调味/主食"},{name:"花生米",qty:"60g",category:"调味/主食"},{name:"黄油",qty:"30g",category:"调味/主食"}], seasons:["冬"], energy:["清爽"] },
  { id: "dessert-icejelly", name: "冰粉", cuisine: "川菜", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 15, tastes: ["酸甜"], contains: [], reason: "夏日街边王者，红糖花生芝麻碎拌进 Q 弹冰粉。", steps: ["冰粉粉+冷水搅匀冷藏 30 分钟", "切块装碗", "淋红糖水", "撒花生碎芝麻葡萄干"], ingredients:[{name:"冰粉粉",qty:"30g",category:"调味/主食"},{name:"红糖",qty:"40g",category:"调味/主食"},{name:"花生米",qty:"30g",category:"调味/主食"},{name:"芝麻",qty:"10g",category:"调味/主食"}], seasons:["夏"], weathers:["热"], regions:["西南"], energy:["解暑","清爽","适合热"] },
  { id: "dessert-honey-bean-tofu", name: "蜜豆豆腐花", cuisine: "江浙", course: "staple", category: "甜品", difficulty: "简单", timeMinutes: 15, tastes: ["酸甜"], contains: [], reason: "嫩豆花+蜜豆+焦糖，下午茶最爱。", steps: ["内酯豆腐切块", "淋蜜豆", "撒焦糖珍珠"], ingredients:[{name:"嫩豆腐",qty:"1 盒",category:"肉蛋豆制品"},{name:"蜜豆",qty:"60g",category:"调味/主食"},{name:"红糖",qty:"20g",category:"调味/主食"}], regions:["华东"], energy:["清爽"] },
  { id: "dessert-fruit-yogurt-bowl", name: "酸奶水果碗", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 8, tastes: ["酸甜"], contains: ["无奶"], reason: "希腊酸奶+蓝莓+燕麦+蜂蜜，5 分钟健康早餐。", steps: ["酸奶倒入碗", "拌入燕麦坚果", "铺时令水果", "淋蜂蜜"], ingredients:[{name:"酸奶",qty:"200g",category:"调味/主食"},{name:"燕麦片",qty:"30g",category:"调味/主食"},{name:"蓝莓",qty:"50g",category:"蔬菜"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], slots:["breakfast"], energy:["快手","清爽"] },
  { id: "dessert-cocoa-banana", name: "可可蕉燕麦碗", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 10, tastes: ["酸甜"], contains: ["无奶"], reason: "牛奶煮燕麦+可可粉+香蕉片，健康也满足。", steps: ["燕麦+牛奶煮 5 分钟", "撒可可粉", "铺香蕉片淋蜂蜜"], ingredients:[{name:"燕麦片",qty:"50g",category:"调味/主食"},{name:"牛奶",qty:"250ml",category:"调味/主食"},{name:"香蕉",qty:"1 根",category:"蔬菜"},{name:"可可粉",qty:"1 小勺",category:"调味/主食"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], slots:["breakfast"], energy:["快手","暖胃"] },
  { id: "dessert-rice-pudding", name: "椰浆芒果糯米饭", cuisine: "粤菜", course: "staple", category: "甜品", difficulty: "中等", timeMinutes: 60, tastes: ["酸甜"], contains: [], reason: "泰式经典街头甜品，糯米吸饱椰香配芒果。", steps: ["糯米泡 4 小时蒸熟", "椰浆+糖+盐煮开", "拌入糯米饭", "切芒果摆盘"], ingredients:[{name:"糯米",qty:"200g",category:"调味/主食"},{name:"椰浆",qty:"200ml",category:"调味/主食"},{name:"芒果",qty:"1 个",category:"蔬菜"},{name:"糖",qty:"30g",category:"调味/主食"}], seasons:["夏"], energy:["清爽"] },
  { id: "dessert-bayberry-syrup", name: "杨梅冰沙", cuisine: "江浙", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 15, tastes: ["酸甜"], contains: [], reason: "酸甜冰凉，夏天的浙江限定。", steps: ["杨梅+糖煮 5 分钟", "冷冻 4 小时", "破壁机打成沙"], ingredients:[{name:"杨梅",qty:"300g",category:"蔬菜"},{name:"糖",qty:"50g",category:"调味/主食"}], seasons:["夏"], regions:["华东"], energy:["解暑","清爽","适合热"] },
];

// 饮品
const DRINKS: CatTpl[] = [
  { id: "drink-lemon-tea", name: "鸭屎香柠檬茶", cuisine: "粤菜", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 15, tastes: ["清淡","酸甜"], contains: [], reason: "潮汕原味手打柠檬茶，回甘清新。", steps: ["鸭屎香单丛冷泡 10 分钟", "捶打柠檬出油", "冰块+茶+柠檬汁+蜂蜜摇匀"], ingredients:[{name:"鸭屎香茶",qty:"5g",category:"调味/主食"},{name:"柠檬",qty:"1 个",category:"蔬菜"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], seasons:["夏"], regions:["华南"], energy:["解暑","清爽"] },
  { id: "drink-osmanthus-oolong", name: "桂花乌龙冷萃", cuisine: "江浙", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 240, tastes: ["清淡"], contains: [], reason: "冷藏一夜出花香，秋天最优雅。", steps: ["乌龙茶+桂花干放冷水", "冷藏 8 小时", "过滤倒杯加冰"], ingredients:[{name:"乌龙茶",qty:"5g",category:"调味/主食"},{name:"桂花",qty:"3g",category:"调味/主食"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], seasons:["秋"], energy:["清爽"] },
  { id: "drink-matcha-latte", name: "抹茶拿铁", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 8, tastes: ["清淡"], contains: ["无奶"], reason: "下午精神不济来一杯，绿得发亮。", steps: ["抹茶+热水搅成糊", "倒入热牛奶", "加糖搅匀"], ingredients:[{name:"抹茶粉",qty:"4g",category:"调味/主食"},{name:"牛奶",qty:"250ml",category:"调味/主食"},{name:"糖",qty:"1 大勺",category:"调味/主食"}], slots:["breakfast","lunch"], energy:["快手"] },
  { id: "drink-soy-milk-coffee", name: "燕麦冰美式", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 10, tastes: ["清淡"], contains: [], reason: "下午两点的命脉，少糖少奶很舒服。", steps: ["手冲咖啡或意式浓缩冰镇", "加冰", "倒入少量燕麦奶"], ingredients:[{name:"咖啡豆",qty:"15g",category:"调味/主食"},{name:"燕麦奶",qty:"50ml",category:"调味/主食"}], slots:["breakfast","lunch"], energy:["快手","清爽"] },
  { id: "drink-honey-lemon", name: "蜂蜜柚子茶", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 8, tastes: ["酸甜"], contains: [], reason: "感冒嗓子疼救星。", steps: ["柚子皮切丝煮 3 分钟去苦", "蜂蜜+柠檬+柚子皮装罐", "冷藏 1 周更香"], ingredients:[{name:"柚子",qty:"1 个",category:"蔬菜"},{name:"蜂蜜",qty:"200g",category:"调味/主食"},{name:"冰糖",qty:"50g",category:"调味/主食"}], seasons:["秋","冬"], energy:["暖胃","清爽"] },
  { id: "drink-tao-zhi", name: "陶瓷杯桃胶羹", cuisine: "粤菜", course: "soup", category: "饮品", difficulty: "简单", timeMinutes: 60, tastes: ["清淡"], contains: [], reason: "胶质满满美容养颜。", steps: ["桃胶泡 8 小时", "雪燕皂角米泡发", "炖 40 分钟加冰糖"], ingredients:[{name:"桃胶",qty:"30g",category:"调味/主食"},{name:"雪燕",qty:"5g",category:"调味/主食"},{name:"冰糖",qty:"40g",category:"调味/主食"}], regions:["华南"], energy:["清爽"] },
  { id: "drink-hot-chocolate", name: "热巧克力", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 8, tastes: ["酸甜"], contains: ["无奶"], reason: "冬天回家抱一杯。", steps: ["黑巧克力切碎", "牛奶煮温倒入溶化", "拌入棉花糖"], ingredients:[{name:"黑巧克力",qty:"50g",category:"调味/主食"},{name:"牛奶",qty:"250ml",category:"调味/主食"},{name:"棉花糖",qty:"3 个",category:"调味/主食"}], seasons:["冬"], weathers:["冷"], energy:["暖胃","驱寒"] },
  { id: "drink-ginger-jujube-tea", name: "红枣姜茶", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 15, tastes: ["清淡"], contains: [], reason: "受凉来一杯，暖到指尖。", steps: ["生姜切片", "+红枣+红糖煮 10 分钟"], ingredients:[{name:"姜",qty:"1 块",category:"蔬菜"},{name:"红枣",qty:"6 颗",category:"调味/主食"},{name:"红糖",qty:"30g",category:"调味/主食"}], seasons:["秋","冬"], weathers:["冷"], energy:["驱寒","暖胃"] },
  { id: "drink-tropical-smoothie", name: "热带水果思慕雪", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 10, tastes: ["酸甜"], contains: ["无奶"], reason: "维 C 满满，假装在度假。", steps: ["芒果菠萝香蕉切块冷冻", "+酸奶+冰块破壁机打"], ingredients:[{name:"芒果",qty:"1 个",category:"蔬菜"},{name:"菠萝",qty:"100g",category:"蔬菜"},{name:"酸奶",qty:"150ml",category:"调味/主食"}], seasons:["夏"], weathers:["热"], energy:["解暑","清爽","适合热"] },
  { id: "drink-pearl-milk-tea", name: "奶盖珍珠奶茶", cuisine: "家常", course: "staple", category: "饮品", difficulty: "中等", timeMinutes: 30, tastes: ["酸甜"], contains: ["无奶"], reason: "现煮珍珠+红茶+鲜奶，比外卖好喝。", steps: ["黑糖珍珠煮 25 分钟泡 5 分钟", "红茶+糖煮 5 分钟", "拌入牛奶倒入珍珠"], ingredients:[{name:"珍珠",qty:"60g",category:"调味/主食"},{name:"红茶",qty:"5g",category:"调味/主食"},{name:"牛奶",qty:"300ml",category:"调味/主食"},{name:"红糖",qty:"40g",category:"调味/主食"}], slots:["lunch"], energy:["快手"] },
  { id: "drink-watermelon-juice", name: "鲜榨西瓜汁", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 6, tastes: ["酸甜"], contains: [], reason: "热天必备，夏夜啤酒的好搭档。", steps: ["西瓜去籽切块榨汁", "加冰一小撮盐"], ingredients:[{name:"西瓜",qty:"500g",category:"蔬菜"},{name:"盐",qty:"少许",category:"调味/主食"}], seasons:["夏"], weathers:["热"], energy:["解暑","清爽","适合热","快手"] },
  { id: "drink-coffee-pour-over", name: "手冲咖啡", cuisine: "家常", course: "staple", category: "饮品", difficulty: "中等", timeMinutes: 6, tastes: ["清淡"], contains: [], reason: "早晨一杯，世界开始旋转。", steps: ["豆磨细砂", "92℃ 水画圈冲洗", "前段闷蒸 30 秒", "三段水分注完成"], ingredients:[{name:"咖啡豆",qty:"15g",category:"调味/主食"}], slots:["breakfast"], energy:["快手","清爽"] },
  { id: "drink-suanmei-soup", name: "酸梅汤", cuisine: "鲁菜", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 40, tastes: ["酸甜"], contains: [], reason: "老北京夏日酸梅汤，开胃解油。", steps: ["乌梅+山楂+陈皮+甘草洗净", "加水大火煮开转小火 30 分钟", "加冰糖煮 5 分钟", "放凉冰镇"], ingredients:[{name:"乌梅",qty:"50g",category:"调味/主食"},{name:"山楂",qty:"30g",category:"调味/主食"},{name:"陈皮",qty:"5g",category:"调味/主食"},{name:"冰糖",qty:"50g",category:"调味/主食"}], seasons:["夏"], weathers:["热"], regions:["华北"], energy:["解暑","清爽","适合热"] },
  { id: "drink-rosehip", name: "玫瑰花蜜茶", cuisine: "家常", course: "staple", category: "饮品", difficulty: "简单", timeMinutes: 6, tastes: ["清淡"], contains: [], reason: "经期前后温柔养气，颜色仙气。", steps: ["玫瑰花干用沸水冲", "加蜂蜜枸杞", "加盖 5 分钟"], ingredients:[{name:"玫瑰花茶",qty:"3g",category:"调味/主食"},{name:"枸杞",qty:"10g",category:"调味/主食"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], energy:["清爽"] },
];

// 小吃 / 街头夜宵
const SNACKS: CatTpl[] = [
  { id: "snack-roujiamo", name: "肉夹馍", cuisine: "西北", course: "staple", category: "小吃", difficulty: "中等", timeMinutes: 80, tastes: ["咸鲜"], contains: ["无猪肉"], reason: "西安街头王者，腊汁肉+白吉馍。", steps: ["五花肉炖 60 分钟剁碎", "白吉馍中间剖开夹肉", "淋一勺肉汁"], ingredients:[{name:"五花肉",qty:"400g",category:"肉蛋豆制品"},{name:"白吉馍",qty:"4 个",category:"调味/主食"},{name:"葱姜",qty:"适量",category:"蔬菜"},{name:"八角",qty:"2 个",category:"调味/主食"}], regions:["西北"], slots:["lunch","dinner"], energy:["下饭"] },
  { id: "snack-jianbing", name: "煎饼果子", cuisine: "鲁菜", course: "staple", category: "早餐", difficulty: "中等", timeMinutes: 20, tastes: ["咸鲜"], contains: ["无蛋"], reason: "北方早餐之神，绿豆面+鸡蛋+脆皮。", steps: ["绿豆面调糊", "平底锅摊薄饼", "打蛋液撒葱花", "翻面抹酱+脆皮卷起"], ingredients:[{name:"绿豆面",qty:"100g",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"葱花",qty:"适量",category:"蔬菜"},{name:"甜面酱",qty:"1 大勺",category:"调味/主食"}], regions:["华北"], slots:["breakfast"], energy:["快手"] },
  { id: "snack-mala-tang", name: "麻辣烫", cuisine: "川菜", course: "soup", category: "夜宵", difficulty: "简单", timeMinutes: 20, tastes: ["麻辣"], contains: ["无辣"], reason: "深夜下班路上一碗，灵魂复活。", steps: ["底料炒香+水煮开", "下喜欢的食材烫熟", "捞出淋麻油芝麻酱"], ingredients:[{name:"火锅底料",qty:"半块",category:"调味/主食"},{name:"宽粉",qty:"100g",category:"调味/主食"},{name:"金针菇",qty:"100g",category:"蔬菜"},{name:"豆腐皮",qty:"100g",category:"肉蛋豆制品"},{name:"芝麻酱",qty:"1 大勺",category:"调味/主食"}], regions:["华北","西南"], slots:["dinner"], energy:["暖胃","下饭"] },
  { id: "snack-grilled-skewer", name: "孜然烤串", cuisine: "西北", course: "main", category: "夜宵", difficulty: "中等", timeMinutes: 40, tastes: ["微辣","咸鲜"], contains: [], reason: "孜然烟火气直冲上头，配啤酒就对了。", steps: ["羊肉切块+洋葱腌孜然辣椒粉", "穿串刷油", "烤箱 220℃ 烤 12 分钟", "再撒孜然辣椒粉烤 3 分钟"], ingredients:[{name:"羊肉",qty:"400g",category:"肉蛋豆制品"},{name:"孜然",qty:"2 大勺",category:"调味/主食"},{name:"辣椒粉",qty:"1 大勺",category:"调味/主食"}], regions:["西北"], slots:["dinner"], energy:["下饭"] },
  { id: "snack-xianbing", name: "韭菜盒子", cuisine: "东北", course: "staple", category: "小吃", difficulty: "中等", timeMinutes: 50, tastes: ["咸鲜"], contains: ["无蛋"], reason: "外脆内嫩，韭菜鸡蛋香气放倒邻居。", steps: ["面粉热水烫面醒 20 分钟", "韭菜+鸡蛋+虾皮+盐拌馅", "包成饼平底锅煎到两面金黄"], ingredients:[{name:"面粉",qty:"300g",category:"调味/主食"},{name:"韭菜",qty:"300g",category:"蔬菜"},{name:"鸡蛋",qty:"3 个",category:"肉蛋豆制品"},{name:"虾皮",qty:"15g",category:"肉蛋豆制品"}], regions:["东北","华北"], slots:["breakfast","lunch"], energy:["下饭"] },
  { id: "snack-cold-skin", name: "麻酱凉皮", cuisine: "西北", course: "staple", category: "小吃", difficulty: "简单", timeMinutes: 20, tastes: ["微辣","酸甜"], contains: [], reason: "夏夜街边版本，多放麻酱。", steps: ["凉皮切条", "黄瓜豆芽焯水切丝", "调汁：麻酱+蒜泥+醋+辣油", "拌匀放面筋"], ingredients:[{name:"凉皮",qty:"300g",category:"调味/主食"},{name:"黄瓜",qty:"1 根",category:"蔬菜"},{name:"豆芽",qty:"100g",category:"蔬菜"},{name:"芝麻酱",qty:"2 大勺",category:"调味/主食"},{name:"辣油",qty:"1 大勺",category:"调味/主食"}], seasons:["夏"], regions:["西北"], energy:["解暑","清爽","适合热"] },
  { id: "snack-shaomai", name: "糯米烧麦", cuisine: "粤菜", course: "staple", category: "小吃", difficulty: "中等", timeMinutes: 50, tastes: ["咸鲜"], contains: ["无猪肉"], reason: "皮薄馅满，茶楼一笼必点。", steps: ["糯米泡 4 小时蒸熟", "+猪肉末+香菇丁+生抽炒匀", "烧麦皮包馅", "上笼蒸 12 分钟"], ingredients:[{name:"糯米",qty:"200g",category:"调味/主食"},{name:"烧麦皮",qty:"24 张",category:"调味/主食"},{name:"猪肉末",qty:"150g",category:"肉蛋豆制品"},{name:"香菇",qty:"3 朵",category:"蔬菜"}], regions:["华南"], slots:["breakfast","lunch"], energy:["下饭"] },
  { id: "snack-cold-jelly", name: "凉粉拌米皮", cuisine: "川菜", course: "staple", category: "小吃", difficulty: "简单", timeMinutes: 15, tastes: ["微辣","酸甜"], contains: [], reason: "夏天清凉降温首选。", steps: ["凉粉切条", "蒜末+辣椒油+生抽+醋+花椒粉调汁", "拌匀撒花生碎"], ingredients:[{name:"凉粉",qty:"400g",category:"调味/主食"},{name:"蒜末",qty:"1 大勺",category:"蔬菜"},{name:"辣油",qty:"1 大勺",category:"调味/主食"},{name:"醋",qty:"1 大勺",category:"调味/主食"},{name:"花生米",qty:"30g",category:"调味/主食"}], seasons:["夏"], regions:["西南"], energy:["解暑","清爽","适合热"] },
  { id: "snack-fried-chicken", name: "韩式炸鸡", cuisine: "家常", course: "main", category: "夜宵", difficulty: "中等", timeMinutes: 40, tastes: ["酸甜","微辣"], contains: [], reason: "外酥里嫩+甜辣酱，看综艺神器。", steps: ["鸡块腌料酒姜片", "裹淀粉", "180℃ 炸 5 分钟+二次回锅 1 分钟", "拌入韩式甜辣酱"], ingredients:[{name:"鸡腿肉",qty:"500g",category:"肉蛋豆制品"},{name:"淀粉",qty:"100g",category:"调味/主食"},{name:"番茄酱",qty:"2 大勺",category:"调味/主食"},{name:"辣酱",qty:"2 大勺",category:"调味/主食"}], slots:["dinner"], energy:["下饭"] },
  { id: "snack-takoyaki", name: "章鱼小丸子", cuisine: "家常", course: "staple", category: "小吃", difficulty: "中等", timeMinutes: 30, tastes: ["咸鲜"], contains: ["无海鲜","无蛋"], reason: "外焦内嫩，章鱼烧专用模具一搞就有。", steps: ["面糊：高汤+面粉+蛋", "倒入章鱼烧模具八分满", "撒章鱼丁+葱花", "翻面成圆球淋酱+撒木鱼花"], ingredients:[{name:"面粉",qty:"100g",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"章鱼",qty:"100g",category:"肉蛋豆制品"},{name:"葱花",qty:"适量",category:"蔬菜"},{name:"木鱼花",qty:"5g",category:"肉蛋豆制品"}], slots:["dinner"], energy:["快手"] },
  { id: "snack-grilled-cold-noodles", name: "烤冷面", cuisine: "东北", course: "staple", category: "夜宵", difficulty: "简单", timeMinutes: 12, tastes: ["微辣","酸甜"], contains: ["无蛋"], reason: "东北夜市头牌，铁板冷面+蛋液+酱汁。", steps: ["铁板抹油放冷面饼", "打蛋摊匀煎熟翻面", "刷甜面酱+蒜末+辣油+醋", "撒葱花卷起切段"], ingredients:[{name:"东北冷面",qty:"2 张",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"火腿肠",qty:"1 根",category:"肉蛋豆制品"},{name:"甜面酱",qty:"1 大勺",category:"调味/主食"}], regions:["东北"], slots:["dinner"], energy:["下饭","快手"] },
  { id: "snack-cnchao-fan", name: "黄金炒粉", cuisine: "粤菜", course: "staple", category: "夜宵", difficulty: "简单", timeMinutes: 15, tastes: ["咸鲜"], contains: ["无蛋"], reason: "深夜大排档，蛋液裹粉粒粒分明。", steps: ["米粉过水沥干", "鸡蛋打散滑炒", "下虾仁葱花炒香", "下米粉调老抽蚝油翻炒"], ingredients:[{name:"米粉",qty:"300g",category:"调味/主食"},{name:"鸡蛋",qty:"2 个",category:"肉蛋豆制品"},{name:"葱花",qty:"适量",category:"蔬菜"},{name:"老抽",qty:"1 小勺",category:"调味/主食"},{name:"蚝油",qty:"1 大勺",category:"调味/主食"}], regions:["华南"], slots:["dinner"], energy:["下饭"] },
  { id: "snack-tofu-pudding-savory", name: "咸豆花", cuisine: "江浙", course: "staple", category: "小吃", difficulty: "简单", timeMinutes: 12, tastes: ["咸鲜"], contains: [], reason: "上海弄堂经典，咸鲜豆花配油条。", steps: ["内酯豆腐切块", "调汁：榨菜+虾皮+葱花+生抽+辣油", "淋汁拌油条粒"], ingredients:[{name:"嫩豆腐",qty:"1 盒",category:"肉蛋豆制品"},{name:"榨菜",qty:"30g",category:"蔬菜"},{name:"虾皮",qty:"10g",category:"肉蛋豆制品"},{name:"葱花",qty:"适量",category:"蔬菜"}], regions:["华东"], slots:["breakfast"], energy:["清爽"] },
  { id: "snack-spicy-grilled-fish", name: "纸包鱼", cuisine: "川菜", course: "main", category: "夜宵", difficulty: "进阶", timeMinutes: 60, tastes: ["麻辣"], contains: ["无海鲜","无辣"], reason: "重庆江边夜宵之王，又麻又辣又鲜。", steps: ["鱼腌料酒姜片 15 分钟", "炒红油+豆瓣+花椒底料", "鱼煎一面金黄装锡纸包", "倒底料+泡菜+蒜烤箱 15 分钟"], ingredients:[{name:"草鱼",qty:"1 条 (约 1kg)",category:"肉蛋豆制品"},{name:"豆瓣酱",qty:"2 大勺",category:"调味/主食"},{name:"花椒",qty:"1 大勺",category:"调味/主食"},{name:"干辣椒",qty:"10 根",category:"调味/主食"},{name:"葱姜蒜",qty:"适量",category:"蔬菜"}], regions:["西南"], slots:["dinner"], energy:["下饭"] },
  { id: "snack-stinky-tofu", name: "长沙臭豆腐", cuisine: "家常", course: "staple", category: "夜宵", difficulty: "中等", timeMinutes: 15, tastes: ["微辣"], contains: [], reason: "外脆里嫩，长沙夜市头牌。", steps: ["臭豆腐沥干", "热油 180℃ 炸至外壳起泡", "捞出戳孔淋蒜泥+辣椒油+葱花"], ingredients:[{name:"臭豆腐",qty:"400g",category:"肉蛋豆制品"},{name:"蒜",qty:"5 瓣",category:"蔬菜"},{name:"辣油",qty:"2 大勺",category:"调味/主食"},{name:"葱花",qty:"适量",category:"蔬菜"}], regions:["华中"], slots:["dinner"], energy:["下饭"] },
];

// 早餐 / 轻食 / 烘焙
const BREAKFAST_LIGHT: CatTpl[] = [
  { id: "bf-avocado-toast", name: "牛油果开放式吐司", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 8, tastes: ["清淡"], contains: ["无蛋"], reason: "5 分钟搞定，颜值担当。", steps: ["吐司烤酥", "牛油果压泥+柠檬汁+海盐", "抹吐司+水波蛋+黑胡椒"], ingredients:[{name:"吐司",qty:"2 片",category:"调味/主食"},{name:"牛油果",qty:"1 个",category:"蔬菜"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"柠檬",qty:"半个",category:"蔬菜"}], slots:["breakfast"], energy:["快手","清爽"] },
  { id: "bf-oat-overnight", name: "隔夜燕麦", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 10, tastes: ["酸甜"], contains: ["无奶"], reason: "前一晚冰箱备着，第二天早上拎走就跑。", steps: ["燕麦+酸奶+牛奶+奇亚籽搅匀", "冷藏 4 小时", "早晨铺水果坚果"], ingredients:[{name:"燕麦片",qty:"50g",category:"调味/主食"},{name:"酸奶",qty:"100g",category:"调味/主食"},{name:"牛奶",qty:"100ml",category:"调味/主食"},{name:"奇亚籽",qty:"1 大勺",category:"调味/主食"}], slots:["breakfast"], energy:["快手"] },
  { id: "bf-onepan-eggs", name: "西班牙烘蛋", cuisine: "家常", course: "main", category: "早餐", difficulty: "中等", timeMinutes: 25, tastes: ["咸鲜"], contains: ["无蛋"], reason: "鸡蛋土豆洋葱一锅烘出，欧式 brunch。", steps: ["土豆切薄片洋葱切丝煎软", "鸡蛋打散+盐倒入", "中小火盖盖煎 8 分钟", "翻面再 3 分钟"], ingredients:[{name:"鸡蛋",qty:"5 个",category:"肉蛋豆制品"},{name:"土豆",qty:"2 个",category:"蔬菜"},{name:"洋葱",qty:"半个",category:"蔬菜"},{name:"橄榄油",qty:"3 大勺",category:"调味/主食"}], slots:["breakfast"], energy:["快手"] },
  { id: "bf-baozi", name: "猪肉大葱包子", cuisine: "东北", course: "staple", category: "早餐", difficulty: "中等", timeMinutes: 90, tastes: ["咸鲜"], contains: ["无猪肉"], reason: "皮宣馅多，配豆浆经典早餐。", steps: ["面粉+酵母+水揉光发酵", "猪肉末+葱末+生抽香油拌馅", "包成包子二次发酵 20 分钟", "蒸 18 分钟"], ingredients:[{name:"面粉",qty:"500g",category:"调味/主食"},{name:"猪肉末",qty:"400g",category:"肉蛋豆制品"},{name:"大葱",qty:"3 根",category:"蔬菜"},{name:"生抽",qty:"2 大勺",category:"调味/主食"}], regions:["华北","东北"], slots:["breakfast"], energy:["暖胃"] },
  { id: "bf-rice-roll", name: "广式肠粉", cuisine: "粤菜", course: "staple", category: "早餐", difficulty: "中等", timeMinutes: 30, tastes: ["咸鲜"], contains: ["无猪肉","无海鲜","无蛋"], reason: "薄皮裹虾肉，淋豉油，岭南早茶白月光。", steps: ["米粉浆+水+少许油搅匀", "蒸盘抹油倒一勺浆", "撒虾仁肉末蛋液", "上锅蒸 3 分钟铲起折叠淋豉油"], ingredients:[{name:"粘米粉",qty:"100g",category:"调味/主食"},{name:"虾仁",qty:"50g",category:"肉蛋豆制品"},{name:"猪肉末",qty:"50g",category:"肉蛋豆制品"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"生抽",qty:"2 大勺",category:"调味/主食"}], regions:["华南"], slots:["breakfast"], energy:["清爽"] },
  { id: "bf-millet-cake", name: "南瓜小米发糕", cuisine: "家常", course: "staple", category: "早餐", difficulty: "简单", timeMinutes: 60, tastes: ["清淡"], contains: [], reason: "金黄松软，宝宝大人都爱。", steps: ["南瓜蒸熟压泥", "+面粉+酵母+糖揉光发 40 分钟", "蒸 20 分钟"], ingredients:[{name:"南瓜",qty:"200g",category:"蔬菜"},{name:"面粉",qty:"300g",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], slots:["breakfast"], energy:["暖胃"] },
  { id: "bf-poached-egg-rice", name: "猫饭", cuisine: "家常", course: "staple", category: "夜宵", difficulty: "简单", timeMinutes: 10, tastes: ["咸鲜"], contains: ["无蛋"], reason: "懒人神餐，热饭+生鸡蛋+酱油+柴鱼花。", steps: ["热米饭打窝", "敲入生鸡蛋", "淋酱油拌匀", "撒柴鱼花葱花"], ingredients:[{name:"米饭",qty:"1 碗",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"酱油",qty:"1 大勺",category:"调味/主食"},{name:"木鱼花",qty:"5g",category:"肉蛋豆制品"}], slots:["dinner"], energy:["快手"] },
  { id: "bf-shaobing", name: "牛肉烧饼", cuisine: "鲁菜", course: "staple", category: "早餐", difficulty: "中等", timeMinutes: 60, tastes: ["咸鲜"], contains: ["无牛肉"], reason: "酥脆掉渣的烧饼夹卤牛肉，济南早晨。", steps: ["油酥+面团擀薄裹起", "撒葱花椒盐烤", "卤牛肉切片夹入"], ingredients:[{name:"面粉",qty:"300g",category:"调味/主食"},{name:"卤牛肉",qty:"200g",category:"肉蛋豆制品"},{name:"葱花",qty:"适量",category:"蔬菜"},{name:"椒盐",qty:"1 小勺",category:"调味/主食"}], regions:["华北"], slots:["breakfast","lunch"], energy:["下饭"] },
  { id: "bf-banshou-rice", name: "拌手温泉蛋盖饭", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 15, tastes: ["清淡"], contains: ["无蛋"], reason: "温泉蛋戳破滑过米饭，懒人精致餐。", steps: ["鸡蛋 65℃ 慢煮 1 小时（或买现成）", "热饭铺生菜丝鸡丝", "敲入温泉蛋淋酱油"], ingredients:[{name:"米饭",qty:"1 碗",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"鸡胸肉",qty:"100g",category:"肉蛋豆制品"},{name:"生菜",qty:"几片",category:"蔬菜"}], slots:["lunch"], energy:["清爽","快手"] },
  { id: "bf-poke-bowl", name: "三文鱼坡奇碗", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 15, tastes: ["清淡"], contains: ["无海鲜"], reason: "夏威夷风海鲜碗，蛋白质拉满。", steps: ["三文鱼切丁拌酱油芝麻油", "藜麦煮熟铺底", "码黄瓜牛油果毛豆", "淋酱"], ingredients:[{name:"三文鱼",qty:"150g",category:"肉蛋豆制品"},{name:"藜麦",qty:"60g",category:"调味/主食"},{name:"黄瓜",qty:"半根",category:"蔬菜"},{name:"牛油果",qty:"半个",category:"蔬菜"},{name:"毛豆",qty:"50g",category:"蔬菜"}], slots:["lunch"], energy:["清爽","快手"] },
  { id: "bf-french-toast", name: "法式吐司", cuisine: "家常", course: "staple", category: "早餐", difficulty: "简单", timeMinutes: 12, tastes: ["酸甜"], contains: ["无蛋","无奶"], reason: "周末懒早午餐之神。", steps: ["蛋液+牛奶+糖+肉桂粉", "吐司浸蛋液", "黄油煎至两面金黄", "淋枫糖+水果"], ingredients:[{name:"吐司",qty:"4 片",category:"调味/主食"},{name:"鸡蛋",qty:"2 个",category:"肉蛋豆制品"},{name:"牛奶",qty:"100ml",category:"调味/主食"},{name:"糖",qty:"1 大勺",category:"调味/主食"},{name:"黄油",qty:"15g",category:"调味/主食"}], slots:["breakfast"], energy:["快手"] },
  { id: "bf-cold-soba", name: "凉拌荞麦面", cuisine: "家常", course: "staple", category: "轻食", difficulty: "简单", timeMinutes: 12, tastes: ["清淡"], contains: ["无蛋"], reason: "夏天日式清爽，拌酱油醋海苔。", steps: ["荞麦面煮 4 分钟过冰水", "蘸汁：日式酱油+柴鱼+味淋", "码海苔丝葱花温泉蛋"], ingredients:[{name:"荞麦面",qty:"200g",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"海苔",qty:"5g",category:"调味/主食"},{name:"葱花",qty:"适量",category:"蔬菜"}], seasons:["夏"], slots:["lunch"], energy:["解暑","清爽","适合热"] },
  { id: "baking-mochi-bun", name: "麻薯软欧包", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "进阶", timeMinutes: 150, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "外软内 Q，新手挑战款。", steps: ["主面团揉光发酵 1 小时", "麻薯加木薯粉揉团", "面团包麻薯整形", "二次发酵+烤箱 180℃ 25 分钟"], ingredients:[{name:"高筋面粉",qty:"300g",category:"调味/主食"},{name:"牛奶",qty:"180ml",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"木薯粉",qty:"100g",category:"调味/主食"},{name:"糖",qty:"40g",category:"调味/主食"},{name:"黄油",qty:"30g",category:"调味/主食"}], slots:["breakfast","lunch"], energy:["暖胃"] },
  { id: "baking-chiffon-cake", name: "戚风蛋糕", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "进阶", timeMinutes: 90, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "新手梦中情糕，松软到能听见呼吸。", steps: ["蛋黄+牛奶+油+面粉拌匀", "蛋白+糖打到硬性发泡", "拌入蛋黄糊", "150℃ 烤 50 分钟倒扣放凉"], ingredients:[{name:"鸡蛋",qty:"5 个",category:"肉蛋豆制品"},{name:"低筋面粉",qty:"60g",category:"调味/主食"},{name:"牛奶",qty:"50ml",category:"调味/主食"},{name:"糖",qty:"60g",category:"调味/主食"},{name:"植物油",qty:"50ml",category:"调味/主食"}], slots:["lunch"], energy:["清爽"] },
  { id: "baking-cookies", name: "巧克力豆曲奇", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "中等", timeMinutes: 60, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "下午茶经典，外酥内软挂巧克力豆。", steps: ["黄油糖打发", "+蛋液+面粉+小苏打+巧克力豆", "挤面糊冷藏 30 分钟", "180℃ 烤 14 分钟"], ingredients:[{name:"黄油",qty:"100g",category:"调味/主食"},{name:"低筋面粉",qty:"180g",category:"调味/主食"},{name:"鸡蛋",qty:"1 个",category:"肉蛋豆制品"},{name:"红糖",qty:"60g",category:"调味/主食"},{name:"巧克力豆",qty:"80g",category:"调味/主食"}], slots:["lunch"], energy:["清爽"] },
  { id: "baking-scallion-bread", name: "肉松小贝", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "中等", timeMinutes: 80, tastes: ["咸鲜"], contains: ["无奶","无蛋"], reason: "便利店之神，自己做更丰富。", steps: ["蛋糕胚烤好放凉", "切对半挤沙拉酱", "夹起裹肉松"], ingredients:[{name:"低筋面粉",qty:"60g",category:"调味/主食"},{name:"鸡蛋",qty:"4 个",category:"肉蛋豆制品"},{name:"糖",qty:"50g",category:"调味/主食"},{name:"沙拉酱",qty:"100g",category:"调味/主食"},{name:"肉松",qty:"100g",category:"肉蛋豆制品"},{name:"牛奶",qty:"40ml",category:"调味/主食"}], slots:["lunch"], energy:["清爽"] },
  { id: "baking-mooncake", name: "广式莲蓉月饼", cuisine: "粤菜", course: "staple", category: "烘焙", difficulty: "进阶", timeMinutes: 120, tastes: ["酸甜"], contains: ["无蛋"], reason: "中秋节非物质文化遗产难度。", steps: ["转化糖浆+碱水+花生油+面粉揉皮", "皮裹莲蓉+蛋黄", "月饼模压花纹", "烤箱 200℃ 5 分钟+刷蛋液 175℃ 15 分钟"], ingredients:[{name:"中筋面粉",qty:"200g",category:"调味/主食"},{name:"莲蓉",qty:"500g",category:"调味/主食"},{name:"咸蛋黄",qty:"15 个",category:"肉蛋豆制品"},{name:"花生油",qty:"50g",category:"调味/主食"}], seasons:["秋"], regions:["华南"], slots:["lunch"], energy:["清爽"] },
  { id: "baking-portuguese-tart", name: "黄油蛋黄酥", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "进阶", timeMinutes: 120, tastes: ["酸甜"], contains: ["无奶","无蛋"], reason: "酥层千万要练。", steps: ["油皮+油酥分别揉光", "包酥擀薄三次三折", "包馅蛋黄+豆沙", "200℃ 烤 25 分钟"], ingredients:[{name:"中筋面粉",qty:"200g",category:"调味/主食"},{name:"猪油",qty:"80g",category:"调味/主食"},{name:"咸蛋黄",qty:"12 个",category:"肉蛋豆制品"},{name:"红豆沙",qty:"300g",category:"调味/主食"}], seasons:["秋"], slots:["lunch"], energy:["清爽"] },
  { id: "baking-mini-pizza", name: "迷你披萨", cuisine: "家常", course: "staple", category: "烘焙", difficulty: "中等", timeMinutes: 50, tastes: ["咸鲜"], contains: ["无奶"], reason: "下班 30 分钟搞出意式。", steps: ["面团擀圆铺番茄酱", "撒马苏里拉+培根+青椒", "200℃ 烤 12 分钟"], ingredients:[{name:"高筋面粉",qty:"200g",category:"调味/主食"},{name:"番茄酱",qty:"3 大勺",category:"调味/主食"},{name:"马苏里拉",qty:"150g",category:"调味/主食"},{name:"培根",qty:"100g",category:"肉蛋豆制品"},{name:"青椒",qty:"半个",category:"蔬菜"}], slots:["dinner"], energy:["下饭"] },
];

// 把 CatTpl 转换为 GenRecipe（推断 contains/season 等）
function catToGen(t: CatTpl): GenRecipe {
  const containsSet = new Set<Restriction>(t.contains);
  for (const ing of t.ingredients) {
    const n = ing.name;
    if (/鸡蛋|蛋黄|蛋清|蛋液|皮蛋|咸蛋黄/.test(n) && !/淀粉|蛋糕粉/.test(n)) containsSet.add("无蛋");
    if (/牛肉|牛腩|牛里脊/.test(n)) containsSet.add("无牛肉");
    if (/猪肉|五花|猪里脊|排骨|火腿(?!肠)|腊肠|培根|猪油/.test(n)) containsSet.add("无猪肉");
    if (/虾(?!皮|米)|蟹|鱼(?!香)|蛤|贝|生蚝|章鱼|墨鱼|鱿鱼|三文鱼|草鱼|鲈鱼|带鱼|鲫鱼|木鱼花/.test(n)) containsSet.add("无海鲜");
    if (/花生(?!油)/.test(n)) containsSet.add("无花生");
    if (/牛奶|淡奶油|奶油|奶酪|马苏里拉|奶粉|黄油|炼乳|酸奶/.test(n) && !/豆奶|豆浆|燕麦奶|椰奶|椰浆/.test(n)) containsSet.add("无奶");
  }
  if (t.tastes.some((x) => x === "微辣" || x === "重辣" || x === "麻辣")) containsSet.add("无辣");
  return {
    id: t.id,
    name: t.name,
    course: t.course,
    cuisine: t.cuisine,
    difficulty: t.difficulty,
    timeMinutes: t.timeMinutes,
    tastes: t.tastes,
    contains: Array.from(containsSet),
    steps: t.steps,
    reason: t.reason,
    serves: t.serves ?? 2,
    ingredients: t.ingredients,
    seasons: t.seasons,
    weathers: t.weathers,
    regions: t.regions,
    slots: t.slots ?? ["lunch", "dinner"],
    energy: t.energy,
    category: t.category,
  };
}

// === 程序生成的甜品/饮品/小吃组合：把数据库扩到 600+ ===
type FlavorBase = { key: string; name: string; emoji?: string };
const FRUITS: FlavorBase[] = [
  { key: "mango", name: "芒果" },
  { key: "strawberry", name: "草莓" },
  { key: "blueberry", name: "蓝莓" },
  { key: "peach", name: "桃子" },
  { key: "watermelon", name: "西瓜" },
  { key: "grape", name: "葡萄" },
  { key: "orange", name: "橙子" },
  { key: "lemon", name: "柠檬" },
  { key: "pineapple", name: "菠萝" },
  { key: "kiwi", name: "猕猴桃" },
  { key: "banana", name: "香蕉" },
  { key: "apple", name: "苹果" },
  { key: "lychee", name: "荔枝" },
  { key: "longan", name: "桂圆" },
  { key: "passionfruit", name: "百香果" },
];

function genDessertCombos(): GenRecipe[] {
  const out: GenRecipe[] = [];
  // 水果 × 甜品做法
  const styles: { id: string; name: string; courseTaste: Taste[]; timeMin: number; reason: (f: string) => string; steps: (f: string) => string[]; ings: (fName: string) => GenIngredient[]; energy: EnergyTag[]; season?: Season[]; weather?: WeatherTag[]; cat: Category }[] = [
    { id: "panna-cotta", name: "奶冻", courseTaste: ["酸甜"], timeMin: 60, reason: (f) => `${f}奶冻入口即化，颜值满分。`, steps: (f) => [`牛奶+糖+吉利丁加热融化`, `倒入杯中冷藏 4 小时`, `${f}打果泥淋顶层`], ings: (f) => [{name:"牛奶",qty:"300ml",category:"调味/主食"},{name:"淡奶油",qty:"100ml",category:"调味/主食"},{name:"吉利丁",qty:"5g",category:"调味/主食"},{name:f,qty:"100g",category:"蔬菜"},{name:"糖",qty:"40g",category:"调味/主食"}], energy:["清爽"], cat:"甜品" },
    { id: "smoothie-bowl", name: "果昔碗", courseTaste: ["酸甜","清淡"], timeMin: 8, reason: (f) => `冷冻${f}打成沙，铺燕麦坚果即吃。`, steps: (f) => [`${f}冷冻 2 小时`, `+酸奶+蜂蜜破壁机打沙`, `铺燕麦+椰片+巧克力豆`], ings: (f) => [{name:f,qty:"200g",category:"蔬菜"},{name:"酸奶",qty:"150g",category:"调味/主食"},{name:"燕麦片",qty:"30g",category:"调味/主食"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], energy:["解暑","清爽","快手"], season:["夏"], weather:["热"], cat:"轻食" },
    { id: "fruit-yogurt", name: "酸奶杯", courseTaste: ["酸甜"], timeMin: 5, reason: (f) => `酸奶+${f}+脆谷分层装杯，赏心悦目。`, steps: (f) => [`杯底铺脆谷`, `淋酸奶`, `码${f}重复一次`], ings: (f) => [{name:"酸奶",qty:"200g",category:"调味/主食"},{name:f,qty:"150g",category:"蔬菜"},{name:"燕麦脆",qty:"30g",category:"调味/主食"},{name:"蜂蜜",qty:"1 大勺",category:"调味/主食"}], energy:["快手","清爽"], cat:"轻食" },
    { id: "ice-pop", name: "冰棒", courseTaste: ["酸甜"], timeMin: 15, reason: (f) => `自制${f}冰棒，零添加。`, steps: (f) => [`${f}打果泥+酸奶`, `加糖搅匀`, `倒模具冷冻 6 小时`], ings: (f) => [{name:f,qty:"200g",category:"蔬菜"},{name:"酸奶",qty:"100g",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], energy:["解暑","清爽","适合热"], season:["夏"], weather:["热"], cat:"甜品" },
    { id: "tart", name: "水果挞", courseTaste: ["酸甜"], timeMin: 50, reason: (f) => `黄油挞皮+卡仕达酱+${f}，烘焙基本功。`, steps: (f) => [`黄油糖打发+蛋液+面粉揉面`, `压模 180℃ 烤 15 分钟`, `挤卡仕达酱码${f}片`], ings: (f) => [{name:"低筋面粉",qty:"150g",category:"调味/主食"},{name:"黄油",qty:"80g",category:"调味/主食"},{name:"鸡蛋",qty:"2 个",category:"肉蛋豆制品"},{name:"牛奶",qty:"100ml",category:"调味/主食"},{name:f,qty:"100g",category:"蔬菜"},{name:"糖",qty:"40g",category:"调味/主食"}], energy:["清爽"], cat:"烘焙" },
    { id: "jelly", name: "果冻", courseTaste: ["酸甜"], timeMin: 30, reason: (f) => `${f}果汁+琼脂，Q 弹无添加。`, steps: (f) => [`${f}打汁过滤`, `+水+糖+琼脂煮化`, `倒入容器冷藏 2 小时`], ings: (f) => [{name:f,qty:"200g",category:"蔬菜"},{name:"琼脂",qty:"5g",category:"调味/主食"},{name:"糖",qty:"30g",category:"调味/主食"}], energy:["解暑","清爽"], season:["夏"], cat:"甜品" },
  ];
  for (const f of FRUITS) {
    for (const s of styles) {
      const id = safeId(`${s.id}-${f.key}`);
      const name = `${f.name}${s.name}`;
      const ings = s.ings(f.name);
      const containsSet = new Set<Restriction>();
      for (const ing of ings) {
        if (/鸡蛋|蛋黄|蛋清/.test(ing.name)) containsSet.add("无蛋");
        if (/牛奶|淡奶油|酸奶|黄油|奶酪/.test(ing.name) && !/豆奶|椰奶/.test(ing.name)) containsSet.add("无奶");
      }
      out.push({
        id,
        name,
        course: "staple",
        cuisine: "家常",
        difficulty: s.timeMin >= 50 ? "中等" : "简单",
        timeMinutes: s.timeMin,
        tastes: s.courseTaste,
        contains: Array.from(containsSet),
        steps: s.steps(f.name),
        reason: s.reason(f.name),
        serves: 2,
        ingredients: ings,
        seasons: s.season,
        weathers: s.weather,
        slots: ["lunch"],
        energy: s.energy,
        category: s.cat,
      });
    }
  }
  return out;
}

function genDrinkCombos(): GenRecipe[] {
  const out: GenRecipe[] = [];
  const teas: FlavorBase[] = [
    { key: "jasmine", name: "茉莉花茶" },
    { key: "oolong", name: "乌龙茶" },
    { key: "earl-grey", name: "伯爵红茶" },
    { key: "pu-er", name: "普洱茶" },
    { key: "longjing", name: "龙井茶" },
    { key: "tieguanyin", name: "铁观音" },
    { key: "darjeeling", name: "大吉岭红茶" },
  ];
  const fruits: FlavorBase[] = [
    { key: "lemon", name: "柠檬" },
    { key: "peach", name: "桃子" },
    { key: "grapefruit", name: "西柚" },
    { key: "passionfruit", name: "百香果" },
    { key: "lychee", name: "荔枝" },
    { key: "kumquat", name: "金桔" },
  ];
  // 茶 × 水果 = 水果茶
  for (const t of teas) {
    for (const f of fruits) {
      out.push({
        id: safeId(`drink-${t.key}-${f.key}`),
        name: `${f.name}${t.name}`,
        course: "staple",
        cuisine: "家常",
        difficulty: "简单",
        timeMinutes: 10,
        tastes: ["酸甜","清淡"],
        contains: [],
        steps: [`${t.name}冷泡 5 分钟`, `${f.name}捣碎或榨汁`, `茶+果汁+蜂蜜+冰摇匀`],
        reason: `${f.name}的清香配${t.name}的回甘，下午茶基本款。`,
        serves: 1,
        ingredients: [
          { name: t.name, qty: "5g", category: "调味/主食" },
          { name: f.name, qty: "1 个", category: "蔬菜" },
          { name: "蜂蜜", qty: "1 大勺", category: "调味/主食" },
        ],
        seasons: ["夏","春","秋"],
        slots: ["breakfast","lunch"],
        energy: ["清爽","快手"],
        category: "饮品",
      });
    }
  }
  // 奶茶/拿铁系列
  const lattes: FlavorBase[] = [
    { key: "matcha", name: "抹茶" },
    { key: "taro", name: "芋泥" },
    { key: "brownsugar", name: "黑糖" },
    { key: "rose", name: "玫瑰" },
    { key: "lavender", name: "薰衣草" },
    { key: "earl", name: "伯爵" },
    { key: "vanilla", name: "香草" },
  ];
  for (const l of lattes) {
    out.push({
      id: safeId(`drink-latte-${l.key}`),
      name: `${l.name}拿铁`,
      course: "staple",
      cuisine: "家常",
      difficulty: "简单",
      timeMinutes: 8,
      tastes: ["酸甜"],
      contains: ["无奶"],
      steps: [`${l.name}底料冲热水化开`, `加热牛奶`, `打奶泡盖顶`],
      reason: `${l.name}+牛奶，办公室咖啡机的灵魂。`,
      serves: 1,
      ingredients: [
        { name: `${l.name}粉`, qty: "5g", category: "调味/主食" },
        { name: "牛奶", qty: "250ml", category: "调味/主食" },
        { name: "糖", qty: "1 大勺", category: "调味/主食" },
      ],
      slots: ["breakfast","lunch"],
      energy: ["快手"],
      category: "饮品",
    });
  }
  // 鸡尾酒/特调（无酒精变体）
  const mocktails = [
    { key: "mojito", name: "薄荷莫吉托", base: "薄荷+苏打水", taste: "清淡" as Taste, weather: "热" as WeatherTag },
    { key: "mary", name: "番茄玛丽", base: "番茄汁+柠檬+黑胡椒", taste: "咸鲜" as Taste, weather: "晴" as WeatherTag },
    { key: "coco", name: "椰青气泡水", base: "椰青+苏打水+柠檬", taste: "清淡" as Taste, weather: "热" as WeatherTag },
  ];
  for (const m of mocktails) {
    out.push({
      id: safeId(`drink-mock-${m.key}`),
      name: m.name,
      course: "staple",
      cuisine: "家常",
      difficulty: "简单",
      timeMinutes: 6,
      tastes: [m.taste],
      contains: [],
      steps: [`基底：${m.base}`, "+冰块+搅拌棒", "杯口装饰柠檬片"],
      reason: `${m.name}清爽零酒精，开车也能喝。`,
      serves: 1,
      ingredients: [
        { name: "苏打水", qty: "200ml", category: "调味/主食" },
        { name: "柠檬", qty: "半个", category: "蔬菜" },
        { name: "薄荷", qty: "5g", category: "蔬菜" },
        { name: "蜂蜜", qty: "1 大勺", category: "调味/主食" },
      ],
      seasons: ["夏"],
      weathers: [m.weather],
      energy: ["解暑","清爽"],
      category: "饮品",
    });
  }
  return out;
}

function genSnackCombos(): GenRecipe[] {
  const out: GenRecipe[] = [];
  const snacks = [
    { key: "rice-ball", name: "饭团", base: "米饭+海苔", t: "咸鲜" as Taste, course: "staple" as Course, cat: "小吃" as Category },
    { key: "spring-roll", name: "春卷", base: "春卷皮+蔬菜", t: "咸鲜" as Taste, course: "staple" as Course, cat: "小吃" as Category },
    { key: "jiaozi", name: "煎饺", base: "面皮+馅", t: "咸鲜" as Taste, course: "staple" as Course, cat: "小吃" as Category },
    { key: "pancake", name: "葱花饼", base: "面粉+葱花", t: "咸鲜" as Taste, course: "staple" as Course, cat: "早餐" as Category },
    { key: "egg-cake", name: "鸡蛋饼", base: "面糊+鸡蛋", t: "咸鲜" as Taste, course: "staple" as Course, cat: "早餐" as Category },
    { key: "cong-you-bing", name: "葱油饼", base: "千层面胚+葱花", t: "咸鲜" as Taste, course: "staple" as Course, cat: "早餐" as Category },
  ];
  const fillings: FlavorBase[] = [
    { key: "tuna", name: "金枪鱼" },
    { key: "ham", name: "火腿" },
    { key: "veg", name: "蔬菜" },
    { key: "egg", name: "蛋黄" },
    { key: "shrimp", name: "鲜虾" },
    { key: "beef", name: "牛肉" },
    { key: "pork", name: "猪肉" },
    { key: "mushroom", name: "香菇" },
  ];
  for (const s of snacks) {
    for (const f of fillings) {
      // 跳过不合理组合
      if (s.key === "egg-cake" && f.key === "egg") continue;
      const id = safeId(`snack-${s.key}-${f.key}`);
      const name = `${f.name}${s.name}`;
      const containsSet = new Set<Restriction>();
      const ings: GenIngredient[] = [];
      if (s.key === "rice-ball") {
        ings.push({name:"米饭",qty:"2 碗",category:"调味/主食"},{name:"海苔",qty:"4 片",category:"调味/主食"});
      } else if (s.key === "spring-roll") {
        ings.push({name:"春卷皮",qty:"15 张",category:"调味/主食"});
      } else if (s.key === "jiaozi") {
        ings.push({name:"饺子皮",qty:"30 张",category:"调味/主食"});
      } else if (s.key === "pancake" || s.key === "cong-you-bing") {
        ings.push({name:"面粉",qty:"200g",category:"调味/主食"},{name:"葱花",qty:"1 把",category:"蔬菜"});
      } else if (s.key === "egg-cake") {
        ings.push({name:"面粉",qty:"100g",category:"调味/主食"},{name:"鸡蛋",qty:"2 个",category:"肉蛋豆制品"});
        containsSet.add("无蛋");
      }
      // 馅料对应食材
      const fillIng = (() => {
        switch (f.key) {
          case "tuna": return {name:"金枪鱼罐头",qty:"100g",category:"肉蛋豆制品" as const};
          case "ham": return {name:"火腿",qty:"100g",category:"肉蛋豆制品" as const};
          case "veg": return {name:"小白菜",qty:"200g",category:"蔬菜" as const};
          case "egg": return {name:"咸蛋黄",qty:"2 个",category:"肉蛋豆制品" as const};
          case "shrimp": return {name:"虾仁",qty:"150g",category:"肉蛋豆制品" as const};
          case "beef": return {name:"牛肉末",qty:"150g",category:"肉蛋豆制品" as const};
          case "pork": return {name:"猪肉末",qty:"150g",category:"肉蛋豆制品" as const};
          case "mushroom": return {name:"香菇",qty:"100g",category:"蔬菜" as const};
          default: return {name:"蔬菜",qty:"200g",category:"蔬菜" as const};
        }
      })();
      ings.push(fillIng);
      ings.push({name:"生抽",qty:"1 大勺",category:"调味/主食"});
      // 推断 contains
      if (/鸡蛋|蛋黄/.test(fillIng.name) || ings.some(i => /鸡蛋/.test(i.name))) containsSet.add("无蛋");
      if (/牛肉/.test(fillIng.name)) containsSet.add("无牛肉");
      if (/猪肉|火腿/.test(fillIng.name)) containsSet.add("无猪肉");
      if (/虾|鱼/.test(fillIng.name) && !/虾皮/.test(fillIng.name)) containsSet.add("无海鲜");
      out.push({
        id,
        name,
        course: s.course,
        cuisine: "家常",
        difficulty: s.key === "spring-roll" || s.key === "jiaozi" ? "中等" : "简单",
        timeMinutes: s.key === "jiaozi" ? 50 : s.key === "spring-roll" ? 30 : 18,
        tastes: [s.t],
        contains: Array.from(containsSet),
        steps: [`处理${f.name}馅料`, `${s.base}成型`, "煎/蒸/炸至熟", "装盘配蘸料"],
        reason: `${f.name}${s.name}快手暖胃，街头风格搬回家。`,
        serves: 2,
        ingredients: ings,
        slots: s.cat === "早餐" ? ["breakfast"] : ["breakfast", "lunch", "dinner"],
        energy: ["快手"],
        category: s.cat,
      });
    }
  }
  return out;
}

function genBakingCombos(): GenRecipe[] {
  const out: GenRecipe[] = [];
  // 简单烘焙基底 × 风味
  const bakings = [
    { key: "muffin", name: "马芬", time: 35, diff: "简单" as Difficulty },
    { key: "pound-cake", name: "磅蛋糕", time: 70, diff: "中等" as Difficulty },
    { key: "cookies", name: "饼干", time: 30, diff: "简单" as Difficulty },
    { key: "scone", name: "司康", time: 30, diff: "简单" as Difficulty },
    { key: "cupcake", name: "杯子蛋糕", time: 40, diff: "简单" as Difficulty },
  ];
  const flavors = [
    { key: "matcha", name: "抹茶" },
    { key: "choco", name: "巧克力" },
    { key: "blueberry", name: "蓝莓" },
    { key: "lemon", name: "柠檬" },
    { key: "vanilla", name: "香草" },
    { key: "earlgrey", name: "伯爵" },
    { key: "rose", name: "玫瑰" },
  ];
  for (const b of bakings) {
    for (const f of flavors) {
      out.push({
        id: safeId(`baking-${b.key}-${f.key}`),
        name: `${f.name}${b.name}`,
        course: "staple",
        cuisine: "家常",
        difficulty: b.diff,
        timeMinutes: b.time,
        tastes: ["酸甜"],
        contains: ["无奶","无蛋"],
        steps: ["黄油糖打发", `+蛋液+面粉+泡打粉+${f.name}风味`, "180℃ 烤"],
        reason: `${f.name}风味${b.name}，下午茶赏心悦目。`,
        serves: 4,
        ingredients: [
          { name: "低筋面粉", qty: "200g", category: "调味/主食" },
          { name: "黄油", qty: "100g", category: "调味/主食" },
          { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" },
          { name: "糖", qty: "60g", category: "调味/主食" },
          { name: "牛奶", qty: "60ml", category: "调味/主食" },
          { name: `${f.name}粉`, qty: "10g", category: "调味/主食" },
        ],
        slots: ["lunch"],
        energy: ["清爽"],
        category: "下午茶",
      });
    }
  }
  return out;
}

// === id sanitizer ===
function safeId(raw: string): string {
  return raw.replace(/[^a-z0-9-]/g, "");
}

// === 主菜：主料 × 蔬菜（家常小炒搭配） ===
function genStirCombo(p: Protein, v: Veg): GenRecipe | null {
  // 限制：只用快手主料（v2 放宽，加上蛋类/虾仁/豆腐组合）
  if (!["lean-pork", "minced-pork", "chicken-breast", "chicken-thigh", "beef", "shrimp-meat", "egg", "tofu-firm", "tofu-soft", "shrimp", "porkbelly", "beef-brisket"].includes(p.key)) return null;
  // 蔬菜需要适合炒（v2 放宽：加 西兰花/菠菜/番茄/冬瓜/莲藕/竹笋/豆干/萝卜/茄子）
  if (!["potato", "pepper-green", "pepper-color", "celery", "leek", "beans", "mushroom", "cabbage", "bokchoy", "fungus", "carrot", "onion", "loofah", "broccoli", "spinach", "tomato", "winter-melon", "lotus", "bamboo", "doudou", "radish", "eggplant", "cucumber", "rape"].includes(v.key)) return null;

  const id = safeId(`combo-${p.key}-${v.key}`);
  const name = `${p.display}炒${v.display}`;
  const tastes: Taste[] = ["咸鲜"];
  const containsSet = new Set<Restriction>([...p.contains]);

  const ings: GenIngredient[] = [
    { name: p.ingName, qty: p.qty, category: p.category },
    { name: v.ingName, qty: v.qty, category: "蔬菜" },
    GINGER_GARLIC,
    SOY_SAUCE,
    OYSTER,
    SALT,
    COOKING_OIL,
  ];
  if (p.key === "lean-pork" || p.key === "chicken-breast" || p.key === "chicken-thigh" || p.key === "beef") {
    ings.push(STARCH);
    ings.push(COOKING_WINE);
  }
  return {
    id,
    name,
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 18,
    tastes,
    contains: Array.from(containsSet),
    steps: [
      `${p.display}处理切片或切丁（如有需要腌生抽料酒淀粉 10 分钟）`,
      `${v.display}处理切好`,
      "热油爆姜蒜，下主料快炒变色盛出",
      `下${v.display}炒至断生`,
      `回锅主料调生抽蚝油盐翻匀出锅`,
    ],
    reason: `${p.display}的鲜搭${v.display}的脆，家常下饭组合。`,
    serves: 3,
    ingredients: ings,
    seasons: undefined,
    weathers: undefined,
    slots: ["lunch", "dinner"],
    energy: ["快手", "下饭"],
  };
}

// === 主菜生成（主料 × 风格）===
function genMain(p: Protein, s: Style): GenRecipe | null {
  // 不合理组合排除
  if (s.key === "steamed" && !["fish", "perch", "tofu-soft"].includes(p.key)) return null;
  if (s.key === "stewed-soup" && !["chicken-thigh", "whole-chicken", "ribs", "beef-brisket", "lamb"].includes(p.key)) return null;
  if (s.key === "stew-warm" && !["whole-chicken", "ribs", "beef-brisket", "lamb"].includes(p.key)) return null;
  if (s.key === "twicecooked" && !["porkbelly"].includes(p.key)) return null;
  if (s.key === "spicy-cumin" && !["beef", "lamb"].includes(p.key)) return null;
  if (s.key === "kungpao" && !["chicken-thigh", "chicken-breast", "lean-pork"].includes(p.key)) return null;
  if (s.key === "blackpepper" && !["beef", "chicken-breast", "chicken-thigh", "shrimp-meat"].includes(p.key)) return null;
  if (s.key === "yuxiang" && !["lean-pork", "minced-pork", "tofu-firm", "eggplant"].includes(p.key)) return null;
  if (s.key === "garlic" && !["shrimp", "shrimp-meat", "tofu-firm"].includes(p.key)) return null;
  if (s.key === "sourspicy" && !["lean-pork", "tofu-firm", "fish", "shrimp-meat"].includes(p.key)) return null;
  if (s.key === "vinegar-stir" && !["lean-pork", "fish", "shrimp-meat"].includes(p.key)) return null;
  if (s.key === "stir-simple" && !["lean-pork", "chicken-breast", "beef", "shrimp-meat", "tofu-firm"].includes(p.key)) return null;
  if (s.key === "redbraised" && !["porkbelly", "ribs", "beef-brisket", "chicken-thigh", "chicken-wing", "fish"].includes(p.key)) return null;
  if (s.key === "douban-braise" && !["fish", "tofu-firm", "tofu-soft", "ribs", "shrimp"].includes(p.key)) return null;
  if (s.key === "honey-glaze" && !["chicken-wing", "ribs", "chicken-thigh"].includes(p.key)) return null;
  if (s.key === "salty-sour" && !["beef", "lean-pork", "tofu-firm", "egg", "shrimp-meat"].includes(p.key)) return null;
  if (s.key === "fragrant-sauce" && !["lean-pork", "chicken-thigh", "chicken-breast", "beef"].includes(p.key)) return null;
  if (s.key === "shacha" && !["beef", "lamb", "chicken-thigh", "shrimp", "shrimp-meat"].includes(p.key)) return null;
  if (s.key === "soybean-sauce-stew" && !["porkbelly", "ribs", "chicken-thigh", "whole-chicken", "beef-brisket"].includes(p.key)) return null;

  const id = safeId(`${s.key}-${p.key}`);
  const name = `${s.zh}${p.display}`;
  const cuisine = p.cuisine ?? s.cuisine;
  const tastes = Array.from(new Set(s.tastes)) as Taste[];
  const containsSet = new Set<Restriction>([...s.contains, ...p.contains]);
  // 食材构造
  const ings: GenIngredient[] = [
    { name: p.ingName, qty: p.qty, category: p.category },
    ...s.extraIngs,
  ];
  // 添加 contains 推断（鸡蛋/牛肉等）
  for (const ing of ings) {
    if (/鸡蛋|蛋$/.test(ing.name) && !/淀粉/.test(ing.name)) containsSet.add("无蛋");
    if (/牛肉|牛腩|牛里脊/.test(ing.name)) containsSet.add("无牛肉");
    if (/猪肉|五花|猪里脊|排骨/.test(ing.name)) containsSet.add("无猪肉");
    if (/虾|蟹|鱼|蛤|贝|海带|紫菜/.test(ing.name) && !/虾皮|紫菜$/.test(ing.name)) {
      // 海带紫菜不算海鲜
      if (/虾|蟹|鱼|蛤|贝/.test(ing.name)) containsSet.add("无海鲜");
    }
    if (/花生/.test(ing.name)) containsSet.add("无花生");
    if (/牛奶|奶/.test(ing.name) && !/豆奶/.test(ing.name)) containsSet.add("无奶");
  }
  if (tastes.some((t) => t === "微辣" || t === "重辣" || t === "麻辣")) {
    containsSet.add("无辣");
  }

  // 难度时长根据主料微调
  let timeMinutes = s.timeBase;
  if (["whole-chicken", "beef-brisket", "lamb", "ribs"].includes(p.key) && (s.key === "redbraised" || s.key === "stew-warm" || s.key === "stewed-soup")) {
    timeMinutes = Math.max(timeMinutes, 80);
  }

  // 标签：根据风格能量推断 weather/season/slot
  const seasons = inferSeasons(s.energy);
  const weathers = inferWeathers(s.energy);
  const slots: MealSlotTag[] = ["lunch", "dinner"];
  const regions: RegionTag[] | undefined = inferRegions(cuisine);

  return {
    id,
    name,
    course: "main",
    cuisine,
    difficulty: s.difficulty,
    timeMinutes,
    tastes,
    contains: Array.from(containsSet),
    steps: s.steps(p.display),
    reason: s.reasonTpl(p.display),
    serves: 3,
    ingredients: ings,
    seasons,
    weathers,
    regions,
    slots,
    energy: s.energy,
  };
}

// === 素菜生成（蔬菜 × 简单做法）===
function genVeggie(v: Veg, style: "garlic" | "vinegar-stir" | "cold-shred" | "stir-simple" | "sourspicy"): GenRecipe | null {
  const styleObj = STYLES.find((s) => s.key === style)!;
  // 凉拌不适合大块根茎
  if (style === "cold-shred" && ["potato", "winter-melon"].includes(v.key)) return null;
  if (style === "garlic" && !["bokchoy", "spinach", "leek", "cabbage", "celery", "broccoli"].includes(v.key)) return null;
  if (style === "vinegar-stir" && !["cabbage", "potato", "lotus", "carrot", "radish"].includes(v.key)) return null;
  if (style === "sourspicy" && !["potato", "lotus", "cabbage", "bamboo"].includes(v.key)) return null;
  if (style === "cold-shred" && !["cucumber", "fungus", "lotus", "carrot", "radish", "celery", "spinach", "tomato"].includes(v.key)) return null;
  if (style === "stir-simple" && !["beans", "broccoli", "celery", "loofah", "cabbage", "mushroom", "carrot"].includes(v.key)) return null;

  const id = safeId(`${style}-${v.key}-veg`);
  const name = `${styleObj.zh}${v.display}`;
  const ings: GenIngredient[] = [
    { name: v.ingName, qty: v.qty, category: "蔬菜" },
    ...styleObj.extraIngs,
  ];
  const contains: Restriction[] = styleObj.tastes.some((t) => t === "微辣" || t === "重辣" || t === "麻辣") ? ["无辣"] : [];
  const seasons = inferSeasons(styleObj.energy);
  const weathers = inferWeathers(styleObj.energy);
  return {
    id,
    name,
    course: "veggie",
    cuisine: styleObj.cuisine,
    difficulty: styleObj.difficulty,
    timeMinutes: styleObj.timeBase,
    tastes: styleObj.tastes,
    contains,
    steps: styleObj.steps(v.display),
    reason: styleObj.reasonTpl(v.display),
    serves: 2,
    ingredients: ings,
    seasons,
    weathers,
    slots: ["lunch", "dinner"],
    energy: styleObj.energy,
  };
}

function inferSeasons(energy: EnergyTag[]): Season[] | undefined {
  const has = (k: EnergyTag) => energy.includes(k);
  if (has("解暑") || has("适合热")) return ["夏"];
  if (has("驱寒") || has("适合冷")) return ["秋", "冬"];
  return undefined;
}
function inferWeathers(energy: EnergyTag[]): WeatherTag[] | undefined {
  const has = (k: EnergyTag) => energy.includes(k);
  const tags: WeatherTag[] = [];
  if (has("解暑") || has("适合热")) tags.push("热", "晴");
  if (has("驱寒") || has("适合冷")) tags.push("冷");
  if (has("适合雨天") || has("暖胃")) tags.push("雨", "潮湿");
  return tags.length ? Array.from(new Set(tags)) : undefined;
}
function inferRegions(c: Cuisine): RegionTag[] | undefined {
  switch (c) {
    case "川菜":
      return ["西南"];
    case "粤菜":
      return ["华南"];
    case "江浙":
      return ["华东"];
    case "鲁菜":
      return ["华北"];
    case "西北":
      return ["西北"];
    case "东北":
      return ["东北"];
    default:
      return undefined;
  }
}

// v2: 新增组合生成 — 把数据库扩到 1000+，避免靠堆 hand-recipes。
// === 砂锅 / 煲（protein × veg）===
function genCasseroleCombo(p: Protein, v: Veg): GenRecipe | null {
  if (!["chicken-thigh", "ribs", "beef-brisket", "porkbelly", "shrimp", "tofu-firm", "fish", "perch", "whole-chicken"].includes(p.key)) return null;
  if (!["radish", "potato", "winter-melon", "lotus", "carrot", "mushroom", "cabbage", "tomato", "bamboo", "doudou"].includes(v.key)) return null;
  const id = safeId(`casserole-${p.key}-${v.key}`);
  const name = `${p.display}${v.display}煲`;
  const ings: GenIngredient[] = [
    { name: p.ingName, qty: p.qty, category: p.category },
    { name: v.ingName, qty: v.qty, category: "蔬菜" },
    GINGER_GARLIC, SOY_SAUCE, OYSTER, SALT, COOKING_WINE, COOKING_OIL,
  ];
  const containsSet = new Set<Restriction>([...p.contains]);
  return {
    id,
    name,
    course: "main",
    cuisine: p.cuisine ?? "家常",
    difficulty: "中等",
    timeMinutes: 60,
    tastes: ["咸鲜"],
    contains: Array.from(containsSet),
    steps: [
      `${p.display}焯水或煎香`,
      `${v.display}切大块`,
      "砂锅底铺姜葱，下主料和蔬菜",
      "倒入生抽蚝油料酒+少量水",
      "中小火慢炖 30-40 分钟，收汁出锅",
    ],
    reason: `${p.display}与${v.display}慢炖，汤汁浓郁，米饭杀手。`,
    serves: 3,
    ingredients: ings,
    seasons: ["秋", "冬"],
    weathers: ["冷"],
    slots: ["lunch", "dinner"],
    energy: ["驱寒", "暖胃"],
  };
}

// === 蒸（蛋羹 / 茄子 / 排骨等）===
function genSteamCombo(p: Protein, v: Veg): GenRecipe | null {
  // 仅特定主料 × 特定蔬菜
  const ok = (
    (p.key === "egg" && ["mushroom", "tomato", "spinach", "carrot"].includes(v.key)) ||
    (p.key === "minced-pork" && ["eggplant", "tofu-soft" as any, "winter-melon"].includes(v.key)) ||
    (p.key === "ribs" && ["potato", "lotus", "radish"].includes(v.key)) ||
    (p.key === "chicken-thigh" && ["mushroom", "lotus"].includes(v.key)) ||
    (p.key === "shrimp-meat" && ["broccoli", "carrot"].includes(v.key))
  );
  if (!ok) return null;
  const id = safeId(`steam-${p.key}-${v.key}`);
  const name = `${p.display}蒸${v.display}`;
  const ings: GenIngredient[] = [
    { name: p.ingName, qty: p.qty, category: p.category },
    { name: v.ingName, qty: v.qty, category: "蔬菜" },
    GINGER_GARLIC, SOY_SAUCE, SALT, COOKING_OIL, STARCH,
  ];
  return {
    id,
    name,
    course: "main",
    cuisine: p.cuisine ?? "家常",
    difficulty: "简单",
    timeMinutes: 25,
    tastes: ["清淡", "咸鲜"],
    contains: [...p.contains],
    steps: [
      `${p.display}处理切好`,
      `${v.display}切片或切丁`,
      "码盘加盐料酒生抽淀粉拌匀",
      "上汽蒸 12-18 分钟",
      "出锅淋少许生抽热油激香",
    ],
    reason: `${p.display}遇到${v.display}，蒸的最大限度保住食材本味，软嫩易消化。`,
    serves: 2,
    ingredients: ings,
    seasons: undefined,
    weathers: undefined,
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  };
}

// === 凉拌（多蔬菜组合）===
function genColdMixCombo(v1: Veg, v2: Veg): GenRecipe | null {
  if (v1.key === v2.key) return null;
  // 字典序避免重复
  if (v1.key.localeCompare(v2.key) >= 0) return null;
  const okV = ["cucumber", "carrot", "radish", "fungus", "lotus", "celery", "spinach", "tomato", "doudou", "cabbage"];
  if (!okV.includes(v1.key) || !okV.includes(v2.key)) return null;
  const id = safeId(`coldmix-${v1.key}-${v2.key}`);
  const name = `凉拌${v1.display}${v2.display}`;
  const ings: GenIngredient[] = [
    { name: v1.ingName, qty: v1.qty, category: "蔬菜" },
    { name: v2.ingName, qty: v2.qty, category: "蔬菜" },
    GINGER_GARLIC, VINEGAR, SOY_SAUCE, SALT, COOKING_OIL,
  ];
  return {
    id,
    name,
    course: "veggie",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 12,
    tastes: ["清淡", "咸鲜"],
    contains: [],
    steps: [
      `${v1.display}与${v2.display}分别洗净处理`,
      "需要焯水的烫一下过凉",
      "切丝或切片码碗",
      "蒜末醋生抽香油盐拌匀，淋上即可",
    ],
    reason: `${v1.display}遇上${v2.display}，清爽开胃低热量，夏天不踩雷。`,
    serves: 2,
    ingredients: ings,
    seasons: ["夏"],
    weathers: ["热"],
    slots: ["lunch", "dinner"],
    energy: ["快手", "解暑"],
  };
}

// === 蛋类家常变体 ===
function genEggCombo(v: Veg): GenRecipe | null {
  if (!["tomato", "leek", "pepper-green", "pepper-color", "fungus", "spinach", "mushroom", "bokchoy", "carrot", "cucumber", "doudou"].includes(v.key)) return null;
  const id = safeId(`egg-stir-${v.key}`);
  const name = `${v.display}炒蛋`;
  const ings: GenIngredient[] = [
    { name: "鸡蛋", qty: "3 个", category: "肉蛋豆制品" },
    { name: v.ingName, qty: v.qty, category: "蔬菜" },
    GINGER_GARLIC, SOY_SAUCE, SALT, COOKING_OIL,
  ];
  return {
    id,
    name,
    course: "main",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 10,
    tastes: ["咸鲜", "清淡"],
    contains: ["无蛋"],
    steps: [
      "鸡蛋打散加少许盐",
      "热油快炒蛋盛出",
      `${v.display}下锅炒 1 分钟`,
      "回锅鸡蛋翻匀，调生抽出锅",
    ],
    reason: `${v.display}炒蛋是国民菜，10 分钟出锅扛饿。`,
    serves: 2,
    ingredients: ings,
    seasons: undefined,
    weathers: undefined,
    slots: ["breakfast", "lunch", "dinner"],
    energy: ["快手"],
  };
}

// === 主食面食扩展（一份主食 × 配料）===
const NOODLE_TYPES: { key: string; display: string }[] = [
  { key: "lamian", display: "拉面" },
  { key: "udon", display: "乌冬面" },
  { key: "rice-noodle", display: "米粉" },
  { key: "vermicelli", display: "粉丝" },
  { key: "yangchun", display: "阳春面" },
  { key: "egg-noodle", display: "鸡蛋面" },
  { key: "knife-cut", display: "刀削面" },
  { key: "buckwheat", display: "荞麦面" },
];
const NOODLE_TOPPINGS: { key: string; display: string; contains: Restriction[] }[] = [
  { key: "beef-marinade", display: "卤牛肉", contains: ["无牛肉"] },
  { key: "braised-pork", display: "红烧肉", contains: ["无猪肉"] },
  { key: "minced-pork", display: "肉末浇头", contains: ["无猪肉"] },
  { key: "chicken-leg", display: "鸡腿浇头", contains: [] },
  { key: "tomato-egg", display: "番茄鸡蛋", contains: ["无蛋"] },
  { key: "shrimp", display: "鲜虾", contains: ["无海鲜"] },
  { key: "chashao", display: "叉烧", contains: ["无猪肉"] },
  { key: "veg-rich", display: "蔬菜浇头", contains: [] },
];

function genNoodleCombo(t: { key: string; display: string }, top: { key: string; display: string; contains: Restriction[] }): GenRecipe | null {
  const id = safeId(`noodle-${t.key}-${top.key}`);
  const name = `${top.display}${t.display}`;
  const ings: GenIngredient[] = [
    { name: t.display, qty: "1 人份 (200g)", category: "调味/主食" },
    { name: top.display, qty: "适量 (150g)", category: "肉蛋豆制品" },
    { name: "葱花", qty: "1 把", category: "蔬菜" },
    SOY_SAUCE, SALT, COOKING_OIL,
  ];
  return {
    id,
    name,
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["咸鲜"],
    contains: [...top.contains],
    steps: [
      `烧水煮${t.display}至适合口感`,
      `${top.display}另起锅炒香或加热`,
      "面捞入碗，浇上浇头",
      "撒葱花淋少许酱汁即可",
    ],
    reason: `${t.display}配${top.display}是国民面馆经典组合。`,
    serves: 1,
    ingredients: ings,
    seasons: undefined,
    weathers: undefined,
    slots: ["lunch", "dinner"],
    energy: ["快手"],
  };
}

// === 米饭主食盖浇饭 ===
const RICE_TOPPINGS: { key: string; display: string; contains: Restriction[]; reason: string }[] = [
  { key: "yuxiang-pork", display: "鱼香肉丝", contains: ["无猪肉"], reason: "酸甜微辣下饭神器" },
  { key: "kungpao-chicken", display: "宫保鸡丁", contains: [], reason: "经典川菜浇头" },
  { key: "redbraise-pork", display: "红烧肉", contains: ["无猪肉"], reason: "肥而不腻盖浇饭天花板" },
  { key: "blackpepper-beef", display: "黑椒牛柳", contains: ["无牛肉"], reason: "牛柳爆香盖饭" },
  { key: "curry-chicken", display: "咖喱鸡", contains: ["无奶"], reason: "咖喱浓郁配米饭最香" },
  { key: "sweet-sour-pork", display: "糖醋里脊", contains: ["无猪肉", "无蛋"], reason: "酸甜外酥里嫩" },
  { key: "veg-mushroom", display: "三鲜菌菇", contains: [], reason: "素食盖浇也丰盛" },
  { key: "japanese-curry", display: "日式咖喱", contains: ["无奶"], reason: "微甜咖喱国民盖饭" },
];
function genRiceTopping(t: { key: string; display: string; contains: Restriction[]; reason: string }): GenRecipe {
  const id = safeId(`rice-${t.key}`);
  return {
    id,
    name: `${t.display}盖浇饭`,
    course: "staple",
    cuisine: "家常",
    difficulty: "中等",
    timeMinutes: 25,
    tastes: ["咸鲜"],
    contains: [...t.contains],
    steps: [
      `白米饭蒸好备用`,
      `炒制${t.display}主菜`,
      `淋汁勾芡浇在饭上`,
      `撒葱花点缀即可`,
    ],
    reason: t.reason,
    serves: 1,
    ingredients: [
      { name: "大米", qty: "1 杯", category: "调味/主食" },
      { name: t.display, qty: "1 份", category: "肉蛋豆制品" },
      { name: "葱花", qty: "适量", category: "蔬菜" },
      SOY_SAUCE, SALT,
    ],
    seasons: undefined,
    weathers: undefined,
    slots: ["lunch", "dinner"],
    energy: ["下饭", "快手"],
  };
}

// === 早餐扩展 ===
const BREAKFAST_VARS: { key: string; name: string; reason: string; contains: Restriction[]; ings: GenIngredient[] }[] = [
  { key: "porridge-pumpkin", name: "南瓜小米粥", reason: "暖胃护肠",
    contains: [], ings: [{ name: "小米", qty: "半杯", category: "调味/主食" }, { name: "南瓜", qty: "300g", category: "蔬菜" }] },
  { key: "porridge-eight", name: "八宝粥", reason: "膳食纤维丰富",
    contains: [], ings: [{ name: "糙米", qty: "半杯", category: "调味/主食" }, { name: "红豆", qty: "30g", category: "调味/主食" }, { name: "莲子", qty: "20g", category: "蔬菜" }] },
  { key: "porridge-millet", name: "白米粥", reason: "清淡养胃",
    contains: [], ings: [{ name: "大米", qty: "半杯", category: "调味/主食" }] },
  { key: "porridge-pork", name: "皮蛋瘦肉粥", reason: "国民早餐之王",
    contains: ["无蛋", "无猪肉"], ings: [{ name: "大米", qty: "半杯", category: "调味/主食" }, { name: "猪里脊", qty: "150g", category: "肉蛋豆制品" }, { name: "皮蛋", qty: "1 个", category: "肉蛋豆制品" }] },
  { key: "egg-tomato-noodle", name: "番茄鸡蛋面", reason: "10 分钟一碗",
    contains: ["无蛋"], ings: [{ name: "面条", qty: "1 人份", category: "调味/主食" }, { name: "番茄", qty: "2 个", category: "蔬菜" }, { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" }] },
  { key: "wonton", name: "鲜肉小馄饨", reason: "清晨暖胃",
    contains: ["无猪肉"], ings: [{ name: "馄饨皮", qty: "20 张", category: "调味/主食" }, { name: "猪肉末", qty: "150g", category: "肉蛋豆制品" }, { name: "紫菜", qty: "1 把", category: "蔬菜" }] },
  { key: "fan-tuan", name: "上海饭团", reason: "出门带着吃方便",
    contains: ["无猪肉"], ings: [{ name: "糯米", qty: "1 杯", category: "调味/主食" }, { name: "肉松", qty: "30g", category: "肉蛋豆制品" }, { name: "油条", qty: "1 根", category: "调味/主食" }] },
  { key: "cong-you-bing", name: "葱油饼", reason: "外脆里软香",
    contains: [], ings: [{ name: "面粉", qty: "200g", category: "调味/主食" }, { name: "葱花", qty: "1 把", category: "蔬菜" }] },
  { key: "egg-pancake", name: "煎蛋三明治", reason: "蛋白补充快手",
    contains: ["无蛋"], ings: [{ name: "吐司", qty: "2 片", category: "调味/主食" }, { name: "鸡蛋", qty: "2 个", category: "肉蛋豆制品" }] },
  { key: "soy-milk-doutiao", name: "豆浆油条", reason: "中式早餐 CP",
    contains: [], ings: [{ name: "豆浆", qty: "300ml", category: "调味/主食" }, { name: "油条", qty: "2 根", category: "调味/主食" }] },
];
function genBreakfastVar(t: typeof BREAKFAST_VARS[number]): GenRecipe {
  const id = safeId(`bk-${t.key}`);
  return {
    id,
    name: t.name,
    course: "staple",
    cuisine: "家常",
    difficulty: "简单",
    timeMinutes: 15,
    tastes: ["清淡"],
    contains: t.contains,
    steps: ["按食谱常规步骤备料", "下锅煮 / 煎制", "调味盛出"],
    reason: t.reason,
    serves: 1,
    ingredients: t.ings,
    seasons: undefined,
    weathers: undefined,
    slots: ["breakfast"],
    energy: ["快手", "暖胃"],
    category: "早餐",
  };
}

// === 生成主体 ===
function generate(): GenRecipe[] {
  const out: GenRecipe[] = [];
  // 1) 主菜：所有 (主料 × 风格) 合理组合
  for (const p of MAIN_PROTEINS) {
    for (const s of STYLES) {
      const r = genMain(p, s);
      if (r) out.push(r);
    }
  }
  // 1b) 主料 × 蔬菜的小炒组合
  for (const p of MAIN_PROTEINS) {
    for (const v of COMMON_VEG) {
      const r = genStirCombo(p, v);
      if (r) out.push(r);
    }
  }
  // 1c) v2: 砂锅煲 / 蒸 / 蛋系组合，把主菜池继续扩大
  for (const p of MAIN_PROTEINS) {
    for (const v of COMMON_VEG) {
      const c = genCasseroleCombo(p, v);
      if (c) out.push(c);
      const s = genSteamCombo(p, v);
      if (s) out.push(s);
    }
  }
  for (const v of COMMON_VEG) {
    const e = genEggCombo(v);
    if (e) out.push(e);
  }
  // 1d) v2: 凉拌组合
  for (const v1 of COMMON_VEG) {
    for (const v2 of COMMON_VEG) {
      const c = genColdMixCombo(v1, v2);
      if (c) out.push(c);
    }
  }
  // 1e) v2: 面条 × 浇头组合
  for (const t of NOODLE_TYPES) {
    for (const top of NOODLE_TOPPINGS) {
      const r = genNoodleCombo(t, top);
      if (r) out.push(r);
    }
  }
  // 1f) v2: 盖浇饭 / 早餐扩展
  for (const t of RICE_TOPPINGS) out.push(genRiceTopping(t));
  for (const t of BREAKFAST_VARS) out.push(genBreakfastVar(t));
  // 2) 素菜
  const vegStyles: ("garlic" | "vinegar-stir" | "cold-shred" | "stir-simple" | "sourspicy")[] = [
    "garlic",
    "vinegar-stir",
    "cold-shred",
    "stir-simple",
    "sourspicy",
  ];
  for (const v of COMMON_VEG) {
    for (const s of vegStyles) {
      const r = genVeggie(v, s);
      if (r) out.push(r);
    }
  }
  // 3) 汤
  for (const t of SOUPS) {
    out.push({
      id: t.id,
      name: t.name,
      course: "soup",
      cuisine: t.cuisine,
      difficulty: t.difficulty,
      timeMinutes: t.timeMinutes,
      tastes: t.tastes,
      contains: t.contains,
      steps: t.steps,
      reason: t.reason,
      serves: 3,
      ingredients: t.ingredients,
      seasons: t.seasons,
      weathers: t.weathers,
      regions: t.regions,
      slots: t.slots ?? ["lunch", "dinner"],
      energy: t.energy,
    });
  }
  // 4) 主食
  for (const t of STAPLES) {
    out.push({
      id: t.id,
      name: t.name,
      course: "staple",
      cuisine: t.cuisine,
      difficulty: t.difficulty,
      timeMinutes: t.timeMinutes,
      tastes: t.tastes,
      contains: t.contains,
      steps: t.steps,
      reason: t.reason,
      serves: 3,
      ingredients: t.ingredients,
      seasons: t.seasons,
      weathers: t.weathers,
      regions: t.regions,
      slots: t.slots,
      energy: t.energy,
    });
  }

  // 4b) 子门类（甜品 / 饮品 / 小吃 / 早餐 / 烘焙 / 轻食 / 夜宵）
  for (const t of [...DESSERTS, ...DRINKS, ...SNACKS, ...BREAKFAST_LIGHT]) {
    out.push(catToGen(t));
  }

  // 4c) 程序生成的甜品/饮品/小吃组合 — 把数据库扩到 600+
  out.push(...genDessertCombos());
  out.push(...genDrinkCombos());
  out.push(...genSnackCombos());
  out.push(...genBakingCombos());

  // 5) 去重 id
  const seen = new Set<string>();
  return out.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

function emit(recipes: GenRecipe[], target: string): void {
  const header = `// 自动生成 — 请勿直接编辑。
// 生成脚本：script/generate-recipes.ts
// 包含 ${recipes.length} 道由模板组合扩展的菜谱（与 RECIPES 中手写菜谱合并）。
// 字段约定见 client/src/data/recipes.ts。

import type { Recipe } from "./recipes";

`;
  const body = `export const GENERATED_RECIPES: Recipe[] = ${JSON.stringify(recipes, null, 2)};\n`;
  writeFileSync(target, header + body, "utf-8");
}

const __filename = fileURLToPath(import.meta.url);
const recipes = generate();
const outPath = resolve(__filename, "../../client/src/data/recipes.generated.ts");
emit(recipes, outPath);
console.log(`Generated ${recipes.length} recipes at ${outPath}`);
