// v7: 「今天懒人做什么」 — 60+ 懒人简餐模板。
// 设备 / 时间 / 冰箱剩什么 / 目标多维筛选；输出步骤 3-5 条 + 估价 + 估热量 + 适合谁 + 替代食材。
// 不接 AI；纯静态加权。

export type LazyEquipment =
  | "无设备"
  | "空气炸锅"
  | "电饭煲"
  | "早餐机"
  | "微波炉"
  | "一口锅";
export type LazyTime = 5 | 10 | 15 | 30;
export type LazyFridge =
  | "鸡蛋"
  | "米饭"
  | "青菜"
  | "火腿"
  | "鸡胸"
  | "速冻饺子"
  | "面条"
  | "土豆"
  | "番茄"
  | "玉米"
  | "牛奶"
  | "面包"
  | "豆腐"
  | "虾仁";
export type LazyGoal = "省钱" | "减脂" | "治愈" | "儿童" | "长辈";

export interface LazyMeal {
  id: string;
  name: string;
  emoji: string;
  /** 设备列表（命中任一即匹配） */
  equipment: LazyEquipment[];
  /** 估时（分钟） */
  minutes: number;
  /** 用到的食材（用作「冰箱剩什么」匹配） */
  uses: LazyFridge[];
  /** 适合的目标（命中任一即匹配） */
  goals: LazyGoal[];
  /** 估价（元，单人份）*/
  price: number;
  /** 估热量（kcal，单人份）*/
  calories: number;
  steps: string[];
  /** 替代食材建议 */
  swaps?: string;
  /** 一句话推荐理由 */
  reason: string;
  /** 搜索关键词（默认 = name + 做法） */
  searchQuery?: string;
}

