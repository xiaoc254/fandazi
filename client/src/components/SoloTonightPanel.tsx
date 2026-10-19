// 「单人一键安排今晚」轻量结果面板（#/solo）
// 目标：1-2 次点击得到一个丰富但简洁的今晚方案，包括主餐 + 外卖备选 +
//      零食×2 + 水果×1 + 看 + 听 + 一句安慰 + 估算预算/热量 + 全部加入今日。
// 数据全部复用 RECIPES / pickTakeout / pickSnack / pickFruit / recommendWatch /
// recommendAudio / lazyEstimates，不新建数据源。

import { useMemo, useState } from "react";
import {
  Sparkles,
  Wand2,
  Smile,
  Wallet,
  ChefHat,
  Bike,
  Cookie,
  Apple,
  Tv,
  Music3,
  RefreshCw,
  Plus,
  CheckCircle2,
  Coffee,
  Heart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { RECIPES } from "@/data/recipes";
import { pickTakeout, type TakeoutTaste } from "@/data/takeoutBrands";
import { pickSnack, snackSearchLinks, type SnackAudience } from "@/data/snacks";
import { pickFruit, type FruitAudience } from "@/data/fruits";
import {
  recommendWatch,
  recommendAudio,
  type CompanionContext,
} from "@/lib/companionRecommend";
import { buildLazyItems, totalsOfLazyItems } from "@/lib/lazyEstimates";
import { addSelected } from "@/lib/selectedToday";
import { setTonightPlan, type TonightPlan } from "@/lib/tonightPlan";
import { FoodImage, stableSearchUrl } from "@/components/FoodImage";
import { useReactions } from "@/hooks/useReactions";
import { moodQuote } from "@/lib/lazyCopy";

type SoloMood = "随便" | "累了" | "想开心" | "想省钱";
type SoloMode = "做饭" | "外卖" | "都行";
type SoloBudget = "省钱" | "正常" | "犒劳";

const MOODS: { id: SoloMood; emoji: string }[] = [
  { id: "随便", emoji: "🙂" },
  { id: "累了", emoji: "🥱" },
  { id: "想开心", emoji: "😄" },
  { id: "想省钱", emoji: "💰" },
];

const MODES: { id: SoloMode; emoji: string }[] = [
  { id: "都行", emoji: "✨" },
  { id: "做饭", emoji: "🍳" },
  { id: "外卖", emoji: "🛵" },
];

const BUDGETS: { id: SoloBudget; emoji: string; cap: number }[] = [
  { id: "省钱", emoji: "💸", cap: 25 },
  { id: "正常", emoji: "🍱", cap: 45 },
  { id: "犒劳", emoji: "🎁", cap: 80 },
];

// 把 SoloMood 映射到 lazyCopy.LazyMood，用来取一句安慰语。
function mapToLazyMood(m: SoloMood): "开心" | "压力大" | "疲惫" | "想奖励自己" | "平淡" {
  if (m === "累了") return "疲惫";
  if (m === "想开心") return "开心";
  if (m === "想省钱") return "压力大";
  return "平淡";
}

interface SoloResult {
  recipe: { id: string; name: string; cuisine: string; reason: string; timeMinutes: number } | null;
  takeoutBrand: {
    id: string;
    name: string;
    emoji: string;
    intro: string;
    budgetMin: number;
    budgetMax: number;
    gradient?: [string, string];
  };
  snackA: { id: string; name: string; emoji: string; reason: string; price: string; calories: number };
  snackB: { id: string; name: string; emoji: string; reason: string; price: string; calories: number };
  fruit: { id: string; name: string; emoji: string; reason: string; calories: number };
  drink: string;
  watch: { title: string; type: string; reason: string } | null;
  audio: { title: string; type: string; why: string } | null;
  quote: string;
  priceEst: number;
  caloriesEst: number;
  items: ReturnType<typeof buildLazyItems>;
}

export function SoloTonightPanel() {
  const { toast } = useToast();
  const [mood, setMood] = useState<SoloMood>("随便");
  const [mode, setMode] = useState<SoloMode>("都行");
  const [budget, setBudget] = useState<SoloBudget>("正常");
  const [seed, setSeed] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const dishR = useReactions("dish");
  const snackR = useReactions("snack");
  const fruitR = useReactions("fruit");

  const result = useMemo<SoloResult>(() => {
    // 用 seed 让「再来一份」每次拿到不同结果
    const rng = (n: number) => {
      const x = Math.sin(seed * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };

    const budgetMeta = BUDGETS.find((b) => b.id === budget)!;
    const moodLazy = mapToLazyMood(mood);

    // 1) 菜：mode != 外卖 才推荐做饭
    let recipe: SoloResult["recipe"] = null;
    if (mode !== "外卖") {
      const mainPool = RECIPES.filter((r) => r.course === "main");
      const filtered = mainPool.filter((r) => !dishR.dislikes.has(r.id));
      const pool = filtered.length >= 8 ? filtered : mainPool;
      // 累了 → 偏向 ≤ 25 分钟快手菜
      const tireBias = mood === "累了"
        ? pool.filter((r) => r.timeMinutes <= 25)
        : pool;
      const finalPool = tireBias.length >= 5 ? tireBias : pool;
      const idx = Math.floor(rng(11) * finalPool.length) % finalPool.length;
      const r = finalPool[idx];
      if (r) recipe = { id: r.id, name: r.name, cuisine: r.cuisine, reason: r.reason, timeMinutes: r.timeMinutes };
    }

    // 2) 外卖：单人，预算 cap 决定预算
    const tastes: TakeoutTaste[] = [];
    if (mood === "想开心") tastes.push("甜");
    if (budget === "省钱") tastes.push("热量低");
    const slot = (() => {
      const h = new Date().getHours();
      if (h < 10) return "breakfast" as const;
      if (h < 14) return "lunch" as const;
      if (h < 21) return "dinner" as const;
      return "midnight" as const;
    })();
    // v11: 直接把 seed 交给 pickTakeout，让它做顶部 N 选轮换 + 抖动；
    // 同时把上一轮的 special 当成「最近刷过」惩罚一下，避免连续两次同一家。
    const lastBrandId =
      typeof window !== "undefined"
        ? (window as any).__soloLastTakeoutId__ ?? null
        : null;
    const takeout = pickTakeout({
      budget: budgetMeta.cap + Math.floor(rng(3) * 6) - 3,
      people: 1,
      tastes,
      slot,
      lowCalorie: budget === "省钱",
      seed: seed * 9301 + 17,
      recentBrandIds: lastBrandId ? [lastBrandId] : [],
    });
    if (typeof window !== "undefined") {
      (window as any).__soloLastTakeoutId__ = takeout.special.id;
    }

    // 3) 零食 ×2（不同 category）
    const snackAud: SnackAudience[] = ["学生党"];
    if (mood === "累了") snackAud.push("解压");
    if (mood === "想开心") snackAud.push("解压");
    if (budget === "省钱") snackAud.push("学生党");
    const sA = pickSnack({ audiences: snackAud, likedIds: snackR.likes, dislikedIds: snackR.dislikes });
    // 第二个零食：换一个 category，避免重复
    const dislikedForB = new Set<string>();
    snackR.dislikes.forEach((id) => dislikedForB.add(id));
    dislikedForB.add(sA.special.id);
    const sBPool = pickSnack({
      audiences: snackAud,
      likedIds: snackR.likes,
      dislikedIds: dislikedForB,
    });
    const snackA = sA.special;
    const snackB = sBPool.special.id !== snackA.id ? sBPool.special : sA.alternatives[0] ?? sA.special;

    // 4) 水果
    const fruitAud: FruitAudience[] = [];
    if (mood === "想开心") fruitAud.push("解馋");
    if (budget === "省钱") fruitAud.push("减脂");
    const fr = pickFruit({
      audiences: fruitAud,
      seasonalOnly: true,
      likedIds: fruitR.likes,
      dislikedIds: fruitR.dislikes,
    });
    const fruit = fr.special;

    // 5) 看 / 听
    const ctx: CompanionContext = {
      scenarioId: "quick-work",
      servings: 1,
      slot: slot === "midnight" ? "dinner" : slot,
      sceneOverride: "single",
      moodOverride:
        mood === "累了" ? "relax" : mood === "想开心" ? "laugh" : mood === "想省钱" ? "learn" : "relax",
      maxTimeMinutes: 45,
    };
    const watchList = recommendWatch(ctx, 5);
    const watchPick = watchList[Math.floor(rng(7) * watchList.length) % Math.max(1, watchList.length)];
    const audioList = recommendAudio(ctx, 5);
    const audioPick = audioList[Math.floor(rng(13) * audioList.length) % Math.max(1, audioList.length)];

    // 6) 饮料
    const drink = (() => {
      if (budget === "省钱") return "便利店无糖乌龙茶 / 蜜雪冰城柠檬水";
      if (mood === "累了") return "瑞幸生椰拿铁 / 一杯热可可";
      if (mood === "想开心") return "霸王茶姬伯牙绝弦";
      if (mood === "想省钱") return "蜜雪冰城摇摇奶昔";
      return "茶百道杨枝甘露";
    })();

    // 7) 一句话
    const quote = moodQuote(moodLazy, seed * 17 + 3);

    // 8) 估价 / 估热量
    const lazyItems = buildLazyItems({
      recipe: recipe ? { name: recipe.name, cuisine: recipe.cuisine } : null,
      takeoutBrand: {
        id: takeout.special.id,
        name: takeout.special.name,
        intro: takeout.special.intro,
        budgetMin: takeout.special.budgetMin,
        budgetMax: takeout.special.budgetMax,
      },
      snack: { id: snackA.id, name: snackA.name, price: snackA.price, calories: snackA.calories },
      fruit: { id: fruit.id, name: fruit.name, calories: (fruit as any).calories ?? 60 },
      drink,
    });
    // 加上 snackB
    const snackBPrice = (() => {
      const m = (snackB.price ?? "").match(/\d+(\.\d+)?/);
      return m ? Number(m[0]) : 5;
    })();
    lazyItems.push({
      id: snackB.id,
      kind: "snack",
      name: snackB.name,
      price: snackBPrice,
      calories: snackB.calories,
    });
    const totals = totalsOfLazyItems(lazyItems);

    return {
      recipe,
      takeoutBrand: {
        id: takeout.special.id,
        name: takeout.special.name,
        emoji: takeout.special.emoji,
        intro: takeout.special.intro,
        budgetMin: takeout.special.budgetMin,
        budgetMax: takeout.special.budgetMax,
        gradient: takeout.special.gradient,
      },
      snackA: {
        id: snackA.id,
        name: snackA.name,
        emoji: snackA.emoji,
        reason: snackA.reason,
        price: snackA.price,
        calories: snackA.calories,
      },
      snackB: {
        id: snackB.id,
        name: snackB.name,
        emoji: snackB.emoji,
        reason: snackB.reason,
        price: snackB.price,
        calories: snackB.calories,
      },
      fruit: {
        id: fruit.id,
        name: fruit.name,
        emoji: fruit.emoji,
        reason: fruit.reason,
        calories: (fruit as any).calories ?? 60,
      },
      drink,
      watch: watchPick
        ? { title: watchPick.title, type: watchPick.type, reason: watchPick.why }
        : null,
      audio: audioPick
        ? { title: audioPick.title, type: audioPick.type, why: audioPick.why }
        : null,
      quote,
      priceEst: totals.price,
      caloriesEst: totals.calories,
      items: lazyItems,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mood,
    mode,
    budget,
    seed,
    dishR.likes.size,
    dishR.dislikes.size,
    snackR.likes.size,
    snackR.dislikes.size,
    fruitR.likes.size,
    fruitR.dislikes.size,
  ]);

  function refreshOne() {
    setConfirmed(false);
    setSeed((s) => s + 1);
  }

  function buildPlan(): TonightPlan {
    const lines: TonightPlan["lines"] = [];
    if (result.recipe) {
      lines.push({
        label: "今晚做什么菜",
        text: result.recipe.name,
        detail: `${result.recipe.cuisine} · 约 ${result.recipe.timeMinutes} 分钟 · ${result.recipe.reason}`,
        link: {
          label: "做法搜索",
          href: stableSearchUrl("百度", `${result.recipe.name} 家常做法`),
        },
      });
    }
    lines.push({
      label: result.recipe ? "外卖备选" : "今晚点外卖",
      text: result.takeoutBrand.name,
      detail: `${result.takeoutBrand.intro} · 单人约 ¥${result.takeoutBrand.budgetMin}-${result.takeoutBrand.budgetMax}`,
      link: { label: "美团搜", href: stableSearchUrl("美团", result.takeoutBrand.name) },
    });
    lines.push({
      label: "零食 1",
      text: result.snackA.name,
      detail: result.snackA.reason,
    });
    lines.push({
      label: "零食 2",
      text: result.snackB.name,
      detail: result.snackB.reason,
    });
    lines.push({
      label: "水果",
      text: result.fruit.name,
      detail: result.fruit.reason,
    });
    lines.push({
      label: "喝点啥",
      text: result.drink,
    });
    if (result.watch) {
      lines.push({
        label: "一边吃一边看",
        text: result.watch.title,
        detail: `${result.watch.type} · ${result.watch.reason}`,
        link: {
          label: "搜哪里看",
          href: stableSearchUrl("百度", `${result.watch.title} 在线观看`),
        },
      });
    }
    if (result.audio) {
      lines.push({
        label: "或者听点啥",
        text: result.audio.title,
        detail: `${result.audio.type} · ${result.audio.why}`,
        link: {
          label: "喜马拉雅搜",
          href: `https://www.ximalaya.com/search/${encodeURIComponent(result.audio.title)}`,
        },
      });
    }
    const title = result.recipe
      ? `今晚做${result.recipe.name} · 配${result.snackA.name} + ${result.fruit.name}`
      : `今晚点${result.takeoutBrand.name} · 配${result.snackA.name} + ${result.fruit.name}`;
    return {
      kind: "solo",
      title,
      audience: `单人 · ${mood} · ${mode} · ${budget}档`,
      createdAt: new Date().toISOString(),
      tags: [mood, mode, budget],
      lines,
      quote: result.quote,
      budget: result.priceEst,
      calories: result.caloriesEst,
    };
  }

  function confirmThis() {
    for (const item of result.items) addSelected(item);
    setTonightPlan(buildPlan());
    setConfirmed(true);
    toast({
      title: "今晚就这样了 ✓",
      description: "已沉淀为「今晚最终方案」 · 右下角浮窗也能看到总价 / 热量。",
    });
  }

  function goPlan() {
    if (typeof window !== "undefined") window.location.hash = "#/tonight-plan";
  }

  return (
    <section className="mt-2 space-y-4" data-testid="solo-panel">
      {/* 顶部 hero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 px-5 py-6 sm:px-7"
        data-testid="solo-hero"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-rose-200/60 to-amber-200/40 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-rose-700/85">
            <Sparkles className="h-3 w-3" />
            一个人也要好好过
          </p>
          <h2 className="mt-2 font-display text-[1.7rem] leading-tight tracking-tight text-foreground sm:text-[2rem]">
            一键替你决定今晚怎么过
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-foreground/75 sm:text-[14.5px]">
            选一下心情就行 — 我们替你搭好今晚的菜 / 外卖 / 零食 / 水果 /
            看什么 / 听什么，估好预算和热量。不想再纠结了。
          </p>
        </div>
      </div>

      {/* 三组轻量选择 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="solo-quick-prefs">
        <div className="space-y-3">
          <PrefRow
            label="今天心情"
            icon={<Smile className="h-3.5 w-3.5 text-primary" />}
            testId="solo-mood"
          >
            {MOODS.map((m) => (
              <ChipBtn
                key={m.id}
                active={mood === m.id}
                onClick={() => setMood(m.id)}
                testId={`solo-mood-${m.id}`}
              >
                <span aria-hidden>{m.emoji}</span>
                {m.id}
              </ChipBtn>
            ))}
          </PrefRow>
          <PrefRow
            label="今晚怎么吃"
            icon={<ChefHat className="h-3.5 w-3.5 text-primary" />}
            testId="solo-mode"
          >
            {MODES.map((m) => (
              <ChipBtn
                key={m.id}
                active={mode === m.id}
                onClick={() => setMode(m.id)}
                testId={`solo-mode-${m.id}`}
              >
                <span aria-hidden>{m.emoji}</span>
                {m.id}
              </ChipBtn>
            ))}
          </PrefRow>
          <PrefRow
            label="预算档"
            icon={<Wallet className="h-3.5 w-3.5 text-primary" />}
            testId="solo-budget"
          >
            {BUDGETS.map((b) => (
              <ChipBtn
                key={b.id}
                active={budget === b.id}
                onClick={() => setBudget(b.id)}
                testId={`solo-budget-${b.id}`}
              >
                <span aria-hidden>{b.emoji}</span>
                {b.id}
                <span className="ml-0.5 text-[10.5px] text-muted-foreground num">
                  ≤¥{b.cap}
                </span>
              </ChipBtn>
            ))}
          </PrefRow>
        </div>
        <Button
          type="button"
          size="lg"
          className="mt-4 h-12 w-full gap-2 rounded-full"
          onClick={refreshOne}
          data-testid="solo-decide"
        >
          <Wand2 className="h-5 w-5" />
          一键安排今晚
        </Button>
      </Card>

      {/* 结果区 */}
      <Card
        className="grain relative overflow-hidden border-primary/40 bg-primary/5 p-5 sm:p-6"
        data-testid="solo-result-card"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/80">
              今晚就这样
            </p>
            <h3
              className="mt-1 font-display text-[1.35rem] leading-snug tracking-tight"
              data-testid="solo-summary"
            >
              {result.recipe ? `做${result.recipe.name}` : `点${result.takeoutBrand.name}`}
              {" · "}
              {result.snackA.name}
              {" + "}
              {result.fruit.name}
              {" · "}
              {result.drink.split(" /")[0]}
            </h3>
            <p
              className="mt-1 inline-flex items-center gap-1 text-[12.5px] text-primary/85"
              data-testid="solo-quote"
            >
              <Heart className="h-3 w-3" />
              {result.quote}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshOne}
            className="h-8 rounded-full text-[12px]"
            data-testid="solo-refresh"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 再来一份
          </Button>
        </div>

        {/* 卡片网格 */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {result.recipe && (
            <ResultTile
              icon={<ChefHat className="h-4 w-4" />}
              label="今晚做什么菜"
              testId="solo-tile-recipe"
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
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                约 {result.recipe.timeMinutes} 分钟 · {result.recipe.reason}
              </p>
            </ResultTile>
          )}
          <ResultTile
            icon={<Bike className="h-4 w-4" />}
            label={result.recipe ? "懒得做？外卖备选" : "点外卖去"}
            testId="solo-tile-takeout"
            query={`${result.takeoutBrand.name} food`}
            name={result.takeoutBrand.name}
            emoji={result.takeoutBrand.emoji}
            gradient={result.takeoutBrand.gradient}
            link={{
              label: "美团搜",
              href: stableSearchUrl("美团", result.takeoutBrand.name),
            }}
          >
            <span className="font-medium">{result.takeoutBrand.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {result.takeoutBrand.intro}
            </p>
            <p className="mt-0.5 text-[11px] text-primary/85 num">
              单人约 ¥{result.takeoutBrand.budgetMin}-{result.takeoutBrand.budgetMax}
            </p>
          </ResultTile>
          <ResultTile
            icon={<Cookie className="h-4 w-4" />}
            label="零食 1"
            testId="solo-tile-snack-a"
            query={result.snackA.name}
            name={result.snackA.name}
            emoji={result.snackA.emoji}
            gradient={["#fbb273", "#c8552a"]}
            link={{
              label: "美团闪购",
              href: snackSearchLinks(result.snackA.name)[0].href,
            }}
          >
            <span className="font-medium">{result.snackA.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.snackA.reason}</p>
          </ResultTile>
          <ResultTile
            icon={<Cookie className="h-4 w-4" />}
            label="零食 2"
            testId="solo-tile-snack-b"
            query={result.snackB.name}
            name={result.snackB.name}
            emoji={result.snackB.emoji}
            gradient={["#f9c184", "#a8501f"]}
            link={{
              label: "美团闪购",
              href: snackSearchLinks(result.snackB.name)[0].href,
            }}
          >
            <span className="font-medium">{result.snackB.name}</span>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">{result.snackB.reason}</p>
          </ResultTile>
          <ResultTile
            icon={<Apple className="h-4 w-4" />}
            label="水果"
            testId="solo-tile-fruit"
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
          </ResultTile>
          <ResultTile
            icon={<Coffee className="h-4 w-4" />}
            label="喝点啥"
            testId="solo-tile-drink"
            query={result.drink}
            name={result.drink}
            emoji="🥤"
            gradient={["#3a7c5e", "#143725"]}
          >
            <span className="font-medium">{result.drink}</span>
          </ResultTile>
          {result.watch && (
            <ResultTile
              icon={<Tv className="h-4 w-4" />}
              label="一边吃一边看"
              testId="solo-tile-watch"
              query={result.watch.title}
              name={result.watch.title}
              emoji="📺"
              gradient={["#5566aa", "#1d2950"]}
              link={{
                label: "搜哪里看",
                href: stableSearchUrl("百度", `${result.watch.title} 在线观看`),
              }}
            >
              <span className="font-medium">{result.watch.title}</span>
              <Badge
                variant="outline"
                className="ml-1 rounded-full px-1.5 py-0 text-[10.5px]"
              >
                {result.watch.type}
              </Badge>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {result.watch.reason}
              </p>
            </ResultTile>
          )}
          {result.audio && (
            <ResultTile
              icon={<Music3 className="h-4 w-4" />}
              label="或者听点啥"
              testId="solo-tile-audio"
              query={result.audio.title}
              name={result.audio.title}
              emoji="🎧"
              gradient={["#7c5b9b", "#2c1f44"]}
              link={{
                label: "喜马拉雅搜",
                href: `https://www.ximalaya.com/search/${encodeURIComponent(result.audio.title)}`,
              }}
            >
              <span className="font-medium">{result.audio.title}</span>
              <Badge
                variant="outline"
                className="ml-1 rounded-full px-1.5 py-0 text-[10.5px]"
              >
                {result.audio.type}
              </Badge>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {result.audio.why}
              </p>
            </ResultTile>
          )}
        </div>

        {/* 估价 / 估热量 + 底部 CTA */}
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-2.5 text-[12.5px]">
          <span className="num inline-flex items-center gap-1">
            <Wallet className="h-3.5 w-3.5 text-primary" />
            预算估算 ¥{result.priceEst}
          </span>
          <span className="num inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            热量估算 ≈ {result.caloriesEst} kcal
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="default"
            className="h-12 flex-1 gap-2 rounded-full"
            onClick={confirmThis}
            data-testid="solo-confirm"
          >
            {confirmed ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                已加入今晚清单
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                就按这个 · 加入今晚清单
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 gap-2 rounded-full"
            onClick={refreshOne}
            data-testid="solo-refresh-bottom"
          >
            <RefreshCw className="h-4 w-4" />
            再来一份
          </Button>
        </div>

        {confirmed && (
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            data-testid="solo-confirm-feedback"
          >
            <p className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[12px] text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              已沉淀为今晚最终方案
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-[12px]"
              onClick={goPlan}
              data-testid="solo-view-plan"
            >
              <Sparkles className="h-3.5 w-3.5" />
              查看最终方案
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}

function PrefRow({
  label,
  icon,
  testId,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={testId}>
      <p className="mb-1.5 text-[12px] font-medium text-foreground/80">
        <span className="mr-1 inline-flex">{icon}</span>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ChipBtn({
  active,
  onClick,
  testId,
  children,
}: {
  active: boolean;
  onClick: () => void;
  testId?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] transition-colors hover-elevate active-elevate-2 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card/60 text-foreground/85"
      }`}
    >
      {children}
    </button>
  );
}

function ResultTile({
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
    <div
      className="flex gap-2.5 rounded-xl border border-border/60 bg-background/70 p-3"
      data-testid={testId}
    >
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
            className="mt-1 inline-block text-[11px] text-primary hover:underline"
          >
            → {link.label}
          </a>
        )}
      </div>
    </div>
  );
}
