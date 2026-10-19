// F2 — 冰箱有啥 主面板
// 用户记录现有食材 → 计算菜谱命中率 → 三档分组展示
// 与家庭兼容评分、个人 likes/dislikes 协同（家庭 active 时降权冲突菜）

import { useEffect, useMemo, useState } from "react";
import {
  Refrigerator,
  Plus,
  X,
  ChefHat,
  Search,
  Sparkles,
  Trash2,
  Copy,
  Clock,
  ChevronRight,
  ShoppingBasket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  type FridgeItem,
  type FridgeQuantity,
  QUANTITY_LABEL,
  FRIDGE_PRESETS,
  listFridge,
  addFridgeItem,
  removeFridgeItem,
  updateFridgeItem,
  clearFridge,
  subscribeFridge,
  rankByFridge,
  groupByBucket,
  missingToShoppingText,
} from "@/lib/fridge";
import { addShoppingItems } from "@/lib/shoppingList";
import { ShoppingCart } from "lucide-react";
import { RECIPES, type Recipe } from "@/data/recipes";
import { listMembers, evaluateFamilyMatch } from "@/lib/familyMembers";
import { loadReactions, subscribeReactions } from "@/lib/reactions";

interface FridgePanelProps {
  onPickRecipe?: (recipe: Recipe) => void;
}

