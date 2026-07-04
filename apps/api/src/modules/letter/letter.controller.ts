import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import {
  letterDraftSchema,
  submitLetterSchema,
  LetterDraftDto,
  SubmitLetterDto,
} from '@letter/shared';
import { LetterService } from './letter.service';
import { LetterOwnerView } from './letter.types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('letters')
export class LetterController {
  constructor(private readonly letter: LetterService) {}

  @Post('draft')
  async draft(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(letterDraftSchema)) dto: LetterDraftDto,
  ): Promise<{ draftId: string }> {
    return this.letter.saveDraft(userId, dto);
  }

  @RateLimit({ windowSec: 60, max: 5 })
  @Post()
  async submit(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(submitLetterSchema)) dto: SubmitLetterDto,
    @Headers('idempotency-key') idemKey?: string,
  ): Promise<LetterOwnerView> {
    return this.letter.submit(userId, dto, idemKey);
  }

  @Get(':id')
  async getOwned(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
  ): Promise<LetterOwnerView> {
    return this.letter.getOwnedById(userId, BigInt(id));
  }

  @Post(':id/close')
  async close(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    return this.letter.close(userId, BigInt(id));
  }
}
