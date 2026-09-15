import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { sendNewOffer } from "../services/email.js";
import { requireOfferManager } from "../middleware/offerAccess.js";

const router = Router();

// Helper: dividir en chunks
function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/ofertas - crear una oferta (uso administrativo)
// Body: { titulo, empresa, ciudad, ..., notificarUsuarios }  <-- notificarUsuarios: boolean (opcional, default false)
router.post("/", requireOfferManager, async (req, res) => {
  const { titulo, empresa, ciudad, modalidad, salario_rango, requisitos, descripcion, activa, notificarUsuarios } = req.body;

  const modalidadesValidas = ["presencial", "remoto", "hibrido"];
  if (typeof titulo !== "string" || titulo.trim().length < 3 || titulo.trim().length > 120) {
    return res.status(400).json({ error: "El título debe tener entre 3 y 120 caracteres" });
  }
  if (typeof empresa !== "string" || empresa.trim().length < 2 || empresa.trim().length > 120) {
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
      empresa: empresa.trim(),
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

  // Si se pidió notificar a usuarios, lanzamos el envío en background (no bloquea la respuesta)
  if (notificarUsuarios) {
    (async () => {
      try {
        // Obtener todos los usuarios del auth (admin)
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
          console.error("[ofertas/notificar] error listUsers:", usersError);
          return;
        }

        // Compatibilidad con distintas formas de respuesta
        const users = usersData?.users ?? usersData?.data ?? [];
        const recipients = users
          .map((u) => {
            const email = u.email || (u.user_metadata && u.user_metadata.email);
            const name = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || (email ? email.split("@")[0] : "Usuario");
            return email ? { name, email } : null;
          })
          .filter(Boolean);

        if (recipients.length === 0) {
          console.info("[ofertas/notificar] no se encontraron emails de usuarios para notificar");
          return;
        }

        // Configurables por env (tamaño batch y delay entre batches)
        const BATCH_SIZE = Number(process.env.EMAIL_BATCH_SIZE || 50); // por defecto 50
        const BATCH_DELAY_MS = Number(process.env.EMAIL_BATCH_DELAY_MS || 1000); // 1s entre batches

        const batches = chunkArray(recipients, BATCH_SIZE);
        console.info(`[ofertas/notificar] Enviando ${recipients.length} notificaciones en ${batches.length} batches (tamaño ${BATCH_SIZE})`);

        for (const batch of batches) {
          const settled = await Promise.allSettled(
            batch.map((r) =>
              sendNewOffer({
                name: r.name,
                email: r.email,
                ofertaTitulo: data.titulo,
                ofertaEmpresa: data.empresa,
                ofertaCiudad: data.ciudad,
              })
            )
          );

          // Log básico de resultados
          const successes = settled.filter((s) => s.status === "fulfilled").length;
          const failures = settled.filter((s) => s.status === "rejected").length;
          console.info(`[ofertas/notificar] batch enviado: ${successes} ok, ${failures} fallos`);

          // Esperar un poco antes del siguiente batch para evitar throttling
          if (BATCH_DELAY_MS > 0) await sleep(BATCH_DELAY_MS);
        }

        console.info("[ofertas/notificar] envío de notificaciones finalizado");
      } catch (err) {
        console.error("[ofertas/notificar] fallo inesperado:", err);
      }
    })().catch((err) => console.error("[ofertas/notificar] background error:", err));
  }
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

  const { data, error } = await supabaseAdmin
    .from("ofertas")
    .update({
      ...(titulo !== undefined && { titulo: typeof titulo === "string" ? titulo.trim() : titulo }),
      ...(empresa !== undefined && { empresa: typeof empresa === "string" ? empresa.trim() : empresa }),
      ...(ciudad !== undefined && { ciudad: typeof ciudad === "string" ? ciudad.trim() : ciudad }),
      ...(modalidad !== undefined && { modalidad }),
      ...(salario_rango !== undefined && { salario_rango }),
      ...(requisitos !== undefined && { requisitos: typeof requisitos === "string" ? requisitos.trim() : requisitos }),
      ...(descripcion !== undefined && { descripcion: typeof descripcion === "string" ? descripcion.trim() : descripcion }),
      ...(activa !== undefined && { activa }),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/ofertas/:id - eliminar una oferta
router.delete("/:id", requireOfferManager, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("ofertas")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, message: "Oferta eliminada correctamente" });
});

export default router;
