# 后端（NestJS + Prisma）生产镜像。用于 Render / Railway / 任意支持 Docker 的托管。
FROM node:20-slim AS build
WORKDIR /app
# Prisma 引擎需要 openssl
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# 先装依赖（利用缓存）
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY prisma prisma
RUN npm ci

# 源码 + 构建
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build:shared \
  && npx prisma generate --schema prisma/schema.prisma \
  && npm run build:api

FROM node:20-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
# 从构建阶段带上依赖、产物、Prisma schema 与已生成的 client
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/prisma ./prisma
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

EXPOSE 4000
# 启动前应用数据库迁移，再启动服务
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node apps/api/dist/main.js"]
