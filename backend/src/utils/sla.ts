import { Priority, SlaStatus } from "@prisma/client";

const DEFAULT_RESOLVE_HOURS: Record<Priority, number> = {
  LOW: 96,
  MEDIUM: 48,
  HIGH: 24,
  URGENT: 8,
};

export function calculateSlaDueDate(priority: Priority, from: Date = new Date(), categorySlaHours?: number): Date {
  const hours = categorySlaHours ?? DEFAULT_RESOLVE_HOURS[priority];
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

const CLOSED_STATUSES = new Set(["COMPLETED", "REJECTED", "CANCELLED"]);

// Determine live SLA status/color band for a ticket.
// GREEN (WITHIN_SLA): more than 24h remaining
// AMBER (AT_RISK): less than 24h remaining, not yet due
// RED (OVERDUE): past due date and still open
export function computeSlaStatus(slaDueAt: Date | null, status: string, now: Date = new Date()): SlaStatus {
  if (!slaDueAt) return "WITHIN_SLA";
  if (CLOSED_STATUSES.has(status)) {
    return now > slaDueAt ? "BREACHED" : "MET";
  }
  const msRemaining = slaDueAt.getTime() - now.getTime();
  if (msRemaining <= 0) return "OVERDUE";
  if (msRemaining <= 24 * 60 * 60 * 1000) return "AT_RISK";
  return "WITHIN_SLA";
}

export function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}
