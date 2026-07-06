import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AUDIT_KEY, AuditMeta } from '../decorators/audit.decorator';
import { AuthUser } from '../decorators/current-user.decorator';

/**
 * 管理操作审计：对带 @Audit 的接口，在成功返回后写一条 audit_logs（不可删）。
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditMeta>(AUDIT_KEY, context.getHandler());
    if (!meta) return next.handle();

    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const operatorId = req.user?.userId;
    const targetId = this.pickTargetId(req);
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;

    return next.handle().pipe(
      tap((result) => {
        if (!operatorId) return;
        void this.prisma.auditLog
          .create({
            data: {
              operatorId,
              action: meta.action,
              targetType: meta.targetType,
              targetId,
              after: this.safeJson({ params: req.params, body: this.redact(req.body), result }),
              ip: ip ?? undefined,
            },
          })
          .catch(() => {
            /* 审计失败不影响主流程 */
          });
    }));
  }

  private pickTargetId(req: Request): bigint {
    const raw = (req.params?.id as string) ?? (req.body?.targetId as string) ?? '0';
    try {
      return BigInt(raw);
    } catch {
      return BigInt(0);
    }
  }

  private redact(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...(body as Record<string, unknown>) };
    for (const k of ['password', 'code', 'refreshToken']) delete clone[k];
    return clone;
  }

  private safeJson(v: unknown): object {
    try {
      return JSON.parse(JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? val.toString() : val)));
    } catch {
      return {};
    }
  }
}
