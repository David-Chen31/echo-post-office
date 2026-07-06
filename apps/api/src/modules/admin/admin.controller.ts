import { Body, Controller, Get, Param, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { z } from 'zod';
import { ModerationAction, ReportStatus } from '@letter/shared';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const reviewSchema = z.object({
  action: z.nativeEnum(ModerationAction),
  note: z.string().max(500).optional(),
});
type ReviewDto = z.infer<typeof reviewSchema>;

const handleReportSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  note: z.string().max(500).optional(),
});
type HandleReportDto = z.infer<typeof handleReportSchema>;

const setConfigSchema = z.object({ value: z.unknown() });

@Controller('admin')
@Roles('admin', 'moderator')
@UseInterceptors(AuditInterceptor)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  dashboard(): Promise<Record<string, number>> {
    return this.admin.dashboard();
  }

  // ---- 审核队列 ----
  @Get('letters')
  letters(@Query('status') status?: string, @Query('risk') risk?: string): Promise<unknown[]> {
    return this.admin.listLetters(status, risk);
  }

  @Get('replies')
  replies(@Query('status') status?: string): Promise<unknown[]> {
    return this.admin.listReplies(status);
  }

  @Audit('review_letter', 'LETTER')
  @Post('letters/:id/review')
  reviewLetter(
    @CurrentUser('userId') operatorId: bigint,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewSchema)) dto: ReviewDto,
  ): Promise<{ ok: boolean; status: string }> {
    return this.admin.reviewLetter(operatorId, BigInt(id), dto.action, dto.note);
  }

  @Audit('review_reply', 'REPLY')
  @Post('replies/:id/review')
  reviewReply(
    @CurrentUser('userId') operatorId: bigint,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reviewSchema)) dto: ReviewDto,
  ): Promise<{ ok: boolean; status: string }> {
    return this.admin.reviewReply(operatorId, BigInt(id), dto.action, dto.note);
  }

  // ---- 举报 ----
  @Get('reports')
  reports(@Query('status') status?: string, @Query('priority') priority?: string): Promise<unknown[]> {
    return this.admin.listReports(status, priority);
  }

  @Audit('handle_report', 'REPORT')
  @Post('reports/:id/handle')
  handleReport(
    @CurrentUser('userId') operatorId: bigint,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(handleReportSchema)) dto: HandleReportDto,
  ): Promise<{ ok: boolean }> {
    return this.admin.handleReport(operatorId, BigInt(id), dto.status, dto.note);
  }

  // ---- 用户管理 ----
  @Get('users/:id')
  userDetail(@Param('id') id: string): Promise<unknown> {
    return this.admin.getUserDetail(BigInt(id));
  }

  @Audit('limit_user', 'USER')
  @Post('users/:id/limit')
  limitUser(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(z.object({ kind: z.enum(['write', 'reply']) }))) dto: { kind: 'write' | 'reply' },
  ): Promise<{ ok: boolean }> {
    return this.admin.limitUser(BigInt(id), dto.kind);
  }

  @Audit('ban_user', 'USER')
  @Post('users/:id/ban')
  banUser(@Param('id') id: string): Promise<{ ok: boolean }> {
    return this.admin.banUser(BigInt(id));
  }

  @Audit('restore_user', 'USER')
  @Post('users/:id/appeal')
  restoreUser(@Param('id') id: string): Promise<{ ok: boolean }> {
    return this.admin.restoreUser(BigInt(id));
  }

  // ---- 内容配置 ----
  @Get('configs/:key')
  getConfig(@Param('key') key: string): Promise<unknown> {
    return this.admin.getConfig(key);
  }

  @Audit('set_config', 'CONFIG')
  @Put('configs/:key')
  setConfig(
    @Param('key') key: string,
    @Body(new ZodValidationPipe(setConfigSchema)) dto: { value: unknown },
  ): Promise<{ ok: boolean }> {
    return this.admin.setConfig(key, dto.value);
  }
}
