import { NotificationType, Request as RequestModel, User } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { sendEmail } from "../../utils/email";
import { env } from "../../config/env";

interface NotifyParams {
  type: NotificationType;
  recipient: Pick<User, "id" | "email" | "firstName">;
  request: Pick<RequestModel, "id" | "ticketNumber" | "status">;
  assignedToName?: string | null;
  latestNote?: string | null;
}

const TITLES: Record<NotificationType, string> = {
  TICKET_CREATED: "Ticket Created",
  TICKET_ASSIGNED: "Ticket Assigned",
  STATUS_UPDATED: "Status Updated",
  COMMENT_ADDED: "New Comment",
  TICKET_UPDATED: "Ticket Updated",
  TICKET_COMPLETED: "Ticket Completed",
  TICKET_REJECTED: "Ticket Rejected",
  TICKET_CANCELLED: "Ticket Cancelled",
  MENTION: "You were mentioned",
};

function buildEmailHtml(params: NotifyParams): string {
  const link = `${env.appUrl}/requests/${params.request.id}`;
  return `
    <div style="font-family: Segoe UI, Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background:#C7272F;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;">${TITLES[params.type]}</h2>
      </div>
      <div style="border:1px solid #DDDDDD;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
        <p>Hi ${params.recipient.firstName},</p>
        <p><strong>Ticket:</strong> ${params.request.ticketNumber}</p>
        <p><strong>Status:</strong> ${params.request.status.replace(/_/g, " ")}</p>
        ${params.assignedToName ? `<p><strong>Assigned To:</strong> ${params.assignedToName}</p>` : ""}
        ${params.latestNote ? `<p><strong>Latest Note:</strong> ${params.latestNote}</p>` : ""}
        <p style="margin-top:24px;">
          <a href="${link}" style="background:#C7272F;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
            View Ticket
          </a>
        </p>
        <p style="color:#5B5B5B;font-size:12px;margin-top:24px;">WFM Request Portal &mdash; automated notification</p>
      </div>
    </div>
  `;
}

// Creates a Notification record (visible in the Notifications page / bell icon)
// and attempts email delivery. Failure to email never blocks the ticket action.
export async function notify(params: NotifyParams): Promise<void> {
  const subject = `[${params.request.ticketNumber}] ${TITLES[params.type]}`;
  const html = buildEmailHtml(params);

  const notification = await prisma.notification.create({
    data: {
      userId: params.recipient.id,
      requestId: params.request.id,
      type: params.type,
      channel: "EMAIL",
      status: "PENDING",
      subject,
      body: html,
    },
  });

  const result = await sendEmail({ to: params.recipient.email, subject, html });

  await prisma.notification.update({
    where: { id: notification.id },
    data: {
      status: result.delivered ? "SENT" : "FAILED",
      sentAt: result.delivered ? new Date() : undefined,
      error: result.error,
    },
  });
}
