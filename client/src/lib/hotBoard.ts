// 实时热搜聚合：多源 + 浏览器直连 + 静态 fallback。
// 设计要点：
//  - 不依赖任何私密 API key；只用公开、CORS 友好的端点。
//  - 任何端点失败必须降级到内置静态样例，保证 UI 不空白。
//  - 用户可勾选「屏蔽争议/敏感话题」开关。屏蔽词覆盖政治、社会冲突、灾难、刑案、地域攻击等，
//    但不会过分激进导致全空。
//  - 每条 hot item 都有标题、来源、可选热度、tag、为什么适合饭桌、原平台/百度搜索链接、视觉色板。

export type HotSource = "weibo" | "baidu" | "douyin" | "zhihu" | "bilibili" | "toutiao";

export interface HotItem {
  id: string;
  title: string;
  source: HotSource;
  /** 热度数值（如有），便于展示「xx 万」 */
  hot?: number;
  /** 二级描述/类型标签（如「热」「新」「沸」） */
  tag?: string;
  /** 直接跳转的链接 */
  url?: string;
  /** 描述：为什么适合 / 不适合饭桌聊 */
  dinnerHint?: string;
  /** 是否被敏感过滤标记（屏蔽时不展示） */
  flagged?: boolean;
  /** 给配图：emoji + 渐变。无网络图片，用主题渐变 + emoji 卡。 */
  visual?: {
    emoji: string;
    gradient: [string, string];
  };
}

export const HOT_SOURCE_META: Record<
  HotSource,
  { label: string; emoji: string; baseSearch: (q: string) => string; color: string }
> = {
  weibo: {
    label: "微博",
    emoji: "🟥",
    baseSearch: (q) => `https://s.weibo.com/weibo?q=${encodeURIComponent(q)}`,
    color: "#e6162d",
  },
  baidu: {
    label: "百度",
    emoji: "🔵",
    baseSearch: (q) => `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`,
    color: "#2932e1",
  },
  douyin: {
    label: "抖音",
    emoji: "🎵",
    baseSearch: (q) =>
      `https://www.douyin.com/search/${encodeURIComponent(q)}?type=general`,
    color: "#161823",
  },
  zhihu: {
    label: "知乎",
    emoji: "💬",
    baseSearch: (q) => `https://www.zhihu.com/search?q=${encodeURIComponent(q)}`,
    color: "#0066ff",
  },
  bilibili: {
    label: "B站",
    emoji: "📺",
    baseSearch: (q) =>
      `https://search.bilibili.com/all?keyword=${encodeURIComponent(q)}`,
    color: "#fb7299",
  },
  toutiao: {
    label: "今日头条",
    emoji: "📰",
    baseSearch: (q) =>
      `https://so.toutiao.com/search?dvpf=pc&keyword=${encodeURIComponent(q)}`,
    color: "#fa3232",
  },
};

// 敏感词：覆盖政治/社会冲突/灾难/刑案/恐怖/地域歧视等。
// 用「整词包含」而非完全匹配——但避免误伤一般食物/娱乐词。
const SENSITIVE_KEYWORDS = [
  // 政治 / 宗教
  "中央", "国务院", "政府", "政协", "中央委员会", "习近平", "李克强", "李强",
  "选举", "投票", "执政党", "在野党", "白宫", "克里姆林", "佩洛西", "拜登",
  "特朗普", "马斯克吵架",
  // 战争 / 武力 / 国际冲突
  "战争", "开战", "宣战", "武装", "导弹", "炸弹", "袭击", "无人机袭", "空袭",
  "停火", "俄乌", "以色列", "巴勒斯坦", "加沙", "中东", "伊朗", "朝鲜",
  "解放军", "军演",
  // 灾难
  "地震", "海啸", "洪水", "山火", "沉船", "坠机", "失事", "爆炸", "塌方",
  "暴雨灾害", "台风灾", "矿难", "瓦斯",
  // 刑案 / 暴力 / 自杀
  "杀害", "命案", "尸体", "凶案", "凶手", "枪击", "捅伤", "刺伤", "强奸",
  "性侵", "自杀", "自缢", "跳楼", "猥亵", "拐卖", "绑架", "纵火",
  // 重大社会冲突 / 群体事件
  "维权", "群体", "示威", "游行", "抗议", "封城", "封控", "拆迁",
  "打架", "冲突", "斗殴", "暴力", "霸凌",
  // 事故 / 案件
  "车祸", "矿难", "事故现场", "判决", "目击证词", "持续发酵",
  "刑事案件", "案件", "事故",
  // 地域 / 民族攻击
  "歧视", "排华", "辱华", "对立", "地域黑",
  // 涉黄涉赌 / 违法
  "涉黄", "嫖娼", "卖淫", "赌博", "诈骗", "贩毒", "毒品", "走私", "传销",
  // 公众人物负面（避免在饭桌制造尴尬）
  "出轨", "劈腿", "家暴", "性骚扰", "塌房",
  // 健康恐慌
  "新冠", "甲流", "病毒变异", "猴痘", "禽流感", "瘟疫",
];

