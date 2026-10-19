// 「懒人一键决定」：把今日生活的常见选择困难一次性解决。
// 综合：吃什么菜（recipes）+ 外卖品牌 + 零食 + 水果 + 视频 / 聊什么。
// 不接 AI；纯静态 + 简单加权。

import { useMemo, useState } from "react";
import {
  Wand2,
  Sparkles,
  Smile,
  Cloud,
  Users,
  Wallet,
  RefreshCw,
  ExternalLink,
  ChefHat,
  Apple,
  Cookie,
  Bike,
  Tv,
  MessageCircle,
  Heart,
  Plus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RECIPES } from "@/data/recipes";
import { pickTakeout, type TakeoutTaste } from "@/data/takeoutBrands";
import { pickSnack, snackSearchLinks, type SnackAudience } from "@/data/snacks";
import { pickFruit, type FruitAudience } from "@/data/fruits";
import { recommendWatch, recommendTopics, type CompanionContext } from "@/lib/companionRecommend";
import { LazyWizardDialog, type WizardAnswers } from "@/components/LazyWizardDialog";
import { DecisionPoster } from "@/components/DecisionPoster";
import { WeeklyPlanPanel } from "@/components/WeeklyPlanPanel";
import { LazyMealsPanel } from "@/components/LazyMealsPanel";
import { addSelected } from "@/lib/selectedToday";
import { buildLazyItems, totalsOfLazyItems } from "@/lib/lazyEstimates";
import { FoodImage, stableSearchUrl } from "@/components/FoodImage";
import { moodQuote, poemFor, tenderParagraph } from "@/lib/lazyCopy";
import { useReactions } from "@/hooks/useReactions";

type Mood = "开心" | "压力大" | "疲惫" | "沮丧" | "想奖励自己" | "平淡";
type Weather = "晴" | "雨" | "冷" | "热" | "舒适" | "未知";

const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: "开心", label: "开心", emoji: "😄" },
  { id: "压力大", label: "压力大", emoji: "😣" },
  { id: "疲惫", label: "疲惫", emoji: "🥱" },
  { id: "沮丧", label: "沮丧", emoji: "😔" },
  { id: "想奖励自己", label: "想奖励自己", emoji: "🎁" },
  { id: "平淡", label: "平淡", emoji: "🙂" },
];

const WEATHERS: { id: Weather; label: string; emoji: string }[] = [
  { id: "舒适", label: "舒适", emoji: "🌤️" },
  { id: "晴", label: "晴朗", emoji: "☀️" },
  { id: "雨", label: "下雨", emoji: "🌧️" },
  { id: "冷", label: "冷", emoji: "🥶" },
  { id: "热", label: "热", emoji: "🥵" },
  { id: "未知", label: "懒得选", emoji: "❓" },
];

interface LazyResult {
  recipe: { name: string; cuisine: string; reason: string } | null;
  takeoutBrand: { id: string; name: string; emoji: string; intro: string; budgetMin: number; budgetMax: number };
  snack: { id: string; name: string; emoji: string; reason: string; price: string; calories: number };
  fruit: { id: string; name: string; emoji: string; reason: string; calories: number };
  watch: { title: string; type: string; reason: string } | null;
  topic: { text: string } | null;
  drink: string;
  quote: string;
  /** 一句汇总文案 */
  summary: string;
  /** 估价（本桌总和，元） */
  priceEst: number;
  /** 估热量（本人，kcal） */
  caloriesEst: number;
  /** 是否超预算 */
  overBudget: boolean;
  /** 海报与浮窗共享的 SelectedItem-like estimate 列表 */
  items: ReturnType<typeof buildLazyItems>;
  /** 短诗 / 古句 — 按心情挑 */
  poem: { text: string; from?: string };
  /** 一段温柔小话 */
  tender: string;
  /** 外卖品牌 gradient（用于图卡 fallback） */
  takeoutGradient?: [string, string];
}

