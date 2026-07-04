import { Injectable } from '@nestjs/common';
import { CreateReportDto, ReportPriority, ReportReason } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: bigint, dto: CreateReportDto): Promise<{ reportId: string }> {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        targetId: BigInt(dto.targetId),
        reason: dto.reason,
        description: dto.description ?? null,
        priority: this.priorityOf(dto.reason),
      },
    });
    return { reportId: report.id.toString() };
  }

  /** 危险类举报优先处理（计划书：高风险进特殊队列）。 */
  private priorityOf(reason: ReportReason): ReportPriority {
    const high: ReportReason[] = [
      ReportReason.DANGEROUS_ADVICE,
      ReportReason.PORN,
      ReportReason.PRIVACY_LEAK,
    ];
    const low: ReportReason[] = [ReportReason.OTHER];
    if (high.includes(reason)) return ReportPriority.HIGH;
    if (low.includes(reason)) return ReportPriority.LOW;
    return ReportPriority.NORMAL;
  }
}
