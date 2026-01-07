import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import { sendAdminSignupEmail } from "../utils/email";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function toSafeUser(user: { id: string; email: string; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

async function saveSession(req: any): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.save((err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function regenerateSession(req: any): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    req.session.regenerate((err: unknown) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);

    const passwordHash = await hashPassword(password);

    const [created] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id, email: users.email, createdAt: users.createdAt });

    // Start a fresh session and store user id in session.
    await regenerateSession(req);
    req.session.userId = created.id;
    await saveSession(req);

    // Send admin notification (fire-and-forget, don't block response)
    sendAdminSignupEmail(created.email).catch((err) => {
      console.error("Error sending admin signup email:", err);
    });

    res.status(201).json({ user: toSafeUser(created) });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request",
        errors: err.flatten(),
      });
    }
    // Unique violation (email)
    if (err?.code === "23505") {
      return res.status(409).json({ message: "Email already in use" });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await regenerateSession(req);
    req.session.userId = user.id;
    await saveSession(req);

    res.json({
      user: toSafeUser({ id: user.id, email: user.email, createdAt: user.createdAt }),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        message: "Invalid request",
        errors: err.flatten(),
      });
    }
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Clear cookie with matching attributes (important for cross-site cookies).
    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      sameSite: "none",
      secure: isProd,
    });

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      // Session exists but user was deleted.
      await new Promise<void>((resolve) => {
        req.session.destroy(() => resolve());
      });
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      user: toSafeUser({ id: user.id, email: user.email, createdAt: user.createdAt }),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
