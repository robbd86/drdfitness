import type { NextFunction, Request, Response } from "express";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Guard against corrupted/stale sessions (e.g. userId="dev") which would
  // otherwise crash later when used in UUID-typed DB queries.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);

  if (!isUuid) {
    req.session.destroy(() => {
      // best-effort cookie clear; attributes may vary by environment
      res.clearCookie("connect.sid", { path: "/" });
      res.status(401).json({ message: "Unauthorized" });
    });
    return;
  }

  return next();
}
