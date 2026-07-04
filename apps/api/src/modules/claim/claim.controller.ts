import { Controller, Get, Param, Post } from '@nestjs/common';
import { ClaimResult, ClaimService } from './claim.service';
import { LetterReaderView } from '../letter/letter.types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('mailbox/inbox')
export class ClaimController {
  constructor(private readonly claim: ClaimService) {}

  /** 待回信箱：取一封可领取的信（只读窥视）。 */
  @Get()
  async peek(@CurrentUser('userId') userId: bigint): Promise<{ letter: LetterReaderView | null }> {
    return { letter: await this.claim.peek(userId) };
  }

  /** 领取这封信。 */
  @RateLimit({ windowSec: 60, max: 20 })
  @Post(':id/claim')
  async claimLetter(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
  ): Promise<ClaimResult> {
    return this.claim.claimById(userId, BigInt(id));
  }

  /** 跳过这封信。 */
  @Post(':id/skip')
  async skip(
    @CurrentUser('userId') userId: bigint,
    @Param('id') id: string,
  ): Promise<{ ok: boolean }> {
    return this.claim.skip(userId, BigInt(id));
  }
}
