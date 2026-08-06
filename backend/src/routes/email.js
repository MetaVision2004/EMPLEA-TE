import { Router } from "express";
import {
  sendWelcome,
  sendApplicationConfirmation,
  sendStatusChange,
  sendPasswordReset,
} from "../services/email.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// ─── POST /api/email/welcome ──────────────────────────────────────────────────
// Body: { name, email }
router.post("/welcome", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "name y email son requeridos." });
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
router.post("/postulacion", async (req, res) => {
  const { name, email, ofertaTitulo, ofertaEmpresa, ofertaCiudad } = req.body;

  if (!name || !email || !ofertaTitulo || !ofertaEmpresa) {
    return res.status(400).json({ error: "name, email, ofertaTitulo y ofertaEmpresa son requeridos." });
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
// Body: { name, email, ofertaTitulo, ofertaEmpresa, nuevoEstado }
router.post("/estado", async (req, res) => {
  const { name, email, ofertaTitulo, ofertaEmpresa, nuevoEstado } = req.body;

  const estadosValidos = ["aplicado", "entrevista", "oferta", "rechazado"];
  if (!name || !email || !ofertaTitulo || !ofertaEmpresa || !estadosValidos.includes(nuevoEstado)) {
    return res.status(400).json({
      error: `Campos requeridos: name, email, ofertaTitulo, ofertaEmpresa, nuevoEstado (${estadosValidos.join("|")}).`,
    });
  }

  try {
    const result = await sendStatusChange({
      name,
      email,
      ofertaTitulo,
      ofertaEmpresa,
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
// Genera el reset-link con la service_role (sin disparar email de Supabase)
// y lo envía con Resend — evita completamente el rate limit del auth de Supabase.
router.post("/recuperar", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email es requerido." });
  }

  const redirectTo =
    (process.env.FRONTEND_URL || "http://localhost:3000") + "/nueva-contrasena";

  try {
    // Generar el link de reset SIN enviar email (Supabase admin API)
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (linkError) {
      // Si el email no existe respondemos igual para no revelar usuarios registrados
      console.warn("[email/recuperar] generateLink:", linkError.message);
      return res.json({ ok: true });
    }

    const resetLink = data?.properties?.action_link;
    if (!resetLink) {
      console.error("[email/recuperar] No se obtuvo action_link de Supabase");
      return res.status(500).json({ error: "No se pudo generar el enlace de recuperación." });
    }

    const name = email.split("@")[0];
    await sendPasswordReset({ name, email, resetLink });

    res.json({ ok: true });
  } catch (err) {
    console.error("[email/recuperar]", err);
    res.status(500).json({ error: "No se pudo enviar el email de recuperación." });
  }
});

export default router;
