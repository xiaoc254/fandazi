// 健康饮食面板：基于现有菜谱 tags / ingredients / steps 关键词推断健康标签。
// 重要：不构成医疗建议；UI 上明确写出免责声明。

import { useMemo, useState } from "react";
import {
  HeartPulse,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DishImage } from "@/components/DishImage";
import { DishPhoto } from "@/components/DishPhoto";
import { dishVisual } from "@/lib/dishVisual";
import { RECIPES, type Recipe } from "@/data/recipes";
import {
  scoreRecipe,
  type HealthFilterId,
  listHealthMatches,
} from "@/lib/recommend";

interface PersonaPreset {
  id: string;
  label: string;
  emoji: string;
  description: string;
  flags: HealthFilterId[];
  /** 友好提示，单独展示 */
  tip: string;
}

const PERSONAS: PersonaPreset[] = [
  {
    id: "diabetes",
    label: "糖尿病饮食参考",
    emoji: "🩺",
    description: "低糖、低油、优质蛋白，避免糖醋/可乐/糖浆类菜品。",
    flags: ["low-sugar", "low-oil", "high-quality-protein"],
    tip: "请遵医嘱控制总能量、合理分餐；本应用不替代专业营养师。",
  },
  {
    id: "hypertension",
    label: "高血压饮食参考",
    emoji: "💗",
    description: "低盐为主，避免重酱、卤腌制品；多素少炸。",
    flags: ["low-salt", "low-oil"],
    tip: "盐摄入建议每日 < 5g。建议复测血压并定期随访。",
  },
  {
    id: "gout",
    label: "痛风/高尿酸参考",
    emoji: "🦴",
    description: "低嘌呤为主，避免海鲜/动物内脏/浓汤/卤味。",
    flags: ["low-purine"],
    tip: "建议规律服药并定期监测尿酸水平；多饮水。",
  },
  {
    id: "elder",
    label: "长辈/恢复期参考",
    emoji: "👴",
    description: "软烂易消化、低盐、清淡为主；蒸/炖/煮优先。",
    flags: ["soft-easy-digest", "low-salt", "low-oil"],
    tip: "术后/咀嚼功能下降人群请咨询医生饮食结构。",
  },
  {
    id: "stomach",
    label: "肠胃清淡",
    emoji: "🌿",
    description: "清淡少油少辣、易消化；避免重辣/重油。",
    flags: ["soft-easy-digest", "low-oil"],
    tip: "偶尔重口可以接受；持续不适请就医。",
  },
  {
    id: "balanced",
    label: "日常均衡",
    emoji: "🥗",
    description: "低糖低盐 + 优质蛋白，普通人群通用。",
    flags: ["low-sugar", "low-salt", "high-quality-protein"],
    tip: "适合作为「想吃得健康一点」的日常筛选。",
  },
];

const FLAG_LABEL: Record<HealthFilterId, string> = {
  "low-sugar": "低糖",
  "low-salt": "低盐",
  "low-oil": "低油",
  "low-purine": "低嘌呤",
  "soft-easy-digest": "软烂易消化",
  "high-quality-protein": "优质蛋白",
};

