import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// GET /api/ofertas - listar ofertas activas
router.get("/", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .select("*")
    .eq("activa", true)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/ofertas - crear una oferta (uso administrativo)
router.post("/", async (req, res) => {
  const { titulo, empresa, ciudad, modalidad, descripcion } = req.body;

  if (!titulo || !empresa) {
    return res.status(400).json({ error: "titulo y empresa son obligatorios" });
  }

  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .insert({ titulo, empresa, ciudad, modalidad, descripcion })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
