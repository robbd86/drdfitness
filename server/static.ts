import express, { type Express, type Response, type Request } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve hashed assets (JS, CSS) with long cache and immutable
  app.use(
    "/assets",
    express.static(path.join(distPath, "assets"), {
      maxAge: "1y",
      immutable: true,
    })
  );

  // Serve other static files with short cache
  app.use(
    express.static(distPath, {
      maxAge: "1h",
      setHeaders: (res: Response, filePath: string) => {
        // Never cache HTML, manifest, or service worker
        if (
          filePath.endsWith(".html") ||
          filePath.endsWith("manifest.json") ||
          filePath.endsWith("sw.js")
        ) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    })
  );

  // Fall through to index.html with no-cache headers
  app.use("*", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
