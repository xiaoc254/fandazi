// 「饭桌陪伴」数据：边吃边看 / 边吃边聊 / 做饭背景音
// 内置数据，不依赖任何需要密钥的实时 API；外部链接均为搜索入口（豆瓣 / 平台 / 百度）。
//
// 设计原则：
// - 不强行用性别决定推荐；性别只作可选偏好。
// - 家庭聚餐 / 儿童 / 长辈 优先合家欢、轻松、低争议内容。
// - 话题避免政治、宗教、地域攻击、过深隐私、医疗诊断等高争议或敏感方向。

export type WatchType = "电影" | "电视剧" | "综艺" | "纪录片" | "动画";
export type AudienceTag =
  | "单人"
  | "双人"
  | "情侣"
  | "朋友"
  | "全家"
  | "儿童友好"
  | "长辈友好";
export type WatchMood =
  | "轻松"
  | "下饭"
  | "解压"
  | "温馨"
  | "搞笑"
  | "悬疑"
  | "热血"
  | "怀旧"
  | "知识"
  | "美食";

export interface SearchLink {
  label: string;
  /** 用 {q} 占位，运行时替换为编码后的关键词 */
  template: string;
}

const VIDEO_SEARCHES: SearchLink[] = [
  { label: "豆瓣", template: "https://search.douban.com/movie/subject_search?search_text={q}" },
  { label: "腾讯视频", template: "https://v.qq.com/x/search/?q={q}" },
  { label: "爱奇艺", template: "https://so.iqiyi.com/so/q_{q}" },
  { label: "Bilibili", template: "https://search.bilibili.com/all?keyword={q}" },
  { label: "百度", template: "https://www.baidu.com/s?wd={q}" },
];

const AUDIO_SEARCHES: SearchLink[] = [
  { label: "喜马拉雅", template: "https://www.ximalaya.com/search/{q}" },
  { label: "微信读书", template: "https://weread.qq.com/web/search/global?keyword={q}" },
  { label: "网易云", template: "https://music.163.com/#/search/m/?s={q}&type=1000" },
  { label: "小宇宙", template: "https://www.xiaoyuzhoufm.com/search?q={q}" },
  { label: "百度", template: "https://www.baidu.com/s?wd={q}" },
];

export interface WatchItem {
  id: string;
  title: string;
  type: WatchType;
  /** 一句话推荐理由 */
  why: string;
  /** 心情 / 标签 */
  moods: WatchMood[];
  /** 适合谁看（任一命中即可） */
  audiences: AudienceTag[];
  /** 适合的年龄区间（包含上下限），其它年龄不会被排除，只是不优先 */
  ageMin?: number;
  ageMax?: number;
  /** 单集 / 单部时长（分钟），仅作展示参考 */
  duration?: string;
  /** 是否为合家欢 / 适合家庭聚餐 */
  familyFriendly?: boolean;
  /** 是否儿童安全（无暴力 / 恐怖 / 大尺度） */
  kidSafe?: boolean;
  /** 是否长辈友好 */
  elderFriendly?: boolean;
}

export interface TopicItem {
  id: string;
  text: string;
  /** 标签：轻松开场 / 深聊一点 / 适合全家 / 避免争议 */
  tags: ("轻松开场" | "深聊一点" | "适合全家" | "避免争议" | "亲子" | "回忆" | "美食" | "旅行" | "工作" | "兴趣")[];
  /** 适合谁聊 */
  audiences: AudienceTag[];
  /** 是否儿童 / 长辈安全 */
  familyFriendly?: boolean;
  kidSafe?: boolean;
  elderFriendly?: boolean;
}

export type AudioType = "有声书" | "播客" | "故事" | "知识" | "助眠" | "音乐";

export interface AudioItem {
  id: string;
  title: string;
  type: AudioType;
  why: string;
  /** 适合多长时间的做饭场景：短=15-30 分钟，中=30-60，长=60+ */
  length: "短" | "中" | "长";
  audiences: AudienceTag[];
  /** 标签 */
  tags: ("故事" | "历史" | "人文" | "亲子" | "轻知识" | "助眠" | "做饭背景" | "悬疑" | "搞笑" | "情感")[];
  kidSafe?: boolean;
  elderFriendly?: boolean;
}

export function buildSearchLinks(query: string, kind: "video" | "audio"): { label: string; href: string }[] {
  const tpl = kind === "video" ? VIDEO_SEARCHES : AUDIO_SEARCHES;
  const q = encodeURIComponent(query);
  return tpl.map((s) => ({ label: s.label, href: s.template.replace("{q}", q) }));
}

