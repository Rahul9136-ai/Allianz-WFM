import { prisma } from "../config/prisma";

interface AuditParams {
  requestId?: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
}

// Audit logs are append-only: created here, never updated or deleted by application code.
export async function recordAudit(params: AuditParams) {
  await prisma.auditLog.create({
    data: {
      requestId: params.requestId,
      userId: params.userId ?? undefined,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      oldValue: params.oldValue === undefined ? undefined : JSON.stringify(params.oldValue),
      newValue: params.newValue === undefined ? undefined : JSON.stringify(params.newValue),
      ipAddress: params.ipAddress ?? undefined,
    },
  });
}

interface HistoryParams {
  requestId: string;
  userId: string;
  field: string;
  oldValue?: unknown;
  newValue?: unknown;
  note?: string;
}

export async function recordHistory(params: HistoryParams) {
  await prisma.requestHistory.create({
    data: {
      requestId: params.requestId,
      userId: params.userId,
      field: params.field,
      oldValue: params.oldValue === undefined || params.oldValue === null ? undefined : String(params.oldValue),
      newValue: params.newValue === undefined || params.newValue === null ? undefined : String(params.newValue),
      note: params.note,
    },
  });
}
