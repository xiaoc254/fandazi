// F1 — 家庭成员口味协调 主面板
// 复用统一档案：「我」可一键从 Profile 同步；其余成员手动添加，最多 6 人
// 推荐结果接入家庭兼容评分，展示全家兼容/部分兼容/有冲突 标签 + 冲突详情。

import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  UserPlus,
  X,
  Pencil,
  Check,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  Power,
  ChefHat,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  type FamilyMember,
  type FamilyRole,
  type HealthGoal,
  ROLE_LABEL,
  ROLE_EMOJI,
  HEALTH_GOAL_LABEL,
  MAX_MEMBERS,
  listMembers,
  createMember,
  updateMember,
  deleteMember,
  toggleActive,
  syncActiveProfileAsMember,
  subscribeFamily,
  rankByFamily,
  evaluateFamilyMatch,
  summarizeConflicts,
  COMMON_DISLIKE_TAGS,
  COMMON_ALLERGEN_TAGS,
} from "@/lib/familyMembers";
import { RECIPES, type Recipe } from "@/data/recipes";
import { loadReactions, subscribeReactions } from "@/lib/reactions";

const ROLE_OPTIONS: FamilyRole[] = ["self", "partner", "child", "elder", "other"];
const HEALTH_GOAL_OPTIONS: HealthGoal[] = ["balanced", "low_fat", "low_salt", "low_sugar", "low_purine", "high_protein", "soft_easy"];

interface FamilyPanelProps {
  onPickRecipe?: (recipe: Recipe) => void;
}

