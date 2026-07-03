import { Router } from "express";
import fs from "fs";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth, requireRole } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { upload } from "../../middleware/upload";
import { ApiError } from "../../utils/apiError";
import { storageDriver } from "../../utils/storage";
import { recordAudit, recordHistory } from "../../utils/audit";
import { notify } from "../notifications/notification.service";
import {
  bulkUpdateSchema,
  commentSchema,
  createRequestSchema,
  listRequestsQuerySchema,
  wfmUpdateSchema,
} from "./requests.validation";
import { createRequest, getRequestById, listRequests, wfmUpdateRequest } from "./requests.service";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  validateQuery(listRequestsQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await listRequests(req.query as never, req.user!);
    res.json({ success: true, ...result });
  })
);

router.post(
  "/",
  validateBody(createRequestSchema),
  asyncHandler(async (req, res) => {
    const request = await createRequest(req.body, req.user!);
    res.status(201).json({ success: true, data: request });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const request = await getRequestById(req.params.id, req.user!);
    res.json({ success: true, data: request });
  })
);

router.patch(
  "/:id",
  requireRole("WFM", "ADMIN"),
  validateBody(wfmUpdateSchema),
  asyncHandler(async (req, res) => {
    const request = await wfmUpdateRequest(req.params.id, req.body, req.user!);
    res.json({ success: true, data: request });
  })
);

router.post(
  "/bulk-update",
  requireRole("WFM", "ADMIN"),
  validateBody(bulkUpdateSchema),
  asyncHandler(async (req, res) => {
    const { ids, ...changes } = req.body as { ids: string[]; status?: string; assignedToId?: string };
    const results = [];
    for (const id of ids) {
      results.push(await wfmUpdateRequest(id, changes as never, req.user!));
    }
    res.json({ success: true, data: results });
  })
);

router.get(
  "/:id/history",
  asyncHandler(async (req, res) => {
    await getRequestById(req.params.id, req.user!); // enforces view permission
    const history = await prisma.requestHistory.findMany({
      where: { requestId: req.params.id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: history });
  })
);

router.get(
  "/:id/audit",
  requireRole("WFM", "ADMIN"),
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      where: { requestId: req.params.id },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: logs });
  })
);

// ---------------------------------------------------------------
// Comments (conversation thread)
// ---------------------------------------------------------------

router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    await getRequestById(req.params.id, req.user!);
    const comments = await prisma.comment.findMany({
      where: { requestId: req.params.id, ...(req.user!.role === "OPERATIONS" ? { isInternal: false } : {}) },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } },
        attachments: true,
      },
      orderBy: { createdAt: "asc" },
    });
    res.json({ success: true, data: comments });
  })
);

router.post(
  "/:id/comments",
  validateBody(commentSchema),
  asyncHandler(async (req, res) => {
    const request = await getRequestById(req.params.id, req.user!);
    if (req.body.isInternal && req.user!.role === "OPERATIONS") {
      throw ApiError.forbidden("Operations users cannot post internal notes");
    }

    const comment = await prisma.comment.create({
      data: {
        requestId: request.id,
        authorId: req.user!.id,
        body: req.body.body,
        isInternal: req.body.isInternal,
        mentions: req.body.mentions,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true } } },
    });

    await recordAudit({ requestId: request.id, userId: req.user!.id, action: "COMMENT_ADDED", entityType: "Comment", entityId: comment.id, newValue: { body: comment.body } });
    await recordHistory({ requestId: request.id, userId: req.user!.id, field: "comment", note: "Comment added" });

    if (!comment.isInternal && req.user!.id !== request.createdById) {
      const requester = await prisma.user.findUnique({ where: { id: request.createdById } });
      if (requester) {
        await notify({ type: "COMMENT_ADDED", recipient: requester, request, latestNote: comment.body.slice(0, 200) });
      }
    }

    res.status(201).json({ success: true, data: comment });
  })
);

// ---------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------

router.get(
  "/:id/attachments",
  asyncHandler(async (req, res) => {
    await getRequestById(req.params.id, req.user!);
    const attachments = await prisma.attachment.findMany({ where: { requestId: req.params.id }, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: attachments });
  })
);

router.post(
  "/:id/attachments",
  upload.array("files", 10),
  asyncHandler(async (req, res) => {
    const request = await getRequestById(req.params.id, req.user!);
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) throw ApiError.badRequest("No files uploaded");

    const created = await Promise.all(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            requestId: request.id,
            fileName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storagePath: file.path,
            uploadedById: req.user!.id,
          },
        })
      )
    );

    await recordAudit({
      requestId: request.id,
      userId: req.user!.id,
      action: "ATTACHMENT_ADDED",
      entityType: "Attachment",
      entityId: created.map((c) => c.id).join(","),
      newValue: { files: created.map((c) => c.fileName) },
    });

    res.status(201).json({ success: true, data: created });
  })
);

router.get(
  "/:id/attachments/:attachmentId/download",
  asyncHandler(async (req, res) => {
    await getRequestById(req.params.id, req.user!);
    const attachment = await prisma.attachment.findUnique({ where: { id: req.params.attachmentId } });
    if (!attachment || attachment.requestId !== req.params.id) throw ApiError.notFound("Attachment not found");

    const filePath = storageDriver.getAbsolutePath(attachment.storedName);
    if (!fs.existsSync(filePath)) throw ApiError.notFound("File no longer exists in storage");
    res.download(filePath, attachment.fileName);
  })
);

export default router;
