export type Role = "OPERATIONS" | "WFM" | "ADMIN";

export type RequestStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_INFORMATION"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SlaStatus = "WITHIN_SLA" | "AT_RISK" | "OVERDUE" | "MET" | "BREACHED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  isActive: boolean;
  slaHours: number;
}

export interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
}

export interface RequestSummary {
  id: string;
  ticketNumber: string;
  categoryId: string;
  vendorId: string;
  effectiveDate: string;
  description: string;
  teamLeaderName: string;
  teamLeaderEmail: string;
  agentName: string;
  agentEmail: string;
  agentId: string;
  priority: Priority;
  status: RequestStatus;
  createdById: string;
  assignedToId?: string | null;
  internalNotes?: string | null;
  estimatedCompletionDate?: string | null;
  completionDate?: string | null;
  firstResponseAt?: string | null;
  slaDueAt?: string | null;
  slaStatus: SlaStatus;
  createdAt: string;
  updatedAt: string;
  category: Category;
  vendor: Vendor;
  createdBy: Pick<User, "id" | "firstName" | "lastName" | "email">;
  assignedTo?: Pick<User, "id" | "firstName" | "lastName" | "email"> | null;
  _count?: { comments: number; attachments: number };
}

export interface Comment {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  mentions: string[];
  createdAt: string;
  author: Pick<User, "id" | "firstName" | "lastName" | "email" | "role" | "avatarUrl">;
}

export interface Attachment {
  id: string;
  requestId: string;
  fileName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  requestId: string;
  userId: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
  user: Pick<User, "firstName" | "lastName" | "email">;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user?: Pick<User, "firstName" | "lastName" | "email"> | null;
  request?: { ticketNumber: string } | null;
}

export interface NotificationItem {
  id: string;
  type: string;
  status: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  request?: { id: string; ticketNumber: string } | null;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface DashboardData {
  kpis: {
    total: number;
    pending: number;
    assigned: number;
    inProgress: number;
    waitingForInformation: number;
    completed: number;
    cancelled: number;
    rejected: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    overdue: number;
    atRisk: number;
    avgResolutionHours: number;
    avgFirstResponseHours: number;
    slaCompliancePct: number;
    closedThisWeek: number;
    avgTicketAgeHours: number;
  };
  charts: {
    byCategory: Array<{ name: string; count: number }>;
    byVendor: Array<{ name: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    byPriority: Array<{ priority: string; count: number }>;
    byAssignee: Array<{ name: string; count: number }>;
  };
}
