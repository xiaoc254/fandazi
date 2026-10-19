// 首次进入时的轻量引导：选择常用场景，影响默认人数 / 餐次 / 难度等。
// 用户随时可以在主页 Tab 切换场景，不需要重开 Onboarding。

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { SCENARIOS, type ScenarioId } from "@/lib/scenarios";

interface OnboardingProps {
  open: boolean;
  onPick: (id: ScenarioId) => void;
  onSkip: () => void;
}

export function Onboarding({ open, onPick, onSkip }: OnboardingProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onSkip(); }}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-onboarding"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[1.4rem] tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" /> 先告诉我们：你今天想怎么吃？
          </DialogTitle>
          <DialogDescription>
            选一个常见场景，我们会按它预设人数 / 餐次 / 难度 / 时间。<span className="font-medium text-foreground">不喜欢可以稍后切换</span>，硬性忌口和饮食计划会全部保留。
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s.id)}
              data-testid={`onboarding-${s.id}`}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card/60 p-4 text-left transition-colors hover-elevate active-elevate-2"
            >
              <span className="text-2xl" aria-hidden>{s.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-display text-[1.05rem] tracking-tight">{s.label}</h4>
                  <span className="text-[10.5px] text-muted-foreground num">
                    {s.defaultServings} 人 · {s.defaultMaxTime} 分内
                  </span>
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <DialogFooter className="mt-3 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-muted-foreground">
            数据全部保存在本浏览器，不上传任何服务器。
          </p>
          <Button
            variant="outline"
            onClick={onSkip}
            data-testid="onboarding-skip"
            className="w-full sm:w-auto"
          >
            跳过 / 用通用推荐
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
