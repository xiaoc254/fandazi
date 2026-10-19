// 懒人决定面板的「温柔文案 + 短诗 / 安慰句」库。
// 按心情分组，让每次 result 至少有一句安慰话；不替代医疗 / 心理建议。
// 都是公开使用度高的短句，不带具体作者声明。

export type LazyMood = "开心" | "压力大" | "疲惫" | "沮丧" | "想奖励自己" | "平淡";

/** 一行心情语 — 出现在「今日特别决定」标题下面。 */
export const MOOD_QUOTES: Record<LazyMood, string[]> = {
  开心: [
    "今天的好心情值得一顿小奖励 🌷",
    "笑着吃，更香一点",
    "好天气好心情，把光阴吃进胃里",
    "今天给自己加一道甜",
  ],
  压力大: [
    "先吃口热的，事情慢慢来 🍵",
    "今天对自己温柔一点，别赶",
    "再忙的人也要好好吃这一顿",
    "把肩膀放下来，米饭还热着",
  ],
  疲惫: [
    "来一份不用动脑的吃食，钻进沙发里 🛋️",
    "明天再说，今晚先吃饱睡好",
    "饭后躺平不愧疚，是身体应得的",
    "今天的奖励是不再思考",
  ],
  沮丧: [
    "有些日子就是难，先把今晚搞定 🌙",
    "吃完这顿，世界明天会亮一点",
    "天会黑也会亮，先吃饭",
    "你已经撑过了今天的大半，剩下的交给一顿好饭",
  ],
  想奖励自己: [
    "你值得一份硬菜 🍖",
    "今天是给自己 buff 的日子",
    "辛苦了，多加一勺",
    "把好的留给自己一次",
  ],
  平淡: [
    "平淡是日常，按这个吃就行 🍚",
    "省心首选，按这套来",
    "稳稳地过一天，也很好",
    "把简单一餐吃完整，已经胜过很多",
  ],
};

/** 多行温柔小段落 — 给海报 / 卡片 footer 用。 */
export const TENDER_PARAGRAPHS: string[] = [
  "把饭吃完，把水喝够，把肩膀放下来。",
  "今天先做这三件事就够了：吃、喝、好好睡。",
  "桌上的一碗饭，是和自己和解的小仪式。",
  "焦虑是常客，热乎的饭也是 — 让后者多陪你一会。",
  "你不需要赢过谁，只需要好好喂饱自己。",
  "饭已上桌，世界外面的事都先靠边。",
  "把今晚交给厨房和沙发吧，余下的明天再答。",
  "对自己温柔，从这一筷开始。",
  "慢一点吃，时间也会慢一点。",
  "不必挑剔今天的自己，先把饭吃热。",
];

/** 短诗 / 古句（公共领域 / 高引用度），按心情挑选给「今日特别决定」配色。 */
export const POEMS: { mood: LazyMood[]; text: string; from?: string }[] = [
  { mood: ["开心", "想奖励自己"], text: "人间烟火气，最抚凡人心。" },
  { mood: ["压力大", "疲惫"], text: "且将新火试新茶，诗酒趁年华。", from: "苏轼" },
  { mood: ["压力大", "沮丧"], text: "心安茅屋稳，性定菜根香。" },
  { mood: ["沮丧", "疲惫"], text: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", from: "苏轼" },
  { mood: ["平淡"], text: "晚来天欲雪，能饮一杯无？", from: "白居易" },
  { mood: ["开心"], text: "人生忽如寄，多忧何为？" },
  { mood: ["疲惫", "压力大"], text: "莫听穿林打叶声，何妨吟啸且徐行。", from: "苏轼" },
  { mood: ["想奖励自己"], text: "夜雨剪春韭，新炊间黄粱。", from: "杜甫" },
  { mood: ["平淡", "开心"], text: "蒌蒿满地芦芽短，正是河豚欲上时。", from: "苏轼" },
  { mood: ["沮丧"], text: "山重水复疑无路，柳暗花明又一村。", from: "陆游" },
];

/** 给指定心情挑一句诗。每个心情至少有一条候选，落空走通用句。 */
export function poemFor(mood: LazyMood, seed: number): { text: string; from?: string } {
  const cands = POEMS.filter((p) => p.mood.includes(mood));
  const pool = cands.length > 0 ? cands : POEMS;
  return pool[Math.abs(seed) % pool.length];
}

/** 心情 → 一段温柔小话 */
export function tenderParagraph(seed: number): string {
  return TENDER_PARAGRAPHS[Math.abs(seed) % TENDER_PARAGRAPHS.length];
}

/** 心情 → mood quote */
export function moodQuote(mood: LazyMood, seed: number): string {
  const arr = MOOD_QUOTES[mood];
  return arr[Math.abs(seed) % arr.length];
}
