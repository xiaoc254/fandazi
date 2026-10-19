-- 今天吃什么 · Supabase 同步 schema
-- 执行：在 Supabase SQL Editor 直接粘贴即可。
-- 注意：依赖 Supabase Auth 自动管理的 auth.users 表。

-- 1) user_profiles：账号 -> 昵称、地区、忌口偏好。
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  province text,
  city text,
  flavor jsonb default '{}'::jsonb,         -- { liked, disliked, restrictions }
  body jsonb,                                -- { sex, age, height, weight, activity }
  slot text default 'dinner',               -- breakfast | lunch | dinner
  plan_enabled boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2) user_state：聚合存储（用于 cloudSync.pushSnapshot/pullSnapshot 一键同步）
create table if not exists public.user_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb,
  favorites jsonb default '[]'::jsonb,       -- recipe id 数组
  history jsonb default '[]'::jsonb,         -- HistoryEntry 数组
  preferences jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 3) favorites：分条存储，方便日后跨设备 diff。
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id text not null,
  added_at timestamptz default now(),
  primary key (user_id, recipe_id)
);

-- 4) history：每次「就吃这个了」事件
create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_ids text[] not null default '{}',
  names text[] not null default '{}',
  slot text,
  scenario text,
  created_at timestamptz default now()
);

-- 5) preferences（场景/隐私设置等）
create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  scenario text default 'family-dinner',
  block_sensitive boolean default true,
  hot_source text default 'weibo',
  no_repeat boolean default false,
  updated_at timestamptz default now()
);

-- ===== Row-Level Security =====
alter table public.user_profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.favorites enable row level security;
alter table public.history enable row level security;
alter table public.preferences enable row level security;

-- 用户只能读写自己的行
create policy "own_user_profiles_select" on public.user_profiles for select using (auth.uid() = id);
create policy "own_user_profiles_upsert" on public.user_profiles for insert with check (auth.uid() = id);
create policy "own_user_profiles_update" on public.user_profiles for update using (auth.uid() = id);

create policy "own_user_state_select" on public.user_state for select using (auth.uid() = user_id);
create policy "own_user_state_upsert" on public.user_state for insert with check (auth.uid() = user_id);
create policy "own_user_state_update" on public.user_state for update using (auth.uid() = user_id);

create policy "own_favorites_select" on public.favorites for select using (auth.uid() = user_id);
create policy "own_favorites_insert" on public.favorites for insert with check (auth.uid() = user_id);
create policy "own_favorites_delete" on public.favorites for delete using (auth.uid() = user_id);

create policy "own_history_select" on public.history for select using (auth.uid() = user_id);
create policy "own_history_insert" on public.history for insert with check (auth.uid() = user_id);
create policy "own_history_delete" on public.history for delete using (auth.uid() = user_id);

create policy "own_preferences_select" on public.preferences for select using (auth.uid() = user_id);
create policy "own_preferences_upsert" on public.preferences for insert with check (auth.uid() = user_id);
create policy "own_preferences_update" on public.preferences for update using (auth.uid() = user_id);

-- 触发器：自动更新 updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_uat on public.user_profiles;
create trigger trg_user_profiles_uat before update on public.user_profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_user_state_uat on public.user_state;
create trigger trg_user_state_uat before update on public.user_state
for each row execute function public.set_updated_at();

drop trigger if exists trg_preferences_uat on public.preferences;
create trigger trg_preferences_uat before update on public.preferences
for each row execute function public.set_updated_at();
