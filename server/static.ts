// server/static.ts
import type { Express } from "express";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

/**
 * ESM-safe __dirname replacement
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // This is where your frontend lives in THIS repo
  // server/public is the correct location for dev + prod
  const publicPath = path.resolve(__dirname, "public");

  app.use(express.static(publicPath));

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicPath, "index.html"));
  });
}

