import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { createUserSchema, updateUserSchema } from "./users.validation";
import { sanitizeUser } from "../auth/auth.service";
import { env } from "../../config/env";
import { recordAudit } from "../../utils/audit";
import { ApiError } from "../../utils/apiError";

const router = Router();
router.use(requireAuth);

// WFM users need the list to populate "Assigned To" dropdowns.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ orderBy: { firstName: "asc" } });
    res.json({ success: true, data: users.map(sanitizeUser) });
  })
);

router.post(
  "/",
  requireRole("ADMIN"),
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { email, firstName, lastName, role, password } = req.body;
    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), firstName, lastName, role, passwordHash },
    });
    await recordAudit({ userId: req.user!.id, action: "USER_CREATED", entityType: "User", entityId: user.id, newValue: { email: user.email, role: user.role } });
    res.status(201).json({ success: true, data: sanitizeUser(user) });
  })
);

router.patch(
  "/:id",
  requireRole("ADMIN"),
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("User not found");

    const user = await prisma.user.update({ where: { id: req.params.id }, data: req.body });
    await recordAudit({
      userId: req.user!.id,
      action: "USER_UPDATED",
      entityType: "User",
      entityId: user.id,
      oldValue: { role: existing.role, isActive: existing.isActive },
      newValue: { role: user.role, isActive: user.isActive },
    });
    res.json({ success: true, data: sanitizeUser(user) });
  })
);

router.delete(
  "/:id",
  requireRole("ADMIN"),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user!.id) throw ApiError.badRequest("You cannot deactivate your own account");
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    await recordAudit({ userId: req.user!.id, action: "USER_DEACTIVATED", entityType: "User", entityId: user.id });
    res.json({ success: true, message: "User deactivated" });
  })
);

export default router;
