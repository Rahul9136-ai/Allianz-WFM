import { Chip } from "@mui/material";
import type { Priority, RequestStatus, SlaStatus } from "../../types";

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: "#8A5B00", bg: "#FFF3D6" },
  ASSIGNED: { label: "Assigned", color: "#0B5FA5", bg: "#E3F1FC" },
  IN_PROGRESS: { label: "In Progress", color: "#7A3EC7", bg: "#F1E7FC" },
  WAITING_FOR_INFORMATION: { label: "Waiting for Info", color: "#5B5B5B", bg: "#F0F0F0" },
  COMPLETED: { label: "Completed", color: "#2E7D32", bg: "#E5F4E6" },
  REJECTED: { label: "Rejected", color: "#C7272F", bg: "#FCE7E8" },
  CANCELLED: { label: "Cancelled", color: "#5B5B5B", bg: "#EDEDED" },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low", color: "#2E7D32", bg: "#E5F4E6" },
  MEDIUM: { label: "Medium", color: "#0B5FA5", bg: "#E3F1FC" },
  HIGH: { label: "High", color: "#ED6C02", bg: "#FDECD9" },
  URGENT: { label: "Urgent", color: "#C7272F", bg: "#FCE7E8" },
};

const SLA_CONFIG: Record<SlaStatus, { label: string; color: string; bg: string }> = {
  WITHIN_SLA: { label: "Within SLA", color: "#2E7D32", bg: "#E5F4E6" },
  AT_RISK: { label: "Due Soon", color: "#ED6C02", bg: "#FDECD9" },
  OVERDUE: { label: "Overdue", color: "#C7272F", bg: "#FCE7E8" },
  MET: { label: "Met SLA", color: "#2E7D32", bg: "#E5F4E6" },
  BREACHED: { label: "SLA Breached", color: "#C7272F", bg: "#FCE7E8" },
};

export function StatusChip({ status }: { status: RequestStatus }) {
  const cfg = STATUS_CONFIG[status];
  return <Chip label={cfg.label} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 700 }} />;
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return <Chip label={cfg.label} size="small" sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 700 }} />;
}

export function SlaChip({ slaStatus }: { slaStatus: SlaStatus }) {
  const cfg = SLA_CONFIG[slaStatus];
  const pulsing = slaStatus === "OVERDUE";
  return (
    <Chip
      label={cfg.label}
      size="small"
      className={pulsing ? "sla-pulse" : undefined}
      sx={{ color: cfg.color, bgcolor: cfg.bg, fontWeight: 700 }}
    />
  );
}
