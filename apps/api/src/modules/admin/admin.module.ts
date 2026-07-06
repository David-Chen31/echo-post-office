import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { ModerationModule } from '../moderation/moderation.module';
import { LetterModule } from '../letter/letter.module';
import { ClaimModule } from '../claim/claim.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [ModerationModule, LetterModule, ClaimModule, NotificationModule],
  controllers: [AdminController],
  providers: [AdminService, AuditInterceptor],
})
export class AdminModule {}