export function FamilyPanel({ onPickRecipe }: FamilyPanelProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<FamilyMember[]>(() => listMembers());
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [draftRole, setDraftRole] = useState<FamilyRole>("partner");
  const [createOpen, setCreateOpen] = useState(false);

  const [reactions, setReactions] = useState(() => loadReactions());

  useEffect(() => {
    const unsub = subscribeFamily(() => setMembers(listMembers()));
    const unsubR = subscribeReactions(() => setReactions(loadReactions()));
    return () => {
      unsub();
      unsubR();
    };
  }, []);

  const activeMembers = members.filter((m) => m.active);

  // 候选菜：限定主菜 + 家常蔬菜（避免甜品干扰）
  const ranked = useMemo(() => {
    const pool = RECIPES.filter((r) => r.course === "main" || r.course === "veggie" || r.course === "soup");
    const liked = new Set<string>();
    reactions.likes.forEach((k) => {
      if (k.startsWith("dish:")) liked.add(k.slice(5));
    });
    const disliked = new Set<string>();
    reactions.dislikes.forEach((k) => {
      if (k.startsWith("dish:")) disliked.add(k.slice(5));
    });
    const list = rankByFamily(pool, activeMembers, { limit: 18 });
    // 用 likes/dislikes 微调：likes +5，dislikes -10（不影响 hard 标签）
    list.forEach((it) => {
      if (liked.has(it.recipe.id)) it.match = { ...it.match, score: Math.min(100, it.match.score + 5) };
      if (disliked.has(it.recipe.id)) it.match = { ...it.match, score: Math.max(0, it.match.score - 12) };
    });
    list.sort((a, b) => b.match.score - a.match.score);
    return list.slice(0, 12);
  }, [activeMembers, reactions]);

  function handleSyncSelf() {
    const m = syncActiveProfileAsMember();
    if (m) {
      setMembers(listMembers());
      toast({ title: "已把我同步进家庭", description: "可以再编辑细化口味" });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[1.45rem] tracking-tight">
            <UsersRound className="mr-1 inline h-5 w-5 text-primary" /> 家庭口味协调
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            一家人各有偏好。这里登记口味、忌口、健康目标，推荐结果会自动算「全家能不能一起吃」。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleSyncSelf} data-testid="btn-family-sync-self">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            把我同步进来
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (members.length >= MAX_MEMBERS) {
                toast({ title: "已达上限", description: `最多 ${MAX_MEMBERS} 位成员` });
                return;
              }
              setEditingMember(null);
              setDraftRole("partner");
              setCreateOpen(true);
            }}
            disabled={members.length >= MAX_MEMBERS}
            data-testid="btn-family-add"
          >
            <UserPlus className="mr-1.5 h-3.5 w-3.5" /> 添加成员
          </Button>
        </div>
      </header>

      {/* 成员卡列表 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-[1.05rem]">家庭成员（{members.length}/{MAX_MEMBERS}）</h2>
          {activeMembers.length > 0 && (
            <span className="text-[11.5px] text-muted-foreground">参与本次推荐 · {activeMembers.length} 人</span>
          )}
        </div>

        {members.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <span className="text-3xl">🍱</span>
            <div className="text-[14px] font-medium">还没有家庭成员</div>
            <div className="text-[12.5px] text-muted-foreground">
              点上面「把我同步进来」或「添加成员」开始。<br />
              数据只保存在本地浏览器，不上传。
            </div>
          </Card>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {members.map((m) => (
              <Card
                key={m.id}
                className={`relative px-4 py-3 ${m.active ? "" : "opacity-60"}`}
                data-testid={`family-member-card-${m.id}`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-3xl leading-none">{m.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold">{m.name}</span>
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {ROLE_LABEL[m.role]}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10.5px] text-muted-foreground">
                      {m.allergicIngredients.map((a) => (
                        <span key={`a-${a}`} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-rose-600">不能吃·{a}</span>
                      ))}
                      {m.dislikedIngredients.map((d) => (
                        <span key={`d-${d}`} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700">不爱·{d}</span>
                      ))}
                      {m.healthGoals.filter((g) => g !== "balanced").map((g) => (
                        <span key={`h-${g}`} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700">
                          {HEALTH_GOAL_LABEL[g]}
                        </span>
                      ))}
                      {m.allergicIngredients.length === 0 && m.dislikedIngredients.length === 0 && m.healthGoals.filter((g) => g !== "balanced").length === 0 && (
                        <span className="text-muted-foreground/70">无忌口 · 通吃</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Switch
                      checked={m.active}
                      onCheckedChange={() => toggleActive(m.id)}
                      aria-label={`${m.name} 是否参与`}
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMember(m);
                          setDraftRole(m.role);
                          setCreateOpen(true);
                        }}
                        className="rounded-md border px-1.5 py-0.5 text-[11px] hover-elevate active-elevate-2"
                        title="编辑"
                        aria-label={`编辑 ${m.name}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`确认删除「${m.name}」？`)) deleteMember(m.id);
                        }}
                        className="rounded-md border px-1.5 py-0.5 text-[11px] hover-elevate active-elevate-2"
                        title="删除"
                        aria-label={`删除 ${m.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 兼容推荐结果 */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-display text-[1.05rem]">家庭兼容推荐</h2>
          <span className="text-[11.5px] text-muted-foreground">基于已激活成员</span>
        </div>

        {activeMembers.length === 0 ? (
          <Card className="px-4 py-8 text-center text-[13px] text-muted-foreground">
            激活至少一位成员后查看推荐
          </Card>
        ) : (
          <div className="space-y-2">
            {ranked.map((item) => (
              <FamilyRecipeCard
                key={item.recipe.id}
                recipe={item.recipe}
                match={item.match}
                onPick={() => onPickRecipe?.(item.recipe)}
              />
            ))}
            {ranked.length === 0 && (
              <Card className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                没有找到合适的菜。试试关闭一些过敏/忌口选项。
              </Card>
            )}
          </div>
        )}
      </section>

      <p className="text-[11px] text-muted-foreground/80">
        ⚠️ 评分基于菜名、食材关键字与口味标签做近似匹配，仅作参考；过敏与严格忌口请最终自行确认。
      </p>

      <MemberEditor
        open={createOpen}
        onOpenChange={setCreateOpen}
        editing={editingMember}
        defaultRole={draftRole}
        onSubmit={(values, id) => {
          if (id) {
            updateMember(id, values);
            toast({ title: "已更新", description: values.name ?? "" });
          } else {
            const m = createMember(values as any);
            if (m) toast({ title: "已添加", description: m.name });
          }
          setCreateOpen(false);
          setEditingMember(null);
        }}
      />
    </div>
  );
}

