# Supabase 云端同步（可选）

> 默认情况下，「今天吃什么」是纯前端 + localStorage 的 PWA 风格站点，
> **不需要任何后端**也可以完整使用：档案、收藏、历史都保存在你的浏览器里，
> 数据隐私 100%。
>
> 如果你想要 **跨设备同步** / **多账号管理** / **团队订餐协作**，
> 可以接入 [Supabase](https://supabase.com)（免费档完全够用），
> 启用「云端同步 Beta」入口。

## 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 创建免费项目（一个邮箱可建 2 个免费实例）。
2. 进入 **SQL Editor**，把 [`supabase/migration.sql`](../supabase/migration.sql) 整个粘进去执行。
   建好的表：`user_profiles` / `user_state` / `favorites` / `history` / `preferences`，全部启用 RLS。
3. 进入 **Authentication → Providers**，启用 **Email**（默认就是邮箱 OTP，无密码登录）。

## 2. 注入前端环境变量

在仓库根目录新建 `.env`（**不要**提交！）：

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...    # Settings → API → anon public
```

> ⚠️ 安全提示：仅使用 **anon (public) key**。
> 这个 key 不能绕过 RLS——只要你执行了 migration 里的 RLS 策略，
> 用户只能读写自己的行，泄露 anon key 也不会暴露其他用户数据。
> **绝对不要**把 `service_role` key 放进前端代码！

## 3. 部署到 GitHub Pages

GitHub Pages 是静态站点，没有运行时 env。

需要在 GitHub 仓库设置 → **Settings → Secrets and variables → Actions → Variables**
添加：

| 名称 | 值 |
|------|----|
| `VITE_SUPABASE_URL` | https://YOUR_PROJECT.supabase.co |
| `VITE_SUPABASE_ANON_KEY` | eyJ... |

然后修改 `.github/workflows/deploy-pages.yml` 的「Build static site」步骤为：

```yaml
- name: Build static site
  env:
    VITE_SUPABASE_URL: ${{ vars.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ vars.VITE_SUPABASE_ANON_KEY }}
  run: npm run build
```

构建时 Vite 会把这两个变量内联到 JS bundle。

## 4. 用法

启用后，前端「云端同步 Beta」按钮会：

1. 调用 `signInWithOtp(email)` → Supabase 给用户发邮件登录链接。
2. 用户点链接回来，自动登录到当前浏览器。
3. 「同步到云端」按钮一键 push 当前 profile/favorites/history 到 `user_state`。
4. 「从云端拉取」一键 pull 覆盖本地状态。

代码入口：[`client/src/lib/cloudSync.ts`](../client/src/lib/cloudSync.ts)

## 5. 不接入 Supabase 也完全可用

不配置任何 env 时：

- `cloudSync.isConfigured()` 返回 `false`；
- UI 显示「未配置云端，同步功能暂不可用，本地数据仍可用」；
- 所有功能继续正常工作，浏览器本地存储是唯一数据源。

这是设计目标——**纯前端零依赖**应该是默认体验。