const POSITIVE_FOOD_HINTS = [
  /美食|餐厅|食堂|早茶|火锅|烧烤|餐|饭|菜|汤|甜品|奶茶|咖啡|面|粥|烘焙|早餐|宵夜/,
  /电影|剧|演唱会|偶像|综艺|新番|动画|漫|演员|歌手|奥运|球|赛事|演技|主演/,
  /科技|发布|新品|手机|笔记本|相机|游戏|主机|更新|登录|上线/,
  /旅游|景点|出游|攻略|城市|度假|散步|展览|博物馆/,
  /搞笑|趣味|表情包|段子|有趣|温暖|治愈/,
];

export function isSensitive(title: string): boolean {
  const t = title || "";
  for (const k of SENSITIVE_KEYWORDS) {
    if (t.includes(k)) return true;
  }
  return false;
}

export function dinnerVibe(title: string): { hint: string; ok: boolean } {
  const t = title || "";
  if (isSensitive(t)) {
    return { hint: "话题偏沉重，吃饭可能不太舒服 — 已在屏蔽开关下默认隐藏", ok: false };
  }
  for (const re of POSITIVE_FOOD_HINTS) {
    if (re.test(t)) {
      return { hint: "热度话题里偏轻松愉快，饭桌可以聊一下", ok: true };
    }
  }
  return { hint: "中性话题，放心讨论", ok: true };
}

const EMOJI_BY_SOURCE: Record<HotSource, string> = {
  weibo: "🟥",
  baidu: "🔵",
  douyin: "🎵",
  zhihu: "💭",
  bilibili: "📺",
  toutiao: "📰",
};

const GRADIENT_PRESETS: [string, string][] = [
  ["#fbb273", "#c8552a"],
  ["#bce39a", "#5e9c45"],
  ["#f5c08d", "#a8794a"],
  ["#a4cef0", "#3a78b6"],
  ["#f8bbd0", "#c2185b"],
  ["#ffd180", "#f57c00"],
  ["#c5cae9", "#3f51b5"],
  ["#b2dfdb", "#00897b"],
];

function pickGradient(seed: string): [string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENT_PRESETS[Math.abs(h) % GRADIENT_PRESETS.length];
}

function pickEmoji(title: string, source: HotSource): string {
  const t = title || "";
  if (/电影|首映|票房|演员|演技/.test(t)) return "🎬";
  if (/演唱会|歌|乐队|音乐|偶像|出道/.test(t)) return "🎤";
  if (/球|赛|队|联赛|奥运|金牌|世界杯|冠军/.test(t)) return "🏆";
  if (/手机|相机|发布|新品|科技|AI|大模型|GPT|芯片/.test(t)) return "📱";
  if (/游戏|主机|玩家|新作/.test(t)) return "🎮";
  if (/餐|食|菜|汤|火锅|烧烤|甜|茶|奶茶|咖啡|面|粥/.test(t)) return "🍱";
  if (/旅游|景点|城市|度假|出游|攻略|展览|博物馆/.test(t)) return "🏝️";
  if (/萌|可爱|宠|猫|狗|动物/.test(t)) return "🐾";
  if (/天气|温度|降温|升温|入秋|入冬|台风|阴雨/.test(t)) return "☁️";
  return EMOJI_BY_SOURCE[source];
}

export function decorate(items: HotItem[]): HotItem[] {
  return items.map((it) => ({
    ...it,
    visual: it.visual ?? {
      emoji: pickEmoji(it.title, it.source),
      gradient: pickGradient(it.title + it.source),
    },
    dinnerHint: it.dinnerHint ?? dinnerVibe(it.title).hint,
    flagged: it.flagged ?? isSensitive(it.title),
  }));
}

// ====== 月份关键词：为「按当前月份」选择基线话题集而设 ======
// 每个月给出主题词、节日 / 节气、时令食材 / 饮食、季节活动等。
// 这些不是实时热搜，但能让 fallback 的话题至少与当前月匹配，避免「5 月却看到 10 月内容」。
export interface MonthTheme {
  month: number; // 1-12
  season: "春" | "夏" | "秋" | "冬";
  label: string;
  /** 季节关键词，用于过滤通用话题 */
  themes: string[];
  /** 月份特色话题（每平台调性不同，但共享一份候选） */
  food: string[];
  travel: string[];
  life: string[];
  entertainment: string[];
}

