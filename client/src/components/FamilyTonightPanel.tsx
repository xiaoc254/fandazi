// 「一家人今晚吃什么」一键家庭饭轻量结果面板（#/family-tonight）
// 目标：1-2 次点击得到一桌可执行的家庭晚餐方案。
// 复用：rankByFamily / evaluateFamilyMatch / summarizeConflicts /
//      rankByFridge / fridgeMatchScore / findRemixes / RECIPES /
//      addSelected / FoodImage / stableSearchUrl。
//
// 不重写推荐算法，不重做家庭管理。

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  Wand2,
  Wallet,
  ChefHat,
  Soup,
  Salad,
  Wheat,
  RefreshCw,
  Plus,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Refrigerator,
  Repeat,
  CalendarDays,
  Heart,
  Snowflake,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { RECIPES, type Recipe } from "@/data/recipes";
import {
  listMembers,
  rankByFamily,
  evaluateFamilyMatch,
  summarizeConflicts,
  subscribeFamily,
  type FamilyMember,
  type FamilyMatchResult,
} from "@/lib/familyMembers";
import {
  listFridge,
  fridgeMatchScore,
  subscribeFridge,
  type FridgeItem,
} from "@/lib/fridge";
import {
  findRemixes,
  listLeftoverHistory,
  type RemixWithFridgeInfo,
} from "@/lib/leftoverRemix";
import { addSelected } from "@/lib/selectedToday";
import { setTonightPlan, type TonightPlan } from "@/lib/tonightPlan";
import { addShoppingItems } from "@/lib/shoppingList";
import { FoodImage, stableSearchUrl } from "@/components/FoodImage";
import { loadReactions, subscribeReactions } from "@/lib/reactions";

type People = "1-2" | "3-4" | "5+";
type Budget = "省钱" | "正常" | "丰盛";
type Lean = "清淡" | "孩子老人友好" | "想省事" | "高蛋白";

const PEOPLE_OPTIONS: { id: People; emoji: string; n: number }[] = [
  { id: "1-2", emoji: "👫", n: 2 },
  { id: "3-4", emoji: "👨‍👩‍👧", n: 4 },
  { id: "5+", emoji: "👨‍👩‍👧‍👦", n: 6 },
];

const BUDGET_OPTIONS: { id: Budget; emoji: string; perPerson: number }[] = [
  { id: "省钱", emoji: "💸", perPerson: 12 },
  { id: "正常", emoji: "🍱", perPerson: 22 },
  { id: "丰盛", emoji: "🎉", perPerson: 38 },
];

const LEAN_OPTIONS: { id: Lean; emoji: string }[] = [
  { id: "清淡", emoji: "🥗" },
  { id: "孩子老人友好", emoji: "🧒" },
  { id: "想省事", emoji: "⏱️" },
  { id: "高蛋白", emoji: "💪" },
];

interface FamilyResult {
  main: Recipe;
  veggie: Recipe;
  soupOrStaple: Recipe;
  matches: Record<string, FamilyMatchResult>;
  fridgeMatched: string[];
  fridgeMissing: string[];
  remix: RemixWithFridgeInfo | null;
  remixSource: string | null;
  budgetEst: number;
  tomorrow: { title: string; hint: string };
}

