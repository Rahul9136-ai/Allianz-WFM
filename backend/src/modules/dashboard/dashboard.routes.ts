import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { computeSlaStatus, hoursBetween } from "../../utils/sla";

const router = Router();
router.use(requireAuth);

const OPEN_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_INFORMATION"];
const CLOSED_STATUSES = ["COMPLETED", "REJECTED", "CANCELLED"];

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  return x;
}
function startOfMonth(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const scopeWhere = req.user!.role === "OPERATIONS" ? { createdById: req.user!.id } : {};
    const now = new Date();

    const [
      total,
      byStatus,
      byPriority,
      byCategory,
      byVendor,
      todayCount,
      weekCount,
      monthCount,
      closedThisWeek,
      allOpen,
      allForResolution,
      byAssignee,
    ] = await Promise.all([
      prisma.request.count({ where: scopeWhere }),
      prisma.request.groupBy({ by: ["status"], where: scopeWhere, _count: true }),
      prisma.request.groupBy({ by: ["priority"], where: scopeWhere, _count: true }),
      prisma.request.groupBy({ by: ["categoryId"], where: scopeWhere, _count: true }),
      prisma.request.groupBy({ by: ["vendorId"], where: scopeWhere, _count: true }),
      prisma.request.count({ where: { ...scopeWhere, createdAt: { gte: startOfDay(now) } } }),
      prisma.request.count({ where: { ...scopeWhere, createdAt: { gte: startOfWeek(now) } } }),
      prisma.request.count({ where: { ...scopeWhere, createdAt: { gte: startOfMonth(now) } } }),
      prisma.request.count({ where: { ...scopeWhere, status: { in: CLOSED_STATUSES as never }, completionDate: { gte: startOfWeek(now) } } }),
      prisma.request.findMany({ where: { ...scopeWhere, status: { in: OPEN_STATUSES as never } }, select: { slaDueAt: true, status: true, createdAt: true } }),
      prisma.request.findMany({
        where: { ...scopeWhere, status: { in: CLOSED_STATUSES as never }, completionDate: { not: null } },
        select: { createdAt: true, completionDate: true, firstResponseAt: true },
      }),
      prisma.request.groupBy({ by: ["assignedToId"], where: { ...scopeWhere, assignedToId: { not: null } }, _count: true }),
    ]);

    const categories = await prisma.category.findMany();
    const vendors = await prisma.vendor.findMany();
    const users = await prisma.user.findMany({ where: { role: "WFM" } });

    let overdue = 0;
    let atRisk = 0;
    let totalAgeHours = 0;
    for (const r of allOpen) {
      const status = computeSlaStatus(r.slaDueAt, r.status, now);
      if (status === "OVERDUE") overdue += 1;
      if (status === "AT_RISK") atRisk += 1;
      totalAgeHours += hoursBetween(now, r.createdAt);
    }
    const avgTicketAgeHours = allOpen.length ? totalAgeHours / allOpen.length : 0;

    let resolutionHoursSum = 0;
    let resolutionCount = 0;
    let responseHoursSum = 0;
    let responseCount = 0;
    let metCount = 0;
    for (const r of allForResolution) {
      if (r.completionDate) {
        resolutionHoursSum += hoursBetween(r.createdAt, r.completionDate);
        resolutionCount += 1;
      }
      if (r.firstResponseAt) {
        responseHoursSum += hoursBetween(r.createdAt, r.firstResponseAt);
        responseCount += 1;
      }
    }
    // recompute SLA compliance among closed tickets
    const closedWithSla = await prisma.request.findMany({
      where: { ...scopeWhere, status: { in: CLOSED_STATUSES as never } },
      select: { slaDueAt: true, completionDate: true },
    });
    for (const r of closedWithSla) {
      if (r.slaDueAt && r.completionDate && r.completionDate <= r.slaDueAt) metCount += 1;
    }
    const slaCompliancePct = closedWithSla.length ? Math.round((metCount / closedWithSla.length) * 100) : 100;

    const statusCounts = Object.fromEntries(byStatus.map((s) => [s.status, s._count]));

    res.json({
      success: true,
      data: {
        kpis: {
          total,
          pending: statusCounts.PENDING ?? 0,
          assigned: statusCounts.ASSIGNED ?? 0,
          inProgress: statusCounts.IN_PROGRESS ?? 0,
          waitingForInformation: statusCounts.WAITING_FOR_INFORMATION ?? 0,
          completed: statusCounts.COMPLETED ?? 0,
          cancelled: statusCounts.CANCELLED ?? 0,
          rejected: statusCounts.REJECTED ?? 0,
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount,
          overdue,
          atRisk,
          avgResolutionHours: Math.round(resolutionCount ? resolutionHoursSum / resolutionCount : 0),
          avgFirstResponseHours: Math.round(responseCount ? responseHoursSum / responseCount : 0),
          slaCompliancePct,
          closedThisWeek,
          avgTicketAgeHours: Math.round(avgTicketAgeHours),
        },
        charts: {
          byCategory: byCategory.map((c) => ({
            name: categories.find((cat) => cat.id === c.categoryId)?.name ?? "Unknown",
            count: c._count,
          })),
          byVendor: byVendor.map((v) => ({
            name: vendors.find((ven) => ven.id === v.vendorId)?.name ?? "Unknown",
            count: v._count,
          })),
          byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
          byPriority: byPriority.map((p) => ({ priority: p.priority, count: p._count })),
          byAssignee: byAssignee.map((a) => ({
            name: users.find((u) => u.id === a.assignedToId) ? `${users.find((u) => u.id === a.assignedToId)!.firstName} ${users.find((u) => u.id === a.assignedToId)!.lastName}` : "Unassigned",
            count: a._count,
          })),
        },
      },
    });
  })
);

export default router;
