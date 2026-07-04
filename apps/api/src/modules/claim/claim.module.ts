import { Module } from '@nestjs/common';
import { ClaimService } from './claim.service';
import { ClaimController } from './claim.controller';
import { UserModule } from '../user/user.module';
import { LetterModule } from '../letter/letter.module';

@Module({
  imports: [UserModule, LetterModule],
  controllers: [ClaimController],
  providers: [ClaimService],
  exports: [ClaimService],
})
export class ClaimModule {}
