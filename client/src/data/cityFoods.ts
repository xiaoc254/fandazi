// 旅行美食数据：内置 40+ 城市的特色美食 / 小吃 / 饮品。
// 数据偏向「打卡美食」语境，便于陌生城市快速决定吃什么。
// 不包含商户 / 实时数据，跳转到第三方搜索由 UI 处理。

export interface CityFoodItem {
  /** 菜品 / 食物名 */
  name: string;
  /** 一句话特色 */
  desc: string;
  /** 适合人群 / 标签 */
  tags?: string[];
}

export interface CityFood {
  /** 城市中文名 */
  city: string;
  /** 所属省份 / 直辖市 */
  province: string;
  /** 关联的菜系 / 地域风格 */
  cuisine?: string;
  /** 一句话城市美食概况 */
  vibe: string;
  /** 推荐食物清单 */
  items: CityFoodItem[];
}

export const CITY_FOODS: CityFood[] = [
  {
    city: "北京",
    province: "北京",
    cuisine: "京菜",
    vibe: "酱香、面食、卤煮，胡同里的烟火气。",
    items: [
      { name: "北京烤鸭", desc: "皮脆肉嫩，配荷叶饼黄瓜葱白甜面酱。", tags: ["招牌"] },
      { name: "炸酱面", desc: "黄豆酱+甜面酱+五花肉丁，黄瓜丝豆芽配菜码。" },
      { name: "卤煮火烧", desc: "猪肠猪肺豆腐汤底浓郁，本地夜宵神。" },
      { name: "豆汁焦圈", desc: "酸味豆汁配脆焦圈，老北京早餐试胆。" },
      { name: "爆肚", desc: "牛肚切片高汤汆，麻酱蘸料口感清脆。" },
      { name: "驴打滚", desc: "黄豆面糯米卷红豆沙，甜糯软香。", tags: ["甜品"] },
    ],
  },
  {
    city: "上海",
    province: "上海",
    cuisine: "本帮 / 江浙",
    vibe: "浓油赤酱、清淡甜润，本帮+港台融合。",
    items: [
      { name: "生煎包", desc: "底脆顶嫩，咬开一口汤汁。", tags: ["招牌"] },
      { name: "小笼包", desc: "皮薄汁多，南翔最出名。" },
      { name: "葱油拌面", desc: "焦葱拌细面，简单到极致的家常香。" },
      { name: "本帮红烧肉", desc: "甜咸厚重肥而不腻。" },
      { name: "蟹粉小笼", desc: "秋季限定，蟹黄蟹肉拌猪肉馅。" },
      { name: "腌笃鲜", desc: "鲜咸笃汤，火腿腊肉鲜竹笋同煲。" },
    ],
  },
  {
    city: "广州",
    province: "广东",
    cuisine: "粤菜",
    vibe: "早茶夜茶、清淡鲜甜，食在广州。",
    items: [
      { name: "白切鸡", desc: "皮黄肉嫩配姜葱蓉，粤菜灵魂。" },
      { name: "肠粉", desc: "薄滑米皮+酱油，早餐之王。", tags: ["早餐"] },
      { name: "虾饺", desc: "粉皮透明、虾仁弹牙。" },
      { name: "烧鹅", desc: "皮脆肉嫩，配酸梅酱。" },
      { name: "煲仔饭", desc: "腊味+米饭锅巴。" },
      { name: "糖水 双皮奶", desc: "顺德炼乳奶皮，甜润不腻。", tags: ["甜品"] },
    ],
  },
  {
    city: "深圳",
    province: "广东",
    cuisine: "粤菜 / 融合",
    vibe: "全国胃，潮汕粤菜+内陆移民聚集。",
    items: [
      { name: "潮汕牛肉火锅", desc: "现切牛肉清汤涮，配沙茶酱。" },
      { name: "肠粉", desc: "深圳布吉肠粉酱汁更咸鲜。" },
      { name: "客家盐焗鸡", desc: "整鸡盐焗皮黄肉烫。" },
      { name: "椰子鸡", desc: "椰子水煮土鸡，清润不上火。" },
      { name: "猪肚鸡", desc: "胡椒猪肚鸡汤，温胃驱寒。" },
    ],
  },
  {
    city: "成都",
    province: "四川",
    cuisine: "川菜",
    vibe: "麻辣鲜香，市井小吃、火锅冠军城。",
    items: [
      { name: "成都火锅", desc: "牛油红汤+鸭肠毛肚黄喉。", tags: ["招牌"] },
      { name: "钵钵鸡", desc: "冷锅串串酱料浓郁，清爽酸辣。" },
      { name: "夫妻肺片", desc: "牛肉牛杂凉拌，麻辣香酥花生。" },
      { name: "担担面", desc: "麻酱花椒+碎米芽菜，香辣开胃。" },
      { name: "回锅肉", desc: "灯盏窝形+郫县豆瓣酱+蒜苗。" },
      { name: "三大炮", desc: "糯米团撞案板出名，红糖黄豆面。", tags: ["甜品"] },
    ],
  },
  {
    city: "重庆",
    province: "重庆",
    cuisine: "川菜",
    vibe: "重辣麻辣、江湖菜，山城火锅圣地。",
    items: [
      { name: "重庆火锅", desc: "九宫格牛油老灶，毛肚鸭肠经典。", tags: ["招牌"] },
      { name: "小面", desc: "麻辣酱料拌细面，早餐顶饱。", tags: ["早餐"] },
      { name: "酸辣粉", desc: "红薯粉条+泡椒+花生黄豆，鼻尖出汗。" },
      { name: "毛血旺", desc: "鸭血+毛肚+黄豆芽红汤煮制。" },
      { name: "辣子鸡", desc: "干辣椒堆里翻找鸡丁，香脆下酒。" },
    ],
  },
  {
    city: "西安",
    province: "陕西",
    cuisine: "西北",
    vibe: "面食天堂、肉夹馍故乡，夜市烟火浓。",
    items: [
      { name: "肉夹馍", desc: "腊汁肉+白吉馍，陕西汉堡。", tags: ["招牌"] },
      { name: "羊肉泡馍", desc: "牛羊肉清汤掰馍，配糖蒜辣酱。" },
      { name: "biangbiang面", desc: "宽如裤带，油泼辣子+蒜蓉。" },
      { name: "凉皮", desc: "夏日凉拌，麻酱辣椒油配黄瓜丝。" },
      { name: "胡辣汤", desc: "牛肉粉条+多种香料，回民早餐汤。", tags: ["早餐"] },
      { name: "甑糕", desc: "糯米枣泥红豆蒸糕，甜糯软香。", tags: ["甜品"] },
    ],
  },
  {
    city: "杭州",
    province: "浙江",
    cuisine: "江浙",
    vibe: "湖光山色，淡雅鲜甜的江南味。",
    items: [
      { name: "西湖醋鱼", desc: "草鱼蒸熟浇酸甜醋汁，拼花刀讲究。" },
      { name: "龙井虾仁", desc: "茶香虾仁清炒，色清味雅。" },
      { name: "东坡肉", desc: "整块红烧软糯入味。" },
      { name: "片儿川", desc: "雪菜笋片肉丝面，杭州人最日常。" },
      { name: "葱包烩", desc: "薄饼裹油条葱花，街头小吃。" },
    ],
  },
  {
    city: "南京",
    province: "江苏",
    cuisine: "江浙",
    vibe: "鸭都、面食与江鲜，节令性强。",
    items: [
      { name: "盐水鸭", desc: "皮白肉粉，淡雅咸香，金陵第一鸭。" },
      { name: "鸭血粉丝汤", desc: "鸭血鸭肝粉丝汤，配鸭油烧饼。" },
      { name: "鸭油烧饼", desc: "鸭油酥皮咸香，街头早点。", tags: ["早餐"] },
      { name: "牛肉锅贴", desc: "煎得焦脆，咬开汤汁。" },
      { name: "糖芋苗", desc: "桂花糖渍小芋头，老式甜品。", tags: ["甜品"] },
    ],
  },
  {
    city: "苏州",
    province: "江苏",
    cuisine: "江浙",
    vibe: "面食+船点+苏式糕，雅致甜润。",
    items: [
      { name: "苏式汤面", desc: "焖肉/爆鳝/三虾浇头，白汤清亮。" },
      { name: "松鼠鳜鱼", desc: "酸甜挂汁、形如松鼠，江南名菜。" },
      { name: "蟹粉小笼", desc: "秋季限定，蟹油渗皮。" },
      { name: "桂花糖芋艿", desc: "甜糯软香，秋季应季。", tags: ["甜品"] },
      { name: "鲜肉月饼", desc: "酥皮裹咸鲜肉馅，中秋限定。" },
    ],
  },
  {
    city: "武汉",
    province: "湖北",
    cuisine: "鄂菜",
    vibe: "过早文化，热干面+豆皮街头开战。",
    items: [
      { name: "热干面", desc: "麻酱碱面+酸豆角萝卜丁。", tags: ["早餐", "招牌"] },
      { name: "豆皮", desc: "蛋皮+糯米+猪肉香菇丁，老通城出名。" },
      { name: "周黑鸭", desc: "卤鸭脖鸭翅，麻辣甜咸。" },
      { name: "面窝", desc: "圆环面饼，外酥内软。" },
      { name: "排骨藕汤", desc: "湖北炖汤经典，粉藕酥软。" },
    ],
  },
  {
    city: "长沙",
    province: "湖南",
    cuisine: "湘菜",
    vibe: "辣到极致 + 湘味小吃，夜宵之城。",
    items: [
      { name: "剁椒鱼头", desc: "胖头鱼+剁椒+蒸出汁。", tags: ["招牌"] },
      { name: "口味虾", desc: "深夜大排档香辣龙虾。" },
      { name: "臭豆腐", desc: "黑豆腐酥皮内嫩，火宫殿名小吃。" },
      { name: "糖油粑粑", desc: "糯米团子糖浆裹，软糯甜香。", tags: ["甜品"] },
      { name: "米粉", desc: "湖南米粉宽细均有，配酸豆角。" },
    ],
  },
  {
    city: "天津",
    province: "天津",
    cuisine: "津菜",
    vibe: "煎饼果子、狗不理、相声同款早茶味。",
    items: [
      { name: "煎饼果子", desc: "绿豆面糊+鸡蛋+果篦+面酱。", tags: ["早餐", "招牌"] },
      { name: "狗不理包子", desc: "薄皮大馅、十八褶。" },
      { name: "锅巴菜", desc: "煎饼切条+卤汁+腐乳，天津人专属早餐。" },
      { name: "耳朵眼炸糕", desc: "糯米皮+豆沙馅，外酥内糯。", tags: ["甜品"] },
    ],
  },
  {
    city: "青岛",
    province: "山东",
    cuisine: "鲁菜 / 海鲜",
    vibe: "海风+扎啤+海鲜大排档。",
    items: [
      { name: "鲅鱼水饺", desc: "鲅鱼肉糜韭菜馅，鲜海鱼风味。" },
      { name: "辣炒蛤蜊", desc: "蛤蜊+小米辣下啤酒。" },
      { name: "海鲜烧烤", desc: "扇贝生蚝鱿鱼海螺。" },
      { name: "青岛大虾", desc: "白灼蘸醋，秋季最肥美。" },
    ],
  },
  {
    city: "济南",
    province: "山东",
    cuisine: "鲁菜",
    vibe: "鲁菜本宗：糖醋、葱烧、油爆。",
    items: [
      { name: "糖醋鲤鱼", desc: "黄河鲤鱼+糖醋汁，喜庆名菜。" },
      { name: "葱烧海参", desc: "大葱段+海参慢煨，鲁菜代表作。" },
      { name: "把子肉", desc: "酱油卤五花肉块，配米饭一绝。" },
      { name: "甜沫", desc: "小米面咸粥+花生，济南人早餐。", tags: ["早餐"] },
    ],
  },
  {
    city: "哈尔滨",
    province: "黑龙江",
    cuisine: "东北",
    vibe: "酸菜白肉、铁锅炖、俄式融合。",
    items: [
      { name: "锅包肉", desc: "里脊裹淀粉炸+糖醋酸甜，东北名菜。" },
      { name: "杀猪菜", desc: "酸菜白肉血肠，年节硬菜。" },
      { name: "红肠", desc: "哈尔滨秋林红肠，烟熏咸香。" },
      { name: "铁锅炖", desc: "土鸡/排骨+蘑菇粉条+大铁锅，最暖。" },
      { name: "马迭尔冰棍", desc: "中央大街必试俄式奶味雪糕。", tags: ["甜品"] },
    ],
  },
  {
    city: "沈阳",
    province: "辽宁",
    cuisine: "东北",
    vibe: "硬菜+面食+酸菜白肉。",
    items: [
      { name: "老边饺子", desc: "蒸饺皮薄馅大。" },
      { name: "鸡架", desc: "卤味/熏制/炒制都好下酒。" },
      { name: "鸡蛋酱", desc: "大酱+鸡蛋+蘸蔬菜的老味道。" },
      { name: "辽菜锅包肉", desc: "经典甜口，外酥内嫩。" },
    ],
  },
  {
    city: "大连",
    province: "辽宁",
    cuisine: "海鲜",
    vibe: "海鲜+俄式，海风咸甜。",
    items: [
      { name: "海胆蒸蛋", desc: "海胆铺蒸蛋，鲜到舌尖。" },
      { name: "焖子", desc: "地瓜淀粉煎炸+麻酱蒜泥酱油。" },
      { name: "海鲜烧烤", desc: "扇贝鱿鱼鲍鱼烤盘上桌。" },
    ],
  },
  {
    city: "厦门",
    province: "福建",
    cuisine: "闽南",
    vibe: "海岛慢生活，沙茶+海鲜+小吃。",
    items: [
      { name: "沙茶面", desc: "沙茶酱+海鲜+面，闽南早餐。", tags: ["早餐"] },
      { name: "蚝仔煎", desc: "海蛎+鸡蛋+地瓜粉煎，外酥内嫩。" },
      { name: "土笋冻", desc: "海星虫熬胶冻，配酸醋蒜末。" },
      { name: "花生汤", desc: "花生煮到软烂+鸡蛋甜汤。", tags: ["甜品"] },
    ],
  },
  {
    city: "福州",
    province: "福建",
    cuisine: "闽菜",
    vibe: "佛跳墙故乡，鱼丸海鲜清鲜风。",
    items: [
      { name: "佛跳墙", desc: "鲍鱼海参鱼翅干贝同煨。" },
      { name: "鱼丸", desc: "包馅鱼肉丸+紫菜汤。" },
      { name: "肉燕", desc: "肉皮包肉糜的福州独特馄饨。" },
      { name: "锅边糊", desc: "米浆糊+海鲜配料，早餐选项。", tags: ["早餐"] },
    ],
  },
  {
    city: "潮州",
    province: "广东",
    cuisine: "潮汕",
    vibe: "牛肉火锅、卤水、工夫茶。",
    items: [
      { name: "潮汕牛肉火锅", desc: "现切牛肉清汤涮，配沙茶酱。" },
      { name: "潮汕卤鹅", desc: "整只卤香酱色，老母鹅最好。" },
      { name: "蚝烙", desc: "海蛎+番薯粉煎成酥饼。" },
      { name: "工夫茶", desc: "凤凰单丛冲泡，需小杯频饮。", tags: ["饮品"] },
      { name: "鸭母捻", desc: "汤圆+绿豆莲子白果，元宵节甜品。", tags: ["甜品"] },
    ],
  },
  {
    city: "汕头",
    province: "广东",
    cuisine: "潮汕",
    vibe: "海鲜与牛肉的潮汕双绝。",
    items: [
      { name: "牛肉丸", desc: "手打弹牙，沙茶蘸料。" },
      { name: "蚝烙", desc: "潮汕街头小吃。" },
      { name: "粿条", desc: "炒/汤皆可，加牛肉肉丸。" },
      { name: "白粥配杂咸", desc: "潮汕宵夜，搭咸菜豆腐乳。" },
    ],
  },
  {
    city: "兰州",
    province: "甘肃",
    cuisine: "西北",
    vibe: "牛肉面之都，清晨一碗面醒胃。",
    items: [
      { name: "兰州牛肉面", desc: "一清二白三红四绿五黄。", tags: ["招牌", "早餐"] },
      { name: "灰豆子", desc: "豌豆+红枣慢煮的甜汤。", tags: ["甜品"] },
      { name: "酿皮", desc: "面皮+辣油芥末，西北凉粉。" },
      { name: "羊肉串", desc: "新疆/西北烤串，孜然辣椒粉。" },
    ],
  },
  {
    city: "乌鲁木齐",
    province: "新疆",
    cuisine: "新疆",
    vibe: "大盘鸡、馕、羊肉串，戈壁风味。",
    items: [
      { name: "大盘鸡", desc: "鸡块土豆青椒红汤+皮带面。" },
      { name: "羊肉串", desc: "炭火直烤+孜然辣椒粉。" },
      { name: "手抓饭", desc: "羊肉胡萝卜大米焖煮。" },
      { name: "馕", desc: "馕坑烤面饼，搭配奶茶。" },
      { name: "酸奶子", desc: "本地奶酪奶酸，加蜂蜜。", tags: ["饮品"] },
    ],
  },
  {
    city: "拉萨",
    province: "西藏",
    cuisine: "藏菜",
    vibe: "酥油茶+牦牛+青稞，雪域风味。",
    items: [
      { name: "酥油茶", desc: "酥油+砖茶+盐打成，高原必饮。", tags: ["饮品"] },
      { name: "藏面", desc: "牦牛汤+碱水面，简单原味。" },
      { name: "牦牛肉干", desc: "干嚼有嚼劲，麻辣或原味。" },
      { name: "藏式甜茶", desc: "锡兰红茶+牛奶+糖。", tags: ["饮品"] },
      { name: "土豆包子", desc: "藏式蒸包，土豆肉馅。" },
    ],
  },
  {
    city: "昆明",
    province: "云南",
    cuisine: "云南",
    vibe: "鲜花野菌米线，热带高原风。",
    items: [
      { name: "过桥米线", desc: "高汤现烫，米线滑爽。", tags: ["招牌"] },
      { name: "野生菌火锅", desc: "雨季限定鸡枞松茸鲜美。" },
      { name: "鲜花饼", desc: "玫瑰花酱酥皮饼。", tags: ["甜品"] },
      { name: "汽锅鸡", desc: "云南汽锅蒸出鸡汤精华。" },
    ],
  },
  {
    city: "丽江",
    province: "云南",
    cuisine: "云南",
    vibe: "古城慢生活，腊排骨与酥油茶。",
    items: [
      { name: "腊排骨火锅", desc: "纳西风味腊味+蔬菜锅。" },
      { name: "丽江粑粑", desc: "面饼夹芝麻或火腿。" },
      { name: "三文鱼三吃", desc: "刺身/烤/煮汤，本地虹鳟。" },
    ],
  },
  {
    city: "大理",
    province: "云南",
    cuisine: "云南",
    vibe: "苍山洱海慢风，乳扇与酸辣鱼。",
    items: [
      { name: "酸辣鱼", desc: "洱海鲫鱼+酸木瓜辣椒。" },
      { name: "乳扇", desc: "白族乳制品炸/烤，配蜂蜜。" },
      { name: "饵丝", desc: "大米压成的米线状，过油肉浇头。" },
    ],
  },
  {
    city: "贵阳",
    province: "贵州",
    cuisine: "贵州",
    vibe: "酸辣并重，折耳根来一份。",
    items: [
      { name: "丝娃娃", desc: "薄面皮裹各色凉拌菜+酸汤。" },
      { name: "酸汤鱼", desc: "凯里红酸汤煮黑鱼，酸到开胃。" },
      { name: "肠旺面", desc: "猪肠+血旺+碱水面+辣油。" },
      { name: "豆腐圆子", desc: "豆腐压成饼煎，配辣椒水。" },
    ],
  },
  {
    city: "桂林",
    province: "广西",
    cuisine: "桂菜",
    vibe: "山水甲天下，米粉酸笋香。",
    items: [
      { name: "桂林米粉", desc: "卤水牛肉米粉+酸豆角酸笋。", tags: ["招牌"] },
      { name: "啤酒鱼", desc: "漓江鱼+啤酒+番茄酱焖煮。" },
      { name: "油茶", desc: "恭城瑶族咸味油茶，配米花。", tags: ["饮品"] },
    ],
  },
  {
    city: "南宁",
    province: "广西",
    cuisine: "桂菜",
    vibe: "老友粉、柠檬鸭，酸辣在嘴边跳。",
    items: [
      { name: "老友粉", desc: "酸笋豆豉辣椒+米粉，开胃醒神。" },
      { name: "柠檬鸭", desc: "酸柠檬腌+鸭肉，清新解腻。" },
      { name: "卷筒粉", desc: "薄米皮卷馅+酱油醋。" },
    ],
  },
  {
    city: "柳州",
    province: "广西",
    cuisine: "桂菜",
    vibe: "螺蛳粉发源地，酸笋臭得让人上头。",
    items: [
      { name: "螺蛳粉", desc: "螺蛳熬汤+酸笋木耳花生腐竹。", tags: ["招牌"] },
      { name: "酸辣米粉", desc: "本地另一国民选项。" },
    ],
  },
  {
    city: "海口",
    province: "海南",
    cuisine: "琼菜",
    vibe: "椰风海韵，文昌鸡+海南粉。",
    items: [
      { name: "文昌鸡", desc: "海南名鸡，皮黄肉嫩配白米饭。" },
      { name: "海南粉", desc: "细米粉+花生芝麻酱+卤汁。" },
      { name: "清补凉", desc: "椰奶+多种豆类水果，夏日甜汤。", tags: ["饮品", "甜品"] },
    ],
  },
  {
    city: "三亚",
    province: "海南",
    cuisine: "海鲜",
    vibe: "热带海岛，海鲜+椰子。",
    items: [
      { name: "椰子鸡", desc: "椰子水煮文昌鸡。" },
      { name: "和乐蟹", desc: "海南四大名菜之一。" },
      { name: "鲜椰子汁", desc: "椰子直接削开吸饮。", tags: ["饮品"] },
    ],
  },
  {
    city: "石家庄",
    province: "河北",
    cuisine: "冀菜",
    vibe: "驴肉火烧、宫面与古早家常。",
    items: [
      { name: "驴肉火烧", desc: "驴肉夹焦皮火烧，河北家常。" },
      { name: "正定八大碗", desc: "宴席八碗肉菜组合。" },
    ],
  },
  {
    city: "郑州",
    province: "河南",
    cuisine: "豫菜",
    vibe: "胡辣汤+烩面+羊肉汤，中原硬胃口。",
    items: [
      { name: "胡辣汤", desc: "牛肉海带粉条多种香料浓汤。", tags: ["早餐"] },
      { name: "郑州烩面", desc: "宽面+羊肉/牛肉汤+海带豆腐。" },
      { name: "羊肉汤", desc: "白浓汤+羊肉片+葱花胡椒粉。" },
    ],
  },
  {
    city: "合肥",
    province: "安徽",
    cuisine: "徽菜",
    vibe: "徽菜重油重酱，臭鳜鱼与毛豆腐。",
    items: [
      { name: "臭鳜鱼", desc: "微臭后鲜，徽菜代表作。" },
      { name: "毛豆腐", desc: "豆腐发酵长白毛，煎得焦香。" },
      { name: "徽州刀板香", desc: "腊肉竹笋同蒸。" },
    ],
  },
  {
    city: "南昌",
    province: "江西",
    cuisine: "赣菜",
    vibe: "辣得直接，瓦罐汤与拌粉。",
    items: [
      { name: "瓦罐汤", desc: "小瓦罐慢炖，肉饼蛋炖蛋汤。" },
      { name: "南昌拌粉", desc: "拌米粉+萝卜干花生酸豆角。" },
      { name: "藜蒿炒腊肉", desc: "鄱阳湖野菜+腊肉香味。" },
    ],
  },
  {
    city: "太原",
    province: "山西",
    cuisine: "晋菜",
    vibe: "面食 100 种、醋香十足。",
    items: [
      { name: "刀削面", desc: "削面入汤+番茄牛肉浇头。" },
      { name: "莜面栲栳栳", desc: "莜麦蒸卷+羊肉臊子。" },
      { name: "过油肉", desc: "山西名菜，酸甜咸鲜。" },
    ],
  },
  {
    city: "呼和浩特",
    province: "内蒙古",
    cuisine: "蒙菜",
    vibe: "羊肉、奶茶、烧麦草原味。",
    items: [
      { name: "烧麦", desc: "羊肉大葱馅，蒸笼现做。", tags: ["早餐"] },
      { name: "手把肉", desc: "整块煮羊肉+蘸料。" },
      { name: "奶茶", desc: "砖茶+牛奶+小米炒米。", tags: ["饮品"] },
    ],
  },
  {
    city: "银川",
    province: "宁夏",
    cuisine: "西北",
    vibe: "羊肉与面食，回民街美食浓。",
    items: [
      { name: "手抓羊肉", desc: "宁夏盐池羊，蘸蒜醋。" },
      { name: "羊杂碎", desc: "羊肉羊杂粉条汤。" },
      { name: "燕面揉揉", desc: "莜麦面拌酱，朴实老味。" },
    ],
  },
  {
    city: "西宁",
    province: "青海",
    cuisine: "青藏",
    vibe: "高原风味，牦牛+酸奶+酥油茶。",
    items: [
      { name: "酿皮", desc: "面筋面皮+辣油芥末，凉爽。" },
      { name: "牦牛肉干", desc: "原味/麻辣，旅游伴手礼。" },
      { name: "甜醅", desc: "青稞发酵+甜汁。", tags: ["饮品", "甜品"] },
    ],
  },
  {
    city: "香港",
    province: "香港",
    cuisine: "粤菜 / 茶餐厅",
    vibe: "早茶 + 茶餐厅 + 街头小吃。",
    items: [
      { name: "茶餐厅菠萝包", desc: "酥皮甜面包夹冰冷黄油。" },
      { name: "丝袜奶茶", desc: "锡兰红茶过滤+淡奶。", tags: ["饮品"] },
      { name: "云吞面", desc: "鲜虾云吞+蛋面+大地鱼汤。" },
      { name: "烧鹅", desc: "皮脆肉嫩配酸梅酱。" },
      { name: "鸡蛋仔", desc: "脆壳软心，铜锣湾街边名物。", tags: ["甜品"] },
    ],
  },
  {
    city: "澳门",
    province: "澳门",
    cuisine: "葡式 / 粤菜",
    vibe: "葡国融合，蛋挞、葡式炒饭、猪扒包。",
    items: [
      { name: "葡式蛋挞", desc: "焦糖斑酥皮+蛋奶馅。", tags: ["甜品", "招牌"] },
      { name: "猪扒包", desc: "面包夹炸猪排+生菜。" },
      { name: "马介休", desc: "葡式咸鳕鱼烹制各式菜。" },
      { name: "木糠布甸", desc: "饼干屑+奶油层叠冷藏甜品。", tags: ["甜品"] },
    ],
  },
  {
    city: "台北",
    province: "台湾",
    cuisine: "台菜",
    vibe: "夜市文化+小吃综合体。",
    items: [
      { name: "牛肉面", desc: "红烧/清炖，永康街最出名。" },
      { name: "卤肉饭", desc: "肉燥淋米饭，台湾国民。" },
      { name: "蚵仔煎", desc: "夜市必点，海蛎+地瓜粉煎。" },
      { name: "珍珠奶茶", desc: "粉圆+红茶+鲜奶。", tags: ["饮品", "招牌"] },
      { name: "盐酥鸡", desc: "九层塔+辣椒粉炸鸡丁。" },
    ],
  },
  {
    city: "宁波",
    province: "浙江",
    cuisine: "江浙",
    vibe: "海鲜+汤圆+黄鱼，咸甜分明。",
    items: [
      { name: "宁波汤圆", desc: "黑芝麻猪油馅，糯米皮软糯。", tags: ["甜品"] },
      { name: "雪菜黄鱼", desc: "雪菜+大黄鱼，鲜咸开胃。" },
      { name: "红膏炝蟹", desc: "盐卤生腌螃蟹，膏满流汁。" },
    ],
  },
  {
    city: "无锡",
    province: "江苏",
    cuisine: "江浙",
    vibe: "甜口偏重，无锡小笼酱排骨。",
    items: [
      { name: "无锡小笼", desc: "皮厚馅甜，区别于上海版。" },
      { name: "酱排骨", desc: "酱红色甜咸入味。" },
      { name: "三凤桥鸭血粉丝", desc: "无锡特色版本。" },
    ],
  },
  {
    city: "西塘 / 乌镇",
    province: "浙江",
    cuisine: "江浙",
    vibe: "水乡小吃，酱鸭+定胜糕+塘菜。",
    items: [
      { name: "酱鸭", desc: "酱卤入味，街头切片。" },
      { name: "定胜糕", desc: "粉色糯米糕，桂花豆沙馅。", tags: ["甜品"] },
      { name: "羊肉面", desc: "湖州/江南羊肉面，红汤汁浓。" },
    ],
  },
];

