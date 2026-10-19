// 「今天水果吃什么」：按月份 / 人群 / 偏好给推荐。
// 月份默认当前月（Asia/Shanghai 系统时间），用户可手动切换。

import { useMemo, useState } from "react";
import {
  Apple,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Flame,
  Leaf,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  pickFruit,
  fruitsForMonth,
  FRUITS,
  type Fruit,
  type FruitAudience,
} from "@/data/fruits";
import { snackSearchLinks } from "@/data/snacks";
import { ReactionButtons } from "./ReactionButtons";
import { useReactions } from "@/hooks/useReactions";

const AUDIENCES: { id: FruitAudience; label: string; emoji: string }[] = [
  { id: "减脂", label: "减脂", emoji: "🏃" },
  { id: "控糖", label: "控糖", emoji: "🚫🍬" },
  { id: "儿童", label: "儿童", emoji: "🧒" },
  { id: "长辈", label: "长辈", emoji: "👴" },
  { id: "运动后", label: "运动后", emoji: "💪" },
  { id: "解馋", label: "解馋", emoji: "😋" },
  { id: "胃不适", label: "胃不适", emoji: "🤢" },
];

function FruitVisual({ fruit }: { fruit: Fruit }) {
  const grad: [string, string] = (() => {
    const t = fruit.taste;
    if (t.includes("甜") && fruit.emoji === "🍓") return ["#ff8a8a", "#c2185b"];
    if (fruit.emoji === "🍉") return ["#ff7f7f", "#2d8b3a"];
    if (fruit.emoji === "🍌") return ["#ffe78a", "#c89200"];
    if (fruit.emoji === "🥝") return ["#bde6a3", "#3e7a2c"];
    if (fruit.emoji === "🍇" || fruit.emoji === "🫐") return ["#a48fff", "#3f3580"];
    if (fruit.emoji === "🍊" || fruit.emoji === "🥭" || fruit.emoji === "🍍") return ["#ffce66", "#c87a1f"];
    if (fruit.emoji === "🍑" || fruit.emoji === "🍒") return ["#ffa3b8", "#a02233"];
    if (fruit.emoji === "🥑") return ["#9bc78a", "#3a5e2a"];
    return ["#fbd9ad", "#a85a2c"];
  })();
  const first = (fruit.name || "").trim().charAt(0) || fruit.emoji;
  return (
    <div
      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-[68px] sm:w-[68px]"
      style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.4), transparent 60%)" }} />
      <span className="relative flex h-full w-full items-center justify-center font-display text-[1.85rem] font-semibold text-white drop-shadow-md">
        {first}
      </span>
      <span className="absolute right-1 top-1 text-[18px] drop-shadow">{fruit.emoji}</span>
    </div>
  );
}

