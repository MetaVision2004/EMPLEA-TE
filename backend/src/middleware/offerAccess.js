import { supabaseAdmin } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Se requiere autenticación" });

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Token inválido o expirado" });

  req.authUser = user;
  next();
}

export async function requireOfferManager(req, res, next) {
  await requireAuth(req, res, async () => {
    const { data: profile, error } = await supabaseAdmin
      .from("perfiles")
      .select("rol")
      .eq("id", req.authUser.id)
      .maybeSingle();

    if (error) {
      console.error("[auth] No se pudo consultar el rol:", error.message);
      return res.status(500).json({ error: "No se pudo validar el rol" });
    }

    const isConfiguredAdmin = req.authUser.email?.trim().toLowerCase() === "serjegomare@gmail.com";
    if (!isConfiguredAdmin && (!profile || !["admin", "staff", "empresa"].includes(profile.rol))) {
      return res.status(403).json({ error: "No tienes permisos para gestionar ofertas" });
    }

    req.authRole = isConfiguredAdmin ? "admin" : profile.rol;
    next();
  });
}
