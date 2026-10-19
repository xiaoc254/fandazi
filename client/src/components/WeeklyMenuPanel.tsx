// 家庭一周菜单 + 预算买菜清单：独立主流程。
// 入口：#/weekly。
// 输入：人数 / 老人孩子 / 月预算 / 周预算 / 外卖次数 / 目标 / 忌口。
// 输出：7 天菜单 + 频次 + 估价 + 买菜清单。

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Users,
  Wallet,
  Target,
  Bike,
  ShoppingBasket,
  Beef,
  Drumstick,
  Fish,
  Egg,
  Carrot,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Heart,
  Baby,
  HandHeart,
  ShoppingCart,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  defaultFamilyInput,
  planFamilyWeek,
  weeklyMenuToText,
  type FamilyInput,
  type FamilyGoal,
  type ProteinKind,
} from "@/lib/familyWeekly";
import { ALL_RESTRICTIONS, type Restriction } from "@/data/recipes";
import {
  addShoppingItems,
  type ShoppingCategory,
  type ShoppingSource,
} from "@/lib/shoppingList";

// 把 weekly 的 ShoppingGroup.group 映射到统一购物清单的分类。
const WEEKLY_GROUP_TO_CATEGORY: Record<string, ShoppingCategory> = {
  肉蛋奶: "肉蛋奶",
  蔬菜: "蔬菜",
  主食豆制品: "主食豆制品",
  调味杂项: "调味杂项",
};

const GOALS: { id: FamilyGoal; label: string; hint: string }[] = [
  { id: "均衡", label: "均衡", hint: "蔬菜蛋肉适当搭配" },
  { id: "省钱", label: "省钱", hint: "豆腐蛋为主，少牛肉少外卖" },
  { id: "减脂", label: "减脂", hint: "高蛋白 + 低油" },
  { id: "增肌", label: "增肌", hint: "高蛋白多肉" },
  { id: "长辈友好", label: "长辈友好", hint: "清淡软烂、蒸炖为主" },
  { id: "儿童友好", label: "儿童友好", hint: "番茄蛋甜咸口、不辣" },
];

const PROTEIN_ICON: Record<ProteinKind, React.ComponentType<any>> = {
  鸡肉: Drumstick,
  牛肉: Beef,
  猪肉: Beef,
  鱼虾: Fish,
  豆腐蛋: Egg,
  外卖: Bike,
};

