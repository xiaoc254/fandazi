// 云端同步预留：检测 Supabase env，未配置则 no-op，配置则可调用同步。
// 设计原则：
//  - 默认所有档案/收藏/历史都本地保存（localStorage），不依赖云端。
//  - 如果用户配置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY，
//    则可以通过「云端同步 Beta」入口启用账号 + 跨设备同步。
//  - 没配置时，所有云端 API 返回 { ok: false, reason: "未配置" }，UI 会引导。
//  - 任何网络错误都不会阻塞本地功能。

import type { Profile } from "./profile";
import type { HistoryEntry } from "./history";

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface CloudUser {
  id: string;
  email?: string;
  nickname?: string;
}

export interface CloudSyncStatus {
  configured: boolean;
  ready: boolean;
  reason?: string;
  user?: CloudUser;
}

let _client: any = null;
let _config: CloudConfig | null = null;

/** 读取构建时注入的 Vite env。安全：未配置返回 null。 */
function readConfig(): CloudConfig | null {
  // import.meta.env 在 Vite 静态构建里被注入；运行时 fallback to null。
  const env = (import.meta as any).env ?? {};
  const url = env.VITE_SUPABASE_URL as string | undefined;
  const key = env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  // 简单格式校验：URL 看起来像 https://xxx.supabase.co
  if (!/^https?:\/\//.test(url)) return null;
  if (key.length < 20) return null;
  return { supabaseUrl: url, supabaseAnonKey: key };
}

export function isConfigured(): boolean {
  return readConfig() !== null;
}

export function getConfigStatus(): CloudSyncStatus {
  const cfg = readConfig();
  if (!cfg) {
    return {
      configured: false,
      ready: false,
      reason:
        "未配置 Supabase（VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）。本地数据仍然完全可用，刷新不丢。",
    };
  }
  return { configured: true, ready: !!_client };
}

/** 懒加载 Supabase 客户端（仅在配置存在时才 import）。 */
async function ensureClient() {
  if (_client) return _client;
  const cfg = readConfig();
  if (!cfg) return null;
  try {
    const mod = await import("@supabase/supabase-js");
    _client = mod.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "chishenme.cloud.auth.v1",
      },
    });
    _config = cfg;
    return _client;
  } catch (e) {
    return null;
  }
}

/** 触发邮件 OTP 登录（无密码）。未配置则返回未配置错误。 */
export async function signInWithOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const c = await ensureClient();
  if (!c) return { ok: false, error: "未配置 Supabase（仅本地模式可用）" };
  try {
    const { error } = await c.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "未知错误" };
  }
}

export async function signOut(): Promise<void> {
  const c = await ensureClient();
  if (!c) return;
  try {
    await c.auth.signOut();
  } catch {
    // ignore
  }
}

export async function getCurrentUser(): Promise<CloudUser | null> {
  const c = await ensureClient();
  if (!c) return null;
  try {
    const { data } = await c.auth.getUser();
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      nickname: (data.user.user_metadata as any)?.nickname,
    };
  } catch {
    return null;
  }
}

/** 上行：把本地档案/收藏/历史推到云端。未配置则 no-op。 */
export async function pushSnapshot(payload: {
  profile?: Profile | null;
  favorites?: string[];
  history?: HistoryEntry[];
}): Promise<{ ok: boolean; error?: string }> {
  const c = await ensureClient();
  if (!c) return { ok: false, error: "未配置 Supabase" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "未登录云端账号" };
  try {
    const { error } = await c.from("user_state").upsert({
      user_id: user.id,
      profile: payload.profile ?? null,
      favorites: payload.favorites ?? [],
      history: payload.history ?? [],
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "推送失败" };
  }
}

export async function pullSnapshot(): Promise<{
  ok: boolean;
  data?: { profile?: Profile | null; favorites?: string[]; history?: HistoryEntry[] };
  error?: string;
}> {
  const c = await ensureClient();
  if (!c) return { ok: false, error: "未配置 Supabase" };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "未登录云端账号" };
  try {
    const { data, error } = await c
      .from("user_state")
      .select("profile,favorites,history")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data ?? {} };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "拉取失败" };
  }
}

export const SETUP_GUIDE_URL =
  "https://github.com/meimengchengzhen/jin-tian-chi-shenme/blob/main/docs/supabase.md";
