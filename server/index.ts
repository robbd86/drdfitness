// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routes from "./routes";
import { seedExerciseLibrary } from "./storage";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

const frontendOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    // In dev, allow the Vite dev server and tools.
    // In prod, restrict to the configured frontend origins when provided.
    origin:
      process.env.NODE_ENV === "production" && frontendOrigins.length > 0
        ? frontendOrigins
        : true,
    // This app does not currently rely on cookies for API calls.
    credentials: false,
  }),
);

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
const PORT = Number(process.env.PORT || 5001);

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`✅ Server running on port ${PORT}`);
  
  // Seed exercise library with default exercises
  try {
    await seedExerciseLibrary();
    console.log("✅ Exercise library ready");
  } catch (err) {
    console.error("Failed to seed exercise library:", err);
  }
});


