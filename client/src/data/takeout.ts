// 外卖优惠策略数据：纯数据，方便 check-recommend 校验，并与 UI 解耦。
// 静态站点不调用任何外卖平台 API，这里仅给经验性建议 + 公开搜索入口的描述文本。

export type BudgetId = "u15" | "b15-25" | "b25-40" | "b40-60" | "o60";

export interface BudgetTier {
  id: BudgetId;
  label: string;
  range: string;
  /** 适用人数提示 */
  for: string;
  /** 推荐品类 / 店铺类型 */
  picks: { name: string; reason: string; emoji: string }[];
  /** 怎么凑券 */
  coupon: string[];
  /** 风险 / 提醒 */
  risks: string[];
}

export const BUDGETS: BudgetTier[] = [
  {
    id: "u15",
    label: "15 元以下",
    range: "0 - 15 元",
    for: "单人快速 · 一人食",
    picks: [
      { name: "粥铺 / 早餐铺", reason: "皮蛋瘦肉粥 + 油条/包子，常年 8-12 元就能吃饱。", emoji: "🥣" },
      { name: "兰州拉面 · 沙县小吃", reason: "10-13 元一碗牛肉拉面 / 蒸饺套餐，平台常有 5-3 元神券。", emoji: "🍜" },
      { name: "便利店便当（罗森/全家/便利蜂）", reason: "10-15 元主食饭团/三明治，配 3 元立减券。", emoji: "🍱" },
      { name: "麦当劳穷鬼套餐 / 肯德基疯狂星期四", reason: "13.9 / 9.9 限时套餐，配大额满减后比堂食还低。", emoji: "🍔" },
    ],
    coupon: [
      "美团/饿了么开会员可叠 5-3 / 7-3 大额神券",
      "新店首单立减常见 5-10 元",
      "优先选「3 公里内」减少配送费",
    ],
    risks: [
      "起送价常见 10-15 元，可能凑不够要加配菜",
      "配送费 2-5 元会拉高实际支出，注意「实付价」",
    ],
  },
  {
    id: "b15-25",
    label: "15 - 25 元",
    range: "15 - 25 元",
    for: "单人正餐 · 工作日午晚餐",
    picks: [
      { name: "黄焖鸡米饭 / 麻辣烫", reason: "20 元饱腹，米饭 + 蛋 + 菜组合，平台券后实付 16-18 元。", emoji: "🍲" },
      { name: "小份盖饭 / 砂锅面", reason: "18-22 元一份，搭配 1 杯豆浆/酸梅汤更满足。", emoji: "🍛" },
      { name: "麦/肯/塔/汉堡王 单人套餐", reason: "20-25 元区间能吃到主餐 + 小食 + 饮料，神券 + 叠会员价更划算。", emoji: "🍔" },
      { name: "茶饮+点心（喜茶/古茗/瑞幸）", reason: "下午茶 18-22 元一份，凑「第二杯半价」更优。", emoji: "🥤" },
    ],
    coupon: [
      "8-3 / 12-5 神券档位，叠红包雨可到 5 元抵扣",
      "美团「大牌会员」按品牌续券，常用品牌别错过",
      "抖音本地生活的「次卡」预购更便宜（限到店）",
    ],
    risks: [
      "20 元档常被起送价 + 配送费拉到 25-28 元，可加一份小菜达到满减门槛",
      "外卖正餐时段（11:30-13:00, 17:30-19:30）配送费上浮",
    ],
  },
  {
    id: "b25-40",
    label: "25 - 40 元",
    range: "25 - 40 元",
    for: "单人改善 · 双人 AA",
    picks: [
      { name: "本帮 / 川菜 / 粤菜小馆 单人套餐", reason: "30 元能拿到 1 主菜 + 半份蔬菜 + 米饭，比外面正餐便宜。", emoji: "🍱" },
      { name: "牛肉米线 / 重庆小面 / 胡辣汤套餐", reason: "30-35 元区间常有大份 + 卤味组合。", emoji: "🍜" },
      { name: "披萨 / 意面（必胜客/萨莉亚）", reason: "30-40 元单人份意面/9 寸披萨，叠满 30-10 后接近 25 元。", emoji: "🍕" },
      { name: "日式定食 / 寿司外带", reason: "鳗鱼饭/亲子丼 35-38 元一份，平台满 35-12 神券。", emoji: "🍣" },
    ],
    coupon: [
      "「满 30-10」「满 39-15」是常见档，一定要凑满",
      "美团/饿了么会员积分换券；抖音平台多用次卡",
      "周一 / 周四的「品牌日」叠加红包雨更省",
    ],
    risks: [
      "凑单可能买到吃不完的小食，注意「能不能吃下」",
      "高单价店常忽悠拼套餐，建议看下「人均」筛掉黑店",
    ],
  },
  {
    id: "b40-60",
    label: "40 - 60 元",
    range: "40 - 60 元",
    for: "双人共享 · 家庭轻晚餐",
    picks: [
      { name: "硬菜 + 主食组合（红烧肉饭 / 黄焖排骨 / 牛肉锅）", reason: "50 元区间能拿到带肉的硬菜套餐，分量足。", emoji: "🍖" },
      { name: "韩式炸鸡 / 烤肉拌饭双人份", reason: "50-58 元能买到 1 全鸡 + 配菜，2 人吃刚好。", emoji: "🍗" },
      { name: "粤式烧腊（叉烧 / 烧鸭饭）双拼饭", reason: "45-55 元双拼饭量足，配例汤更稳。", emoji: "🦆" },
      { name: "日料拼盘 / 寿司套餐", reason: "55-60 元 18 件寿司套餐适合双人共享。", emoji: "🍣" },
    ],
    coupon: [
      "「满 50-20」「满 60-25」档位是关键，按差额凑",
      "美团神会员叠 8-3 + 12-5 可到 8-13 元抵扣",
      "下午时段（14:00-17:00）有「下午茶神券」",
    ],
    risks: [
      "双人份起送可能 35 元起，注意人数提前规划",
      "高峰期实际配送可能 40+ 分钟，急吃的话要避开",
    ],
  },
  {
    id: "o60",
    label: "60 元以上",
    range: "60 元起 · 家庭多人",
    for: "全家用餐 · 朋友聚餐 · 大份外带",
    picks: [
      { name: "披萨 + 鸡翅 + 沙拉的家庭套餐（必胜客/达美乐）", reason: "80-100 元家庭分享套餐，叠 99-30 后实付 70 元上下。", emoji: "🍕" },
      { name: "外卖火锅（海底捞 / 小龙坎）", reason: "100-150 元 2-3 人份小锅 + 配菜礼盒，配送锅具。", emoji: "🍲" },
      { name: "粤式烧腊 / 烤鸭半只 + 配菜", reason: "85-110 元 3 人份组合，米饭单买。", emoji: "🦆" },
      { name: "中餐家宴拼盘（4 菜 1 汤）", reason: "100-130 元能搞定 3-4 人晚餐，记得选「大份」。", emoji: "🥘" },
    ],
    coupon: [
      "「满 99-30」「满 128-40」是大单红利档，必须凑足",
      "京东秒送 / 美团闪购的「跨店满减」会拉低单价",
      "抖音直播间常有 9.9 套餐券，到店 / 外卖均可",
    ],
    risks: [
      "大单配送费可能 8-15 元，建议自取或拼团",
      "套餐附带饮料，如果不喝可以让商家备注换菜，并不一定会换",
      "高峰下单建议提前 30-60 分钟预约，避免送到都凉了",
    ],
  },
];

