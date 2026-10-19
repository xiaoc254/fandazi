// F3 — 剩菜变花样 主面板
// 输入剩菜（快捷选 / 自由输入）+ 剩余量 → 给出变形方案 + 步骤 + 缺什么
// 与冰箱联动：标注「冰箱已有」/「还要买」

import { useEffect, useMemo, useState } from "react";
import {
  Repeat,
  Sparkles,
  Search,
  Clock,
  Check,
  ChevronRight,
  Copy,
  ChefHat,
  ListChecks,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  type LeftoverQuantity,
  LEFTOVER_QTY_LABEL,
  findRemixes,
  recordLeftover,
  remixMissingToShoppingText,
  type RemixWithFridgeInfo,
} from "@/lib/leftoverRemix";
import { COMMON_LEFTOVER_PRESETS } from "@/data/leftoverRules";
import { listFridge, subscribeFridge } from "@/lib/fridge";
import { addShoppingItems } from "@/lib/shoppingList";

const QTY_OPTIONS: LeftoverQuantity[] = ["small", "half", "most"];

export function LeftoverPanel() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<LeftoverQuantity>("half");
  const [submitted, setSubmitted] = useState<{ name: string; qty: LeftoverQuantity } | null>(null);
  const [fridge, setFridge] = useState(() => listFridge());

  useEffect(() => {
    const u = subscribeFridge(() => setFridge(listFridge()));
    return u;
  }, []);

  const remixes = useMemo<RemixWithFridgeInfo[]>(() => {
    if (!submitted) return [];
    return findRemixes(submitted.name, { quantity: submitted.qty, fridge });
  }, [submitted, fridge]);

  function go(target: string, qty: LeftoverQuantity = quantity) {
    const trimmed = target.trim();
    if (!trimmed) return;
    setSubmitted({ name: trimmed, qty });
    recordLeftover(trimmed, qty);
  }

  function copy(remix: RemixWithFridgeInfo) {
    const txt = remixMissingToShoppingText(remix);
    if (!txt) {
      toast({ title: "不缺东西", description: "冰箱里已经够了" });
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(txt).then(
        () => toast({ title: "已复制", description: txt }),
        () => toast({ title: "复制失败", description: "请手动选择文本" }),
      );
    } else {
      toast({ title: "缺少食材", description: txt });
    }
  }

  function addToShopping(remix: RemixWithFridgeInfo) {
    if (remix.fridgeMissing.length === 0) {
      toast({ title: "不缺东西", description: "冰箱里已经够了" });
      return;
    }
    const r = addShoppingItems(
      remix.fridgeMissing.map((m) => ({
        name: m,
        source: "leftover",
        note: `${remix.title}`,
      })),
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
      <header>
        <h1 className="font-display text-[1.45rem] tracking-tight">
          <Repeat className="mr-1 inline h-5 w-5 text-primary" /> 剩菜变花样
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          告诉我们昨天剩了啥，我们告诉你今天怎么变花样不浪费。
        </p>
      </header>

      <Card className="space-y-3 px-4 py-4">
        <div>
          <label className="text-[12px] font-medium text-muted-foreground">什么菜剩了？</label>
          <div className="mt-1 flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如 红烧肉、剩米饭、炒青菜"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  go(name);
                }
              }}
              data-testid="input-leftover-name"
            />
            <Button onClick={() => go(name)} data-testid="btn-leftover-go">
              <Search className="mr-1 h-3.5 w-3.5" /> 看看能变啥
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">常见剩菜快选</div>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_LEFTOVER_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => {
                  setName(p.label);
                  go(p.label);
                }}
                className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-1 text-[12px] hover-elevate active-elevate-2"
                data-testid={`chip-leftover-${p.label}`}
              >
                <span>{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1 text-[11.5px] font-medium text-muted-foreground">剩了多少？</div>
          <div className="flex flex-wrap gap-1.5">
            {QTY_OPTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuantity(q)}
                className={`rounded-full border px-3 py-1 text-[12px] hover-elevate active-elevate-2 ${
                  quantity === q ? "border-primary bg-primary/10 text-primary" : ""
                }`}
                data-testid={`chip-leftover-qty-${q}`}
              >
                {LEFTOVER_QTY_LABEL[q]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 结果区 */}
      {submitted && (
        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-display text-[1.05rem]">
              <Sparkles className="mr-1 inline h-4 w-4 text-primary" />
              {submitted.name} · {LEFTOVER_QTY_LABEL[submitted.qty]} → 这样变
            </h2>
            <span className="text-[11.5px] text-muted-foreground">{remixes.length} 个方案</span>
          </div>
          <div className="space-y-2">
            {remixes.length === 0 ? (
              <Card className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                没找到方案。试试把剩菜名换成更通用的词，比如 红烧肉 / 剩米饭。
              </Card>
            ) : (
              remixes.map((r) => (
                <RemixCard
                  key={r.id}
                  remix={r}
                  onCopy={() => copy(r)}
                  onAddToShopping={() => addToShopping(r)}
                />
              ))
            )}
          </div>
        </section>
      )}

      {!submitted && (
        <Card className="px-4 py-6 text-center text-[13px] text-muted-foreground">
          <ChefHat className="mx-auto mb-2 h-5 w-5" />
          选一个常见剩菜或自己输入，我们给 2-5 种「变花样」方案。<br />
          已覆盖 30+ 类剩菜：红烧肉 / 鸡 / 鱼 / 米饭 / 面 / 饺子 / 火锅 / 炒菜……
        </Card>
      )}

      <p className="text-[11px] text-muted-foreground/80">
        ⚠️ 推荐做法仅供参考，剩菜请确认未变质后再食用，建议 24-48 小时内吃完。
      </p>
    </div>
  );
}

