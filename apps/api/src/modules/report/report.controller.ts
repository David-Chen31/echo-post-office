import { Body, Controller, Post } from '@nestjs/common';
import { createReportSchema, CreateReportDto } from '@letter/shared';
import { ReportService } from './report.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('reports')
export class ReportController {
  constructor(private readonly report: ReportService) {}

  @RateLimit({ windowSec: 60, max: 10 })
  @Post()
  async create(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(createReportSchema)) dto: CreateReportDto,
  ): Promise<{ reportId: string }> {
    return this.report.create(userId, dto);
  }
}
