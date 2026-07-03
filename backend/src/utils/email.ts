import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";
import { env } from "../config/env";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const devOutboxDir = path.resolve(process.cwd(), "emails");

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  if (env.email.driver === "smtp" && env.email.smtpHost) {
    transporter = nodemailer.createTransport({
      host: env.email.smtpHost,
      port: env.email.smtpPort,
      secure: env.email.smtpSecure,
      auth: env.email.smtpUser ? { user: env.email.smtpUser, pass: env.email.smtpPass } : undefined,
    });
  } else {
    // Dev transport: does not hit the network. Emails are logged to console
    // and written to /emails as viewable .html files so the flow is testable
    // without real SMTP credentials.
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

export async function sendEmail(params: SendEmailParams): Promise<{ delivered: boolean; error?: string }> {
  try {
    const t = getTransporter();
    const info = await t.sendMail({
      from: env.email.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (env.email.driver !== "smtp") {
      if (!fs.existsSync(devOutboxDir)) fs.mkdirSync(devOutboxDir, { recursive: true });
      const fileName = `${Date.now()}-${params.to.replace(/[^a-z0-9]/gi, "_")}.html`;
      fs.writeFileSync(path.join(devOutboxDir, fileName), params.html, "utf-8");
      console.log(`[email:dev] To: ${params.to} | Subject: ${params.subject} | Saved: emails/${fileName}`);
    } else {
      console.log(`[email:smtp] Sent to ${params.to}: ${info.messageId}`);
    }

    return { delivered: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[email] Failed to send to ${params.to}: ${message}`);
    return { delivered: false, error: message };
  }
}
