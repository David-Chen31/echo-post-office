import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AccountType, ApiCode, LoginDto, RegisterDto, SendCodeDto } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RedisService } from '../../infra/redis/redis.service';
import { MailService } from '../../infra/mail/mail.service';
import { BusinessException } from '../../common/errors/business.exception';
import { AppRole } from '../../common/decorators/roles.decorator';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const CODE_TTL = 300; // 5 分钟

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private codeKey(scene: string, target: string): string {
    return `authcode:${scene}:${target}`;
  }

  async sendCode(dto: SendCodeDto): Promise<void> {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.redis.setEx(this.codeKey(dto.scene, dto.target), code, CODE_TTL);
    await this.mail.sendCode(dto.target, code);
  }

  private async verifyCode(scene: string, target: string, code: string): Promise<void> {
    const saved = await this.redis.get(this.codeKey(scene, target));
    if (!saved || saved !== code) {
      throw new BusinessException(ApiCode.BAD_REQUEST, '验证码错误或已过期');
    }
    await this.redis.del(this.codeKey(scene, target));
  }

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    await this.verifyCode('register', dto.target, dto.code);

    const isEmail = dto.accountType === AccountType.EMAIL;
    const existing = await this.prisma.user.findFirst({
      where: isEmail ? { email: dto.target } : { phone: dto.target },
    });
    if (existing) {
      throw new BusinessException(ApiCode.CONFLICT, '该账号已注册');
    }

    const user = await this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        accountType: dto.accountType,
        email: isEmail ? dto.target : null,
        phone: isEmail ? null : dto.target,
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 10) : null,
      },
    });
    return { userId: user.id.toString() };
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.target }, { phone: dto.target }] },
    });
    if (!user || user.status === 'DELETED') {
      throw new BusinessException(ApiCode.UNAUTHORIZED, '账号不存在');
    }
    if (user.status === 'BANNED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '账号已被封禁');
    }

    if (dto.code) {
      await this.verifyCode('login', dto.target, dto.code);
    } else if (dto.password) {
      const okPw = user.passwordHash && (await bcrypt.compare(dto.password, user.passwordHash));
      if (!okPw) throw new BusinessException(ApiCode.UNAUTHORIZED, '密码错误');
    } else {
      throw new BusinessException(ApiCode.BAD_REQUEST, '需要验证码或密码');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });
    return this.issueTokens(user.id, this.normalizeRole(user.role));
  }

  private normalizeRole(role: string): AppRole {
    return role === 'admin' || role === 'moderator' ? role : 'user';
  }

  private revokedKey(jti: string): string {
    return `revoked:rt:${jti}`;
  }

  /**
   * 刷新令牌：校验 → 查黑名单 → 重读用户（角色/封禁生效）→ 轮换（作废旧 jti，签发新令牌）。
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: { sub: string; role: AppRole; jti?: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new BusinessException(ApiCode.UNAUTHORIZED, '登录已失效，请重新登录');
    }
    if (payload.jti && (await this.redis.get(this.revokedKey(payload.jti)))) {
      throw new BusinessException(ApiCode.UNAUTHORIZED, '登录已失效，请重新登录');
    }
    const user = await this.prisma.user.findUnique({ where: { id: BigInt(payload.sub) } });
    if (!user || user.status === 'DELETED' || user.status === 'BANNED') {
      throw new BusinessException(ApiCode.FORBIDDEN, '账号不可用');
    }
    // 轮换：作废旧 refresh
    if (payload.jti) {
      await this.redis.setEx(
        this.revokedKey(payload.jti),
        '1',
        Number(this.config.get<string>('JWT_REFRESH_TTL', '2592000')),
      );
    }
    return this.issueTokens(user.id, this.normalizeRole(user.role));
  }

  /** 登出：把当前 refresh 令牌加入黑名单，使其立即失效。 */
  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.jwt.verifyAsync<{ jti?: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.jti) {
        await this.redis.setEx(
          this.revokedKey(payload.jti),
          '1',
          Number(this.config.get<string>('JWT_REFRESH_TTL', '2592000')),
        );
      }
    } catch {
      /* 令牌已无效，忽略 */
    }
  }

  private async issueTokens(userId: bigint, role: AppRole): Promise<TokenPair> {
    const sub = userId.toString();
    const accessToken = await this.jwt.signAsync(
      { sub, role },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_ACCESS_TTL', '900')),
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, role, jti: randomUUID() },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: Number(this.config.get<string>('JWT_REFRESH_TTL', '2592000')),
      },
    );
    return { accessToken, refreshToken };
  }
}
