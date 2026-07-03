import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
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

  const allowedOrigins = env.corsOrigin.split(",").map((o) => o.trim());
  // This is a JSON API consumed from a separate frontend origin, so relax the
  // cross-origin isolation headers that would otherwise block browser reads.
  // CORS (below) remains the access-control boundary.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginOpenerPolicy: false,
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    })
  );
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

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
