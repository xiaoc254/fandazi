// v7: 「今天懒人做什么」二级 section（不新增顶级 Tab，避免导航爆炸）。
// 输入：设备 + 时间 + 冰箱剩什么 + 目标；输出：今日懒人惊喜简餐。

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wand2,
  RefreshCw,
  Flame,
  Wallet,
  Clock,
  Refrigerator,
  Cog,
  Target,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  LAZY_MEALS,
  pickLazyMeal,
  type LazyEquipment,
  type LazyFridge,
  type LazyGoal,
  type LazyTime,
  type LazyMeal,
} from "@/data/lazyMeals";
import { FoodImage, stableSearchUrl } from "@/components/FoodImage";

const EQUIPMENTS: { id: LazyEquipment; emoji: string }[] = [
  { id: "无设备", emoji: "🤲" },
  { id: "空气炸锅", emoji: "🍳" },
  { id: "电饭煲", emoji: "🍚" },
  { id: "早餐机", emoji: "🥪" },
  { id: "微波炉", emoji: "📡" },
  { id: "一口锅", emoji: "🥘" },
];

const TIMES: LazyTime[] = [5, 10, 15, 30];

const FRIDGE: LazyFridge[] = [
  "鸡蛋", "米饭", "青菜", "火腿", "鸡胸", "速冻饺子", "面条", "土豆", "番茄", "玉米", "牛奶", "面包", "豆腐", "虾仁",
];

const GOALS: { id: LazyGoal; emoji: string }[] = [
  { id: "省钱", emoji: "💰" },
  { id: "减脂", emoji: "🥗" },
  { id: "治愈", emoji: "🤍" },
  { id: "儿童", emoji: "🧒" },
  { id: "长辈", emoji: "👴" },
];

function MealCard({ meal, special }: { meal: LazyMeal; special?: boolean }) {
  return (
    <Card
      className={`grain p-3 ${special ? "border-primary/50 bg-primary/5" : "border-card-border/60 bg-card/70"}`}
      data-testid={`lazy-meal-${meal.id}`}
    >
      <div className="flex items-start gap-3">
        <FoodImage
          query={meal.searchQuery ?? `${meal.name} 做法`}
          name={meal.name}
          emoji={meal.emoji}
          gradient={["#f4a045", "#c14b2a"]}
          className="h-16 w-16 flex-shrink-0 sm:h-[72px] sm:w-[72px]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="font-display text-[15.5px] tracking-tight">{meal.name}</h4>
            {special && (
              <Badge className="rounded-full bg-primary text-primary-foreground" data-testid="lazy-meal-special-badge">
                <Sparkles className="mr-0.5 h-3 w-3" /> 今日惊喜
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span className="num inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {meal.minutes} 分钟
            </span>
            <span className="num inline-flex items-center gap-0.5">
              <Wallet className="h-3 w-3" /> ¥{meal.price}
            </span>
            <span className="num inline-flex items-center gap-0.5">
              <Flame className="h-3 w-3" /> {meal.calories} kcal
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {meal.equipment.map((e) => (
              <Badge key={e} variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {e}
              </Badge>
            ))}
            {meal.goals.map((g) => (
              <Badge key={g} variant="secondary" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {g}
              </Badge>
            ))}
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">{meal.reason}</p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[12.5px] text-foreground/85">
            {meal.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
          {meal.swaps && (
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              <span className="font-medium">替代食材：</span>
              {meal.swaps}
            </p>
          )}
          <a
            href={stableSearchUrl("百度", `${meal.name} 做法`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
            data-testid={`lazy-meal-search-${meal.id}`}
          >
            <ExternalLink className="h-3 w-3" /> 搜更多做法
          </a>
        </div>
      </div>
    </Card>
  );
}

export function LazyMealsPanel() {
  const [equipment, setEquipment] = useState<LazyEquipment[]>([]);
  const [maxMinutes, setMaxMinutes] = useState<LazyTime>(15);
  const [fridge, setFridge] = useState<LazyFridge[]>([]);
  const [goals, setGoals] = useState<LazyGoal[]>([]);
  const [nonce, setNonce] = useState(0);

  const result = useMemo(
    () => pickLazyMeal({ equipment, maxMinutes, fridge, goals }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [equipment, maxMinutes, fridge, goals, nonce],
  );

  function toggle<T>(arr: T[], v: T, set: (next: T[]) => void) {
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  }

  return (
    <section className="mt-6 space-y-3" data-testid="lazy-meals-panel">
      <header>
        <h3 className="font-display text-[1.4rem] tracking-tight">
          <Wand2 className="mb-0.5 mr-1 inline h-5 w-5 text-primary" />
          今天懒人做什么
        </h3>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          告诉我们设备 / 时间 / 冰箱剩什么 / 目标 — 抽一道 60+ 模板里的「今日懒人惊喜简餐」
        </p>
      </header>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="space-y-3">
          {/* 设备 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Cog className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 你有哪些设备（多选 / 留空不限）
            </p>
            <div className="flex flex-wrap gap-1" data-testid="lazy-meals-equipment">
              {EQUIPMENTS.map((e) => {
                const active = equipment.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggle(equipment, e.id, setEquipment)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/85"
                    }`}
                    data-testid={`lazy-meals-eq-${e.id}`}
                  >
                    <span aria-hidden>{e.emoji}</span>
                    {e.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 时间 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Clock className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 我有几分钟
            </p>
            <div className="flex flex-wrap gap-1">
              {TIMES.map((t) => {
                const active = maxMinutes === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMaxMinutes(t)}
                    className={`rounded-full border px-2.5 py-1 text-[12px] num transition-colors ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/85 hover-elevate"
                    }`}
                    data-testid={`lazy-meals-time-${t}`}
                  >
                    ≤ {t} 分钟
                  </button>
                );
              })}
            </div>
          </div>

          {/* 冰箱剩什么 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Refrigerator className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 冰箱里还有啥（多选 / 留空不限）
            </p>
            <div className="flex flex-wrap gap-1" data-testid="lazy-meals-fridge">
              {FRIDGE.map((f) => {
                const active = fridge.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggle(fridge, f, setFridge)}
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/85 hover-elevate"
                    }`}
                    data-testid={`lazy-meals-fridge-${f}`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 目标 */}
          <div>
            <p className="mb-1 text-[12px] font-medium text-foreground/80">
              <Target className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-primary" /> 今日目标（多选 / 留空不限）
            </p>
            <div className="flex flex-wrap gap-1" data-testid="lazy-meals-goals">
              {GOALS.map((g) => {
                const active = goals.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggle(goals, g.id, setGoals)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/85"
                    }`}
                    data-testid={`lazy-meals-goal-${g.id}`}
                  >
                    <span aria-hidden>{g.emoji}</span>
                    {g.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground">
              模板池 {LAZY_MEALS.length} 个 · 数据离线 / 不上传
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-[12px]"
              onClick={() => setNonce((n) => n + 1)}
              data-testid="lazy-meals-refresh"
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> 换一组
            </Button>
          </div>
        </div>
      </Card>

      {/* 主推荐 + 备选 */}
      {result.fallbackNote && (
        <div
          className="rounded-md border border-amber-300/50 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
          data-testid="lazy-meals-fallback-note"
        >
          {result.fallbackNote}
        </div>
      )}
      <MealCard meal={result.special} special />
      {result.alternatives.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {result.alternatives.map((m) => (
            <MealCard key={m.id} meal={m} />
          ))}
        </div>
      )}
    </section>
  );
}
