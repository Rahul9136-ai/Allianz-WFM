import { z } from "zod";

export const createRequestSchema = z.object({
  categoryId: z.string().uuid(),
  vendorId: z.string().uuid(),
  effectiveDate: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  teamLeaderName: z.string().min(1),
  teamLeaderEmail: z.string().email(),
  agentName: z.string().min(1),
  agentEmail: z.string().email(),
  agentId: z.string().min(1),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const wfmUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_FOR_INFORMATION",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ]).optional(),
  assignedToId: z.string().uuid().nullable().optional(),
  internalNotes: z.string().optional(),
  estimatedCompletionDate: z.coerce.date().nullable().optional(),
  completionDate: z.coerce.date().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});

export const listRequestsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional(),
  slaStatus: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  mine: z.coerce.boolean().optional(),
});

export const commentSchema = z.object({
  body: z.string().min(1),
  isInternal: z.coerce.boolean().optional().default(false),
  mentions: z.array(z.string()).optional().default([]),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum([
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "WAITING_FOR_INFORMATION",
    "COMPLETED",
    "REJECTED",
    "CANCELLED",
  ]).optional(),
  assignedToId: z.string().uuid().optional(),
});
