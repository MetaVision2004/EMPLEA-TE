import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import ofertasRouter from "./routes/ofertas.js";
import postulacionesRouter from "./routes/postulaciones.js";
import emailRouter from "./routes/email.js";
import statsRouter from "./routes/stats.js";

dotenv.config();

export const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(new Error("Origen no permitido por CORS"));
  },
}));
app.use(express.json());

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.EMAIL_RATE_LIMIT || 30),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes de email. Inténtalo más tarde." },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", proyecto: "Emplea-TE backend" });
});

app.use("/api/ofertas", ofertasRouter);
app.use("/api/postulaciones", postulacionesRouter);
app.use("/api/email", emailLimiter, emailRouter);
app.use("/api/stats", statsRouter);

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Emplea-TE backend corriendo en http://localhost:${PORT}`);
  });
}
