// 云端同步 Beta 对话框：
//  - 未配置 Supabase env：仅展示说明 + 链接到 docs/supabase.md。
//  - 已配置：邮箱 OTP 登录 / 推送 / 拉取本地档案 + 收藏 + 历史。
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Mail, ArrowDownToLine, ArrowUpFromLine, LogOut, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  isConfigured,
  getCurrentUser,
  signInWithOtp,
  signOut,
  pushSnapshot,
  pullSnapshot,
  SETUP_GUIDE_URL,
  type CloudUser,
} from "@/lib/cloudSync";
import { getActiveProfile } from "@/lib/profile";
import { loadFavorites, loadHistory, saveHistoryEntry, toggleFavorite, type HistoryEntry } from "@/lib/history";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CloudSyncDialog({ open, onClose }: Props) {
  const { toast } = useToast();
  const configured = isConfigured();
  const [user, setUser] = useState<CloudUser | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<null | "login" | "push" | "pull" | "logout">(null);

  useEffect(() => {
    if (!open || !configured) return;
    let cancel = false;
    getCurrentUser().then((u) => {
      if (!cancel) setUser(u);
    });
    return () => {
      cancel = true;
    };
  }, [open, configured]);

  async function onLogin() {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "邮箱格式不对", description: "示例 you@gmail.com", variant: "destructive" });
      return;
    }
    setBusy("login");
    const r = await signInWithOtp(email);
    setBusy(null);
    if (r.ok) {
      toast({ title: "已发送登录邮件", description: "查收邮箱并点击链接完成登录。" });
    } else {
      toast({ title: "登录失败", description: r.error, variant: "destructive" });
    }
  }

  async function onPush() {
    setBusy("push");
    const r = await pushSnapshot({
      profile: getActiveProfile(),
      favorites: Array.from(loadFavorites()),
      history: loadHistory(),
    });
    setBusy(null);
    if (r.ok) toast({ title: "已同步到云端 ✓" });
    else toast({ title: "同步失败", description: r.error, variant: "destructive" });
  }

  async function onPull() {
    setBusy("pull");
    const r = await pullSnapshot();
    setBusy(null);
    if (!r.ok) {
      toast({ title: "拉取失败", description: r.error, variant: "destructive" });
      return;
    }
    if (!r.data) {
      toast({ title: "云端暂无快照", description: "先点「同步到云端」上传一次。" });
      return;
    }
    // 合并：本地不变，把云端 favorite/history append 进来
    const remoteFavs: string[] = r.data.favorites ?? [];
    const localFavs = loadFavorites();
    let added = 0;
    for (const id of remoteFavs) {
      if (!localFavs.has(id)) {
        toggleFavorite(id);
        added++;
      }
    }
    for (const e of r.data.history ?? []) {
      saveHistoryEntry(e as HistoryEntry);
    }
    toast({ title: "已从云端合并", description: `新增收藏 ${added} 道；历史已合并。` });
  }

  async function onLogout() {
    setBusy("logout");
    await signOut();
    setUser(null);
    setBusy(null);
    toast({ title: "已退出云端账号" });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display tracking-tight">
            {configured ? (
              <Cloud className="h-5 w-5 text-primary" />
            ) : (
              <CloudOff className="h-5 w-5 text-muted-foreground" />
            )}
            云端同步 <Badge variant="outline" className="rounded-full border-primary/40 px-2 py-0 text-[10px] text-primary">Beta</Badge>
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            本地档案、收藏、历史 <strong>始终</strong> 完全可用。云端仅用于跨设备同步。
          </DialogDescription>
        </DialogHeader>

        {!configured ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-[13px]" data-testid="cloud-not-configured">
            <p className="font-medium text-foreground/90">未配置云端</p>
            <p className="mt-1 text-foreground/75">
              管理员还没填 <code className="rounded bg-background/60 px-1 num">VITE_SUPABASE_URL</code>{" "}
              和 <code className="rounded bg-background/60 px-1 num">VITE_SUPABASE_ANON_KEY</code>。
              所有数据会继续保存在你的浏览器本地，刷新不丢。
            </p>
            <a
              href={SETUP_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/5 px-3 py-1 text-[12px] text-primary hover-elevate"
              data-testid="link-supabase-setup"
            >
              <ExternalLink className="h-3 w-3" /> 查看 Supabase 接入教程
            </a>
          </div>
        ) : user ? (
          <div className="space-y-3" data-testid="cloud-logged-in">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-[13px]">
              <p className="font-medium">已登录云端账号</p>
              <p className="mt-0.5 text-foreground/75 num">{user.email ?? user.id.slice(0, 8) + "…"}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                onClick={onPush}
                disabled={busy !== null}
                className="rounded-full"
                data-testid="button-cloud-push"
              >
                {busy === "push" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpFromLine className="h-4 w-4" />
                )}
                同步到云端
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onPull}
                disabled={busy !== null}
                className="rounded-full"
                data-testid="button-cloud-pull"
              >
                {busy === "pull" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownToLine className="h-4 w-4" />
                )}
                从云端合并
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              disabled={busy !== null}
              className="w-full rounded-full text-muted-foreground"
              data-testid="button-cloud-logout"
            >
              <LogOut className="mr-1 h-3.5 w-3.5" /> 退出云端账号
            </Button>
          </div>
        ) : (
          <div className="space-y-3" data-testid="cloud-login-form">
            <div>
              <Label htmlFor="cloud-email" className="text-[13px]">邮箱（无需密码，登录链接发到邮箱）</Label>
              <Input
                id="cloud-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="mt-1.5"
                data-testid="input-cloud-email"
              />
            </div>
            <Button
              type="button"
              onClick={onLogin}
              disabled={busy !== null}
              className="w-full rounded-full"
              data-testid="button-cloud-send-otp"
            >
              {busy === "login" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              发送登录邮件
            </Button>
            <p className="text-[11px] text-muted-foreground">
              收到邮件 → 点击链接 → 自动登录到这个浏览器。
              如果不想用云端，关掉这个对话框就好；本地功能完整可用。
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
