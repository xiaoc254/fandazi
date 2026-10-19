// 「我的档案」对话框（统一个人档案）：
//  - 「个性化」（persona：角色 / 心情 / 健康关注 / 基础数值），与首次弹窗 PersonaWelcome 共用同一份本地数据
//  - 账户（多档案 + 昵称）
//  - 喜好（口味 / 菜系 / 忌口）
//  - 饮食计划（身高体重活动量目标 + BMR/TDEE）
//  - 环境（地区 / 天气 / 季节 / 日期类型）
// 全部数据保存在浏览器本地（safe storage）。

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  type Profile,
  type FlavorPreference,
  type BodyInfo,
  type ActivityLevel,
  type GoalType,
  type MealSlot,
  type Sex,
  ACTIVITY_LABELS,
  GOAL_LABELS,
  SLOT_LABELS,
  computePlan,
  createProfile,
  deleteProfile,
  getActiveProfile,
  listProfiles,
  saveProfile,
  setActiveProfileId,
  syncPersonaToProfile,
} from "@/lib/profile";
import { isStoragePersistent } from "@/lib/storage";
import {
  ROLES,
  MOODS,
  HEALTH_FOCUS,
  emptyPersona,
  loadPersona,
  savePersona,
  estimatePersonaPlan,
  type Persona,
  type RoleId,
  type MoodId,
  type HealthFocusId,
  type AgeBand,
  type Sex as PersonaSex,
} from "@/lib/persona";
import {
  ALL_SEASONS,
  ALL_WEATHERS,
  type EnvContext,
  inferDayKind,
  inferSeason,
  type Weather,
  type Season,
} from "@/lib/environment";
import { PROVINCES, findProvinceByName } from "@/lib/regions";
import { autoLocate } from "@/lib/geoWeather";
import {
  ALL_TASTES,
  ALL_RESTRICTIONS,
  ALL_CUISINES,
  type Taste,
  type Restriction,
  type Cuisine,
} from "@/data/recipes";
import {
  AlertTriangle,
  Info,
  LogOut,
  Plus,
  Save,
  Trash2,
  UserCircle2,
  Sparkles,
  Cloud,
  CalendarDays,
  Heart,
  MapPin,
  Loader2,
} from "lucide-react";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
  /** 上层在 onChange 后会更新自己的 state（重新读 storage） */
  onChange: () => void;
  env: EnvContext;
  onEnvChange: (e: EnvContext) => void;
  /** 默认打开的 Tab（外部可用 "persona" 直接进入个性化） */
  defaultTab?: ProfileTab;
  /** 用户在 Persona Tab 保存后通知上层（让推荐重算） */
  onPersonaChange?: (p: Persona) => void;
}

export type ProfileTab = "persona" | "account" | "flavor" | "plan" | "env";

const AGE_BANDS: AgeBand[] = ["18-25", "26-35", "36-45", "46-55", "56+"];
const PERSONA_SEX_OPTIONS: { id: PersonaSex; label: string }[] = [
  { id: "female", label: "女" },
  { id: "male",   label: "男" },
  { id: "skip",   label: "不填" },
];

