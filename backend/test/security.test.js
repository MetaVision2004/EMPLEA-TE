import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.FRONTEND_URL = "http://localhost:3000";

const { app } = await import("../src/index.js");
const { supabaseAdmin } = await import("../src/config/supabase.js");

test("rejects offer management without a bearer token", async () => {
  const response = await request(app).get("/api/ofertas/all");

  assert.equal(response.status, 401);
  assert.equal(response.body.error, "Se requiere autenticación");
});

test("rejects protected application routes without a bearer token", async () => {
  const response = await request(app)
    .post("/api/postulaciones")
    .send({ oferta_id: "offer-id" });

  assert.equal(response.status, 401);
});

test("rejects authenticated users without a management role", async () => {
  const originalGetUser = supabaseAdmin.auth.getUser;
  const originalFrom = supabaseAdmin.from;
  supabaseAdmin.auth.getUser = async () => ({ data: { user: { id: "candidate-id", email: "candidate@example.com" } }, error: null });
  supabaseAdmin.from = () => ({
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: { rol: "candidato" }, error: null }) }),
    }),
  });

  try {
    const response = await request(app)
      .get("/api/ofertas/all")
      .set("Authorization", "Bearer valid-token");
    assert.equal(response.status, 403);
  } finally {
    supabaseAdmin.auth.getUser = originalGetUser;
    supabaseAdmin.from = originalFrom;
  }
});

test("rejects non-allowlisted origins", async () => {
  const response = await request(app)
    .get("/api/health")
    .set("Origin", "https://malicious.example");

  assert.equal(response.status, 500);
});