interface RemixCardProps {
  remix: RemixWithFridgeInfo;
  onCopy: () => void;
  onAddToShopping: () => void;
}

function RemixCard({ remix, onCopy, onAddToShopping }: RemixCardProps) {
  const [open, setOpen] = useState(false);
  const diffLabel = remix.difficulty === "easy" ? "超简单" : remix.difficulty === "medium" ? "家常" : "有点费工";
  return (
    <Card className="overflow-hidden border" data-testid={`remix-card-${remix.id}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="block w-full px-4 py-3 text-left hover-elevate active-elevate-2"
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-semibold">{remix.title}</span>
              <Badge variant="outline" className="text-[10px]">{diffLabel}</Badge>
              <span className="text-[11px] text-muted-foreground">
                <Clock className="mr-0.5 inline h-3 w-3" />+{remix.extraMinutes}min
              </span>
              {remix.tags.slice(0, 2).map((t) => (
                <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-secondary-foreground">{t}</span>
              ))}
            </div>
            <div className="mt-0.5 text-[12.5px] text-muted-foreground">{remix.description}</div>
            {(remix.fridgeAvailable.length > 0 || remix.fridgeMissing.length > 0) && (
              <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                {remix.fridgeAvailable.map((a) => (
                  <span key={`a-${a}`} className="inline-flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700">
                    <Check className="h-3 w-3" />冰箱有·{a}
                  </span>
                ))}
                {remix.fridgeMissing.map((m) => (
                  <span key={`m-${m}`} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700">还要·{m}</span>
                ))}
              </div>
            )}
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="border-t bg-card/50 px-4 py-3">
          {remix.additionalIngredients.length > 0 && (
            <div className="mb-2">
              <div className="text-[11px] font-medium text-muted-foreground">需要</div>
              <div className="mt-1 flex flex-wrap gap-1 text-[12px]">
                {remix.additionalIngredients.map((i, idx) => (
                  <span key={`${i.name}-${idx}`} className="rounded border bg-card px-1.5 py-0.5">
                    {i.name}{i.optional ? "（可选）" : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">做法（{remix.steps.length} 步）</div>
            <ol className="mt-1 space-y-1 text-[12.5px] leading-relaxed">
              {remix.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
          {remix.fridgeMissing.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-end gap-1.5">
              <button
                type="button"
                onClick={onAddToShopping}
                className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary hover-elevate active-elevate-2"
                data-testid={`btn-add-shopping-remix-${remix.id}`}
              >
                <ShoppingCart className="h-3 w-3" />
                加入购物清单
              </button>
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] hover-elevate active-elevate-2"
                data-testid={`btn-copy-remix-${remix.id}`}
              >
                <Copy className="h-3 w-3" />
                复制
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
