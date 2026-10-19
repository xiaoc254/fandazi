// 首次进入的「个性化设置」轻量弹窗。
// 设计要点：
//  - 不强制完成；右上角可关闭，不阻塞使用
//  - 数据全部本地，弹窗里有醒目说明
//  - 字段尽量分组、可跳过；越填越准，但留空也能用
//  - 完成时给一个「跳到推荐入口」的快捷按钮，根据 role 决定 Tab

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Sparkles, Lock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ROLES,
  MOODS,
  HEALTH_FOCUS,
  emptyPersona,
  type Persona,
  type RoleId,
  type MoodId,
  type HealthFocusId,
  type AgeBand,
  type Sex,
  estimatePersonaPlan,
} from "@/lib/persona";
import { isStoragePersistent } from "@/lib/storage";

const AGE_BANDS: AgeBand[] = ["18-25", "26-35", "36-45", "46-55", "56+"];
const SEX_OPTIONS: { id: Sex; label: string }[] = [
  { id: "female", label: "女" },
  { id: "male",   label: "男" },
  { id: "skip",   label: "不填" },
];

interface Props {
  open: boolean;
  initial?: Persona | null;
  onClose: () => void;
  onSave: (p: Persona, opts: { jumpRole: boolean }) => void;
}

// 醒目的「四条快速路线」— 显示在角色网格之上，让用户一眼能选到自己想走的路。
// 这些 id 必须与 ROLES 里已存在的 id 对应（lazy / family-cook / fitness-cut）；
// 「随便试试」不绑定 role，仅关闭弹窗（停在首页）。
const QUICK_ROUTES: {
  id: RoleId | "browse";
  emoji: string;
  title: string;
  hint: string;
  tone: string;
}[] = [
  { id: "lazy",        emoji: "🧍",   title: "一个人选择困难",   hint: "替我决定今晚怎么过 → 一键安排今晚",  tone: "from-rose-100 to-amber-100 border-rose-200" },
  { id: "family-cook", emoji: "👨‍👩‍👧", title: "我负责一家人吃饭", hint: "老人小孩口味协调 → 家庭今晚饭",       tone: "from-emerald-100 to-cyan-100 border-emerald-200" },
  { id: "fitness-cut", emoji: "🥗",   title: "减脂控卡 / 健康饮食", hint: "热量盯紧 → 健康饮食",                tone: "from-lime-100 to-emerald-100 border-lime-200" },
  { id: "browse",      emoji: "🎲",   title: "先随便试试",       hint: "不指定路线 → 浏览首页 / 一键决定",     tone: "from-amber-100 to-orange-100 border-amber-200" },
];

