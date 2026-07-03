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
  slaHours: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    res.json({ success: true, data: categories });
  })
);

router.post(
  "/",
  requireRole("ADMIN"),
  validateBody(upsertSchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({ data: req.body });
    await recordAudit({ userId: req.user!.id, action: "CATEGORY_CREATED", entityType: "Category", entityId: category.id, newValue: category });
    res.status(201).json({ success: true, data: category });
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validateBody(upsertSchema.partial()),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({ userId: req.user!.id, action: "CATEGORY_UPDATED", entityType: "Category", entityId: category.id, newValue: req.body });
    res.json({ success: true, data: category });
  })
);

export default router;