export const MONTH_THEMES: Record<number, MonthTheme> = {
  1: {
    month: 1, season: "冬", label: "1 月 · 隆冬 / 春节季",
    themes: ["元旦", "腊月", "年货", "新年", "团圆", "腊八", "围炉"],
    food: ["腊八粥怎么熬最香", "年货零食必囤清单", "冬日热饮榜：奶茶 vs 桂花酿", "围炉煮茶在家这样还原", "新春饺子哪种馅最受欢迎", "腊味煲仔饭周末做起来", "羊肉萝卜汤治冷天的胃"],
    travel: ["哈尔滨冰雪大世界这周热度爆表", "三亚跨年航班还来得及", "南方人第一次去东北的反应", "雾凇岛的清晨比想象中冷"],
    life: ["新年立的 flag 你还记得几条", "家庭年终聚会怎么聊不冷场", "1 月护肤换季要点", "冬至刚过为何更冷"],
    entertainment: ["跨年晚会名场面合集", "春节档电影提前预告", "综艺迎新季新一轮 PK", "冬日宅家剧单"],
  },
  2: {
    month: 2, season: "冬", label: "2 月 · 春节 / 元宵",
    themes: ["春节", "除夕", "拜年", "元宵", "春运", "情人节"],
    food: ["元宵汤圆甜咸大战", "年夜饭家常硬菜清单", "饺子蘸料配方暗战", "春节剩菜一周不重样", "拜年伴手礼怎么选不踩雷", "情人节自制甜品教程"],
    travel: ["春运返乡热门路线", "南方人北方过年攻略", "雪乡旅行尾声前的最佳窗口", "情人节短途出游推荐"],
    life: ["压岁钱的现代礼仪", "春节大扫除妙招", "拜年走亲戚怎么聊不被催婚", "情人节礼物分价位指南"],
    entertainment: ["春晚名场面回顾", "春节档票房日榜", "新春综艺特辑", "情人节专题片单"],
  },
  3: {
    month: 3, season: "春", label: "3 月 · 早春 / 妇女节",
    themes: ["惊蛰", "春分", "踏青", "春困", "妇女节", "315"],
    food: ["春笋上市怎么吃最鲜", "野菜挑战：荠菜马兰头香椿", "春韭头刀正当令", "315 后这些食材更要看清楚", "三月吃鱼的最佳时机", "马兰头拌香干家常做法"],
    travel: ["江南油菜花最佳观赏期", "婺源徽州春日 City Walk", "武汉樱花季排队攻略", "踏青 1 日往返路线集"],
    life: ["315 维权清单：你最在意哪条", "妇女节怎么过有仪式感", "春困如何破解", "换季穿搭从一件风衣开始"],
    entertainment: ["春日清新片单", "奥斯卡颁奖典礼回顾", "限定综艺三月开播", "民谣音乐节巡演阵容"],
  },
  4: {
    month: 4, season: "春", label: "4 月 · 仲春 / 清明",
    themes: ["清明", "谷雨", "春茶", "踏青", "扫墓", "愚人节"],
    food: ["明前龙井今年价格", "青团甜咸口味全测评", "春茶冲泡入门", "香椿芽炒鸡蛋怎么做最香", "野菜采摘安全指南", "笋鸡汤春日鲜味"],
    travel: ["婺源清明赏花最后一波", "武汉樱花尾季打卡点", "清明小长假短途路线", "茶山徒步推荐线"],
    life: ["清明祭扫新风尚", "春困变春活的运动方案", "防过敏花粉地图", "愚人节朋友圈整蛊集锦"],
    entertainment: ["北京电影节红毯", "春日治愈剧豆瓣榜", "民谣音乐节 4 月场", "动漫新番 4 月档"],
  },
  5: {
    month: 5, season: "春", label: "5 月 · 暮春 / 五一 / 母亲节",
    themes: ["五一", "立夏", "母亲节", "520", "野餐", "露营", "毕业季前奏"],
    food: ["立夏吃蛋的讲究", "枇杷上市价格今年怎么样", "樱桃车厘子谁更值得买", "草莓尾季抢购清单", "荔枝早季妃子笑上市", "芒果今年甜不甜", "夏日凉面凉皮做法合集", "野餐便当一小时搞定", "母亲节家宴菜单", "520 自制甜品送 ta"],
    travel: ["五一短途避坑指南", "杭州西湖五月人流预警", "云南旅游热门线路", "海岛 5 月最佳出行窗口", "周末露营装备清单", "婺源石城晨雾摄影攻略"],
    life: ["立夏养生小贴士", "母亲节礼物分价位推荐", "梅雨季前晾晒清单", "5 月护肤防晒升级", "520 仪式感小心思"],
    entertainment: ["五一档电影日票房", "戛纳电影节红毯前瞻", "音乐节五月巡演表", "综艺新季同期开播", "国漫五月新番速递"],
  },
  6: {
    month: 6, season: "夏", label: "6 月 · 入夏 / 高考 / 端午",
    themes: ["高考", "端午", "毕业季", "618", "父亲节", "梅雨", "夏至"],
    food: ["端午粽子甜咸再开战", "618 厨房好物清单", "高考考前饮食安排", "杨梅上市怎么挑", "西瓜冰镇前要不要洗", "夏日小龙虾性价比攻略", "凉皮米皮哪家强", "夏至面各地花样"],
    travel: ["毕业旅行高性价比目的地", "端午小长假近郊游", "海岛梅雨期能不能去", "杭州梅家坞茶山步道"],
    life: ["高考志愿填报指南", "毕业季拍照景点清单", "618 家电省钱攻略", "梅雨季防潮防霉妙招", "父亲节礼物指南"],
    entertainment: ["端午档新片预测", "高考毕业纪录片合集", "父亲节温情片单", "夏日清凉综艺榜"],
  },
  7: {
    month: 7, season: "夏", label: "7 月 · 盛夏 / 暑期",
    themes: ["暑假", "小暑", "大暑", "暑期档", "毕业旅行"],
    food: ["桃子今年甜度榜", "夏日冷饮 DIY 教程", "蓝莓水蜜桃葡萄哪种性价比高", "西瓜挑选老司机经验", "苦瓜消暑做法 5 种", "凉皮凉面凉拌菜合集", "三伏天养生汤", "黄花菜上市做法"],
    travel: ["夏日避暑山城榜", "新疆伊犁最佳花季", "贵州 24 小时凉到发抖", "海边度假平价目的地", "亲子动物园清单"],
    life: ["暑假亲子活动安排", "三伏天出门防晒装备", "夏日宿舍小家电省钱榜", "中暑急救常识"],
    entertainment: ["暑期档电影日票房榜", "暑期综艺真人秀", "动漫新番 7 月档", "音乐节夏日场"],
  },
  8: {
    month: 8, season: "夏", label: "8 月 · 末伏 / 七夕",
    themes: ["立秋", "处暑", "七夕", "末伏", "暑期尾声", "开学季前奏"],
    food: ["立秋贴秋膘吃什么", "七夕情人晚餐家常版", "葡萄无花果蜜瓜上市", "桃子尾季最甜的几天", "夏末凉拌菜清单", "处暑后该不该再喝冷饮"],
    travel: ["立秋后高山避暑窗口", "海岛 8 月台风注意", "七夕短途约会城市", "暑期末班亲子游"],
    life: ["开学装备清单", "七夕仪式感不踩雷", "立秋后皮肤干怎么办", "夏装清洗收纳技巧"],
    entertainment: ["七夕档新片预报", "暑期档票房收官", "动漫续作 8 月档", "音乐节末场打卡"],
  },
  9: {
    month: 9, season: "秋", label: "9 月 · 早秋 / 开学 / 中秋",
    themes: ["开学", "白露", "秋分", "中秋", "教师节", "丰收"],
    food: ["中秋月饼广式苏式哪种好吃", "开学早餐快手清单", "新米上市这样煮最香", "秋蟹好不好吃看什么", "教师节伴手礼吃食选", "板栗烤红薯街头香气", "葡萄柚柿子上市"],
    travel: ["中秋赏月最佳地点", "金秋十月前的旅行预订窗口", "西藏纳木错最佳时段", "开学返校城市指南"],
    life: ["教师节心意礼物指南", "开学季宿舍布置技巧", "白露后养生 6 件事", "秋装入手清单"],
    entertainment: ["中秋档电影预报", "教师节温情片单", "秋季新剧扎堆开播", "动漫新番 10 月档预告"],
  },
  10: {
    month: 10, season: "秋", label: "10 月 · 国庆 / 深秋",
    themes: ["国庆", "中秋假期", "寒露", "霜降", "重阳节", "金秋", "深秋出游"],
    food: ["国庆出行美食地图", "螃蟹大闸蟹这样吃才会", "南瓜山药做法合集", "重阳糕家常版", "深秋养生汤清单", "羊肉这样吃驱寒"],
    travel: ["国庆 7 天出游热门城市榜", "新疆喀纳斯秋色", "胡杨林最佳观赏期", "色达稻城最佳窗口"],
    life: ["国庆 7 天怎么省着花", "重阳孝亲指南", "深秋皮肤干燥护肤", "返程拥堵规避"],
    entertainment: ["国庆档票房日榜", "金鸡奖颁奖典礼", "秋季档新剧追更榜", "国漫 10 月新番"],
  },
  11: {
    month: 11, season: "秋", label: "11 月 · 双 11 / 立冬",
    themes: ["双11", "立冬", "小雪", "感恩节", "进博会", "黑五"],
    food: ["双11 厨房好物清单", "立冬饺子还是羊肉锅", "板栗鸡这样烧最香", "深秋火锅口碑榜", "双11 平价美食 App 优惠", "感恩节家常烤鸡"],
    travel: ["双11 旅行机票囤货策略", "深秋赏银杏地图", "婺源篁岭晒秋最后一波", "新疆禾木雪线初来"],
    life: ["双11 不踩坑攻略", "立冬保暖装备清单", "供暖前家居准备", "感恩节家庭聚餐主题"],
    entertainment: ["双11 晚会回顾", "立冬主题片单", "动漫新番十一月档", "深秋治愈剧推荐"],
  },
  12: {
    month: 12, season: "冬", label: "12 月 · 严冬 / 年末",
    themes: ["双十二", "圣诞", "元旦", "冬至", "大雪", "跨年"],
    food: ["冬至饺子还是汤圆", "圣诞家庭烤鸡指南", "热红酒在家做", "冬日围炉煮茶热度回归", "跨年面三种吃法", "年货零食 TOP 10"],
    travel: ["哈尔滨冰雪大世界开园", "三亚跨年航班", "圣诞夜城市灯光打卡", "雪乡阿尔山冬日攻略"],
    life: ["年末复盘日记怎么写", "圣诞礼物清单", "元旦倒计时仪式感", "冬至养生小贴士"],
    entertainment: ["跨年晚会预告", "贺岁档电影日票房", "圣诞主题片单", "年终盘点合集"],
  },
};

