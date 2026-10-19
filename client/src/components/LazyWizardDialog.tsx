// v2: 懒人快速问答抽屉 — 5-7 个有趣的小问题，结果会传给懒人决定生成更贴合的方案。
// 使用现有 Dialog 组件，不引入新依赖。

import { useState } from "react";
import { Wand2, Smile, Cloud, Wallet, Users, Heart, Sparkles, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface WizardAnswers {
  mood: "开心" | "压力大" | "疲惫" | "沮丧" | "想奖励自己" | "平淡";
  weather: "晴" | "雨" | "冷" | "热" | "舒适" | "未知";
  budget: number;
  people: number;
  goal: "省钱" | "解压" | "犒劳自己" | "陪伴" | "减脂" | "随便";
  taste: "辣" | "清淡" | "酸甜" | "咸鲜" | "甜口" | "随便";
  /** MBTI / 星座 / 兴趣 任选 */
  personality?: string;
}

const Q_MOOD: { id: WizardAnswers["mood"]; label: string; emoji: string }[] = [
  { id: "开心", label: "开心", emoji: "😄" },
  { id: "压力大", label: "压力大", emoji: "😣" },
  { id: "疲惫", label: "疲惫", emoji: "🥱" },
  { id: "沮丧", label: "沮丧", emoji: "😔" },
  { id: "想奖励自己", label: "想奖励自己", emoji: "🎁" },
  { id: "平淡", label: "平淡", emoji: "🙂" },
];
const Q_WEATHER: { id: WizardAnswers["weather"]; label: string; emoji: string }[] = [
  { id: "舒适", label: "舒适", emoji: "🌤️" },
  { id: "晴", label: "晴朗", emoji: "☀️" },
  { id: "雨", label: "下雨", emoji: "🌧️" },
  { id: "冷", label: "冷", emoji: "🥶" },
  { id: "热", label: "热", emoji: "🥵" },
  { id: "未知", label: "懒得选", emoji: "❓" },
];
const Q_GOAL: { id: WizardAnswers["goal"]; label: string }[] = [
  { id: "省钱", label: "省钱" },
  { id: "解压", label: "解压" },
  { id: "犒劳自己", label: "犒劳自己" },
  { id: "陪伴", label: "陪伴家人/朋友" },
  { id: "减脂", label: "减脂" },
  { id: "随便", label: "随便都行" },
];
const Q_TASTE: { id: WizardAnswers["taste"]; label: string }[] = [
  { id: "辣", label: "辣" },
  { id: "清淡", label: "清淡" },
  { id: "酸甜", label: "酸甜" },
  { id: "咸鲜", label: "咸鲜" },
  { id: "甜口", label: "甜口" },
  { id: "随便", label: "随便" },
];

const PERSONALITY: string[] = [
  "INTJ", "ENFP", "ISTP", "ESFJ", "INFP", "ENTJ", "ISTJ", "ESFP",
  "白羊", "金牛", "双子", "巨蟹", "狮子", "处女", "天秤", "天蝎", "射手", "摩羯", "水瓶", "双鱼",
  "宅家", "运动派", "美食控", "电影迷", "音乐人",
];

interface Props {
  initial?: Partial<WizardAnswers>;
  /** 提交后回调，外层据此重新生成推荐 */
  onSubmit: (a: WizardAnswers) => void;
  /** 受控触发器（可选） */
  trigger?: React.ReactNode;
}

export function LazyWizardDialog({ initial, onSubmit, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<WizardAnswers>({
    mood: initial?.mood ?? "平淡",
    weather: initial?.weather ?? "舒适",
    budget: initial?.budget ?? 40,
    people: initial?.people ?? 1,
    goal: initial?.goal ?? "随便",
    taste: initial?.taste ?? "随便",
    personality: initial?.personality,
  });

  function done() {
    onSubmit(answers);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-full"
            data-testid="lazy-wizard-trigger"
          >
            <Wand2 className="mr-1 h-4 w-4 text-primary" />
            快速问答 · 一分钟决定
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]" data-testid="lazy-wizard-dialog">
        <DialogHeader>
          <DialogTitle>
            <Sparkles className="mb-1 mr-1 inline h-4 w-4 text-primary" />
            一分钟告诉我们一点信息
          </DialogTitle>
          <DialogDescription>
            一共 5-6 个轻松小问题，全部可跳过 — 越答越贴合
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <Section icon={<Smile className="h-3.5 w-3.5 text-primary" />} label="心情">
            <Pills
              options={Q_MOOD.map((m) => ({ id: m.id, label: `${m.emoji} ${m.label}` }))}
              active={answers.mood}
              onChange={(id) => setAnswers((a) => ({ ...a, mood: id as WizardAnswers["mood"] }))}
              testIdPrefix="wiz-mood"
            />
          </Section>

          <Section icon={<Cloud className="h-3.5 w-3.5 text-primary" />} label="天气体感">
            <Pills
              options={Q_WEATHER.map((w) => ({ id: w.id, label: `${w.emoji} ${w.label}` }))}
              active={answers.weather}
              onChange={(id) => setAnswers((a) => ({ ...a, weather: id as WizardAnswers["weather"] }))}
              testIdPrefix="wiz-weather"
            />
          </Section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Section icon={<Wallet className="h-3.5 w-3.5 text-primary" />} label="预算（¥）">
              <Pills
                options={[15, 25, 40, 60, 100, 150].map((b) => ({ id: String(b), label: `¥${b}` }))}
                active={String(answers.budget)}
                onChange={(id) => setAnswers((a) => ({ ...a, budget: Number(id) }))}
                testIdPrefix="wiz-budget"
              />
            </Section>
            <Section icon={<Users className="h-3.5 w-3.5 text-primary" />} label="人数">
              <Pills
                options={[1, 2, 3, 4, 5, 6].map((n) => ({ id: String(n), label: `${n} 人` }))}
                active={String(answers.people)}
                onChange={(id) => setAnswers((a) => ({ ...a, people: Number(id) }))}
                testIdPrefix="wiz-people"
              />
            </Section>
          </div>

          <Section icon={<Heart className="h-3.5 w-3.5 text-primary" />} label="今日目标">
            <Pills
              options={Q_GOAL.map((g) => ({ id: g.id, label: g.label }))}
              active={answers.goal}
              onChange={(id) => setAnswers((a) => ({ ...a, goal: id as WizardAnswers["goal"] }))}
              testIdPrefix="wiz-goal"
            />
          </Section>

          <Section icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="口味">
            <Pills
              options={Q_TASTE.map((t) => ({ id: t.id, label: t.label }))}
              active={answers.taste}
              onChange={(id) => setAnswers((a) => ({ ...a, taste: id as WizardAnswers["taste"] }))}
              testIdPrefix="wiz-taste"
            />
          </Section>

          <Section icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="MBTI / 星座 / 关键词（可选）">
            <Pills
              options={PERSONALITY.map((p) => ({ id: p, label: p }))}
              active={answers.personality ?? ""}
              onChange={(id) => setAnswers((a) => ({ ...a, personality: a.personality === id ? undefined : id }))}
              testIdPrefix="wiz-personality"
            />
          </Section>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 rounded-full text-[12.5px]"
          >
            稍后再说
          </Button>
          <Button
            type="button"
            onClick={done}
            className="h-9 gap-1 rounded-full text-[12.5px]"
            data-testid="wiz-submit"
          >
            生成今日决定 <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 inline-flex items-center gap-1 text-[12px] font-medium text-foreground/80">
        {icon} {label}
      </p>
      {children}
    </div>
  );
}

function Pills({
  options,
  active,
  onChange,
  testIdPrefix,
}: {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  testIdPrefix?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const a = active === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            data-testid={testIdPrefix ? `${testIdPrefix}-${o.id}` : undefined}
            className={`rounded-full border px-2.5 py-1 text-[12.5px] transition-colors ${
              a ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/80 hover-elevate"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
