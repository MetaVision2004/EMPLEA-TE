import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// GET /api/postulaciones/:usuarioId - listar postulaciones de un usuario
router.get("/:usuarioId", async (req, res) => {
  const { usuarioId } = req.params;

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .select("id, estado, created_at, ofertas ( titulo, empresa )")
    .eq("usuario_id", usuarioId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/postulaciones - crear una postulación
router.post("/", async (req, res) => {
  const { usuario_id, oferta_id } = req.body;

  if (!usuario_id || !oferta_id) {
    return res
      .status(400)
      .json({ error: "usuario_id y oferta_id son obligatorios" });
  }

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .insert({ usuario_id, oferta_id, estado: "aplicado" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/postulaciones/:id/estado - actualizar estado (aplicado/entrevista/oferta/rechazado)
router.patch("/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ["aplicado", "entrevista", "oferta", "rechazado"];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .update({ estado })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
