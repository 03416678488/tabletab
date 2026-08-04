import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit:action';

export interface AuditMeta {
  action: string;
  targetType?: string;
}

/**
 * Mark a controller handler as auditable. When the request succeeds (2xx), the
 * AuditInterceptor writes an audit entry with the acting admin, the resolved
 * target id, and a short summary.
 *
 * @example @Audit('tenant.create', 'tenant')
 */
export const Audit = (action: string, targetType?: string) =>
  SetMetadata(AUDIT_KEY, { action, targetType } as AuditMeta);
