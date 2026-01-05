// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import routes from "./routes";
import { seedExerciseLibrary } from "./storage";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

/* ----------------------------- CORS (FIXED) ----------------------------- */

const allowedOrigins = [
  "https://drdfitness.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl / healthchecks
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// VERY IMPORTANT: preflight support
app.options("*", cors());

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

if (process.env.NODE_ENV === "production" && !process.env.PORT) {
  console.error("❌ PORT environment variable is missing");
  process.exit(1);
}

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