interface MemberEditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: FamilyMember | null;
  defaultRole: FamilyRole;
  onSubmit: (values: Partial<FamilyMember>, id?: string) => void;
}

function MemberEditor({ open, onOpenChange, editing, defaultRole, onSubmit }: MemberEditorProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<FamilyRole>(defaultRole);
  const [emoji, setEmoji] = useState("🙂");
  const [disliked, setDisliked] = useState<string[]>([]);
  const [allergic, setAllergic] = useState<string[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [customDislike, setCustomDislike] = useState("");
  const [customAllergic, setCustomAllergic] = useState("");

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setRole(editing.role);
        setEmoji(editing.emoji);
        setDisliked(editing.dislikedIngredients);
        setAllergic(editing.allergicIngredients);
        setGoals(editing.healthGoals);
      } else {
        setName("");
        setRole(defaultRole);
        setEmoji(ROLE_EMOJI[defaultRole]);
        setDisliked([]);
        setAllergic([]);
        setGoals([]);
      }
      setCustomDislike("");
      setCustomAllergic("");
    }
  }, [open, editing, defaultRole]);

  function toggleArr<T>(arr: T[], v: T): T[] {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "编辑成员" : "添加家庭成员"}</DialogTitle>
          <DialogDescription>
            登记昵称 / 角色 / 忌口 / 健康目标。这些会用于推荐时的兼容评分。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">昵称（最多 6 字）</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 6))}
                placeholder={ROLE_LABEL[role]}
                data-testid="input-family-name"
              />
            </div>
            <div>
              <Label className="text-xs">角色</Label>
              <div className="mt-1 flex flex-wrap gap-1">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setEmoji(ROLE_EMOJI[r]);
                    }}
                    className={`rounded-full border px-2.5 py-1 text-[11.5px] hover-elevate active-elevate-2 ${
                      role === r ? "border-primary bg-primary/10 text-primary" : ""
                    }`}
                    data-testid={`chip-role-${r}`}
                  >
                    {ROLE_EMOJI[r]} {ROLE_LABEL[r]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs">绝对不吃 / 过敏（硬过滤）</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {COMMON_ALLERGEN_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setAllergic((arr) => toggleArr(arr, tag))}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] hover-elevate active-elevate-2 ${
                    allergic.includes(tag) ? "border-rose-500 bg-rose-500/10 text-rose-700" : ""
                  }`}
                >
                  {tag}
                </button>
              ))}
              {allergic.filter((a) => !COMMON_ALLERGEN_TAGS.includes(a)).map((a) => (
                <span key={a} className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-1 text-[11.5px] text-rose-700">
                  {a}
                  <button type="button" onClick={() => setAllergic((arr) => arr.filter((x) => x !== a))} aria-label={`移除 ${a}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <Input
                value={customAllergic}
                onChange={(e) => setCustomAllergic(e.target.value)}
                placeholder="自定义食材，回车添加"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = customAllergic.trim();
                    if (v) {
                      setAllergic((arr) => Array.from(new Set([...arr, v])));
                      setCustomAllergic("");
                    }
                  }
                }}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">不爱吃（软扣分）</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {COMMON_DISLIKE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setDisliked((arr) => toggleArr(arr, tag))}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] hover-elevate active-elevate-2 ${
                    disliked.includes(tag) ? "border-amber-500 bg-amber-500/10 text-amber-700" : ""
                  }`}
                >
                  {tag}
                </button>
              ))}
              {disliked.filter((d) => !COMMON_DISLIKE_TAGS.includes(d)).map((d) => (
                <span key={d} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11.5px] text-amber-700">
                  {d}
                  <button type="button" onClick={() => setDisliked((arr) => arr.filter((x) => x !== d))} aria-label={`移除 ${d}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              className="mt-1"
              value={customDislike}
              onChange={(e) => setCustomDislike(e.target.value)}
              placeholder="自定义食材，回车添加"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = customDislike.trim();
                  if (v) {
                    setDisliked((arr) => Array.from(new Set([...arr, v])));
                    setCustomDislike("");
                  }
                }
              }}
            />
          </div>

          <div>
            <Label className="text-xs">健康目标（可多选）</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {HEALTH_GOAL_OPTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoals((arr) => toggleArr(arr, g))}
                  className={`rounded-full border px-2.5 py-1 text-[11.5px] hover-elevate active-elevate-2 ${
                    goals.includes(g) ? "border-emerald-500 bg-emerald-500/10 text-emerald-700" : ""
                  }`}
                >
                  {HEALTH_GOAL_LABEL[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onSubmit(
                {
                  name: name.trim() || ROLE_LABEL[role],
                  role,
                  emoji,
                  dislikedIngredients: disliked,
                  allergicIngredients: allergic,
                  healthGoals: goals.length > 0 ? goals : ["balanced"],
                  active: true,
                },
                editing?.id,
              );
            }}
            data-testid="btn-family-save"
          >
            <Check className="mr-1 h-3.5 w-3.5" /> 保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FamilyRecipeCardProps {
  recipe: Recipe;
  match: ReturnType<typeof evaluateFamilyMatch>;
  onPick: () => void;
}

