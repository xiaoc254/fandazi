// v2: 今日已选浮窗 — 右下角可展开/折叠的小 dock。
// 显示：已选项目 / 估算价格 / 估算热量；可清空、可一键生成今日汇总文案。
// 使用 selectedToday 提供的本地态，无网络请求。

import { useMemo, useState } from "react";
import { Trash2, Sparkles, X, Wallet, Flame, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  removeSelected,
  clearSelected,
  useSelectedToday,
  type SelectedKind,
} from "@/lib/selectedToday";

const KIND_LABEL: Record<SelectedKind, string> = {
  dish: "菜",
  takeout: "外卖",
  snack: "零食",
  fruit: "水果",
  drink: "饮料",
  watch: "看",
  topic: "聊",
};

const KIND_EMOJI: Record<SelectedKind, string> = {
  dish: "🍳",
  takeout: "🛵",
  snack: "🍪",
  fruit: "🍎",
  drink: "🥤",
  watch: "📺",
  topic: "💬",
};

export function TodayDock() {
  const items = useSelectedToday();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const totals = useMemo(() => {
    let price = 0, calories = 0;
    for (const x of items) {
      if (x.price) price += x.price;
      if (x.calories) calories += x.calories;
    }
    return { price, calories, count: items.length };
  }, [items]);

  function summary(): string {
    if (items.length === 0) return "今日还没选东西";
    const grouped = items.reduce<Record<string, string[]>>((acc, x) => {
      const k = KIND_LABEL[x.kind];
      (acc[k] ||= []).push(x.name);
      return acc;
    }, {});
    const lines = Object.entries(grouped).map(([k, names]) => `· ${k}：${names.join("、")}`);
    const tail = `估价 ¥${Math.round(totals.price)} · 热量 ≈${Math.round(totals.calories)} kcal`;
    return ["今日决定：", ...lines, tail].join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(summary());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className="fixed bottom-3 right-3 z-40 sm:bottom-5 sm:right-5"
      data-testid="today-dock"
    >
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          data-testid="today-dock-toggle"
          className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover-elevate active-elevate-2"
        >
          <Sparkles className="h-4 w-4" />
          今日已选
          <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[11px] num">
            {items.length}
          </span>
        </button>
      )}
      {open && (
        <Card
          className="grain w-[20rem] max-w-[92vw] border-primary/40 bg-card/95 p-3 shadow-2xl backdrop-blur"
          data-testid="today-dock-panel"
        >
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[10.5px] font-medium uppercase tracking-[0.18em] text-primary/85">今日已选</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                自动汇总 · 估价 · 估卡路里
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover-elevate"
              data-testid="today-dock-close"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-[12px]">
            <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
              <p className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <Wallet className="h-3 w-3 text-primary" /> 估价
              </p>
              <p className="num text-[15px] font-semibold">¥{Math.round(totals.price)}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
              <p className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-wider text-muted-foreground">
                <Flame className="h-3 w-3 text-primary" /> 热量
              </p>
              <p className="num text-[15px] font-semibold">≈{Math.round(totals.calories)} kcal</p>
            </div>
          </div>

          <div className="mt-2 max-h-[40vh] overflow-y-auto pr-1">
            {items.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-muted-foreground">
                还没选 · 在「懒人/外卖/零食/水果」面板里点「加入今日」
              </p>
            ) : (
              <ul className="space-y-1.5">
                {items.map((x) => (
                  <li
                    key={`${x.kind}-${x.id}`}
                    className="flex items-baseline gap-2 rounded-md border border-border/40 bg-background/50 px-2 py-1.5 text-[12.5px]"
                    data-testid={`today-dock-item-${x.kind}-${x.id}`}
                  >
                    <span aria-hidden>{KIND_EMOJI[x.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <span className="font-medium">{x.name}</span>
                        <span className="ml-1 text-[10.5px] text-muted-foreground">
                          {KIND_LABEL[x.kind]}
                          {x.note ? ` · ${x.note}` : ""}
                        </span>
                      </p>
                      <p className="num text-[10.5px] text-muted-foreground">
                        {x.price ? `¥${x.price}` : ""}
                        {x.price && x.calories ? " · " : ""}
                        {x.calories ? `${x.calories} kcal` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSelected(x.kind, x.id)}
                      className="rounded-full p-1 text-muted-foreground hover-elevate"
                      aria-label="移除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={items.length === 0}
              className="h-8 flex-1 rounded-full text-[12px]"
              data-testid="today-dock-copy"
            >
              {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
              {copied ? "已复制" : "复制汇总"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => clearSelected()}
              disabled={items.length === 0}
              className="h-8 rounded-full text-[12px]"
              data-testid="today-dock-clear"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> 清空
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
