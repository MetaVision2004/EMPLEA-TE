import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireOfferManager } from "../middleware/offerAccess.js";

const router = Router();

router.get("/", requireOfferManager, async (req, res) => {
  const [{ count: perfilesTotal, error: perfilesError }, { data: perfiles, error: perfilesDataError }, { count: entrevistas, error: entrevistasError }] = await Promise.all([
    supabaseAdmin.from("perfiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("perfiles").select("nombre, ciudad, nivel_educativo, habilidades"),
    supabaseAdmin.from("postulaciones").select("id", { count: "exact", head: true }).eq("estado", "entrevista"),
  ]);

  const error = perfilesError || perfilesDataError || entrevistasError;
  if (error) return res.status(500).json({ error: error.message });

  const perfilesCompletos = (perfiles || []).filter((perfil) =>
    Boolean(perfil.nombre?.trim() && perfil.ciudad?.trim() && perfil.nivel_educativo?.trim() && perfil.habilidades?.length)
  ).length;

  res.json({
    perfiles: { total: perfilesTotal || 0, completos: perfilesCompletos },
    postulaciones: { entrevista: entrevistas || 0 },
  });
});

export default router;