import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// IMPORTANTE: la service_role key tiene acceso total y salta RLS.
// Nunca la expongas al frontend, solo úsala aquí en el backend.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

