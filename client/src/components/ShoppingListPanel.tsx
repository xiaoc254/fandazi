// 「统一购物清单」主面板（#/shopping）
// 把家庭饭/冰箱缺料/剩菜改造/一周菜单/手动等多个来源沉淀的食材集中展示，
// 按分类分组，可勾选 / 删除 / 手动添加 / 一键复制 / 清空已完成。

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  ClipboardCopy,
  Check,
  CheckCircle2,
  CalendarDays,
  Refrigerator,
  Repeat,
  Sparkles,
  ChevronRight,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  type ShoppingItem,
  type ShoppingCategory,
  CATEGORY_ORDER,
  CATEGORY_EMOJI,
  SOURCE_LABEL,
  useShoppingList,
  addShoppingItem,
  removeShoppingItem,
  toggleShoppingItem,
  clearCheckedShoppingItems,
  clearAllShoppingItems,
  groupByCategory,
  shoppingListToText,
  shoppingStats,
  inferCategory,
} from "@/lib/shoppingList";

const QUICK_ADDS: { label: string; emoji: string; category: ShoppingCategory }[] = [
  { label: "鸡蛋", emoji: "🥚", category: "肉蛋奶" },
  { label: "牛奶", emoji: "🥛", category: "肉蛋奶" },
  { label: "鸡胸肉", emoji: "🍗", category: "肉蛋奶" },
  { label: "猪肉", emoji: "🐖", category: "肉蛋奶" },
  { label: "番茄", emoji: "🍅", category: "蔬菜" },
  { label: "土豆", emoji: "🥔", category: "蔬菜" },
  { label: "青菜", emoji: "🥬", category: "蔬菜" },
  { label: "胡萝卜", emoji: "🥕", category: "蔬菜" },
  { label: "苹果", emoji: "🍎", category: "水果" },
  { label: "香蕉", emoji: "🍌", category: "水果" },
  { label: "豆腐", emoji: "🧈", category: "主食豆制品" },
  { label: "米饭", emoji: "🍚", category: "主食豆制品" },
];

