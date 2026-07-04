import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ClaimModule } from '../claim/claim.module';

@Module({
  imports: [ClaimModule],
  providers: [WorkerService],
})
export class WorkerModule {}
