import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RedisService } from '../../infra/redis/redis.service';
import { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!opts) return true;

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const identity = req.user?.userId?.toString() ?? req.ip ?? 'anon';
    const routeKey = `${req.method}:${req.route?.path ?? req.path}`;
    const key = `ratelimit:${routeKey}:${identity}`;

    const count = await this.redis.incrWithTtl(key, opts.windowSec);
    if (count > opts.max) {
      throw new HttpException('操作太频繁了，请慢一点', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