export function currentMonth(): number {
  return new Date().getMonth() + 1;
}

export function currentSeason(): "春" | "夏" | "秋" | "冬" {
  return MONTH_THEMES[currentMonth()].season;
}

/** 把候选话题数组按月份做轻量加权 / 替换。
 *  规则：候选列表中如果命中其它月份的关键词，会被换成当前月份的相关话题；
 *  保留通用话题。返回顺序保持稳定，但前 N 条会被替换为月份特色话题以让用户立刻看到。
 *  v8: 每个平台 phrasing 不同 + seed 控制刷新内容变化。
 */
function rotateForCurrentMonth(items: HotItem[], topUpCount = 4, seed = 0): HotItem[] {
  const m = currentMonth();
  const theme = MONTH_THEMES[m];
  const otherThemes = Object.values(MONTH_THEMES).filter((t) => t.month !== m);
  const otherKeywords = new Set<string>();
  otherThemes.forEach((t) => t.themes.forEach((k) => otherKeywords.add(k)));
  // 过滤掉明显属于其它月份的话题
  const otherKeywordList = Array.from(otherKeywords);
  const cleaned = items.filter((it) => {
    for (let i = 0; i < otherKeywordList.length; i++) {
      if (it.title.includes(otherKeywordList[i])) return false;
    }
    return true;
  });
  const source = items[0]?.source ?? "weibo";
  // 每平台 phrasing 不同，确保「抖音 / 头条 / 微博」不再共用同一批月份话题。
  const monthlyPhrasings = monthlyTopicsForPlatform(theme, source);
  // 用 seed 选取 topUpCount 条
  const offset = Math.abs(seed) % Math.max(1, monthlyPhrasings.length);
  const monthly: HotItem[] = [];
  for (let i = 0; i < Math.min(topUpCount, monthlyPhrasings.length); i++) {
    const idx = (offset + i) % monthlyPhrasings.length;
    monthly.push({
      id: `month-${m}-${source}-${seed}-${i}`,
      title: monthlyPhrasings[idx],
      source,
      hot: 8000000 - i * 500000,
      tag: i === 0 ? "本月" : i === 1 ? "新" : undefined,
    });
  }
  // 平台基线池也按 seed 做小偏移，使刷新生效（保持相对顺序）
  const baseOffset = Math.abs((seed * 11 + 7)) % Math.max(1, cleaned.length);
  const rotatedBase = cleaned.length > 0
    ? [...cleaned.slice(baseOffset), ...cleaned.slice(0, baseOffset)]
    : cleaned;
  return [...monthly, ...rotatedBase].slice(0, 14);
}