export function FridgePanel({ onPickRecipe }: FridgePanelProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<FridgeItem[]>(() => listFridge());
  const [members, setMembers] = useState(() => listMembers());
  const [reactions, setReactions] = useState(() => loadReactions());
  const [input, setInput] = useState("");

  useEffect(() => {
    const u1 = subscribeFridge(() => setItems(listFridge()));
    // 简易订阅：在家庭面板会触发 fanda:family event；为兼容也用 storage 监听
    const handler = () => setMembers(listMembers());
    if (typeof window !== "undefined") {
      window.addEventListener("fanda:family", handler);
    }
    const u3 = subscribeReactions(() => setReactions(loadReactions()));
    return () => {
      u1();
      u3();
      if (typeof window !== "undefined") window.removeEventListener("fanda:family", handler);
    };
  }, []);

  function handleAdd(label: string, qty: FridgeQuantity = "one") {
    const item = addFridgeItem(label, qty);
    if (item) toast({ title: "已加入冰箱", description: `${item.normalized}（${QUANTITY_LABEL[qty]}）` });
  }

  function handleSubmitInput() {
    const v = input.trim();
    if (!v) return;
    handleAdd(v);
    setInput("");
  }

  // 计算推荐
  const ranked = useMemo(() => {
    const pool = RECIPES.filter((r) => r.course === "main" || r.course === "veggie" || r.course === "soup" || r.course === "staple");
    const liked = new Set<string>();
    reactions.likes.forEach((k) => {
      if (k.startsWith("dish:")) liked.add(k.slice(5));
    });
    const disliked = new Set<string>();
    reactions.dislikes.forEach((k) => {
      if (k.startsWith("dish:")) disliked.add(k.slice(5));
    });
    const familyActive = members.filter((m) => m.active);
    return rankByFridge(pool, items, {
      limit: 60,
      bonus: (r) => {
        let b = 0;
        if (liked.has(r.id)) b += 8;
        if (disliked.has(r.id)) b -= 18;
        if (familyActive.length > 0) {
          const fm = evaluateFamilyMatch(r, familyActive);
          if (fm.level === "green") b += 6;
          else if (fm.level === "red") b -= 25;
        }
        return b;
      },
      exclude: (r) => {
        // 如有家庭硬过敏，强制过滤
        if (familyActive.length === 0) return false;
        const fm = evaluateFamilyMatch(r, familyActive);
        return fm.level === "red";
      },
    });
  }, [items, members, reactions]);

  const groups = groupByBucket(ranked);

  function copyMissing(missing: string[], recipeName: string) {
    const text = missingToShoppingText(missing, recipeName);
    if (!text) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => toast({ title: "已复制", description: text }),
        () => toast({ title: "复制失败", description: "请手动选择文本" }),
      );
    } else {
      toast({ title: "缺少食材", description: text });
    }
  }

  function addMissingToShopping(missing: string[], recipeName: string) {
    if (missing.length === 0) return;
    const r = addShoppingItems(
      missing.map((m) => ({ name: m, source: "fridge", note: recipeName })),
    );
    const desc =
      r.added > 0 && r.merged > 0
        ? `新增 ${r.added} 项 · 合并 ${r.merged} 项`
        : r.merged > 0
          ? `合并 ${r.merged} 项到已有清单`
          : `已加入 ${r.added} 项`;
    toast({ title: "已加入购物清单 ✓", description: desc });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.45rem] tracking-tight">
            <Refrigerator className="mr-1 inline h-5 w-5 text-primary" /> 冰箱有啥
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            告诉我们冰箱里有什么，我们告诉你能做什么、还差几样。
          </p>
        </div>
        {items.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("清空整个冰箱？")) clearFridge();
            }}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> 清空
          </Button>
        )}
      </header>

      {/* 输入区 */}
      <section>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmitInput();
              }
            }}
            placeholder="输入食材，例如 鸡蛋 / 半根胡萝卜"
            data-testid="input-fridge-add"
          />
          <Button onClick={handleSubmitInput} data-testid="btn-fridge-add">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {FRIDGE_PRESETS.map((g) => (
            <div key={g.group}>
              <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">{g.group}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((it) => {
                  const has = items.some((x) => x.normalized === it.label);
                  return (
                    <button
                      key={it.label}
                      type="button"
                      onClick={() => handleAdd(it.label)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] hover-elevate active-elevate-2 ${
                        has ? "border-primary bg-primary/10 text-primary" : ""
                      }`}
                      data-testid={`chip-fridge-add-${it.label}`}
                    >
                      <span>{it.emoji}</span>
                      <span>{it.label}</span>
                      {has && <span className="ml-0.5 text-[10px]">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 当前库存 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-[1.05rem]">当前库存（{items.length} 项）</h2>
        </div>
        {items.length === 0 ? (
          <Card className="px-4 py-8 text-center text-[13px] text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-5 w-5" />
            还没添加。先点上面的快捷标签或者输入。
          </Card>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {items.map((it) => (
              <span
                key={it.id}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[12px]"
                data-testid={`fridge-item-${it.normalized}`}
              >
                <span className="font-medium">{it.normalized}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const order: FridgeQuantity[] = ["trace", "half", "one", "plenty"];
                    const idx = order.indexOf(it.quantity);
                    const next = order[(idx + 1) % order.length];
                    updateFridgeItem(it.id, { quantity: next });
                  }}
                  title="切换数量"
                >
                  {QUANTITY_LABEL[it.quantity]}
                </button>
                <button
                  type="button"
                  onClick={() => removeFridgeItem(it.id)}
                  aria-label={`移除 ${it.normalized}`}
                  className="text-muted-foreground hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* 推荐结果 */}
      {items.length > 0 && (
        <>
          {groups.now.length > 0 && (
            <RecipeBucket
              title="✅ 现在就能做"
              hint="冰箱够了"
              tone="green"
              items={groups.now}
              onPick={(r) => onPickRecipe?.(r)}
              onCopy={copyMissing}
              onAddToShopping={addMissingToShopping}
            />
          )}
          {groups.soon.length > 0 && (
            <RecipeBucket
              title="🛒 再买一两样"
              hint="补点东西就好"
              tone="amber"
              items={groups.soon}
              onPick={(r) => onPickRecipe?.(r)}
              onCopy={copyMissing}
              onAddToShopping={addMissingToShopping}
            />
          )}
          {groups.later.length > 0 && (
            <RecipeBucket
              title="📋 差得有点多"
              hint="留着以后做"
              tone="gray"
              items={groups.later.slice(0, 8)}
              onPick={(r) => onPickRecipe?.(r)}
              onCopy={copyMissing}
              onAddToShopping={addMissingToShopping}
              defaultCollapsed
            />
          )}
        </>
      )}

      <p className="text-[11px] text-muted-foreground/80">
        ⚠️ 命中率仅按食材关键字匹配，调味料默认认为家中有；剩菜量描述（少许/半份）不影响命中，仅作展示。
      </p>
    </div>
  );
}

interface RecipeBucketProps {
  title: string;
  hint: string;
  tone: "green" | "amber" | "gray";
  items: ReturnType<typeof rankByFridge>;
  onPick: (r: Recipe) => void;
  onCopy: (missing: string[], recipeName: string) => void;
  onAddToShopping?: (missing: string[], recipeName: string) => void;
  defaultCollapsed?: boolean;
}

function RecipeBucket({ title, hint, tone, items, onPick, onCopy, onAddToShopping, defaultCollapsed }: RecipeBucketProps) {
  const [collapsed, setCollapsed] = useState(!!defaultCollapsed);
  const toneCard = tone === "green" ? "border-emerald-200" : tone === "amber" ? "border-amber-200" : "border-border";
  const toneText = tone === "green" ? "text-emerald-700" : tone === "amber" ? "text-amber-700" : "text-muted-foreground";

  return (
    <section>
      <button
        type="button"
        className="mb-2 flex w-full items-baseline justify-between"
        onClick={() => setCollapsed((v) => !v)}
      >
        <h2 className={`font-display text-[1.05rem] ${toneText}`}>{title} ({items.length})</h2>
        <span className="text-[11.5px] text-muted-foreground">{collapsed ? "展开" : hint}</span>
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.recipe.id} className={`overflow-hidden border ${toneCard}`}>
              <button
                type="button"
                onClick={() => onPick(it.recipe)}
                className="block w-full px-4 py-3 text-left hover-elevate active-elevate-2"
                data-testid={`fridge-recipe-${it.recipe.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{it.recipe.name}</span>
                      <Badge variant="outline" className="text-[10px]">{it.recipe.cuisine}</Badge>
                      <span className="text-[11px] text-muted-foreground"><Clock className="mr-0.5 inline h-3 w-3" />{it.recipe.timeMinutes}min</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={Math.round(it.match.score * 100)} className="h-1.5 flex-1" />
                      <span className="text-[11px] font-medium">{Math.round(it.match.score * 100)}%</span>
                    </div>
                    <div className="mt-1 text-[11.5px] text-muted-foreground">{it.match.reason}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
              {it.match.missing.length > 0 && (
                <div className="flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-1.5">
                  <div className="flex flex-wrap gap-1 text-[11px]">
                    {it.match.missing.slice(0, 5).map((m) => (
                      <span key={m} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700">{m}</span>
                    ))}
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    {onAddToShopping && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToShopping(it.match.missing, it.recipe.name);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10.5px] font-medium text-primary hover-elevate active-elevate-2"
                        data-testid={`btn-add-shopping-${it.recipe.id}`}
                      >
                        <ShoppingCart className="h-3 w-3" />
                        加入清单
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(it.match.missing, it.recipe.name);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] hover-elevate active-elevate-2"
                      data-testid={`btn-copy-missing-${it.recipe.id}`}
                    >
                      <Copy className="h-3 w-3" />
                      复制
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
