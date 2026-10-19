// 「今天零食吃什么」：超市 / 便利店 / 美团闪购可买的常见零食饮料。
// 替你决定：根据「人群（减脂/控糖/儿童/长辈/运动后...）」给一个特别推荐 + 备选。
// 不做医疗建议；展示热量 / 糖 / 脂肪 / 蛋白 / 注意事项。

import { useMemo, useState } from "react";
import {
  Cookie,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  pickSnack,
  snackSearchLinks,
  SNACKS,
  type Snack,
  type SnackAudience,
  type SnackCategory,
} from "@/data/snacks";
import { ReactionButtons } from "./ReactionButtons";
import { useReactions } from "@/hooks/useReactions";

const AUDIENCE_OPTIONS: { id: SnackAudience; label: string; emoji: string }[] = [
  { id: "减脂", label: "减脂", emoji: "🏃" },
  { id: "控糖", label: "控糖", emoji: "🚫🍬" },
  { id: "增肌", label: "增肌", emoji: "💪" },
  { id: "儿童", label: "儿童", emoji: "🧒" },
  { id: "长辈", label: "长辈", emoji: "👴" },
  { id: "深夜", label: "深夜", emoji: "🌙" },
  { id: "学生党", label: "学生党", emoji: "🎒" },
  { id: "通勤", label: "通勤", emoji: "🚇" },
  { id: "解压", label: "解压", emoji: "😩" },
  { id: "朋友聚会", label: "朋友聚会", emoji: "🍻" },
];

// v6: 拆「巧克力糖果」「酸奶乳品」为更精确的子类目，避免 chip 文案误导
// 用户。例如 chip 写「酸奶」却出现旺仔牛奶；chip 写「巧克力」却出现核桃酥。
// 旧的合并标签（巧克力糖果 / 酸奶乳品）保留在类型 union 里，但不会出现在 chip 上，
// runtime normalize 会把它们重新映射到细分类目。
const CATEGORY_OPTIONS_ALL: SnackCategory[] = [
  "饮料", "无糖饮料", "薯片膨化", "饼干曲奇", "面包糕点",
  "巧克力", "糖果", "坚果", "酸奶", "牛奶乳饮", "蛋白零食",
  "肉脯肉干", "果干蜜饯", "速食冲泡", "冰品冰淇淋",
];

// v5: 只展示当前 SNACKS 池中真的有商品的分类。
// 空分类（normalize 后被搬空，例如「果干蜜饯」）不出现在 chip 列，避免点了之后
// 走 fallback 到全量池、和「严格筛选」语义不一致。
const SNACK_CATEGORY_COUNTS: Record<SnackCategory, number> = (() => {
  const m = {} as Record<SnackCategory, number>;
  for (const c of CATEGORY_OPTIONS_ALL) m[c] = 0;
  for (const s of SNACKS) m[s.category] = (m[s.category] ?? 0) + 1;
  return m;
})();
const CATEGORY_OPTIONS: SnackCategory[] = CATEGORY_OPTIONS_ALL.filter(
  (c) => SNACK_CATEGORY_COUNTS[c] > 0,
);

