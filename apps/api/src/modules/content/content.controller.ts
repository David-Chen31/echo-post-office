import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

/** 公开内容配置（首页文案、社区规则、风险提示等，运营可改）。 */
@Controller('configs')
export class ContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(':key')
  async get(@Param('key') key: string): Promise<{ key: string; value: unknown }> {
    const cfg = await this.prisma.contentConfig.findUnique({ where: { key } });
    if (!cfg) throw new NotFoundException('配置不存在');
    return { key: cfg.key, value: cfg.value };
  }
}