function Chip({
  active,
  onClick,
  children,
  testId,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={`inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-medium transition-colors hover-elevate active-elevate-2 ${
        active
          ? "border-primary/50 bg-primary text-primary-foreground"
          : "border-border bg-card/60 text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}

export function ProfileDialog({
  open,
  onClose,
  onChange,
  env,
  onEnvChange,
  defaultTab = "persona",
  onPersonaChange,
}: ProfileDialogProps) {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [active, setActive] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState("");
  const [tab, setTab] = useState<ProfileTab>(defaultTab);
  const [persona, setPersona] = useState<Persona>(() => loadPersona() ?? emptyPersona());
  const persistent = useMemo(() => isStoragePersistent(), []);

  // 本地编辑态（避免每次 keystroke 都写 storage）
  const [flavor, setFlavor] = useState<FlavorPreference>({
    liked: [],
    disliked: [],
    cuisines: [],
    restrictions: [],
  });
  const [body, setBody] = useState<BodyInfo | undefined>();
  const [planEnabled, setPlanEnabled] = useState(false);
  const [slot, setSlot] = useState<MealSlot>("dinner");
  const [envDraft, setEnvDraft] = useState<EnvContext>(env);

  // 加载 active profile
  useEffect(() => {
    if (!open) return;
    const all = listProfiles();
    setProfiles(all);
    const a = getActiveProfile();
    setActive(a);
    if (a) {
      setFlavor(a.flavor);
      setBody(a.body);
      setPlanEnabled(a.planEnabled);
      setSlot(a.slot);
    } else {
      setFlavor({ liked: [], disliked: [], cuisines: [], restrictions: [] });
      setBody(undefined);
      setPlanEnabled(false);
      setSlot("dinner");
    }
    setEnvDraft(env);
    setPersona(loadPersona() ?? emptyPersona());
    setTab(defaultTab);
  }, [open, env, defaultTab]);

  function refreshProfiles() {
    setProfiles(listProfiles());
    setActive(getActiveProfile());
    onChange();
  }

  function onCreate() {
    const name = nickname.trim();
    if (!name) {
      toast({ title: "请填写昵称", variant: "destructive" });
      return;
    }
    const p = createProfile(name);
    setNickname("");
    setActive(p);
    setFlavor(p.flavor);
    setBody(p.body);
    setPlanEnabled(p.planEnabled);
    setSlot(p.slot);
    refreshProfiles();
    toast({ title: `欢迎，${p.nickname}`, description: "档案保存在本浏览器，刷新仍在。" });
  }

  function onSwitch(id: string) {
    setActiveProfileId(id);
    refreshProfiles();
  }

  function onLogout() {
    setActiveProfileId(null);
    refreshProfiles();
    toast({ title: "已退出当前档案" });
  }

  function onDelete(id: string) {
    deleteProfile(id);
    refreshProfiles();
    toast({ title: "已删除档案" });
  }

  function saveCurrent() {
    if (!active) return;
    // 启用饮食计划但用户没改过身体输入框时，UI 显示的 fallback（165/60/28 等）
    // 并不会写入 body，导致 profile.body 仍是 undefined、推荐时拿不到热量目标。
    // 这里在保存时把当前 UI 默认值落到 body，保证「直接勾选启用 → 保存」也能跑通。
    let nextBody = body;
    if (planEnabled && !nextBody) {
      nextBody = {
        sex: "female",
        age: 28,
        heightCm: 165,
        weightKg: 60,
        activity: "light",
        goal: "maintain",
      };
      setBody(nextBody);
    }
    const updated: Profile = { ...active, flavor, body: nextBody, planEnabled, slot };
    saveProfile(updated);
    setActive(updated);
    refreshProfiles();
    toast({ title: "已保存到本地档案" });
  }

  function saveEnv() {
    onEnvChange(envDraft);
    toast({ title: "已应用环境设置" });
  }

  function patchPersona(p: Partial<Persona>) {
    setPersona((cur) => ({ ...cur, ...p }));
  }

  function togglePersonaArr<T extends string>(list: T[], v: T): T[] {
    return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
  }

  // 保存 Persona Tab：写入 persona 存储，并把可对应的字段同步到 active profile
  // （身高/体重/性别/年龄段 → body；忌口经由 personaHealthFilters 在推荐侧软规则生效）。
  function savePersonaTab() {
    const next: Persona = { ...persona, updatedAt: Date.now() };
    savePersona(next);
    setPersona(next);
    const synced = syncPersonaToProfile(next);
    if (synced) {
      setActive(synced);
      setBody(synced.body);
      refreshProfiles();
    }
    onPersonaChange?.(next);
    toast({ title: "已保存个性化设置（仅本地）" });
  }

  const personaPlan = useMemo(() => estimatePersonaPlan(persona), [persona]);

  const plan = body && planEnabled ? computePlan(body, slot) : null;

  // 当前省份对应的城市列表
  const currentProvince = useMemo(
    () => findProvinceByName(envDraft.province),
    [envDraft.province],
  );

  const [locating, setLocating] = useState(false);
  const [locateMsg, setLocateMsg] = useState<string | null>(null);

  async function onUseMyLocation() {
    setLocating(true);
    setLocateMsg(null);
    try {
      const r = await autoLocate();
      if (r.error) {
        const text =
          r.error === "denied"
            ? "你拒绝了定位授权。可以在浏览器地址栏左侧的图标里手动恢复授权。"
            : r.error === "unsupported"
              ? "你的浏览器不支持定位 API。"
              : r.error === "timeout"
                ? "定位超时了，可以稍后再试或手动选择。"
                : "无法获取位置，请手动选择省市。";
        setLocateMsg(text);
        toast({ title: "定位未成功", description: text, variant: "destructive" });
        return;
      }
      const next: EnvContext = { ...envDraft, autoFilled: true };
      if (r.location?.province) next.province = r.location.province;
      if (r.location?.city) next.city = r.location.city;
      if (r.weatherTag) next.weather = r.weatherTag;
      if (r.weather?.temperatureC !== undefined) next.temperatureC = r.weather.temperatureC;
      setEnvDraft(next);
      const parts: string[] = [];
      if (r.location?.city) parts.push(r.location.city);
      if (r.weatherTag && r.weatherTag !== "未指定") parts.push(`天气 ${r.weatherTag}`);
      if (r.weather?.temperatureC !== undefined) parts.push(`${r.weather.temperatureC}°C`);
      const ok = parts.length > 0 ? parts.join(" · ") : "已尝试自动填充";
      setLocateMsg(`已自动填充：${ok}（仍需点击「应用环境」生效）`);
      toast({ title: "已自动填充", description: ok });
    } catch (e: any) {
      const msg = e?.message ?? "未知错误";
      setLocateMsg(`定位失败：${msg}`);
      toast({ title: "定位失败", description: msg, variant: "destructive" });
    } finally {
      setLocating(false);
    }
  }

  function toggleFlavorList<K extends "liked" | "disliked" | "restrictions" | "cuisines">(
    key: K,
    value: K extends "restrictions" ? Restriction : K extends "cuisines" ? Cuisine : Taste,
  ): void {
    setFlavor((f) => {
      const arr = [...(f[key] as readonly (string | Taste | Cuisine | Restriction)[])];
      const idx = arr.indexOf(value as never);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value as never);
      return { ...f, [key]: arr } as FlavorPreference;
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" data-testid="dialog-profile">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-[1.4rem] tracking-tight">
            <UserCircle2 className="h-5 w-5 text-primary" /> 我的档案
          </DialogTitle>
          <DialogDescription>
            个性化、档案、口味、饮食计划与环境设置都保存在<span className="font-medium text-foreground"> 你的浏览器本地</span>，不上传任何服务器；首次进入弹窗与这里编辑的是<span className="font-medium text-foreground">同一份数据</span>。
          </DialogDescription>
        </DialogHeader>

        {!persistent && (
          <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12.5px] text-foreground/85">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
            <span>当前浏览器禁用了本地存储（隐私模式或沙箱预览），档案只在本次会话内有效，刷新页面会丢失。</span>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setTab(v as ProfileTab)} className="mt-1">
          {/* 小屏 2 列 / 中屏 3 列 / 桌面 5 列 */}
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="persona" data-testid="tab-persona">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> 个性化
            </TabsTrigger>
            <TabsTrigger value="account" data-testid="tab-account">
              <UserCircle2 className="mr-1 h-3.5 w-3.5" /> 档案
            </TabsTrigger>
            <TabsTrigger value="flavor" data-testid="tab-flavor">
              <Heart className="mr-1 h-3.5 w-3.5" /> 喜好
            </TabsTrigger>
            <TabsTrigger value="plan" data-testid="tab-plan">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> 饮食计划
            </TabsTrigger>
            <TabsTrigger value="env" data-testid="tab-env">
              <Cloud className="mr-1 h-3.5 w-3.5" /> 环境
            </TabsTrigger>
          </TabsList>

          {/* === 个性化 === */}
          <TabsContent value="persona" className="mt-4 space-y-4" data-testid="tab-content-persona">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[12px] text-emerald-800 dark:text-emerald-200">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" />
              你在「首次个性化弹窗」选择的内容会保存到这里；之后点「个性化」或在档案对话框打开「个性化」Tab 都是同一份数据，可继续修改。
            </div>

            {/* 角色 */}
            <div>
              <Label className="text-[13px] font-medium">你是谁 / 主要使用目的</Label>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">单选；用于推荐入口跳转和场景预设</p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ROLES.map((r) => {
                  const active = persona.role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => patchPersona({ role: r.id })}
                      data-testid={`persona-role-${r.id}`}
                      className={`group flex h-full flex-col items-start gap-1 rounded-xl border px-3 py-2 text-left transition-all hover-elevate active-elevate-2 ${
                        active ? "border-primary/60 bg-primary/10" : "border-border bg-card/60"
                      }`}
                    >
                      <span className="text-lg" aria-hidden>{r.emoji}</span>
                      <span className="font-display text-[13.5px] tracking-tight">{r.label}</span>
                      <span className="text-[11px] text-muted-foreground">{r.description}</span>
                    </button>
                  );
                })}
                {persona.role && (
                  <button
                    type="button"
                    onClick={() => patchPersona({ role: undefined })}
                    data-testid="persona-role-clear"
                    className="rounded-xl border border-dashed border-border/60 px-3 py-2 text-[12px] text-muted-foreground hover-elevate active-elevate-2"
                  >
                    清除选择
                  </button>
                )}
              </div>
            </div>

            {/* 心情 */}
            <div>
              <Label className="text-[13px] font-medium">现在心情 / 节奏（多选）</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {MOODS.map((m) => {
                  const active = persona.moods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => patchPersona({ moods: togglePersonaArr<MoodId>(persona.moods, m.id) })}
                      data-testid={`persona-mood-${m.id}`}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                        active ? "border-primary/60 bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/85"
                      }`}
                    >
                      <span aria-hidden>{m.emoji}</span>
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 健康关注 */}
            <div>
              <Label className="text-[13px] font-medium">健康关注（多选；软偏好，不构成医疗建议）</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {HEALTH_FOCUS.map((h) => {
                  const active = persona.healthFocus.includes(h.id);
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => patchPersona({ healthFocus: togglePersonaArr<HealthFocusId>(persona.healthFocus, h.id) })}
                      data-testid={`persona-health-${h.id}`}
                      title={h.hint || undefined}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] transition-colors ${
                        active ? "border-primary/60 bg-primary text-primary-foreground" : "border-border bg-card/60 text-foreground/85"
                      }`}
                    >
                      <span aria-hidden>{h.emoji}</span>
                      <span>{h.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 基础数值 */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-[11.5px] text-muted-foreground">性别</Label>
                <div className="mt-1 inline-flex w-full overflow-hidden rounded-md border border-border">
                  {PERSONA_SEX_OPTIONS.map((s) => {
                    const active = persona.sex === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => patchPersona({ sex: s.id })}
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
                  onChange={(e) => patchPersona({ ageBand: (e.target.value || undefined) as AgeBand })}
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
                  onChange={(e) => patchPersona({ servings: e.target.value ? Math.max(1, Math.min(12, +e.target.value)) : undefined })}
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
                  onChange={(e) => patchPersona({ heightCm: e.target.value ? +e.target.value : undefined })}
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
                  onChange={(e) => patchPersona({ weightKg: e.target.value ? +e.target.value : undefined })}
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
                  onChange={(e) => patchPersona({ targetWeightKg: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-target"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">省份</Label>
                <Input
                  value={persona.province ?? ""}
                  placeholder="如 广东"
                  onChange={(e) => patchPersona({ province: e.target.value || undefined })}
                  data-testid="persona-province"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
              <div>
                <Label className="text-[11.5px] text-muted-foreground">城市</Label>
                <Input
                  value={persona.city ?? ""}
                  placeholder="如 广州"
                  onChange={(e) => patchPersona({ city: e.target.value || undefined })}
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
                  onChange={(e) => patchPersona({ budgetPerMeal: e.target.value ? +e.target.value : undefined })}
                  data-testid="persona-budget"
                  className="mt-1 h-8 text-[12.5px]"
                />
              </div>
            </div>

            {(personaPlan.bmi || personaPlan.dailyKcal) && (
              <div
                className="rounded-md border border-amber-300/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
                data-testid="persona-plan-estimate"
              >
                <span className="block font-medium">仅供参考的粗略估算</span>
                <span className="mt-0.5 inline-flex flex-wrap gap-x-3 gap-y-1 num">
                  {personaPlan.bmi && <span>BMI {personaPlan.bmi}</span>}
                  {personaPlan.bmr && <span>BMR ≈ {personaPlan.bmr} kcal</span>}
                  {personaPlan.tdeeRough && <span>每日活动 ≈ {personaPlan.tdeeRough} kcal</span>}
                  {personaPlan.dailyKcal && <span>建议摄入 ≈ {personaPlan.dailyKcal} kcal</span>}
                </span>
                <span className="mt-1 block text-[11px]">
                  公式：Mifflin-St Jeor + 轻度活动系数；不是医学/营养诊断。
                </span>
              </div>
            )}
          </TabsContent>

          {/* === 账户 === */}
          <TabsContent value="account" className="mt-4 space-y-4">
            <div>
              <Label htmlFor="nickname">输入昵称创建本地档案</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例：阿喵"
                  maxLength={24}
                  data-testid="input-nickname"
                />
                <Button onClick={onCreate} data-testid="button-create-profile" className="rounded-full">
                  <Plus className="mr-1 h-4 w-4" /> 创建/登录
                </Button>
              </div>
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                这是一个原型，本地账户没有密码、不上传，纯粹为了把你的口味/身体信息保存下来。需要真实跨设备登录可以接 Supabase Auth / Clerk 等服务（路线图里有）。
              </p>
            </div>
            <Separator />
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>已有档案</Label>
                {active && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                    data-testid="button-logout"
                    className="h-8 text-muted-foreground"
                  >
                    <LogOut className="mr-1 h-3.5 w-3.5" /> 退出当前
                  </Button>
                )}
              </div>
              {profiles.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无档案。无档案时也能用，推荐会按通用偏好。</p>
              )}
              <ul className="space-y-2">
                {profiles.map((p) => (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                      active?.id === p.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-border bg-card/40"
                    }`}
                    data-testid={`profile-row-${p.id}`}
                  >
                    <div>
                      <div className="font-medium">{p.nickname}</div>
                      <div className="text-[11px] text-muted-foreground">
                        创建于 {new Date(p.createdAt).toLocaleDateString("zh-CN")}
                        {p.body ? ` · ${p.body.heightCm}cm/${p.body.weightKg}kg` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {active?.id !== p.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSwitch(p.id)}
                          className="rounded-full"
                          data-testid={`button-switch-${p.id}`}
                        >
                          切换
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(p.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        data-testid={`button-delete-${p.id}`}
                        aria-label="删除档案"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* === 喜好 === */}
          <TabsContent value="flavor" className="mt-4 space-y-5">
            {!active && (
              <p className="text-sm text-muted-foreground">先在「档案」页创建本地档案，喜好才能跨刷新保存。</p>
            )}
            <div>
              <Label className="text-sm font-medium">喜欢的口味</Label>
              <p className="mt-1 text-[11.5px] text-muted-foreground">命中即加分</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_TASTES.map((t) => (
                  <Chip
                    key={t}
                    active={flavor.liked.includes(t)}
                    onClick={() => toggleFlavorList("liked", t)}
                    testId={`chip-liked-${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">不喜欢的口味</Label>
              <p className="mt-1 text-[11.5px] text-muted-foreground">命中扣分（不强制过滤）</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_TASTES.map((t) => (
                  <Chip
                    key={t}
                    active={flavor.disliked.includes(t)}
                    onClick={() => toggleFlavorList("disliked", t)}
                    testId={`chip-disliked-${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">偏好菜系</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_CUISINES.map((c) => (
                  <Chip
                    key={c}
                    active={flavor.cuisines.includes(c)}
                    onClick={() => toggleFlavorList("cuisines", c)}
                    testId={`chip-pref-cuisine-${c}`}
                  >
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">忌口（硬性过滤）</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ALL_RESTRICTIONS.map((r) => (
                  <Chip
                    key={r}
                    active={flavor.restrictions.includes(r)}
                    onClick={() => toggleFlavorList("restrictions", r)}
                    testId={`chip-pref-restriction-${r}`}
                  >
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* === 饮食计划 === */}
          <TabsContent value="plan" className="mt-4 space-y-5">
            <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[12px] text-foreground/85">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span>
                以下数值<span className="font-medium">仅作饮食规划参考，不构成医学/营养建议</span>。
                公式：Mifflin-St Jeor。如需精确建议请咨询专业人士。
              </span>
            </div>

            {!active && (
              <p className="text-sm text-muted-foreground">先在「档案」创建本地档案，才能保存身体数据。</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="sex">性别</Label>
                <Select
                  value={body?.sex ?? "female"}
                  onValueChange={(v) =>
                    setBody({
                      sex: v as Sex,
                      age: body?.age ?? 28,
                      heightCm: body?.heightCm ?? 165,
                      weightKg: body?.weightKg ?? 60,
                      activity: body?.activity ?? "light",
                      goal: body?.goal ?? "maintain",
                    })
                  }
                >
                  <SelectTrigger id="sex" data-testid="select-sex">
                    <SelectValue placeholder="请选择" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">女</SelectItem>
                    <SelectItem value="male">男</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">年龄</Label>
                <Input
                  id="age"
                  type="number"
                  min={10}
                  max={100}
                  value={body?.age ?? 28}
                  onChange={(e) =>
                    setBody((b) => ({
                      sex: b?.sex ?? "female",
                      age: Number(e.target.value) || 28,
                      heightCm: b?.heightCm ?? 165,
                      weightKg: b?.weightKg ?? 60,
                      activity: b?.activity ?? "light",
                      goal: b?.goal ?? "maintain",
                    }))
                  }
                  data-testid="input-age"
                />
              </div>
              <div>
                <Label htmlFor="height">身高 cm</Label>
                <Input
                  id="height"
                  type="number"
                  min={120}
                  max={220}
                  value={body?.heightCm ?? 165}
                  onChange={(e) =>
                    setBody((b) => ({
                      sex: b?.sex ?? "female",
                      age: b?.age ?? 28,
                      heightCm: Number(e.target.value) || 165,
                      weightKg: b?.weightKg ?? 60,
                      activity: b?.activity ?? "light",
                      goal: b?.goal ?? "maintain",
                    }))
                  }
                  data-testid="input-height"
                />
              </div>
              <div>
                <Label htmlFor="weight">体重 kg</Label>
                <Input
                  id="weight"
                  type="number"
                  min={30}
                  max={200}
                  value={body?.weightKg ?? 60}
                  onChange={(e) =>
                    setBody((b) => ({
                      sex: b?.sex ?? "female",
                      age: b?.age ?? 28,
                      heightCm: b?.heightCm ?? 165,
                      weightKg: Number(e.target.value) || 60,
                      activity: b?.activity ?? "light",
                      goal: b?.goal ?? "maintain",
                    }))
                  }
                  data-testid="input-weight"
                />
              </div>
              <div className="col-span-2">
                <Label>活动水平</Label>
                <Select
                  value={body?.activity ?? "light"}
                  onValueChange={(v) =>
                    setBody((b) => ({
                      sex: b?.sex ?? "female",
                      age: b?.age ?? 28,
                      heightCm: b?.heightCm ?? 165,
                      weightKg: b?.weightKg ?? 60,
                      activity: v as ActivityLevel,
                      goal: b?.goal ?? "maintain",
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-activity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                      <SelectItem key={k} value={k}>{ACTIVITY_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>目标</Label>
                <Select
                  value={body?.goal ?? "maintain"}
                  onValueChange={(v) =>
                    setBody((b) => ({
                      sex: b?.sex ?? "female",
                      age: b?.age ?? 28,
                      heightCm: b?.heightCm ?? 165,
                      weightKg: b?.weightKg ?? 60,
                      activity: b?.activity ?? "light",
                      goal: v as GoalType,
                    }))
                  }
                >
                  <SelectTrigger data-testid="select-goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(GOAL_LABELS) as GoalType[]).map((k) => (
                      <SelectItem key={k} value={k}>{GOAL_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>当前餐次</Label>
                <Select value={slot} onValueChange={(v) => setSlot(v as MealSlot)}>
                  <SelectTrigger data-testid="select-slot">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SLOT_LABELS) as MealSlot[]).map((k) => (
                      <SelectItem key={k} value={k}>{SLOT_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/50 px-3 py-2.5">
              <div>
                <Label htmlFor="plan-enable" className="text-sm">启用饮食计划</Label>
                <p className="text-[11.5px] text-muted-foreground">推荐时把人均热量与餐次目标对齐</p>
              </div>
              <input
                id="plan-enable"
                type="checkbox"
                checked={planEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setPlanEnabled(enabled);
                  if (enabled && !body) {
                    setBody({
                      sex: "female",
                      age: 28,
                      heightCm: 165,
                      weightKg: 60,
                      activity: "light",
                      goal: "maintain",
                    });
                  }
                }}
                data-testid="checkbox-plan-enable"
                className="h-5 w-5 accent-primary"
              />
            </div>

            {plan && (
              <div className="grid grid-cols-3 gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3" data-testid="panel-plan-summary">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">BMR</div>
                  <div className="font-display text-[1.2rem] num">{plan.bmr}<span className="ml-1 text-xs text-muted-foreground">kcal</span></div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">TDEE</div>
                  <div className="font-display text-[1.2rem] num">{plan.tdee}<span className="ml-1 text-xs text-muted-foreground">kcal</span></div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground">每日目标</div>
                  <div className="font-display text-[1.2rem] num text-primary">{plan.targetCalories}<span className="ml-1 text-xs text-muted-foreground">kcal</span></div>
                </div>
                <div className="col-span-3 mt-1 rounded-md bg-card/60 px-2 py-1.5 text-[12px]">
                  <span className="text-muted-foreground">{SLOT_LABELS[plan.slot]} 占 {Math.round(plan.slotShare * 100)}%</span>
                  <span className="ml-2 font-medium text-primary">≈ {plan.mealCalories} kcal</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* === 环境 === */}
          <TabsContent value="env" className="mt-4 space-y-5">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[13px] font-medium text-primary">
                    <MapPin className="h-3.5 w-3.5" /> 使用当前位置自动填充
                  </div>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    通过浏览器定位 + Open-Meteo 公开天气 API（无需 key）。
                    <span className="font-medium text-foreground">必须先授权</span>，拒绝/失败时回退到下方手动选择。
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUseMyLocation}
                  disabled={locating}
                  data-testid="button-locate"
                  className="shrink-0 rounded-full"
                >
                  {locating ? (
                    <>
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> 定位中...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-1 h-3.5 w-3.5" /> 定位
                    </>
                  )}
                </Button>
              </div>
              {locateMsg && (
                <p className="mt-2 text-[11.5px] text-muted-foreground" data-testid="text-locate-msg">
                  {locateMsg}
                </p>
              )}
            </div>

            <p className="text-[12.5px] text-muted-foreground">
              这些选项会把今天的天气/季节/地区加入推荐评分（不强制过滤）。
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>省份 / 直辖市</Label>
                <Select
                  value={envDraft.province ?? "__none__"}
                  onValueChange={(v) => {
                    const province = v === "__none__" ? undefined : v;
                    const def = findProvinceByName(province);
                    setEnvDraft({
                      ...envDraft,
                      province,
                      city: def && !def.cities.includes(envDraft.city ?? "")
                        ? def.cities[0]
                        : envDraft.city,
                      autoFilled: false,
                    });
                  }}
                >
                  <SelectTrigger data-testid="select-province">
                    <SelectValue placeholder="未指定" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">未指定</SelectItem>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p.province} value={p.province}>{p.province}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>城市</Label>
                <Select
                  value={envDraft.city ?? "__none__"}
                  onValueChange={(v) =>
                    setEnvDraft({
                      ...envDraft,
                      city: v === "__none__" ? undefined : v,
                      autoFilled: false,
                    })
                  }
                  disabled={!currentProvince}
                >
                  <SelectTrigger data-testid="select-city">
                    <SelectValue placeholder={currentProvince ? "选择城市" : "先选省份"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">未指定</SelectItem>
                    {currentProvince?.cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>天气</Label>
                <Select
                  value={envDraft.weather}
                  onValueChange={(v) => setEnvDraft({ ...envDraft, weather: v as Weather, autoFilled: false })}
                >
                  <SelectTrigger data-testid="select-weather">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_WEATHERS.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>季节</Label>
                <Select
                  value={envDraft.seasonOverride ?? "auto"}
                  onValueChange={(v) =>
                    setEnvDraft({
                      ...envDraft,
                      seasonOverride: v === "auto" ? undefined : (v as Season),
                    })
                  }
                >
                  <SelectTrigger data-testid="select-season">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动 ({inferSeason()})</SelectItem>
                    {ALL_SEASONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>日期类型</Label>
                <Select
                  value={envDraft.dayKindOverride ?? "auto"}
                  onValueChange={(v) =>
                    setEnvDraft({
                      ...envDraft,
                      dayKindOverride:
                        v === "auto" ? undefined : (v as "weekday" | "weekend"),
                    })
                  }
                >
                  <SelectTrigger data-testid="select-daykind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动 ({inferDayKind() === "weekend" ? "周末" : "工作日"})</SelectItem>
                    <SelectItem value="weekday">工作日</SelectItem>
                    <SelectItem value="weekend">周末</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg border border-border/60 bg-card/40 p-3 text-[12.5px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> 今天 {new Date().toLocaleDateString("zh-CN")}
                {envDraft.temperatureC !== undefined && (
                  <span className="ml-2 num text-foreground">{envDraft.temperatureC}°C</span>
                )}
              </div>
              <div className="mt-1">
                推荐会偏向：
                {envDraft.weather === "热" && <Badge variant="secondary" className="ml-1">凉爽 / 解暑</Badge>}
                {envDraft.weather === "冷" && <Badge variant="secondary" className="ml-1">暖胃 / 慢炖</Badge>}
                {envDraft.weather === "雨" && <Badge variant="secondary" className="ml-1">暖胃 / 汤</Badge>}
                {envDraft.province && <Badge variant="secondary" className="ml-1">{envDraft.province} 本地菜系</Badge>}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 flex-col-reverse gap-2 border-t border-border/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={onClose} data-testid="button-close-profile" className="w-full sm:w-auto">
            关闭
          </Button>
          <div className="flex gap-2">
            {tab === "persona" ? (
              <Button
                onClick={savePersonaTab}
                data-testid="button-save-persona"
                className="w-full sm:w-auto"
              >
                <Save className="mr-1 h-4 w-4" /> 保存个性化
              </Button>
            ) : tab === "env" ? (
              <Button onClick={() => { saveEnv(); }} data-testid="button-save-env" className="w-full sm:w-auto">
                <Save className="mr-1 h-4 w-4" /> 应用环境
              </Button>
            ) : tab !== "account" ? (
              <Button
                onClick={saveCurrent}
                disabled={!active}
                data-testid="button-save-profile"
                className="w-full sm:w-auto"
              >
                <Save className="mr-1 h-4 w-4" /> 保存到本地档案
              </Button>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
