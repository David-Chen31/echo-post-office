# 回声邮局 · 匿名书信治愈社区

按《模块拆分文档》落地的后端代码（monorepo）。当前已实现 **P0 后端核心闭环**：
注册登录 → 写信投递 → 待回信箱领取 → 回信 → 收到通知，以及内容审核、举报、信箱、限流、超时释放。

## 目录结构

```
apps/api          NestJS 后端（含队列消费者 / 定时任务）
packages/shared   前后端共享：枚举、常量、zod DTO、API 响应类型
prisma            Prisma schema + 冷启动种子
docker-compose.yml  本地 postgres + redis
```

模块边界与接口契约见《模块拆分文档.md》；数据模型见《数据模型文档.md》。

## 启动项目

> 包管理器：推荐 pnpm；无 pnpm 时用 npm（已配置 npm workspaces）。
> 数据库数据存在 Docker 卷里，重启电脑不会丢，所以日常启动不必重新迁移/灌种子。

### 日常启动（每次开机后）

1. **启动 Docker Desktop**，等引擎变成 `Engine running`（否则会报 `P1001 Can't reach database server`）。
2. 起数据库 + Redis：
   ```bash
   cd "d:/OpenSource/MINE/人类临时休息室"
   docker compose up -d          # 等 letter-postgres / letter-redis 变 healthy
   ```
3. 起后端（终端 A）。成功后会打印 `API listening on http://localhost:4000/api/v1`；开发环境的验证码也会打印在此终端（`[验证码] -> 邮箱 : 6位码`）：

   ```bash
   npm run dev:api
   ```

4. 起前端（终端 B），然后打开 <http://localhost:3000> ：

   ```bash
   npm run dev:web
   ```

停止：两个终端各 `Ctrl+C`；停数据库 `docker compose down`（加 `-v` 才会清数据）。

### 首次启动 / 重装依赖 / 重置数据库时（额外步骤）

```bash
cp .env.example .env            # 准备环境变量（仅首次）
npm install                     # 装依赖
npm run prisma:generate         # 生成 Prisma Client
npm run prisma:migrate          # 建表
npm run prisma:seed             # 写入冷启动内容 / 种子回信者 / 示范信
```

### 常见问题

- `P1001 Can't reach database server at localhost:5432`：Docker Desktop 没开或没执行 `docker compose up -d`。
- 前端能开但接口报错：后端（终端 A）没起，或数据库没起。
- 验证码填什么：看后端终端日志最后一行 `[验证码] -> 你的邮箱 : xxxxxx`。

## 已实现接口（用户端，前缀 /api/v1）

| 方法 | 路径 | 模块 |
|---|---|---|
| POST | /auth/code · /auth/register · /auth/login · /auth/refresh · /auth/logout | auth |
| GET/PATCH/DELETE | /me · POST /me/blocks | user |
| POST | /letters/draft · /letters · POST /letters/:id/close · GET /letters/:id | letter |
| GET | /mailbox/inbox（取一封）· POST /mailbox/inbox/:id/claim · /mailbox/inbox/:id/skip | claim |
| POST | /replies/draft · /replies · /replies/:id/feedback · /replies/:id/favorite | reply |
| GET | /mailbox/sent · /received · /replying · /favorites · /drafts | mailbox |
| POST | /reports | report |
| GET | /notifications · POST /notifications/read | notification |

响应统一 `{ code, data, message }`（见 packages/shared/src/api.ts）。

## 设计要点落地

- **领取抢占**：PostgreSQL `FOR UPDATE SKIP LOCKED`（claim.service.ts），同人不重复领取（唯一约束）。
- **超时释放**：BullMQ 延迟任务 + 每分钟 Cron 兜底，幂等释放。
- **内容安全**：提交时自动检测，联系方式强制遮挡，高风险进人工审核（moderation 模块）。
- **限流 / 配额 / 幂等**：Redis 实现（每日投信/领取额度、接口限流、Idempotency-Key）。
- **时间脱敏**：阅读页只显示模糊时间。

## 尚未实现（后续）

- admin 后台模块（审核队列/用户管理/看板）、stats 聚合、conversation(P1)。
- apps/web（Next.js 前端）、apps/admin（AntD 后台）。
- 详见各设计文档的 P1/P2 规划。
