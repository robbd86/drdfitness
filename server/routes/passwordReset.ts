import { Router } from "express";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../db/schema/auth";
import { hashPassword } from "../utils/password";
import { sendPasswordResetEmail } from "../services/emailService";

type PasswordResetTokenPayload = {
  userId: string;
  email: string;
  typ: "password-reset";
};

function getJwtSecret(): string {
  return process.env.PASSWORD_RESET_JWT_SECRET || process.env.SESSION_SECRET || "";
}

function requireJwtSecret(): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("PASSWORD_RESET_JWT_SECRET (or SESSION_SECRET fallback) must be set");
  }
  return secret;
}

// Optional token reuse tracking (in-memory). Not suitable for multi-instance deployments.
const shouldTrackTokens = process.env.PASSWORD_RESET_TRACK_TOKENS === "true";
const usedTokens = new Set<string>();

function isTokenUsed(token: string): boolean {
  if (!shouldTrackTokens) return false;
  return usedTokens.has(token);
}

function markTokenUsed(token: string): void {
  if (!shouldTrackTokens) return;
  usedTokens.add(token);
}

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const router = Router();

// POST /forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten(),
      });
    }

    const { email } = parsed.data;

    // Always return a generic response to avoid leaking whether the email exists.
    const genericResponse = {
      message: "If an account exists for that email, a reset link has been sent.",
    };

    // Dev helper: optionally bypass DB lookup so you can validate the email + link flow
    // even when the DB isn't reachable locally. NEVER enable this in production.
    const devAlwaysSend =
      process.env.NODE_ENV !== "production" && process.env.PASSWORD_RESET_DEV_ALWAYS_SEND === "true";

    if (devAlwaysSend) {
      const secret = requireJwtSecret();
      const token = jwt.sign(
        {
          userId: "dev",
          email,
          typ: "password-reset",
        } satisfies PasswordResetTokenPayload,
        secret,
        { expiresIn: "1h" }
      );

      try {
        await sendPasswordResetEmail(email, token);
      } catch (err) {
        console.error("Failed to send password reset email (dev bypass):", err);
      }

      return res.status(200).json(genericResponse);
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const secret = requireJwtSecret();
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        typ: "password-reset",
      } satisfies PasswordResetTokenPayload,
      secret,
      { expiresIn: "1h" }
    );

    try {
      // Optional: store token in DB for expiry/used tracking.
      // This repo does not currently include a password_reset_tokens table.
      await sendPasswordResetEmail(user.email, token);
    } catch (err) {
      // Don't leak existence; log for operators.
      console.error("Failed to send password reset email:", err);
    }

    return res.status(200).json(genericResponse);
  } catch (err) {
    next(err);
  }
});

// POST /reset-password
router.post("/reset-password", async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request",
        errors: parsed.error.flatten(),
      });
    }

    const { token, newPassword } = parsed.data;

    if (isTokenUsed(token)) {
      return res.status(409).json({ message: "This reset link has already been used" });
    }

    const secret = requireJwtSecret();

    let payload: PasswordResetTokenPayload;
    try {
      payload = jwt.verify(token, secret) as PasswordResetTokenPayload;
    } catch {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    if (!payload || payload.typ !== "password-reset" || !payload.userId || !payload.email) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user || user.email !== payload.email) {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const passwordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Optional: mark token as used in DB.
    markTokenUsed(token);

    return res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
});

export default router;
