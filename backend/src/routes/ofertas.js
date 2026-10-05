import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { requireOfferManager } from "../middleware/offerAccess.js";

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
router.get("/all", requireOfferManager, async (req, res) => {
  let query = supabaseAdmin
    .from("ofertas")
    .select("*")
    .order("created_at", { ascending: false });
  if (req.authRole === "empresa") query = query.eq("empresa_id", req.companyId);
  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/ofertas - crear una oferta (uso administrativo)
// Body: { titulo, empresa, ciudad, ..., notificarUsuarios }  <-- notificarUsuarios: boolean (opcional, default false)
router.post("/", requireOfferManager, async (req, res) => {
  const { titulo, empresa, ciudad, modalidad, salario_rango, requisitos, descripcion, activa, notificarUsuarios } = req.body;
  if (notificarUsuarios) {
    return res.status(400).json({ error: "Las notificaciones masivas están deshabilitadas hasta implementar consentimiento y baja." });
  }
  const nombreEmpresa = req.authRole === "empresa" ? req.companyName : empresa;

  const modalidadesValidas = ["presencial", "remoto", "hibrido"];
  if (typeof titulo !== "string" || titulo.trim().length < 3 || titulo.trim().length > 120) {
    return res.status(400).json({ error: "El título debe tener entre 3 y 120 caracteres" });
  }
  if (typeof nombreEmpresa !== "string" || nombreEmpresa.trim().length < 2 || nombreEmpresa.trim().length > 120) {
    return res.status(400).json({ error: "La empresa debe tener entre 2 y 120 caracteres" });
  }
  if (!modalidadesValidas.includes(modalidad)) {
    return res.status(400).json({ error: "La modalidad no es válida" });
  }
  if (typeof requisitos !== "string" || requisitos.trim().length < 5 || requisitos.trim().length > 2000) {
    return res.status(400).json({ error: "Los requisitos deben tener entre 5 y 2000 caracteres" });
  }
  if (salario_rango !== undefined && salario_rango !== null &&
      (typeof salario_rango !== "string" || salario_rango.trim().length > 120)) {
    return res.status(400).json({ error: "El rango salarial debe ser texto de máximo 120 caracteres" });
  }
  if (salario_rango && !/(\d|convenir|negociable|definir)/i.test(salario_rango)) {
    return res.status(400).json({ error: "El rango salarial debe incluir una cifra o indicar que está por definir" });
  }

  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .insert({
      titulo: titulo.trim(),
      empresa: nombreEmpresa.trim(),
      empresa_id: req.authRole === "empresa" ? req.companyId : null,
      ciudad: ciudad || "Remoto",
      modalidad: modalidad || "presencial",
      salario_rango: salario_rango || null,
      requisitos: requisitos.trim(),
      descripcion: descripcion || "",
      activa: activa !== undefined ? activa : true,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Responder inmediatamente con la oferta creada
  res.status(201).json(data);
});

// PUT /api/ofertas/:id - actualizar una oferta existente
router.put("/:id", requireOfferManager, async (req, res) => {
  const { id } = req.params;
  const { titulo, empresa, ciudad, modalidad, salario_rango, requisitos, descripcion, activa } = req.body;

  if (titulo !== undefined && (typeof titulo !== "string" || titulo.trim().length < 3 || titulo.trim().length > 120)) {
    return res.status(400).json({ error: "El título debe tener entre 3 y 120 caracteres" });
  }
  if (empresa !== undefined && (typeof empresa !== "string" || empresa.trim().length < 2 || empresa.trim().length > 120)) {
    return res.status(400).json({ error: "La empresa debe tener entre 2 y 120 caracteres" });
  }
  if (modalidad !== undefined && !["presencial", "remoto", "hibrido"].includes(modalidad)) {
    return res.status(400).json({ error: "La modalidad no es válida" });
  }
  if (requisitos !== undefined && (typeof requisitos !== "string" || requisitos.trim().length < 5 || requisitos.trim().length > 2000)) {
    return res.status(400).json({ error: "Los requisitos deben tener entre 5 y 2000 caracteres" });
  }
  if (salario_rango !== undefined && salario_rango !== null &&
      (typeof salario_rango !== "string" || salario_rango.trim().length > 120 ||
       (salario_rango.trim() !== "" && !/(\d|convenir|negociable|definir)/i.test(salario_rango)))) {
    return res.status(400).json({ error: "El rango salarial no tiene un formato válido" });
  }

  let query = supabaseAdmin
    .from("ofertas")
    .update({
      ...(titulo !== undefined && { titulo: typeof titulo === "string" ? titulo.trim() : titulo }),
      ...(req.authRole === "empresa" && { empresa: req.companyName }),
      ...(req.authRole !== "empresa" && empresa !== undefined && { empresa: typeof empresa === "string" ? empresa.trim() : empresa }),
      ...(ciudad !== undefined && { ciudad: typeof ciudad === "string" ? ciudad.trim() : ciudad }),
      ...(modalidad !== undefined && { modalidad }),
      ...(salario_rango !== undefined && { salario_rango }),
      ...(requisitos !== undefined && { requisitos: typeof requisitos === "string" ? requisitos.trim() : requisitos }),
      ...(descripcion !== undefined && { descripcion: typeof descripcion === "string" ? descripcion.trim() : descripcion }),
      ...(activa !== undefined && { activa }),
    })
    .eq("id", id);
  if (req.authRole === "empresa") query = query.eq("empresa_id", req.companyId);
  const { data, error } = await query.select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/ofertas/:id - eliminar una oferta
router.delete("/:id", requireOfferManager, async (req, res) => {
  const { id } = req.params;

  let query = supabaseAdmin
    .from("ofertas")
    .delete()
    .eq("id", id);
  if (req.authRole === "empresa") query = query.eq("empresa_id", req.companyId);
  const { error } = await query;

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, message: "Oferta eliminada correctamente" });
});

export default router;
