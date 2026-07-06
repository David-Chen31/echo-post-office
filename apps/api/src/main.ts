import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// BigInt 默认无法 JSON 序列化 —— 统一序列化为字符串（前端按 string 处理 id）。
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  // 信任反向代理（Next 代理 / 生产网关）转发的 X-Forwarded-For，使 req.ip 为真实客户端 IP，限流才不会串号。
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.use(cookieParser());
  app.enableCors({ origin: true, credentials: true });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  // 校验统一走 zod（ZodValidationPipe），不依赖 class-validator。

  const port = config.get<number>('API_PORT', 4000);
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on http://localhost:${port}/api/v1`);
}

void bootstrap();