export function HealthPanel({
  onPickRecipe,
  realImagesEnabled,
}: {
  onPickRecipe: (r: Recipe) => void;
  realImagesEnabled: boolean;
}) {
  const [personaId, setPersonaId] = useState<string>(PERSONAS[0].id);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];

  const recommended = useMemo(() => {
    const flags = persona.flags;
    // 用 scoreRecipe 复用算法；这里只关心健康加分。
    const ranked = RECIPES
      .filter((r) => r.course === "main" || r.course === "veggie" || r.course === "soup")
      .map((r) => {
        const matches = listHealthMatches(r);
        const overlap = matches.filter((f) => flags.includes(f)).length;
        // 直接按命中数 + 推荐评分排序
        return { r, matches, overlap, score: scoreRecipe(r, {
          servings: 2,
          maxTimeMinutes: 90,
          tastes: [],
          restrictions: [],
          cuisines: [],
          difficulties: [],
          withSoup: true,
          withVeggie: true,
          mainCount: 1,
        }, { healthFilter: flags }) };
      })
      .filter((x) => x.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap || b.score - a.score)
      .slice(0, 12);
    return ranked;
  }, [persona]);

  return (
    <section className="space-y-4" data-testid="health-panel">
      <header>
        <h2 className="font-display text-[1.6rem] tracking-tight">
          <HeartPulse className="mb-1 mr-1 inline h-5 w-5 text-primary" />
          健康康复吃什么
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          按人群挑健康菜：低糖 / 低盐 / 低嘌呤 / 软烂易消化 / 优质蛋白。
        </p>
      </header>

      <Card
        className="border-amber-500/40 bg-amber-50/70 p-3 text-[12.5px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-100"
        data-testid="health-disclaimer"
      >
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <strong className="font-medium">饮食参考 · 非医疗建议</strong>
            <p className="mt-0.5 leading-relaxed">
              本页仅作日常饮食参考，不构成营养 / 医疗诊断或治疗建议。
              糖尿病、高血压、痛风、肠胃疾病、术后/恢复期人群请遵循医生与营养师的指导，
              结合自身情况调整。本应用不收集任何健康数据。
            </p>
          </div>
        </div>
      </Card>

      {/* 人群选择 */}
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        data-testid="persona-grid"
      >
        {PERSONAS.map((p) => {
          const active = p.id === personaId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersonaId(p.id)}
              data-testid={`persona-${p.id}`}
              className={`text-left rounded-xl border p-3 transition-colors hover-elevate active-elevate-2 ${
                active
                  ? "border-primary/55 bg-primary/8 shadow-sm shadow-primary/15"
                  : "border-border/60 bg-card/60"
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span aria-hidden className="text-base">{p.emoji}</span>
                <span className={`font-display text-[14px] tracking-tight ${active ? "text-primary" : ""}`}>
                  {p.label}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                {p.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.flags.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className={`rounded-full px-1.5 py-0 text-[10.5px] ${
                      active ? "border-primary/40 text-primary" : "border-border text-foreground/75"
                    }`}
                  >
                    {FLAG_LABEL[f]}
                  </Badge>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <Card className="grain border-card-border/60 bg-card/70 p-4 sm:p-5">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h3 className="font-display text-[1.05rem] tracking-tight">
            <Sparkles className="mb-0.5 mr-1 inline h-4 w-4 text-primary" />
            推荐 · {persona.label}
          </h3>
          <span className="text-[11px] text-muted-foreground num">
            共 {recommended.length} 道
          </span>
        </div>
        <p className="mb-3 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-2 text-[11.5px] leading-relaxed text-foreground/85">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <span>{persona.tip}</span>
        </p>

        {recommended.length === 0 ? (
          <p className="py-6 text-center text-[12.5px] text-muted-foreground">
            当前规则下暂无完全匹配的菜，可以试试切换其他人群。
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {recommended.map(({ r, matches }) => {
              const visual = dishVisual(r.name, r.course, r.cuisine);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onPickRecipe(r)}
                  data-testid={`health-recipe-${r.id}`}
                  className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-2 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg">
                    {realImagesEnabled ? (
                      <DishPhoto
                        name={r.name}
                        visual={visual}
                        alt={r.name}
                        className="h-full w-full"
                        showSourceBadge={false}
                      />
                    ) : (
                      <DishImage visual={visual} alt={r.name} className="h-full w-full" name={r.name} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-display text-[14px] tracking-tight">{r.name}</h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-muted-foreground num">
                      <span>{r.timeMinutes} 分钟</span>
                      <span>·</span>
                      <span>{r.cuisine}</span>
                      <span>·</span>
                      <span>{r.difficulty}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {matches
                        .filter((m) => persona.flags.includes(m))
                        .slice(0, 3)
                        .map((m) => (
                          <Badge
                            key={m}
                            variant="secondary"
                            className="rounded-full bg-primary/10 px-1.5 py-0 text-[10px] text-primary"
                          >
                            {FLAG_LABEL[m]}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary" />
                </button>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4 h-9 w-full justify-center rounded-full text-[12.5px]"
          onClick={() => {
            // 提示：把当前 flags 写入「今日推荐」的健康偏好（通过 localStorage 信号）
            try {
              localStorage.setItem(
                "chishenme.health.appliedFlags.v1",
                JSON.stringify({ flags: persona.flags, ts: Date.now() }),
              );
              window.dispatchEvent(new CustomEvent("chishenme:health-applied"));
            } catch {}
          }}
          data-testid="apply-health-flags"
        >
          把这组规则同步到「今日推荐」
        </Button>
      </Card>
    </section>
  );
}
