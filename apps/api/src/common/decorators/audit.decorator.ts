import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';
export interface AuditMeta {
  action: string;
  targetType: string;
}
/** 标记需要写入审计日志的管理操作。 */
export const Audit = (action: string, targetType: string) =>
  SetMetadata(AUDIT_KEY, { action, targetType } as AuditMeta);
