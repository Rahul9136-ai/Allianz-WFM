import { api } from "./client";
import type {
  AuditLogEntry,
  Attachment,
  Category,
  Comment,
  DashboardData,
  HistoryEntry,
  NotificationItem,
  Paginated,
  RequestSummary,
  User,
  Vendor,
} from "../types";

export const AuthApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { token: string; user: User; expiresInMinutes: number } }>("/auth/login", { email, password }),
  me: () => api.get<{ success: boolean; data: User }>("/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

export const CategoriesApi = {
  list: () => api.get<{ success: boolean; data: Category[] }>("/categories"),
  create: (data: { name: string; slaHours?: number }) => api.post("/categories", data),
  update: (id: string, data: Partial<Category>) => api.patch(`/categories/${id}`, data),
};

export const VendorsApi = {
  list: () => api.get<{ success: boolean; data: Vendor[] }>("/vendors"),
  create: (data: { name: string }) => api.post("/vendors", data),
  update: (id: string, data: Partial<Vendor>) => api.patch(`/vendors/${id}`, data),
};

export const UsersApi = {
  list: () => api.get<{ success: boolean; data: User[] }>("/users"),
  create: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post("/users", data),
  update: (id: string, data: Partial<User>) => api.patch(`/users/${id}`, data),
  deactivate: (id: string) => api.delete(`/users/${id}`),
};

export interface RequestListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  priority?: string;
  categoryId?: string;
  vendorId?: string;
  assignedToId?: string;
  slaStatus?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  mine?: boolean;
}

export const RequestsApi = {
  list: (params: RequestListParams) =>
    api.get<{ success: boolean; items: RequestSummary[]; pagination: Paginated<RequestSummary>["pagination"] }>("/requests", { params }),
  get: (id: string) => api.get<{ success: boolean; data: RequestSummary }>(`/requests/${id}`),
  create: (data: Record<string, unknown>) => api.post<{ success: boolean; data: RequestSummary }>("/requests", data),
  wfmUpdate: (id: string, data: Record<string, unknown>) =>
    api.patch<{ success: boolean; data: RequestSummary }>(`/requests/${id}`, data),
  bulkUpdate: (ids: string[], changes: Record<string, unknown>) => api.post("/requests/bulk-update", { ids, ...changes }),
  history: (id: string) => api.get<{ success: boolean; data: HistoryEntry[] }>(`/requests/${id}/history`),
  audit: (id: string) => api.get<{ success: boolean; data: AuditLogEntry[] }>(`/requests/${id}/audit`),
  comments: (id: string) => api.get<{ success: boolean; data: Comment[] }>(`/requests/${id}/comments`),
  addComment: (id: string, body: string, isInternal: boolean) =>
    api.post<{ success: boolean; data: Comment }>(`/requests/${id}/comments`, { body, isInternal }),
  attachments: (id: string) => api.get<{ success: boolean; data: Attachment[] }>(`/requests/${id}/attachments`),
  uploadAttachments: (id: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("files", file));
    return api.post<{ success: boolean; data: Attachment[] }>(`/requests/${id}/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  downloadUrl: (id: string, attachmentId: string) => `${api.defaults.baseURL}/requests/${id}/attachments/${attachmentId}/download`,
};

export const NotificationsApi = {
  list: () => api.get<{ success: boolean; data: NotificationItem[] }>("/notifications"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post("/notifications/read-all"),
};

export const AuditLogsApi = {
  list: (page = 1, pageSize = 50) => api.get<{ success: boolean; data: AuditLogEntry[] }>("/audit-logs", { params: { page, pageSize } }),
};

export const DashboardApi = {
  get: () => api.get<{ success: boolean; data: DashboardData }>("/dashboard"),
};