export function ShoppingListPanel() {
  const { toast } = useToast();
  const items = useShoppingList();
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState<string | null>(null);

  const stats = shoppingStats(items);
  const groups = useMemo(() => groupByCategory(items), [items]);

  function go(hash: string) {
    if (typeof window !== "undefined") window.location.hash = hash;
  }

  function handleManualAdd(name: string, category?: ShoppingCategory) {
    const v = (name || "").trim();
    if (!v) return;
    const r = addShoppingItem({ name: v, source: "manual", category });
    if (r.merged) {
      toast({ title: "已合并到购物清单", description: `${r.item.name} · 来源已更新` });
    } else {
      toast({ title: "已加入购物清单", description: r.item.name });
    }
  }

  function handleSubmit() {
    const v = input.trim();
    if (!v) return;
    handleManualAdd(v);
    setInput("");
  }

  async function handleCopy() {
    const text = shoppingListToText(items);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setFallback(null);
        toast({ title: "已复制清单 ✓", description: "可以发到家庭群或备忘录" });
        setTimeout(() => setCopied(false), 1800);
        return;
      }
      throw new Error("no-clipboard");
    } catch {
      setFallback(text);
      setCopied(false);
      toast({
        title: "无法自动复制",
        description: "下方已展示清单文本，请长按全选手动复制。",
      });
    }
  }

  function handleClearChecked() {
    const removed = clearCheckedShoppingItems();
    if (removed === 0) {
      toast({ title: "没有已完成的项目", description: "勾选后再来清理" });
    } else {
      toast({ title: `已清理 ${removed} 项已完成`, description: "保留剩余还没买的食材" });
    }
  }

  function handleClearAll() {
    if (items.length === 0) return;
    if (typeof window !== "undefined" && !window.confirm("清空整个购物清单？此操作不可恢复。")) return;
    clearAllShoppingItems();
    toast({ title: "购物清单已清空" });
  }

  return (
    <section className="mt-2 space-y-4" data-testid="shopping-panel">
      {/* Hero */}
      <div
        className="relative overflow-hidden rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-5 py-5 sm:px-7 sm:py-6"
        data-testid="shopping-hero"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-white/70 to-white/20 blur-2xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-emerald-700/85">
            <ShoppingCart className="h-3 w-3" />
            统一购物清单
          </p>
          <h2 className="mt-2 font-display text-[1.55rem] leading-tight tracking-tight text-foreground sm:text-[1.85rem]">
            家庭饭 · 冰箱缺料 · 一周菜单 · 都汇到这里
          </h2>
          <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-foreground/75 sm:text-[13.5px]">
            勾掉已经买好的，清单就只剩还没买的；同名食材自动合并，不会出现两遍番茄。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-foreground/80" data-testid="shopping-stats">
            <span className="num inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1">
              共 <strong className="text-foreground">{stats.total}</strong> 项
            </span>
            <span className="num inline-flex items-center gap-1 rounded-full bg-emerald-100/80 px-2.5 py-1 text-emerald-700">
              已买 <strong>{stats.checked}</strong>
            </span>
            <span className="num inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-amber-700">
              剩 <strong>{stats.remaining}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 输入区 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5" data-testid="shopping-input-card">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="手动添加食材，例如 西兰花 / 一斤排骨"
            data-testid="shopping-input"
          />
          <Button onClick={handleSubmit} data-testid="shopping-add">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">常用快加</div>
          <div className="flex flex-wrap gap-1.5" data-testid="shopping-quick-adds">
            {QUICK_ADDS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => handleManualAdd(q.label, q.category)}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-[12px] hover-elevate active-elevate-2"
                data-testid={`shopping-quick-${q.label}`}
              >
                <span aria-hidden>{q.emoji}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleCopy}
            data-testid="shopping-copy"
            className="rounded-full"
          >
            {copied ? (
              <>
                <Check className="mr-1 h-3.5 w-3.5" />
                已复制
              </>
            ) : (
              <>
                <ClipboardCopy className="mr-1 h-3.5 w-3.5" />
                一键复制清单
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClearChecked}
            data-testid="shopping-clear-checked"
            className="rounded-full"
          >
            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
            清理已买
          </Button>
          {items.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAll}
              data-testid="shopping-clear-all"
              className="rounded-full text-rose-700 hover:text-rose-700"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              清空全部
            </Button>
          )}
        </div>

        {fallback && (
          <div
            className="mt-3 rounded-xl border border-amber-300/70 bg-amber-50/60 p-3 text-[12px]"
            data-testid="shopping-copy-fallback"
          >
            <p className="mb-1 inline-flex items-center gap-1 text-amber-800">
              <ClipboardCopy className="h-3.5 w-3.5" />
              浏览器拒绝了自动复制 — 请长按下面的文本全选手动复制：
            </p>
            <textarea
              readOnly
              value={fallback}
              className="h-44 w-full resize-none rounded-md border border-amber-300/60 bg-white/80 p-2 font-mono text-[11.5px] leading-relaxed text-foreground"
              data-testid="shopping-copy-fallback-text"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => setFallback(null)}
              className="mt-1 text-[11px] text-amber-700 underline-offset-2 hover:underline"
              data-testid="shopping-copy-fallback-close"
            >
              收起
            </button>
          </div>
        )}
      </Card>

      {/* 清单内容 */}
      {items.length === 0 ? (
        <Card className="grain border-card-border/60 bg-card/70 p-6 text-center" data-testid="shopping-empty">
          <ShoppingCart className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-[14px] font-medium text-foreground/85">购物清单还是空的</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            到「家庭今晚饭 / 冰箱有啥 / 剩菜变花样 / 一周菜单」一键加入缺料，或上方手动添加。
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <SourceJump testId="shopping-empty-family" icon={<Users className="h-4 w-4" />} label="家庭今晚饭" hint="一桌菜" onClick={() => go("#/family-tonight")} />
            <SourceJump testId="shopping-empty-fridge" icon={<Refrigerator className="h-4 w-4" />} label="冰箱有啥" hint="缺什么" onClick={() => go("#/fridge")} />
            <SourceJump testId="shopping-empty-leftover" icon={<Repeat className="h-4 w-4" />} label="剩菜变花样" hint="再补一两样" onClick={() => go("#/leftover")} />
            <SourceJump testId="shopping-empty-weekly" icon={<CalendarDays className="h-4 w-4" />} label="一周菜单" hint="买菜清单" onClick={() => go("#/weekly")} />
          </div>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="shopping-groups">
          {groups.map((g) => (
            <CategorySection key={g.category} category={g.category} items={g.items} />
          ))}
        </div>
      )}

      {/* 入口跳转 */}
      <Card className="grain border-card-border/60 bg-card/70 p-4" data-testid="shopping-deep-links">
        <p className="mb-2 text-[12.5px] font-medium text-foreground/85">从这里继续：</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SourceJump testId="shopping-link-family" icon={<Users className="h-4 w-4" />} label="家庭今晚饭" hint="一键加入缺料" onClick={() => go("#/family-tonight")} />
          <SourceJump testId="shopping-link-fridge" icon={<Refrigerator className="h-4 w-4" />} label="冰箱有啥" hint="补充库存" onClick={() => go("#/fridge")} />
          <SourceJump testId="shopping-link-leftover" icon={<Repeat className="h-4 w-4" />} label="剩菜变花样" hint="变形缺料" onClick={() => go("#/leftover")} />
          <SourceJump testId="shopping-link-weekly" icon={<CalendarDays className="h-4 w-4" />} label="一周菜单" hint="同步周清单" onClick={() => go("#/weekly")} />
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground/80">
        ⚠️ 仅本地清单聚合，不接外部买菜平台 API；不做真实价格实时比价。
      </p>
    </section>
  );
}

