import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ofertasRouter from "./routes/ofertas.js";
import postulacionesRouter from "./routes/postulaciones.js";
import emailRouter from "./routes/email.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", proyecto: "Emplea-TE backend" });
});

app.use("/api/ofertas", ofertasRouter);
app.use("/api/postulaciones", postulacionesRouter);
app.use("/api/email", emailRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Emplea-TE backend corriendo en http://localhost:${PORT}`);
});