function SnackVisual({ snack }: { snack: Snack }) {
  const grad: [string, string] = (() => {
    const map: Record<SnackCategory, [string, string]> = {
      饮料: ["#ffadad", "#c45050"],
      无糖饮料: ["#a4cef0", "#3a78b6"],
      薯片膨化: ["#ffd180", "#c87f1c"],
      饼干曲奇: ["#f5cb88", "#a87434"],
      面包糕点: ["#fbd9ad", "#a87434"],
      巧克力: ["#a16744", "#5b3220"],
      糖果: ["#f7c6d8", "#b14976"],
      "巧克力糖果": ["#a16744", "#5b3220"],
      坚果: ["#bda37b", "#604b2c"],
      酸奶: ["#e9f0ff", "#7da6d3"],
      牛奶乳饮: ["#f5f0e1", "#b89a5e"],
      "酸奶乳品": ["#e9f0ff", "#7da6d3"],
      蛋白零食: ["#bce39a", "#5e9c45"],
      肉脯肉干: ["#c87a55", "#73381f"],
      果干蜜饯: ["#f4a045", "#a85a2c"],
      速食冲泡: ["#fbb273", "#c8552a"],
      冰品冰淇淋: ["#cfeaf6", "#65a4be"],
    };
    return map[snack.category] ?? ["#fbb273", "#c8552a"];
  })();
  const first = (snack.name || "").trim().charAt(0) || snack.emoji;
  return (
    <div
      className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl shadow-sm sm:h-[68px] sm:w-[68px]"
      style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})` }}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(circle at 30% 22%, rgba(255,255,255,0.42), transparent 60%)" }} />
      <span className="relative flex h-full w-full items-center justify-center font-display text-[1.85rem] font-semibold text-white drop-shadow-md">
        {first}
      </span>
      <span className="absolute right-1 top-1 text-[14px] drop-shadow">{snack.emoji}</span>
    </div>
  );
}

function NutrChip({ k, v }: { k: string; v?: number; }) {
  if (v === undefined) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-background/60 px-1.5 py-0 text-[10.5px] num text-muted-foreground">
      {k}{v}
    </span>
  );
}

function SnackCard({ snack, special }: { snack: Snack; special?: boolean }) {
  const links = snackSearchLinks(snack.name);
  return (
    <Card
      className={`grain p-3 ${
        special ? "border-primary/50 bg-primary/5" : "border-card-border/60 bg-card/70"
      }`}
      data-testid={`snack-card-${snack.id}`}
    >
      <div className="flex items-start gap-3">
        <SnackVisual snack={snack} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="truncate font-display text-[15.5px] tracking-tight">{snack.name}</h4>
            {special && (
              <Badge className="rounded-full bg-primary text-primary-foreground" data-testid="snack-special-badge">
                <Sparkles className="mr-0.5 h-3 w-3" /> 替你决定
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10.5px]">
              {snack.category}
            </Badge>
            <span className="num inline-flex items-center gap-0.5">
              <Flame className="h-3 w-3 text-primary/80" />
              {snack.calories} kcal
            </span>
            <NutrChip k="糖" v={snack.sugar} />
            <NutrChip k="脂" v={snack.fat} />
            <NutrChip k="蛋" v={snack.protein} />
            <span className="num">· {snack.price}</span>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/85">
            <Sparkles className="mr-1 inline h-3 w-3 text-primary/80" />
            {snack.reason}
          </p>
          {snack.caution && (
            <p className="mt-1 inline-flex items-start gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11.5px] text-amber-700">
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {snack.caution}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {snack.audiences.map((a) => (
              <Badge key={a} variant="secondary" className="rounded-full px-1.5 py-0 text-[10.5px]">
                {a}
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {links.map((l) => (
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
            <ReactionButtons kind="snack" id={snack.id} compact />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function SnacksPanel() {
  const [audiences, setAudiences] = useState<SnackAudience[]>([]);
  const [categories, setCategories] = useState<SnackCategory[]>([]);
  const [maxCal, setMaxCal] = useState<number | undefined>(undefined);
  const [nonce, setNonce] = useState(0);
  const reactions = useReactions("snack");

  const result = useMemo(
    () =>
      pickSnack({
        audiences,
        preferCategories: categories,
        maxCalories: maxCal,
        likedIds: reactions.likes,
        dislikedIds: reactions.dislikes,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [audiences, categories, maxCal, nonce, reactions.likes.size, reactions.dislikes.size],
  );

  return (
    <section className="mt-2 space-y-4" data-testid="snacks-panel">
      <header>
        <h2 className="font-display text-[1.7rem] tracking-tight">
          <Cookie className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          今天零食吃什么
        </h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          超市 / 便利店常见零食饮料 · 给「替你决定」 + 候选 · 含大致热量与提醒（非医疗建议）
        </p>
      </header>

      {/* 人群 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display text-[1.05rem] tracking-tight">为谁选 · 多选</h3>
          <span className="text-[11px] text-muted-foreground">点一下加 / 取消</span>
        </div>
        <div className="flex flex-wrap gap-1.5" data-testid="snack-audience-chips">
          {AUDIENCE_OPTIONS.map((a) => {
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
                data-testid={`snack-aud-${a.id}`}
              >
                <span aria-hidden>{a.emoji}</span>
                {a.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11.5px] text-muted-foreground">类别（可选）：</span>
          {CATEGORY_OPTIONS.map((c) => {
            const active = categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setCategories((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
                }
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors hover-elevate active-elevate-2 ${
                  active ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/80"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="text-muted-foreground">热量上限：</span>
          {[
            { v: undefined, label: "不限" },
            { v: 100, label: "≤100" },
            { v: 200, label: "≤200" },
            { v: 300, label: "≤300" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setMaxCal(opt.v)}
              className={`rounded-full border px-2.5 py-1 transition-colors ${
                maxCal === opt.v ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-card/60 text-foreground/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNonce((n) => n + 1)}
            className="ml-auto h-8 rounded-full text-[12px]"
            data-testid="snack-refresh"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> 换一批
          </Button>
        </div>
      </Card>

      {/* 替你决定 */}
      <div>
        <p className="mb-2 text-[12.5px] text-primary/80" data-testid="snack-decision">
          {result.decisionLine}
        </p>
        <SnackCard snack={result.special} special />
      </div>

      {/* 备选 */}
      <div>
        <h3 className="mb-2 font-display text-[1.05rem] tracking-tight">备选</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.alternatives.map((s) => (
            <SnackCard key={s.id} snack={s} />
          ))}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        共内置 {SNACKS.length} 条零食饮料数据 · 营养数值为大致区间，以包装信息为准 · 不构成医疗建议
      </p>
    </section>
  );
}