// === 影视 / 综艺 / 纪录片 / 动画 ===
// 每条都是「公认低争议、合家欢友好」或「特定人群高匹配」的内容；
// 没有平台直链，只用搜索链接，避免外链失效。
export const WATCH_ITEMS: WatchItem[] = [
  // —— 合家欢电影 ——
  { id: "w1", title: "你好，李焕英", type: "电影", why: "母女温情代际共鸣，家庭聚餐最稳妥的选择。", moods: ["温馨", "轻松"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "128 分钟", ageMin: 8 },
  { id: "w2", title: "夏洛特烦恼", type: "电影", why: "笑点密集回忆杀，老中青都能笑出来。", moods: ["搞笑", "怀旧"], audiences: ["全家", "朋友", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "104 分钟", ageMin: 12 },
  { id: "w3", title: "飞驰人生 2", type: "电影", why: "热血又好笑，节奏很适合配晚饭。", moods: ["热血", "搞笑"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, duration: "99 分钟", ageMin: 12 },
  { id: "w4", title: "爱情神话", type: "电影", why: "上海中年群像生活流，慢节奏很下饭。", moods: ["温馨", "怀旧"], audiences: ["双人", "情侣", "朋友"], duration: "115 分钟", ageMin: 16 },
  { id: "w5", title: "瞬息全宇宙", type: "电影", why: "设定脑洞 + 母女和解，越吃越想看下去。", moods: ["搞笑", "温馨"], audiences: ["朋友", "情侣", "双人"], duration: "139 分钟", ageMin: 16 },
  { id: "w6", title: "心灵奇旅", type: "电影", why: "皮克斯治愈系，配晚饭看温柔又有点深度。", moods: ["温馨", "知识"], audiences: ["全家", "情侣", "单人"], familyFriendly: true, kidSafe: true, duration: "100 分钟", ageMin: 6 },
  { id: "w7", title: "千与千寻", type: "电影", why: "宫崎骏全年龄经典，全家都看过都还想再看。", moods: ["温馨", "怀旧"], audiences: ["全家", "儿童友好", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true, duration: "125 分钟", ageMin: 5 },
  { id: "w8", title: "龙猫", type: "电影", why: "最适合一家人吃晚饭看的动画，几乎零冲突。", moods: ["温馨"], audiences: ["全家", "儿童友好", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true, duration: "86 分钟", ageMin: 3 },
  { id: "w9", title: "寻梦环游记", type: "电影", why: "家人题材 + 音乐元素，一家人吃饭很容易共鸣。", moods: ["温馨", "怀旧"], audiences: ["全家", "儿童友好", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true, duration: "105 分钟", ageMin: 6 },
  { id: "w10", title: "疯狂动物城", type: "电影", why: "节奏快、笑点稳，孩子大人各有各的乐子。", moods: ["搞笑", "热血"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, duration: "108 分钟", ageMin: 6 },

  // —— 电视剧 / 长剧 ——
  { id: "w11", title: "请回答 1988", type: "电视剧", why: "首尔胡同里的家庭群像，温柔到下饭。", moods: ["温馨", "怀旧"], audiences: ["全家", "情侣", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "约 90 分钟/集", ageMin: 12 },
  { id: "w12", title: "庆余年", type: "电视剧", why: "权谋 + 喜剧节奏，男女老少都能追。", moods: ["搞笑", "热血"], audiences: ["全家", "朋友"], familyFriendly: true, duration: "45 分钟/集", ageMin: 14 },
  { id: "w13", title: "甄嬛传", type: "电视剧", why: "看一集吃一顿饭，国民级下饭剧。", moods: ["下饭", "怀旧"], audiences: ["全家", "长辈友好", "单人"], familyFriendly: true, elderFriendly: true, duration: "45 分钟/集", ageMin: 14 },
  { id: "w14", title: "三十而已", type: "电视剧", why: "都市女性日常，朋友姐妹一起吃聊天最合适。", moods: ["下饭"], audiences: ["朋友", "双人", "单人"], duration: "45 分钟/集", ageMin: 18 },
  { id: "w15", title: "山海情", type: "电视剧", why: "扶贫年代戏，节奏不沉重，长辈和年轻人都能看。", moods: ["温馨", "怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "45 分钟/集", ageMin: 12 },
  { id: "w16", title: "繁花", type: "电视剧", why: "九十年代上海风味，慢慢吃慢慢看刚刚好。", moods: ["怀旧"], audiences: ["双人", "情侣", "长辈友好"], duration: "45 分钟/集", ageMin: 18 },
  { id: "w17", title: "去有风的地方", type: "电视剧", why: "云南治愈风物剧,看完想立刻去旅游。", moods: ["温馨"], audiences: ["全家", "情侣", "单人"], familyFriendly: true, elderFriendly: true, duration: "45 分钟/集", ageMin: 12 },
  { id: "w18", title: "我的事说来话长", type: "电视剧", why: "日剧家庭日常，节奏慢、台词暖。", moods: ["温馨"], audiences: ["全家", "单人"], familyFriendly: true, duration: "45 分钟/集", ageMin: 14 },
  { id: "w19", title: "孤独的美食家", type: "电视剧", why: "吃饭看吃饭，绝对不会盖过你的饭。", moods: ["美食", "下饭"], audiences: ["单人", "双人", "情侣"], duration: "25 分钟/集", ageMin: 12 },
  { id: "w20", title: "深夜食堂(日版)", type: "电视剧", why: "一集一菜一故事，温吞但很饱足。", moods: ["美食", "温馨"], audiences: ["单人", "双人", "长辈友好"], elderFriendly: true, duration: "25 分钟/集", ageMin: 14 },

  // —— 综艺 ——
  { id: "w21", title: "向往的生活", type: "综艺", why: "蘑菇屋下饭综艺标杆，长辈也爱看。", moods: ["温馨", "美食"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "90 分钟/期", ageMin: 8 },
  { id: "w22", title: "中餐厅", type: "综艺", why: "吃饭时再看吃饭综艺，馋上加馋。", moods: ["美食", "轻松"], audiences: ["全家", "朋友"], familyFriendly: true, duration: "90 分钟/期", ageMin: 8 },
  { id: "w23", title: "极限挑战", type: "综艺", why: "兄弟团高能笑点,合家欢综艺。", moods: ["搞笑"], audiences: ["全家", "朋友"], familyFriendly: true, duration: "90 分钟/期", ageMin: 10 },
  { id: "w24", title: "奔跑吧", type: "综艺", why: "不烧脑笑点稳，小孩也能跟着乐。", moods: ["搞笑"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, duration: "90 分钟/期", ageMin: 8 },
  { id: "w25", title: "脱口秀大会", type: "综艺", why: "段子一波接一波，朋友聚餐绝佳。", moods: ["搞笑"], audiences: ["朋友", "情侣", "单人"], duration: "90 分钟/期", ageMin: 16 },
  { id: "w26", title: "奇葩说", type: "综艺", why: "辩题轻巧但有思考，能聊起来的综艺。", moods: ["知识", "搞笑"], audiences: ["朋友", "情侣"], duration: "90 分钟/期", ageMin: 16 },
  { id: "w27", title: "声生不息", type: "综艺", why: "经典老歌音乐综艺，长辈听了亲切。", moods: ["怀旧", "温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "90 分钟/期", ageMin: 8 },
  { id: "w28", title: "百分百出品", type: "综艺", why: "美食制作综艺，做饭爱好者会喜欢。", moods: ["美食", "知识"], audiences: ["双人", "单人"], duration: "60 分钟/期", ageMin: 12 },
  { id: "w29", title: "你好星期六", type: "综艺", why: "周末感强、嘉宾杂、不烧脑。", moods: ["轻松", "搞笑"], audiences: ["全家", "朋友"], familyFriendly: true, duration: "120 分钟/期", ageMin: 8 },

  // —— 纪录片 ——
  { id: "w30", title: "舌尖上的中国", type: "纪录片", why: "看着别人做菜吃饭，比看剧还下饭。", moods: ["美食", "温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "50 分钟/集", ageMin: 6 },
  { id: "w31", title: "风味人间", type: "纪录片", why: "陈晓卿团队美食纪录片，画面治愈。", moods: ["美食", "知识"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "50 分钟/集", ageMin: 6 },
  { id: "w32", title: "人生一串", type: "纪录片", why: "市井烧烤纪录片，朋友夜宵绝配。", moods: ["美食", "轻松"], audiences: ["朋友", "双人"], duration: "30 分钟/集", ageMin: 14 },
  { id: "w33", title: "我在故宫修文物", type: "纪录片", why: "节奏慢、画面美，长辈孩子都不闹。", moods: ["知识", "温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, duration: "50 分钟/集", ageMin: 8 },
  { id: "w34", title: "蓝色星球 II", type: "纪录片", why: "BBC 海洋纪录片，画面安静孩子也看得住。", moods: ["知识", "温馨"], audiences: ["全家", "儿童友好", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true, duration: "50 分钟/集", ageMin: 5 },
  { id: "w35", title: "但是还有书籍", type: "纪录片", why: "关于书与读书人的小温暖纪录片。", moods: ["温馨", "知识"], audiences: ["单人", "双人"], duration: "30 分钟/集", ageMin: 14 },
  { id: "w36", title: "城市梦", type: "纪录片", why: "聚焦小人物的城市生活，安静但不沉闷。", moods: ["温馨", "知识"], audiences: ["单人", "双人"], duration: "100 分钟", ageMin: 16 },

  // —— 动画 / 儿童 ——
  { id: "w37", title: "蜡笔小新", type: "动画", why: "经典合家欢动画，剧场版尤其温馨。", moods: ["搞笑", "温馨"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, duration: "25 分钟/集", ageMin: 6 },
  { id: "w38", title: "灌篮高手", type: "动画", why: "热血回忆杀，朋友一起看会嗨。", moods: ["热血", "怀旧"], audiences: ["朋友", "情侣"], duration: "25 分钟/集", ageMin: 10 },
  { id: "w39", title: "海绵宝宝", type: "动画", why: "全年龄无脑欢乐，孩子吃饭最配。", moods: ["搞笑"], audiences: ["儿童友好", "全家"], familyFriendly: true, kidSafe: true, duration: "11 分钟/集", ageMin: 4 },
  { id: "w40", title: "小猪佩奇", type: "动画", why: "2-6 岁孩子最爱，家庭氛围安全。", moods: ["温馨"], audiences: ["儿童友好", "全家"], familyFriendly: true, kidSafe: true, duration: "5 分钟/集", ageMin: 2 },
  { id: "w41", title: "中国奇谭", type: "动画", why: "国风短篇动画合集，画风惊艳。", moods: ["温馨", "知识"], audiences: ["全家", "情侣"], familyFriendly: true, duration: "20 分钟/集", ageMin: 10 },
  { id: "w42", title: "雾山五行", type: "动画", why: "国漫战斗番,画面华丽,朋友一起看刺激。", moods: ["热血"], audiences: ["朋友", "单人"], duration: "25 分钟/集", ageMin: 14 },

  // —— 单人 / 双人氛围向 ——
  { id: "w43", title: "请回答 1997", type: "电视剧", why: "更短的请回答系列，单人也能慢慢嚼。", moods: ["怀旧", "温馨"], audiences: ["单人", "双人", "情侣"], duration: "60 分钟/集", ageMin: 14 },
  { id: "w44", title: "凪的新生活", type: "电视剧", why: "一个人的治愈日剧，独居晚饭刚好。", moods: ["温馨"], audiences: ["单人", "双人"], duration: "45 分钟/集", ageMin: 18 },
  { id: "w45", title: "小森林 夏秋/冬春", type: "电影", why: "做饭吃饭的电影，看着自己也想做点什么。", moods: ["美食", "温馨"], audiences: ["单人", "双人", "情侣"], duration: "115 分钟", ageMin: 12 },
  ...buildExtraWatchItems(),
];

// v2: 200+ 影视池 — 续接经典片单 + 新片，追求覆盖广，文案稳。
function buildExtraWatchItems(): WatchItem[] {
  const tpls: { title: string; type: WatchType; why: string; moods: WatchMood[]; audiences: AudienceTag[]; duration?: string; ageMin?: number; familyFriendly?: boolean; kidSafe?: boolean; elderFriendly?: boolean }[] = [
    { title: "灌篮高手 The First Slam Dunk", type: "电影", why: "热血回忆杀剧场版，朋友一起看。", moods: ["热血", "怀旧"], audiences: ["朋友", "情侣"], duration: "124 分钟", ageMin: 10 },
    { title: "蜘蛛侠：纵横宇宙", type: "电影", why: "画风炸裂的动画大片，全家都能看。", moods: ["热血", "温馨"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 8 },
    { title: "封神第一部", type: "电影", why: "国产神话史诗，画面够震撼。", moods: ["热血"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 12 },
    { title: "孤注一掷", type: "电影", why: "悬疑节奏紧凑下饭。", moods: ["悬疑"], audiences: ["朋友", "双人"], ageMin: 16 },
    { title: "消失的她", type: "电影", why: "悬疑反转，朋友一起看。", moods: ["悬疑"], audiences: ["朋友", "情侣"], ageMin: 16 },
    { title: "我不是药神", type: "电影", why: "现实题材引发共鸣，慎重氛围下饭也行。", moods: ["温馨"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 14 },
    { title: "哪吒之魔童降世", type: "电影", why: "国漫顶流，全家欢。", moods: ["热血"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 8 },
    { title: "长安三万里", type: "电影", why: "国漫诗词盛宴，长辈孩子都喜欢。", moods: ["温馨", "怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 10 },
    { title: "深海", type: "电影", why: "国漫画面惊艳，配晚饭看适合。", moods: ["温馨"], audiences: ["全家", "情侣"], familyFriendly: true, ageMin: 10 },
    { title: "雄狮少年", type: "电影", why: "国漫励志，下饭。", moods: ["热血", "温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 8 },
    { title: "我和我的家乡", type: "电影", why: "拼盘喜剧家国情怀，长辈喜欢。", moods: ["温馨", "搞笑"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "金刚川", type: "电影", why: "战争题材剧情紧凑。", moods: ["热血"], audiences: ["朋友", "长辈友好"], elderFriendly: true, ageMin: 14 },
    { title: "长津湖", type: "电影", why: "大场面战争片。", moods: ["热血"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 12 },
    { title: "唐人街探案 1/2/3", type: "电影", why: "悬疑喜剧，节奏快。", moods: ["搞笑", "悬疑"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 12 },
    { title: "无名之辈", type: "电影", why: "黑色喜剧群像，朋友看。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "误杀", type: "电影", why: "悬疑反转，下饭。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 16 },
    { title: "天空之城", type: "电影", why: "宫崎骏经典，温馨合家欢。", moods: ["温馨", "怀旧"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "魔女宅急便", type: "电影", why: "宫崎骏温柔系，孩子最爱。", moods: ["温馨"], audiences: ["儿童友好", "全家"], familyFriendly: true, kidSafe: true, ageMin: 5 },
    { title: "哈尔的移动城堡", type: "电影", why: "经典宫崎骏。", moods: ["温馨"], audiences: ["全家", "情侣"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "起风了", type: "电影", why: "宫崎骏成人向，节奏慢。", moods: ["温馨", "怀旧"], audiences: ["双人", "情侣"], ageMin: 14 },
    { title: "悬崖上的金鱼姬", type: "电影", why: "宫崎骏小孩向，温柔可爱。", moods: ["温馨"], audiences: ["儿童友好", "全家"], familyFriendly: true, kidSafe: true, ageMin: 4 },
    { title: "你的名字。", type: "电影", why: "新海诚画面美，年轻情侣。", moods: ["温馨", "怀旧"], audiences: ["情侣", "朋友"], ageMin: 12 },
    { title: "天气之子", type: "电影", why: "新海诚画面美。", moods: ["温馨"], audiences: ["情侣", "朋友"], ageMin: 12 },
    { title: "铃芽之旅", type: "电影", why: "新海诚最新作。", moods: ["温馨"], audiences: ["情侣", "朋友"], ageMin: 12 },
    { title: "蓝色大门", type: "电影", why: "台湾青春片经典。", moods: ["怀旧"], audiences: ["朋友", "情侣"], ageMin: 16 },
    { title: "蓝色生死恋", type: "电视剧", why: "韩剧情感旧式经典，长辈看。", moods: ["温馨", "怀旧"], audiences: ["长辈友好"], elderFriendly: true, ageMin: 14 },
    { title: "想见你", type: "电视剧", why: "悬疑爱情台剧，年轻人爱。", moods: ["悬疑", "温馨"], audiences: ["情侣", "朋友"], ageMin: 16 },
    { title: "都挺好", type: "电视剧", why: "国民家庭剧。", moods: ["下饭"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 14 },
    { title: "知否知否应是绿肥红瘦", type: "电视剧", why: "古装家长里短，下饭。", moods: ["怀旧", "下饭"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 12 },
    { title: "如懿传", type: "电视剧", why: "宫斗剧，下饭。", moods: ["下饭"], audiences: ["单人", "双人"], ageMin: 14 },
    { title: "琅琊榜", type: "电视剧", why: "国民古装权谋。", moods: ["热血"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 14 },
    { title: "白夜追凶", type: "电视剧", why: "悬疑国剧标杆。", moods: ["悬疑"], audiences: ["朋友", "单人"], ageMin: 16 },
    { title: "隐秘的角落", type: "电视剧", why: "国产悬疑王者。", moods: ["悬疑"], audiences: ["朋友", "单人"], ageMin: 18 },
    { title: "沉默的真相", type: "电视剧", why: "迷雾剧场出品。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 18 },
    { title: "漫长的季节", type: "电视剧", why: "好评悬疑年代戏。", moods: ["悬疑", "怀旧"], audiences: ["朋友", "双人"], ageMin: 18 },
    { title: "狂飙", type: "电视剧", why: "近年最热年代剧。", moods: ["悬疑"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 16 },
    { title: "三体", type: "电视剧", why: "国产硬科幻剧。", moods: ["热血", "知识"], audiences: ["朋友", "情侣"], ageMin: 14 },
    { title: "流浪地球 1/2", type: "电影", why: "国产科幻里程碑。", moods: ["热血"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 12 },
    { title: "我的天才女友 (HBO)", type: "电视剧", why: "意大利文艺女性史诗。", moods: ["温馨"], audiences: ["双人", "情侣"], ageMin: 18 },
    { title: "鱿鱼游戏", type: "电视剧", why: "韩剧悬疑，朋友。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 18 },
    { title: "黑镜 (英剧)", type: "电视剧", why: "科幻反乌托邦短篇。", moods: ["悬疑", "知识"], audiences: ["朋友", "单人"], ageMin: 18 },
    { title: "纸钞屋", type: "电视剧", why: "西班牙悬疑爽剧。", moods: ["悬疑", "热血"], audiences: ["朋友"], ageMin: 18 },
    { title: "西部世界 (HBO)", type: "电视剧", why: "美剧科幻经典。", moods: ["悬疑", "知识"], audiences: ["朋友"], ageMin: 18 },
    { title: "冰血暴", type: "电视剧", why: "美剧黑色幽默。", moods: ["悬疑", "搞笑"], audiences: ["朋友", "情侣"], ageMin: 18 },
    { title: "怪奇物语", type: "电视剧", why: "美剧科幻儿童冒险。", moods: ["热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "傲骨贤妻", type: "电视剧", why: "律政剧女性主角。", moods: ["下饭"], audiences: ["双人", "单人"], ageMin: 18 },
    { title: "豪斯医生", type: "电视剧", why: "医疗剧高智商。", moods: ["下饭", "知识"], audiences: ["单人", "双人"], ageMin: 16 },
    { title: "老友记", type: "电视剧", why: "国民经典美剧。", moods: ["搞笑", "怀旧"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 14 },
    { title: "生活大爆炸", type: "电视剧", why: "geek 系喜剧。", moods: ["搞笑"], audiences: ["朋友", "情侣"], ageMin: 14 },
    { title: "硅谷", type: "电视剧", why: "创业题材黑色喜剧。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "大爆炸理论 续：少年谢尔顿", type: "电视剧", why: "续作温馨家庭。", moods: ["温馨", "搞笑"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "良医", type: "电视剧", why: "医疗剧温情。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 14 },
    { title: "破产姐妹", type: "电视剧", why: "美式情景喜剧。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "我们这一天", type: "电视剧", why: "美剧温情家庭。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 14 },
    { title: "纸房子家族", type: "电视剧", why: "西班牙剧续作。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 18 },
    { title: "传奇办公室", type: "电视剧", why: "法剧间谍剧。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 18 },
    { title: "今晚不开车", type: "电视剧", why: "情景搞笑短剧。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 14 },
    { title: "孤独的美食家 第十季", type: "电视剧", why: "美食日剧续作。", moods: ["美食"], audiences: ["单人", "双人"], ageMin: 12 },
    { title: "深夜食堂 (中国版)", type: "电视剧", why: "国版深夜食堂。", moods: ["美食"], audiences: ["单人", "双人"], ageMin: 14 },
    { title: "舌尖上的中国 第三季", type: "纪录片", why: "美食纪录片续作。", moods: ["美食"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "风味原产地系列", type: "纪录片", why: "聚焦食材产地。", moods: ["美食"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "宵夜江湖", type: "纪录片", why: "晚饭夜宵纪录片。", moods: ["美食"], audiences: ["朋友"], ageMin: 14 },
    { title: "早餐中国", type: "纪录片", why: "短小早餐纪录片。", moods: ["美食"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "奶奶最懂", type: "纪录片", why: "家常美食纪录片。", moods: ["美食", "温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "圆桌派", type: "综艺", why: "智识谈话节目。", moods: ["知识"], audiences: ["双人", "朋友"], ageMin: 16 },
    { title: "锵锵行天下", type: "综艺", why: "窦文涛旅行谈话。", moods: ["知识"], audiences: ["双人", "朋友"], ageMin: 16 },
    { title: "鲁豫有约", type: "综艺", why: "经典名人访谈。", moods: ["怀旧"], audiences: ["长辈友好"], elderFriendly: true, ageMin: 14 },
    { title: "向往的生活 第七季", type: "综艺", why: "向往续作。", moods: ["温馨", "美食"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "中餐厅 第七季", type: "综艺", why: "中餐厅续作。", moods: ["美食"], audiences: ["全家", "朋友"], familyFriendly: true, ageMin: 8 },
    { title: "披荆斩棘的哥哥", type: "综艺", why: "音乐综艺。", moods: ["怀旧"], audiences: ["全家", "情侣"], familyFriendly: true, ageMin: 10 },
    { title: "乘风破浪", type: "综艺", why: "姐姐音乐综艺。", moods: ["热血", "怀旧"], audiences: ["全家", "情侣"], familyFriendly: true, ageMin: 10 },
    { title: "天天向上", type: "综艺", why: "经典娱乐综艺。", moods: ["搞笑"], audiences: ["全家"], familyFriendly: true, ageMin: 8 },
    { title: "我是歌手 / 歌手 (历年)", type: "综艺", why: "歌唱比赛经典。", moods: ["怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "中国好声音", type: "综艺", why: "音乐综艺。", moods: ["怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "姐姐的爱乐之程", type: "综艺", why: "明星旅行音乐节目。", moods: ["温馨"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 12 },
    { title: "种地吧 少年篇", type: "综艺", why: "慢综艺接地气。", moods: ["温馨"], audiences: ["全家", "情侣"], familyFriendly: true, ageMin: 10 },
    { title: "桃花坞", type: "综艺", why: "明星合宿。", moods: ["搞笑"], audiences: ["朋友", "情侣"], ageMin: 14 },
    { title: "极挑兄弟团 续", type: "综艺", why: "极挑续作。", moods: ["搞笑"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "百分百出品 续季", type: "综艺", why: "美食制作续。", moods: ["美食"], audiences: ["双人"], ageMin: 14 },
    { title: "听说很好吃", type: "综艺", why: "美食综艺。", moods: ["美食"], audiences: ["朋友"], ageMin: 14 },
    { title: "脱口秀大会 第六季", type: "综艺", why: "脱口秀续作。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "喜剧之王单口季", type: "综艺", why: "脱口秀新综艺。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "一年一度喜剧大赛 续", type: "综艺", why: "喜剧综艺。", moods: ["搞笑"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 12 },
    { title: "了不起的女孩们", type: "综艺", why: "女性嘉宾对谈。", moods: ["温馨"], audiences: ["双人"], ageMin: 16 },
    { title: "快乐再出发", type: "综艺", why: "音乐慢综艺。", moods: ["温馨", "怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "圆桌派 第七季", type: "综艺", why: "圆桌续作。", moods: ["知识"], audiences: ["朋友"], ageMin: 16 },
    { title: "鬼灭之刃", type: "动画", why: "热门日漫，画面震撼。", moods: ["热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "进击的巨人", type: "动画", why: "顶级日漫战斗番。", moods: ["热血"], audiences: ["朋友"], ageMin: 16 },
    { title: "海贼王", type: "动画", why: "国民日漫长番。", moods: ["热血"], audiences: ["朋友"], ageMin: 12 },
    { title: "火影忍者", type: "动画", why: "经典日漫。", moods: ["热血", "怀旧"], audiences: ["朋友"], ageMin: 12 },
    { title: "灌篮高手 (经典动画)", type: "动画", why: "经典体育番。", moods: ["热血", "怀旧"], audiences: ["朋友"], ageMin: 10 },
    { title: "排球少年", type: "动画", why: "热血排球。", moods: ["热血"], audiences: ["朋友"], ageMin: 12 },
    { title: "斯坦福监狱实验", type: "纪录片", why: "心理学纪录片。", moods: ["知识"], audiences: ["单人", "双人"], ageMin: 18 },
    { title: "国家公园", type: "纪录片", why: "自然风光纪录片。", moods: ["知识", "温馨"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "地球脉动", type: "纪录片", why: "BBC 自然纪录片经典。", moods: ["知识", "温馨"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 5 },
    { title: "我们的星球", type: "纪录片", why: "BBC + Netflix 出品。", moods: ["知识"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 5 },
    { title: "宇宙时空之旅", type: "纪录片", why: "天文宇宙纪录片。", moods: ["知识"], audiences: ["朋友", "情侣"], ageMin: 12 },
    { title: "故宫 100", type: "纪录片", why: "国产文化纪录片。", moods: ["知识", "温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "如果国宝会说话", type: "纪录片", why: "短小国宝故事。", moods: ["知识"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "敦煌", type: "纪录片", why: "壁画文化纪录片。", moods: ["知识"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 10 },
    { title: "极地", type: "纪录片", why: "西藏阿里地区纪录片。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "了不起的村庄", type: "纪录片", why: "国民乡村纪录片。", moods: ["温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "棒！少年", type: "纪录片", why: "棒球少年纪录片。", moods: ["热血"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "四个春天", type: "纪录片", why: "家庭温情纪录片。", moods: ["温馨"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 12 },
    { title: "棒棒糖", type: "动画", why: "短篇国漫。", moods: ["温馨"], audiences: ["儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 4 },
    { title: "京剧猫", type: "动画", why: "国漫低龄向。", moods: ["温馨"], audiences: ["儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 4 },
    { title: "熊出没系列", type: "动画", why: "国漫合家欢。", moods: ["搞笑"], audiences: ["儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 4 },
    { title: "喜羊羊与灰太狼", type: "动画", why: "国漫低龄。", moods: ["搞笑"], audiences: ["儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 4 },
    { title: "神奇宝贝(精灵宝可梦)", type: "动画", why: "童年回忆。", moods: ["热血", "怀旧"], audiences: ["全家"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "数码宝贝", type: "动画", why: "童年回忆。", moods: ["热血", "怀旧"], audiences: ["朋友"], ageMin: 8 },
    { title: "秦时明月", type: "动画", why: "国漫古风战斗。", moods: ["热血"], audiences: ["朋友"], ageMin: 10 },
    { title: "斗破苍穹 动画", type: "动画", why: "国漫玄幻。", moods: ["热血"], audiences: ["朋友"], ageMin: 12 },
    { title: "凡人修仙传", type: "动画", why: "国漫长番。", moods: ["热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "雪鹰领主", type: "动画", why: "国漫战斗番。", moods: ["热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "灵笼", type: "动画", why: "国漫科幻。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 14 },
    { title: "罗小黑战记", type: "动画", why: "国漫治愈。", moods: ["温馨"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "泡芙小姐", type: "动画", why: "国漫成人系。", moods: ["温馨"], audiences: ["双人"], ageMin: 16 },
    { title: "刺客伍六七", type: "动画", why: "国漫搞笑。", moods: ["搞笑", "热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "妖怪名单", type: "动画", why: "国漫搞笑。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 14 },
    { title: "时光代理人", type: "动画", why: "国漫悬疑。", moods: ["悬疑"], audiences: ["朋友"], ageMin: 14 },
    { title: "我才不会被女孩子欺负呢", type: "动画", why: "日番轻松向。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 14 },
    { title: "鬼灯的冷彻", type: "动画", why: "日漫职场。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 14 },
    { title: "工作细胞", type: "动画", why: "知识 + 热血。", moods: ["知识", "热血"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "佐贺偶像是传奇", type: "动画", why: "日番搞笑。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 12 },
    { title: "JoJo 的奇妙冒险", type: "动画", why: "经典战斗番。", moods: ["热血"], audiences: ["朋友"], ageMin: 14 },
    { title: "钢之炼金术师", type: "动画", why: "经典日漫。", moods: ["热血", "知识"], audiences: ["朋友"], ageMin: 12 },
    { title: "妙先生", type: "动画", why: "国漫文艺。", moods: ["温馨"], audiences: ["双人"], ageMin: 14 },
    { title: "新神榜：哪吒重生", type: "动画", why: "国漫续作。", moods: ["热血"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "白蛇 1/2", type: "动画", why: "国漫古风爱情。", moods: ["温馨"], audiences: ["情侣"], ageMin: 12 },
    { title: "杨戬", type: "动画", why: "国漫古风。", moods: ["热血"], audiences: ["全家"], familyFriendly: true, ageMin: 10 },
    { title: "小欢喜", type: "电视剧", why: "国民教育题材。", moods: ["下饭"], audiences: ["全家"], familyFriendly: true, elderFriendly: true, ageMin: 12 },
    { title: "小别离", type: "电视剧", why: "亲子题材。", moods: ["下饭"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "陪你一起长大", type: "电视剧", why: "亲子家庭剧。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "小敏家", type: "电视剧", why: "国剧家庭。", moods: ["下饭"], audiences: ["全家"], familyFriendly: true, ageMin: 14 },
    { title: "梦华录", type: "电视剧", why: "古装剧。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "卿卿日常", type: "电视剧", why: "古装轻喜剧。", moods: ["搞笑", "温馨"], audiences: ["朋友", "情侣"], ageMin: 12 },
    { title: "苍兰诀", type: "电视剧", why: "古装爱情。", moods: ["温馨"], audiences: ["情侣"], ageMin: 12 },
    { title: "陈情令", type: "电视剧", why: "古装爆款。", moods: ["热血"], audiences: ["朋友", "情侣"], ageMin: 14 },
    { title: "父辈的荣耀", type: "电视剧", why: "年代剧。", moods: ["怀旧"], audiences: ["长辈友好"], elderFriendly: true, ageMin: 12 },
    { title: "人世间", type: "电视剧", why: "年代家庭剧。", moods: ["怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 14 },
    { title: "大明宫词", type: "电视剧", why: "经典古装。", moods: ["怀旧"], audiences: ["长辈友好"], elderFriendly: true, ageMin: 14 },
    { title: "戏剧新生活", type: "综艺", why: "戏剧综艺。", moods: ["温馨"], audiences: ["双人"], ageMin: 14 },
    { title: "我们的歌", type: "综艺", why: "代际音乐综艺。", moods: ["怀旧"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true, ageMin: 8 },
    { title: "女儿们的恋爱", type: "综艺", why: "情感观察综艺。", moods: ["温馨"], audiences: ["双人"], ageMin: 16 },
    { title: "做家务的男人", type: "综艺", why: "家庭观察。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 12 },
    { title: "幸福三重奏", type: "综艺", why: "夫妻日常综艺。", moods: ["温馨"], audiences: ["情侣"], ageMin: 16 },
    { title: "婆婆和妈妈", type: "综艺", why: "代际综艺。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 14 },
    { title: "我家小两口", type: "综艺", why: "夫妻日常。", moods: ["温馨"], audiences: ["情侣"], ageMin: 14 },
    { title: "你好爸爸", type: "综艺", why: "亲子综艺。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "爸爸去哪儿", type: "综艺", why: "亲子户外综艺。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "妈妈是超人", type: "综艺", why: "亲子综艺。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, kidSafe: true, ageMin: 6 },
    { title: "向往的生活 第六季", type: "综艺", why: "向往老季。", moods: ["温馨"], audiences: ["全家"], familyFriendly: true, ageMin: 8 },
    { title: "新游记", type: "综艺", why: "明星西游主题旅行。", moods: ["温馨"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 10 },
    { title: "怎么办！脱口秀专场", type: "综艺", why: "脱口秀新节目。", moods: ["搞笑"], audiences: ["朋友"], ageMin: 16 },
    { title: "二十不惑", type: "电视剧", why: "都市青春。", moods: ["温馨"], audiences: ["朋友", "情侣"], ageMin: 16 },
    { title: "三十而已", type: "电视剧", why: "都市女性。", moods: ["下饭"], audiences: ["朋友"], ageMin: 18 },
    { title: "欢乐颂 1/2/3", type: "电视剧", why: "国民群像。", moods: ["下饭"], audiences: ["朋友", "全家"], familyFriendly: true, ageMin: 14 },
    { title: "我的前半生", type: "电视剧", why: "国剧女性。", moods: ["下饭"], audiences: ["双人"], ageMin: 18 },
    { title: "甄嬛传 续", type: "电视剧", why: "国民下饭剧。", moods: ["下饭"], audiences: ["全家"], familyFriendly: true, ageMin: 14 },
  ];
  return tpls.map((t, i) => ({
    id: `wx${i + 100}`,
    title: t.title,
    type: t.type,
    why: t.why,
    moods: t.moods,
    audiences: t.audiences,
    duration: t.duration,
    ageMin: t.ageMin,
    familyFriendly: t.familyFriendly,
    kidSafe: t.kidSafe,
    elderFriendly: t.elderFriendly,
  }));
}

// === 话题 ===
// 避开政治、宗教、地域攻击、医疗诊断、过度隐私（如薪资追问、催婚催育施压）。
export const TOPIC_ITEMS: TopicItem[] = [
  // 轻松开场
  { id: "t1", text: "今天最有意思的一件小事是什么？", tags: ["轻松开场", "适合全家"], audiences: ["全家", "朋友", "情侣", "双人"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t2", text: "上次让你一口气笑出声的视频或段子是什么？", tags: ["轻松开场"], audiences: ["朋友", "情侣", "双人"], familyFriendly: true },
  { id: "t3", text: "如果今天可以再加一个小时，你最想用来做什么？", tags: ["轻松开场"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, elderFriendly: true },
  { id: "t4", text: "最近哪首歌让你单曲循环？", tags: ["轻松开场", "兴趣"], audiences: ["朋友", "情侣", "双人"], familyFriendly: true },
  { id: "t5", text: "假如下个月有 3 天连休,你会怎么安排?", tags: ["轻松开场", "旅行"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, elderFriendly: true },
  { id: "t6", text: "今天遇到的一个小确幸,你愿意分享一下吗?", tags: ["轻松开场", "适合全家"], audiences: ["全家", "情侣"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t7", text: "最近发现的一家想推荐给大家的小店?", tags: ["轻松开场", "美食"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t8", text: "今天的天气最适合做什么?", tags: ["轻松开场", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },

  // 美食
  { id: "t9", text: "你心目中的「家的味道」是哪一道菜?", tags: ["美食", "回忆", "适合全家"], audiences: ["全家", "情侣", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t10", text: "如果只能选一种早餐吃一辈子,你选什么?", tags: ["美食", "轻松开场"], audiences: ["全家", "朋友"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t11", text: "上一次自己做饭做出特别满意的菜是什么时候?", tags: ["美食"], audiences: ["全家", "情侣", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t12", text: "你能接受的最辣 / 最甜 / 最咸是什么?", tags: ["美食", "轻松开场"], audiences: ["全家", "朋友"], familyFriendly: true, kidSafe: true },
  { id: "t13", text: "小时候最盼着过年吃的那一道菜是什么?", tags: ["美食", "回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t14", text: "周末最想花时间慢慢做的一道菜是?", tags: ["美食"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },

  // 回忆
  { id: "t15", text: "你最难忘的一次旅行是哪一次?", tags: ["回忆", "旅行"], audiences: ["全家", "情侣", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t16", text: "小时候最喜欢的一个游戏是什么?", tags: ["回忆", "适合全家"], audiences: ["全家", "朋友", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t17", text: "学生时代有没有一首专属于你们那届的歌?", tags: ["回忆", "兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true },
  { id: "t18", text: "你记忆里最热闹的一个春节是哪一年?", tags: ["回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t19", text: "你最早一次自己挣到钱是怎么挣的?", tags: ["回忆"], audiences: ["全家", "情侣", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t20", text: "记忆里夏天总会有的一个声音是什么?", tags: ["回忆", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },

  // 旅行
  { id: "t21", text: "如果可以瞬移去一个城市待 24 小时,你去哪?", tags: ["旅行", "轻松开场"], audiences: ["全家", "情侣", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t22", text: "下一个最想带家人一起去的地方是哪儿?", tags: ["旅行", "适合全家"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
  { id: "t23", text: "国内你还想去但没去过的省份是?", tags: ["旅行"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t24", text: "旅行里最值得花钱的一项是什么(吃 / 住 / 玩)?", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },

  // 工作 / 学习（轻松向)
  { id: "t25", text: "本周最让你有成就感的一件事是?", tags: ["工作", "轻松开场"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, elderFriendly: true },
  { id: "t26", text: "最近想学但还没开始的一项技能是什么?", tags: ["工作", "兴趣"], audiences: ["朋友", "情侣", "双人"], familyFriendly: true },
  { id: "t27", text: "如果换一个完全不同的职业,你最想试试哪个?", tags: ["工作", "深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
  { id: "t28", text: "工作之外的你,最近在着迷什么?", tags: ["兴趣"], audiences: ["全家", "情侣", "朋友"], familyFriendly: true, elderFriendly: true },

  // 兴趣 / 内容
  { id: "t29", text: "最近看完后会想推荐给别人的一本书 / 一部剧?", tags: ["兴趣"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, elderFriendly: true },
  { id: "t30", text: "有没有一个被低估的小爱好/小习惯,想分享一下?", tags: ["兴趣", "轻松开场"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
  { id: "t31", text: "如果今天可以学一项新乐器,你想学什么?", tags: ["兴趣", "适合全家"], audiences: ["全家", "情侣"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t32", text: "你的相册里最近一张让你笑的照片是什么内容?", tags: ["轻松开场", "适合全家"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, kidSafe: true, elderFriendly: true },

  // 亲子 / 全家
  { id: "t33", text: "今天在学校 / 单位最有意思的一件事是?", tags: ["亲子", "适合全家"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t34", text: "你最想长大以后做什么样的工作?(问小朋友)", tags: ["亲子", "适合全家"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
  { id: "t35", text: "全家一起做过印象最深的一件事是什么?", tags: ["亲子", "回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t36", text: "周末想全家一起做点什么好玩的?", tags: ["亲子", "适合全家"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t37", text: "如果家里能再养一种宠物,你想养什么?", tags: ["亲子", "适合全家", "轻松开场"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t38", text: "今天想听爸爸 / 妈妈讲一件他们小时候的事吗?", tags: ["亲子", "回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },

  // 长辈友好（避免敏感话题，聚焦生活细节）
  { id: "t39", text: "您年轻时最常吃的一顿饭是什么样的?", tags: ["回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
  { id: "t40", text: "您觉得我们这道菜还可以怎么改一下更好?", tags: ["美食", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
  { id: "t41", text: "最近哪部剧 / 哪首老歌让您一听就有感觉?", tags: ["回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
  { id: "t42", text: "下次想去公园 / 老街转转的话,带哪一段?", tags: ["旅行", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },

  // 情侣 / 双人 / 朋友 - 偏深聊（仍避免敏感）
  { id: "t43", text: "下半年有没有特别想一起完成的一件小事?", tags: ["深聊一点"], audiences: ["情侣", "双人", "朋友"], familyFriendly: true },
  { id: "t44", text: "我们认识到现在,你印象最深的一次出门是哪一次?", tags: ["回忆", "深聊一点"], audiences: ["情侣", "双人", "朋友"], familyFriendly: true },
  { id: "t45", text: "假如未来一年可以一起养成一个新习惯,你想养什么?", tags: ["深聊一点"], audiences: ["情侣", "双人"], familyFriendly: true },
  { id: "t46", text: "最近有没有什么事是你想跟我说但还没说的?", tags: ["深聊一点"], audiences: ["情侣"], familyFriendly: true },
  { id: "t47", text: "我们两个人最适合一起做什么?最不适合一起做什么?", tags: ["轻松开场", "深聊一点"], audiences: ["情侣", "双人"], familyFriendly: true },

  // 朋友群（话题性、低争议）
  { id: "t48", text: "下个月攒一次饭局,你最想叫上谁?", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
  { id: "t49", text: "最近有没有什么神器/小工具改变了生活?", tags: ["轻松开场", "兴趣"], audiences: ["朋友", "情侣", "全家"], familyFriendly: true, elderFriendly: true },
  { id: "t50", text: "你觉得我们这桌人各点一道菜的话,能拼出一桌好菜吗?", tags: ["美食", "轻松开场", "适合全家"], audiences: ["全家", "朋友"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  { id: "t51", text: "如果做一档我们朋友圈的小综艺,主题会是什么?", tags: ["轻松开场", "兴趣"], audiences: ["朋友"], familyFriendly: true },
  { id: "t52", text: "回头看,这一年最值得保留的一件小事是?", tags: ["回忆", "深聊一点"], audiences: ["情侣", "双人", "朋友", "全家"], familyFriendly: true, elderFriendly: true },
  { id: "t53", text: "如果可以送一份不超过 50 元的礼物给桌上的人,你会送什么?", tags: ["适合全家", "轻松开场"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, kidSafe: true, elderFriendly: true },
  ...buildExtraTopics(),
];

// v2: 200+ 话题池
function buildExtraTopics(): TopicItem[] {
  const texts: { text: string; tags: TopicItem["tags"]; audiences: AudienceTag[]; familyFriendly?: boolean; kidSafe?: boolean; elderFriendly?: boolean }[] = [
    // 轻松日常
    { text: "今天有没有遇到一个不太一样的瞬间？", tags: ["轻松开场"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "如果给今天打个分，你会给几分？为什么？", tags: ["轻松开场"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "今天最让你想睡个好觉的事情是什么？", tags: ["轻松开场"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "今天有没有遇到一个让你笑的人？", tags: ["轻松开场"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "今天的天空你看了吗？什么颜色？", tags: ["轻松开场", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "上一次为自己买的小礼物是什么？", tags: ["轻松开场"], audiences: ["全家", "朋友", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "你最近在追的剧 / 综艺是什么？", tags: ["轻松开场", "兴趣"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
    { text: "如果今天有 1 小时空闲，你会怎么用？", tags: ["轻松开场"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    // 美食类
    { text: "你最讨厌吃什么？小时候到现在变了吗？", tags: ["美食", "回忆"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "你最爱吃的火锅蘸料配方是什么？", tags: ["美食"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你心中下饭剧 TOP 3 是哪几部？", tags: ["美食", "兴趣"], audiences: ["朋友", "全家"], familyFriendly: true },
    { text: "现在最想再吃一次的小学放学路上的小吃是？", tags: ["美食", "回忆"], audiences: ["朋友", "全家"], familyFriendly: true, elderFriendly: true },
    { text: "你最爱的早餐组合是什么？", tags: ["美食", "轻松开场"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "如果开一家小店，你会卖什么吃的？", tags: ["美食"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "辣是好辣还是辣到流泪？你的极限在哪？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "下次聚餐，谁负责做菜谁负责洗碗？", tags: ["美食"], audiences: ["朋友", "全家"], familyFriendly: true },
    { text: "你做过最难吃的菜是什么？故事经过？", tags: ["美食", "回忆"], audiences: ["朋友"], familyFriendly: true },
    { text: "你心中外卖之神和外卖之耻的店各是哪家？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "今天这桌菜，你会给打几分？为什么？", tags: ["美食"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
    { text: "如果有人 100 元让你做一桌晚餐，你会怎么做？", tags: ["美食"], audiences: ["朋友", "全家"], familyFriendly: true },
    { text: "夜宵首选是宵夜摊还是泡面？为什么？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    // 回忆类
    { text: "记忆中最热闹的一顿团圆饭是哪一次？", tags: ["回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "童年里最难忘的一个夏天是怎样的？", tags: ["回忆", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "你 18 岁那年最大的梦想是什么？现在还记得吗？", tags: ["回忆"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "上一次和小学朋友联系是什么时候？", tags: ["回忆"], audiences: ["朋友"], familyFriendly: true },
    { text: "记忆里第一次出远门是几岁？去了哪？", tags: ["回忆", "旅行"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "童年最让你觉得有趣的家务活是哪个？", tags: ["回忆", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "你最早一次说谎是为了什么？", tags: ["回忆"], audiences: ["朋友"], familyFriendly: true },
    { text: "印象最深的一次表白或被表白？(自愿选答)", tags: ["回忆"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "小学最难忘的一位老师是？", tags: ["回忆", "适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "印象里第一次自己做饭做的是什么？", tags: ["回忆", "美食"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
    // 旅行类
    { text: "如果让你重启一次旅行，你会改去哪里？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你最讨厌哪种景区/景点？为什么？", tags: ["旅行"], audiences: ["朋友"], familyFriendly: true },
    { text: "国外有想去但还没去的国家吗？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果只能选一座中国城市住下，你会选哪？", tags: ["旅行"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
    { text: "山海湖林，你最喜欢哪种风景？", tags: ["旅行"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "和家人一起旅行最值得保留的一个习惯是？", tags: ["旅行", "适合全家"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "上次旅行带回的纪念品是什么？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果可以预订下个月一周的假期，你会怎么花？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 工作 / 学习
    { text: "本周你最想跳过的一项工作是？", tags: ["工作"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果可以学一门新技能，你会选什么？", tags: ["工作", "兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "理想的工作时间表是什么？", tags: ["工作"], audiences: ["朋友"], familyFriendly: true },
    { text: "下一次想换的城市是哪里？为什么？", tags: ["工作"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果可以选 3 天 4 休，你会同意吗？为什么？", tags: ["工作"], audiences: ["朋友"], familyFriendly: true },
    { text: "你怎么定义你的下班时刻？", tags: ["工作"], audiences: ["朋友"], familyFriendly: true },
    // 兴趣 / 爱好
    { text: "最近迷上的一个新爱好是什么？", tags: ["兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "童年迷过的玩具或动画现在还会回看吗？", tags: ["兴趣", "回忆"], audiences: ["朋友"], familyFriendly: true },
    { text: "你最近添置的一件让生活更舒服的物品？", tags: ["兴趣"], audiences: ["朋友", "情侣", "全家"], familyFriendly: true, elderFriendly: true },
    { text: "你正在追的一个公众号或博主是？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    { text: "上一次让你看完想反复想的电影是？", tags: ["兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果给自己一个理想的周日上午，你会做什么？", tags: ["兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true, elderFriendly: true },
    // 情感 / 深聊
    { text: "你最想感谢的一个人是？为了一件什么事？", tags: ["深聊一点", "回忆"], audiences: ["朋友", "情侣", "全家"], familyFriendly: true, elderFriendly: true },
    { text: "上一次主动联系老朋友是因为什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果给自己写一句送给五年前的自己的话，会写什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你今年想完成的一件小目标是什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "上次让你真心觉得「过得不错」的瞬间是？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你怎么定义自己幸福的一天？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 适合全家
    { text: "全家一起做过最特别的一件事是？", tags: ["适合全家", "回忆"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "下个周末家里能搞个什么小活动？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "下次给老人挑礼物，大家有没有思路？", tags: ["适合全家"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
    { text: "如果给孩子选一个新兴趣班，会选什么？", tags: ["适合全家", "亲子"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
    { text: "家里最想扔掉的一件东西是什么？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true },
    { text: "下次大扫除，谁负责哪一块？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true },
    { text: "今年家里想做的一件大事是？(装修 / 旅行 / 新成员)", tags: ["适合全家", "深聊一点"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "全家最爱的一道菜，谁做最好？", tags: ["适合全家", "美食"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    // 亲子
    { text: "今天小朋友最得意的一件事是？", tags: ["亲子"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
    { text: "孩子最近的口头禅是什么？", tags: ["亲子"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
    { text: "本周家里最让全家会心一笑的孩子糗事是？", tags: ["亲子", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "孩子今天学到 / 听到一个新词，是什么？", tags: ["亲子"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
    // 工作生活平衡
    { text: "下班后最想做的事和最不想做的事是？", tags: ["工作"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你给自己的「下班仪式感」是什么？", tags: ["工作"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 城市观察
    { text: "你住的小区附近最值得安利的一家店是？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true, elderFriendly: true },
    { text: "你常去但没人知道的一家小店是？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "上次自己散步走最远的距离是多远？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true, elderFriendly: true },
    // 健康
    { text: "你最近一次完整睡到自然醒是哪天？", tags: ["轻松开场"], audiences: ["朋友", "全家"], familyFriendly: true, elderFriendly: true },
    { text: "你这周锻炼了几次？感受如何？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你最喜欢的运动方式是什么？", tags: ["兴趣"], audiences: ["朋友", "情侣", "全家"], familyFriendly: true, elderFriendly: true },
    // 复盘
    { text: "回顾过去一个月，最值得开心的一件事是？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "下个月最想完成的一件事是？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 文化
    { text: "你最想推荐的一本最近读过的书是什么？", tags: ["兴趣"], audiences: ["朋友", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "你最近循环最多的歌是什么？", tags: ["兴趣", "轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "看过最离谱 / 最神奇的电影是哪一部？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果可以与一位历史人物吃饭，你想见谁？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    { text: "你心中的「下饭剧 TOP 1」是哪部？", tags: ["美食", "兴趣"], audiences: ["朋友"], familyFriendly: true },
    // 成长
    { text: "如果你是 18 岁，你会做什么不一样的选择？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你最庆幸自己学会的一件事是什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "上一次让你紧张的事是什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 趣味假设
    { text: "如果中了 100 万，你会先做哪件事？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果给自己起一个新名字，你想叫什么？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果只能带 3 件物品上荒岛，你会带什么？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果可以拥有一种超能力，你想要什么？", tags: ["轻松开场"], audiences: ["朋友", "全家"], familyFriendly: true, kidSafe: true },
    { text: "如果让你穿越到一个年代，你选哪一年？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果可以瞬间精通一件事，你选什么？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    // 朋友
    { text: "我们桌上最具反差萌的人是谁？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果让我们桌上的人组成一个综艺，谁演谁？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "桌上谁请客最大方？谁最吝啬？(开玩笑就好)", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    // 情侣 / 双人
    { text: "你最希望我下次记住的小事是什么？", tags: ["深聊一点"], audiences: ["情侣"], familyFriendly: true },
    { text: "我们之间最有意思的一个内梗是？", tags: ["回忆"], audiences: ["情侣", "朋友"], familyFriendly: true },
    { text: "下次约会想试试什么不一样的？", tags: ["轻松开场"], audiences: ["情侣"], familyFriendly: true },
    { text: "今天最想被表扬的一件事是？", tags: ["轻松开场"], audiences: ["情侣"], familyFriendly: true },
    // 长辈
    { text: "您最满意的一次自己亲手做过的事是？", tags: ["深聊一点", "回忆"], audiences: ["长辈友好", "全家"], familyFriendly: true, elderFriendly: true },
    { text: "您年轻时候最骄傲的一件事是？", tags: ["回忆", "深聊一点"], audiences: ["长辈友好"], familyFriendly: true, elderFriendly: true },
    { text: "您觉得现在的年轻人哪里最不一样？", tags: ["深聊一点"], audiences: ["长辈友好"], familyFriendly: true, elderFriendly: true },
    { text: "您最爱的一首老歌是什么？故事是？", tags: ["回忆"], audiences: ["长辈友好"], familyFriendly: true, elderFriendly: true },
    // 节气 / 应季
    { text: "今年端午想吃甜粽子还是咸粽子？", tags: ["美食", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "中秋你最喜欢哪种月饼？", tags: ["美食", "适合全家"], audiences: ["全家"], familyFriendly: true, kidSafe: true, elderFriendly: true },
    { text: "立春最想做的一件事是什么？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "下雪天你最想吃什么？", tags: ["美食"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "夏天最爱喝什么饮料？", tags: ["美食"], audiences: ["全家", "朋友"], familyFriendly: true, elderFriendly: true },
    // 街坊小事
    { text: "今天小区里最热闹的一件事是？", tags: ["轻松开场"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "今天的菜价你觉得贵不贵？", tags: ["适合全家", "美食"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "你家附近最近有什么新店开张？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true, elderFriendly: true },
    // 习惯
    { text: "你最忠实的一个十年以上的小习惯是？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你早上起床做的第一件事是什么？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "睡前的最后一件事是？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    // 趣味问答
    { text: "你最讨厌但很多人喜欢的一种食物是？", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "你最讨厌的一种朋友圈类型是？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "你最想发起的一种新流行是什么？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果用一种动物形容自己今天的状态？", tags: ["轻松开场"], audiences: ["朋友", "全家"], familyFriendly: true, kidSafe: true },
    // 合家欢续
    { text: "全家一起最容易吵架的事是？怎么解决？", tags: ["适合全家", "深聊一点"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "今年最想全家一起完成的一件事是？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "下次出去吃饭，谁来挑餐厅？", tags: ["适合全家"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "今年家里最值得保留的一个瞬间是？", tags: ["适合全家", "回忆"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "今天小朋友画了什么 / 学了什么？让 ta 来讲", tags: ["亲子", "适合全家"], audiences: ["全家", "儿童友好"], familyFriendly: true, kidSafe: true },
    { text: "周末我们能不能一起做一道新菜？", tags: ["适合全家", "美食"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    // 讨论 / 半开放
    { text: "如果让你重新定义周一，你想怎么过？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你心中工作日最理想的午餐是？", tags: ["美食", "工作"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果你能写一本自传，第一章会写什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你最庆幸自己年轻时做的一件事是？", tags: ["深聊一点", "回忆"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "今天去做哪一件不重要但快乐的小事？", tags: ["轻松开场"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果给生活加一个小仪式感，你会加什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你最想送给自己的一份惊喜是什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你心中最理想的退休生活是什么？", tags: ["深聊一点"], audiences: ["朋友", "全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
    { text: "你给孩子或后辈最想说的一句话是？", tags: ["深聊一点"], audiences: ["全家", "长辈友好"], familyFriendly: true, elderFriendly: true },
    // 兴趣
    { text: "你最想再学一遍的一项学生时代知识是？", tags: ["兴趣", "回忆"], audiences: ["朋友"], familyFriendly: true },
    { text: "你最近在尝试做的一件创造性的事是？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    { text: "你买过最值的一件物品是什么？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    { text: "你愿意为兴趣花最多预算的一项是？", tags: ["兴趣"], audiences: ["朋友"], familyFriendly: true },
    // 朋友 / 趣味
    { text: "下次开 group 出游，谁是行程规划王？", tags: ["旅行"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果让朋友圈匿名投票最暖的人，会是谁？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    { text: "下次三五好友聚一次，主题想搞什么？", tags: ["轻松开场"], audiences: ["朋友"], familyFriendly: true },
    // 情绪
    { text: "今天最想拥抱的一个人是？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果有人替你做今天最难的一件事，你想让他做什么？", tags: ["深聊一点"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "今天发生了让你感到「人间值得」的瞬间吗？", tags: ["深聊一点"], audiences: ["朋友", "情侣", "全家"], familyFriendly: true, elderFriendly: true },
    // 城市
    { text: "你心中最 walk 友好的城市是哪个？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "本城你最喜欢的一条街是？", tags: ["旅行"], audiences: ["朋友"], familyFriendly: true },
    // 旅行
    { text: "三天小假你会怎么花？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "如果钱不是问题，你会去哪儿度假 1 个月？", tags: ["旅行"], audiences: ["朋友", "情侣"], familyFriendly: true },
    { text: "你坐过最久的一次交通工具是什么？", tags: ["旅行", "回忆"], audiences: ["朋友"], familyFriendly: true },
    // 美食续
    { text: "你心中最神奇的中外搭配是？(如香菜+冰淇淋)", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "你能接受加 / 不加的一个食材是？(eg. 香菜)", tags: ["美食"], audiences: ["朋友"], familyFriendly: true },
    { text: "如果家里只能再保留一个厨房电器，你保留谁？", tags: ["美食"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "你做菜从不放的一种调料是什么？", tags: ["美食"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
    { text: "你最想学的一道菜是什么？为什么？", tags: ["美食"], audiences: ["全家", "情侣"], familyFriendly: true, elderFriendly: true },
    { text: "你心中的「家乡名片菜」是什么？", tags: ["美食", "回忆"], audiences: ["全家"], familyFriendly: true, elderFriendly: true },
  ];
  return texts.map((t, i) => ({
    id: `tx${i + 100}`,
    text: t.text,
    tags: t.tags,
    audiences: t.audiences,
    familyFriendly: t.familyFriendly,
    kidSafe: t.kidSafe,
    elderFriendly: t.elderFriendly,
  }));
}

// === 音频：有声书 / 播客 / 故事 / 助眠 ===
export const AUDIO_ITEMS: AudioItem[] = [
  // —— 有声书 / 长篇 ——
  { id: "a1", title: "三体 (有声书)", type: "有声书", why: "做饭长时间空窗期一边听一边沉浸,适合周末。", length: "长", audiences: ["单人", "双人"], tags: ["故事", "做饭背景"] },
  { id: "a2", title: "活着 余华 (有声书)", type: "有声书", why: "中文当代经典,听着情感很厚重。", length: "长", audiences: ["单人", "双人"], tags: ["故事", "情感"] },
  { id: "a3", title: "明朝那些事儿 (有声书)", type: "有声书", why: "历史口述风,做饭听一两章不无聊。", length: "长", audiences: ["单人", "双人", "长辈友好"], tags: ["历史", "做饭背景"], elderFriendly: true },
  { id: "a4", title: "百年孤独 (有声书)", type: "有声书", why: "节奏慢,长时间慢炖时配最合适。", length: "长", audiences: ["单人", "双人"], tags: ["故事", "情感"] },
  { id: "a5", title: "围城 (有声书)", type: "有声书", why: "钱锺书冷幽默,做饭也能笑出声。", length: "长", audiences: ["单人", "双人"], tags: ["故事", "搞笑"] },
  { id: "a6", title: "解忧杂货店 (有声书)", type: "有声书", why: "短篇治愈日系故事,做菜不闷。", length: "中", audiences: ["单人", "双人", "情侣"], tags: ["故事", "情感"] },
  { id: "a7", title: "霍乱时期的爱情 (有声书)", type: "有声书", why: "周末长时间烹饪的好搭档。", length: "长", audiences: ["单人", "双人"], tags: ["故事", "情感"] },
  { id: "a8", title: "盗墓笔记 (有声书)", type: "有声书", why: "做饭听悬疑,时间过得飞快。", length: "长", audiences: ["单人", "朋友"], tags: ["悬疑", "故事"] },

  // —— 中文播客 ——
  { id: "a9", title: "故事 FM", type: "播客", why: "普通人讲自己的故事,真实而平和。", length: "中", audiences: ["单人", "双人"], tags: ["故事", "情感", "做饭背景"] },
  { id: "a10", title: "日谈公园", type: "播客", why: "聊电影聊综艺聊生活,做饭很轻松。", length: "中", audiences: ["单人", "双人", "朋友"], tags: ["搞笑", "做饭背景"] },
  { id: "a11", title: "无聊斋", type: "播客", why: "笑点稳定,适合做菜不想动脑筋。", length: "中", audiences: ["单人", "双人"], tags: ["搞笑", "做饭背景"] },
  { id: "a12", title: "声东击西", type: "播客", why: "话题广,适合一边做饭一边吸收信息。", length: "中", audiences: ["单人", "双人"], tags: ["轻知识", "人文"] },
  { id: "a13", title: "忽左忽右", type: "播客", why: "深度访谈,周末慢炖时听刚刚好。", length: "长", audiences: ["单人", "双人"], tags: ["人文", "轻知识"] },
  { id: "a14", title: "随机波动", type: "播客", why: "三位女性主播的对谈,生活感强。", length: "中", audiences: ["单人", "双人", "朋友"], tags: ["人文", "情感"] },
  { id: "a15", title: "枫言枫语", type: "播客", why: "科技产品 + 数字生活闲谈,节奏舒服。", length: "中", audiences: ["单人"], tags: ["轻知识", "做饭背景"] },
  { id: "a16", title: "文化有限", type: "播客", why: "聊书聊电影,做菜时充电不上头。", length: "中", audiences: ["单人", "双人"], tags: ["人文", "做饭背景"] },
  { id: "a17", title: "展开讲讲", type: "播客", why: "硬核展开但不晦涩,周末长时间做饭。", length: "长", audiences: ["单人"], tags: ["轻知识", "人文"] },
  { id: "a18", title: "搞钱女孩", type: "播客", why: "都市女性主题日常播客。", length: "中", audiences: ["单人", "双人", "朋友"], tags: ["情感", "做饭背景"] },

  // —— 历史 / 知识 ——
  { id: "a19", title: "看理想·历史专栏", type: "知识", why: "短小好懂的历史故事,做饭一起补课。", length: "中", audiences: ["单人", "双人", "长辈友好"], tags: ["历史", "轻知识"], elderFriendly: true },
  { id: "a20", title: "袁腾飞讲历史", type: "知识", why: "口语化讲历史,吸收成本低。", length: "中", audiences: ["单人", "长辈友好"], tags: ["历史"], elderFriendly: true },
  { id: "a21", title: "易中天品三国", type: "知识", why: "经典通俗历史讲述,适合长辈一起听。", length: "长", audiences: ["全家", "长辈友好"], tags: ["历史"], elderFriendly: true },
  { id: "a22", title: "蒋勋说红楼梦", type: "知识", why: "温柔慢速,做饭背景音的天花板。", length: "长", audiences: ["单人", "双人", "长辈友好"], tags: ["人文", "助眠"], elderFriendly: true },
  { id: "a23", title: "吴晓波频道", type: "知识", why: "财经历史轻八卦,做菜补课。", length: "中", audiences: ["单人", "双人"], tags: ["轻知识", "历史"] },
  { id: "a24", title: "高晓松·晓说精选", type: "知识", why: "天南地北闲谈,做饭很解闷。", length: "中", audiences: ["单人", "长辈友好"], tags: ["人文", "做饭背景"], elderFriendly: true },

  // —— 亲子 / 儿童 ——
  { id: "a25", title: "凯叔讲故事·西游记", type: "故事", why: "孩子最爱的睡前 / 做饭背景音。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子", "故事"], kidSafe: true },
  { id: "a26", title: "凯叔·三国演义", type: "故事", why: "比原著好懂,孩子也能跟得上。", length: "中", audiences: ["儿童友好", "全家"], tags: ["亲子", "历史"], kidSafe: true },
  { id: "a27", title: "米小圈上学记", type: "故事", why: "孩子专属热门故事,做晚饭刚刚好。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子", "搞笑"], kidSafe: true },
  { id: "a28", title: "贝瓦儿歌", type: "音乐", why: "幼儿期最稳的背景音。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },
  { id: "a29", title: "睡前故事·王二小系列", type: "故事", why: "传统故事合集,适合给孩子听。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子", "故事"], kidSafe: true },
  { id: "a30", title: "鼹鼠的故事", type: "故事", why: "短小温柔,做完饭也刚好讲完。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },

  // —— 短音频 / 快手菜 / 助眠 ——
  { id: "a31", title: "新闻早班车 (得到)", type: "知识", why: "10 分钟左右一期,煎个蛋的功夫听完。", length: "短", audiences: ["单人"], tags: ["轻知识"] },
  { id: "a32", title: "得到·每天听本书", type: "知识", why: "20 分钟一本书,快手菜时间刚好。", length: "短", audiences: ["单人", "双人"], tags: ["轻知识", "做饭背景"] },
  { id: "a33", title: "5 分钟英文晨读", type: "知识", why: "做早餐的短窗口最合适。", length: "短", audiences: ["单人"], tags: ["轻知识"] },
  { id: "a34", title: "白噪音·咖啡馆", type: "助眠", why: "纯背景音,只想专心切菜时用。", length: "中", audiences: ["单人", "双人"], tags: ["助眠", "做饭背景"] },
  { id: "a35", title: "钢琴版流行金曲", type: "音乐", why: "做菜不分散注意力,长辈也喜欢。", length: "中", audiences: ["单人", "全家", "长辈友好"], tags: ["做饭背景"], elderFriendly: true },
  { id: "a36", title: "Lo-fi Hip Hop Beats", type: "音乐", why: "做饭白噪音首选,效率拉满。", length: "中", audiences: ["单人", "双人"], tags: ["做饭背景"] },
  { id: "a37", title: "邓丽君经典金曲", type: "音乐", why: "长辈非常受用的经典金曲。", length: "中", audiences: ["全家", "长辈友好"], tags: ["做饭背景"], elderFriendly: true },
  { id: "a38", title: "周深 / 毛不易精选", type: "音乐", why: "温柔人声,合家欢氛围。", length: "中", audiences: ["全家", "长辈友好"], tags: ["做饭背景"], elderFriendly: true },

  // —— 情感 / 故事 ——
  { id: "a39", title: "声音碎片·睡前", type: "助眠", why: "节奏极慢,适合慢炖锅守候时段。", length: "中", audiences: ["单人"], tags: ["助眠"] },
  { id: "a40", title: "蒋勋·美的沉思", type: "知识", why: "美学慢讲,周末厨房氛围拉满。", length: "长", audiences: ["单人", "双人"], tags: ["人文", "做饭背景"] },
  { id: "a41", title: "我是郭杰瑞", type: "播客", why: "美食与文化轻知识,做菜搭话题。", length: "中", audiences: ["单人", "双人", "全家"], tags: ["轻知识", "做饭背景"], elderFriendly: false },
  { id: "a42", title: "无人之地·悬疑短篇", type: "故事", why: "10 分钟一个悬疑短篇,情节紧凑。", length: "短", audiences: ["单人"], tags: ["悬疑", "故事"] },
  ...buildExtraAudio(),
];

function buildExtraAudio(): AudioItem[] {
  const tpls: { title: string; type: AudioType; why: string; length: AudioItem["length"]; audiences: AudienceTag[]; tags: AudioItem["tags"]; elderFriendly?: boolean; kidSafe?: boolean }[] = [
    // —— 中文播客 ——
    { title: "得意忘形", type: "播客", why: "深度对谈，做饭长时间不无聊。", length: "长", audiences: ["单人", "双人"], tags: ["人文"] },
    { title: "螺丝在拧紧", type: "播客", why: "李厚辰主持思辨节目。", length: "长", audiences: ["单人"], tags: ["人文"] },
    { title: "翻转电台", type: "播客", why: "话题广泛，深度高。", length: "长", audiences: ["单人"], tags: ["人文"] },
    { title: "硅谷早知道", type: "播客", why: "硅谷创投资讯。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "商业就是这样", type: "播客", why: "商业故事讲述。", length: "中", audiences: ["单人", "双人"], tags: ["轻知识"] },
    { title: "声动早咖啡", type: "播客", why: "财经新闻 早咖啡时间。", length: "短", audiences: ["单人"], tags: ["轻知识"] },
    { title: "声动活泼", type: "播客", why: "声动出品的播客集合。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "JustPod 出品·凹凸电波", type: "播客", why: "互联网产品对谈。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "纵横四海", type: "播客", why: "经典书籍解读。", length: "长", audiences: ["单人"], tags: ["人文", "轻知识"] },
    { title: "不合时宜", type: "播客", why: "性别 / 文化对谈。", length: "中", audiences: ["单人", "双人"], tags: ["人文"] },
    { title: "贤者时间", type: "播客", why: "情感对话。", length: "中", audiences: ["单人", "情侣" as any], tags: ["情感"] },
    { title: "小宇宙·热门 · 编辑精选", type: "播客", why: "小宇宙官方推荐合辑。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "雪球·投资先锋", type: "播客", why: "财经投资。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "谐星聊天会", type: "播客", why: "脱口秀演员闲聊。", length: "中", audiences: ["单人", "朋友"], tags: ["搞笑", "做饭背景"] },
    { title: "组装大会", type: "播客", why: "潮流文化播客。", length: "中", audiences: ["单人"], tags: ["搞笑"] },
    { title: "三五环", type: "播客", why: "互联网商业播客。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "一席·演讲", type: "知识", why: "TED 风演讲合辑。", length: "中", audiences: ["单人", "双人"], tags: ["人文"] },
    { title: "得到 · 罗辑思维", type: "知识", why: "知识脱口秀经典。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "得到 · 沈祖芸全球教育报告", type: "知识", why: "教育领域。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    // —— 有声书 ——
    { title: "明朝那些事 续集", type: "有声书", why: "明朝那些事完整版。", length: "长", audiences: ["单人", "双人"], tags: ["历史"], elderFriendly: true },
    { title: "三体 黑暗森林 (有声书)", type: "有声书", why: "三体续作。", length: "长", audiences: ["单人"], tags: ["故事"] },
    { title: "三体 死神永生 (有声书)", type: "有声书", why: "三体终篇。", length: "长", audiences: ["单人"], tags: ["故事"] },
    { title: "金庸合集", type: "有声书", why: "经典武侠。", length: "长", audiences: ["单人", "长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "鹿鼎记 (有声书)", type: "有声书", why: "金庸幽默武侠。", length: "长", audiences: ["单人", "长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "白鹿原 (有声书)", type: "有声书", why: "陈忠实经典。", length: "长", audiences: ["单人", "长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "平凡的世界 (有声书)", type: "有声书", why: "路遥经典。", length: "长", audiences: ["单人", "长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "活着 续：兄弟", type: "有声书", why: "余华长篇。", length: "长", audiences: ["单人"], tags: ["故事"] },
    { title: "许三观卖血记 (有声书)", type: "有声书", why: "余华作品。", length: "中", audiences: ["单人"], tags: ["故事"] },
    { title: "蛤蟆先生去看心理医生 (有声书)", type: "有声书", why: "心理学温情。", length: "中", audiences: ["单人", "双人"], tags: ["人文"] },
    { title: "被讨厌的勇气 (有声书)", type: "有声书", why: "阿德勒心理学。", length: "中", audiences: ["单人"], tags: ["人文"] },
    { title: "次第花开 (有声书)", type: "有声书", why: "希阿荣博堪布作品。", length: "中", audiences: ["单人"], tags: ["人文"] },
    { title: "苏菲的世界 (有声书)", type: "有声书", why: "哲学入门。", length: "长", audiences: ["单人"], tags: ["人文"] },
    { title: "局外人 (有声书)", type: "有声书", why: "加缪经典。", length: "中", audiences: ["单人"], tags: ["故事"] },
    { title: "傲慢与偏见 (有声书)", type: "有声书", why: "经典爱情。", length: "长", audiences: ["单人", "双人"], tags: ["故事"] },
    { title: "简爱 (有声书)", type: "有声书", why: "经典文学。", length: "长", audiences: ["单人"], tags: ["故事"] },
    { title: "小王子 (有声书)", type: "有声书", why: "童话入门。", length: "短", audiences: ["全家", "儿童友好"], tags: ["故事"], kidSafe: true },
    { title: "夏目友人帐 (动画原声)", type: "音乐", why: "治愈系日漫原声。", length: "中", audiences: ["单人"], tags: ["做饭背景"] },
    { title: "宫崎骏动画原声合辑", type: "音乐", why: "做饭最稳的氛围。", length: "中", audiences: ["全家"], tags: ["做饭背景"], elderFriendly: true },
    // —— 知识 / 历史 ——
    { title: "罗振宇 时间的朋友", type: "知识", why: "跨年演讲。", length: "长", audiences: ["单人"], tags: ["轻知识"] },
    { title: "得到 · 万维钢精英日课", type: "知识", why: "硬核日更。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "袁腾飞讲二战", type: "知识", why: "历史口语化。", length: "中", audiences: ["单人", "长辈友好"], tags: ["历史"], elderFriendly: true },
    { title: "晓说·矮大紧", type: "知识", why: "高晓松谈天说地。", length: "中", audiences: ["单人", "长辈友好"], tags: ["人文"], elderFriendly: true },
    { title: "百家讲坛 合集", type: "知识", why: "央视经典。", length: "中", audiences: ["全家", "长辈友好"], tags: ["历史"], elderFriendly: true },
    { title: "易中天中华史", type: "知识", why: "通俗历史。", length: "长", audiences: ["全家", "长辈友好"], tags: ["历史"], elderFriendly: true },
    { title: "王立群读史记", type: "知识", why: "史记讲解。", length: "长", audiences: ["全家", "长辈友好"], tags: ["历史"], elderFriendly: true },
    { title: "于丹·论语心得", type: "知识", why: "国学入门。", length: "中", audiences: ["全家", "长辈友好"], tags: ["人文"], elderFriendly: true },
    { title: "蒋勋·细说红楼梦", type: "知识", why: "蒋勋慢讲红楼。", length: "长", audiences: ["单人", "长辈友好"], tags: ["人文"], elderFriendly: true },
    // —— 亲子 ——
    { title: "凯叔讲故事·水浒传", type: "故事", why: "水浒儿童版。", length: "中", audiences: ["儿童友好", "全家"], tags: ["亲子", "故事"], kidSafe: true },
    { title: "凯叔讲故事·神奇图书馆", type: "故事", why: "凯叔系列。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },
    { title: "金龟子讲故事", type: "故事", why: "童年合家欢。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },
    { title: "宝宝睡前故事", type: "故事", why: "睡前必备。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子", "助眠"], kidSafe: true },
    { title: "童话故事大全", type: "故事", why: "经典童话。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },
    { title: "小猪佩奇 中文音频版", type: "故事", why: "孩子最爱。", length: "短", audiences: ["儿童友好", "全家"], tags: ["亲子"], kidSafe: true },
    // —— 助眠 ——
    { title: "白噪音·暴雨", type: "助眠", why: "下饭背景或助眠。", length: "中", audiences: ["单人"], tags: ["助眠"] },
    { title: "白噪音·壁炉柴火", type: "助眠", why: "做饭氛围。", length: "中", audiences: ["单人", "情侣"], tags: ["助眠"] },
    { title: "白噪音·森林晨曦", type: "助眠", why: "晨间做饭。", length: "中", audiences: ["单人"], tags: ["助眠"] },
    { title: "Ocean Waves Sleep", type: "助眠", why: "海浪声助眠。", length: "中", audiences: ["单人"], tags: ["助眠"] },
    { title: "雨夜咖啡馆", type: "助眠", why: "复合白噪音。", length: "中", audiences: ["单人", "情侣"], tags: ["助眠"] },
    // —— 音乐 ——
    { title: "周杰伦经典金曲", type: "音乐", why: "国民周董。", length: "中", audiences: ["全家", "朋友"], tags: ["做饭背景"], elderFriendly: true },
    { title: "陈奕迅经典", type: "音乐", why: "情歌天王。", length: "中", audiences: ["全家"], tags: ["做饭背景"], elderFriendly: true },
    { title: "五月天经典", type: "音乐", why: "国民乐团。", length: "中", audiences: ["朋友"], tags: ["做饭背景"] },
    { title: "S.H.E + 飞轮海", type: "音乐", why: "00s 怀旧。", length: "中", audiences: ["朋友", "长辈友好"], tags: ["做饭背景"], elderFriendly: true },
    { title: "Taylor Swift 精选", type: "音乐", why: "国际流行。", length: "中", audiences: ["朋友", "情侣"], tags: ["做饭背景"] },
    { title: "Adele 精选", type: "音乐", why: "灵魂金曲。", length: "中", audiences: ["朋友"], tags: ["做饭背景"] },
    { title: "Coldplay 精选", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["朋友", "情侣"], tags: ["做饭背景"] },
    { title: "中文古风金曲", type: "音乐", why: "古风做饭。", length: "中", audiences: ["朋友"], tags: ["做饭背景"] },
    { title: "民谣 / 城市民谣", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["朋友", "情侣"], tags: ["做饭背景"] },
    { title: "周深 + 毛不易 续选", type: "音乐", why: "温柔人声。", length: "中", audiences: ["全家"], tags: ["做饭背景"], elderFriendly: true },
    { title: "粤语怀旧金曲", type: "音乐", why: "广东金曲。", length: "中", audiences: ["长辈友好"], tags: ["做饭背景"], elderFriendly: true },
    { title: "古典钢琴·肖邦", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["单人"], tags: ["做饭背景"] },
    { title: "古典钢琴·德彪西", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["单人"], tags: ["做饭背景"] },
    { title: "Bossa Nova 选辑", type: "音乐", why: "巴西氛围。", length: "中", audiences: ["双人"], tags: ["做饭背景"] },
    { title: "Jazz 经典", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["双人"], tags: ["做饭背景"] },
    { title: "电台·夜里诗歌", type: "音乐", why: "夜间播放。", length: "中", audiences: ["单人"], tags: ["助眠"] },
    { title: "新世纪世界音乐", type: "音乐", why: "氛围节奏。", length: "中", audiences: ["单人"], tags: ["做饭背景"] },
    { title: "电影原声·宫崎骏", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["全家"], tags: ["做饭背景"], elderFriendly: true },
    { title: "电影原声·哈利波特", type: "音乐", why: "做饭氛围。", length: "中", audiences: ["全家"], tags: ["做饭背景"] },
    // —— 情感 / 故事 ——
    { title: "故事 FM 续集", type: "播客", why: "故事 FM 新一季。", length: "中", audiences: ["单人"], tags: ["故事"] },
    { title: "Steve说·心理学", type: "播客", why: "心理学话题。", length: "中", audiences: ["单人"], tags: ["人文"] },
    { title: "胡说·情感对话", type: "播客", why: "情感话题。", length: "中", audiences: ["单人"], tags: ["情感"] },
    // —— 短播客 ——
    { title: "得到·头条早闻", type: "知识", why: "10 分钟早间新闻。", length: "短", audiences: ["单人"], tags: ["轻知识"] },
    { title: "得到·熊逸说", type: "知识", why: "经典讲读。", length: "中", audiences: ["单人"], tags: ["人文"] },
    { title: "雪球热门股·音频版", type: "知识", why: "财经周报。", length: "短", audiences: ["单人"], tags: ["轻知识"] },
    // —— 旅行 ——
    { title: "旅行的意义·音频版", type: "故事", why: "旅行随笔。", length: "中", audiences: ["单人", "情侣"], tags: ["故事"] },
    { title: "陪你去旅行 喜马拉雅", type: "故事", why: "旅行播客。", length: "中", audiences: ["单人", "情侣"], tags: ["故事"] },
    { title: "国家地理·音频专题", type: "知识", why: "自然地理。", length: "中", audiences: ["全家"], tags: ["人文"], elderFriendly: true },
    // —— 轻知识 ——
    { title: "得到·薛兆丰经济学讲义", type: "知识", why: "经济学入门。", length: "长", audiences: ["单人"], tags: ["轻知识"] },
    { title: "得到·万维钢日课", type: "知识", why: "日更新课。", length: "中", audiences: ["单人"], tags: ["轻知识"] },
    { title: "翻书喵·读书播客", type: "播客", why: "读书闲谈。", length: "中", audiences: ["单人"], tags: ["人文"] },
    { title: "圆桌派 同名播客", type: "播客", why: "圆桌音频版。", length: "长", audiences: ["双人"], tags: ["人文"] },
    // —— 美食 ——
    { title: "听说很好吃 同名播客", type: "播客", why: "美食播客。", length: "中", audiences: ["朋友"], tags: ["故事"] },
    { title: "深夜厨房", type: "播客", why: "美食 + 故事。", length: "中", audiences: ["单人", "情侣"], tags: ["故事"] },
    // —— 老人专题 ——
    { title: "中央广播·新闻和报纸摘要", type: "知识", why: "老人爱听。", length: "短", audiences: ["长辈友好"], tags: ["轻知识"], elderFriendly: true },
    { title: "中央人民广播·相声大会", type: "音乐", why: "经典相声。", length: "中", audiences: ["长辈友好", "全家"], tags: ["做饭背景"], elderFriendly: true },
    { title: "中央人民广播·京剧选段", type: "音乐", why: "戏曲。", length: "中", audiences: ["长辈友好"], tags: ["做饭背景"], elderFriendly: true },
    { title: "广东粤剧选段", type: "音乐", why: "广东戏。", length: "中", audiences: ["长辈友好"], tags: ["做饭背景"], elderFriendly: true },
    { title: "评书·三国演义", type: "故事", why: "经典评书。", length: "长", audiences: ["长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "评书·水浒传", type: "故事", why: "经典评书。", length: "长", audiences: ["长辈友好"], tags: ["故事"], elderFriendly: true },
    { title: "评书·杨家将", type: "故事", why: "经典评书。", length: "长", audiences: ["长辈友好"], tags: ["故事"], elderFriendly: true },
    // 音乐 续 — 70+
    ...["林俊杰精选", "梁静茹精选", "孙燕姿精选", "蔡依林精选", "王力宏精选", "莫文蔚精选", "刘若英精选", "李宗盛精选", "罗大佑精选", "邓紫棋精选", "李荣浩精选", "薛之谦精选", "毛不易精选", "周深精选", "邓丽君再选", "蔡琴金曲", "韩红精选", "张惠妹精选", "孙楠经典", "汪峰经典", "GAI 周延选", "薛凯琪粤语精选", "陈百强经典", "张国荣经典", "Beyond 经典", "Twins 怀旧", "韩国 BTS 精选", "韩国 IU 精选", "韩国 BLACKPINK 精选", "日本米津玄师精选", "日本 Aimer 精选", "日本嵐选辑", "Ed Sheeran 精选", "Bruno Mars 精选", "John Mayer 精选", "Norah Jones 精选", "Frank Sinatra 经典", "Bob Marley 雷鬼经典", "Jay-Z + Kanye 嘻哈经典", "K-Pop 工作流"]
      .map((title) => ({ title, type: "音乐" as AudioType, why: `做饭氛围/通勤背景音 — ${title}。`, length: "中" as const, audiences: ["朋友", "情侣", "全家"] as AudienceTag[], tags: ["做饭背景"] as AudioItem["tags"] })),
    // 播客 续
    ...["八分（梁文道）", "随时事·新闻播客", "每天读点书", "好奇心日报·音频版", "声入人心 续", "怪物之力", "婧物语·情感", "津津乐道·科技", "迟早更新", "津津乐道·商业", "苗师傅·数据科学", "三联·中读", "看理想·音频精选", "南方周末·音频"]
      .map((title) => ({ title, type: "播客" as AudioType, why: `${title} — 做饭充电。`, length: "中" as const, audiences: ["单人", "双人"] as AudienceTag[], tags: ["轻知识"] as AudioItem["tags"] })),
    // 助眠 续
    ...["森林晨曦", "海岸夜潮", "山间溪流", "暴雨夜店", "黑胶白噪音", "图书馆白噪音"]
      .map((title) => ({ title, type: "助眠" as AudioType, why: `${title}。`, length: "中" as const, audiences: ["单人"] as AudienceTag[], tags: ["助眠"] as AudioItem["tags"] })),
  ];
  return tpls.map((t, i) => ({
    id: `ax${i + 100}`,
    title: t.title,
    type: t.type,
    why: t.why,
    length: t.length,
    audiences: t.audiences,
    tags: t.tags,
    elderFriendly: t.elderFriendly,
    kidSafe: t.kidSafe,
  }));
}
