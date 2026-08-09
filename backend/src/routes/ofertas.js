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

// GET /api/ofertas/all - listar todas las ofertas (activas e inactivas para admin)
router.get("/all", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/ofertas - crear una oferta (uso administrativo)
router.post("/", async (req, res) => {
  const { titulo, empresa, ciudad, modalidad, salario_rango, requisitos, descripcion, activa } = req.body;

  if (!titulo || !empresa) {
    return res.status(400).json({ error: "titulo y empresa son obligatorios" });
  }

  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .insert({
      titulo,
      empresa,
      ciudad: ciudad || "Remoto",
      modalidad: modalidad || "presencial",
      salario_rango: salario_rango || null,
      requisitos: requisitos || null,
      descripcion: descripcion || "",
      activa: activa !== undefined ? activa : true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/ofertas/:id - actualizar una oferta existente
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { titulo, empresa, ciudad, modalidad, salario_rango, requisitos, descripcion, activa } = req.body;

  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .update({
      ...(titulo !== undefined && { titulo }),
      ...(empresa !== undefined && { empresa }),
      ...(ciudad !== undefined && { ciudad }),
      ...(modalidad !== undefined && { modalidad }),
      ...(salario_rango !== undefined && { salario_rango }),
      ...(requisitos !== undefined && { requisitos }),
      ...(descripcion !== undefined && { descripcion }),
      ...(activa !== undefined && { activa }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/ofertas/:id - eliminar una oferta
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("ofertas")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, message: "Oferta eliminada correctamente" });
});

export default router;
