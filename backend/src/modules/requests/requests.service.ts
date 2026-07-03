import { Prisma, RequestStatus } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/apiError";
import { generateTicketNumber } from "../../utils/ticketNumber";
import { calculateSlaDueDate, computeSlaStatus } from "../../utils/sla";
import { recordAudit, recordHistory } from "../../utils/audit";
import { notify } from "../notifications/notification.service";
import { AuthUser } from "../../middleware/auth";
import { z } from "zod";
import { createRequestSchema, listRequestsQuerySchema, wfmUpdateSchema } from "./requests.validation";

const requestWithRelations = {
  category: true,
  vendor: true,
  createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
  _count: { select: { comments: true, attachments: true } },
} satisfies Prisma.RequestInclude;

function withLiveSlaStatus<T extends { slaDueAt: Date | null; status: string }>(request: T) {
  return { ...request, slaStatus: computeSlaStatus(request.slaDueAt, request.status) };
}

export async function createRequest(input: z.infer<typeof createRequestSchema>, user: AuthUser) {
  const category = await prisma.category.findUnique({ where: { id: input.categoryId } });
  if (!category) throw ApiError.badRequest("Invalid category");
  const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
  if (!vendor) throw ApiError.badRequest("Invalid vendor");

  const ticketNumber = await generateTicketNumber();
  const slaDueAt = calculateSlaDueDate(input.priority, new Date(), category.slaHours);

  const request = await prisma.request.create({
    data: {
      ticketNumber,
      categoryId: input.categoryId,
      vendorId: input.vendorId,
      effectiveDate: input.effectiveDate,
      description: input.description,
      teamLeaderName: input.teamLeaderName,
      teamLeaderEmail: input.teamLeaderEmail,
      agentName: input.agentName,
      agentEmail: input.agentEmail,
      agentId: input.agentId,
      priority: input.priority,
      createdById: user.id,
      slaDueAt,
    },
    include: requestWithRelations,
  });

  await recordAudit({
    requestId: request.id,
    userId: user.id,
    action: "TICKET_CREATED",
    entityType: "Request",
    entityId: request.id,
    newValue: { ticketNumber, priority: input.priority, categoryId: input.categoryId },
  });
  await recordHistory({ requestId: request.id, userId: user.id, field: "status", newValue: "PENDING", note: "Ticket created" });

  await notify({
    type: "TICKET_CREATED",
    recipient: { id: user.id, email: user.email, firstName: user.firstName },
    request,
  });

  return withLiveSlaStatus(request);
}

