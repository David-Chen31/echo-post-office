import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  refreshSchema,
  sendCodeSchema,
  SendCodeDto,
  RegisterDto,
  LoginDto,
  RefreshDto,
} from '@letter/shared';
import { AuthService, TokenPair } from './auth.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @RateLimit({ windowSec: 60, max: 3 })
  @Post('code')
  async sendCode(@Body(new ZodValidationPipe(sendCodeSchema)) dto: SendCodeDto): Promise<{ sent: boolean }> {
    await this.auth.sendCode(dto);
    return { sent: true };
  }

  @Public()
  @RateLimit({ windowSec: 60, max: 5 })
  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenPair> {
    const tokens = await this.auth.register(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @RateLimit({ windowSec: 60, max: 10 })
  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenPair> {
    const tokens = await this.auth.login(dto);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<TokenPair> {
    const tokens = await this.auth.refresh(dto.refreshToken);
    this.setAuthCookies(res, tokens);
    return tokens;
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: boolean }> {
    const rt = (req as Request & { cookies?: Record<string, string> }).cookies?.refresh_token;
    await this.auth.logout(rt);
    const { sameSite, secure } = cookiePolicy();
    res.clearCookie('access_token', { sameSite, secure });
    res.clearCookie('refresh_token', { sameSite, secure });
    return { ok: true };
  }

  private setAuthCookies(res: Response, tokens: TokenPair): void {
    const { sameSite, secure } = cookiePolicy();
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }
}

/**
 * Cookie 策略：
 * - 同源部署（默认）：sameSite=lax。
 * - 跨源部署（前端 GitHub Pages + 后端另一域名）：设 COOKIE_CROSS_SITE=true，
 *   则 sameSite=none + secure=true（浏览器要求跨站 cookie 必须 Secure）。
 */
function cookiePolicy(): { sameSite: 'lax' | 'none'; secure: boolean } {
  const crossSite = process.env.COOKIE_CROSS_SITE === 'true';
  if (crossSite) return { sameSite: 'none', secure: true };
  return { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' };
}
