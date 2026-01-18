// server/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

dotenv.config();

import routes from "./routes";
import authRoutes from "./routes/auth";
import { seedExerciseLibrary } from "./storage";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

/* ----------------------------- CORS ----------------------------- */

const corsOptions: cors.CorsOptions = {
  origin: [
    "https://www.drdfitness.co.uk",
    "https://drdfitness.co.uk",
    "https://app.drdfitness.co.uk",
    "https://drdfitness.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// VERY IMPORTANT: preflight support
app.options("*", cors(corsOptions));

/* ----------------------------- Sessions ----------------------------- */

// Required for secure cookies behind Railway/other proxies.
app.set("trust proxy", 1);

const isProd = process.env.NODE_ENV === "production";

// Per requirement: use DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for session storage");
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set");
}

const PgSessionStore = connectPgSimple(session);
const sessionPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  session({
    store: new PgSessionStore({
      pool: sessionPool,
      // Uses the default `session` table name (compatible with connect-pg-simple)
      createTableIfMissing: true,
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: isProd,
    name: "connect.sid",
    cookie: {
      secure: isProd,
      // Cross-site cookies are required for Railway (API) + custom domain (frontend) in production.
      // In local dev, we keep it simpler/safer.
      sameSite: isProd ? "none" : "lax",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      domain: undefined, // Let the browser handle this - don't set cross-domain
    },
  })
);

app.use(express.json());

/* ----------------------------- Healthcheck ----------------------------- */

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/* ----------------------------- API ----------------------------- */

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
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

const server = app.listen(PORT, async () => {
  const addr = server.address();
  console.log(`✅ Server running on port ${PORT}`, addr);

  // Basic self-check to confirm the app is responding from inside the container
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/health`);
    console.log(`✅ Self-check /health responded ${res.status}`);
  } catch (err) {
    console.error("❌ Self-check /health failed:", err);
  }
  
  // Seed exercise library with default exercises
  try {
    await seedExerciseLibrary();
    console.log("✅ Exercise library ready");
  } catch (err) {
    console.error("Failed to seed exercise library:", err);
  }
});


