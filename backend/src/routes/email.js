import { Router } from "express";
import {
  sendWelcome,
  sendApplicationConfirmation,
  sendStatusChange,
  sendPasswordReset,
} from "../services/email.js";
import { supabaseAdmin } from "../config/supabase.js";
import { requireAuth, requireOfferManager } from "../middleware/offerAccess.js";

const router = Router();

// ─── POST /api/email/welcome ──────────────────────────────────────────────────
// Body: { name, email }
router.post("/welcome", requireAuth, async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name y email son requeridos." });
  }
  if (email.toLowerCase() !== (req.authUser.email || "").toLowerCase()) {
    return res.status(403).json({ error: "Solo puedes enviar correos de bienvenida a tu propio correo." });
  }

  try {
    const result = await sendWelcome({ name, email });
    res.json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error("[email/welcome]", err);
    res.status(500).json({ error: "No se pudo enviar el email de bienvenida." });
  }
});

// ─── POST /api/email/postulacion ──────────────────────────────────────────────
// Body: { name, email, ofertaTitulo, ofertaEmpresa, ofertaCiudad }
router.post("/postulacion", requireAuth, async (req, res) => {
  const { name, email, ofertaTitulo, ofertaEmpresa, ofertaCiudad } = req.body;

  if (!name || !email || !ofertaTitulo || !ofertaEmpresa) {
    return res.status(400).json({ error: "name, email, ofertaTitulo y ofertaEmpresa son requeridos." });
  }
  if (email.toLowerCase() !== (req.authUser.email || "").toLowerCase()) {
    return res.status(403).json({ error: "Solo puedes enviar confirmaciones para tu propio correo." });
  }

  try {
    const result = await sendApplicationConfirmation({
      name,
      email,
      ofertaTitulo,
      ofertaEmpresa,
      ofertaCiudad,
    });
    res.json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error("[email/postulacion]", err);
    res.status(500).json({ error: "No se pudo enviar el email de confirmación." });
  }
});

// ─── POST /api/email/estado ───────────────────────────────────────────────────
// Body: { postulacionId, nuevoEstado }
router.post("/estado", requireOfferManager, async (req, res) => {
  const { postulacionId, nuevoEstado } = req.body;

  const estadosValidos = ["aplicado", "entrevista", "oferta", "rechazado"];
  if (!postulacionId || !estadosValidos.includes(nuevoEstado)) {
    return res.status(400).json({
      error: `Campos requeridos: postulacionId y nuevoEstado (${estadosValidos.join("|")}).`,
    });
  }

  try {
    const { data: application, error: applicationError } = await supabaseAdmin
      .from("postulaciones")
      .select("id, usuario_id, oferta_id")
      .eq("id", postulacionId)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application) return res.status(404).json({ error: "Postulación no encontrada." });

    const { data: offer, error: offerError } = await supabaseAdmin
      .from("ofertas")
      .select("id, titulo, empresa, empresa_id")
      .eq("id", application.oferta_id)
      .maybeSingle();
    if (offerError) throw offerError;
    if (!offer) return res.status(404).json({ error: "Oferta no encontrada." });
    if (req.authRole === "empresa" && offer.empresa_id !== req.companyId) {
      return res.status(403).json({ error: "No puedes notificar cambios de otra empresa." });
    }

    const [{ data: profile }, { data: userResult, error: userError }] = await Promise.all([
      supabaseAdmin.from("perfiles").select("nombre").eq("id", application.usuario_id).maybeSingle(),
      supabaseAdmin.auth.admin.getUserById(application.usuario_id),
    ]);
    if (userError) throw userError;
    if (!userResult.user?.email) return res.status(400).json({ error: "La persona postulada no tiene email." });

    const result = await sendStatusChange({
      name: profile?.nombre || "Candidato",
      email: userResult.user.email,
      ofertaTitulo: offer.titulo,
      ofertaEmpresa: offer.empresa,
      nuevoEstado,
    });
    res.json({ ok: true, id: result.data?.id });
  } catch (err) {
    console.error("[email/estado]", err);
    res.status(500).json({ error: "No se pudo enviar el email de actualización." });
  }
});

// ─── POST /api/email/recuperar ───────────────────────────────────────────────
// Body: { email }
// Delega el envío del correo a Supabase Auth para evitar depender de Gmail SMTP.
router.post("/recuperar", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email es requerido." });
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) return res.status(500).json({ error: "FRONTEND_URL no está configurada." });
  const redirectTo = `${frontendUrl.replace(/\/$/, "")}/nueva-contrasena`;

  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.warn("[email/recuperar] resetPasswordForEmail:", error.message);
      return res.json({ ok: true });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[email/recuperar]", err);
    res.status(500).json({ error: "No se pudo enviar el email de recuperación." });
  }
});

export default router;