export const LAZY_MEALS: LazyMeal[] = [
  // ==== 蛋炒饭家族 ====
  { id: "egg-fried-rice", name: "经典蛋炒饭", emoji: "🍚", equipment: ["一口锅"], minutes: 10, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 6, calories: 520, steps: ["剩米饭散开，鸡蛋打散加少许盐", "热油先炒蛋至嫩半熟", "下米饭翻炒，沿锅边淋一勺生抽，撒葱花"], swaps: "无米饭可换隔夜面条；无葱可省略", reason: "5 分钟救场国民炒饭；越冷的米饭越好炒。" },
  { id: "ham-fried-rice", name: "火腿玉米蛋炒饭", emoji: "🌽", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋", "米饭", "火腿", "玉米"], goals: ["省钱", "儿童"], price: 9, calories: 560, steps: ["火腿切丁，玉米解冻", "鸡蛋滑炒至嫩，盛出", "下米饭炒散，加火腿玉米，回锅鸡蛋；生抽白胡椒翻匀"], swaps: "玉米可换豌豆 / 胡萝卜丁", reason: "颜色好看小朋友爱吃，营养基本到位。" },
  { id: "chaos-fried-rice", name: "乱七八糟炒饭（清冰箱）", emoji: "🍳", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋", "米饭", "青菜", "火腿"], goals: ["省钱", "治愈"], price: 8, calories: 540, steps: ["把冰箱里能切的都切丁：火腿/青菜/胡萝卜", "鸡蛋摊成蛋皮再切丝，备用", "热油爆香蒜末，下料炒香，加米饭和蛋丝；生抽老抽各一勺翻匀"], swaps: "几乎什么都能加，唯一原则是丁要小米饭要散", reason: "懒人版「黄金炒饭」，治愈系冰箱清空神器。" },
  { id: "shrimp-fried-rice", name: "虾仁滑蛋炒饭", emoji: "🍤", equipment: ["一口锅"], minutes: 15, uses: ["鸡蛋", "米饭", "虾仁"], goals: ["治愈", "减脂"], price: 16, calories: 480, steps: ["虾仁解冻擦干，盐料酒抓匀", "热油快速滑虾至变色，盛出", "鸡蛋滑炒至嫩，下米饭翻炒，回锅虾仁，少盐白胡椒"], swaps: "无鲜虾可用速冻虾仁", reason: "扬州炒饭家庭版，蛋白足味道正。" },
  { id: "pickle-fried-rice", name: "酱瓜肉末炒饭", emoji: "🥒", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 8, calories: 580, steps: ["酱瓜切丁，肉末用料酒抓匀", "油锅炒散肉末，下酱瓜炒香", "下米饭和蛋液，翻匀至每粒裹上蛋液"], swaps: "酱瓜可换榨菜 / 萝卜干", reason: "重口下饭，记忆中那勺童年酱瓜炒饭。" },
  { id: "tomato-egg-rice", name: "番茄鸡蛋盖饭", emoji: "🍅", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋", "米饭", "番茄"], goals: ["治愈", "儿童"], price: 7, calories: 520, steps: ["番茄切块，鸡蛋打散", "炒蛋盛出，番茄炒出汁加少许糖盐", "回锅鸡蛋，淋在热米饭上"], swaps: "可加 1 个柿子椒补色", reason: "永远的国民盖饭，10 分钟开饭。" },
  { id: "soy-rice-bowl", name: "酱油拌饭（无设备版）", emoji: "🍚", equipment: ["无设备", "微波炉"], minutes: 5, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 5, calories: 480, steps: ["热米饭打入一个生鸡蛋（怕生菌可用熟鸡蛋切碎）", "淋 1 勺生抽 + 半勺香油 + 少许糖", "撒葱花海苔碎拌匀"], swaps: "可加韩式辣酱变拌饭", reason: "5 分钟吃饱不动脑；全靠一勺好酱油。" },

  // ==== 空气炸锅家族 ====
  { id: "af-chicken-wing", name: "空气炸锅蜜汁鸡翅", emoji: "🍗", equipment: ["空气炸锅"], minutes: 25, uses: [], goals: ["治愈", "儿童"], price: 18, calories: 380, steps: ["鸡翅划两刀，用生抽+蜂蜜+蒜末+黑胡椒腌 15 分钟", "200°C 预热 3 分钟", "翻面 200°C 烤 12 分钟，刷一次蜜汁再烤 3 分钟"], swaps: "蜂蜜可换冰糖水 / 烧烤酱", reason: "家里来小朋友直接封神，不油烟。" },
  { id: "af-chicken-breast", name: "空气炸锅嫩鸡胸", emoji: "🥩", equipment: ["空气炸锅"], minutes: 18, uses: ["鸡胸"], goals: ["减脂"], price: 15, calories: 220, steps: ["鸡胸用盐+黑胡椒+橄榄油腌 10 分钟", "180°C 预热", "180°C 8 分钟，翻面再 4 分钟，静置 2 分钟切片"], swaps: "可裹一层蛋液+面包糠变酥皮版", reason: "高蛋白低脂，减脂期早午餐主角。" },
  { id: "af-fries", name: "空气炸锅自制薯条", emoji: "🍟", equipment: ["空气炸锅"], minutes: 22, uses: ["土豆"], goals: ["省钱", "儿童"], price: 4, calories: 320, steps: ["土豆切条泡冷水 10 分钟去淀粉", "擦干撒盐+少量油拌匀", "200°C 12 分钟，中途翻面一次"], swaps: "想脆撒一点玉米淀粉", reason: "比快餐店便宜还少 70% 油。" },
  { id: "af-toast", name: "空气炸锅厚切吐司布丁", emoji: "🍞", equipment: ["空气炸锅"], minutes: 15, uses: ["面包", "鸡蛋", "牛奶"], goals: ["治愈", "儿童"], price: 6, calories: 380, steps: ["吐司切方块，放入碗中", "鸡蛋+牛奶+少许糖打匀，淋上吐司浸 5 分钟", "180°C 烤 10 分钟，撒糖粉"], swaps: "可加葡萄干 / 切片香蕉", reason: "周末早餐机也能替代，治愈早晨。" },
  { id: "af-corn-rib", name: "空气炸锅孜然玉米排", emoji: "🌽", equipment: ["空气炸锅"], minutes: 20, uses: ["玉米"], goals: ["治愈", "省钱"], price: 5, calories: 220, steps: ["玉米切段对半再切条", "刷油撒盐+孜然+辣椒粉", "200°C 烤 15 分钟翻一次"], swaps: "怕辣不放辣椒粉就行", reason: "夜市小吃在家做，10 块钱解决夜宵。" },
  { id: "af-tofu", name: "空气炸锅椒盐豆腐", emoji: "🟨", equipment: ["空气炸锅"], minutes: 18, uses: ["豆腐"], goals: ["减脂", "长辈"], price: 6, calories: 240, steps: ["老豆腐切块拍干粉，盐+花椒粉+少油拌一下", "180°C 12 分钟", "撒葱花椒盐"], swaps: "嫩豆腐易碎，建议用老豆腐", reason: "外脆内嫩，零油烟版椒盐豆腐。" },
  { id: "af-egg-tart", name: "空气炸锅速冻蛋挞", emoji: "🥧", equipment: ["空气炸锅"], minutes: 18, uses: ["鸡蛋", "牛奶"], goals: ["治愈", "儿童"], price: 9, calories: 350, steps: ["蛋挞皮放入炸篮", "鸡蛋+牛奶+糖打匀，倒入蛋挞皮 8 分满", "200°C 烤 15 分钟"], swaps: "懒人可直接用蛋挞水", reason: "冰箱常备速冻挞皮的最佳归宿。" },
  { id: "af-shrimp", name: "空气炸锅蒜蓉虾", emoji: "🦐", equipment: ["空气炸锅"], minutes: 15, uses: ["虾仁"], goals: ["治愈"], price: 22, calories: 200, steps: ["大虾开背去虾线，用蒜末+黄油+盐填入开背处", "180°C 烤 10 分钟"], swaps: "无黄油可用橄榄油+蒜蓉酱", reason: "10 元食材烤出 50 元餐厅味。" },

  // ==== 电饭煲一锅出 ====
  { id: "rc-omurice", name: "电饭煲懒人腊肠饭", emoji: "🍱", equipment: ["电饭煲"], minutes: 35, uses: ["米饭"], goals: ["省钱", "治愈"], price: 12, calories: 580, steps: ["米淘好按正常水量，铺上腊肠片+冰冻青菜", "按煮饭键", "起锅淋一勺豉油+一点芝麻油翻匀"], swaps: "腊肠可换鸡腿肉 / 排骨", reason: "广式煲仔饭懒版，按一下键吃饱。" },
  { id: "rc-pumpkin-rice", name: "电饭煲南瓜糙米饭", emoji: "🎃", equipment: ["电饭煲"], minutes: 40, uses: ["米饭"], goals: ["减脂", "长辈"], price: 5, calories: 420, steps: ["糙米提前泡 30 分钟更软", "南瓜切块和米一起入锅，正常水量", "饭好后撒少许盐拌匀"], swaps: "南瓜可换紫薯 / 红薯", reason: "高纤维低 GI，长辈和减脂都友好。" },
  { id: "rc-chicken-rice", name: "电饭煲海南鸡饭", emoji: "🍗", equipment: ["电饭煲"], minutes: 45, uses: ["米饭", "鸡胸"], goals: ["治愈"], price: 18, calories: 560, steps: ["米炒香（可省）入锅，加姜片葱段", "鸡腿/鸡胸抹盐，搁米上一起煮", "按煮饭键；蘸料：生抽+蒜末+小米辣"], swaps: "用整鸡腿肉更嫩；鸡胸怕柴可裹保鲜膜", reason: "一锅出主菜+饭，懒得分锅。" },
  { id: "rc-congee", name: "电饭煲皮蛋瘦肉粥", emoji: "🥣", equipment: ["电饭煲"], minutes: 50, uses: ["米饭"], goals: ["长辈", "治愈"], price: 6, calories: 320, steps: ["米：水 = 1:8", "瘦肉切丝盐+生抽+淀粉抓匀", "选煮粥模式；最后 10 分钟下肉丝皮蛋"], swaps: "无瘦肉可用 1 颗鸡蛋", reason: "胃不舒服或长辈都喝得下。" },
  { id: "rc-veg-rice", name: "电饭煲菜饭", emoji: "🥬", equipment: ["电饭煲"], minutes: 35, uses: ["米饭", "青菜"], goals: ["省钱", "治愈"], price: 7, calories: 460, steps: ["上海青切碎+少量油盐拌匀", "铺在米上正常水量", "煮好淋一勺猪油翻匀（怕油可省）"], swaps: "可加香肠丁 / 虾米", reason: "上海弄堂咸菜饭升级版。" },
  { id: "rc-tomato-rice", name: "电饭煲整颗番茄饭", emoji: "🍅", equipment: ["电饭煲"], minutes: 38, uses: ["米饭", "番茄"], goals: ["治愈", "儿童"], price: 8, calories: 510, steps: ["米加少许橄榄油盐拌匀", "正中央放整颗番茄+几块培根/玉米", "按煮饭键，跳后压扁番茄拌匀"], swaps: "番茄换芒果做泰式风", reason: "INS 火过两年，懒人神器。" },

  // ==== 早餐机 / 三明治 ====
  { id: "bm-sandwich", name: "早餐机三明治三分钟", emoji: "🥪", equipment: ["早餐机", "微波炉"], minutes: 5, uses: ["面包", "鸡蛋", "火腿"], goals: ["省钱", "治愈"], price: 8, calories: 380, steps: ["三明治机预热 1 分钟", "面包+火腿+芝士+鸡蛋", "盖上压 2-3 分钟"], swaps: "无三明治机用平底锅+重物压", reason: "上班/上学路上抓一个就跑。" },
  { id: "bm-toast-egg", name: "早餐机太阳吐司", emoji: "🍳", equipment: ["早餐机"], minutes: 6, uses: ["面包", "鸡蛋"], goals: ["治愈", "儿童"], price: 6, calories: 320, steps: ["吐司挖一个圆洞", "鸡蛋打入洞里", "早餐机/平底锅煎到蛋白凝固"], swaps: "可以撒奶酪丝再焗", reason: "拍照超好看，孩子被治愈。" },
  { id: "bm-toast-set", name: "早餐机三件套", emoji: "🍞", equipment: ["早餐机"], minutes: 8, uses: ["面包", "鸡蛋", "牛奶"], goals: ["治愈"], price: 9, calories: 450, steps: ["上格煎一个鸡蛋 + 培根", "中格烤吐司", "下格热一杯牛奶；3 分钟全部就绪"], swaps: "牛奶可换豆浆 / 燕麦奶", reason: "5 分钟搞定一桌早餐，仪式感拉满。" },

  // ==== 微波炉 / 无设备 ====
  { id: "mw-oats", name: "微波炉燕麦杯", emoji: "🥣", equipment: ["微波炉", "无设备"], minutes: 5, uses: ["牛奶"], goals: ["减脂", "省钱"], price: 5, calories: 280, steps: ["即食燕麦+牛奶（或水）盖到刚没过", "微波 1 分 30 秒", "撒坚果 / 切片香蕉 / 蓝莓"], swaps: "无微波炉直接热牛奶冲", reason: "5 分钟早餐，扛饿到中午。" },
  { id: "mw-egg-cup", name: "微波炉鸡蛋杯", emoji: "🍳", equipment: ["微波炉"], minutes: 4, uses: ["鸡蛋"], goals: ["减脂", "治愈"], price: 3, calories: 180, steps: ["陶瓷杯刷油，打入鸡蛋戳一下蛋黄", "盖盘子（防爆）", "中火 50 秒，按需再 20 秒"], swaps: "可加奶酪 / 火腿丁", reason: "宿舍学生党午夜救命。" },
  { id: "mw-noodles", name: "微波炉泡面升级版", emoji: "🍜", equipment: ["微波炉"], minutes: 8, uses: ["面条", "鸡蛋", "青菜"], goals: ["省钱"], price: 6, calories: 480, steps: ["碗里放水+泡面饼+调料包", "微波 4 分钟", "打鸡蛋+菜叶再微波 2 分钟"], swaps: "泡面换乌冬 / 速冻馄饨", reason: "宿舍版「全家泡面」，心理安慰拉满。" },
  { id: "mw-sweet-potato", name: "微波炉烤红薯", emoji: "🍠", equipment: ["微波炉"], minutes: 8, uses: [], goals: ["减脂", "省钱"], price: 3, calories: 210, steps: ["红薯洗净擦干用厨房纸包", "高火 4 分钟翻面", "再 3-4 分钟，按软硬度调整"], swaps: "可改空气炸锅 200°C 25 分钟", reason: "下午饿了不犯罪。" },
  { id: "no-fruit-yog", name: "无设备水果酸奶碗", emoji: "🥝", equipment: ["无设备"], minutes: 5, uses: ["牛奶"], goals: ["减脂", "治愈"], price: 12, calories: 280, steps: ["希腊酸奶 / 普通酸奶倒碗里", "切苹果 / 蓝莓 / 香蕉", "撒燕麦片 + 蜂蜜"], swaps: "无希腊酸奶可用普通酸奶+一勺奶粉", reason: "夏天午后下午茶，DIY 更好看。" },
  { id: "no-cold-noodle", name: "无设备速食冷面", emoji: "🥢", equipment: ["无设备", "微波炉"], minutes: 8, uses: ["面条"], goals: ["治愈", "省钱"], price: 7, calories: 380, steps: ["乌冬 / 凉皮泡热水 3 分钟捞出过冷水", "调汁：醋+生抽+辣油+糖+蒜末", "放黄瓜丝、煮蛋、花生"], swaps: "面条可用任何速食面 / 米线", reason: "夏夜不开火，5 分钟搞定。" },

  // ==== 速冻升级 ====
  { id: "frz-dumpling", name: "速冻饺子升级版", emoji: "🥟", equipment: ["一口锅"], minutes: 12, uses: ["速冻饺子"], goals: ["省钱", "治愈"], price: 10, calories: 460, steps: ["水开下饺子，三沸三冷", "调料：蒜末+生抽+醋+辣油+一勺花生酱", "撒香菜葱花"], swaps: "蒸饺替代煮饺也行", reason: "1 包饺子 + 1 勺花生酱 = 米其林。" },
  { id: "frz-dumpling-pan", name: "速冻煎饺", emoji: "🍱", equipment: ["一口锅"], minutes: 15, uses: ["速冻饺子"], goals: ["治愈", "儿童"], price: 12, calories: 540, steps: ["平底锅刷油，整齐码饺子", "倒水到饺子 1/3 高，盖盖", "水将干时撒一点干面粉水，再煎 1 分钟出脆底"], swaps: "脆底面粉水：1 大勺面粉 + 100ml 水", reason: "脆底冰花饺，秒变小吃店。" },
  { id: "frz-mochi", name: "微波炉糯米丸子", emoji: "🍡", equipment: ["微波炉", "一口锅"], minutes: 10, uses: [], goals: ["治愈", "儿童"], price: 8, calories: 320, steps: ["速冻糯米丸子煮 5 分钟浮起捞出", "蘸花生芝麻糖 / 黄豆面", "可淋红豆汁"], swaps: "无微波炉直接锅煮", reason: "下午茶治愈系小食。" },
  { id: "frz-baozi", name: "速冻包子救场", emoji: "🥟", equipment: ["微波炉", "一口锅"], minutes: 10, uses: [], goals: ["省钱", "治愈"], price: 6, calories: 360, steps: ["蒸锅水开蒸 8 分钟", "或微波垫湿厨房纸 3 分钟", "配一碗紫菜蛋花汤"], swaps: "汤可用速食紫菜包冲泡", reason: "起晚十分钟也能开早餐。" },

  // ==== 一口锅快手菜 ====
  { id: "pan-tomato-egg-noodle", name: "一口锅番茄鸡蛋面", emoji: "🍜", equipment: ["一口锅"], minutes: 15, uses: ["面条", "番茄", "鸡蛋"], goals: ["省钱", "治愈"], price: 8, calories: 540, steps: ["番茄切块炒出汁加水", "汤滚下面条，5 分钟", "打入鸡蛋，撒葱花生抽"], swaps: "可加香肠 / 火腿丁", reason: "全家共识的童年味。" },
  { id: "pan-mapo-tofu", name: "一口锅麻婆豆腐", emoji: "🟥", equipment: ["一口锅"], minutes: 18, uses: ["豆腐"], goals: ["省钱", "治愈"], price: 10, calories: 380, steps: ["豆腐焯盐水", "肉末+豆瓣酱炒红油", "下豆腐+花椒+水煮 5 分钟，水淀粉收汁"], swaps: "肉末可省，做素麻婆", reason: "下饭无敌，一口锅一道菜。" },
  { id: "pan-fish-cabbage", name: "一口锅炝炒包菜火腿", emoji: "🥬", equipment: ["一口锅"], minutes: 10, uses: ["火腿", "青菜"], goals: ["省钱", "减脂"], price: 6, calories: 220, steps: ["包菜手撕，火腿切片", "热油爆蒜+干辣椒", "下包菜大火快炒，加火腿+生抽"], swaps: "包菜可换大白菜 / 圆白菜", reason: "5 分钟快手素菜，下饭。" },
  { id: "pan-egg-tomato-soup", name: "一口锅番茄蛋汤", emoji: "🍲", equipment: ["一口锅"], minutes: 10, uses: ["番茄", "鸡蛋"], goals: ["治愈", "长辈"], price: 5, calories: 160, steps: ["番茄炒出汁加 2 碗水煮开", "鸡蛋打散沿筷淋入", "盐+葱花+几滴香油"], swaps: "可加紫菜 / 海带", reason: "暖胃必杀技；老人小孩都能喝。" },
  { id: "pan-chicken-rice-noodle", name: "一口锅鸡丝米线", emoji: "🍜", equipment: ["一口锅"], minutes: 18, uses: ["鸡胸"], goals: ["减脂", "治愈"], price: 12, calories: 380, steps: ["鸡胸煮熟撕丝", "米线烫熟", "调汤：鸡汤+少许酱油+白胡椒，撒葱花香菜"], swaps: "米线可换粉丝 / 河粉", reason: "云南风味在家版，清淡又满足。" },
  { id: "pan-onion-pork", name: "一口锅洋葱猪肉片", emoji: "🍳", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["省钱"], price: 14, calories: 480, steps: ["猪肉片用盐酒淀粉腌 5 分钟", "热油下肉片滑炒变色盛出", "炒洋葱回锅肉片，生抽蚝油翻匀"], swaps: "洋葱可换青椒 / 韭菜", reason: "10 分钟下饭硬菜，超下饭。" },
  { id: "pan-cabbage-tofu-soup", name: "一口锅白菜豆腐汤", emoji: "🥣", equipment: ["一口锅"], minutes: 15, uses: ["豆腐", "青菜"], goals: ["长辈", "减脂"], price: 6, calories: 180, steps: ["白菜切段，豆腐切块", "锅烧水加 2 片姜煮开", "下白菜豆腐煮 8 分钟，盐胡椒粉调味"], swaps: "可加虾皮 / 蛋花", reason: "极清淡极养胃，长辈友好。" },

  // ==== 拌饭 / 拌面 / 沙拉 ====
  { id: "bibim-rice", name: "韩式拌饭懒人版", emoji: "🍚", equipment: ["微波炉", "一口锅"], minutes: 12, uses: ["米饭", "鸡蛋"], goals: ["治愈"], price: 10, calories: 540, steps: ["米饭微波热透", "撒胡萝卜丝、菠菜、火腿、煎蛋", "韩式辣酱 1 大勺 + 香油拌匀"], swaps: "无辣酱用蚝油+一点辣油", reason: "热乎拌饭，5 种颜色照亮一天。" },
  { id: "noodle-cold-sesame", name: "麻酱凉面", emoji: "🥢", equipment: ["一口锅"], minutes: 10, uses: ["面条"], goals: ["治愈", "省钱"], price: 7, calories: 460, steps: ["面条煮熟过凉水", "麻酱用温水化开+生抽+醋+糖", "黄瓜丝+花生碎+香菜拌"], swaps: "麻酱可换花生酱", reason: "夏天最爱，凉爽有蛋白。" },
  { id: "salad-chicken", name: "鸡胸沙拉碗", emoji: "🥗", equipment: ["无设备", "空气炸锅"], minutes: 15, uses: ["鸡胸"], goals: ["减脂"], price: 18, calories: 380, steps: ["鸡胸空气炸 / 平底锅煎熟切片", "生菜+小番茄+玉米+鹰嘴豆", "油醋汁 / 千岛酱"], swaps: "鸡胸换鸡蛋更省钱", reason: "减脂期主餐神器。" },
  { id: "salad-tuna", name: "金枪鱼罐头拌饭", emoji: "🐟", equipment: ["无设备", "微波炉"], minutes: 5, uses: ["米饭"], goals: ["减脂", "省钱"], price: 12, calories: 480, steps: ["热米饭打底", "金枪鱼罐头沥干扣上", "韩式辣酱 / 海苔碎 / 一颗温泉蛋拌匀"], swaps: "无温泉蛋直接打生鸡蛋（注意菌）", reason: "学生党 5 分钟救命。" },

  // ==== 治愈 / 长辈 / 儿童 专题 ====
  { id: "soup-chicken-corn", name: "玉米鸡腿汤（治愈）", emoji: "🥣", equipment: ["电饭煲", "一口锅"], minutes: 40, uses: ["玉米"], goals: ["治愈", "长辈"], price: 14, calories: 320, steps: ["鸡腿焯水", "电饭煲煮汤模式：鸡腿+玉米+胡萝卜+姜片", "煮好撒盐和葱花"], swaps: "压力锅可缩短到 20 分钟", reason: "受了委屈喝一碗，治愈。" },
  { id: "soup-pumpkin-millet", name: "南瓜小米粥（长辈）", emoji: "🎃", equipment: ["电饭煲", "一口锅"], minutes: 35, uses: [], goals: ["长辈", "治愈"], price: 4, calories: 240, steps: ["南瓜切块和小米一起煮", "电饭煲煮粥模式 / 砂锅小火 30 分钟", "可加少量冰糖"], swaps: "可加红枣 / 桂圆", reason: "暖胃易消化，给爸妈最佳。" },
  { id: "soup-pork-rib-radish", name: "白萝卜排骨汤（长辈）", emoji: "🍲", equipment: ["电饭煲", "一口锅"], minutes: 60, uses: [], goals: ["长辈"], price: 22, calories: 380, steps: ["排骨焯水", "电饭煲煮汤模式：排骨+萝卜块+姜片+少量料酒", "煮好撒盐胡椒葱花"], swaps: "可加玉米段 / 山药", reason: "周末给老人煲一锅。" },
  { id: "kid-cheese-rice", name: "芝士焗饭（儿童）", emoji: "🧀", equipment: ["空气炸锅", "微波炉"], minutes: 18, uses: ["米饭"], goals: ["儿童", "治愈"], price: 12, calories: 580, steps: ["米饭+番茄酱 1 大勺+少许牛奶拌匀", "铺火腿粒+青豆+玉米", "撒马苏里拉芝士，180°C 烤 10 分钟"], swaps: "无奶酪用咸蛋黄碎也好吃", reason: "孩子见到芝士就乖。" },
  { id: "kid-pancake", name: "鸡蛋小饼（儿童）", emoji: "🥞", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋", "牛奶"], goals: ["儿童", "治愈"], price: 6, calories: 320, steps: ["面粉 + 牛奶 + 鸡蛋调成稀面糊", "胡萝卜丝 / 火腿丁拌入", "平底锅小火两面煎黄"], swaps: "无牛奶用清水也行", reason: "饱腹又营养，DIY 早餐绘本。" },

  // ==== 减脂高蛋白 ====
  { id: "fit-egg-white", name: "蛋白炒蛋三色蔬", emoji: "🥗", equipment: ["一口锅"], minutes: 10, uses: ["鸡蛋"], goals: ["减脂"], price: 8, calories: 240, steps: ["3 个蛋白 + 1 个全蛋打散", "热锅少油下西兰花+彩椒+玉米", "倒蛋液炒散；少盐黑胡椒"], swaps: "蔬菜随你换", reason: "蛋白质 25g，脂肪低。" },
  { id: "fit-shrimp-broc", name: "西兰花虾仁（减脂）", emoji: "🥦", equipment: ["一口锅"], minutes: 12, uses: ["虾仁"], goals: ["减脂"], price: 18, calories: 260, steps: ["西兰花焯水 1 分钟", "虾仁滑炒变色", "下西兰花翻炒，蒜蓉+少许蚝油"], swaps: "无虾仁用鸡胸丁", reason: "高蛋白低油，颜色还好看。" },
  { id: "fit-konjac-noodle", name: "魔芋面拌鸡丝", emoji: "🍜", equipment: ["一口锅", "微波炉"], minutes: 10, uses: ["鸡胸"], goals: ["减脂"], price: 12, calories: 220, steps: ["魔芋面冲洗沥干", "鸡胸煮熟撕丝", "生抽+醋+辣油+蒜末拌匀"], swaps: "可加黄瓜丝 / 海苔丝", reason: "减脂期碳水救星。" },

  // ==== 治愈系夜宵 ====
  { id: "midnight-instant-pot", name: "宿舍版速食锅", emoji: "🍲", equipment: ["微波炉"], minutes: 8, uses: ["速冻饺子", "面条"], goals: ["治愈", "省钱"], price: 8, calories: 480, steps: ["大碗放水+速食骨汤块", "下面条 / 饺子+青菜", "微波 5-6 分钟"], swaps: "无骨汤块用 1 勺鸡精", reason: "学生党深夜救命。" },
  { id: "midnight-cheese-bread", name: "微波炉芝士面包", emoji: "🥖", equipment: ["微波炉"], minutes: 3, uses: ["面包"], goals: ["治愈"], price: 7, calories: 380, steps: ["面包片放奶酪丝", "微波 30 秒至化开", "撒胡椒/蜂蜜"], swaps: "可加几片火腿", reason: "3 分钟治愈，零失败。" },
  { id: "midnight-banana-milk", name: "热牛奶+香蕉助眠", emoji: "🥛", equipment: ["微波炉"], minutes: 3, uses: ["牛奶"], goals: ["治愈", "长辈"], price: 4, calories: 240, steps: ["牛奶微波 1 分 30 秒", "切香蕉片或撒燕麦", "蜂蜜调甜"], swaps: "无微波直接喝常温", reason: "失眠时喝一杯，安心。" },

  // ==== 加餐 ====
  { id: "snack-egg-tofu", name: "凉拌内酯豆腐（5 分钟）", emoji: "🟨", equipment: ["无设备"], minutes: 5, uses: ["豆腐"], goals: ["减脂", "治愈"], price: 4, calories: 180, steps: ["内酯豆腐倒扣盘子", "撒榨菜碎/葱花/虾皮", "淋生抽+香油"], swaps: "皮蛋豆腐 = 加皮蛋", reason: "夏天 5 分钟下饭凉菜。" },
  { id: "snack-green-veg", name: "白灼时蔬（10 分钟）", emoji: "🥬", equipment: ["一口锅"], minutes: 10, uses: ["青菜"], goals: ["减脂", "长辈"], price: 5, calories: 120, steps: ["水开下蔬菜烫 1 分钟", "捞出码盘", "蒸鱼豉油+热油激蒜末浇上"], swaps: "蔬菜任意：菜心/生菜/油麦菜", reason: "粤式做法，原味又下饭。" },
  { id: "egg-soy-ricecake", name: "韩式年糕辣炒（速食版）", emoji: "🍢", equipment: ["一口锅"], minutes: 15, uses: ["火腿"], goals: ["治愈"], price: 10, calories: 520, steps: ["年糕条泡热水", "锅里水+韩式辣酱+番茄酱+糖煮开", "下年糕+鱼饼+火腿煮 3-5 分钟，撒芝士"], swaps: "无年糕用速食乌冬", reason: "10 分钟亚洲街边小吃。" },
  { id: "rc-mushroom-rice", name: "电饭煲菌菇饭", emoji: "🍄", equipment: ["电饭煲"], minutes: 38, uses: ["米饭"], goals: ["治愈"], price: 9, calories: 460, steps: ["杏鲍菇+香菇切块用油盐生抽腌 5 分钟", "铺在米上正常水量煮", "撒葱花和黑胡椒"], swaps: "可加培根 / 鸡腿粒", reason: "素食友好，香气扑鼻。" },
  { id: "rc-egg-fried-rice", name: "电饭煲蛋炒饭（免开火）", emoji: "🍳", equipment: ["电饭煲"], minutes: 25, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 6, calories: 510, steps: ["内胆刷一层薄油，倒入隔夜米饭散开", "鸡蛋打散加少许盐生抽淋在米饭上，葱花撒匀", "按煮饭键，跳后焖 3 分钟翻拌即可"], swaps: "可加火腿丁 / 玉米粒", reason: "懒人版蛋炒饭：电饭煲一键搞定，零油烟。" },
  { id: "rc-egg-tomato-rice", name: "电饭煲番茄鸡蛋饭", emoji: "🍅", equipment: ["电饭煲"], minutes: 35, uses: ["鸡蛋", "米饭", "番茄"], goals: ["省钱", "治愈", "儿童"], price: 8, calories: 540, steps: ["米按正常水量入锅，番茄整颗放中央", "周围打 2 个生鸡蛋，淋一勺生抽 + 少许盐", "按煮饭键，跳后压扁番茄拌匀"], swaps: "可加火腿丁 / 玉米", reason: "INS 网红整颗番茄饭加蛋版，一键开饭。" },
  { id: "rc-sausage-egg-rice", name: "电饭煲腊肠鸡蛋焖饭", emoji: "🍱", equipment: ["电饭煲"], minutes: 35, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 11, calories: 580, steps: ["米淘好按正常水量，腊肠斜切片铺面", "煮饭键跳后开盖打入鸡蛋，盖上焖 5 分钟", "淋豉油+香油拌匀，撒葱花"], swaps: "腊肠可换培根 / 火腿", reason: "广式煲仔饭懒版+太阳蛋，一锅蛋白碳水齐全。" },
  { id: "rc-veg-egg-rice", name: "电饭煲杂蔬鸡蛋焖饭", emoji: "🥕", equipment: ["电饭煲"], minutes: 35, uses: ["鸡蛋", "米饭", "玉米"], goals: ["省钱", "减脂", "儿童"], price: 8, calories: 480, steps: ["米加少许油盐拌匀，铺胡萝卜丁、玉米、青豆", "煮饭键跳后磕入鸡蛋焖 5 分钟", "拌匀，撒黑胡椒"], swaps: "蔬菜任意搭配 / 加豌豆", reason: "色彩缤纷，省钱减脂双友好。" },
  { id: "rc-egg-rice-bowl", name: "电饭煲生蛋酱油拌饭", emoji: "🥚", equipment: ["电饭煲"], minutes: 30, uses: ["鸡蛋", "米饭"], goals: ["省钱", "治愈"], price: 5, calories: 460, steps: ["电饭煲按平时水量煮饭", "饭好开盖立刻打入 1 个生鸡蛋（怕生菌可用温泉蛋）", "淋生抽+香油+葱花，蓬松拌匀"], swaps: "可加海苔碎 / 韩式辣酱", reason: "TKG 风味电饭煲版：5 块钱治愈一餐。" },
  { id: "af-banana", name: "空气炸锅烤香蕉", emoji: "🍌", equipment: ["空气炸锅"], minutes: 12, uses: [], goals: ["治愈", "儿童"], price: 4, calories: 180, steps: ["香蕉对半切，刷一点黄油", "180°C 烤 8 分钟", "撒肉桂粉/淋蜂蜜"], swaps: "无黄油用花生酱", reason: "下午茶级甜点，0 添加。" },
  { id: "no-overnight-oats", name: "隔夜燕麦杯（无设备）", emoji: "🥣", equipment: ["无设备"], minutes: 5, uses: ["牛奶"], goals: ["减脂", "省钱"], price: 6, calories: 320, steps: ["前一晚燕麦 + 牛奶 + 奇亚籽 + 蜂蜜入罐", "冷藏 8 小时", "早起加水果坚果即食"], swaps: "牛奶可换酸奶 / 燕麦奶", reason: "早晨无需任何设备的早餐。" },
  { id: "pan-shredded-pot", name: "土豆丝下饭（10 分钟）", emoji: "🥔", equipment: ["一口锅"], minutes: 10, uses: ["土豆"], goals: ["省钱"], price: 4, calories: 280, steps: ["土豆刨丝泡水沥干", "热油爆蒜+干辣椒", "下土豆丝大火快炒+醋+盐"], swaps: "可加青椒丝", reason: "5 块钱解决一顿，下饭。" },
  { id: "soup-instant-misos", name: "5 分钟味增汤", emoji: "🍵", equipment: ["微波炉", "一口锅"], minutes: 5, uses: ["豆腐"], goals: ["治愈", "减脂"], price: 4, calories: 80, steps: ["碗里 1 大勺味增 + 热水", "加豆腐丁、海带丝、葱花", "微波 30 秒搅匀"], swaps: "无味增用 1 勺豆瓣酱", reason: "胃不舒服时一碗解千忧。" },
  ...buildExtraLazyMeals(),
];

// v2: 把懒人简餐池扩到 200+，覆盖 5 分钟 / 10 分钟 / 免开火 / 便利店 / 外卖平替 /
// 宿舍办公室 / 减脂 / 夜宵 / 早餐 / 甜品饮品 等场景。
// 字段保持与上面手写条目一致（每条都有 emoji / equipment / minutes / uses / goals
// / price / calories / steps / reason），便于被 rankMeals 一致排序。
function buildExtraLazyMeals(): LazyMeal[] {
  const tpls: Omit<LazyMeal, "id">[] = [
    // ===== 5 分钟极速 =====
    { name: "黄油酱油拌饭", emoji: "🍚", equipment: ["微波炉", "无设备"], minutes: 5, uses: ["米饭"], goals: ["治愈", "省钱"], price: 4, calories: 460, steps: ["热米饭打一勺黄油", "淋生抽 + 半勺糖", "撒葱花海苔碎拌匀"], swaps: "无黄油用一点猪油", reason: "5 分钟治愈系拌饭，零失败。" },
    { name: "猪油酱油面", emoji: "🍜", equipment: ["一口锅"], minutes: 6, uses: ["面条"], goals: ["治愈", "省钱"], price: 4, calories: 480, steps: ["水开下面 3-4 分钟", "碗底放猪油 + 生抽 + 葱花", "面条沥水拌匀"], swaps: "无猪油用香油+少量黄油", reason: "上海弄堂葱油拌面平替。" },
    { name: "海苔白米饭团", emoji: "🍙", equipment: ["无设备"], minutes: 5, uses: ["米饭"], goals: ["省钱", "治愈"], price: 4, calories: 380, steps: ["热米饭加少许盐捏成三角", "包上海苔片", "撒芝麻"], swaps: "可加金枪鱼罐头馅", reason: "便利店饭团 1/3 价。" },
    { name: "微波炉茶碗蒸", emoji: "🥚", equipment: ["微波炉"], minutes: 5, uses: ["鸡蛋"], goals: ["治愈", "长辈"], price: 3, calories: 160, steps: ["1 蛋打散，加 1.5 倍温水 + 少许盐", "盖盘子微波中火 1.5-2 分钟", "淋生抽 + 香油"], swaps: "可加虾皮 / 蛤蜊", reason: "嫩到颤抖的水蒸蛋。" },
    { name: "5 分钟酸辣鸡丝米线", emoji: "🍜", equipment: ["微波炉"], minutes: 5, uses: ["鸡胸"], goals: ["减脂"], price: 9, calories: 320, steps: ["速食米线碗装泡热水 3 分钟", "调汁：醋+生抽+辣油+蒜末", "撒鸡胸丝、香菜、花生"], swaps: "速食米线可换粉丝", reason: "便利店级速食加蛋白。" },
    { name: "速冻馄饨煮汤", emoji: "🥟", equipment: ["一口锅"], minutes: 6, uses: ["速冻饺子"], goals: ["省钱", "治愈"], price: 8, calories: 340, steps: ["水开下馄饨 4 分钟", "碗底紫菜+虾皮+生抽+香油", "馄饨连汤倒入"], swaps: "速冻饺子也可", reason: "5 分钟早晚宵都能干。" },
    { name: "便利店三角饭团升级", emoji: "🍙", equipment: ["微波炉"], minutes: 4, uses: [], goals: ["省钱"], price: 6, calories: 320, steps: ["饭团微波 30 秒", "切成两半", "夹一片火腿/煎蛋"], swaps: "无微波直接吃", reason: "便利店升级版 5 分钟。" },
    { name: "酸奶水果碗（5 分钟）", emoji: "🥣", equipment: ["无设备"], minutes: 5, uses: ["牛奶"], goals: ["减脂", "治愈"], price: 10, calories: 220, steps: ["希腊酸奶倒碗里", "切香蕉/蓝莓/苹果", "撒燕麦片+蜂蜜"], swaps: "可改普通酸奶+一勺奶粉", reason: "夏天下午茶，0 厨艺。" },
    { name: "热乎乎煎蛋三明治", emoji: "🥪", equipment: ["一口锅"], minutes: 6, uses: ["面包", "鸡蛋"], goals: ["治愈", "省钱"], price: 7, calories: 380, steps: ["平底锅煎一个鸡蛋", "面包烤热", "夹蛋+番茄酱+黑胡椒"], swaps: "可加芝士片", reason: "5 分钟版麦满分。" },
    { name: "火腿芝士夹烤吐司", emoji: "🥪", equipment: ["微波炉", "早餐机"], minutes: 5, uses: ["面包", "火腿"], goals: ["治愈", "儿童"], price: 8, calories: 420, steps: ["吐司夹芝士+火腿", "三明治机/烤箱 3 分钟", "切对角"], swaps: "无三明治机用平底锅压", reason: "外焦里溶 5 分钟。" },

    // ===== 10 分钟下饭 =====
    { name: "葱花蛋花汤", emoji: "🍲", equipment: ["一口锅"], minutes: 8, uses: ["鸡蛋"], goals: ["治愈", "长辈"], price: 4, calories: 120, steps: ["水煮开下姜片", "鸡蛋打散沿筷子淋入", "盐+葱花+几滴香油"], swaps: "可加紫菜/番茄", reason: "暖胃神汤 8 分钟搞定。" },
    { name: "番茄豆腐汤", emoji: "🍅", equipment: ["一口锅"], minutes: 10, uses: ["番茄", "豆腐"], goals: ["减脂", "治愈"], price: 6, calories: 160, steps: ["番茄切块炒出汁加水", "下豆腐块煮 5 分钟", "盐+葱花+一颗鸡蛋"], swaps: "豆腐可换冬瓜", reason: "国民下饭汤。" },
    { name: "胡萝卜玉米排骨速食汤", emoji: "🥣", equipment: ["微波炉"], minutes: 10, uses: ["玉米"], goals: ["治愈", "长辈"], price: 8, calories: 220, steps: ["速食骨汤块+水 2 碗", "微波 5 分钟", "下胡萝卜片+玉米段再 3 分钟"], swaps: "可加几粒枸杞", reason: "速成版老火汤。" },
    { name: "醋溜土豆丝（10 分钟）", emoji: "🥔", equipment: ["一口锅"], minutes: 10, uses: ["土豆"], goals: ["省钱"], price: 4, calories: 280, steps: ["土豆刨丝泡水沥干", "热油爆蒜+干辣椒", "下丝大火炒+醋+盐"], swaps: "可加青椒丝", reason: "5 块钱解决一顿。" },
    { name: "蒜蓉空心菜", emoji: "🥬", equipment: ["一口锅"], minutes: 8, uses: ["青菜"], goals: ["减脂", "省钱"], price: 5, calories: 90, steps: ["空心菜洗净切段", "热油爆蒜末", "下菜大火 30 秒+盐"], swaps: "蒜可加 1 勺虾酱", reason: "夏天最清爽 5 块菜。" },
    { name: "蚝油生菜（10 分钟）", emoji: "🥬", equipment: ["一口锅"], minutes: 8, uses: ["青菜"], goals: ["减脂", "长辈"], price: 5, calories: 80, steps: ["生菜整颗烫 1 分钟", "蚝油+蒜蓉+一点生抽热油激", "淋汁"], swaps: "也可白灼", reason: "粤式快手菜。" },
    { name: "韭菜炒鸡蛋", emoji: "🍳", equipment: ["一口锅"], minutes: 8, uses: ["鸡蛋"], goals: ["治愈"], price: 6, calories: 280, steps: ["韭菜切段，鸡蛋打散", "鸡蛋滑炒盛出", "下韭菜炒香回锅蛋"], swaps: "可加虾皮", reason: "国民下饭组合。" },
    { name: "番茄炒蛋", emoji: "🍅", equipment: ["一口锅"], minutes: 10, uses: ["鸡蛋", "番茄"], goals: ["治愈", "儿童"], price: 6, calories: 320, steps: ["番茄切块、蛋打散", "鸡蛋滑炒盛出", "番茄炒出汁，回锅蛋+少许糖盐"], swaps: "可拌米饭", reason: "妈妈味第一名。" },
    { name: "辣白菜五花肉炒饭", emoji: "🍚", equipment: ["一口锅"], minutes: 10, uses: ["米饭"], goals: ["治愈", "省钱"], price: 12, calories: 580, steps: ["五花肉切片煸出油", "下辣白菜炒香", "下米饭炒散+生抽"], swaps: "可加芝士融化", reason: "韩式炒饭家常版。" },
    { name: "韩式部队锅速食版", emoji: "🍲", equipment: ["一口锅"], minutes: 12, uses: ["速冻饺子", "豆腐"], goals: ["治愈", "省钱"], price: 14, calories: 540, steps: ["锅里水+泡菜+辣酱+一勺味噌煮开", "下豆腐+午餐肉+泡面+饺子", "撒葱花芝士"], swaps: "无午餐肉用火腿", reason: "宿舍版部队锅。" },
    { name: "番茄打卤面（家常）", emoji: "🍜", equipment: ["一口锅"], minutes: 12, uses: ["面条", "番茄", "鸡蛋"], goals: ["治愈", "儿童"], price: 7, calories: 520, steps: ["番茄炒出汁+水煮开", "鸡蛋打散淋入", "下煮好的面条"], swaps: "可加肉末", reason: "童年的味道。" },
    { name: "葱油拌面", emoji: "🍜", equipment: ["一口锅"], minutes: 10, uses: ["面条"], goals: ["治愈", "省钱"], price: 5, calories: 460, steps: ["小葱切段慢火熬葱油备用", "面条煮熟过水", "葱油+生抽+老抽+糖拌匀"], swaps: "可一勺虾皮", reason: "一筷子下去泪奔。" },
    { name: "麻辣烫家庭版", emoji: "🍲", equipment: ["一口锅"], minutes: 12, uses: ["豆腐", "青菜"], goals: ["治愈"], price: 14, calories: 460, steps: ["麻辣烫底料一袋+水煮开", "下耐煮的丸子土豆", "下青菜豆腐 3 分钟"], swaps: "可加宽粉", reason: "夜宵神器。" },

    // ===== 免开火 / 凉拌 =====
    { name: "凉拌黄瓜（5 分钟）", emoji: "🥒", equipment: ["无设备"], minutes: 5, uses: [], goals: ["减脂", "省钱"], price: 3, calories: 80, steps: ["黄瓜拍碎切段", "蒜末+醋+生抽+辣油+糖", "撒花生碎"], swaps: "可加一点麻酱", reason: "夏天 3 分钟开胃菜。" },
    { name: "凉拌西兰花", emoji: "🥦", equipment: ["微波炉"], minutes: 6, uses: [], goals: ["减脂"], price: 6, calories: 120, steps: ["西兰花切朵微波 1 分钟", "蒜末+生抽+醋+香油+辣油", "拌一拌"], swaps: "可加虾仁", reason: "减脂期最稳的素菜。" },
    { name: "凉拌豆腐皮丝", emoji: "🟨", equipment: ["无设备"], minutes: 6, uses: ["豆腐"], goals: ["减脂", "省钱"], price: 5, calories: 180, steps: ["豆腐皮切丝", "胡萝卜丝+黄瓜丝+蒜末", "醋+生抽+辣油+糖+花椒油"], swaps: "可加香菜", reason: "高蛋白凉菜。" },
    { name: "凉拌木耳", emoji: "🍄", equipment: ["微波炉"], minutes: 8, uses: [], goals: ["减脂", "长辈"], price: 6, calories: 90, steps: ["木耳泡发微波 1 分钟", "蒜末+辣椒末+生抽+醋", "拌匀撒香菜"], swaps: "可加木耳酱拌", reason: "下饭凉菜，长辈友好。" },
    { name: "凉拌莴笋丝", emoji: "🥒", equipment: ["无设备"], minutes: 6, uses: [], goals: ["减脂"], price: 4, calories: 60, steps: ["莴笋去皮切丝盐腌 5 分钟", "挤水", "蒜末+醋+生抽+辣油拌"], swaps: "可加胡萝卜丝", reason: "清爽脆口。" },
    { name: "麻酱凉皮（速食版）", emoji: "🥢", equipment: ["微波炉"], minutes: 8, uses: ["面条"], goals: ["治愈"], price: 8, calories: 480, steps: ["速食凉皮泡水", "麻酱+醋+生抽+辣油", "黄瓜丝+花生碎+香菜"], swaps: "凉皮换乌冬", reason: "速食凉皮逆袭。" },
    { name: "皮蛋豆腐", emoji: "🟨", equipment: ["无设备"], minutes: 5, uses: ["豆腐"], goals: ["减脂", "治愈"], price: 6, calories: 220, steps: ["内酯豆腐倒扣盘子", "皮蛋切块铺面", "葱花+生抽+香油+辣油"], swaps: "无皮蛋用咸蛋黄碎", reason: "夏夜 5 分钟硬菜。" },
    { name: "凉拌粉丝", emoji: "🍝", equipment: ["微波炉"], minutes: 8, uses: [], goals: ["省钱"], price: 5, calories: 280, steps: ["粉丝泡软", "胡萝卜丝+黄瓜丝", "醋+生抽+辣油+蒜末拌"], swaps: "可加肉末更香", reason: "酸辣开胃。" },

    // ===== 便利店组合 =====
    { name: "便利店饭团 + 关东煮组合", emoji: "🍙", equipment: ["微波炉"], minutes: 5, uses: [], goals: ["省钱", "治愈"], price: 18, calories: 420, steps: ["饭团 + 关东煮汤", "微波 1 分钟", "撒一点辣椒粉"], swaps: "可加咖啡", reason: "便利店复合套餐。" },
    { name: "便利店三明治 + 牛奶", emoji: "🥪", equipment: ["无设备"], minutes: 3, uses: ["牛奶"], goals: ["省钱"], price: 18, calories: 480, steps: ["三明治 1 个", "牛奶 250ml", "可选水果一份"], swaps: "三明治换饭团", reason: "通勤一手抓。" },
    { name: "便利店关东煮 4 串组合", emoji: "🍢", equipment: ["微波炉"], minutes: 4, uses: [], goals: ["治愈"], price: 14, calories: 340, steps: ["挑萝卜 + 海带 + 豆腐 + 鱼丸", "店内热水", "撒七味粉"], swaps: "可加一袋方便面", reason: "夜宵升级版。" },
    { name: "便利店泡面 + 卤蛋 + 凉拌", emoji: "🍜", equipment: ["微波炉"], minutes: 6, uses: ["鸡蛋"], goals: ["省钱"], price: 16, calories: 580, steps: ["泡面 + 热水 3 分钟", "加 1 个卤蛋", "凉拌一盘"], swaps: "可换乌冬", reason: "周末赖床顿。" },
    { name: "便利店速食意面 + 沙拉", emoji: "🍝", equipment: ["微波炉"], minutes: 5, uses: [], goals: ["减脂"], price: 22, calories: 480, steps: ["微波速食意面 2 分钟", "买一份沙拉", "撒胡椒"], swaps: "意面可换便当", reason: "办公室午餐。" },
    { name: "便利店关东煮素食版", emoji: "🍢", equipment: ["微波炉"], minutes: 4, uses: [], goals: ["减脂"], price: 12, calories: 240, steps: ["选萝卜+海带+豆腐+魔芋丝", "无肉", "撒七味粉"], swaps: "可加白米饭", reason: "减脂选手友好。" },
    { name: "便利店烤红薯 + 牛奶", emoji: "🍠", equipment: ["微波炉"], minutes: 6, uses: ["牛奶"], goals: ["减脂", "省钱"], price: 12, calories: 360, steps: ["烤红薯店内即买", "牛奶一杯", "撒坚果"], swaps: "可加一颗水煮蛋", reason: "下午饿了不犯罪。" },
    { name: "便利店煮玉米 + 香蕉", emoji: "🌽", equipment: ["无设备"], minutes: 3, uses: [], goals: ["减脂"], price: 8, calories: 240, steps: ["玉米店内即买", "香蕉 1 根", "无加工"], swaps: "玉米换毛豆", reason: "极简碳水套装。" },

    // ===== 外卖平替 =====
    { name: "黄焖鸡米饭家庭版", emoji: "🍱", equipment: ["一口锅"], minutes: 25, uses: ["米饭"], goals: ["治愈"], price: 14, calories: 620, steps: ["鸡腿肉切块焯水", "下香菇 + 黄焖酱 + 水煮 15 分钟", "盖在米饭上"], swaps: "鸡腿可换鸡胸", reason: "外卖之神平替版。" },
    { name: "麻辣香锅速成版", emoji: "🌶️", equipment: ["一口锅"], minutes: 20, uses: ["豆腐", "青菜"], goals: ["治愈"], price: 16, calories: 540, steps: ["土豆+藕片+豆腐皮焯水", "热油下豆瓣酱+花椒+干辣椒", "下菜+生抽+一勺糖翻炒"], swaps: "可加肉片", reason: "外卖 1/2 价。" },
    { name: "兰州牛肉面速成", emoji: "🍜", equipment: ["一口锅"], minutes: 15, uses: ["面条"], goals: ["治愈"], price: 12, calories: 540, steps: ["牛骨汤一袋 + 水煮开", "下面条煮 5 分钟", "牛肉切片+蒜苗+辣油"], swaps: "汤包可换浓汤宝", reason: "兰州拉面的家庭平替。" },
    { name: "肉夹馍速成", emoji: "🥖", equipment: ["微波炉", "一口锅"], minutes: 12, uses: [], goals: ["治愈"], price: 10, calories: 460, steps: ["白吉饼微波热", "卤肉切碎", "夹饼+辣椒末"], swaps: "白吉饼换馒头", reason: "西安肉夹馍家庭版。" },
    { name: "煎饼果子 DIY", emoji: "🥞", equipment: ["一口锅"], minutes: 15, uses: ["鸡蛋"], goals: ["省钱"], price: 8, calories: 480, steps: ["面糊摊薄饼", "打鸡蛋摊匀", "刷酱+脆皮+葱花卷起"], swaps: "脆皮可省", reason: "北方早餐平替。" },
    { name: "鸡蛋灌饼速成版", emoji: "🥚", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋"], goals: ["省钱"], price: 6, calories: 420, steps: ["面饼煎一面起泡", "戳洞灌入蛋液", "翻面刷酱+生菜+火腿"], swaps: "用速冻手抓饼最快", reason: "北方早餐快手版。" },
    { name: "重庆小面（5 分钟版）", emoji: "🌶️", equipment: ["一口锅"], minutes: 8, uses: ["面条"], goals: ["治愈"], price: 7, calories: 460, steps: ["面条煮熟", "碗底辣椒油+花椒粉+生抽+蒜末+葱花", "汤面浇上拌匀"], swaps: "可加榨菜碎", reason: "辣味解压。" },
    { name: "口水鸡速成版", emoji: "🍗", equipment: ["一口锅"], minutes: 18, uses: ["鸡胸"], goals: ["治愈"], price: 16, calories: 380, steps: ["鸡胸煮熟切片", "辣椒油+花椒油+蒜末+生抽+醋+糖+花生碎", "淋鸡片"], swaps: "鸡胸换鸡腿", reason: "餐厅价 1/3。" },
    { name: "大盘鸡懒人版", emoji: "🍗", equipment: ["一口锅"], minutes: 30, uses: ["土豆"], goals: ["治愈"], price: 22, calories: 620, steps: ["鸡块焯水", "下豆瓣酱+干辣椒+土豆+水煮 15 分钟", "起锅前加青椒"], swaps: "可加面片", reason: "新疆风味家庭版。" },
    { name: "酸菜鱼速成版（鱼片）", emoji: "🐟", equipment: ["一口锅"], minutes: 20, uses: [], goals: ["治愈"], price: 26, calories: 480, steps: ["鱼片用蛋清+淀粉抓匀", "酸菜鱼底料 + 水煮开", "下鱼片煮 3 分钟"], swaps: "鱼片可换巴沙鱼", reason: "外卖酸菜鱼平替。" },
    { name: "韩式炸鸡懒人版", emoji: "🍗", equipment: ["空气炸锅"], minutes: 25, uses: [], goals: ["治愈"], price: 18, calories: 580, steps: ["鸡翅腌料：盐+米酒+生抽+蒜末", "200°C 烤 12 分钟翻面再 8 分钟", "刷韩式甜辣酱再烤 2 分钟"], swaps: "鸡翅换鸡腿", reason: "韩式炸鸡 1/3 油。" },
    { name: "披萨速食版（手抓饼）", emoji: "🍕", equipment: ["空气炸锅"], minutes: 15, uses: [], goals: ["治愈", "儿童"], price: 9, calories: 460, steps: ["手抓饼平铺为底", "番茄酱+火腿+玉米+芝士", "180°C 烤 10 分钟"], swaps: "可加蘑菇", reason: "便利店披萨平替。" },
    { name: "汉堡速食版", emoji: "🍔", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋"], goals: ["治愈", "儿童"], price: 12, calories: 540, steps: ["汉堡胚烤热", "煎牛肉饼/鸡腿排+蛋", "夹生菜+番茄+芝士+酱"], swaps: "肉饼用速冻", reason: "麦当劳平替。" },

    // ===== 宿舍 / 办公室 =====
    { name: "办公室速食碗（沙拉鸡胸）", emoji: "🥗", equipment: ["微波炉"], minutes: 5, uses: ["鸡胸"], goals: ["减脂"], price: 16, calories: 360, steps: ["沙拉菜底", "微波加热预制鸡胸", "千岛/油醋汁拌"], swaps: "鸡胸换鳕鱼", reason: "工位 5 分钟减脂餐。" },
    { name: "办公室速食碗（杂粮饭+蔬菜）", emoji: "🍱", equipment: ["微波炉"], minutes: 5, uses: ["米饭"], goals: ["减脂"], price: 18, calories: 420, steps: ["速食杂粮饭微波", "速冻蔬菜杯微波", "拌一起+生抽+辣油"], swaps: "杂粮饭可换糙米", reason: "外卖换它，1 个月轻 5 斤。" },
    { name: "宿舍版番茄鸡蛋面（电热壶）", emoji: "🍜", equipment: ["微波炉"], minutes: 10, uses: ["面条", "番茄", "鸡蛋"], goals: ["省钱", "治愈"], price: 7, calories: 480, steps: ["大碗放面条+水+番茄丁", "微波 5 分钟", "打入鸡蛋再 2 分钟+葱花"], swaps: "可加紫菜", reason: "无明火宿舍救星。" },
    { name: "宿舍泡面升级（鸡蛋火腿）", emoji: "🍜", equipment: ["微波炉"], minutes: 7, uses: ["面条", "鸡蛋"], goals: ["省钱"], price: 8, calories: 540, steps: ["泡面 + 水微波 4 分钟", "打鸡蛋+火腿片", "再 2 分钟"], swaps: "可加青菜叶", reason: "宿舍硬通货。" },
    { name: "工位速食三明治组合", emoji: "🥪", equipment: ["微波炉"], minutes: 4, uses: ["面包", "鸡蛋"], goals: ["省钱"], price: 12, calories: 460, steps: ["面包 2 片", "夹蛋+火腿+生菜", "三明治机或微波 1 分钟"], swaps: "可加芝士", reason: "工位午餐 5 分钟。" },
    { name: "宿舍麦片碗", emoji: "🥣", equipment: ["微波炉"], minutes: 4, uses: ["牛奶"], goals: ["省钱", "减脂"], price: 6, calories: 360, steps: ["即食麦片+牛奶", "微波 1 分钟", "撒蓝莓坚果"], swaps: "牛奶可换豆奶", reason: "宿舍早餐 1 分钟。" },
    { name: "电热壶煮玉米", emoji: "🌽", equipment: ["微波炉"], minutes: 12, uses: ["玉米"], goals: ["减脂", "省钱"], price: 4, calories: 220, steps: ["电热壶水开", "整根玉米段放入煮 8 分钟", "撒一点黄油盐"], swaps: "可加芝士粉", reason: "宿舍下午茶。" },

    // ===== 减脂 / 高蛋白续 =====
    { name: "鸡胸藜麦碗", emoji: "🥗", equipment: ["微波炉", "空气炸锅"], minutes: 12, uses: ["鸡胸"], goals: ["减脂"], price: 18, calories: 380, steps: ["藜麦煮熟", "鸡胸煎/炸", "拌牛油果+小番茄+橄榄油"], swaps: "藜麦换糙米", reason: "高蛋白健身餐。" },
    { name: "三文鱼蔬菜碗", emoji: "🐟", equipment: ["空气炸锅"], minutes: 18, uses: [], goals: ["减脂"], price: 28, calories: 460, steps: ["三文鱼撒盐+柠檬+黑胡椒", "180°C 烤 8 分钟", "西兰花+小番茄+一勺糙米"], swaps: "三文鱼换巴沙鱼", reason: "Omega-3 满分。" },
    { name: "豆腐肉末碗", emoji: "🟨", equipment: ["一口锅"], minutes: 12, uses: ["豆腐"], goals: ["减脂"], price: 9, calories: 320, steps: ["肉末炒熟", "下嫩豆腐切块煨 5 分钟", "生抽+少许蚝油"], swaps: "肉末换鸡胸丁", reason: "蛋白满足感拉满。" },
    { name: "魔芋拌饭碗", emoji: "🍚", equipment: ["微波炉"], minutes: 8, uses: ["米饭"], goals: ["减脂"], price: 10, calories: 240, steps: ["米饭+魔芋丝 1:1", "微波热", "金枪鱼罐头+生菜+海苔丝"], swaps: "魔芋丝可换菜花米", reason: "减脂期碳水救星。" },
    { name: "蛋白饼速成", emoji: "🥞", equipment: ["一口锅"], minutes: 10, uses: ["鸡蛋"], goals: ["减脂"], price: 6, calories: 220, steps: ["3 蛋白 + 1 全蛋打散", "加少许燕麦+蔬菜碎", "平底锅煎成饼"], swaps: "可加奶酪", reason: "蛋白 25g 早餐。" },
    { name: "金枪鱼鸡蛋杯", emoji: "🥚", equipment: ["微波炉"], minutes: 5, uses: ["鸡蛋"], goals: ["减脂"], price: 10, calories: 280, steps: ["金枪鱼罐头沥干", "鸡蛋打散+牛奶", "微波 1.5 分钟"], swaps: "可加菠菜碎", reason: "高蛋白高 omega。" },
    { name: "豆浆燕麦碗", emoji: "🥛", equipment: ["微波炉"], minutes: 5, uses: [], goals: ["减脂"], price: 4, calories: 240, steps: ["即食燕麦 + 豆浆", "微波 1 分钟", "撒坚果蓝莓"], swaps: "豆浆换牛奶", reason: "植物蛋白早餐。" },
    { name: "鸡丝凉面（减脂）", emoji: "🍜", equipment: ["一口锅"], minutes: 10, uses: ["鸡胸", "面条"], goals: ["减脂"], price: 12, calories: 380, steps: ["全麦面煮熟过水", "鸡胸丝+黄瓜丝", "醋+生抽+辣油拌"], swaps: "面条换魔芋面", reason: "蛋白碳水兼得。" },

    // ===== 夜宵 / 治愈系 =====
    { name: "夜宵版番茄鸡蛋面（一人份）", emoji: "🍜", equipment: ["一口锅"], minutes: 12, uses: ["面条", "番茄", "鸡蛋"], goals: ["治愈"], price: 7, calories: 480, steps: ["番茄炒出汁加水", "面条 4 分钟", "打蛋+葱花"], swaps: "可加紫菜", reason: "深夜回家温暖一碗。" },
    { name: "啤酒鸭翅", emoji: "🍻", equipment: ["一口锅"], minutes: 35, uses: [], goals: ["治愈"], price: 22, calories: 540, steps: ["鸭翅焯水", "下啤酒+冰糖+八角+酱油焖 25 分钟", "大火收汁"], swaps: "鸭翅换鸡翅", reason: "夜宵硬菜。" },
    { name: "炒粉干（潮汕风）", emoji: "🍝", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋"], goals: ["治愈"], price: 8, calories: 540, steps: ["粉干泡软", "热油炒鸡蛋盛出", "下粉干+生抽老抽+回锅蛋+葱花"], swaps: "粉干换河粉", reason: "夜宵小炒。" },
    { name: "夜宵版烤肠拌面", emoji: "🌭", equipment: ["一口锅"], minutes: 10, uses: ["面条"], goals: ["治愈"], price: 10, calories: 580, steps: ["面条煮熟", "热狗/烤肠切片煎香", "面条+肠+生抽+辣油"], swaps: "可加溏心蛋", reason: "宿舍夜宵神器。" },
    { name: "夜宵蛋包饭", emoji: "🍳", equipment: ["一口锅"], minutes: 12, uses: ["米饭", "鸡蛋"], goals: ["治愈"], price: 8, calories: 520, steps: ["米饭炒香塑形", "鸡蛋摊薄包饭", "番茄酱画线"], swaps: "可加芝士", reason: "心情不好就吃。" },
    { name: "夜宵热饮：姜汤", emoji: "🍵", equipment: ["微波炉"], minutes: 5, uses: [], goals: ["治愈", "长辈"], price: 3, calories: 60, steps: ["姜片+红糖+水", "微波 2 分钟", "可加红枣"], swaps: "可加柠檬片", reason: "受凉了喝一杯。" },
    { name: "热可可", emoji: "☕", equipment: ["微波炉"], minutes: 4, uses: ["牛奶"], goals: ["治愈"], price: 6, calories: 220, steps: ["牛奶 200ml+可可粉+糖", "微波 2 分钟", "撒棉花糖"], swaps: "可可换抹茶", reason: "失眠助眠。" },

    // ===== 早餐专题 =====
    { name: "蒸蛋羹（早餐版）", emoji: "🥚", equipment: ["微波炉"], minutes: 7, uses: ["鸡蛋"], goals: ["治愈", "长辈", "儿童"], price: 4, calories: 180, steps: ["1 蛋打散+1.5 倍温水+盐", "盖盘子微波 2 分钟", "淋生抽香油"], swaps: "可加海鲜", reason: "孩子最爱。" },
    { name: "牛奶燕麦花式", emoji: "🥣", equipment: ["微波炉"], minutes: 5, uses: ["牛奶"], goals: ["减脂", "省钱"], price: 5, calories: 280, steps: ["即食燕麦+牛奶", "微波 1.5 分钟", "蓝莓+杏仁片+蜂蜜"], swaps: "可加奇亚籽", reason: "扛饿到中午。" },
    { name: "豆浆配油条（早餐机）", emoji: "🥛", equipment: ["早餐机"], minutes: 8, uses: [], goals: ["省钱", "长辈"], price: 6, calories: 380, steps: ["豆浆机自打豆浆", "速冻油条空气炸锅 5 分钟", "搭配咸菜"], swaps: "油条换烧饼", reason: "国民早餐复刻。" },
    { name: "肠粉速成（早餐机）", emoji: "🥢", equipment: ["微波炉"], minutes: 10, uses: ["鸡蛋"], goals: ["治愈"], price: 7, calories: 320, steps: ["肠粉皮平铺", "刷蛋液+撒葱+少许虾米", "微波 1.5 分钟+蒸鱼豉油"], swaps: "肠粉皮可换河粉", reason: "广式早餐家庭版。" },
    { name: "烧麦速成版", emoji: "🥟", equipment: ["微波炉"], minutes: 10, uses: [], goals: ["省钱"], price: 8, calories: 360, steps: ["速冻烧麦 4 个", "微波 2 分钟", "蘸醋+辣油"], swaps: "可换包子", reason: "早餐 5 分钟。" },
    { name: "热汤面线（早餐）", emoji: "🍜", equipment: ["一口锅"], minutes: 7, uses: ["面条", "鸡蛋"], goals: ["治愈"], price: 6, calories: 420, steps: ["水开下面线 2 分钟", "加紫菜+鸡蛋+葱花+生抽", "起锅淋香油"], swaps: "可加肉丝", reason: "暖胃版早餐。" },

    // ===== 甜品 / 饮品 =====
    { name: "脏脏吐司", emoji: "🍞", equipment: ["微波炉"], minutes: 5, uses: ["面包"], goals: ["治愈"], price: 6, calories: 380, steps: ["吐司刷一层蛋液", "撒满奥利奥碎+巧克力", "微波 30 秒"], swaps: "可加香蕉片", reason: "下午茶治愈。" },
    { name: "焦糖布丁（速成）", emoji: "🍮", equipment: ["微波炉"], minutes: 8, uses: ["鸡蛋", "牛奶"], goals: ["治愈"], price: 5, calories: 280, steps: ["蛋黄+牛奶+糖打匀", "杯子先放焦糖", "微波 3 分钟"], swaps: "焦糖可省", reason: "甜品师 5 分钟版。" },
    { name: "椰浆西米露", emoji: "🥥", equipment: ["一口锅"], minutes: 25, uses: [], goals: ["治愈"], price: 8, calories: 280, steps: ["西米煮 15 分钟+焖 10 分钟透", "椰浆+糖", "切芒果丁"], swaps: "可加红豆", reason: "夏天冰一冰。" },
    { name: "红豆牛奶冰", emoji: "🍧", equipment: ["微波炉"], minutes: 6, uses: ["牛奶"], goals: ["治愈"], price: 6, calories: 320, steps: ["即食红豆罐头+牛奶", "微波 2 分钟", "倒入碎冰"], swaps: "红豆可自煮", reason: "夏天解暑。" },
    { name: "杨枝甘露速成", emoji: "🥭", equipment: ["无设备"], minutes: 10, uses: [], goals: ["治愈"], price: 14, calories: 320, steps: ["芒果切丁 + 椰浆 + 糖", "西米先煮", "西柚瓣点缀"], swaps: "西柚可省", reason: "粤式甜品家庭版。" },
    { name: "鲜奶麻薯", emoji: "🍡", equipment: ["微波炉"], minutes: 8, uses: ["牛奶"], goals: ["治愈", "儿童"], price: 5, calories: 260, steps: ["糯米粉+牛奶+糖搅匀", "微波 2 分钟搅一下再 1 分钟", "切块裹黄豆粉"], swaps: "可裹椰蓉", reason: "Q 弹小甜品。" },
    { name: "牛油果奶昔", emoji: "🥑", equipment: ["无设备"], minutes: 4, uses: ["牛奶"], goals: ["减脂", "治愈"], price: 12, calories: 260, steps: ["牛油果 + 牛奶 + 蜂蜜", "破壁机打 30 秒", "倒入杯子撒燕麦"], swaps: "无破壁机用搅拌棒", reason: "高纤维早餐。" },
    { name: "抹茶拿铁", emoji: "🍵", equipment: ["微波炉"], minutes: 4, uses: ["牛奶"], goals: ["治愈"], price: 8, calories: 220, steps: ["抹茶粉+热水搅匀", "牛奶加热 1 分钟", "倒在抹茶上"], swaps: "抹茶换可可", reason: "下午醒神。" },
    { name: "柠檬蜂蜜水", emoji: "🍋", equipment: ["无设备"], minutes: 3, uses: [], goals: ["减脂"], price: 4, calories: 60, steps: ["柠檬切片", "温水+蜂蜜", "搅一搅"], swaps: "蜂蜜换罗汉果糖", reason: "晨起 1 杯。" },

    // ===== 一锅出 / 电饭煲续 =====
    { name: "电饭煲咖喱鸡饭", emoji: "🍛", equipment: ["电饭煲"], minutes: 40, uses: ["米饭"], goals: ["治愈", "儿童"], price: 14, calories: 580, steps: ["鸡腿肉腌咖喱粉", "米和水正常比例，铺上鸡块洋葱土豆", "煮饭键跳后加咖喱块拌匀"], swaps: "咖喱块用日式即可", reason: "孩子超爱。" },
    { name: "电饭煲红烧鸡腿饭", emoji: "🍱", equipment: ["电饭煲"], minutes: 40, uses: ["米饭"], goals: ["治愈"], price: 14, calories: 580, steps: ["鸡腿用生抽老抽冰糖姜片腌", "米和水正常比例铺鸡腿", "煮饭键跳后焖 5 分钟"], swaps: "可加香菇", reason: "卤肉饭家庭版。" },
    { name: "电饭煲糯米鸡", emoji: "🍱", equipment: ["电饭煲"], minutes: 50, uses: ["米饭"], goals: ["治愈"], price: 16, calories: 620, steps: ["糯米和大米 1:1", "鸡块+香菇+腊肠铺米上", "煮饭键 + 焖 10 分钟"], swaps: "腊肠可换培根", reason: "广式糯米鸡。" },
    { name: "电饭煲叉烧饭", emoji: "🍱", equipment: ["电饭煲"], minutes: 38, uses: ["米饭"], goals: ["治愈"], price: 16, calories: 580, steps: ["叉烧切片", "米煮饭", "饭好铺叉烧+一勺豉油"], swaps: "叉烧可换烤鸭", reason: "茶餐厅级。" },
    { name: "电饭煲滑蛋牛肉饭", emoji: "🥩", equipment: ["电饭煲"], minutes: 35, uses: ["米饭"], goals: ["治愈"], price: 22, calories: 620, steps: ["米煮成饭", "牛肉片用蚝油生抽腌", "饭好铺牛肉打蛋焖 5 分钟"], swaps: "牛肉换肥牛卷", reason: "日式牛肉饭家庭版。" },
    { name: "电饭煲蒜蓉粉丝蒸虾", emoji: "🦐", equipment: ["电饭煲"], minutes: 25, uses: ["虾仁"], goals: ["治愈"], price: 26, calories: 320, steps: ["粉丝泡软铺底", "虾开背摆上+蒜蓉酱", "电饭煲蒸 12 分钟"], swaps: "虾换扇贝", reason: "硬菜级懒人版。" },
    { name: "电饭煲咸鱼蒸排骨", emoji: "🍖", equipment: ["电饭煲"], minutes: 50, uses: [], goals: ["治愈"], price: 20, calories: 520, steps: ["排骨腌生抽淀粉糖蒜末", "咸鱼切丁铺面", "电饭煲蒸/煮饭模式 25 分钟"], swaps: "咸鱼可省", reason: "广式蒸功夫。" },
    { name: "电饭煲奶油蘑菇汤", emoji: "🥣", equipment: ["电饭煲"], minutes: 30, uses: [], goals: ["治愈"], price: 12, calories: 360, steps: ["蘑菇切片", "电饭煲煮汤模式+黄油+面粉", "倒牛奶煮 10 分钟"], swaps: "可加培根", reason: "西式汤家庭版。" },
    { name: "电饭煲八宝饭", emoji: "🍡", equipment: ["电饭煲"], minutes: 50, uses: ["米饭"], goals: ["治愈"], price: 14, calories: 580, steps: ["糯米泡 2 小时", "铺红枣莲子葡萄干", "电饭煲煮饭模式"], swaps: "可加豆沙", reason: "节庆甜饭。" },

    // ===== 空气炸锅续 =====
    { name: "空炸鸡米花", emoji: "🍗", equipment: ["空气炸锅"], minutes: 18, uses: ["鸡胸"], goals: ["儿童", "治愈"], price: 14, calories: 380, steps: ["鸡胸切丁腌生抽蛋液", "裹面包糠", "200°C 烤 10 分钟"], swaps: "面包糠可换玉米片碎", reason: "肯德基平替。" },
    { name: "空炸鸡腿堡", emoji: "🍔", equipment: ["空气炸锅"], minutes: 25, uses: ["鸡胸"], goals: ["治愈"], price: 18, calories: 580, steps: ["鸡腿肉腌+裹粉", "200°C 烤 12 分钟翻面再 6 分钟", "夹汉堡胚+生菜+蛋黄酱"], swaps: "胸肉换鸡腿", reason: "麦记平替。" },
    { name: "空炸黄金土豆角", emoji: "🥔", equipment: ["空气炸锅"], minutes: 22, uses: ["土豆"], goals: ["省钱", "治愈"], price: 4, calories: 280, steps: ["土豆切角泡水", "盐+橄榄油+黑胡椒", "200°C 18 分钟翻面一次"], swaps: "可撒帕玛森", reason: "比薯条还香。" },
    { name: "空炸糖醋小排", emoji: "🍖", equipment: ["空气炸锅"], minutes: 30, uses: [], goals: ["治愈"], price: 22, calories: 480, steps: ["排骨腌生抽糖醋", "180°C 18 分钟", "刷糖醋汁再 3 分钟"], swaps: "排骨换鸡翅", reason: "上海老味道。" },
    { name: "空炸咸蛋黄南瓜", emoji: "🎃", equipment: ["空气炸锅"], minutes: 22, uses: [], goals: ["治愈"], price: 8, calories: 280, steps: ["南瓜条+咸蛋黄+黄油", "180°C 烤 15 分钟", "翻一次"], swaps: "南瓜换土豆", reason: "盐蛋黄控泪目。" },
    { name: "空炸三文鱼柳", emoji: "🐟", equipment: ["空气炸锅"], minutes: 18, uses: [], goals: ["减脂"], price: 28, calories: 360, steps: ["三文鱼撒盐黑胡椒柠檬", "180°C 烤 10 分钟", "撒香草"], swaps: "三文鱼换巴沙鱼", reason: "餐厅级减脂主餐。" },
    { name: "空炸口蘑塞肉", emoji: "🍄", equipment: ["空气炸锅"], minutes: 20, uses: [], goals: ["治愈"], price: 12, calories: 240, steps: ["口蘑去蒂", "塞肉末+蛋液", "180°C 12 分钟"], swaps: "肉末可换素馅", reason: "宴客级小菜。" },
    { name: "空炸虾片自制", emoji: "🍤", equipment: ["空气炸锅"], minutes: 8, uses: [], goals: ["儿童"], price: 6, calories: 220, steps: ["生虾片放入炸篮", "180°C 4-5 分钟", "撒椒盐"], swaps: "可加芝士粉", reason: "孩子零食 DIY。" },
    { name: "空炸吐司脆", emoji: "🍞", equipment: ["空气炸锅"], minutes: 10, uses: ["面包"], goals: ["治愈"], price: 5, calories: 320, steps: ["吐司切块刷黄油+糖", "180°C 8 分钟", "撒肉桂粉"], swaps: "可加蜂蜜", reason: "下午茶。" },

    // ===== 一锅菜 续 =====
    { name: "一锅出冬瓜虾仁汤", emoji: "🦐", equipment: ["一口锅"], minutes: 18, uses: ["虾仁"], goals: ["减脂", "长辈"], price: 18, calories: 220, steps: ["冬瓜切块加水煮开", "虾仁滑入煮 3 分钟", "盐+葱花"], swaps: "虾仁换瑶柱", reason: "夏季清淡。" },
    { name: "一锅出青椒土豆丝", emoji: "🥔", equipment: ["一口锅"], minutes: 12, uses: ["土豆"], goals: ["省钱"], price: 5, calories: 280, steps: ["土豆青椒切丝", "热油爆蒜+干辣椒", "炒入醋+盐"], swaps: "可加葱姜", reason: "国民下饭素。" },
    { name: "一锅出鱼香肉丝", emoji: "🐷", equipment: ["一口锅"], minutes: 18, uses: [], goals: ["治愈"], price: 14, calories: 460, steps: ["猪肉丝腌淀粉", "豆瓣酱+泡椒爆香", "下肉丝+木耳+笋丝+鱼香汁"], swaps: "肉丝换鸡丝", reason: "经典川菜。" },
    { name: "一锅出宫保鸡丁", emoji: "🌶️", equipment: ["一口锅"], minutes: 18, uses: ["鸡胸"], goals: ["治愈"], price: 14, calories: 480, steps: ["鸡丁腌淀粉", "热油爆花椒干辣椒", "下鸡丁+葱+花生+宫保汁"], swaps: "花生可换腰果", reason: "家常硬菜。" },
    { name: "一锅出地三鲜", emoji: "🍆", equipment: ["一口锅"], minutes: 20, uses: ["土豆"], goals: ["治愈"], price: 8, calories: 380, steps: ["茄子土豆切块过油", "下青椒+蒜末", "生抽蚝油糖收汁"], swaps: "可少油版烤箱替代", reason: "东北经典。" },
    { name: "一锅出酸辣土豆丝", emoji: "🥔", equipment: ["一口锅"], minutes: 12, uses: ["土豆"], goals: ["省钱"], price: 4, calories: 260, steps: ["土豆刨丝泡水", "热油爆蒜+干辣椒", "下土豆丝+醋+盐+糖"], swaps: "可加青椒丝", reason: "大学食堂第一名。" },
    { name: "一锅出葱爆牛肉", emoji: "🥩", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["治愈"], price: 22, calories: 480, steps: ["牛肉片腌生抽淀粉", "大火爆熟盛出", "葱段爆香+回锅+蚝油"], swaps: "可加洋葱", reason: "下饭硬菜。" },
    { name: "一锅出干煸豆角", emoji: "🫛", equipment: ["一口锅"], minutes: 15, uses: [], goals: ["治愈"], price: 8, calories: 240, steps: ["豆角焯水控干", "热油下肉末干辣椒", "下豆角煸+生抽糖"], swaps: "肉末可换虾米", reason: "下饭菜。" },
    { name: "一锅出回锅肉", emoji: "🐷", equipment: ["一口锅"], minutes: 18, uses: [], goals: ["治愈"], price: 18, calories: 540, steps: ["五花肉煮 8 分钟切片", "下豆瓣酱+蒜苗", "翻炒+生抽糖"], swaps: "蒜苗可换青椒", reason: "国民川菜。" },
    { name: "一锅出青椒肉丝", emoji: "🌶️", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["治愈"], price: 12, calories: 360, steps: ["猪肉丝腌淀粉", "热油爆肉丝", "下青椒丝+生抽蚝油"], swaps: "可加冬笋丝", reason: "家常硬菜。" },
    { name: "一锅出韭菜炒肉", emoji: "🌿", equipment: ["一口锅"], minutes: 10, uses: [], goals: ["治愈"], price: 10, calories: 320, steps: ["猪肉丝爆熟", "下韭菜段", "盐+生抽快炒"], swaps: "韭菜换芹菜", reason: "10 分钟下饭。" },
    { name: "一锅出葱姜炒花蛤", emoji: "🐚", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["治愈"], price: 18, calories: 220, steps: ["花蛤吐沙焯水", "热油爆姜葱蒜", "下花蛤+生抽料酒"], swaps: "花蛤换蛏子", reason: "海鲜快手。" },

    // ===== 拌饭 / 拌面 续 =====
    { name: "黄瓜火腿拌饭", emoji: "🥒", equipment: ["微波炉"], minutes: 8, uses: ["米饭"], goals: ["省钱"], price: 7, calories: 460, steps: ["热米饭", "黄瓜丁火腿丁", "辣椒酱+生抽+香油拌"], swaps: "可加煎蛋", reason: "5 分钟拌饭。" },
    { name: "葱花酱油拌面", emoji: "🍜", equipment: ["一口锅"], minutes: 8, uses: ["面条"], goals: ["省钱", "治愈"], price: 4, calories: 460, steps: ["面条煮熟过水", "碗底生抽+葱+一点猪油", "拌一拌"], swaps: "可加溏心蛋", reason: "极简版葱油拌面。" },
    { name: "麻辣麻酱拌面", emoji: "🌶️", equipment: ["一口锅"], minutes: 10, uses: ["面条"], goals: ["治愈"], price: 6, calories: 480, steps: ["面条煮熟", "麻酱+辣椒油+花椒粉+蒜末+生抽", "拌入花生碎"], swaps: "可加黄瓜丝", reason: "西安麻酱凉皮平替。" },
    { name: "老干妈拌面", emoji: "🌶️", equipment: ["一口锅"], minutes: 7, uses: ["面条"], goals: ["治愈", "省钱"], price: 4, calories: 520, steps: ["面条煮熟", "1 大勺老干妈+生抽", "撒葱花"], swaps: "可加溏心蛋", reason: "宿舍救命神器。" },
    { name: "葱姜炒面", emoji: "🍝", equipment: ["一口锅"], minutes: 12, uses: ["面条"], goals: ["治愈"], price: 6, calories: 540, steps: ["面条煮 8 成熟过水", "热油爆葱姜", "下面条+生抽老抽炒"], swaps: "可加肉丝", reason: "10 分钟主食。" },

    // ===== 沙拉 续 =====
    { name: "鸡胸杂菜沙拉", emoji: "🥗", equipment: ["空气炸锅"], minutes: 15, uses: ["鸡胸"], goals: ["减脂"], price: 16, calories: 320, steps: ["鸡胸 180°C 8 分钟", "生菜+黄瓜+小番茄+玉米", "油醋汁拌"], swaps: "可加紫甘蓝", reason: "减脂正餐。" },
    { name: "牛油果三文鱼沙拉", emoji: "🥑", equipment: ["无设备"], minutes: 8, uses: [], goals: ["减脂"], price: 28, calories: 380, steps: ["三文鱼切块（生食级）", "牛油果切块", "酱油+柠檬+黑胡椒"], swaps: "三文鱼可烤", reason: "高 omega 健身餐。" },
    { name: "鹰嘴豆沙拉", emoji: "🫛", equipment: ["无设备"], minutes: 6, uses: [], goals: ["减脂"], price: 10, calories: 320, steps: ["鹰嘴豆罐头沥水", "黄瓜+番茄+洋葱碎", "柠檬+橄榄油+盐"], swaps: "可加菲达奶酪", reason: "中东风沙拉。" },
    { name: "豆腐沙拉", emoji: "🟨", equipment: ["无设备"], minutes: 5, uses: ["豆腐"], goals: ["减脂"], price: 6, calories: 220, steps: ["内酯豆腐切块", "番茄+菠菜+橄榄油", "黑胡椒+柠檬"], swaps: "可加坚果", reason: "无肉减脂。" },

    // ===== 速食升级 =====
    { name: "速食意面（升级版）", emoji: "🍝", equipment: ["微波炉"], minutes: 10, uses: [], goals: ["治愈", "省钱"], price: 12, calories: 540, steps: ["速食意面微波 3 分钟", "番茄酱+蒜末+黄油拌", "撒帕玛森"], swaps: "意面换通心粉", reason: "便利店升级。" },
    { name: "速冻披萨升级", emoji: "🍕", equipment: ["空气炸锅"], minutes: 12, uses: [], goals: ["治愈"], price: 16, calories: 580, steps: ["速冻披萨", "180°C 8 分钟", "撒额外芝士+辣椒"], swaps: "可加蘑菇", reason: "Costco 神物。" },
    { name: "速冻虾球", emoji: "🍤", equipment: ["空气炸锅"], minutes: 12, uses: [], goals: ["治愈"], price: 14, calories: 360, steps: ["速冻虾球放入", "180°C 10 分钟", "蘸番茄酱"], swaps: "虾球换鸡米花", reason: "孩子下午茶。" },
    { name: "速冻牛肉饼汉堡", emoji: "🍔", equipment: ["空气炸锅"], minutes: 12, uses: [], goals: ["治愈"], price: 18, calories: 560, steps: ["速冻肉饼空炸 8 分钟", "汉堡胚烤", "夹芝士+生菜+番茄"], swaps: "肉饼换鸡腿排", reason: "家庭版麦满分。" },
    { name: "鸡肉肠卷饼", emoji: "🌯", equipment: ["一口锅"], minutes: 10, uses: [], goals: ["省钱"], price: 8, calories: 460, steps: ["手抓饼煎好", "夹烤肠+蛋+生菜", "刷甜辣酱卷起"], swaps: "可加黄瓜丝", reason: "学校门口同款。" },

    // ===== 长辈 / 儿童 续 =====
    { name: "山药排骨汤", emoji: "🍲", equipment: ["电饭煲"], minutes: 60, uses: [], goals: ["长辈"], price: 22, calories: 320, steps: ["排骨焯水", "山药+枸杞+姜片", "炖汤模式 1 小时"], swaps: "可加红枣", reason: "养胃暖身。" },
    { name: "莲藕排骨汤", emoji: "🍲", equipment: ["电饭煲"], minutes: 60, uses: [], goals: ["长辈"], price: 18, calories: 360, steps: ["排骨莲藕焯水", "电饭煲炖汤模式", "盐胡椒葱花"], swaps: "可加花生", reason: "广式老火汤。" },
    { name: "黄豆猪蹄汤", emoji: "🍲", equipment: ["电饭煲"], minutes: 80, uses: [], goals: ["长辈"], price: 22, calories: 460, steps: ["猪蹄焯水", "黄豆泡软", "炖汤模式 1 小时"], swaps: "可加红枣", reason: "补胶原。" },
    { name: "蒸蛋羹（长辈版）", emoji: "🥚", equipment: ["微波炉"], minutes: 8, uses: ["鸡蛋"], goals: ["长辈", "儿童"], price: 4, calories: 180, steps: ["1 蛋打散+1.5 倍温水+少盐", "盖盘子微波 2 分钟", "淋豉油+香油"], swaps: "可加虾米", reason: "嫩到入口即化。" },
    { name: "南瓜小米山药粥", emoji: "🎃", equipment: ["电饭煲"], minutes: 50, uses: [], goals: ["长辈", "治愈"], price: 5, calories: 280, steps: ["南瓜山药切块+小米", "电饭煲煮粥", "可加红枣"], swaps: "可加银耳", reason: "三宝养胃。" },
    { name: "苹果鸡肉泥（儿童）", emoji: "🍎", equipment: ["微波炉"], minutes: 10, uses: ["鸡胸"], goals: ["儿童"], price: 12, calories: 240, steps: ["鸡胸切丁微波熟", "苹果擦碎", "搅拌器打成泥"], swaps: "可加胡萝卜", reason: "宝宝辅食。" },
    { name: "南瓜泥", emoji: "🎃", equipment: ["微波炉"], minutes: 8, uses: [], goals: ["儿童", "长辈"], price: 4, calories: 160, steps: ["南瓜切块微波 5 分钟", "压成泥", "拌少许橄榄油"], swaps: "可加蓝莓", reason: "0 添加。" },
    { name: "胡萝卜山药蒸糕", emoji: "🥕", equipment: ["微波炉"], minutes: 12, uses: [], goals: ["儿童"], price: 6, calories: 220, steps: ["胡萝卜山药打泥+鸡蛋+面粉", "蒸 8 分钟", "切块"], swaps: "可加紫薯", reason: "宝宝辅食。" },

    // ===== 异国风 =====
    { name: "日式亲子丼", emoji: "🍱", equipment: ["一口锅"], minutes: 15, uses: ["米饭", "鸡蛋"], goals: ["治愈"], price: 14, calories: 580, steps: ["鸡腿肉切块煮", "汤底（生抽+味淋+糖）", "打蛋淋上盖在饭上"], swaps: "鸡腿换鸡胸", reason: "日剧同款。" },
    { name: "日式咖喱牛肉饭", emoji: "🍛", equipment: ["一口锅"], minutes: 30, uses: ["米饭"], goals: ["治愈", "儿童"], price: 18, calories: 620, steps: ["牛肉土豆胡萝卜煮 20 分钟", "加咖喱块煮 5 分钟", "盖饭"], swaps: "牛肉换鸡腿", reason: "日剧同款。" },
    { name: "韩式紫菜包饭", emoji: "🍣", equipment: ["无设备"], minutes: 15, uses: ["米饭"], goals: ["治愈"], price: 12, calories: 460, steps: ["米饭加香油盐拌匀", "紫菜上铺米+蛋丝+黄瓜+胡萝卜", "卷紧切块"], swaps: "可加金枪鱼", reason: "便当神器。" },
    { name: "韩式辣炒年糕", emoji: "🍢", equipment: ["一口锅"], minutes: 15, uses: [], goals: ["治愈"], price: 12, calories: 540, steps: ["年糕泡热水", "辣酱+番茄酱+糖煮开", "下年糕鱼饼煮 5 分钟"], swaps: "可加芝士", reason: "韩剧同款。" },
    { name: "泰式冬阴功（速食版）", emoji: "🥣", equipment: ["一口锅"], minutes: 15, uses: ["虾仁"], goals: ["治愈"], price: 18, calories: 380, steps: ["冬阴功调料块+水煮开", "下虾草菇番茄", "撒柠檬叶香茅"], swaps: "可加椰浆", reason: "酸辣开胃。" },
    { name: "墨西哥卷饼速成", emoji: "🌯", equipment: ["一口锅"], minutes: 15, uses: ["鸡胸"], goals: ["治愈"], price: 14, calories: 540, steps: ["鸡胸丁炒香+辣椒粉+孜然", "墨西哥饼皮包鸡肉+生菜+番茄+酸奶油", "卷起"], swaps: "可加芝士", reason: "出门野餐。" },
    { name: "意式蛋包饭", emoji: "🍳", equipment: ["一口锅"], minutes: 15, uses: ["米饭", "鸡蛋"], goals: ["治愈"], price: 10, calories: 520, steps: ["米饭加番茄酱炒香", "鸡蛋摊薄包饭", "撒帕玛森"], swaps: "可加培根", reason: "西式蛋包饭。" },
    { name: "印度黄油鸡（速成）", emoji: "🍗", equipment: ["一口锅"], minutes: 25, uses: [], goals: ["治愈"], price: 22, calories: 580, steps: ["鸡腿肉腌酸奶咖喱粉", "下番茄酱+牛奶+黄油煮 15 分钟", "配印度饼/米饭"], swaps: "可加葛拉姆马萨拉", reason: "异国风餐厅价 1/3。" },

    // ===== 大学/单身 速食 =====
    { name: "宿舍版蒜蓉芝士面包", emoji: "🥖", equipment: ["微波炉"], minutes: 6, uses: ["面包"], goals: ["治愈"], price: 5, calories: 420, steps: ["面包夹蒜末+黄油+芝士", "微波 1 分钟+撒香芹", "切片"], swaps: "可加香肠", reason: "下午茶神。" },
    { name: "宿舍版速食粥（鸡肉香菇）", emoji: "🥣", equipment: ["微波炉"], minutes: 8, uses: ["鸡胸"], goals: ["治愈"], price: 8, calories: 320, steps: ["速食粥包+水", "微波 5 分钟", "撒鸡肉碎香菇粉"], swaps: "可加皮蛋", reason: "病了喝它。" },
    { name: "宿舍版速食拌饭", emoji: "🍚", equipment: ["微波炉"], minutes: 5, uses: ["米饭"], goals: ["省钱"], price: 6, calories: 460, steps: ["热米饭+老干妈+生抽+葱花", "拌匀", "可加溏心蛋"], swaps: "老干妈换辣椒酱", reason: "宿舍 1 分钟。" },

    // ===== 一锅出：家庭快手菜 =====
    { name: "家庭快手红烧肉", emoji: "🐷", equipment: ["一口锅"], minutes: 50, uses: [], goals: ["治愈"], price: 26, calories: 720, steps: ["五花肉切块焯水", "炒糖色下肉煸炒", "下生抽老抽+水焖 30 分钟"], swaps: "可加鸡蛋", reason: "下饭无敌。" },
    { name: "家庭版可乐鸡翅", emoji: "🥤", equipment: ["一口锅"], minutes: 30, uses: [], goals: ["儿童", "治愈"], price: 18, calories: 480, steps: ["鸡翅划口腌生抽", "下锅煎香+可乐+姜片", "焖 18 分钟收汁"], swaps: "鸡翅可换鸡腿", reason: "孩子最爱。" },
    { name: "家庭版糖醋排骨", emoji: "🍖", equipment: ["一口锅"], minutes: 35, uses: [], goals: ["治愈"], price: 22, calories: 580, steps: ["排骨焯水", "煎香加糖醋汁焖 20 分钟", "大火收汁"], swaps: "排骨换里脊", reason: "国民硬菜。" },
    { name: "家庭版宫保鸡丁（无花生）", emoji: "🌶️", equipment: ["一口锅"], minutes: 15, uses: ["鸡胸"], goals: ["治愈"], price: 12, calories: 380, steps: ["鸡丁腌淀粉", "热油爆花椒辣椒", "下鸡丁+宫保汁+腰果"], swaps: "腰果换葵花籽", reason: "无花生敏儿童版。" },
    { name: "家庭版鱼香茄子", emoji: "🍆", equipment: ["一口锅"], minutes: 20, uses: [], goals: ["治愈"], price: 8, calories: 380, steps: ["茄子切条过油", "豆瓣酱泡椒爆香", "下茄子+鱼香汁"], swaps: "茄子可改空炸", reason: "下饭凶器。" },
    { name: "家庭版水煮肉片", emoji: "🌶️", equipment: ["一口锅"], minutes: 20, uses: [], goals: ["治愈"], price: 22, calories: 540, steps: ["肉片腌淀粉", "豆瓣酱+水煮开", "下肉片+蔬菜+热油激辣椒"], swaps: "肉片换鱼片", reason: "川菜代表。" },
    { name: "家庭版麻辣豆腐煲", emoji: "🍲", equipment: ["一口锅"], minutes: 15, uses: ["豆腐"], goals: ["治愈"], price: 8, calories: 320, steps: ["豆腐切块焯", "豆瓣酱炒红油+肉末", "下豆腐+水煮 5 分钟+葱花"], swaps: "肉末可省", reason: "下饭神器。" },
    { name: "家庭版红烧豆腐", emoji: "🟨", equipment: ["一口锅"], minutes: 18, uses: ["豆腐"], goals: ["治愈"], price: 8, calories: 360, steps: ["老豆腐切块煎金黄", "下生抽老抽+水煨", "撒葱花"], swaps: "可加肉末", reason: "素食友好硬菜。" },

    // ===== 早餐机续 =====
    { name: "早餐机三分钟蛋饼", emoji: "🥞", equipment: ["早餐机"], minutes: 6, uses: ["鸡蛋"], goals: ["儿童"], price: 5, calories: 240, steps: ["鸡蛋+面粉+牛奶搅匀", "早餐机倒入煎 3 分钟", "卷起来切段"], swaps: "可加香葱", reason: "孩子早餐。" },
    { name: "早餐机华夫饼", emoji: "🧇", equipment: ["早餐机"], minutes: 8, uses: ["鸡蛋", "牛奶"], goals: ["治愈"], price: 7, calories: 360, steps: ["华夫粉+鸡蛋+牛奶", "早餐机预热", "倒入煎 3 分钟"], swaps: "可加蓝莓", reason: "周末仪式感。" },
    { name: "早餐机鸡肉串", emoji: "🍢", equipment: ["早餐机"], minutes: 10, uses: ["鸡胸"], goals: ["减脂"], price: 12, calories: 320, steps: ["鸡胸切块腌", "竹签穿好", "早餐机煎双面"], swaps: "鸡胸换鸡翅", reason: "蛋白早餐。" },

    // ===== 微波炉续 =====
    { name: "微波炉芝士薯泥", emoji: "🥔", equipment: ["微波炉"], minutes: 8, uses: ["土豆"], goals: ["治愈", "儿童"], price: 6, calories: 380, steps: ["土豆切块微波 5 分钟", "压成泥+牛奶+芝士", "再微波 1 分钟"], swaps: "可加培根碎", reason: "孩子至爱。" },
    { name: "微波炉蛋花番茄汤", emoji: "🍅", equipment: ["微波炉"], minutes: 5, uses: ["鸡蛋", "番茄"], goals: ["治愈"], price: 5, calories: 160, steps: ["碗里水+番茄丁微波 3 分钟", "打入鸡蛋搅", "再微波 1 分钟+葱花"], swaps: "可加紫菜", reason: "5 分钟暖胃。" },
    { name: "微波炉糯米鸡仿版", emoji: "🍱", equipment: ["微波炉"], minutes: 12, uses: ["米饭"], goals: ["治愈"], price: 14, calories: 540, steps: ["糯米饭+鸡腿块+香菇", "盘子盖保鲜膜", "高火 8 分钟"], swaps: "可加腊肠", reason: "广式糯米鸡偷懒版。" },
    { name: "微波炉蒸地瓜", emoji: "🍠", equipment: ["微波炉"], minutes: 7, uses: [], goals: ["减脂"], price: 3, calories: 180, steps: ["地瓜洗净厨房纸包", "高火 4 分钟", "翻面再 3 分钟"], swaps: "可改空炸", reason: "下午茶 5 分钟。" },
    { name: "微波炉馒头蒸", emoji: "🥟", equipment: ["微波炉"], minutes: 4, uses: [], goals: ["省钱"], price: 4, calories: 280, steps: ["馒头喷少量水", "盘子盖保鲜膜", "高火 1 分钟"], swaps: "可加红枣", reason: "速热馒头不干。" },
    { name: "微波炉烤红薯（升级）", emoji: "🍠", equipment: ["微波炉"], minutes: 9, uses: [], goals: ["减脂"], price: 4, calories: 220, steps: ["红薯洗净戳孔", "高火 5 分钟翻面再 4 分钟", "撕皮"], swaps: "可加咸蛋黄", reason: "下午救命。" },

    // ===== 治愈系 续 =====
    { name: "番茄牛腩饭（高压锅版）", emoji: "🍱", equipment: ["电饭煲", "一口锅"], minutes: 50, uses: ["米饭"], goals: ["治愈"], price: 22, calories: 580, steps: ["牛腩焯水", "下番茄洋葱炖", "高压锅 25 分钟+饭"], swaps: "可加土豆", reason: "下饭硬菜。" },
    { name: "鸡汤面线", emoji: "🍜", equipment: ["一口锅"], minutes: 10, uses: ["面条", "鸡蛋"], goals: ["治愈"], price: 8, calories: 460, steps: ["鸡汤包+水开", "下面线 2 分钟", "打入鸡蛋+葱花"], swaps: "鸡汤可自熬", reason: "感冒了喝它。" },
    { name: "罗宋汤简版", emoji: "🍅", equipment: ["一口锅"], minutes: 25, uses: ["番茄"], goals: ["治愈"], price: 14, calories: 380, steps: ["牛肉/牛腩切块焯", "番茄洋葱土豆胡萝卜+水", "炖 18 分钟+番茄酱"], swaps: "可加白菜", reason: "上海老味道。" },
    { name: "豆腐脑（早餐版）", emoji: "🥣", equipment: ["微波炉"], minutes: 5, uses: ["豆腐"], goals: ["治愈", "长辈"], price: 4, calories: 180, steps: ["内酯豆腐倒碗", "微波 1 分钟", "淋调料：榨菜碎+香菜+蒜末+生抽辣油"], swaps: "可加虾米", reason: "北方早餐。" },
    { name: "海带豆腐汤", emoji: "🍲", equipment: ["一口锅"], minutes: 12, uses: ["豆腐"], goals: ["减脂", "长辈"], price: 6, calories: 140, steps: ["海带切丝煮 5 分钟", "豆腐块下锅", "盐+葱花+一点香油"], swaps: "可加虾皮", reason: "清淡养胃。" },
    { name: "西红柿牛肉丸子汤", emoji: "🍲", equipment: ["一口锅"], minutes: 15, uses: ["番茄"], goals: ["治愈"], price: 12, calories: 280, steps: ["番茄切块炒出汁加水", "下牛肉丸煮 8 分钟", "盐+葱花"], swaps: "牛肉丸可换鱼丸", reason: "酸爽暖胃。" },

    // ===== 一口锅 续 =====
    { name: "一口锅葱花蛋饼", emoji: "🥞", equipment: ["一口锅"], minutes: 6, uses: ["鸡蛋"], goals: ["省钱", "治愈"], price: 4, calories: 240, steps: ["鸡蛋+葱花+面粉+水搅匀", "平底锅煎成饼", "切块"], swaps: "可加虾米", reason: "5 分钟早餐。" },
    { name: "一口锅蒜蓉粉丝蒸娃娃菜", emoji: "🥬", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["减脂"], price: 6, calories: 180, steps: ["娃娃菜剖开+粉丝铺底", "蒜蓉酱+热油激", "蒸 8 分钟"], swaps: "可加扇贝", reason: "粤式蒸菜。" },
    { name: "一口锅炒饭（隔夜饭复活）", emoji: "🍚", equipment: ["一口锅"], minutes: 10, uses: ["米饭", "鸡蛋"], goals: ["省钱"], price: 6, calories: 480, steps: ["热油炒鸡蛋", "下米饭翻炒", "生抽+葱花+火腿丁"], swaps: "可加豌豆", reason: "隔夜饭归宿。" },
    { name: "一口锅鸡蛋羹（配饭）", emoji: "🥚", equipment: ["一口锅"], minutes: 12, uses: ["鸡蛋"], goals: ["治愈"], price: 4, calories: 200, steps: ["鸡蛋打散+1.5 倍水", "锅蒸 10 分钟", "淋豉油"], swaps: "可加肉末", reason: "下饭凶。" },

    // ===== 速冻续 =====
    { name: "速冻包子煎着吃", emoji: "🥟", equipment: ["一口锅"], minutes: 12, uses: [], goals: ["治愈"], price: 8, calories: 380, steps: ["包子刷少量油", "平底锅煎底面", "加水蒸 5 分钟"], swaps: "可换饺子", reason: "脆底包子。" },
    { name: "速冻烧麦微波", emoji: "🥟", equipment: ["微波炉"], minutes: 5, uses: [], goals: ["省钱"], price: 8, calories: 360, steps: ["烧麦喷水", "盖保鲜膜", "微波 2 分钟"], swaps: "可换包子", reason: "早餐速热。" },
    { name: "速冻汤圆煮", emoji: "🍡", equipment: ["一口锅"], minutes: 8, uses: [], goals: ["治愈", "儿童"], price: 5, calories: 320, steps: ["水开下汤圆 5 分钟", "汤里加红糖姜片", "撒桂花"], swaps: "可加酒酿", reason: "冬日治愈。" },
  ];
  return tpls.map((t, i) => ({ id: `lazy-x${i + 100}`, ...t }));
}

export interface LazyMealQuery {
  equipment?: LazyEquipment[];
  maxMinutes?: LazyTime;
  fridge?: LazyFridge[];
  goals?: LazyGoal[];
}

export interface LazyMealPick {
  special: LazyMeal;
  alternatives: LazyMeal[];
  /** 用户指定了设备但该设备模板池为空时给出的提示；UI 据此渲染「替代方案」横幅 */
  fallbackNote?: string;
}

function rankMeals(pool: LazyMeal[], q: LazyMealQuery): LazyMeal[] {
  const fridge = q.fridge ?? [];
  const goals = q.goals ?? [];
  const maxMin = q.maxMinutes ?? 30;
  return pool
    .map((m) => {
      let score = Math.random() * 1.2;
      if (m.minutes <= maxMin) score += 1.5;
      else score -= (m.minutes - maxMin) / 10;
      if (fridge.length > 0) {
        const hits = m.uses.filter((u) => fridge.includes(u)).length;
        score += hits * 1.4;
      }
      if (goals.length > 0) {
        const hits = m.goals.filter((g) => goals.includes(g)).length;
        score += hits * 1.5;
      }
      return { m, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

export function pickLazyMeal(q: LazyMealQuery): LazyMealPick {
  const eq = q.equipment ?? [];

  // 用户明确选择了设备：先在该设备池里硬筛，池非空即只在池内随机；池为空才回退。
  if (eq.length > 0) {
    const inEquipment = LAZY_MEALS.filter((m) =>
      m.equipment.some((e) => eq.includes(e)),
    );
    if (inEquipment.length > 0) {
      const ranked = rankMeals(inEquipment, q);
      const special = ranked[0];
      const alts = ranked.slice(1, 5);
      return { special, alternatives: alts };
    }
    // 该设备池完全为空 — 这种情况理论上不会发生（电饭煲/空气炸锅等都已有候选），
    // 但保底回退到全库，并显式提示这是替代方案。
    const ranked = rankMeals(LAZY_MEALS, q);
    return {
      special: ranked[0],
      alternatives: ranked.slice(1, 5),
      fallbackNote: `「${eq.join(" / ")}」暂无完全匹配的模板，给你一个替代方案`,
    };
  }

  // 没选设备：全库排序。
  const ranked = rankMeals(LAZY_MEALS, q);
  return { special: ranked[0], alternatives: ranked.slice(1, 5) };
}
