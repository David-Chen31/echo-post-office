import { Controller, Get } from '@nestjs/common';
import {
  DraftView,
  MailboxService,
  ReceivedReplyView,
  ReplyingView,
  SentLetterView,
} from './mailbox.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('mailbox')
export class MailboxController {
  constructor(private readonly mailbox: MailboxService) {}

  @Get('sent')
  sent(@CurrentUser('userId') userId: bigint): Promise<SentLetterView[]> {
    return this.mailbox.sent(userId);
  }

  @Get('received')
  received(@CurrentUser('userId') userId: bigint): Promise<ReceivedReplyView[]> {
    return this.mailbox.received(userId);
  }

  @Get('replying')
  replying(@CurrentUser('userId') userId: bigint): Promise<ReplyingView[]> {
    return this.mailbox.replying(userId);
  }

  @Get('favorites')
  favorites(@CurrentUser('userId') userId: bigint): Promise<ReceivedReplyView[]> {
    return this.mailbox.favorites(userId);
  }

  @Get('drafts')
  drafts(@CurrentUser('userId') userId: bigint): Promise<DraftView[]> {
    return this.mailbox.drafts(userId);
  }
}