export const ALL_CITIES = CITY_FOODS.map((c) => c.city);

/** 所有省份/直辖市/特别行政区，按内置城市顺序去重。 */
export const ALL_PROVINCES: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of CITY_FOODS) {
    if (seen.has(c.province)) continue;
    seen.add(c.province);
    out.push(c.province);
  }
  return out;
})();

/** 按省份分组城市。返回顺序与 ALL_PROVINCES 一致。 */
export function citiesGroupedByProvince(): { province: string; cities: CityFood[] }[] {
  const map = new Map<string, CityFood[]>();
  for (const c of CITY_FOODS) {
    const arr = map.get(c.province) ?? [];
    arr.push(c);
    map.set(c.province, arr);
  }
  return ALL_PROVINCES.map((p) => ({ province: p, cities: map.get(p) ?? [] }));
}

/** 根据城市/省份/菜系搜索城市。 */
export function searchCities(q: string): CityFood[] {
  const lower = q.trim().toLowerCase();
  if (!lower) return CITY_FOODS;
  return CITY_FOODS.filter((c) => {
    if (c.city.toLowerCase().includes(lower)) return true;
    if (c.province.toLowerCase().includes(lower)) return true;
    if (c.cuisine?.toLowerCase().includes(lower)) return true;
    if (c.items.some((it) => it.name.toLowerCase().includes(lower))) return true;
    return false;
  });
}
