import { Router } from "express";
import rateLimit from "express-rate-limit";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { changePasswordSchema, loginSchema } from "./auth.validation";
import { changePassword, login, sanitizeUser } from "./auth.service";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

router.post(
  "/login",
  loginLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await login(email, password, req.ip);
    res.json({ success: true, data: result });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    res.json({ success: true, data: sanitizeUser(user) });
  })
);

router.post(
  "/change-password",
  requireAuth,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    await changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, message: "Password updated successfully" });
  })
);

router.post("/logout", requireAuth, (req, res) => {
  res.json({ success: true, message: "Logged out" });
});

// Azure AD SSO placeholder — enabled once AZURE_AD_* env vars are configured.
router.get("/azure/login", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Azure AD login is not configured yet. Set AZURE_AD_TENANT_ID / CLIENT_ID / CLIENT_SECRET to enable.",
  });
});

export default router;
