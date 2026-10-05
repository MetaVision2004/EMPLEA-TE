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

    if (!profile || !["admin", "staff", "empresa"].includes(profile.rol)) {
      return res.status(403).json({ error: "No tienes permisos para gestionar ofertas" });
    }

    req.authRole = profile.rol;
    if (profile.rol === "empresa") {
      const { data: company, error: companyError } = await supabaseAdmin
        .from("empresas")
        .select("id, nombre")
        .eq("owner_id", req.authUser.id)
        .maybeSingle();

      if (companyError) {
        console.error("[auth] No se pudo consultar la empresa:", companyError.message);
        return res.status(500).json({ error: "No se pudo validar la empresa" });
      }
      if (!company) return res.status(403).json({ error: "La cuenta no tiene una empresa vinculada" });
      req.companyId = company.id;
      req.companyName = company.nombre;
    }
    next();
  });
}