export function FamilyTonightPanel() {
  const { toast } = useToast();
  const [people, setPeople] = useState<People>("3-4");
  const [budget, setBudget] = useState<Budget>("正常");
  const [lean, setLean] = useState<Lean | null>(null);
  const [seed, setSeed] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const [members, setMembers] = useState<FamilyMember[]>(() => listMembers());
  const [fridge, setFridge] = useState<FridgeItem[]>(() => listFridge());
  const [reactionsTick, setReactionsTick] = useState(0);

  useEffect(() => {
    const u1 = subscribeFamily(() => setMembers(listMembers()));
    const u2 = subscribeFridge(() => setFridge(listFridge()));
    const u3 = subscribeReactions(() => setReactionsTick((t) => t + 1));
    return () => {
      u1();
      u2();
      u3();
    };
  }, []);

  const activeMembers = useMemo(
    () => members.filter((m) => m.active),
    [members],
  );

  const result = useMemo<FamilyResult | null>(() => {
    const peopleN =
      PEOPLE_OPTIONS.find((p) => p.id === people)?.n ?? 4;
    const budgetMeta = BUDGET_OPTIONS.find((b) => b.id === budget)!;

    // 用 seed 让「再来一组」每次结果不同
    const rng = (n: number) => {
      const x = Math.sin(seed * 9301 + n * 49297 + 7) * 233280;
      return x - Math.floor(x);
    };

    const reactions = loadReactions();
    const liked = new Set<string>();
    const disliked = new Set<string>();
    reactions.likes.forEach((k) => {
      if (k.startsWith("dish:")) liked.add(k.slice(5));
    });
    reactions.dislikes.forEach((k) => {
      if (k.startsWith("dish:")) disliked.add(k.slice(5));
    });

    // 倾向：lean 决定 taste / time 偏置
    const passLean = (r: Recipe): boolean => {
      if (!lean) return true;
      if (lean === "清淡") {
        return r.tastes.some((t) => t === "清淡" || t === "咸鲜")
          && !r.tastes.some((t) => t === "重辣" || t === "麻辣");
      }
      if (lean === "孩子老人友好") {
        return !r.tastes.some((t) => t === "重辣" || t === "麻辣");
      }
      if (lean === "想省事") {
        return r.timeMinutes <= 35 && r.difficulty !== "进阶";
      }
      if (lean === "高蛋白") {
        const text = r.name + r.ingredients.map((i) => i.name).join("");
        return /(肉|鸡|牛|猪|鱼|虾|蛋|豆腐|豆制)/.test(text);
      }
      return true;
    };

    function pickFromCourse(course: Recipe["course"]): Recipe | null {
      const pool = RECIPES.filter((r) => r.course === course);
      if (pool.length === 0) return null;

      // 用家庭兼容评分排序，然后 lean 偏置 + likes/dislikes
      const ranked = rankByFamily(pool, activeMembers, { limit: 60 });
      // 排除 red（硬冲突）
      const safe = ranked.filter((x) => x.match.level !== "red");
      // lean 通过的优先；若过滤掉太多就回退
      const leaned = safe.filter((x) => passLean(x.recipe));
      const byTaste = leaned.length >= 4 ? leaned : safe;

      // likes 加分，dislikes 大幅降权
      const scored = byTaste.map((x) => {
        let s = x.match.score;
        if (liked.has(x.recipe.id)) s += 8;
        if (disliked.has(x.recipe.id)) s -= 30;
        return { ...x, sortScore: s };
      });
      scored.sort((a, b) => b.sortScore - a.sortScore);

      // 在 top 8 中按 seed 抽一个
      const topN = Math.max(3, Math.min(8, scored.length));
      const top = scored.slice(0, topN);
      if (top.length === 0) return null;
      const idx = Math.floor(rng(course.length + 3) * top.length) % top.length;
      return top[idx]?.recipe ?? null;
    }

    const main = pickFromCourse("main");
    if (!main) return null;
    let veggie = pickFromCourse("veggie") ?? null;
    if (!veggie || veggie.id === main.id) {
      const fallback = RECIPES.find((r) => r.course === "veggie" && r.id !== main.id);
      if (fallback) veggie = fallback;
    }
    if (!veggie) return null;

    // 第三道：预算「丰盛」给汤；「省钱」给主食；「正常」按 seed 50/50
    const wantSoup =
      budget === "丰盛" || (budget === "正常" && rng(99) > 0.5);
    let third = pickFromCourse(wantSoup ? "soup" : "staple")
      ?? pickFromCourse(wantSoup ? "staple" : "soup");
    if (!third || third.id === main.id || third.id === veggie.id) {
      const fb = RECIPES.find(
        (r) =>
          (r.course === "soup" || r.course === "staple")
          && r.id !== main.id
          && r.id !== veggie!.id,
      );
      if (fb) third = fb;
    }
    if (!third) return null;

    const matches: Record<string, FamilyMatchResult> = {
      [main.id]: evaluateFamilyMatch(main, activeMembers),
      [veggie.id]: evaluateFamilyMatch(veggie, activeMembers),
      [third.id]: evaluateFamilyMatch(third, activeMembers),
    };

    // 冰箱命中（取三道菜的并集）
    const matchedSet = new Set<string>();
    const missingSet = new Set<string>();
    for (const r of [main, veggie, third]) {
      const fm = fridgeMatchScore(r, fridge);
      fm.matched.forEach((x) => matchedSet.add(x));
      fm.missing.forEach((x) => missingSet.add(x));
    }

    // 剩菜变形：取最近一条剩菜历史；没有就空
    const lvHistory = listLeftoverHistory();
    let remix: RemixWithFridgeInfo | null = null;
    let remixSource: string | null = null;
    if (lvHistory.length > 0) {
      const latest = lvHistory[0];
      const remixes = findRemixes(latest.name, {
        quantity: latest.quantity,
        fridge,
      });
      if (remixes.length > 0) {
        remix = remixes[Math.floor(rng(31) * remixes.length) % remixes.length];
        remixSource = latest.name;
      }
    }

    // 预算：人数 × 单人单餐 + 三道菜难度系数
    const dishExtra = [main, veggie, third].reduce((s, r) => {
      return s + (r.difficulty === "进阶" ? 6 : r.difficulty === "中等" ? 3 : 1);
    }, 0);
    const budgetEst = peopleN * budgetMeta.perPerson + dishExtra;

    // 明天衔接建议：基于今晚主菜
    const tomorrow = pickTomorrowHint(main, third);

    return {
      main,
      veggie,
      soupOrStaple: third,
      matches,
      fridgeMatched: Array.from(matchedSet).slice(0, 12),
      fridgeMissing: Array.from(missingSet).slice(0, 12),
      remix,
      remixSource,
      budgetEst,
      tomorrow,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [people, budget, lean, seed, activeMembers, fridge, reactionsTick]);

  function refreshOne() {
    setConfirmed(false);
    setSeed((s) => s + 1);
  }

  function buildFamilyPlan(): TonightPlan | null {
    if (!result) return null;
    const peopleN = PEOPLE_OPTIONS.find((p) => p.id === people)?.n ?? 4;
    const lines: TonightPlan["lines"] = [];
    lines.push({
      label: "主菜",
      text: result.main.name,
      detail: `${result.main.cuisine} · 约 ${result.main.timeMinutes} 分钟 · ${result.main.difficulty}`,
      link: {
        label: "做法搜索",
        href: stableSearchUrl("百度", `${result.main.name} 家常做法`),
      },
    });
    lines.push({
      label: "配菜",
      text: result.veggie.name,
      detail: `${result.veggie.cuisine} · 约 ${result.veggie.timeMinutes} 分钟 · ${result.veggie.difficulty}`,
      link: {
        label: "做法搜索",
        href: stableSearchUrl("百度", `${result.veggie.name} 家常做法`),
      },
    });
    lines.push({
      label: result.soupOrStaple.course === "soup" ? "汤" : "主食",
      text: result.soupOrStaple.name,
      detail: `${result.soupOrStaple.cuisine} · 约 ${result.soupOrStaple.timeMinutes} 分钟 · ${result.soupOrStaple.difficulty}`,
      link: {
        label: "做法搜索",
        href: stableSearchUrl(
          "百度",
          `${result.soupOrStaple.name} 家常做法`,
        ),
      },
    });

    const compatLevel: TonightPlan["familyCompat"] = (() => {
      const levels = Object.values(result.matches).map((m) => m.level);
      if (levels.includes("red")) return "red";
      if (levels.includes("amber")) return "amber";
      return "green";
    })();

    const compatLines: string[] = [];
    if (activeMembers.length > 0) {
      for (const r of [result.main, result.veggie, result.soupOrStaple]) {
        const m = result.matches[r.id];
        if (!m) continue;
        const summary = summarizeConflicts(m);
        if (summary === "全家都能吃") continue;
        compatLines.push(`${r.name} · ${summary}`);
      }
    }

    return {
      kind: "family",
      title: `今晚一桌：${result.main.name} · ${result.veggie.name} · ${result.soupOrStaple.name}`,
      audience: `家庭 · ${peopleN} 人 · ${budget}档${lean ? ` · ${lean}` : ""}`,
      createdAt: new Date().toISOString(),
      tags: [`${peopleN} 人`, budget, ...(lean ? [lean] : [])],
      lines,
      budget: result.budgetEst,
      familyCompat: activeMembers.length > 0 ? compatLevel : undefined,
      familyCompatLines: compatLines,
      fridgeMatched: result.fridgeMatched.length > 0 ? result.fridgeMatched : undefined,
      fridgeMissing: result.fridgeMissing.length > 0 ? result.fridgeMissing : undefined,
      remixHint:
        result.remix && result.remixSource
          ? `昨天的「${result.remixSource}」可以变成「${result.remix.title}」 · 加约 ${result.remix.extraMinutes} 分钟${
              result.remix.fridgeMissing.length > 0
                ? `，还要补：${result.remix.fridgeMissing.join("、")}`
                : "，冰箱里就够了"
            }`
          : undefined,
      tomorrowHint: `${result.tomorrow.title} · ${result.tomorrow.hint}`,
    };
  }

  function confirmThis() {
    if (!result) return;
    const peopleN = PEOPLE_OPTIONS.find((p) => p.id === people)?.n ?? 4;
    const perDish = Math.round(result.budgetEst / 3);
    for (const r of [result.main, result.veggie, result.soupOrStaple]) {
      addSelected({
        id: `family-${r.id}`,
        kind: "dish",
        name: r.name,
        price: perDish,
        calories: 600,
        note: `家庭饭 · ${peopleN} 人份`,
      });
    }
    const plan = buildFamilyPlan();
    if (plan) setTonightPlan(plan);
    // 「就按这个」时把缺料一并入购物清单，避免用户还要再点一次
    if (result.fridgeMissing.length > 0) {
      const note = [result.main.name, result.veggie.name, result.soupOrStaple.name]
        .filter(Boolean)
        .join(" · ");
      addShoppingItems(
        result.fridgeMissing.map((m) => ({
          name: m,
          source: "family-tonight",
          note,
        })),
      );
    }
    setConfirmed(true);
    toast({
      title: "今晚就这桌 ✓",
      description:
        result.fridgeMissing.length > 0
          ? `已沉淀为「今晚最终方案」 · 缺的 ${result.fridgeMissing.length} 项已加入购物清单`
          : "已沉淀为「今晚最终方案」 · 也可以在右下角浮窗查看合计。",
    });
  }

  function goPlan() {
    if (typeof window !== "undefined") window.location.hash = "#/tonight-plan";
  }

  function nav(hash: string) {
    if (typeof window !== "undefined") window.location.hash = hash;
  }

  // 兼容总评：三道菜里取最差等级（红 > 黄 > 绿）
  const worstLevel: FamilyMatchResult["level"] | null = useMemo(() => {
    if (!result) return null;
    const levels = Object.values(result.matches).map((m) => m.level);
    if (levels.includes("red")) return "red";
    if (levels.includes("amber")) return "amber";
    return "green";
  }, [result]);

  return (
    <section className="mt-2 space-y-4" data-testid="family-tonight-panel">
      {/* 顶部 hero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-5 py-6 sm:px-7"
        data-testid="family-tonight-hero"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-200/60 to-cyan-200/40 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700/85">
            <Users className="h-3 w-3" />
            一家人今晚吃什么
          </p>
          <h2 className="mt-2 font-display text-[1.7rem] leading-tight tracking-tight text-foreground sm:text-[2rem]">
            一顿饭照顾全家 · 一键搞定
          </h2>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-foreground/75 sm:text-[14.5px]">
            老人小孩口味不一样，预算有限，冰箱里还有点存货 — 我们替你搭一桌
            主菜 / 配菜 / 汤或主食，把家庭兼容、冰箱命中、剩菜利用都算给你看。
          </p>
        </div>
      </div>

      {/* 三组轻量选择 */}
      <Card
        className="grain border-card-border/60 bg-card/70 p-4 sm:p-5"
        data-testid="family-tonight-prefs"
      >
        <div className="space-y-3">
          <PrefRow
            label="几个人吃"
            icon={<Users className="h-3.5 w-3.5 text-primary" />}
            testId="family-people"
          >
            {PEOPLE_OPTIONS.map((p) => (
              <ChipBtn
                key={p.id}
                active={people === p.id}
                onClick={() => setPeople(p.id)}
                testId={`family-people-${p.id}`}
              >
                <span aria-hidden>{p.emoji}</span>
                {p.id}
              </ChipBtn>
            ))}
          </PrefRow>
          <PrefRow
            label="预算档"
            icon={<Wallet className="h-3.5 w-3.5 text-primary" />}
            testId="family-budget"
          >
            {BUDGET_OPTIONS.map((b) => (
              <ChipBtn
                key={b.id}
                active={budget === b.id}
                onClick={() => setBudget(b.id)}
                testId={`family-budget-${b.id}`}
              >
                <span aria-hidden>{b.emoji}</span>
                {b.id}
                <span className="ml-0.5 text-[10.5px] text-muted-foreground num">
                  ¥{b.perPerson}/人
                </span>
              </ChipBtn>
            ))}
          </PrefRow>
          <PrefRow
            label="今晚倾向"
            icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
            testId="family-lean"
          >
            <ChipBtn
              active={lean === null}
              onClick={() => setLean(null)}
              testId="family-lean-none"
            >
              <span aria-hidden>✨</span>
              都行
            </ChipBtn>
            {LEAN_OPTIONS.map((o) => (
              <ChipBtn
                key={o.id}
                active={lean === o.id}
                onClick={() => setLean(o.id)}
                testId={`family-lean-${o.id}`}
              >
                <span aria-hidden>{o.emoji}</span>
                {o.id}
              </ChipBtn>
            ))}
          </PrefRow>
        </div>
        <Button
          type="button"
          size="lg"
          className="mt-4 h-12 w-full gap-2 rounded-full"
          onClick={refreshOne}
          data-testid="family-decide"
        >
          <Wand2 className="h-5 w-5" />
          一键安排今晚
        </Button>
      </Card>

      {!result ? (
        <Card className="grain border-card-border/60 bg-card/70 p-5 text-center text-[13px] text-muted-foreground">
          菜谱库为空，无法生成方案。
        </Card>
      ) : (
        <Card
          className="grain relative overflow-hidden border-emerald-300/60 bg-emerald-50/40 p-5 sm:p-6"
          data-testid="family-tonight-result"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-emerald-700/85">
                今晚就这桌
              </p>
              <h3
                className="mt-1 font-display text-[1.3rem] leading-snug tracking-tight"
                data-testid="family-summary"
              >
                {result.main.name} · {result.veggie.name} · {result.soupOrStaple.name}
              </h3>
              <CompatibilityBadge
                level={worstLevel ?? "green"}
                memberCount={activeMembers.length}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refreshOne}
              className="h-8 rounded-full text-[12px]"
              data-testid="family-refresh"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 再来一组
            </Button>
          </div>

          {/* 三道菜卡片 */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <DishTile
              testId="family-tile-main"
              label="主菜"
              icon={<ChefHat className="h-4 w-4" />}
              recipe={result.main}
              match={result.matches[result.main.id]}
              gradient={["#e08434", "#7c4015"]}
            />
            <DishTile
              testId="family-tile-veggie"
              label="配菜"
              icon={<Salad className="h-4 w-4" />}
              recipe={result.veggie}
              match={result.matches[result.veggie.id]}
              gradient={["#7aa84e", "#345a1f"]}
            />
            <DishTile
              testId="family-tile-third"
              label={result.soupOrStaple.course === "soup" ? "汤" : "主食"}
              icon={
                result.soupOrStaple.course === "soup" ? (
                  <Soup className="h-4 w-4" />
                ) : (
                  <Wheat className="h-4 w-4" />
                )
              }
              recipe={result.soupOrStaple}
              match={result.matches[result.soupOrStaple.id]}
              gradient={["#c8964a", "#6b3e10"]}
            />
          </div>

          {/* 家庭兼容详情 */}
          <FamilyCompatNote
            members={activeMembers}
            matches={result.matches}
            recipes={[result.main, result.veggie, result.soupOrStaple]}
          />

          {/* 冰箱命中 */}
          <FridgeNote
            matched={result.fridgeMatched}
            missing={result.fridgeMissing}
            hasFridge={fridge.length > 0}
            onJump={() => nav("#/fridge")}
            onAddToShopping={() => {
              if (result.fridgeMissing.length === 0) {
                toast({ title: "冰箱够了 ✓", description: "三道菜没有缺料" });
                return;
              }
              const note = [result.main.name, result.veggie.name, result.soupOrStaple.name]
                .filter(Boolean)
                .join(" · ");
              const r = addShoppingItems(
                result.fridgeMissing.map((m) => ({
                  name: m,
                  source: "family-tonight",
                  note,
                })),
              );
              const desc =
                r.added > 0 && r.merged > 0
                  ? `新增 ${r.added} 项 · 合并 ${r.merged} 项`
                  : r.merged > 0
                    ? `合并 ${r.merged} 项到已有清单`
                    : `已加入 ${r.added} 项`;
              toast({ title: "已加入购物清单 ✓", description: desc });
            }}
            onViewShopping={() => nav("#/shopping")}
          />

          {/* 剩菜改造 */}
          <RemixNote
            remix={result.remix}
            sourceName={result.remixSource}
            onJump={() => nav("#/leftover")}
          />

          {/* 预算 + 明天 */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div
              className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
              data-testid="family-budget-estimate"
            >
              <Wallet className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground/85">预算估算</p>
                <p className="num text-[13px] text-primary">
                  约 ¥{result.budgetEst}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  按 {people} 人 · {budget} 档估算 · 含三道菜的食材
                </p>
              </div>
            </div>
            <div
              className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
              data-testid="family-tomorrow"
            >
              <CalendarDays className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground/85">
                  明天可衔接：{result.tomorrow.title}
                </p>
                <p className="text-[11.5px] text-muted-foreground">
                  {result.tomorrow.hint}
                </p>
              </div>
            </div>
          </div>

          {/* 主操作 */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="default"
              className="h-12 flex-1 gap-2 rounded-full"
              onClick={confirmThis}
              data-testid="family-confirm"
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
              data-testid="family-refresh-bottom"
            >
              <RefreshCw className="h-4 w-4" />
              再来一组
            </Button>
          </div>

          {confirmed && (
            <div
              className="mt-3 flex flex-wrap items-center gap-2"
              data-testid="family-confirm-feedback"
            >
              <p className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[12px] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                已沉淀为今晚最终方案
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-[12px]"
                onClick={goPlan}
                data-testid="family-view-plan"
              >
                <Sparkles className="h-3.5 w-3.5" />
                查看最终方案
              </Button>
            </div>
          )}

          {/* 二级深挖入口 */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5" data-testid="family-deep-links">
            <DeepLink
              testId="family-link-family"
              icon={<Users className="h-4 w-4" />}
              label="家庭口味"
              hint="管理成员"
              onClick={() => nav("#/family")}
            />
            <DeepLink
              testId="family-link-fridge"
              icon={<Refrigerator className="h-4 w-4" />}
              label="冰箱有啥"
              hint="补充库存"
              onClick={() => nav("#/fridge")}
            />
            <DeepLink
              testId="family-link-leftover"
              icon={<Repeat className="h-4 w-4" />}
              label="剩菜变花样"
              hint="昨天剩了"
              onClick={() => nav("#/leftover")}
            />
            <DeepLink
              testId="family-link-weekly"
              icon={<CalendarDays className="h-4 w-4" />}
              label="一周菜单"
              hint="规划全周"
              onClick={() => nav("#/weekly")}
            />
            <DeepLink
              testId="family-link-shopping"
              icon={<ShoppingCart className="h-4 w-4" />}
              label="购物清单"
              hint="缺料汇总"
              onClick={() => nav("#/shopping")}
            />
          </div>
        </Card>
      )}
    </section>
  );
}

// === 子组件 ===

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

function DishTile({
  testId,
  label,
  icon,
  recipe,
  match,
  gradient,
}: {
  testId: string;
  label: string;
  icon: React.ReactNode;
  recipe: Recipe;
  match: FamilyMatchResult | undefined;
  gradient: [string, string];
}) {
  const lvlClass =
    match?.level === "red"
      ? "border-rose-300/70 bg-rose-50/60"
      : match?.level === "amber"
        ? "border-amber-300/70 bg-amber-50/60"
        : "border-emerald-300/70 bg-emerald-50/40";
  return (
    <div
      className={`flex gap-2.5 rounded-xl border bg-background/70 p-3 ${lvlClass}`}
      data-testid={testId}
    >
      <FoodImage
        query={recipe.name}
        name={recipe.name}
        emoji="🍽"
        gradient={gradient}
        className="h-16 w-16 flex-shrink-0 sm:h-[68px] sm:w-[68px]"
      />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
          <span className="text-primary">{icon}</span>
          {label}
        </p>
        <p className="text-[14px] font-medium text-foreground">{recipe.name}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">
          {recipe.cuisine} · 约 {recipe.timeMinutes} 分钟 · {recipe.difficulty}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          {recipe.tastes.slice(0, 2).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="rounded-full px-1.5 py-0 text-[10px]"
            >
              {t}
            </Badge>
          ))}
        </div>
        <a
          href={stableSearchUrl("百度", `${recipe.name} 家常做法`)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-[11px] text-primary hover:underline"
        >
          → 做法搜索
        </a>
      </div>
    </div>
  );
}

function CompatibilityBadge({
  level,
  memberCount,
}: {
  level: FamilyMatchResult["level"];
  memberCount: number;
}) {
  if (memberCount === 0) {
    return (
      <p
        className="mt-1 inline-flex items-center gap-1 text-[12px] text-emerald-700/85"
        data-testid="family-compat-badge"
      >
        <Heart className="h-3 w-3" />
        还没有家庭成员 · 通用推荐 ·
        <a
          href="#/family"
          className="ml-0.5 text-primary underline-offset-2 hover:underline"
        >
          先添加成员让推荐更准
        </a>
      </p>
    );
  }
  const meta =
    level === "red"
      ? {
          icon: <AlertTriangle className="h-3 w-3" />,
          text: "注意冲突 · 有过敏/严格忌口",
          cls: "text-rose-700",
        }
      : level === "amber"
        ? {
            icon: <ShieldCheck className="h-3 w-3" />,
            text: "部分兼容 · 有人略不爱",
            cls: "text-amber-700",
          }
        : {
            icon: <ShieldCheck className="h-3 w-3" />,
            text: "全家兼容 · 一起吃没问题",
            cls: "text-emerald-700",
          };
  return (
    <p
      className={`mt-1 inline-flex items-center gap-1 text-[12px] ${meta.cls}`}
      data-testid="family-compat-badge"
    >
      {meta.icon}
      {meta.text}
    </p>
  );
}

function FamilyCompatNote({
  members,
  matches,
  recipes,
}: {
  members: FamilyMember[];
  matches: Record<string, FamilyMatchResult>;
  recipes: Recipe[];
}) {
  if (members.length === 0) {
    return (
      <div
        className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
        data-testid="family-compat-note"
      >
        <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <div>
          <p className="font-medium text-foreground/85">家庭兼容</p>
          <p className="text-[11.5px] text-muted-foreground">
            还没添加家庭成员，按通用偏好推荐。
            <a
              href="#/family"
              className="ml-1 text-primary underline-offset-2 hover:underline"
            >
              去登记成员
            </a>
            后，老人小孩的过敏 / 忌口会自动避开。
          </p>
        </div>
      </div>
    );
  }

  const lines: string[] = [];
  for (const r of recipes) {
    const m = matches[r.id];
    if (!m) continue;
    const summary = summarizeConflicts(m);
    if (summary === "全家都能吃") continue;
    lines.push(`${r.name} · ${summary}`);
  }

  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
      data-testid="family-compat-note"
    >
      <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground/85">家庭兼容（{members.length} 人）</p>
        {lines.length === 0 ? (
          <p className="text-[11.5px] text-emerald-700">
            ✓ 三道菜都全家能吃 · 不用单独做小灶。
          </p>
        ) : (
          <ul className="mt-0.5 space-y-0.5 text-[11.5px] text-foreground/70">
            {lines.map((l) => (
              <li key={l}>• {l}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FridgeNote({
  matched,
  missing,
  hasFridge,
  onJump,
  onAddToShopping,
  onViewShopping,
}: {
  matched: string[];
  missing: string[];
  hasFridge: boolean;
  onJump: () => void;
  onAddToShopping?: () => void;
  onViewShopping?: () => void;
}) {
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
      data-testid="family-fridge-note"
    >
      <Snowflake className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground/85">冰箱情况</p>
        {!hasFridge ? (
          <p className="text-[11.5px] text-muted-foreground">
            还没有登记食材。
            <button
              type="button"
              onClick={onJump}
              className="ml-1 text-primary underline-offset-2 hover:underline"
              data-testid="family-fridge-empty-cta"
            >
              去「冰箱有啥」添加食材
            </button>
            ，下次推荐会优先用现有的。
          </p>
        ) : (
          <>
            {matched.length > 0 && (
              <p className="text-[11.5px] text-emerald-700">
                ✓ 现有食材命中：{matched.join(" · ")}
              </p>
            )}
            {missing.length > 0 && (
              <p className="text-[11.5px] text-amber-700">
                还需买：{missing.join(" · ")}
              </p>
            )}
            {matched.length === 0 && missing.length === 0 && (
              <p className="text-[11.5px] text-muted-foreground">
                这三道菜没有可比对的核心食材。
              </p>
            )}
            {missing.length > 0 && (onAddToShopping || onViewShopping) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {onAddToShopping && (
                  <button
                    type="button"
                    onClick={onAddToShopping}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover-elevate active-elevate-2"
                    data-testid="family-fridge-add-shopping"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    一键加入购物清单
                  </button>
                )}
                {onViewShopping && (
                  <button
                    type="button"
                    onClick={onViewShopping}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover-elevate active-elevate-2"
                    data-testid="family-fridge-view-shopping"
                  >
                    查看清单
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function RemixNote({
  remix,
  sourceName,
  onJump,
}: {
  remix: RemixWithFridgeInfo | null;
  sourceName: string | null;
  onJump: () => void;
}) {
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-2.5 text-[12.5px]"
      data-testid="family-remix-note"
    >
      <Repeat className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground/85">剩菜改造</p>
        {remix && sourceName ? (
          <>
            <p className="text-[11.5px] text-foreground/85">
              昨天的「{sourceName}」可以变成{" "}
              <span className="font-medium text-primary">{remix.title}</span>
              <span className="ml-1 text-muted-foreground">
                · 加约 {remix.extraMinutes} 分钟
              </span>
            </p>
            {remix.fridgeMissing.length > 0 ? (
              <p className="text-[11.5px] text-amber-700">
                还要补：{remix.fridgeMissing.join(" · ")}
              </p>
            ) : (
              <p className="text-[11.5px] text-emerald-700">
                ✓ 冰箱里就够了，直接做
              </p>
            )}
          </>
        ) : (
          <p className="text-[11.5px] text-muted-foreground">
            暂无昨天的剩菜记录。如果有剩米饭 / 红烧肉 / 炒青菜，
            <button
              type="button"
              onClick={onJump}
              className="ml-0.5 text-primary underline-offset-2 hover:underline"
              data-testid="family-remix-empty-cta"
            >
              去「剩菜变花样」
            </button>
            一键变出第二顿。
          </p>
        )}
      </div>
    </div>
  );
}

function DeepLink({
  testId,
  icon,
  label,
  hint,
  onClick,
}: {
  testId: string;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-left transition-colors hover-elevate active-elevate-2 hover:border-primary/40"
    >
      <span className="text-primary">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[12.5px] font-medium text-foreground">{label}</span>
        <span className="text-[10.5px] text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

// === 工具：明天衔接建议 ===
function pickTomorrowHint(
  main: Recipe,
  third: Recipe,
): { title: string; hint: string } {
  const text = main.name + main.ingredients.map((i) => i.name).join("");
  const isMeat = /(红烧|炖|焖|肉|猪|牛)/.test(text);
  const isSoup = third.course === "soup";
  if (isSoup) {
    return {
      title: "汤底煮面 / 烩饭",
      hint: `今晚的「${third.name}」剩点汤底，明早煮一碗面或下午烩个饭都很省事。`,
    };
  }
  if (isMeat) {
    return {
      title: "卤味 → 卷饼 / 三明治",
      hint: `今晚「${main.name}」如果有剩，明天切薄片做卷饼或三明治，10 分钟搞定一餐。`,
    };
  }
  return {
    title: "备菜：洗一把青菜",
    hint: "明天午餐能用同一批食材简单清炒一份青菜配饭。",
  };
}
