/**
 * Audit domain — write-only security audit trail.
 *
 * Records are appended via the event bus (see events.ts) for sensitive
 * actions: auth events, password changes, certificate issuance, payment
 * failures, admin moderation. The write path is fire-and-forget: an audit
 * failure must never break the business action that triggered it.
 *
 * Never store passwords, tokens, or message content — only metadata.
 */
import { prisma } from "../prisma-client";

export interface AuditEntry {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
}

/** Append an audit record. Never throws. */
export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId ?? null,
        meta: (entry.meta as object) ?? undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err);
  }
}

/** List recent audit entries (ADMIN dashboard / audit viewer). */
export async function listAuditLogs(opts?: { take?: number; action?: string }) {
  return prisma.auditLog.findMany({
    where: opts?.action ? { action: opts.action } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.take ?? 100,
  });
}
