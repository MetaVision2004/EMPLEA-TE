import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireOfferManager } from "../middleware/offerAccess.js";

const router = Router();

// GET /api/postulaciones/:usuarioId - listar postulaciones de un usuario
router.get("/:usuarioId", requireAuth, async (req, res) => {
  const { usuarioId } = req.params;
  if (usuarioId !== req.authUser.id) {
    return res.status(403).json({ error: "No puedes consultar postulaciones de otro usuario" });
  }

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .select("id, estado, created_at, ofertas ( titulo, empresa )")
    .eq("usuario_id", usuarioId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/postulaciones - crear una postulación
router.post("/", requireAuth, async (req, res) => {
  const { oferta_id } = req.body;

  if (!oferta_id || typeof oferta_id !== "string") {
    return res
      .status(400)
      .json({ error: "oferta_id es obligatorio" });
  }

  const { data, error } = await supabaseAdmin
    .from("postulaciones")
    .insert({ usuario_id: req.authUser.id, oferta_id, estado: "aplicado" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /api/postulaciones/:id/estado - actualizar estado (aplicado/entrevista/oferta/rechazado)
router.patch("/:id/estado", requireOfferManager, async (req, res) => {
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
