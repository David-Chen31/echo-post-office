import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

/** 健康检查（供托管平台探活）。路由：/api/v1/health */
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check(): { ok: boolean; ts: number } {
    return { ok: true, ts: Date.now() };
  }
}
