# 上线部署指南（GitHub Pages + 免费后端）

前端是纯静态站，放 **GitHub Pages**；后端（NestJS）+ **Postgres** + **Redis** + **邮件** 放免费托管。
你负责注册账号、把连接串/密钥填进环境变量；代码、配置、CI 都已就绪。

```
浏览器 ──> GitHub Pages（前端静态站）
              │  fetch(NEXT_PUBLIC_API_BASE)  跨源 + 携带 cookie
              ▼
        Render（后端 Docker）──> Neon(Postgres) / Upstash 或 Render(Redis) / SMTP(邮件)
```

> 关键点：前端和后端不同域名，所以 cookie 走 `SameSite=None; Secure`（后端已按 `COOKIE_CROSS_SITE=true` 处理），
> 后端只放行你的 Pages 源（`CORS_ORIGIN`）。

---

## 1. Postgres（Neon，免费）
1. https://neon.tech 新建项目。
2. 复制连接串（形如 `postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require`）。
3. 记为 **DATABASE_URL**。

## 2. Redis（二选一）
- **Upstash**（https://upstash.com，免费）：创建 Redis，复制 `rediss://...` 连接串。
- 或 **Render Key Value**（和后端同平台，内网更稳）：创建后复制内网连接串。
- 记为 **REDIS_URL**。

## 3. 邮件 SMTP（真实发验证码）
用任意支持 SMTP 的邮箱/服务，拿到 host/port/user/pass：
- QQ 邮箱：`smtp.qq.com:587`，密码用"授权码"（非登录密码）。
- Gmail：`smtp.gmail.com:587` + 应用专用密码。
- 或 Resend/SendGrid 等。
- 记为 **SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS**，以及发件人 **MAIL_FROM**（如 `回声邮局 <no-reply@你的域名>`）。

## 4. 后端上线（Render）
1. 代码推到 GitHub（见文末）。
2. https://render.com → New → **Blueprint** → 选本仓库，会读取根目录 `render.yaml`。
3. 在服务的 **Environment** 里填 `sync:false` 的变量：
   - `DATABASE_URL`、`REDIS_URL`、`CORS_ORIGIN`（先留空或填占位，第 5 步拿到 Pages 地址后回填）、
   - `MAIL_FROM`、`SMTP_HOST`、`SMTP_USER`、`SMTP_PASS`（`SMTP_PORT` 默认 587）。
   - `JWT_*` 已配置为自动生成。
4. 部署完成后拿到后端地址，如 `https://echo-post-api.onrender.com`。
   - 容器启动会**自动执行数据库迁移**（`prisma migrate deploy`），无需手动建表。
   - 健康检查：访问 `https://<后端>/api/v1/health` 应返回 `{"ok":true}`。
5. （可选）灌入示范信 + 设管理员：Render 服务 → **Shell**：
   ```bash
   npx tsx prisma/seed.ts
   npx tsx prisma/promote-admin.ts 你的邮箱 admin
   ```

## 5. 前端上线（GitHub Pages）
1. 仓库 **Settings → Pages → Build and deployment → Source = GitHub Actions**。
2. 仓库 **Settings → Secrets and variables → Actions → Variables** 新增：
   - `NEXT_PUBLIC_API_BASE` = 第 4 步的后端地址（如 `https://echo-post-api.onrender.com`）。
   - `NEXT_PUBLIC_BASE_PATH` = `/<仓库名>`（项目页必须，如 `/echo-post`）。
     - 若用**自定义域名**或 **用户主页仓库**（`<user>.github.io`），此项留空不设。
3. 推送到 `main`（或在 Actions 里手动 Run），工作流 `Deploy Web to GitHub Pages` 会构建并发布。
4. 得到前端地址，如 `https://<user>.github.io/<仓库名>/`。

## 6. 打通跨源（回填 CORS）
1. 回到 Render，把 **CORS_ORIGIN** 设为第 5 步的 Pages 源（**不带路径**，如 `https://<user>.github.io`），保存触发重部署。
2. 打开 Pages 地址 → 注册（会收到真实验证码邮件）→ 写信/读信验证跑通。

---

## 说明与注意
- **Render 免费实例会休眠**：无人访问一段时间后休眠，下次首个请求要等 ~30–50 秒唤醒（属正常）。
- **迁移自动执行**：每次后端部署启动时 `prisma migrate deploy` 会把新迁移应用到 Neon。
- **后台任务（worker）**：领取超时释放等后台作业在独立 `worker.ts`。首个版本仅跑 API 也能用核心闭环；
  如需后台作业，可另开一个 Render 服务（同镜像，启动命令改为 `node apps/api/dist/worker.js`）——非上线必需，可后补。
- **本地开发不受影响**：不设 `STATIC_EXPORT` 时仍是同源 `/api` 代理 + `sameSite=lax`。
- **自定义域名**：给 Pages 绑定域名后，`NEXT_PUBLIC_BASE_PATH` 留空，并把 `CORS_ORIGIN` 换成该域名。
