// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routes from "./routes";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

/* ----------------------------- Healthcheck ----------------------------- */

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/* ----------------------------- API ----------------------------- */

app.use("/api", routes);

/* ----------------------------- Error Handler ----------------------------- */

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({
    message: err?.message || "Internal server error",
  });
});

/* ----------------------------- START SERVER ----------------------------- */

/**
 * 🚨 RAILWAY REQUIREMENT
 * You MUST listen on process.env.PORT
 */
const PORT = Number(process.env.PORT);

if (!PORT) {
  console.error("❌ PORT environment variable is missing");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});


