import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: bigint;
  role: 'user' | 'moderator' | 'admin';
}

/** 从请求中取出当前登录用户（由 JwtAuthGuard 注入）。 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | bigint | string => {
    const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    const user = req.user;
    return data ? user[data] : user;
  },
);
