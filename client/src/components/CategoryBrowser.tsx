// 门类浏览器：按 category 分组展示「甜品 / 饮品 / 小吃 / 早餐 / 烘焙 / 轻食 / 下午茶 / 夜宵」
// 这些菜不会进入主推荐（main/veggie/soup/staple），但可以在这里被发现。
//
// 默认状态：显示「全部」概览（每个类别 4 道菜），让用户一眼看到所有门类，
// 而不是只看到「甜品」一类。再点单独 Tab 才看完整列表。
import { useMemo, useState } from "react";
import { ChefHat, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { DishImage } from "@/components/DishImage";
import { dishVisual } from "@/lib/dishVisual";
import { ALL_CATEGORIES, RECIPES, type Category, type Recipe } from "@/data/recipes";

const CATEGORY_META: Record<Category, { emoji: string; description: string }> = {
  甜品: { emoji: "🍰", description: "糖水、奶冻、糕饼、果冻" },
  饮品: { emoji: "🥤", description: "茶饮、特调、咖啡、果汁" },
  小吃: { emoji: "🥟", description: "肉夹馍、煎饺、春卷、街头味" },
  早餐: { emoji: "🌅", description: "包子、烧饼、肠粉、煎饼" },
  夜宵: { emoji: "🌙", description: "麻辣烫、烤串、大排档" },
  烘焙: { emoji: "🧁", description: "蛋糕、饼干、塔派、月饼" },
  轻食: { emoji: "🥗", description: "沙拉碗、坡奇、酸奶碗" },
  下午茶: { emoji: "☕", description: "马芬、司康、磅蛋糕" },
};

interface Props {
  onPickRecipe: (r: Recipe) => void;
}

type Selection = "all" | Category;

export function CategoryBrowser({ onPickRecipe }: Props) {
  // 默认 "all"：让用户一眼看到所有门类的样品，避免「点进来只看见甜品」。
  const [selected, setSelected] = useState<Selection>("all");

  const grouped = useMemo(() => {
    const m: Record<Category, Recipe[]> = {} as any;
    for (const c of ALL_CATEGORIES) m[c] = [];
    for (const r of RECIPES) {
      if (r.category && m[r.category]) m[r.category].push(r);
    }
    return m;
  }, []);

  const totalCount = useMemo(
    () => Object.values(grouped).reduce((a, b) => a + b.length, 0),
    [grouped],
  );
  const list = selected === "all" ? [] : grouped[selected] ?? [];

  return (
    <section
      id="category-browser-section"
      className="mt-10 scroll-mt-20"
      data-testid="section-category-browser"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.55rem] tracking-tight">
            <ChefHat className="mb-1 mr-1 inline h-5 w-5 text-primary" />
            门类浏览
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            主推荐之外，{totalCount} 道甜品 / 饮品 / 小吃 / 烘焙等你挑 — 默认显示所有门类样品，
            点门类按钮看完整列表。
          </p>
        </div>
      </div>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        {/* 门类 Tabs（醒目大版）：包含「全部」概览选项；按钮加粗加大。 */}
        <div className="mb-3 flex flex-wrap gap-2" data-testid="category-tabs">
          <button
            type="button"
            onClick={() => setSelected("all")}
            data-testid="category-tab-all"
            className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover-elevate active-elevate-2 ${
              selected === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background/60 text-foreground/80"
            }`}
          >
            <span aria-hidden>🍱</span>
            全部
            <span
              className={`rounded-full px-1.5 text-[10.5px] num ${
                selected === "all" ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
              }`}
            >
              {totalCount}
            </span>
          </button>
          {ALL_CATEGORIES.map((c) => {
            const active = selected === c;
            const count = grouped[c]?.length ?? 0;
            const meta = CATEGORY_META[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setSelected(c)}
                disabled={count === 0}
                data-testid={`category-tab-${c}`}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-[13.5px] font-semibold transition-colors hover-elevate active-elevate-2 ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background/60 text-foreground/80"
                } ${count === 0 ? "opacity-50" : ""}`}
              >
                <span aria-hidden>{meta.emoji}</span>
                {c}
                <span
                  className={`rounded-full px-1.5 text-[10.5px] num ${
                    active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {selected === "all" ? (
          // 「全部」概览模式：每个类别取前 4 道，明确展示门类丰富度
          <div className="space-y-5" data-testid="category-overview">
            {ALL_CATEGORIES.filter((c) => (grouped[c]?.length ?? 0) > 0).map((c) => {
              const meta = CATEGORY_META[c];
              const items = grouped[c]?.slice(0, 4) ?? [];
              return (
                <div key={c}>
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-[1.05rem] tracking-tight">
                      <span aria-hidden className="mr-1">
                        {meta.emoji}
                      </span>
                      {c}
                      <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                        {meta.description}
                      </span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[11.5px] text-primary hover-elevate active-elevate-2"
                      data-testid={`category-overview-more-${c}`}
                    >
                      共 {grouped[c].length} 道 →
                    </button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map((r) => {
                      const visual = dishVisual(r.name, r.course, r.cuisine);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onPickRecipe(r)}
                          data-testid={`category-recipe-${r.id}`}
                          className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                        >
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                            <DishImage visual={visual} alt={r.name} className="h-full w-full" name={r.name} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-display text-[14.5px] tracking-tight">{r.name}</h4>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground num">
                              <span>{r.timeMinutes} 分钟</span>
                              <span>·</span>
                              <span>{r.difficulty}</span>
                              <span>·</span>
                              <span>{r.cuisine}</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // 单类别模式：完整列表
          <>
            <p className="mb-3 text-[12px] text-muted-foreground" data-testid="category-desc">
              {CATEGORY_META[selected].description}
            </p>
            {list.length === 0 ? (
              <p className="py-4 text-center text-[12px] text-muted-foreground">这一类还没有菜谱。</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {list.slice(0, 12).map((r) => {
                  const visual = dishVisual(r.name, r.course, r.cuisine);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => onPickRecipe(r)}
                      data-testid={`category-recipe-${r.id}`}
                      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                        <DishImage visual={visual} alt={r.name} className="h-full w-full" name={r.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate font-display text-[14.5px] tracking-tight">{r.name}</h4>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground num">
                          <span>{r.timeMinutes} 分钟</span>
                          <span>·</span>
                          <span>{r.difficulty}</span>
                          <span>·</span>
                          <span>{r.cuisine}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                    </button>
                  );
                })}
              </div>
            )}
            {list.length > 12 && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                还有 {list.length - 12} 道{selected}没展示，可以收藏后到「我收藏的菜」查看。
              </p>
            )}
          </>
        )}
      </Card>
    </section>
  );
}