function CategorySection({ category, items }: { category: ShoppingCategory; items: ShoppingItem[] }) {
  const remain = items.filter((it) => !it.checked).length;
  return (
    <Card className="grain border-card-border/60 bg-card/70 p-4" data-testid={`shopping-category-${category}`}>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-display text-[1.05rem] tracking-tight">
          <span aria-hidden className="mr-1 text-base">{CATEGORY_EMOJI[category]}</span>
          {category}
        </h3>
        <span className="text-[11.5px] text-muted-foreground num">
          {items.length} 项 · 剩 {remain}
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <ShoppingRow key={it.id} item={it} />
        ))}
      </ul>
    </Card>
  );
}

function ShoppingRow({ item }: { item: ShoppingItem }) {
  const sourceText = item.sources.map((s) => SOURCE_LABEL[s]).join(" · ");
  return (
    <li
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 transition-colors ${
        item.checked
          ? "border-border/40 bg-muted/40 text-muted-foreground"
          : "border-border/60 bg-background/70"
      }`}
      data-testid={`shopping-item-${item.name}`}
    >
      <button
        type="button"
        onClick={() => toggleShoppingItem(item.id)}
        aria-label={item.checked ? `取消勾选 ${item.rawName}` : `勾选 ${item.rawName}`}
        data-testid={`shopping-toggle-${item.name}`}
        className={`mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors hover-elevate active-elevate-2 ${
          item.checked
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-border bg-background"
        }`}
      >
        {item.checked && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span
            className={`text-[14.5px] font-semibold tracking-tight ${
              item.checked ? "line-through" : ""
            }`}
          >
            {item.rawName || item.name}
          </span>
          {item.amount && (
            <span className="text-[11.5px] text-muted-foreground">{item.amount}</span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10.5px]">
          <Badge
            variant="outline"
            className="rounded-full border-border/60 bg-background/60 px-1.5 py-0 text-[10px]"
          >
            {sourceText}
          </Badge>
          {item.note && (
            <span className="text-muted-foreground/85">· {item.note}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => removeShoppingItem(item.id)}
        aria-label={`删除 ${item.rawName}`}
        data-testid={`shopping-remove-${item.name}`}
        className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-rose-600 hover-elevate active-elevate-2"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function SourceJump({
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
