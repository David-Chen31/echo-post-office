import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './infra/prisma/prisma.module';
import { RedisModule } from './infra/redis/redis.module';
import { QueueModule } from './infra/queue/queue.module';
import { MailModule } from './infra/mail/mail.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { LetterModule } from './modules/letter/letter.module';
import { ClaimModule } from './modules/claim/claim.module';
import { ReplyModule } from './modules/reply/reply.module';
import { MailboxModule } from './modules/mailbox/mailbox.module';
import { ReportModule } from './modules/report/report.module';
import { ContentModule } from './modules/content/content.module';
import { AdminModule } from './modules/admin/admin.module';
import { WorkerModule } from './modules/worker/worker.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // infra (global)
    PrismaModule,
    RedisModule,
    QueueModule,
    MailModule,
    // domain
    AuthModule,
    UserModule,
    ModerationModule,
    NotificationModule,
    LetterModule,
    ClaimModule,
    ReplyModule,
    MailboxModule,
    ReportModule,
    ContentModule,
    AdminModule,
    WorkerModule,
  ],
  providers: [
    // 顺序即执行顺序：先鉴权（注入 req.user），再角色，再限流。
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule {}