// === 每平台调性 ===
// 抖音：短视频 / 探店 / 挑战 / 情绪
// 头条 / 百度：新闻 / 健康 / 节气 / 价格
// 微博：明星 / 综艺 / 节日 / 轻社交
// 知乎：知识 / 决策 / 健康
// B 站：长视频 / 纪录片 / 教程 / 测评
function platformPhrase(source: HotSource, food: string, kind: "food" | "life" | "ent" | "travel"): string {
  switch (source) {
    case "douyin":
      if (kind === "food") return `#${food.replace(/[？?]/g, "")}# 短视频教程刷屏`;
      if (kind === "life") return `${food} | 抖音情绪话题`;
      if (kind === "ent") return `${food} 同款挑战 #翻拍达人`;
      return `${food} 打卡片段刷爆`;
    case "toutiao":
      if (kind === "food") return `${food} | 营养专家这样说`;
      if (kind === "life") return `${food} 调查：超 7 成人这样选`;
      if (kind === "ent") return `${food} 票房 / 收视速递`;
      return `${food}：本周价格 / 客流速报`;
    case "baidu":
      if (kind === "food") return `${food} 怎么做 百度知道高赞`;
      if (kind === "life") return `${food} 全攻略`;
      if (kind === "ent") return `${food} 详解`;
      return `${food} 路线图`;
    case "weibo":
      if (kind === "food") return `${food} #餐桌话题#`;
      if (kind === "life") return `${food} 你怎么看`;
      if (kind === "ent") return `${food} 微博热议`;
      return `${food} 同行打卡`;
    case "bilibili":
      if (kind === "food") return `${food}【美食区 UP 教程】`;
      if (kind === "life") return `${food}｜生活区 vlog`;
      if (kind === "ent") return `${food} 高燃剪辑`;
      return `${food} 沉浸式 vlog`;
    case "zhihu":
      if (kind === "food") return `如何评价：${food}`;
      if (kind === "life") return `${food}：值不值得？`;
      if (kind === "ent") return `如何看待 ${food}`;
      return `${food}：详细体验报告`;
  }
  return food;
}

