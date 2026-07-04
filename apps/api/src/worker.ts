import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

/**
 * 独立 worker 进程入口（无 HTTP 监听）。
 * 与 API 共享 AppModule，WorkerService 在 onModuleInit 启动队列消费者与定时任务。
 * 生产可用此入口将 worker 与 API 分开部署。
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  new Logger('Worker').log('Worker process started');
}

void bootstrap();