export function PersonaWelcome({ open, initial, onClose, onSave }: Props) {
  const persistent = useMemo(() => isStoragePersistent(), []);

  // 三步：① 角色 ② 心情/健康 ③ 数值（可跳过）
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Persona>(() => initial ?? emptyPersona());
  // 「先随便试试」是 UI 概念上的第 4 张快速卡，不对应任何 role；
  // 用单独状态跟踪它的高亮，避免污染 persona.role。
  const [browseSelected, setBrowseSelected] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setPersona(initial ?? emptyPersona());
      setBrowseSelected(false);
    }
  }, [open, initial]);

  function patch(p: Partial<Persona>) {
    setPersona((cur) => ({ ...cur, ...p }));
  }

  function toggleArr<T extends string>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  function pickRole(id: RoleId) {
    patch({ role: id });
    setBrowseSelected(false);
    // 不再自动跳到下一步——让用户继续在当前页确认其他个性化选项；
    // 真正的跳转放到底部「开始探索」主按钮里。
  }

  // 快速路线：只记录选中状态（高亮 + 设置 role），不再立刻保存或跳转。
  // 「browse」表示「先随便试试」— 不绑定任何 role，但仍允许继续填资料。
  function pickQuickRoute(id: RoleId | "browse") {
    if (id === "browse") {
      patch({ role: undefined });
      setBrowseSelected(true);
      return;
    }
    patch({ role: id });
    setBrowseSelected(false);
  }

  function toggleMood(id: MoodId) {
    patch({ moods: toggleArr(persona.moods, id) });
  }

  function toggleHealth(id: HealthFocusId) {
    patch({ healthFocus: toggleArr(persona.healthFocus, id) });
  }

  const plan = useMemo(() => estimatePersonaPlan(persona), [persona]);

  // 主按钮文案：根据当前选中的路线/角色给出明确的 CTA。
  const startCta = useMemo(() => {
    if (persona.role) {
      switch (persona.role) {
        case "lazy":          return "开始探索单人方案";
        case "family-cook":   return "开始生成家庭饭方案";
        case "fitness-cut":   return "去健康饮食";
        case "health-watch":  return "去健康饮食";
        case "takeout":       return "开始挑外卖";
        case "travel-foodie": return "开始本地寻味";
        case "table-talk":    return "去找点饭桌话题";
        default: {
          const r = ROLES.find((x) => x.id === persona.role);
          return r ? `开始探索：${r.label}` : "开始探索";
        }
      }
    }
    if (browseSelected) return "随便看看，先进首页";
    return "开始探索";
  }, [persona.role, browseSelected]);

  // 用户是否已经选择了某条路线（含「随便试试」）。没选时主按钮置灰提示先选路线。
  const hasRouteChoice = !!persona.role || browseSelected;

  function handleStart() {
    if (!hasRouteChoice) return;
    // role 存在 → 跳到对应入口；browseSelected → 仅关闭弹窗、停在首页
    onSave(persona, { jumpRole: !!persona.role });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-xl"
        data-testid="dialog-persona-welcome"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[1.3rem] tracking-tight">
            <Sparkles className="h-5 w-5 text-primary" />
            告诉饭搭子一点点关于你
          </DialogTitle>
          <DialogDescription>
            <span className="block">
              填得越多，推荐越合你胃口；
              <span className="font-medium text-foreground">不填也能直接用</span>。
            </span>
            <span className="mt-2 inline-flex items-start gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1.5 text-[12px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              <ShieldCheck className="mt-[1px] h-3.5 w-3.5 flex-shrink-0" />
              <span>
                所有信息都<strong>只保存在你这台设备的浏览器里</strong>，不上传任何服务器
                {persistent ? "（已启用本地持久化）" : "（当前预览环境，关闭页面即清除）"}。
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Step 指示 */}
        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-muted-foreground">
          {["你是谁", "现在的我", "可选数值"].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors ${
                step === i
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/40"
              }`}
              data-testid={`persona-step-${i}`}
            >
              <span className="num">{i + 1}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {step === 0 && (
          <div className="mt-3 space-y-4" data-testid="persona-step-roles">
            {/* 快速路线：4 张大卡片，点一下直接进入对应入口（不强制走完三步） */}
            <div data-testid="persona-quick-routes">
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <Label className="text-[12.5px] font-medium text-foreground/85">
                  你想走哪条路？
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  先选一条路线 · 下面继续填会更准
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {QUICK_ROUTES.map((q) => {
                  const active =
                    q.id === "browse" ? browseSelected : persona.role === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => pickQuickRoute(q.id)}
                      data-testid={`persona-quick-${q.id}`}
                      aria-pressed={active}
                      className={`flex items-start gap-2.5 rounded-2xl border bg-gradient-to-br ${q.tone} px-3.5 py-3 text-left transition-all hover-elevate active-elevate-2 ${
                        active
                          ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary/70"
                          : ""
                      }`}
                    >
                      <span aria-hidden className="text-2xl">{q.emoji}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-display text-[14.5px] font-semibold tracking-tight text-foreground">
                          {q.title}
                        </span>
                        <span className="text-[11.5px] text-foreground/70">{q.hint}</span>
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-foreground/50" />
                    </button>
                  );
                })}
              </div>
              {hasRouteChoice && (
                <p
                  className="mt-2 text-[11.5px] text-primary"
                  data-testid="persona-route-hint"
                >
                  路线已选好，可以下面继续补充信息，最后点「{startCta}」。
                </p>
              )}
            </div>

            <div>
              <Label className="text-[12.5px] font-medium text-foreground/85">
                或者细分一下，选一个最贴近的角色
              </Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map((r) => {
                  const active = persona.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => pickRole(r.id)}
                      data-testid={`persona-role-${r.id}`}
                      className={`group flex h-full flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-all hover-elevate active-elevate-2 ${
                        active
                          ? "border-primary/60 bg-primary/10"
                          : "border-border bg-card/60"
                      }`}
                    >
                      <span className="text-xl" aria-hidden>{r.emoji}</span>
                      <span className="font-display text-[14.5px] tracking-tight">{r.label}</span>
                      <span className="text-[11px] text-muted-foreground">{r.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                选一个最贴近你今天来这儿的目的。下一步可以继续选心情和健康关注，最后再点「开始探索」。
              </p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-3 space-y-4" data-testid="persona-step-moods">
            <div>
              <Label className="text-[12.5px] font-medium text-foreground/85">
                现在心情 / 节奏（多选）
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const active = persona.moods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleMood(m.id)}
                      data-testid={`persona-mood-${m.id}`}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                        active
                          ? "border-primary/60 bg-primary text-primary-foreground"
                          : "border-border bg-card/60 text-foreground/85"
                      }`}
                    >
                      <span aria-hidden>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-[12.5px] font-medium text-foreground/85">
                健康关注（多选；只做软偏好，不构成医疗建议）
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {HEALTH_FOCUS.map((h) => {
                  const active = persona.healthFocus.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => toggleHealth(h.id)}
                      data-testid={`persona-health-${h.id}`}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                        active
                          ? "border-primary/60 bg-primary text-primary-foreground"
                          : "border-border bg-card/60 text-foreground/85"
                      }`}
                      title={h.hint || undefined}
                    >
                      <span aria-hidden>{h.emoji}</span>
                      <span>{h.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                饭搭子只会用关键词软排序匹配（例如「低盐」会减少高盐酱料菜的权重），
                <strong className="text-foreground/80">不替代专业医生意见</strong>。
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-3 space-y-3" data-testid="persona-step-numbers">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-[11.5px] text-muted-foreground">性别</Label>
                <div className="mt-1 inline-flex w-full overflow-hidden rounded-md border border-border">
                  {SEX_OPTIONS.map((s) => {
                    const active = persona.sex === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => patch({ sex: s.id })}
                        className={`flex-1 px-2 py-1.5 text-[12.5px] transition-colors ${
                          active ? "bg-primary text-primary-foreground" : "bg-card/60 text-foreground/80"
                        }`}
                        data-testid={`persona-sex-${s.id}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">年龄段</Label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-card/60 px-2 py-1.5 text-[12.5px]"
                  value={persona.ageBand ?? ""}
                  onChange={(e) => patch({ ageBand: (e.target.value || undefined) as AgeBand })}
                  data-testid="persona-age"
                >
                  <option value="">不填</option>
                  {AGE_BANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">人数</Label>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  inputMode="numeric"
                  value={persona.servings ?? ""}
                  placeholder="如 2"
                  onChange={(e) => patch({ servings: e.target.value ? Math.max(1, Math.min(12, +e.target.value)) : undefined })}
                  data-testid="persona-servings"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>

              <div>
                <Label className="text-[11.5px] text-muted-foreground">身高 cm</Label>
                <Input
                  type="number"
                  min={120}
                  max={220}
                  inputMode="numeric"
                  value={persona.heightCm ?? ""}
                  placeholder="如 170"
                  onChange={(e) => patch({ heightCm: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-height"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">体重 kg</Label>
                <Input
                  type="number"
                  min={30}
                  max={200}
                  inputMode="numeric"
                  value={persona.weightKg ?? ""}
                  placeholder="如 60"
                  onChange={(e) => patch({ weightKg: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-weight"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">目标体重 kg</Label>
                <Input
                  type="number"
                  min={30}
                  max={200}
                  inputMode="numeric"
                  value={persona.targetWeightKg ?? ""}
                  placeholder="可选"
                  onChange={(e) => patch({ targetWeightKg: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-target"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>

              <div>
                <Label className="text-[11.5px] text-muted-foreground">省份</Label>
                <Input
                  value={persona.province ?? ""}
                  placeholder="如 广东"
                  onChange={(e) => patch({ province: e.target.value || undefined })}
                  data-testid="persona-province"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">城市</Label>
                <Input
                  value={persona.city ?? ""}
                  placeholder="如 广州"
                  onChange={(e) => patch({ city: e.target.value || undefined })}
                  data-testid="persona-city"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">单餐预算 ¥</Label>
                <Input
                  type="number"
                  min={5}
                  max={500}
                  inputMode="numeric"
                  value={persona.budgetPerMeal ?? ""}
                  placeholder="如 30"
                  onChange={(e) => patch({ budgetPerMeal: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-budget"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
            </div>

            {(plan.bmi || plan.dailyKcal) && (
              <div
                className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
                data-testid="persona-plan-estimate"
              >
                <span className="block font-medium">仅供参考的粗略估算</span>
                <span className="mt-0.5 inline-flex flex-wrap gap-x-3 gap-y-1 num">
                  {plan.bmi && <span>BMI {plan.bmi}</span>}
                  {plan.bmr && <span>BMR ≈ {plan.bmr} kcal</span>}
                  {plan.tdeeRough && <span>每日活动 ≈ {plan.tdeeRough} kcal</span>}
                  {plan.dailyKcal && <span>建议摄入 ≈ {plan.dailyKcal} kcal</span>}
                </span>
                <span className="mt-1 block text-[11px]">
                  公式来自 Mifflin-St Jeor + 轻度活动系数；不是医学/营养诊断，仅作饮食规划参考。
                </span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-3 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            数据本地保存，可随时在设置中清除
          </p>
          <div className="flex w-full gap-2 sm:w-auto">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                data-testid="persona-prev"
                className="flex-1 sm:flex-initial"
              >
                上一步
              </Button>
            )}
            {step < 2 && (
              <Button
                variant="outline"
                onClick={() => setStep((s) => s + 1)}
                data-testid="persona-next"
                className="flex-1 sm:flex-initial"
              >
                下一步
                <ChevronRight className="ml-0.5 h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleStart}
              disabled={!hasRouteChoice}
              data-testid="persona-start"
              className="flex-1 sm:flex-initial"
              title={hasRouteChoice ? undefined : "请先在第 1 步选一条路线"}
            >
              {startCta}
              <ChevronRight className="ml-0.5 h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