function monthlyTopicsForPlatform(theme: MonthTheme, source: HotSource): string[] {
  const out: string[] = [];
  for (const f of theme.food) out.push(platformPhrase(source, f, "food"));
  for (const f of theme.life) out.push(platformPhrase(source, f, "life"));
  for (const f of theme.entertainment) out.push(platformPhrase(source, f, "ent"));
  for (const f of theme.travel) out.push(platformPhrase(source, f, "travel"));
  return out;
}

// ====== 静态 fallback 数据：API 失败 / 离线 / 没有 CORS 时仍展示 ======
// 注意：本数据是「全年通用 + 月份候选」基线。loadSource 会用 currentMonth() 重排，
// 让用户在 5 月看到的话题确实是 5 月相关，而不是某个写定的月份。
// 每个平台都故意保留 1-2 条会被屏蔽的话题（争议/事故/案件/冲突），
// 这样关闭屏蔽开关时能看到条目数明显增加，开启时能看到「已屏蔽 X 条」。
export const STATIC_FALLBACK: Record<HotSource, HotItem[]> = {
  weibo: [
    { id: "fb-w-1", title: "今天最适合喝什么奶茶", source: "weibo", hot: 9800000, tag: "热" },
    { id: "fb-w-2", title: "周末 City Walk 全攻略", source: "weibo", hot: 7600000 },
    { id: "fb-w-3", title: "国产新片本周速递", source: "weibo", hot: 5400000, tag: "🔥" },
    { id: "fb-w-4", title: "猫咪 home alone 表情合集", source: "weibo", hot: 3500000 },
    { id: "fb-w-5", title: "演唱会安可名场面合集", source: "weibo", hot: 5200000, tag: "沸" },
    { id: "fb-w-6", title: "城市烟火气最浓的 10 条小街", source: "weibo", hot: 6600000 },
    { id: "fb-w-7", title: "小说改剧年度爆款盘点", source: "weibo", hot: 8700000 },
    { id: "fb-w-8", title: "顶流明星家暴风波再起争议", source: "weibo", hot: 18800000, tag: "爆" },
    { id: "fb-w-9", title: "知名网红出轨塌房后续", source: "weibo", hot: 14500000 },
  ],
  baidu: [
    { id: "fb-b-1", title: "高德发布出游热度榜", source: "baidu", hot: 5400000 },
    { id: "fb-b-2", title: "今年最火的国产手机评测", source: "baidu", hot: 4800000 },
    { id: "fb-b-3", title: "AI 工具年度盘点", source: "baidu", hot: 3200000 },
    { id: "fb-b-4", title: "旅游 City Walk 攻略大全", source: "baidu", hot: 2900000 },
    { id: "fb-b-5", title: "本周新片票房榜 Top 10", source: "baidu", hot: 2700000 },
    { id: "fb-b-6", title: "宠物粮怎么选 兽医说真话", source: "baidu", hot: 1900000 },
    { id: "fb-b-7", title: "热门动漫新番更新表", source: "baidu", hot: 2100000 },
    { id: "fb-b-8", title: "国产剧情片影评 豆瓣高分新作", source: "baidu", hot: 1500000 },
    { id: "fb-b-9", title: "新能源车续航实测对比", source: "baidu", hot: 2600000 },
    { id: "fb-b-10", title: "电信诈骗最新套路警示", source: "baidu", hot: 3300000 },
  ],
  douyin: [
    { id: "fb-d-1", title: "抖音餐饮探店周榜", source: "douyin", hot: 12300000, tag: "🔥" },
    { id: "fb-d-2", title: "舞蹈翻跳王者挑战", source: "douyin", hot: 8800000 },
    { id: "fb-d-3", title: "10 秒美食教程合集", source: "douyin", hot: 7700000 },
    { id: "fb-d-4", title: "猫狗治愈视频精选", source: "douyin", hot: 6500000 },
    { id: "fb-d-5", title: "周末旅行打卡灵感", source: "douyin", hot: 4900000 },
    { id: "fb-d-6", title: "穿搭好物分享", source: "douyin", hot: 4300000 },
    { id: "fb-d-7", title: "百万粉丝厨师教你做家常菜", source: "douyin", hot: 9100000, tag: "新" },
    { id: "fb-d-8", title: "城市夜景延时摄影合集", source: "douyin", hot: 3600000 },
    { id: "fb-d-9", title: "最近爆火的解压短剧", source: "douyin", hot: 5800000 },
    { id: "fb-d-10", title: "网红打架冲突视频疯传", source: "douyin", hot: 11000000 },
  ],
  zhihu: [
    { id: "fb-z-1", title: "如何挑选适合自己的咖啡豆", source: "zhihu", hot: 980000 },
    { id: "fb-z-2", title: "适合居家锻炼的 5 个动作", source: "zhihu", hot: 770000 },
    { id: "fb-z-3", title: "冷门但好用的 App 推荐", source: "zhihu", hot: 1300000 },
    { id: "fb-z-4", title: "最近一年最值得读的书单", source: "zhihu", hot: 1100000 },
    { id: "fb-z-5", title: "如何提高睡眠质量", source: "zhihu", hot: 880000 },
    { id: "fb-z-6", title: "如何在家煮一杯好喝的奶茶", source: "zhihu", hot: 660000 },
    { id: "fb-z-7", title: "30 岁后该不该转行 求职指南", source: "zhihu", hot: 1450000, tag: "新" },
    { id: "fb-z-8", title: "猫为什么半夜跑酷 行为学解读", source: "zhihu", hot: 920000 },
    { id: "fb-z-9", title: "刑事案件中目击证词为何不可靠", source: "zhihu", hot: 1320000 },
    { id: "fb-z-10", title: "如何看待最近这起命案的判决争议", source: "zhihu", hot: 2800000 },
  ],
  bilibili: [
    { id: "fb-bi-1", title: "新番推荐合集", source: "bilibili", hot: 5500000 },
    { id: "fb-bi-2", title: "纪录片新作《风味人间》第四季", source: "bilibili", hot: 4900000, tag: "新" },
    { id: "fb-bi-3", title: "国产 3A 游戏开箱实测", source: "bilibili", hot: 4100000 },
    { id: "fb-bi-4", title: "数码博主月度推荐", source: "bilibili", hot: 3700000 },
    { id: "fb-bi-5", title: "Vlog 挑战 7 天极简生活", source: "bilibili", hot: 2800000 },
    { id: "fb-bi-6", title: "鬼畜全明星新作上线", source: "bilibili", hot: 6200000, tag: "🔥" },
    { id: "fb-bi-7", title: "深夜美食 ASMR 治愈合集", source: "bilibili", hot: 3300000 },
    { id: "fb-bi-8", title: "学习区 100 天打卡挑战", source: "bilibili", hot: 2400000 },
    { id: "fb-bi-9", title: "国漫《雾山五行》第二季前瞻", source: "bilibili", hot: 5100000 },
    { id: "fb-bi-10", title: "校园暴力题材动画引发争议", source: "bilibili", hot: 4600000 },
  ],
  toutiao: [
    { id: "fb-t-1", title: "出游热门城市榜", source: "toutiao", hot: 1980000 },
    { id: "fb-t-2", title: "iPhone 新机首批评测", source: "toutiao", hot: 1660000 },
    { id: "fb-t-3", title: "小米汽车 SU7 详细评测", source: "toutiao", hot: 1450000 },
    { id: "fb-t-4", title: "新茶饮品牌融资盘点", source: "toutiao", hot: 1180000 },
    { id: "fb-t-5", title: "A 股周末重磅消息回顾", source: "toutiao", hot: 2240000, tag: "新" },
    { id: "fb-t-6", title: "猪肉价格连续三周下跌", source: "toutiao", hot: 970000 },
    { id: "fb-t-7", title: "央视《舌尖上的中国》新季", source: "toutiao", hot: 2100000, tag: "🔥" },
    { id: "fb-t-8", title: "中东冲突局势再度升级", source: "toutiao", hot: 4800000 },
    { id: "fb-t-9", title: "煤矿事故矿难调查最新进展", source: "toutiao", hot: 3300000 },
  ],
};

