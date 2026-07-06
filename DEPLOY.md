# 上线部署指南（全 Vercel，免费无需信用卡）

前端（Next.js）和后端（NestJS）都部署到 **Vercel**（Hobby 免费、无需信用卡），
数据库用 **Neon(Postgres)**、缓存/队列用 **Upstash(Redis)**、验证码用任意 **SMTP** 邮箱。

```
浏览器 ──> Vercel 前端（Next.js SSR）
              │  /api/* 由 Next 反向代理到后端（同源，cookie 用 lax 即可，无需跨源配置）
              ▼
        Vercel 后端（NestJS Serverless 函数）──> Neon(Postgres) / Upstash(Redis) / SMTP
```

> 用「前端代理 /api 到后端」的方式，浏览器只看到前端一个域名，cookie 天然同源，
> 省去跨站 cookie / CORS 的麻烦。

> ⚠️ Serverless 限制（重要）：Vercel 无常驻进程，**BullMQ 后台 worker 与定时任务不会运行**
> （如"领取超时自动释放信件"）。核心闭环（注册/登录/写信/读信/领取/回信/通知）不受影响。
> 若要后台作业，见文末「需要后台任务时」。

---

## 1. Postgres（Neon，免费）
1. https://neon.tech 新建项目。
2. 复制**带连接池**的连接串（Neon 面板 "Pooled connection"，形如
   `postgresql://user:pass@ep-xxx-pooler.aws.neon.tech/db?sslmode=require`）。
3. 记为 **DATABASE_URL**。

## 2. Redis（Upstash，免费）
1. https://upstash.com 新建 Redis 数据库（选离你后端区域近的）。
2. 复制 `rediss://...` 连接串。
3. 记为 **REDIS_URL**。

## 3. 邮件 SMTP（真实发验证码）
拿到 host/port/user/pass：
- QQ 邮箱：`smtp.qq.com` / 465（SSL）或 587，密码用"授权码"（非登录密码）。
- Gmail：`smtp.gmail.com` / 587 + 应用专用密码。
- 或 Resend/SendGrid 等。
- 记为 **SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS** + 发件人 **MAIL_FROM**。

## 4. 后端上线（Vercel Serverless）
1. 代码推到 GitHub（见文末）。
2. https://vercel.com → Add New → **Project** → 导入本仓库。
3. **Root Directory 保持仓库根目录**（会读取根目录 `vercel.json` 与 `api/index.ts`）。Framework 选 **Other**。
4. **Environment Variables** 填：
   - `DATABASE_URL`、`REDIS_URL`（上面两步）
   - `NODE_ENV` = `production`
   - `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`（各填一段随机长字符串）
   - `MAIL_DRIVER` = `smtp`、`MAIL_FROM`、`SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`
5. Deploy。构建时会自动 `prisma generate` + **`prisma migrate deploy`（自动建表/迁移）**。
6. 部署完成得到后端地址，如 `https://echo-post-api.vercel.app`。
   - 验证：访问 `https://<后端>/api/v1/health` 应返回 `{"ok":true}`。

## 5. 前端上线（Vercel）
1. 再 Add New → **Project** → 同一个仓库，**Root Directory 设为 `apps/web`**，Framework 自动识别 Next.js。
2. **Environment Variables** 填：
   - `API_PROXY_TARGET` = 第 4 步的后端地址（如 `https://echo-post-api.vercel.app`）。
     这会让 Next 把 `/api/*` 反向代理到后端（同源 cookie）。
   - **不要**设 `NEXT_PUBLIC_API_BASE`（留空即走同源代理）。
3. Deploy，得到前端地址，如 `https://echo-post.vercel.app`。
4. 打开前端地址 → 注册（会收到真实验证码邮件）→ 写信/读信跑通。

## 6. 灌示范内容 + 设管理员（在你本地跑，连 Neon）
把 Neon 连接串临时设成环境变量，在项目根目录执行：
```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://...neon...sslmode=require"
npx tsx prisma/seed.ts
npx tsx prisma/promote-admin.ts 你的邮箱 admin
```
（seed/promote 走的是同一个 Neon 库，跑一次即可。）

---

## 说明与注意
- **同源代理**：前端 `API_PROXY_TARGET` 指向后端，浏览器只见前端域名，cookie 用 `lax`（生产 `Secure`）即可，无需 `COOKIE_CROSS_SITE`。
- **冷启动**：后端 serverless 空闲后首个请求要多等 1–3 秒（Nest 初始化），属正常。
- **迁移自动执行**：后端每次部署构建时 `prisma migrate deploy` 应用新迁移到 Neon。
- **需要后台任务时**（领取超时释放等）：serverless 跑不了常驻 worker。两种补法：
  1. 用一台 Docker 主机（如 Koyeb/Fly，注意各家是否要卡）跑仓库根目录的 `Dockerfile`
     （已含启动即迁移 + 常驻进程，`node apps/api/dist/worker.js` 可单独跑 worker）；
  2. 或用 Vercel Cron 定时打一个清理接口（后续再加）。
- **本地开发不变**：`npm run dev:web` + `dev:api`，`/api` 走本地代理。
- **改用 GitHub Pages 放前端**（可选）：前端也可静态导出上 Pages（仓库已内置 `STATIC_EXPORT` 与
  Pages 工作流），但那样是跨源，需要在后端设 `COOKIE_CROSS_SITE=true` + `CORS_ORIGIN`，
  比全 Vercel 同源麻烦，不推荐。

---

## 推送代码到 GitHub
Vercel 从 GitHub 拉取，需先把分支合并到 `main` 并推送：
```bash
git checkout main && git merge feat/foyer-craft && git push origin main
```
（这一步是对外发布，确认后再做。）
