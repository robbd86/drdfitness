import nodemailer from "nodemailer";

type MailerBundle =
  | {
      mode: "ethereal";
      transporter: nodemailer.Transporter;
    }
  | {
      mode: "resend";
      apiKey: string;
    };

let mailerPromise: Promise<MailerBundle> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set`);
  return value;
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, "");
}

async function createTransporter(): Promise<MailerBundle> {
  const isProd = process.env.NODE_ENV === "production";

  if (!isProd) {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return { mode: "ethereal", transporter };
  }

  // Production uses Resend API (Option B)
  const apiKey = requireEnv("RESEND_API_KEY");
  return { mode: "resend", apiKey };
}

async function getMailer(): Promise<MailerBundle> {
  if (!mailerPromise) {
    mailerPromise = createTransporter();
  }
  return mailerPromise;
}

function buildPasswordResetEmailHtml(resetUrl: string) {
  const containerStyle =
    "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; background: #0b0f19; padding: 24px;";
  const cardStyle =
    "max-width: 560px; margin: 0 auto; background: #0f172a; border: 1px solid rgba(148, 163, 184, 0.25); border-radius: 12px; padding: 24px; color: #e5e7eb;";
  const headingStyle = "font-size: 22px; margin: 0 0 8px 0; font-weight: 700;";
  const textStyle = "font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #cbd5e1;";
  const buttonWrapStyle = "margin: 20px 0 16px 0;";
  const buttonStyle =
    "display: inline-block; background: #f97316; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-weight: 700;";
  const smallStyle = "font-size: 12px; color: #94a3b8; margin: 0;";
  const linkStyle = "color: #fb923c; word-break: break-all;";

  return `
  <div style="${containerStyle}">
    <div style="${cardStyle}">
      <h1 style="${headingStyle}">Reset Your Password</h1>
      <p style="${textStyle}">
        We received a request to reset your password. Click the button below to choose a new password.
      </p>

      <div style="${buttonWrapStyle}">
        <a href="${resetUrl}" style="${buttonStyle}" target="_blank" rel="noopener noreferrer">Reset Password</a>
      </div>

      <p style="${textStyle}">
        This link expires in <strong>1 hour</strong>. If you didn’t request a password reset, you can ignore this email.
      </p>

      <p style="${smallStyle}">If the button doesn’t work, copy and paste this link into your browser:</p>
      <p style="${smallStyle}"><a href="${resetUrl}" style="${linkStyle}">${resetUrl}</a></p>
    </div>
  </div>
  `;
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const clientUrl = requireEnv("CLIENT_URL");
  const resetUrl = `${normalizeBaseUrl(clientUrl)}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`🔗 Password reset link (dev): ${resetUrl}`);
  }

  const mailer = await getMailer();

  const from =
    process.env.EMAIL_FROM ||
    // Reasonable fallback for local Ethereal usage.
    "no-reply@drdfitness.co.uk";

  const subject = "Reset Your Password";
  const html = buildPasswordResetEmailHtml(resetUrl);

  if (mailer.mode === "ethereal") {
    const info = await mailer.transporter.sendMail({
      from,
      to: email,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) {
      console.log(`📧 Password reset email preview: ${previewUrl}`);
    }

    return {
      success: true as const,
      messageId: (info as any)?.messageId as string | undefined,
      previewUrl,
    };
  }

  // Resend API (production)
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM must be set in production when using Resend");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mailer.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject,
      html,
    }),
  });

  const bodyText = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Resend email failed (${res.status}): ${bodyText || res.statusText}`);
  }

  let messageId: string | undefined = undefined;
  try {
    const parsed = bodyText ? (JSON.parse(bodyText) as any) : undefined;
    if (parsed && typeof parsed.id === "string") messageId = parsed.id;
  } catch {
    // ignore JSON parsing errors
  }

  return {
    success: true as const,
    messageId,
    previewUrl: null,
  };
}