export interface PlatformDef {
  id: string;
  label: string;
  hint: string;
  buildSearch: (q: string) => string;
  /** 是否需要登录提示 */
  needsLogin?: boolean;
}

export const PLATFORMS: PlatformDef[] = [
  {
    id: "meituan",
    label: "美团外卖",
    hint: "稳定搜索入口（百度站内）",
    // 美团外卖 H5 搜索 URL 多次改版，直链常常跳到 error_page。
    // v2: 走百度站内搜索 site:meituan.com，确保用户点开有结果。
    buildSearch: (q) =>
      `https://www.baidu.com/s?wd=${encodeURIComponent("site:meituan.com 外卖 " + q)}`,
    needsLogin: false,
  },
  {
    id: "eleme",
    label: "饿了么",
    hint: "阿里系 / 88VIP 优惠",
    buildSearch: (q) => `https://www.ele.me/search?keyword=${encodeURIComponent(q)}`,
    needsLogin: true,
  },
  {
    id: "douyin",
    label: "抖音本地生活",
    hint: "团购券 + 直播秒杀",
    buildSearch: (q) =>
      `https://www.douyin.com/search/${encodeURIComponent(q + " 外卖")}`,
  },
  {
    id: "jd",
    label: "京东秒送",
    hint: "京东系 / 大牌正餐外送",
    buildSearch: (q) => `https://search.jd.com/Search?keyword=${encodeURIComponent(q + " 外卖")}`,
  },
  {
    id: "baidu",
    label: "百度搜索",
    hint: "兜底入口",
    buildSearch: (q) =>
      `https://www.baidu.com/s?wd=${encodeURIComponent(q + " 外卖优惠 红包")}`,
  },
];