export async function listRequests(query: z.infer<typeof listRequestsQuerySchema>, user: AuthUser) {
  const where: Prisma.RequestWhereInput = {};

  if (user.role === "OPERATIONS" || query.mine) {
    where.createdById = user.id;
  }
  if (query.status) where.status = query.status as RequestStatus;
  if (query.priority) where.priority = query.priority as never;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.vendorId) where.vendorId = query.vendorId;
  if (query.assignedToId) where.assignedToId = query.assignedToId;
  if (query.search) {
    where.OR = [
      { ticketNumber: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
      { agentName: { contains: query.search, mode: "insensitive" } },
      { agentId: { contains: query.search, mode: "insensitive" } },
      { teamLeaderName: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.request.findMany({
      where,
      include: requestWithRelations,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.request.count({ where }),
  ]);

  let mapped = items.map(withLiveSlaStatus);
  if (query.slaStatus) {
    mapped = mapped.filter((r) => r.slaStatus === query.slaStatus);
  }

  return {
    items: mapped,
    pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
  };
}

export async function getRequestById(id: string, user: AuthUser) {
  const request = await prisma.request.findUnique({ where: { id }, include: requestWithRelations });
  if (!request) throw ApiError.notFound("Request not found");
  if (user.role === "OPERATIONS" && request.createdById !== user.id) {
    throw ApiError.forbidden("You can only view your own requests");
  }
  return withLiveSlaStatus(request);
}

export async function wfmUpdateRequest(id: string, input: z.infer<typeof wfmUpdateSchema>, user: AuthUser) {
  const existing = await prisma.request.findUnique({ where: { id }, include: { category: true } });
  if (!existing) throw ApiError.notFound("Request not found");

  const data: Prisma.RequestUpdateInput = {};
  const historyEntries: Array<{ field: string; oldValue: unknown; newValue: unknown }> = [];

  if (input.status && input.status !== existing.status) {
    data.status = input.status;
    historyEntries.push({ field: "status", oldValue: existing.status, newValue: input.status });
    if (existing.status === "PENDING" && !existing.assignedToId) {
      // first WFM touch — record first response time for SLA metrics
      data.firstResponseAt = existing.firstResponseAt ?? new Date();
    }
  }
  if (input.assignedToId !== undefined && input.assignedToId !== existing.assignedToId) {
    data.assignedTo = input.assignedToId ? { connect: { id: input.assignedToId } } : { disconnect: true };
    historyEntries.push({ field: "assignedToId", oldValue: existing.assignedToId, newValue: input.assignedToId });
    if (input.assignedToId && (!input.status || input.status === "PENDING")) {
      data.status = "ASSIGNED";
    }
    data.firstResponseAt = existing.firstResponseAt ?? new Date();
  }
  if (input.internalNotes !== undefined) {
    data.internalNotes = input.internalNotes;
    historyEntries.push({ field: "internalNotes", oldValue: existing.internalNotes, newValue: input.internalNotes });
  }
  if (input.estimatedCompletionDate !== undefined) {
    data.estimatedCompletionDate = input.estimatedCompletionDate;
  }
  if (input.completionDate !== undefined) {
    data.completionDate = input.completionDate;
  }
  if (input.priority && input.priority !== existing.priority) {
    data.priority = input.priority;
    data.slaDueAt = calculateSlaDueDate(input.priority, existing.createdAt, existing.category.slaHours);
    historyEntries.push({ field: "priority", oldValue: existing.priority, newValue: input.priority });
  }

  const finalStatus = (data.status as RequestStatus) ?? existing.status;
  if (["COMPLETED", "REJECTED", "CANCELLED"].includes(finalStatus) && !existing.completionDate && data.completionDate === undefined) {
    data.completionDate = new Date();
  }

  const request = await prisma.request.update({ where: { id }, data, include: requestWithRelations });

  await Promise.all(
    historyEntries.map((h) => recordHistory({ requestId: id, userId: user.id, field: h.field, oldValue: h.oldValue, newValue: h.newValue }))
  );
  await recordAudit({
    requestId: id,
    userId: user.id,
    action: "TICKET_UPDATED",
    entityType: "Request",
    entityId: id,
    oldValue: { status: existing.status, assignedToId: existing.assignedToId, priority: existing.priority },
    newValue: { status: request.status, assignedToId: request.assignedToId, priority: request.priority },
  });

  await sendUpdateNotifications(existing, request, historyEntries, user);

  return withLiveSlaStatus(request);
}

async function sendUpdateNotifications(
  existing: { createdById: string; status: string },
  updated: Awaited<ReturnType<typeof prisma.request.update>> & { createdBy: { id: string; email: string; firstName: string } },
  historyEntries: Array<{ field: string; oldValue: unknown; newValue: unknown }>,
  user: AuthUser
) {
  const requester = updated.createdBy;
  const statusChanged = historyEntries.find((h) => h.field === "status");
  const assignmentChanged = historyEntries.find((h) => h.field === "assignedToId");

  if (assignmentChanged) {
    const assignee = updated.assignedToId
      ? await prisma.user.findUnique({ where: { id: updated.assignedToId } })
      : null;
    await notify({
      type: "TICKET_ASSIGNED",
      recipient: requester,
      request: updated,
      assignedToName: assignee ? `${assignee.firstName} ${assignee.lastName}` : null,
    });
  }

  if (statusChanged) {
    const typeByStatus: Record<string, "TICKET_COMPLETED" | "TICKET_REJECTED" | "TICKET_CANCELLED" | "STATUS_UPDATED"> = {
      COMPLETED: "TICKET_COMPLETED",
      REJECTED: "TICKET_REJECTED",
      CANCELLED: "TICKET_CANCELLED",
    };
    await notify({
      type: typeByStatus[updated.status] ?? "STATUS_UPDATED",
      recipient: requester,
      request: updated,
    });
  }
}