function NumStepper({
  label,
  value,
  min,
  max,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  testId?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-7 w-7 rounded-full border border-border bg-background text-[14px] hover-elevate active-elevate-2"
          data-testid={testId ? `${testId}-dec` : undefined}
          aria-label={`减少${label}`}
        >−</button>
        <span className="num min-w-[1.2rem] text-center text-[14px] font-semibold" data-testid={testId}>{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-7 w-7 rounded-full border border-border bg-background text-[14px] hover-elevate active-elevate-2"
          data-testid={testId ? `${testId}-inc` : undefined}
          aria-label={`增加${label}`}
        >+</button>
      </div>
    </div>
  );
}

export function WeeklyMenuPanel() {
  const { toast } = useToast();
  const [input, setInput] = useState<FamilyInput>(() => defaultFamilyInput());
  const [seed, setSeed] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const plan = useMemo(() => planFamilyWeek(input, seed), [input, seed]);

  function update<K extends keyof FamilyInput>(key: K, value: FamilyInput[K]) {
    setInput((prev) => {
      const next: FamilyInput = { ...prev, [key]: value };
      // 自动同步 people = adults + kids + elders
      if (key === "adults" || key === "kids" || key === "elders") {
        next.people = next.adults + next.kids + next.elders;
        if (next.people < 1) next.people = 1;
      }
      // 月预算变 → 周预算自动更新（4.3 周/月）
      if (key === "monthlyBudget") {
        next.weeklyBudget = Math.round((next.monthlyBudget / 4.3) / 10) * 10;
      }
      return next;
    });
  }

  function toggleRestriction(r: Restriction) {
    setInput((prev) => {
      const has = prev.restrictions.includes(r);
      return {
        ...prev,
        restrictions: has ? prev.restrictions.filter((x) => x !== r) : [...prev.restrictions, r],
      };
    });
  }

  function regenerate() {
    setSeed((s) => s + 1);
  }

  async function copyAll() {
    const txt = weeklyMenuToText(input, plan);
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      toast({ title: "已复制一周菜单 + 买菜清单", description: "可直接发到家庭群" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "复制失败", description: "请手动选择文本复制", variant: "destructive" });
    }
  }

  function syncToShoppingList() {
    const inputs: { name: string; source: ShoppingSource; category?: ShoppingCategory; amount?: string; note?: string }[] = [];
    for (const g of plan.shopping) {
      const category = WEEKLY_GROUP_TO_CATEGORY[g.group];
      for (const it of g.items) {
        inputs.push({
          name: it.name,
          source: "weekly",
          category,
          amount: it.qty,
          note:
            it.fromRecipes.length > 0
              ? it.fromRecipes.slice(0, 2).join(" · ")
              : undefined,
        });
      }
    }
    if (inputs.length === 0) {
      toast({ title: "本周清单是空的" });
      return;
    }
    const r = addShoppingItems(inputs);
    const desc =
      r.added > 0 && r.merged > 0
        ? `新增 ${r.added} 项 · 合并 ${r.merged} 项`
        : r.merged > 0
          ? `合并 ${r.merged} 项到已有清单`
          : `已加入 ${r.added} 项`;
    toast({ title: "已同步到购物清单 ✓", description: desc });
  }

  const overBudget = plan.budgetDelta > 0;
  const totalProteinMeals = plan.proteinFreq.reduce((acc, p) => acc + p.count, 0);

  return (
    <section id="weekly-section" className="mt-4 scroll-mt-20" data-testid="section-weekly">
      <div className="mb-4">
        <h2 className="font-display text-[1.6rem] tracking-tight">
          <CalendarDays className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          家庭一周菜单 · 预算买菜清单
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          告诉我们家里几个人吃、有没有老人孩子、月预算多少，我们直接出 7 天菜单和买菜清单。
        </p>
      </div>

      {/* 输入区 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="weekly-inputs">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <NumStepper label="成人" value={input.adults} min={0} max={8} onChange={(v) => update("adults", v)} testId="weekly-adults" />
          <NumStepper label="孩子" value={input.kids} min={0} max={6} onChange={(v) => update("kids", v)} testId="weekly-kids" />
          <NumStepper label="长辈" value={input.elders} min={0} max={4} onChange={(v) => update("elders", v)} testId="weekly-elders" />
        </div>
        <div className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> 总人数 <span className="num font-semibold text-foreground">{input.people}</span> · 一周 14 餐（午+晚）
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Wallet className="h-3.5 w-3.5 text-primary" /> 月预算
              </span>
              <span className="num font-semibold" data-testid="weekly-monthly-budget">¥{input.monthlyBudget}</span>
            </div>
            <Slider
              value={[input.monthlyBudget]}
              min={500}
              max={4000}
              step={50}
              onValueChange={([v]) => update("monthlyBudget", v)}
              className="mt-2"
              data-testid="weekly-monthly-slider"
            />
            <div className="mt-1 flex justify-between text-[11px] text-muted-foreground num">
              <span>500</span><span>1500（默认）</span><span>4000</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> 周预算
              </span>
              <span className="num font-semibold" data-testid="weekly-weekly-budget">¥{input.weeklyBudget}</span>
            </div>
            <Slider
              value={[input.weeklyBudget]}
              min={120}
              max={1000}
              step={10}
              onValueChange={([v]) => update("weeklyBudget", v)}
              className="mt-2"
              data-testid="weekly-weekly-slider"
            />
            <div className="mt-1 text-[11px] text-muted-foreground">月预算变化时自动联动；可以独立微调</div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Bike className="h-3.5 w-3.5 text-primary" /> 一周外卖次数
              </span>
              <span className="num font-semibold" data-testid="weekly-takeout-count">{input.takeoutCount} 次</span>
            </div>
            <Slider
              value={[input.takeoutCount]}
              min={0}
              max={10}
              step={1}
              onValueChange={([v]) => update("takeoutCount", v)}
              className="mt-2"
              data-testid="weekly-takeout-slider"
            />
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium">
              <Target className="h-3.5 w-3.5 text-primary" /> 目标
            </div>
            <div className="flex flex-wrap gap-1.5" data-testid="weekly-goals">
              {GOALS.map((g) => {
                const active = input.goal === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => update("goal", g.id)}
                    className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                      active
                        ? "border-primary/60 bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/85"
                    }`}
                    data-testid={`weekly-goal-${g.id}`}
                    title={g.hint}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/60 p-3">
          <div className="mb-2 text-[13px] font-medium">忌口（多选）</div>
          <div className="flex flex-wrap gap-1.5" data-testid="weekly-restrictions">
            {ALL_RESTRICTIONS.map((r) => {
              const active = input.restrictions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRestriction(r)}
                  className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors hover-elevate active-elevate-2 ${
                    active
                      ? "border-primary/60 bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground/85"
                  }`}
                  data-testid={`weekly-restriction-${r}`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={regenerate}
            data-testid="weekly-regenerate"
            className="rounded-full"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 重新生成一周
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={copyAll}
            data-testid="weekly-copy"
            className="rounded-full"
          >
            {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
            {copied ? "已复制" : "复制一周文案"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={syncToShoppingList}
            data-testid="weekly-sync-shopping"
            className="rounded-full"
          >
            <ShoppingCart className="mr-1 h-3.5 w-3.5" />
            同步到购物清单
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (typeof window !== "undefined") window.location.hash = "#/shopping";
            }}
            data-testid="weekly-view-shopping"
            className="rounded-full"
          >
            查看购物清单
          </Button>
        </div>
      </Card>

      {/* 频次 + 预算总览 */}
      <Card className="mt-4 grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="weekly-summary">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3" data-testid="weekly-cost-summary">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary/90">
              <Wallet className="h-3.5 w-3.5" /> 本周估价
            </div>
            <div className="mt-1 font-display num text-[1.55rem]" data-testid="weekly-total-cost">¥{plan.totalCost}</div>
            <div className={`mt-1 text-[11.5px] ${overBudget ? "text-rose-600" : "text-emerald-600"} num`}>
              {overBudget ? `超预算 ¥${plan.budgetDelta}` : `剩余预算 ¥${-plan.budgetDelta}`} · 周预算 ¥{input.weeklyBudget}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/85">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> 蛋白频次
            </div>
            <div className="mt-1 flex flex-wrap gap-1" data-testid="weekly-protein-freq">
              {plan.proteinFreq.map((p) => {
                const Icon = PROTEIN_ICON[p.kind];
                return (
                  <span
                    key={p.kind}
                    className={`inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2 py-0.5 text-[11.5px] ${p.count === 0 ? "text-muted-foreground/60" : ""}`}
                    data-testid={`weekly-protein-${p.kind}`}
                  >
                    <Icon className="h-3 w-3 text-primary/80" />
                    {p.kind} <span className="num font-semibold">×{p.count}</span>
                  </span>
                );
              })}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              共 {totalProteinMeals} 餐主菜 · 蔬菜餐次 {plan.veggieMeals}
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/60 p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground/85">
              <Target className="h-3.5 w-3.5 text-primary" /> 配置说明
            </div>
            <ul className="mt-1 space-y-0.5 text-[11.5px] text-muted-foreground" data-testid="weekly-notes">
              {plan.notes.slice(0, 3).map((n, i) => <li key={i}>· {n}</li>)}
            </ul>
          </div>
        </div>
        {overBudget && plan.downgradeTips.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[12.5px]" data-testid="weekly-downgrade">
            <div className="mb-1 inline-flex items-center gap-1 font-medium text-amber-700">
              <AlertTriangle className="h-3.5 w-3.5" /> 超预算 — 建议这样降级：
            </div>
            <ul className="ml-4 list-disc space-y-0.5 text-amber-800/90">
              {plan.downgradeTips.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}
        {!overBudget && plan.downgradeTips.length > 0 && (
          <p className="mt-2 text-[12px] text-emerald-700" data-testid="weekly-surplus">
            <Sparkles className="mr-1 inline h-3 w-3" /> {plan.downgradeTips[0]}
          </p>
        )}
      </Card>

      {/* 7 天菜单 */}
      <div className="mt-4 grid gap-3 lg:grid-cols-2" data-testid="weekly-days">
        {plan.days.map((day) => (
          <Card key={day.day} className="grain border-card-border/60 bg-card/70 p-4" data-testid={`weekly-day-${day.day}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-display text-[1.1rem] tracking-tight">{day.label}</h3>
              <span className="num text-[12px] text-muted-foreground">¥{day.cost}</span>
            </div>
            {day.meals.map((meal) => (
              <div key={meal.slot} className="mt-2 rounded-lg border border-border/50 bg-background/40 p-2.5">
                <div className="mb-1 flex items-baseline justify-between text-[12px]">
                  <span className="font-medium text-foreground/90">{meal.slotLabel}</span>
                  <span className="num text-muted-foreground">¥{meal.cost}{meal.isTakeout ? " · 外卖" : ""}</span>
                </div>
                <ul className="space-y-1">
                  {meal.dishes.map((d, i) => (
                    <li key={i} className="flex items-baseline gap-1.5 text-[12.5px]" data-testid={`weekly-dish-${day.day}-${meal.slot}-${i}`}>
                      <span className="text-[10px] text-primary/70">●</span>
                      <span className="flex-1">
                        {d.recipe ? d.recipe.name : <span className="text-primary/90">外卖：{d.takeoutHint}</span>}
                        {d.flags.map((f) => (
                          <Badge
                            key={f}
                            variant="outline"
                            className={`ml-1 rounded-full border-emerald-500/40 px-1.5 py-0 text-[10px] ${
                              f.includes("长辈") ? "text-emerald-700 bg-emerald-500/10" : "text-pink-700 bg-pink-500/10 border-pink-500/40"
                            }`}
                          >
                            {f.includes("长辈") ? <HandHeart className="mr-0.5 inline h-2.5 w-2.5" /> : <Baby className="mr-0.5 inline h-2.5 w-2.5" />}
                            {f}
                          </Badge>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* 买菜清单 */}
      <Card className="mt-4 grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="weekly-shopping">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-display text-[1.2rem] tracking-tight">
            <ShoppingBasket className="mb-1 mr-1 inline h-4 w-4 text-primary" />
            一周买菜清单
          </h3>
          <span className="num text-[12.5px] text-muted-foreground">合计约 ¥{plan.shoppingTotal}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {plan.shopping.map((g) => g.items.length === 0 ? null : (
            <div key={g.group} className="rounded-xl border border-border/60 bg-background/50 p-3" data-testid={`weekly-shop-${g.group}`}>
              <div className="mb-2 flex items-baseline justify-between text-[13px]">
                <span className="inline-flex items-center gap-1 font-medium">
                  {g.group === "肉蛋奶" && <Beef className="h-3.5 w-3.5 text-rose-600" />}
                  {g.group === "蔬菜" && <Carrot className="h-3.5 w-3.5 text-emerald-600" />}
                  {g.group === "主食豆制品" && <Sparkles className="h-3.5 w-3.5 text-amber-600" />}
                  {g.group === "调味杂项" && <Heart className="h-3.5 w-3.5 text-foreground/70" />}
                  {g.group}
                </span>
                <span className="num text-[11.5px] text-muted-foreground">¥{g.subtotal}</span>
              </div>
              <ul className="space-y-1.5">
                {g.items.slice(0, 14).map((it, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-2 text-[12px]" data-testid={`weekly-shop-${g.group}-${i}`}>
                    <div className="flex-1">
                      <span className="font-medium text-foreground/90">{it.name}</span>
                      <span className="ml-1 text-muted-foreground">{it.qty}</span>
                      {it.alt && <span className="ml-1 text-[11px] text-amber-700/85">· {it.alt}</span>}
                    </div>
                    <span className="num text-foreground/70">¥{it.cost}</span>
                  </li>
                ))}
                {g.items.length > 14 && (
                  <li className="text-[11px] text-muted-foreground">…共 {g.items.length} 项</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
