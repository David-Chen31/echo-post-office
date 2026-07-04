import { Body, Controller, Get, Post } from '@nestjs/common';
import { z } from 'zod';
import { NotificationService, NotificationView } from './notification.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

const markReadSchema = z.object({ ids: z.array(z.string()).min(1) });
type MarkReadDto = z.infer<typeof markReadSchema>;

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notification: NotificationService) {}

  @Get()
  async list(@CurrentUser('userId') userId: bigint): Promise<NotificationView[]> {
    return this.notification.listUnread(userId);
  }

  @Post('read')
  async read(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(markReadSchema)) dto: MarkReadDto,
  ): Promise<{ updated: number }> {
    return this.notification.markRead(userId, dto.ids.map((i) => BigInt(i)));
  }
}
