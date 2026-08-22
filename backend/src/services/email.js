import { supabaseAdmin } from "../config/supabase.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const FROM = process.env.FROM_EMAIL || "Emplea-TE <noreply@supabase.co>";

function getEmailProvider() {
  return "supabase-auth";
}

function escapeHtml(input) {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function frontendPath(path) {
  const normalizedBase = FRONTEND_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function sendMail({ to, subject, html, type = "custom" }) {
  const provider = getEmailProvider();

  console.warn(
    `[email:${type}] Este proyecto usa solo Supabase Auth. El envío de correos transaccionales se gestiona fuera de este servicio.`
  );

  return {
    ok: true,
    kind: "supabase-auth",
    provider,
    skipped: true,
    to,
    subject,
    html,
    from: FROM,
  };
}

// ─── Shared layout ──────────────────────────────────────────────────────────

function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(99,102,241,0.12);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);padding:36px 48px;text-align:center;">
              <span style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:8px 20px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🚀 Emplea-TE</span>
              </span>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">${title}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9ff;padding:28px 48px;text-align:center;border-top:1px solid #e8eaf6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © 2026 Emplea-TE · Tu primer trabajo, a un clic de distancia<br/>
                <a href="#" style="color:#6366f1;text-decoration:none;">Darse de baja</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Button helper ───────────────────────────────────────────────────────────

function btn(text, href) {
  return `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:12px;margin:8px 0;">${text}</a>`;
}

// ─── 1. Welcome email ────────────────────────────────────────────────────────

export async function sendWelcome({ name, email }) {
  const safeName = escapeHtml(name);
  const body = `
    <h2 style="margin:0 0 8px;font-size:26px;color:#1e1b4b;">¡Hola, ${safeName}! 👋</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Bienvenido/a a <strong style="color:#6366f1;">Emplea-TE</strong>, la plataforma diseñada para ayudarte a dar
      ese gran primer paso en tu carrera profesional.
    </p>

    <div style="background:#f5f3ff;border-radius:16px;padding:24px;margin-bottom:28px;">
      <p style="margin:0 0 12px;font-weight:700;color:#4338ca;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">¿Qué puedes hacer ahora?</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:#374151;font-size:14px;">✅ &nbsp;Completa tu perfil profesional</td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px;">📄 &nbsp;Sube tu CV en PDF</td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px;">🔍 &nbsp;Explora ofertas de empleo activas</td></tr>
        <tr><td style="padding:6px 0;color:#374151;font-size:14px;">📊 &nbsp;Haz seguimiento de tus postulaciones</td></tr>
      </table>
    </div>

    <div style="text-align:center;">
      ${btn("Ir a mi perfil →", frontendPath("/perfil"))}
    </div>

    <p style="color:#9ca3af;font-size:13px;margin:32px 0 0;text-align:center;">
      Si tienes preguntas, escríbenos a <a href="mailto:soporte@emplea-te.com" style="color:#6366f1;">soporte@emplea-te.com</a>
    </p>
  `;

  return sendMail({
    to: email,
    subject: `¡Bienvenido/a a Emplea-TE, ${safeName}! 🚀`,
    html: layout("Bienvenido/a a Emplea-TE", body),
  });
}

// ─── 2. Application confirmation ─────────────────────────────────────────────

export async function sendApplicationConfirmation({ name, email, ofertaTitulo, ofertaEmpresa, ofertaCiudad }) {
  const safeName = escapeHtml(name);
  const safeOfertaTitulo = escapeHtml(ofertaTitulo);
  const safeOfertaEmpresa = escapeHtml(ofertaEmpresa);
  const safeOfertaCiudad = escapeHtml(ofertaCiudad || "Remoto");

  const body = `
    <h2 style="margin:0 0 8px;font-size:26px;color:#1e1b4b;">¡Postulación enviada! 🎉</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hola <strong>${safeName}</strong>, tu postulación ha sido registrada exitosamente. ¡Mucha suerte!
    </p>

    <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:28px;margin-bottom:28px;border-left:5px solid #6366f1;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;">Oferta a la que aplicaste</p>
      <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1e1b4b;">${safeOfertaTitulo}</p>
      <p style="margin:0;font-size:14px;color:#6b7280;">${safeOfertaEmpresa} &nbsp;·&nbsp; ${safeOfertaCiudad}</p>
    </div>

    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:28px;">
      <p style="margin:0;color:#166534;font-size:14px;line-height:1.7;">
        <strong>¿Qué sigue?</strong><br/>
        Puedes revisar el estado de tu postulación en cualquier momento desde el tablero de <em>Mis postulaciones</em>.
        Te notificaremos por email cuando haya novedades.
      </p>
    </div>

    <div style="text-align:center;">
      ${btn("Ver mis postulaciones →", frontendPath("/postulaciones"))}
    </div>
  `;

  return sendMail({
    to: email,
    subject: `Postulación confirmada: ${safeOfertaTitulo} en ${safeOfertaEmpresa} ✅`,
    html: layout("Confirmación de Postulación", body),
  });
}

// ─── 3. Status change notification ──────────────────────────────────────────

const ESTADO_INFO = {
  aplicado:   { label: "Aplicado",        emoji: "📋", color: "#6366f1", bg: "#f5f3ff" },
  entrevista: { label: "Entrevista",      emoji: "🤝", color: "#0891b2", bg: "#f0f9ff" },
  oferta:     { label: "Oferta recibida", emoji: "🎊", color: "#059669", bg: "#f0fdf4" },
  rechazado:  { label: "No seleccionado", emoji: "📭", color: "#dc2626", bg: "#fef2f2" },
};

const ESTADO_MENSAJES = {
  entrevista: "¡Felicidades! Han mostrado interés en tu perfil y quieren conocerte mejor. Prepárate para la entrevista.",
  oferta:     "¡Increíble noticia! Has recibido una oferta de trabajo. Revisa los detalles y responde a tiempo.",
  rechazado:  "No te desanimes, cada proceso es aprendizaje. Sigue explorando las demás ofertas en Emplea-TE.",
  aplicado:   "Tu postulación ha vuelto al estado inicial.",
};

export async function sendStatusChange({ name, email, ofertaTitulo, ofertaEmpresa, nuevoEstado }) {
  const info = ESTADO_INFO[nuevoEstado] || ESTADO_INFO.aplicado;
  const mensaje = ESTADO_MENSAJES[nuevoEstado] || "";
  const safeName = escapeHtml(name);
  const safeOfertaTitulo = escapeHtml(ofertaTitulo);
  const safeOfertaEmpresa = escapeHtml(ofertaEmpresa);
  const safeMensaje = escapeHtml(mensaje);

  const body = `
    <h2 style="margin:0 0 8px;font-size:26px;color:#1e1b4b;">Actualización de tu postulación ${info.emoji}</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hola <strong>${safeName}</strong>, el estado de una de tus postulaciones ha cambiado.
    </p>

    <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;">Oferta</p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#1e1b4b;">${safeOfertaTitulo}</p>
      <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">${safeOfertaEmpresa}</p>
      <div style="display:inline-block;background:${info.bg};border-radius:50px;padding:10px 22px;">
        <span style="font-size:15px;font-weight:700;color:${info.color};">${info.emoji} &nbsp;${info.label}</span>
      </div>
    </div>

    ${mensaje ? `<div style="background:#fffbeb;border-radius:12px;padding:20px;margin-bottom:28px;border-left:4px solid #f59e0b;">
      <p style="margin:0;color:#92400e;font-size:14px;line-height:1.7;">${safeMensaje}</p>
    </div>` : ""}

    <div style="text-align:center;">
      ${btn("Ver mis postulaciones →", frontendPath("/postulaciones"))}
    </div>
  `;

  return sendMail({
    to: email,
    subject: `${info.emoji} Tu postulación en ${safeOfertaEmpresa}: ${info.label}`,
    html: layout("Actualización de Postulación", body),
  });
}

// ─── 4. Password reset ────────────────────────────────────────────────────────

export async function sendPasswordReset({ name, email, resetLink }) {
  const redirectTo = resetLink || frontendPath("/nueva-contrasena");
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    throw error;
  }

  return {
    ok: true,
    kind: "reset",
    provider: "supabase-auth",
    skipped: false,
    to: email,
    subject: `🔐 Restablece tu contraseña en Emplea-TE`,
    name: escapeHtml(name || ""),
  };
}

