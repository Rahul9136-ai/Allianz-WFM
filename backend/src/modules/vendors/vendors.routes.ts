import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { recordAudit } from "../../utils/audit";

const router = Router();
router.use(requireAuth);

const upsertSchema = z.object({
  name: z.string().min(1),
  isActive: z.boolean().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data: vendors });
  })
);

router.post(
  "/",
  requireRole("ADMIN"),
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.create({ data: req.body });
    await recordAudit({ userId: req.user!.id, action: "VENDOR_CREATED", entityType: "Vendor", entityId: vendor.id, newValue: vendor });
    res.status(201).json({ success: true, data: vendor });
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validateBody(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ userId: req.user!.id, action: "VENDOR_UPDATED", entityType: "Vendor", entityId: vendor.id, newValue: req.body });
    res.json({ success: true, data: vendor });
  })
);

export default router;