function FruitCard({ fruit, special }: { fruit: Fruit; special?: boolean }) {
  const links = snackSearchLinks(fruit.name);
  return (
    <Card
      className={`grain p-3 ${
        special ? "border-primary/50 bg-primary/5" : "border-card-border/60 bg-card/70"
      }`}
      data-testid={`fruit-card-${fruit.id}`}
    >
      <div className="flex items-start gap-3">
        <FruitVisual fruit={fruit} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="truncate font-display text-[15.5px] tracking-tight">{fruit.name}</h4>
            {special && (
              <Badge className="rounded-full bg-primary text-primary-foreground" data-testid="fruit-special-badge">
                <Sparkles className="mr-0.5 h-3 w-3" /> 替你决定
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <span className="num inline-flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-primary/80" />
              ≈{fruit.calories} kcal/100g
            </span>
            <span className="num">糖 ≈{fruit.sugar}g</span>
            <span className="inline-flex items-center gap-0.5">
              <Leaf className="h-3 w-3 text-emerald-600" />
              {fruit.nutrition.join(" / ")}
            </span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary/80" />
            {fruit.reason}
          </p>
          {fruit.caution && (
            <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11.5px] text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {fruit.caution}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {fruit.taste.map((t) => (
              <Badge key={t} variant="secondary" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {t}
              </Badge>
            ))}
            {fruit.audiences.map((a) => (
              <Badge key={a} variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {a}
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {links.slice(0, 3).map((l) => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[11px] text-foreground/80 hover-elevate active-elevate-2"
              >
                <ExternalLink className="h-3 w-3 opacity-70" />
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-2">
            <ReactionButtons kind="fruit" id={fruit.id} compact />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function FruitPanel() {
  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [audiences, setAudiences] = useState<FruitAudience[]>([]);
  const [seasonalOnly, setSeasonalOnly] = useState<boolean>(true);
  const [nonce, setNonce] = useState(0);
  const reactions = useReactions("fruit");

  const result = useMemo(
    () => pickFruit({
      month,
      audiences,
      seasonalOnly,
      likedIds: reactions.likes,
      dislikedIds: reactions.dislikes,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [month, audiences, seasonalOnly, nonce, reactions.likes.size, reactions.dislikes.size],
  );

  const monthList = fruitsForMonth(month);

  return (
    <section className="mt-2 space-y-4" data-testid="fruit-panel">
      <header>
        <h2 className="font-display text-[1.7rem] tracking-tight">
          <Apple className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          今天水果吃什么
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          按当月时令 · 替你决定一种特别推荐 + 备选 · 含大致热量、糖、营养与提示
        </p>
      </header>

      {/* 月份 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-[1.05rem] tracking-tight">月份 · 默认当前 {today.getMonth() + 1} 月</h3>
          <label className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <input
              type="checkbox"
              checked={seasonalOnly}
              onChange={(e) => setSeasonalOnly(e.target.checked)}
              className="accent-primary"
            />
            只看应季
          </label>
        </div>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12" data-testid="fruit-months">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
            const active = m === month;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMonth(m)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-1.5 text-[12.5px] num transition-colors ${
                  active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
                }`}
                data-testid={`fruit-month-${m}`}
              >
                {m}月
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          当月（{month}月）应季约 <span className="num text-primary">{monthList.length}</span> 种
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => {
            const active = audiences.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                onClick={() =>
                  setAudiences((p) => (p.includes(a.id) ? p.filter((x) => x !== a.id) : [...p, a.id]))
                }
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12.5px] transition-colors hover-elevate active-elevate-2 ${
                  active ? "border-primary/50 bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80"
                }`}
                data-testid={`fruit-aud-${a.id}`}
              >
                <span aria-hidden>{a.emoji}</span>
                {a.label}
              </button>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            className="ml-auto h-8 rounded-full text-[12px]"
            data-testid="fruit-refresh"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 换一批
          </Button>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-[12.5px] text-primary/80" data-testid="fruit-decision">
          {result.decisionLine}
        </p>
        <FruitCard fruit={result.special} special />
      </div>

      {result.highlights.length > 0 && (
        <div data-testid="fruit-highlights">
          <h3 className="mb-2 font-display text-[1.05rem] tracking-tight">
            <Sparkles className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
            {month} 月必吃
            <span className="ml-2 text-[11.5px] text-muted-foreground">
              · 编辑精选时令清单
            </span>
          </h3>
          <div
            className="-mx-1 flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-1 pb-1"
            data-testid="fruit-highlights-row"
          >
            {result.highlights.map((f) => (
              <span
                key={f.id}
                className="inline-flex shrink-0 snap-start items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[12px] text-foreground/85"
                data-testid={`fruit-highlight-${f.id}`}
              >
                <span aria-hidden>{f.emoji}</span>
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-display text-[1.05rem] tracking-tight">备选 / 应季其它选择</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.alternatives.map((f) => (
            <FruitCard key={f.id} fruit={f} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        全库 {FRUITS.length} 种水果 · 月份是粗略当令窗口（南北差异大） · 数值为大致参考 · 不构成医疗建议
      </p>
    </section>
  );
}
