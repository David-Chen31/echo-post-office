// Vercel Serverless 入口：把 NestJS 应用包成一个无服务器函数。
// 首次调用冷启动 bootstrap 一次，之后复用同一实例。
// 注意：serverless 无常驻进程，BullMQ 后台 worker 与定时任务不会运行（见 DEPLOY.md 说明）。
import 'reflect-metadata';
import express from 'express';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../apps/api/src/app.module';
import { AllExceptionsFilter } from '../apps/api/src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../apps/api/src/common/interceptors/response.interceptor';

// BigInt 统一序列化为字符串（与 main.ts 一致）
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const expressApp = express();
let ready: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { cors: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(cookieParser());

  const corsOrigin = config.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.init();
}

export default async function handler(req: Request, res: Response): Promise<void> {
  if (!ready) ready = bootstrap();
  await ready;
  expressApp(req, res);
}