// ====== 实时拉取 ======
// 这里使用 imsyy 的公开热点 API（多次镜像）。任何端点失败 → 下个 → 静态 fallback。
// 注意：免费公开端点不保证可用性 / CORS；UI 必须能在任何情况下正常渲染。
const HOT_API_BASES = [
  "https://api-hot.imsyy.top/",
  "https://api-hot.efefee.cn/",
  "https://hot-api.vercel.app/",
];

const SOURCE_PATH: Record<HotSource, string> = {
  weibo: "weibo",
  baidu: "baidu",
  douyin: "douyin",
  zhihu: "zhihu",
  bilibili: "bilibili",
  toutiao: "toutiao",
};

/** 拉取单源；失败抛错由调用方降级。 */
async function fetchOneSource(source: HotSource, base: string, timeoutMs = 4000): Promise<HotItem[]> {
  const path = SOURCE_PATH[source];
  const url = `${base.replace(/\/$/, "")}/${path}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const arr: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
    if (!arr.length) throw new Error("empty");
    return arr.slice(0, 12).map((it, i) => ({
      id: `${source}-${(it.id ?? it.title ?? i).toString().slice(0, 64)}`,
      title: String(it.title ?? it.desc ?? "").trim(),
      source,
      hot: typeof it.hot === "number" ? it.hot : typeof it.hot_score === "number" ? it.hot_score : undefined,
      tag: it.tag || it.icon || undefined,
      url: it.mobil_url || it.mobileUrl || it.url || it.link,
    })).filter((x) => x.title.length > 0);
  } finally {
    clearTimeout(t);
  }
}

/** 拉取一个 source；任意 base 成功就返回。
 *  fallback 路径会按当前月份 rotateForCurrentMonth：把当前月份的话题放在最前几条，
 *  并过滤掉明显属于其它月份的话题（避免 5 月看到 10 月内容）。
 *  v8: 接受 seed 参数；fallback 路径会按 seed 做平台调性 + 内容轮换，刷新可换。
 */
export async function loadSource(
  source: HotSource,
  options?: { seed?: number; offline?: boolean },
): Promise<{ items: HotItem[]; live: boolean; error?: string }> {
  const seed = options?.seed ?? 0;
  let lastErr: unknown = undefined;
  if (!options?.offline) {
    for (const base of HOT_API_BASES) {
      try {
        const items = await fetchOneSource(source, base);
        return { items: decorate(items), live: true };
      } catch (e) {
        lastErr = e;
      }
    }
  }
  // 全 fail，使用静态 + 月份 rotate（按平台调性 + seed）
  const base = STATIC_FALLBACK[source] || [];
  const rotated = rotateForCurrentMonth(base, 4, seed);
  const items = decorate(rotated);
  return {
    items,
    live: false,
    error: lastErr instanceof Error ? lastErr.message : "all sources failed",
  };
}

export function applySensitiveFilter(items: HotItem[], blockSensitive: boolean): HotItem[] {
  if (!blockSensitive) return items;
  return items.filter((it) => !it.flagged);
}

export function searchUrlFor(item: HotItem): string {
  if (item.url) return item.url;
  return HOT_SOURCE_META[item.source].baseSearch(item.title);
}

export function baiduUrlFor(item: HotItem): string {
  return HOT_SOURCE_META.baidu.baseSearch(item.title);
}

const SETTINGS_KEY = "chishenme.hotboard.v1";

export interface HotBoardSettings {
  blockSensitive: boolean;
  source: HotSource;
}

const DEFAULT_SETTINGS: HotBoardSettings = {
  blockSensitive: true,
  source: "weibo",
};

export function loadHotBoardSettings(): HotBoardSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      blockSensitive: typeof parsed.blockSensitive === "boolean" ? parsed.blockSensitive : true,
      source: (["weibo","baidu","douyin","zhihu","bilibili","toutiao"] as HotSource[]).includes(parsed.source) ? parsed.source : "weibo",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveHotBoardSettings(s: HotBoardSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

