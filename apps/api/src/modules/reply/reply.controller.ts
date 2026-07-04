import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import {
  replyDraftSchema,
  submitReplySchema,
  replyFeedbackSchema,
  ReplyDraftDto,
  SubmitReplyDto,
  ReplyFeedbackDto,
} from '@letter/shared';
import { ReplyService, ReplySubmitView } from './reply.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('replies')
export class ReplyController {
  constructor(private readonly reply: ReplyService) {}

  @Post('draft')
  async draft(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(replyDraftSchema)) dto: ReplyDraftDto,
  ): Promise<{ replyId: string }> {
    return this.reply.saveDraft(userId, BigInt(dto.claimId), dto.content);
  }

  @RateLimit({ windowSec: 60, max: 10 })
  @Post()
  async submit(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(submitReplySchema)) dto: SubmitReplyDto,
    @Headers('idempotency-key') idemKey?: string,
  ): Promise<ReplySubmitView> {
    return this.reply.submit(userId, BigInt(dto.claimId), dto.content, idemKey);
  }

  @Post(':id/feedback')
  async feedback(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replyFeedbackSchema)) dto: ReplyFeedbackDto,
  ): Promise<{ ok: boolean }> {
    return this.reply.giveFeedback(userId, BigInt(id), dto.type);
  }

  @Post(':id/favorite')
  async favorite(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    return this.reply.favorite(userId, BigInt(id));
  }
}
