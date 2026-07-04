import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 邮件/短信发送。dev 环境用 console 驱动（验证码直接打印到日志）。
 * 生产替换为云厂商邮件/短信适配。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly driver: string;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<string>('MAIL_DRIVER', 'console');
  }

  async sendCode(target: string, code: string): Promise<void> {
    if (this.driver === 'console') {
      this.logger.log(`[验证码] -> ${target} : ${code}`);
      return;
    }
    // TODO: 接入云厂商邮件/短信
    this.logger.warn(`mail driver '${this.driver}' not implemented, code for ${target}: ${code}`);
  }

  async sendNotification(target: string, subject: string, body: string): Promise<void> {
    if (this.driver === 'console') {
      this.logger.log(`[通知] -> ${target} | ${subject} | ${body}`);
      return;
    }
    this.logger.warn(`mail driver '${this.driver}' not implemented for notification to ${target}`);
  }
}
