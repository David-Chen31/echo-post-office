import { Module } from '@nestjs/common';
import { ReplyService } from './reply.service';
import { ReplyController } from './reply.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { ClaimModule } from '../claim/claim.module';
import { LetterModule } from '../letter/letter.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ModerationModule, ClaimModule, LetterModule, NotificationModule, UserModule],
  controllers: [ReplyController],
  providers: [ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
