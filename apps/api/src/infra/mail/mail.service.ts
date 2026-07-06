import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * 邮件发送。
 * - driver=console（默认/开发）：验证码直接打印到后端日志。
 * - driver=smtp（生产）：用 SMTP_* 环境变量真实发信（任意支持 SMTP 的邮箱/服务）。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly driver: string;
  private readonly from: string;
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    this.driver = this.config.get<string>('MAIL_DRIVER', 'console');
    this.from = this.config.get<string>('MAIL_FROM', '回声邮局 <no-reply@localhost>');
  }

  private getTransport(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    if (!host || !user || !pass) {
      throw new Error('SMTP 未配置：需要 SMTP_HOST / SMTP_USER / SMTP_PASS');
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465=SSL，587=STARTTLS
      auth: { user, pass },
    });
    return this.transporter;
  }

  private async deliver(to: string, subject: string, text: string, consoleLine: string): Promise<void> {
    if (this.driver !== 'smtp') {
      this.logger.log(consoleLine);
      return;
    }
    try {
      await this.getTransport().sendMail({ from: this.from, to, subject, text });
    } catch (e) {
      // 发信失败不应把验证码泄露到日志；仅记录错误，让上层照常返回（用户可重试）
      this.logger.error(`邮件发送失败 -> ${to}: ${(e as Error).message}`);
      throw e;
    }
  }

  async sendCode(target: string, code: string): Promise<void> {
    await this.deliver(
      target,
      '你的回声邮局验证码',
      `你正在登录/注册回声邮局。\n验证码：${code}（5 分钟内有效）。\n若非本人操作，请忽略这封邮件。`,
      `[验证码] -> ${target} : ${code}`,
    );
  }

  async sendNotification(target: string, subject: string, body: string): Promise<void> {
    await this.deliver(target, subject, body, `[通知] -> ${target} | ${subject} | ${body}`);
  }
}