function FamilyRecipeCard({ recipe, match, onPick }: FamilyRecipeCardProps) {
  const [expanded, setExpanded] = useState(false);

  const levelStyle =
    match.level === "green"
      ? "border-emerald-200 bg-emerald-50/60"
      : match.level === "amber"
      ? "border-amber-200 bg-amber-50/60"
      : "border-rose-200 bg-rose-50/60";

  const tagText = match.level === "green" ? "全家兼容" : match.level === "amber" ? "部分兼容" : "有冲突";
  const tagIcon = match.level === "green" ? <ShieldCheck className="h-3 w-3" /> : match.level === "red" ? <AlertTriangle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />;

  return (
    <Card className={`overflow-hidden border ${levelStyle}`}>
      <button
        type="button"
        onClick={onPick}
        className="block w-full px-4 py-3 text-left hover-elevate active-elevate-2"
        data-testid={`family-recipe-${recipe.id}`}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">{recipe.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {recipe.cuisine}
              </Badge>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium" style={{
                background: match.level === "green" ? "#10b98120" : match.level === "red" ? "#ef444420" : "#f59e0b20",
                color: match.level === "green" ? "#047857" : match.level === "red" ? "#b91c1c" : "#b45309",
              }}>
                {tagIcon} {tagText} {match.score}
              </span>
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />{recipe.timeMinutes} 分钟 · {recipe.difficulty} · {summarizeConflicts(match)}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
      {match.conflicts.length > 0 && (
        <div className="border-t bg-white/60 px-4 py-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            {expanded ? "收起" : "看看具体谁的问题"}
          </button>
          {expanded && (
            <div className="mt-1 space-y-0.5 text-[11.5px]">
              {match.conflicts.map((c) => (
                <div key={c.memberId} className="flex items-start gap-1">
                  <span className="mt-0.5">{c.emoji}</span>
                  <span className="font-medium">{c.memberName}</span>
                  <span className={c.hard ? "text-rose-600" : "text-amber-700"}>
                    {c.hard ? "（不能吃）" : "（不爱）"}
                    {c.reasons.join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
