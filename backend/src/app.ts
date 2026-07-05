import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/users.routes";
import categoryRoutes from "./modules/categories/categories.routes";
import vendorRoutes from "./modules/vendors/vendors.routes";
import requestRoutes from "./modules/requests/requests.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import auditRoutes from "./modules/audit/audit.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
// Reports/export module (Excel/CSV/PDF) is planned for the next phase after core checkpoint.

export function createApp() {
  const app = express();

  // Behind Railway's / any reverse proxy: trust the first proxy hop so
  // express-rate-limit and req.ip use the real client IP from X-Forwarded-For.
  app.set("trust proxy", 1);

  // Relax cross-origin isolation headers so the browser can read API responses
  // when the frontend is served from a different origin (local dev on :5190).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
    })
  );
  // Auth uses Bearer tokens from localStorage (not cookies), so we can safely
  // reflect the request origin. This keeps local multi-port dev working and
  // needs no CORS config in production where the SPA is same-origin.
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? "combined" : "dev"));

  const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false });
  app.use("/api", apiLimiter);

  app.get("/api/health", (_req, res) => res.json({ success: true, message: "WFM Request Portal API is running" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/vendors", vendorRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/audit-logs", auditRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // In production the built React app is served from the same origin. The
  // location is set via CLIENT_DIST_DIR (Docker) and falls back to the repo
  // layout for a local production build.
  const clientDir = process.env.CLIENT_DIST_DIR || path.resolve(process.cwd(), "../frontend/dist");
  if (fs.existsSync(path.join(clientDir, "index.html"))) {
    app.use(express.static(clientDir));
    // SPA fallback: any non-API GET returns index.html so client-side routing works.
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      res.sendFile(path.join(clientDir, "index.html"));
    });
    console.log(`Serving frontend from ${clientDir}`);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
