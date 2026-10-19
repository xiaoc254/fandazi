<div align="center">

# 饭搭子 · Fanda

### 今天吃什么 · 一键搞定吃 · 买 · 看 · 聊

替选择困难的人，把「今晚吃什么、要不要做饭、给一家人怎么安排、冰箱里这点东西能凑啥、剩菜怎么变花样」这一连串的小决定，
收进同一个 PWA 网页里。纯前端、零登录、刷新就能用。

[![Live · GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-2ea44f?logo=github)](https://meimengchengzhen.github.io/jin-tian-chi-shenme/)
[![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20Tailwind-1e7eef?logo=react)](#技术栈)
[![PWA](https://img.shields.io/badge/PWA-installable-5a3fc4)](#技术栈)
[![License: All Rights Reserved](https://img.shields.io/badge/License-All%20Rights%20Reserved-lightgrey.svg)](./LICENSE)

[在线体验](https://meimengchengzhen.github.io/jin-tian-chi-shenme/) ·
[功能总览](#功能总览) ·
[内置内容池](#内置内容池) ·
[本地运行](#本地运行--部署) ·
[路线图](#路线图) ·
[创作札记](#创作札记--从选择困难到一点期待)

</div>

---

## 一句话介绍

**饭搭子** 是一个面向中文用户的「吃饭决定助手」。它不替你做饭，只替你做决定 —— 一桌菜、一份外卖、一袋零食、一周买菜清单，顺便把吃饭时看什么、聊什么、听什么也安排上。

最常服务的两类人：

- 🧍 **单人选择困难** —— 中午晚上不知道吃啥、点外卖刷半小时、零食货架站五分钟还在纠结。
- 👨‍👩‍👧 **家庭饮食决策** —— 老人要清淡、孩子不吃辣、自己想减脂、伴侣口味又重；冰箱里总有半根胡萝卜，昨晚还剩半盒红烧肉。

围绕这两类人，饭搭子提供两条**最短动线**：

| 动线 | 路由 | 用一句话说 |
| --- | --- | --- |
| 单人一键安排今晚 | [`#/solo`](https://meimengchengzhen.github.io/jin-tian-chi-shenme/#/solo) | 选心情 / 怎么吃 / 预算档 → 主餐 + 外卖备选 + 零食 + 水果 + 看 + 听 + 一句安慰 |
| 家庭一键今晚饭 | [`#/family-tonight`](https://meimengchengzhen.github.io/jin-tian-chi-shenme/#/family-tonight) | 结合全家忌口 + 冰箱状态 → 主菜 + 蔬菜 + 汤 + 主食的兼容方案，每位成员单独评分 |

任意一条点「就按这个」，都会沉淀成一份海报式 [`#/tonight-plan`](https://meimengchengzhen.github.io/jin-tian-chi-shenme/#/tonight-plan) 最终方案：3 套色系、可截图分享、可复制、可再生成、可继续完善；同时把缺料统一推到 [`#/shopping`](https://meimengchengzhen.github.io/jin-tian-chi-shenme/#/shopping) 购物清单里。

> 顶部 SEO 关键词覆盖：今天吃什么 · 家常菜 · 点外卖 · 一周菜单 · 饭桌话题。

## 在线体验

| 入口 | 链接 | 备注 |
| --- | --- | --- |
| 🌐 GitHub Pages | <https://meimengchengzhen.github.io/jin-tian-chi-shenme/> | 主推。push 到 `main` 自动构建并发布 |
| 📱 安装到手机 | 上面任一链接 → 浏览器「添加到主屏幕」 | PWA：manifest + Service Worker，离线 shell 可用 |

无需登录、不收集数据；所有偏好/收藏/历史默认只写浏览器 `localStorage`。

---

## 功能总览

顶部主导航是 **5 个一级入口**，按钮高度更大、更易点；其他模块都作为各自一级页面下的二级入口或 hash 路由可达，子路由会自动保持对应一级 Tab 高亮。

| 一级入口 | 路由 | 二级入口与功能 |
| --- | --- | --- |
| 🍱 **一键决定** | `#/` `#/solo` `#/lazy` `#/tonight-plan` | 今日推荐（一桌家常菜随机搭好）· 单人一键安排今晚 · 懒人决定 · 海报式最终方案 |
| 🏠 **家庭厨房** | `#/family-tonight` `#/family` `#/fridge` `#/leftover` `#/weekly` `#/shopping` | 家庭一键今晚饭 · 家庭口味协调 · 冰箱有啥 · 剩菜变花样 · 一周菜单 + 估价买菜清单 · 统一购物清单 |
| 🔍 **想吃什么** | `#/search` `#/takeout` `#/snacks` `#/fruit` `#/travel` | 菜谱搜索 · 外卖品牌库 · 零食 · 水果 · 旅行美食 |
| 💪 **健康饮食** | `#/health` | 低糖低盐 / 高蛋白 / 高纤等软标签筛选；BMR/TDEE 估算（仅供参考，不替代医学建议） |
| 🎬 **生活陪伴** | `#/companion` `#/hotboard` | 饭桌陪伴（看 / 聊 / 听）· 饭桌热榜（6 平台多源 fallback + 敏感屏蔽） |

### 三大家庭核心功能

| 模块 | 路由 | 关键能力 |
| --- | --- | --- |
| 🏠 **家庭口味协调** | `#/family` | 最多 6 位成员（角色 / 不爱吃 / 过敏 / 健康目标）· 过敏硬过滤 + 不爱软扣分 + 角色默认（孩子对辣 -35 等）· 全家兼容评分 100/75/有冲突，点开看具体谁不合适 |
| 🧊 **冰箱有啥** | `#/fridge` | 7 组共 128 条食材预设 · 别名规范化（番茄 / 西红柿 / 上海青…）· 命中率三档（≥80% 现在能做 / 50–79% 再买一两样 / <50% 折叠）· 缺什么一键加入购物清单 |
| ♻️ **剩菜变花样** | `#/leftover` | 49 类剩菜 · 81 个变形方案 · 兜底方案永不空白 · 与冰箱联动标 ✅ 已有 / 还要 X · 难度 / 耗时 / 步骤一目了然 |

### 一键动线 · 海报式方案 · 统一购物清单

- **`#/solo` 单人一键安排今晚**：1–2 次点击得到主餐 + 外卖备选 + 零食 ×2 + 水果 + 看 + 听 + 一句安慰，附预算 / 热量估算。「再来一份」用 seed 确定性轮换 —— 同一筛选下每点一次都换主推。
- **`#/family-tonight` 家庭一键今晚饭**：把家庭口味协调 + 冰箱有啥 + 剩菜变花样三大痛点串成单页：根据全家成员忌口与冰箱状态，给一桌「主菜 + 蔬菜 + 汤 + 主食」的兼容方案，并就地标出每个人的兼容评分。
- **`#/tonight-plan` 海报式最终方案**：单人 / 家庭任一动线点「就按这个」沉淀成一张可截图的海报卡，3 套色系（**清爽蓝绿 / 暖橙治愈 / 夜间紫**，单人默认暖橙、家庭默认蓝绿）通过 `localStorage` 记忆；聚合菜 / 外卖 / 零食 / 水果 / 看 / 听 / 家庭兼容 / 冰箱缺料 / 剩菜改造 / 明天衔接 / 预算 / 热量。提供「复制方案」（带剪贴板兜底）/「再生成」/「继续完善」（健康 / 冰箱 / 剩菜 / 一周菜单 / 购物清单）入口。
- **`#/shopping` 统一购物清单**：把 6 个来源（家庭今晚饭缺料 / 最终方案缺料 / 冰箱差几样 / 剩菜补料 / 一周菜单买菜清单 / 手动添加）统一沉淀成一张可勾选清单：按 `肉蛋奶 / 蔬菜 / 水果 / 主食豆制品 / 调味杂项 / 其他` 分类，同名食材用 `ingredientAliases` 自动合并（番茄 / 西红柿不会成两行）并保留来源备注；支持勾选 / 删除 / 手动添加 / 一键复制（带剪贴板兜底）/ 清理已买 / 清空全部。点「就按这个」时会把家庭饭缺料一并加入清单，避免再点一次。所有数据走 `safeGet/safeSet`，隐私模式自动退回内存态；不接外部买菜平台 API，不做真实价格比价。

### 辅助层（节选）

- **菜谱详情**：食材热量·价格估算 · 视频搜索（B 站 / 抖音 / 百度）· 收藏 · 加入今日 · 真实示意图
- **今日记录浮窗**：右下角小 dock，累计今日已选的菜 / 外卖 / 零食 / 水果 / 看 / 聊；显示估算价格 + 估算热量 + 一键复制汇总文案
- **统一个人档案**：昵称 + 喜好 + 忌口 + 身高体重 + 饮食目标 + 个性化（角色 / 心情 / 健康关注），多档案切换。首次进入弹窗与顶栏「我的档案」「个性化」入口共用同一份本地数据，互不重复
- **饮食计划**：Mifflin-St Jeor 公式估 BMR/TDEE，按餐次配比目标，结果区显示「人均合计 / 目标 / 偏轻·刚好·偏高」
- **环境上下文**：省份 + 城市 + 实时天气（Open-Meteo + BigDataCloud 反向地理，无 key）
- **餐次主题 + 整站主题 + 字号**：早 / 午 / 晚切换不同色调；7 套主题 × 4 档字号
- **PWA**：manifest + 手写 Service Worker（cache-first 静态、network-first HTML、子路径自动适配）
- **云端同步 Beta**：可选接入自己的 Supabase 实例，邮箱 OTP 登录跨设备同步

> ⚠️ 健康相关字段（BMR/TDEE/目标摄入、低盐低糖软标签）仅作饮食偏好软排序与热量估算参考，**不构成医学/营养诊断**。如有糖尿病、高血压、痛风等特定情况，请以专业医生意见为准。

---

## 内置内容池

下面这些数字代表当前仓库内置的静态推荐池规模，由 `npm run check:recommend` 在 CI 中作为不变量持续校验。**不联网、不抓取商业 API，只是「编辑选送的清单 + 本地随机刷新」**，并不声明实时性。

| 内容池 | 数量 | 说明 |
| --- | --- | --- |
| 菜谱 | **1054** 道 | 64 道手写核心 + 998 道脚本扩展（主料 × 风格 × 蔬菜 + 水果 / 甜品 / 烘焙 / 饮品 / 小吃） |
| 懒人简餐 | **251** 条 | 5/10 分钟、免开火、便利店组合、外卖平替、宿舍/办公室、减脂、夜宵、早餐、甜品饮品 |
| 饭桌陪伴 | **613** 条 | 影视 204 / 话题 208 / 音频 201；按场景 + 人数 + 餐次 + 用时 + 档案年龄打分 |
| 冰箱预设 | **128** 条 | 蛋白质 / 蔬菜 / 主食 / 冷冻 / 调味 / 奶蛋饮品 / 水果 共 7 组 |
| 食材别名 | **300+** 条 | 番茄 / 西红柿、上海青 / 油麦菜、三文鱼 / 巴沙鱼、希腊酸奶、速冻饺子、紫甘蓝… |
| 剩菜规则 | **49** 类 / **81** 方案 | 红烧肉 / 鸡 / 鱼 / 米饭 / 面 / 火锅 / 饺子 / 烤鸭 / 大盘鸡 等；兜底方案永不空白 |
| 外卖品牌池 | **305** 条（A+B 真实连锁） | 链接全部走稳定搜索入口（百度站内 / 京东 / 淘宝 / 抖音 / 小红书 / B 站），不走商家直链 |
| 零食 | **301** 条 | 分类严格隔离（巧克力 / 糖果 / 酸奶 / 牛奶乳饮 / 饼干 / 面包糕点 / 坚果…） |
| 水果 | **105** 条 | 应季 + 人群推荐；每月 ≥ 20 种当令水果 |
| 城市美食 | **48** 城 / **33** 省 | 旅行美食模块；带豆瓣 / 小红书 / B 站等搜索入口 |

---

## 截图 / 演示

> 想直接动手试？点 **[在线预览](https://meimengchengzhen.github.io/jin-tian-chi-shenme/)** 比看图更快。

桌面端（1280 × 900，由 Playwright 在生产构建上自动生成）：

| 模块 | 截图 |
| --- | --- |
| 今日推荐 — 一桌家常菜随机搭好 | ![今日推荐](docs/screenshots/home.png) |
| 一周菜单 — 7 天午+晚 + 预算买菜清单 | ![一周菜单](docs/screenshots/weekly.png) |
| 懒人决定 — 一键替你决定吃·买·看·聊 | ![懒人决定](docs/screenshots/lazy.png) |
| 🏠 家庭口味协调 — 全家忌口/口味/健康目标兼容评分 | ![家庭口味](docs/screenshots/family.png) |
| 🧊 冰箱有啥 — 现有食材命中率三档分组 | ![冰箱有啥](docs/screenshots/fridge.png) |
| ♻️ 剩菜变花样 — 81 个静态变形方案 + 冰箱联动 | ![剩菜变花样](docs/screenshots/leftover.png) |
| 外卖 — 305 条真实连锁品牌按预算·人数·时段筛选 | ![外卖](docs/screenshots/takeout.png) |
| 零食 — 301 条 SKU 分类严格隔离 | ![零食](docs/screenshots/snacks.png) |
| 水果 — 应季 + 人群推荐 | ![水果](docs/screenshots/fruit.png) |
| 健康饮食 — 低糖低盐 / 高蛋白 / 高纤 | ![健康饮食](docs/screenshots/health.png) |
| 菜谱搜索 — 「为什么匹配」可解释高亮 | ![菜谱搜索](docs/screenshots/search.png) |
| 饭桌陪伴 — 吃饭看 / 聊 / 听 | ![饭桌陪伴](docs/screenshots/companion.png) |
| 饭桌热榜 — 6 平台多源 fallback + 敏感屏蔽 | ![饭桌热榜](docs/screenshots/hotboard.png) |
| 统一个人档案 — 首次轻量弹窗 + 顶栏「我的档案 / 个性化」共用同一份本地数据 | ![个性化设置](docs/screenshots/persona-welcome.png) |

移动端（390 × 844）：

<p>
  <img src="docs/screenshots/mobile-home.png" alt="移动端 - 今日推荐" width="320" />
  &nbsp;
  <img src="docs/screenshots/mobile-lazy.png" alt="移动端 - 懒人决定" width="320" />
</p>

> 截图脚本：[`script/screenshot.mjs`](./script/screenshot.mjs)。先 `npm run build && NODE_ENV=production node dist/index.cjs`，再 `node script/screenshot.mjs` 即可全量再生。

---

## 「为什么 / 怎么做 / 学到了什么」

### A. 为什么做这个解决方案

**真实的痛点不是「菜谱不够」，而是决定本身**。市面上 4 类应用都有缺口：

- **菜谱站**：菜很多，但每次还是要自己翻、自己挑、自己估时间预算 — 最累的那一步没解决。
- **外卖 App**：算法只在乎你下单，不在乎是不是真的合适当下心情 / 健康 / 同伴。
- **「随机吃」小程序**：随机出来的菜往往跟你的厨房 / 时间 / 人数毫无关系，是娱乐，不是工具。
- **饭桌「看什么聊什么」**：散落在豆瓣、B 站、小宇宙等平台，没人一次性整理给一桌人。

**为什么用「规则化推荐」而不是纯随机？** 选择困难真正难的不是没选项，而是约束多：「人少·没时间·孩子在·想清淡·上次刚吃了红烧肉·预算 50 块·还想配个汤」— 用户连开口描述都嫌烦。所以饭搭子用「**轻量规则推荐 + 软兜底自动放宽**」：硬性忌口绝不让步，软性偏好打分，候选不足时**逐级放宽难度 → 菜系 → 用时**，并把放宽过程**显式提示给用户**。这比纯随机更尊重约束，又比 LLM 更可解释、零成本、零延迟。

### B. 具体怎么实现的

#### 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | **React 18** + **Vite 7** + **TypeScript 5.6** |
| 路由 | **wouter** + Hash router（GitHub Pages 子路径友好） |
| UI | **Tailwind CSS 3.4** + **Radix UI** + 自定义主题层（CSS 变量） |
| 字体 | Fontshare General Sans + Gambarino |
| 图标 | lucide-react |
| 状态 | React 本地 state + `safeGet/safeSet` 封装的 localStorage（隐私模式自动退回内存） |
| 数据 | 全部静态 TS / JSON：1054 菜谱、301 零食、305 外卖品牌、48 城美食、105 水果、613 影视/话题/音频 |
| 估算 | 自写：人均热量、单道菜价、一桌人均价、BMR/TDEE（Mifflin-St Jeor） |
| 网络 | Open-Meteo（天气，无 key）+ BigDataCloud（反向地理，无 key）+ Unsplash Source / Wikimedia（图片）+ 6 大热搜公开端点 |
| 后端 | Express 入口保留为空壳；当前完全静态前端 |
| 持久化 Beta | Supabase（**用户自带**，前端只用 anon key + RLS） |
| 部署 | GitHub Actions → GitHub Pages（`.github/workflows/deploy-pages.yml`） |
| PWA | 手写 Service Worker（cache-first 静态、network-first HTML、子路径 scope 自适配） |

#### 数据结构与推荐逻辑

- **菜谱**（`client/src/data/recipes.ts` + `recipes.generated.ts`）：64 道手写核心菜 + 998 道脚本扩展菜，统一 `Recipe` 接口对应仓库根 [`recipes.schema.json`](./recipes.schema.json)。
- **推荐算法**（`client/src/lib/recommend.ts`）：
  1. 硬过滤：忌口 8 类绝不让步；
  2. 候选不足时逐级放宽难度 → 菜系 → 用时上限，UI 同步提示；
  3. 打分：口味 +1.4 / 菜系 +0.6 / 难度 +0.4 / 短时 +0~0.3 / 随机扰动 +0~0.6；档案喜好、收藏、历史去重、场景倾向叠加加权；
  4. 分类抽样：在 main / veggie / soup / staple 各取 Top N 再随机；
  5. 锁定增量：用户「锁住」的菜跳过重抽。
- **场景预设**（`client/src/lib/scenarios.ts`）：7 个场景（个人控卡 / 全家晚餐 / 快手上班餐 / 儿童友好 / 长辈清淡 / 健身增肌 / 周末下厨）。
- **家庭口味协调**（`client/src/lib/familyMembers.ts`）：硬过敏 / 不爱软扣分 / 健康目标关键词 / 角色默认；与 likes/dislikes 复用，给出「全家兼容评分」与逐人理由。
- **冰箱有啥**（`client/src/lib/fridge.ts`）：核心食材抽取 + 别名归一化 + 命中率三档；与家庭模式 / likes / dislikes 联动加减分。
- **剩菜变花样**（`client/src/lib/leftoverRemix.ts`）：静态规则表 + 通用兜底（万能炒饭 / 盖浇面 / 粥 / 蔬菜汤 / 卷饼），按剩余量软调难度。
- **一周家庭菜单**（`client/src/lib/familyWeekly.ts`）：输出 7 天午+晚菜单、蛋白频次、估价、按 4 组去重合并的买菜清单。
- **饭桌陪伴**（`client/src/lib/companionRecommend.ts`）：影视 / 话题 / 音频按 `场景 + 人数 + 餐次 + 用时 + 档案年龄` 打分；家庭聚餐优先合家欢、儿童友好、长辈友好；话题主动避开政治宗教等敏感方向。
- **饭桌热榜**（`client/src/lib/hotBoard.ts`）：6 平台公开端点多源 fallback；任何端点失败回内置静态样例；默认开启敏感词屏蔽（政治 / 冲突 / 灾难 / 刑案 / 地域歧视）。
- **统一购物清单**（`client/src/lib/shoppingList.ts`）：6 来源汇聚 + `ingredientAliases` 合并 + 6 类目分桶 + 来源备注 + safe storage。
- **图片**：`lib/imageProvider.ts` 优先 Wikimedia / Unsplash Source 关键词图，失败 fallback 到渐变 + emoji（`dishVisual.ts`），不依赖私有 CDN。
- **PWA**：见 `client/public/sw.js`，VERSION 化缓存名 + SKIP_WAITING；`registerSW.ts` 仅在生产构建时注册。
- **性能**：路由级 lazy（`LazyDecisionPanel` / `LazyMealsPanel` / `LazyWizardDialog`）；图片 lazy + fallback；列表虚拟化对热榜 / 菜谱搜索均有应用；GitHub Pages 子路径全部用相对路径。

### C. 做完之后的启发与发现

- **选择困难不是「选项不够」，是「约束太多」**。预算、健康、场景、心情、家庭结构、娱乐陪伴是同一件事的多个面，单做一个菜谱站是解决不完的。
- **一桌饭其实是「内容包」**：吃 + 看 + 聊 + 听。把这四件事拆分到不同 App 既费事又费心，集中给一个「替我决定」的入口反而最舒服。
- **规则推荐 + 显式放宽** 在小数据集（≤ 千条）上比 LLM 更可解释、更稳定、更便宜。LLM 更适合放在「为什么推荐它」「怎么做这道菜」的内容生成环节，而不是核心决策。
- **软兜底比硬报错友好得多**。「鲁菜 + 进阶 + 15 分钟」这样的极端组合不应让用户面对空白页，UI 应明确告诉他「我自动放宽了 X」。
- **本地为主、云端为辅** 是这种轻量工具最合适的姿态：默认零登录、零上传，需要跨端再用自己的 Supabase。

---

## 本地运行 / 部署

环境：Node.js ≥ 18，npm ≥ 9。

```bash
git clone https://github.com/meimengchengzhen/jin-tian-chi-shenme.git
cd jin-tian-chi-shenme
npm install
npm run dev          # http://localhost:5000
```

构建生产产物：

```bash
npm run build        # 静态站点：dist/public/
                     # 服务器入口（如需）：dist/index.cjs
```

类型检查 + 推荐算法冒烟测试：

```bash
npm run check            # tsc 类型检查
npm run check:recommend  # 推荐算法 + 忌口 + 数据库规模 + 内容池断言
npm run check:links      # 外链稳健性：所有外卖 / 零食 / 水果 / 旅行入口必须命中稳定搜索 host 白名单
```

> **链接稳健性约定**：所有跳转入口都走稳定搜索 URL（百度站内搜索 / 京东 / 淘宝 / 抖音 / 小红书 / Bilibili 搜索），不走商家直链（美团 H5、大众点评 m 站等已知 error_page）。所有外链统一 `target="_blank" rel="noopener noreferrer"`。图片层全部走 `useDishPhoto + onError fallback`：真实图加载失败立刻回落到渐变 + emoji + 首字占位，不会破图。

重新生成扩展菜谱（基于模板组合）：

```bash
npm run gen:recipes      # 写入 client/src/data/recipes.generated.ts
```

#### 部署到 GitHub Pages

仓库 `.github/workflows/deploy-pages.yml` 已配置：每次 push 到 `main` 自动 build + 发布；fork 后在仓库 `Settings → Pages → Source: GitHub Actions` 启用即可。

#### 截图（再生）

仓库自带 [`script/screenshot.mjs`](./script/screenshot.mjs)，使用 Playwright 在生产构建上自动跑遍主 Tab + 移动端：

```bash
npm run build
NODE_ENV=production node dist/index.cjs &     # 启动生产服务，端口 5000
npx playwright install --with-deps chromium    # 首次需安装浏览器
node script/screenshot.mjs                     # 写入 docs/screenshots/*.png
```

脚本会预先在 `localStorage` 写入 `chishenme.onboarded.v1=1` 跳过新手引导，桌面 1280 × 900、手机 390 × 844 / DSR 2。

#### 云端同步 Beta（可选 · Supabase）

> 默认是**纯前端**：所有档案、收藏、历史都在你的浏览器 localStorage，不上传。

1. 新建 Supabase 项目，在 SQL Editor 执行 [`supabase/migration.sql`](supabase/migration.sql)（`user_profiles` / `user_state` / `favorites` / `history` / `preferences` 5 张表，全部启用 RLS）；
2. 复制 `.env.example` 为 `.env`，填 `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`（**仅 anon key，绝不能用 service_role**）；
3. GitHub Pages 部署时把这两个变量加到仓库 `Settings → Variables` 并在 workflow 注入；
4. 启用后顶部「云端同步 Beta」可邮件 OTP 登录 → 推送本地快照 / 从云端合并。

未配置时面板提示「未配置 Supabase，本地数据仍可用」，所有功能 100% 可用。详见 [docs/supabase.md](docs/supabase.md)。

---

## 数据来源与免责声明

- **菜谱 / 零食 / 外卖品牌 / 城市美食 / 影视 / 话题 / 音频** 全部为人工整理或脚本生成的静态数据，便于离线运行与社区贡献，不抓取任何商业 API。
- **价格、热量、营养** 均为基于通用配方的**估算值**（食材热量主数据库见 `client/src/data/ingredients.ts`），实际数值受品牌、份量、烹饪方式影响。
- **饭桌热榜** 优先调用各平台公开端点；任何端点失败/超时/被墙都自动降级到内置静态示例。**热榜内容会随时间变化**，截图与当日数据可能不一致。
- **菜品图片** 优先 Wikimedia / Unsplash Source 关键词图，失败时回渐变 + emoji；详情页明确标注「示意图」。
- **健康相关字段**（BMR/TDEE/目标摄入）用 Mifflin-St Jeor 公式估算，**仅作饮食规划参考，不构成医学/营养建议**。任何饮食、过敏、慢病决定请咨询专业医生 / 注册营养师。

---

## 项目结构

```
jin-tian-chi-shenme/
├── client/
│   ├── index.html              # 标题 / 字体 / favicon / manifest 引用
│   ├── public/
│   │   ├── favicon.svg         # 自定义 SVG 图标
│   │   ├── manifest.webmanifest
│   │   └── sw.js               # 手写 Service Worker（PWA）
│   └── src/
│       ├── App.tsx             # Hash router
│       ├── main.tsx            # 入口 + SW 注册 + 主题初始化
│       ├── index.css           # 设计系统：陶土 + 米白；多主题；data-meal 餐次主题
│       ├── components/
│       │   ├── MainTabs.tsx              # ★ 顶部 5 入口主导航
│       │   ├── SoloTonightPanel.tsx      # ★ 单人一键安排今晚
│       │   ├── FamilyTonightPanel.tsx    # ★ 家庭一键今晚饭
│       │   ├── TonightPlanPanel.tsx      # ★ 海报式最终方案
│       │   ├── ShoppingListPanel.tsx     # ★ 统一购物清单
│       │   ├── FamilyPanel.tsx           # 家庭口味协调
│       │   ├── FridgePanel.tsx           # 冰箱有啥
│       │   ├── LeftoverPanel.tsx         # 剩菜变花样
│       │   ├── WeeklyMenuPanel.tsx       # 一周菜单 + 预算
│       │   ├── LazyDecisionPanel.tsx     # 懒人决定
│       │   ├── TakeoutPanel.tsx          # 外卖
│       │   ├── SnacksPanel.tsx           # 零食
│       │   ├── FruitPanel.tsx            # 水果
│       │   ├── HealthPanel.tsx           # 健康饮食
│       │   ├── SearchPanel.tsx           # 菜谱搜索
│       │   ├── TravelPanel.tsx           # 旅行美食
│       │   ├── CompanionPanel.tsx        # 饭桌陪伴
│       │   ├── HotBoard.tsx              # 饭桌热榜
│       │   ├── DishDetail.tsx            # 菜品详情
│       │   ├── ProfileDialog.tsx         # 统一档案
│       │   ├── DecisionPoster.tsx        # 今日决定海报
│       │   ├── TodayDock.tsx             # 今日记录浮窗
│       │   ├── CategoryBrowser.tsx       # 甜品/饮品/小吃/早餐 等门类浏览
│       │   ├── CloudSyncDialog.tsx       # Supabase 云端同步 UI
│       │   └── ui/                       # Radix + tailwind 通用组件
│       ├── data/                # 静态数据池
│       │   ├── recipes.ts / recipes.generated.ts
│       │   ├── snacks.ts / snacks.generated.ts
│       │   ├── takeout.ts / takeoutBrands.ts / takeoutBrands.generated.ts
│       │   ├── fruits.ts / cityFoods.ts / companions.ts
│       │   ├── ingredients.ts / lazyMeals.ts
│       │   └── ...
│       ├── lib/
│       │   ├── recommend.ts              # ★ 推荐算法 + 评分
│       │   ├── familyMembers.ts         # 家庭成员 + 口味兼容评分
│       │   ├── fridge.ts                 # 冰箱命中率算法 + 别名
│       │   ├── leftoverRemix.ts          # 剩菜规则 + 兜底
│       │   ├── shoppingList.ts           # 统一购物清单
│       │   ├── familyWeekly.ts           # ★ 家庭一周菜单
│       │   ├── ingredientAliases.ts      # 食材别名归一化
│       │   ├── hotBoard.ts               # 热榜聚合 + 敏感屏蔽
│       │   ├── companionRecommend.ts     # 看/聊/听推荐
│       │   ├── profile.ts                # 档案 + BMR/TDEE
│       │   ├── calories.ts               # 人均热量缓存
│       │   ├── environment.ts            # 省/市/天气/季节
│       │   ├── geoWeather.ts             # Open-Meteo + BigDataCloud
│       │   ├── theme.ts / pageSize.ts / mealTheme.ts  # 主题 / 字号 / 餐次
│       │   ├── selectedToday.ts          # 今日记录浮窗状态
│       │   ├── history.ts / recentPool.ts# 历史 / 去重
│       │   ├── cloudSync.ts              # Supabase 同步逻辑
│       │   ├── storage.ts                # 安全 localStorage
│       │   └── registerSW.ts             # PWA 注册
│       └── pages/
│           └── Home.tsx                  # ★ 主页面，挂载所有 Tab
├── server/                     # Express 入口（当前空壳，预留）
├── shared/                     # 前后端共享类型（预留）
├── supabase/migration.sql      # 云端同步建表 SQL
├── script/
│   ├── build.ts                # 构建产物组装
│   ├── check-recommend.ts      # 推荐算法冒烟测试
│   ├── check-links.ts          # 外链稳定性冒烟
│   └── generate-recipes.ts     # 生成扩展菜谱
├── docs/
│   ├── screenshots/            # README 引用的截图
│   └── supabase.md             # 云端同步配置教程
├── recipes.schema.json         # 菜谱 JSON Schema
├── .github/workflows/deploy-pages.yml
├── CONTRIBUTING.md             # 贡献说明（当前阶段不接受直接贡献）
├── LICENSE                     # All Rights Reserved（保留所有权利，非开源许可证）
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

★ 标记的是产品逻辑入口，绝大多数迭代只需要改这几个文件。

---

## 路线图

| 时间 | 模块 | 想做的事 |
| --- | --- | --- |
| **短期（1-2 月）** | 强忌口可信度 | 在硬过敏判定里把更多隐藏关键词补全（酱料 / 复合调味 / 加工肉），并在卡片显示置信度而不仅仅是「过敏」/「无」 |
| 短期 | 复购不重复 | 历史 / 收藏与「再来一份」联动，连续 N 天不再重推同一道主菜，给出「换换花样」的主动建议 |
| 短期 | 营养展示 | 给详情页补蛋白 / 脂肪 / 碳水 / 钠的范围估值，和饮食目标比较 |
| **中期（3-6 月）** | 周计划深化 | 家庭一周菜单接入冰箱 / 剩菜，自动衔接「明天的菜里用掉今天的剩」「这周买的菜横跨 4 顿」 |
| 中期 | 预算与价格 | 接 1-2 个公开菜场价格源，给买菜清单加「本周参考价区间」（仅参考，不承诺成交价） |
| 中期 | 内容质量补强 | 每个内容池补图片字段、出处标注、人群标签；社区 PR 模板降低投稿门槛 |
| 中期 | 截图 CI | GitHub Actions 跑 Playwright 自动更新 README 截图 |
| **长期** | 平台合作 / 自动下单 | 在用户授权下，与外卖 / 买菜平台做更深合作：替你决定 → 替你下单 → 给你一个饭点小盲盒 |
| 长期 | 协同 | 家庭账号下，多成员共同维护「不吃 / 想吃」清单 |
| 长期 | i18n | 英文版给海外华人 / 学做菜的外国朋友 |

---

## 创作札记 · 从选择困难到一点期待

> 一些藏在代码之外、关于「为什么是吃饭，为什么是这种做法」的私人笔记。放在靠后位置，不喧宾夺主。

### 为什么偏偏选「吃」这件事

每天最稳定地把我卡住的，不是工作，是「中午吃啥、晚上吃啥」。打开外卖 App，先比价、再凑券、再算配送费，刷十分钟还没下单；点开视频网站想配饭，又要在「今天看什么剧」里再纠结一次。问了身边几个朋友、看了一圈社交平台，发现这不是我一个人的怪癖：单人想要「替我先选一个」；家庭要同时照顾老人清淡、孩子不吃辣、自己想减脂、伴侣口味重，还得算着预算逛菜场；独居怕浪费、怕重复、冰箱里永远有半根胡萝卜；想吃健康一点又被各种 App 的卡路里输入和营养面板劝退。这些麻烦看起来零碎，加起来却是每天都在被切走的注意力。

### 这不是一个「随机转盘」

最早我也以为做个「点一下随机出一道菜」的小工具就够了，但试用几次就明白：随机不解决问题，**约束**才是问题 —— 预算、人数、心情、健康目标、冰箱里有什么、昨天刚吃过什么……所以饭搭子的本质是把围绕「吃」的几条主线拧到一起：菜谱 + 买菜清单、外卖 + 零食 + 水果、饭桌陪伴、家庭 / 冰箱 / 剩菜、健康规划。希望用「推荐 + 个性化」减少跨平台搜索、信息焦虑、被推送广告劝退的那种隐性消耗。

### 怎么做出来的：和多个模型协作

这个项目不是一个人在 IDE 里硬写出来的，而是和多个模型 / 代码代理一起做的：人去定问题、定边界、定品味；代理去把活干掉，再把不确定的地方抛回来让人决定。**很多功能能在一周内成型，不是因为我变快了，而是因为我变得更像一个产品负责人。**

### 卡过的弯路：从「实时外卖」转向「可落地」

最早设想里有一条很激进的线：实时拉取附近商家、当前优惠、配送费，给出此时此刻的最优解。真做的时候发现各平台的实时数据、优惠规则不会开放给独立网站；能拿到的要么需要登录态，要么是商家页 H5（链接易变、还容易封）；即使能爬到，也无法对结果负责 —— 价格 1 分钟一变，承诺得太重就是骗用户。

于是把方向收回来：外卖只做「连锁品牌 + 稳定搜索入口」+ 本地排序刷新；核心放在「菜谱 + 买菜 + 健康偏好 + 家庭 / 冰箱 / 剩菜」这些自己能掌控的静态数据 + 规则上；该承认的局限明确写清楚：不实时、不抓商业 API、健康仅作参考。少做一点，但让做出来的东西站得住。

### 做完之后冒出来的一点想法

日常里有大量「微小决定」 —— 午饭、配饭看的剧、要不要点奶茶、晚餐配菜 —— 单个不大，但一天下来真的会累。如果一个工具能把「今天吃什么」从压力变成「今天会吃到什么」的小期待，它的价值就更接近一种**生活节奏的轻调度**。未来如果能在用户授权下，跟外卖 / 买菜平台做更深的合作，把「替你决定 → 替你下单 → 给你一个饭点小盲盒」走通，会是一件挺有意思的事。但在那之前，先把「不联网也能给出靠谱建议」做扎实 —— 这才是这个工具值得长期存在的底盘。

如果它能让你某一天傍晚少花十分钟纠结，多吃两口热饭，这事就值。

---

## 贡献

**当前阶段不接受直接的代码 / 内容 / 数据 / 设计贡献。** 本项目是作者本人维护的个人作品，
迭代节奏与口味取舍都由作者自己把控，未开放公开协作。

仍然欢迎以下方式参与：

- **反馈 Bug 或体验建议**：开 [GitHub Issue](../../issues/new)，描述问题或想法即可。作者会自行评估是否纳入后续版本，**不保证回复或采纳**。
- **合作 / 引用 / 转载 / 教学等需求**：请通过仓库主页公开的联系方式与作者联系，**获得书面同意后**再行动。
- **直接提 PR**：未经事先沟通的 PR 不一定会被审阅或合并，也不会得到拒绝原因的解释 —— 请先开 Issue 对齐方向。

详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

**本项目不是开源软件。** 源代码、菜谱与文案数据、设计稿、文档 —— 全部**保留所有权利**（All Rights Reserved），
未授予复制、修改、分发、再授权、商用或制作衍生作品的权利。

允许的有限行为：

- 通过浏览器**访问已部署的网页**（[在线体验](https://meimengchengzhen.github.io/jin-tian-chi-shenme/)），正常使用其前端交互；
- 在 GitHub 上**阅读本仓库主页**（README、源码、提交历史），用于代码评审、作品集展示、面试 / 评选等场景；
- 评审 / 报道 / 教学场景下的**少量、合理引用**，并标注来源。

完整条款（包括禁止用于 AI 训练、批量抓取、商业再分发等）以 [LICENSE](./LICENSE) 文件为准。如需更广泛的使用授权，请先联系作者。

---

<div align="center">

**饭搭子** 是一个工具，也是一种姿态：
不替你做饭，只替你做决定。一桌菜、一周计划、一袋零食、一段视频、一句话题 —— 一次搞定。

少花点时间想「今天吃什么」🍲，多花点时间真正吃。

</div>