export function LazyDecisionPanel() {
  const [mood, setMood] = useState<Mood>("平淡");
  const [weather, setWeather] = useState<Weather>("舒适");
  const [people, setPeople] = useState<number>(1);
  const [budget, setBudget] = useState<number>(40);
  const [tastes, setTastes] = useState<TakeoutTaste[]>([]);
  const [interest, setInterest] = useState<"治愈" | "搞笑" | "学习" | "热血" | "无所谓">("无所谓");
  const [nonce, setNonce] = useState(0);
  const dishReactions = useReactions("dish");
  const snackReactions = useReactions("snack");
  const fruitReactions = useReactions("fruit");

  const result = useMemo<LazyResult>(() => {
    // 1. 心情 / 天气 → 推荐菜偏好
    const wantHot = weather === "冷" || weather === "雨";
    const wantCold = weather === "热";
    const sweetMood = mood === "沮丧" || mood === "想奖励自己" || mood === "压力大";

    // 2. 菜推荐：从 RECIPES 主菜中挑 1。
    //    避开用户反馈过「不喜欢」的主菜；「喜欢」过的主菜稍微提高被命中概率。
    const mainCandsRaw = RECIPES.filter((r) => r.course === "main");
    const filtered = mainCandsRaw.filter((r) => !dishReactions.dislikes.has(r.id));
    const mainCands = filtered.length >= 5 ? filtered : mainCandsRaw;
    const weights = mainCands.map((r) => (dishReactions.likes.has(r.id) ? 3 : 1));
    const total = weights.reduce((a, b) => a + b, 0);
    let target = Math.random() * total;
    let recipeIdx = 0;
    for (let i = 0; i < mainCands.length; i++) {
      target -= weights[i];
      if (target <= 0) { recipeIdx = i; break; }
    }
    const recipe = mainCands[recipeIdx]
      ? {
          name: mainCands[recipeIdx].name,
          cuisine: mainCands[recipeIdx].cuisine,
          reason: mainCands[recipeIdx].reason,
        }
      : null;

    // 3. 外卖：构造 input
    const takeoutInput = {
      city: "未指定",
      budget,
      people,
      tastes,
      slot:
        new Date().getHours() < 10
          ? ("breakfast" as const)
          : new Date().getHours() < 14
            ? ("lunch" as const)
            : new Date().getHours() < 21
              ? ("dinner" as const)
              : ("midnight" as const),
      lowCalorie: tastes.includes("热量低"),
    };
    // v11: 用 nonce 当 seed，让「再来一份」每次都换主推外卖；记录上一家品牌做惩罚分。
    const lastLazyBrandId =
      typeof window !== "undefined"
        ? (window as any).__lazyLastTakeoutId__ ?? null
        : null;
    const takeout = pickTakeout({
      ...takeoutInput,
      seed: nonce * 4099 + 7,
      recentBrandIds: lastLazyBrandId ? [lastLazyBrandId] : [],
    });
    if (typeof window !== "undefined") {
      (window as any).__lazyLastTakeoutId__ = takeout.special.id;
    }

    // 4. 零食：人群从 mood 推断
    const snackAud: SnackAudience[] = [];
    if (mood === "压力大" || mood === "沮丧") snackAud.push("解压");
    if (mood === "疲惫") snackAud.push("通勤");
    if (mood === "想奖励自己") snackAud.push("解压");
    if (people === 1) snackAud.push("学生党");
    if (takeoutInput.slot === "midnight") snackAud.push("深夜");
    const snackResult = pickSnack({
      audiences: snackAud,
      likedIds: snackReactions.likes,
      dislikedIds: snackReactions.dislikes,
    });
    const snack = snackResult.special;

    // 5. 水果
    const fruitAud: FruitAudience[] = [];
    if (mood === "想奖励自己" || mood === "开心") fruitAud.push("解馋");
    if (tastes.includes("热量低")) fruitAud.push("减脂");
    const fruitResult = pickFruit({
      audiences: fruitAud,
      seasonalOnly: true,
      likedIds: fruitReactions.likes,
      dislikedIds: fruitReactions.dislikes,
    });
    const fruit = fruitResult.special;

    // 6. 视频 + 话题
    const ctx: CompanionContext = {
      scenarioId:
        people === 1
          ? "quick-work"
          : people >= 4
            ? "family-dinner"
            : "weekend-cook",
      servings: people,
      slot: takeoutInput.slot === "midnight" ? "dinner" : takeoutInput.slot,
    };
    const watchList = recommendWatch(ctx, 3);
    const topicList = recommendTopics(ctx, 1);
    const watch = watchList[0]
      ? {
          title: watchList[0].title,
          type: watchList[0].type,
          reason: watchList[0].reason,
        }
      : null;
    const topic = topicList[0] ? { text: topicList[0].text } : null;

    // 7. 饮料
    const drink = (() => {
      if (tastes.includes("热量低")) return "无糖乌龙茶 / 元气森林（0 糖 0 卡）";
      if (mood === "想奖励自己") return "霸王茶姬伯牙绝弦 / 一杯热拿铁";
      if (wantHot) return "热可可 / 老姜柠檬蜂蜜";
      if (wantCold) return "冰美式 / 冰镇柠檬水";
      if (sweetMood) return "茶百道杨枝甘露";
      return "瑞幸生椰拿铁";
    })();

    // 8. 一句鼓励语 / 短诗 / 一段温柔小话
    const seed = Date.now() + Math.floor(Math.random() * 1000);
    const quote = moodQuote(mood, seed);
    const poem = poemFor(mood, seed >> 3);
    const tender = tenderParagraph(seed >> 5);

    const summary = `${recipe?.name ?? "家常一道菜"} + 外卖去 ${takeout.special.name} + 零食 ${snack.name} + 水果 ${fruit.name} + 喝点 ${drink}`;

    // 估价 / 估热量：从共享 helper 派生 — 与一键加入「今日已选」后浮窗看到的总计完全一致。
    const fruitCal = (fruit as any).calories ?? 60;
    const lazyItems = buildLazyItems({
      recipe: recipe ? { name: recipe.name, cuisine: recipe.cuisine } : null,
      takeoutBrand: {
        id: takeout.special.id,
        name: takeout.special.name,
        intro: takeout.special.intro,
        budgetMin: takeout.special.budgetMin,
        budgetMax: takeout.special.budgetMax,
      },
      snack: { id: snack.id, name: snack.name, price: snack.price, calories: snack.calories },
      fruit: { id: fruit.id, name: fruit.name, calories: fruitCal },
      drink,
    });
    const totals = totalsOfLazyItems(lazyItems);
    const priceEst = totals.price;
    const caloriesEst = totals.calories;
    const overBudget = priceEst > budget * 1.05;

    return {
      recipe,
      takeoutBrand: {
        id: takeout.special.id,
        name: takeout.special.name,
        emoji: takeout.special.emoji,
        intro: takeout.special.intro,
        budgetMin: takeout.special.budgetMin,
        budgetMax: takeout.special.budgetMax,
      },
      snack: {
        id: snack.id,
        name: snack.name,
        emoji: snack.emoji,
        reason: snack.reason,
        price: snack.price,
        calories: snack.calories,
      },
      fruit: { id: fruit.id, name: fruit.name, emoji: fruit.emoji, reason: fruit.reason, calories: (fruit as any).calories ?? 60 },
      watch,
      topic,
      drink,
      quote,
      summary,
      priceEst,
      caloriesEst,
      overBudget,
      items: lazyItems,
      poem,
      tender,
      takeoutGradient: takeout.special.gradient,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, weather, people, budget, tastes, interest, nonce,
      dishReactions.likes.size, dishReactions.dislikes.size,
      snackReactions.likes.size, snackReactions.dislikes.size,
      fruitReactions.likes.size, fruitReactions.dislikes.size]);

  // v2: 接受 wizard 输出，把答案投影到本面板状态
  function applyWizard(a: WizardAnswers): void {
    setMood(a.mood);
    setWeather(a.weather);
    setBudget(a.budget);
    setPeople(a.people);
    // 口味映射
    if (a.taste === "辣") setTastes(["辣"]);
    else if (a.taste === "清淡") setTastes(["清淡"]);
    else if (a.taste === "酸甜") setTastes(["酸辣"]);
    else if (a.taste === "咸鲜") setTastes(["咸鲜"]);
    else if (a.taste === "甜口") setTastes(["甜"]);
    else setTastes([]);
    // 减脂目标 → 加 热量低
    if (a.goal === "减脂") setTastes((p) => Array.from(new Set([...p, "热量低" as TakeoutTaste])));
    setNonce((n) => n + 1);
  }

  return (
    <section className="mt-2 space-y-4" data-testid="lazy-panel">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.7rem] tracking-tight">
            <Wand2 className="mb-1 mr-1 inline h-5 w-5 text-primary" />
            懒人一键决定
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            告诉我们一点点信息 · 一键替你决定吃什么 / 喝什么 / 看什么 / 聊什么 / 零食水果 — 减少今日选择困难
          </p>
        </div>
        <LazyWizardDialog
          initial={{ mood, weather, budget, people }}
          onSubmit={applyWizard}
        />
      </header>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="space-y-3">
          {/* 心情 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Smile className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 今天心情
            </p>
            <div className="flex flex-wrap gap-1" data-testid="lazy-moods">
              {MOODS.map((m) => {
                const active = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover-elevate active-elevate-2 ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80"
                    }`}
                    data-testid={`lazy-mood-${m.id}`}
                  >
                    <span aria-hidden>{m.emoji}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 天气 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Cloud className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 今日天气体感
            </p>
            <div className="flex flex-wrap gap-1">
              {WEATHERS.map((w) => {
                const active = weather === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWeather(w.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover-elevate active-elevate-2 ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80"
                    }`}
                  >
                    <span aria-hidden>{w.emoji}</span>
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[12px] font-medium text-foreground/80">
                <Users className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 人数
              </p>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPeople(n)}
                    className={`rounded-full border px-2.5 py-1 text-[12.5px] num transition-colors ${
                      people === n ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                    }`}
                  >
                    {n} 人
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[12px] font-medium text-foreground/80">
                <Wallet className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 预算
              </p>
              <div className="flex flex-wrap gap-1">
                {[15, 25, 40, 60, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`rounded-full border px-2.5 py-1 text-[12.5px] num transition-colors ${
                      budget === b ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                    }`}
                  >
                    ¥{b}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 兴趣 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">看什么 · 兴趣方向</p>
            <div className="flex flex-wrap gap-1">
              {(["治愈", "搞笑", "学习", "热血", "无所谓"] as const).map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInterest(i)}
                  className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                    interest === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* 口味 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">口味（多选 / 留空不限）</p>
            <div className="flex flex-wrap gap-1">
              {(["辣", "清淡", "甜", "咸鲜", "酸辣", "热量低"] as TakeoutTaste[]).map((t) => {
                const active = tastes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setTastes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
                    }
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="mt-4 h-12 w-full gap-2 rounded-full"
          onClick={() => setNonce((n) => n + 1)}
          data-testid="lazy-decide"
        >
          <Wand2 className="h-5 w-5" />
          一键替我决定
        </Button>
      </Card>

      {/* 今日特别决定卡 */}
      <Card
        className="grain relative overflow-hidden border-primary/50 bg-primary/5 p-5"
        data-testid="lazy-result-card"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 -z-10 rounded-[2rem] opacity-60 blur-2xl"
          style={{
            background:
              "radial-gradient(50% 60% at 70% 30%, rgba(244,160,69,0.25), transparent 60%)," +
              " radial-gradient(60% 70% at 30% 80%, rgba(193,75,42,0.18), transparent 70%)",
          }}
        />
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/80">今日特别决定</p>
            <h3 className="mt-1 font-display text-[1.5rem] leading-tight tracking-tight" data-testid="lazy-summary">
              {result.summary}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-primary/85" data-testid="lazy-quote">
              <Heart className="h-3 w-3" />
              {result.quote}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            className="h-8 rounded-full text-[12px]"
            data-testid="lazy-refresh"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 再来一组
          </Button>
        </div>

        {/* 短诗 / 古句 — 给整组结果加一点意境 */}
        <figure className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5" data-testid="lazy-poem">
          <blockquote className="font-display text-[14px] italic leading-relaxed text-primary/90">
            「{result.poem.text}」
          </blockquote>
          {result.poem.from && (
            <figcaption className="mt-0.5 text-right text-[11px] text-muted-foreground">— {result.poem.from}</figcaption>
          )}
        </figure>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {result.recipe && (
            <ImageTile
              icon={<ChefHat className="h-4 w-4" />}
              label="今天做什么菜"
              testId="lazy-tile-recipe"
              query={result.recipe.name}
              name={result.recipe.name}
              emoji="🍳"
              gradient={["#e08434", "#7c4015"]}
              link={{
                label: "做法搜索",
                href: stableSearchUrl("百度", `${result.recipe.name} 家常做法`),
              }}
            >
              <span className="font-medium">{result.recipe.name}</span>
              <span className="ml-1 text-[11.5px] text-muted-foreground">· {result.recipe.cuisine}</span>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.recipe.reason}</p>
            </ImageTile>
          )}
          <ImageTile
            icon={<Bike className="h-4 w-4" />}
            label="点外卖去"
            testId="lazy-tile-takeout"
            query={`${result.takeoutBrand.name} food`}
            name={result.takeoutBrand.name}
            emoji={result.takeoutBrand.emoji}
            gradient={result.takeoutGradient}
            link={{
              label: "美团稳定搜索",
              href: stableSearchUrl("美团", result.takeoutBrand.name),
            }}
          >
            <span className="font-medium">{result.takeoutBrand.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.takeoutBrand.intro}</p>
          </ImageTile>
          <ImageTile
            icon={<Cookie className="h-4 w-4" />}
            label="零食吃"
            testId="lazy-tile-snack"
            query={result.snack.name}
            name={result.snack.name}
            emoji={result.snack.emoji}
            gradient={["#fbb273", "#c8552a"]}
            link={{
              label: "美团闪购搜",
              href: snackSearchLinks(result.snack.name)[0].href,
            }}
          >
            <span className="font-medium">{result.snack.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.snack.reason}</p>
          </ImageTile>
          <ImageTile
            icon={<Apple className="h-4 w-4" />}
            label="水果买"
            testId="lazy-tile-fruit"
            query={result.fruit.name}
            name={result.fruit.name}
            emoji={result.fruit.emoji}
            gradient={["#ffce66", "#c87a1f"]}
            link={{
              label: "京东到家",
              href: stableSearchUrl("京东", result.fruit.name),
            }}
          >
            <span className="font-medium">{result.fruit.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.fruit.reason}</p>
          </ImageTile>
          <ImageTile
            icon={<Sparkles className="h-4 w-4" />}
            label="喝什么"
            testId="lazy-tile-drink"
            query={result.drink}
            name={result.drink}
            emoji="🥤"
            gradient={["#3a7c5e", "#143725"]}
            link={{
              label: "百度搜",
              href: stableSearchUrl("百度", result.drink),
            }}
          >
            <span className="font-medium">{result.drink}</span>
          </ImageTile>
          {result.watch && (
            <Tile icon={<Tv className="h-4 w-4" />} label="吃饭看什么" testId="lazy-tile-watch">
              <span className="font-medium">{result.watch.title}</span>
              <Badge variant="outline" className="ml-1 rounded-full px-1.5 py-0 text-[10.5px]">
                {result.watch.type}
              </Badge>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.watch.reason}</p>
              <a
                href={stableSearchUrl("百度", result.watch.title + " 在线观看")}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> 搜一下哪里看
              </a>
            </Tile>
          )}
          {result.topic && (
            <Tile icon={<MessageCircle className="h-4 w-4" />} label="今天聊什么" testId="lazy-tile-topic">
              <p className="text-[12.5px]">{result.topic.text}</p>
            </Tile>
          )}
        </div>

        {/* 一段温柔小话 — 不是任务清单，是给自己的小提醒 */}
        <p className="mt-4 rounded-xl bg-background/60 px-3 py-2 text-[12px] leading-relaxed text-foreground/75" data-testid="lazy-tender">
          {result.tender}
        </p>

        <p className="mt-3 text-[11px] text-muted-foreground">
          所有推荐基于内置数据 deterministic + 轻量随机生成 · 不上传数据 · 选了不喜欢就再点一次
        </p>

        {/* 估价 / 估热量 + 加入今日 + 海报 */}
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-background/50 px-3 py-2 text-[12.5px]">
          <span className="num inline-flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            预算估算 ¥{result.priceEst}
            {result.overBudget && (
              <Badge variant="outline" className="ml-1 rounded-full px-1.5 py-0 text-[10.5px] text-amber-700">
                超一点点
              </Badge>
            )}
          </span>
          <span className="num inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            热量估算 ≈ {result.caloriesEst} kcal
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto h-8 rounded-full text-[12px]"
            data-testid="lazy-add-all"
            onClick={() => {
              for (const item of result.items) addSelected(item);
            }}
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> 全部加入「今日已选」
          </Button>
        </div>
      </Card>

      {/* v2: 海报式结果卡 */}
      <DecisionPoster
        payload={{
          date: new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" }),
          mood,
          weather,
          scenario: people === 1 ? "一个人" : people >= 4 ? "家庭聚餐" : "双人/朋友",
          recipe: result.recipe?.name,
          takeout: result.takeoutBrand.name,
          snack: result.snack.name,
          fruit: result.fruit.name,
          drink: result.drink,
          watch: result.watch?.title,
          topic: result.topic?.text,
          quote: result.quote,
          price: result.priceEst,
          calories: result.caloriesEst,
        }}
      />

      {/* v7: 「今天懒人做什么」二级 section — 设备/时间/冰箱剩什么/目标 → 简餐惊喜 */}
      <LazyMealsPanel />

      {/* v2: 一周计划 / 预算计划 */}
      <WeeklyPlanPanel />
    </section>
  );
}

function Tile({
  icon,
  label,
  testId,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-border/60 bg-background/70 p-3"
      data-testid={testId}
    >
      <p className="mb-1 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </p>
      <div className="text-[13px] text-foreground/85">{children}</div>
    </div>
  );
}

function ImageTile({
  icon,
  label,
  testId,
  query,
  name,
  emoji,
  gradient,
  link,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  testId?: string;
  query: string;
  name: string;
  emoji?: string;
  gradient?: [string, string];
  link?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2 rounded-xl border border-border/60 bg-background/70 p-3" data-testid={testId}>
      <FoodImage
        query={query}
        name={name}
        emoji={emoji}
        gradient={gradient}
        className="h-16 w-16 flex-shrink-0 sm:h-[68px] sm:w-[68px]"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </p>
        <div className="text-[13px] text-foreground/85">{children}</div>
        {link && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> {link.label}
          </a>
        )}
      </div>
    </div>
  );
}
