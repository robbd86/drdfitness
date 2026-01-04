// server/index.ts
import express from "express";
import cors from "cors";
import routes from "./routes";

const app = express();

/* ----------------------------- Middleware ----------------------------- */

app.use(cors());
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

/* ----------------------------- Start ----------------------------- */

const PORT = 5001;


app.listen(PORT, () => {
  console.log(`✅ API server running on port ${PORT}`);
});
