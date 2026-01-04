// server/index.ts
import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
import routes from "./routes";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

// Configure CORS for production (Vercel frontend) and development
const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:3000",
  process.env.FRONTEND_URL, // Set this in Railway to your Vercel URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

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

const resolvePort = (value: string | undefined, fallback: number) => {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : fallback;
};

const API_PORT = resolvePort(process.env.API_PORT ?? process.env.SERVER_PORT, 5001);
const API_HOST = process.env.API_HOST ?? process.env.SERVER_HOST ?? "0.0.0.0";

app.listen(API_PORT, API_HOST, () => {
  console.log(`✅ API server running on ${API_HOST}:${API_PORT}`);
});
