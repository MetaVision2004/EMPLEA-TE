import { supabaseAdmin } from "../config/supabase.js";

export async function requireOfferManager(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Se requiere autenticación" });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido o expirado" });

  const role = user.app_metadata?.role || user.user_metadata?.role;
  const allowedEmails = new Set(
    (process.env.ADMIN_EMAILS || "heidieneidal@gmail.com,serjegomare@gmail.com")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
  if (!allowedEmails.has((user.email || "").toLowerCase()) && !["staff", "empresa"].includes(role)) {
    return res.status(403).json({ error: "No tienes permisos para gestionar ofertas" });
  }

  req.authUser = user;
  next();
}