export async function sendNewOffer({ name, email, ofertaTitulo, ofertaEmpresa, ofertaCiudad }) {
  const safeName = escapeHtml(name);
  const safeOfertaTitulo = escapeHtml(ofertaTitulo);
  const safeOfertaEmpresa = escapeHtml(ofertaEmpresa);
  const safeOfertaCiudad = escapeHtml(ofertaCiudad || "Remoto");

  const body = `
    <h2 style="margin:0 0 8px;font-size:26px;color:#1e1b4b;">Nueva oferta disponible 🔔</h2>
    <p style="color:#6b7280;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Hola <strong>${safeName}</strong>, hemos publicado una nueva oferta que podría interesarte.
    </p>

    <div style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border-radius:16px;padding:24px;margin-bottom:20px;border-left:5px solid #6366f1;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.5px;">Oferta destacada</p>
      <p style="margin:0 0 4px;font-size:20px;font-weight:800;color:#1e1b4b;">${safeOfertaTitulo}</p>
      <p style="margin:0;font-size:14px;color:#6b7280;">${safeOfertaEmpresa} &nbsp;·&nbsp; ${safeOfertaCiudad}</p>
    </div>

    <div style="background:#f0f9ff;border-radius:12px;padding:18px;margin-bottom:28px;">
      <p style="margin:0;color:#0369a1;font-size:14px;line-height:1.6;">
        Si te interesa, entra a la oferta y postúlate desde tu cuenta. ¡Mucha suerte!
      </p>
    </div>

    <div style="text-align:center;">
      ${btn("Ver oferta →", frontendPath("/ofertas"))}
    </div>

    <p style="color:#9ca3af;font-size:13px;margin:24px 0 0;text-align:center;">
      ¿Necesitas ayuda? Escríbenos a <a href="mailto:soporte@emplea-te.com" style="color:#6366f1;">soporte@emplea-te.com</a>
    </p>
  `;

  return sendMail({
    to: email,
    subject: `💼 Nueva oferta: ${safeOfertaTitulo} en ${safeOfertaEmpresa}`,
    html: layout("Nueva Oferta en Emplea-TE", body),
  });
}
