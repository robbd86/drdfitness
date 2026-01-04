// server/index.ts
import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import routes from "./routes";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

// Allowed origins for local dev + production frontend
const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Set in Railway to Vercel URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, healthchecks)
      if (!origin) return callback(null, true);

      if (allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

/* ----------------------------- Healthcheck ----------------------------- */

// Railway healthcheck endpoint (NO DB, NO AUTH)
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/* ----------------------------- API ----------------------------- */

app.use("/api", routes);

/* ----------------------------- Error Handler ----------------------------- */

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);

  if (err?.name === "ZodError") {
    return res.status(400).json({
      message: "Invalid request data",
      issues: err.issues,
    });
  }

  res.status(500).json({
    message: err?.message || "Internal server error",
  });
});

/* ----------------------------- Startup ----------------------------- */

// Railway ONLY respects process.env.PORT
const PORT = Number(process.env.PORT) || 5001;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`✅ API server running on ${HOST}:${PORT}`);
});

