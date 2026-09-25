# Emplea-TE

Plataforma de apoyo para personas en su primer trabajo: perfil, CV, ofertas y
seguimiento de postulaciones.

## Estructura del proyecto

```
emplea-te/
├── frontend/   → Next.js + Tailwind + Supabase (login, perfil, ofertas, postulaciones)
├── backend/    → Express (API opcional si no quieres exponer Supabase directo)
└── docs/       → schema.sql y storage_policies.sql para configurar Supabase
```

> Puedes usar **solo el frontend + Supabase** (más rápido para el MVP), o
> **frontend + backend** si prefieres tener una capa intermedia de API propia.
> El backend usa la `service_role key` de Supabase (acceso total), por eso
> nunca debe usarse en el navegador — solo aquí, del lado del servidor.

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Ve a **SQL Editor** y ejecuta, en orden:
   - `docs/schema.sql` (tablas + RLS + datos de prueba)
  - `docs/seed_content.sql` (recursos de aprendizaje y mentores iniciales)
3. Ve a **Storage** → crea un bucket llamado `documentos`, marcado como **privado**.
4. En el SQL Editor, ejecuta `docs/storage_policies.sql`.
5. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key` (para el frontend)
   - `service_role key` (solo para el backend, ¡mantenla secreta!)

La referencia para capturar el panel del proyecto, con Auth, Database y Storage,
está en [docs/supabase-panel.md](docs/supabase-panel.md).

## 2. Levantar todo con Docker Compose

Crea `backend/.env` a partir de `backend/.env.example` y completa las claves
de Supabase. Después, crea un archivo `.env` en la raíz con las variables
públicas del frontend:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Guarda ese archivo exactamente como `.env` en la raíz del proyecto (no como
`.env.example`), porque Docker Compose carga automáticamente `.env`.

Levanta ambos servicios desde la raíz del proyecto:

```bash
docker compose up --build
```

Abre `http://localhost:3000`. La API queda disponible en
`http://localhost:4000/api/health`.

Para detener los servicios:

```bash
docker compose down
```

## 3. Levantar el frontend sin Docker

```bash
cd Frontend
npm install
cp .env.local.example .env.local
# edita .env.local con tu URL y anon key de Supabase
npm run dev
```

Abre `http://localhost:3000`.

## 4. Levantar el backend (opcional)

```bash
cd backend
npm install
cp .env.example .env
# edita .env con tu SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
npm run dev
```

El backend corre en `http://localhost:4000`. Prueba con:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/ofertas
```

## 5. Flujo del MVP ya funcionando

1. `/registro` → crea cuenta y perfil básico.
2. `/perfil` → completa datos y sube CV en PDF (va al bucket `documentos`).
3. `/ofertas` → lista ofertas activas (usa las 3 de prueba del schema.sql), botón "Postularme".
4. `/postulaciones` → kanban con las postulaciones del usuario por estado.

## 6. Despliegue

- **Frontend:** conecta el repo a [Vercel](https://vercel.com), agrega las
  mismas variables de `.env.local` en el panel de Vercel.
- **Backend (si lo usas):** despliega en [Render](https://render.com) o
  [Railway](https://railway.app), agrega las variables de `.env` allí.

## 7. Próximos pasos sugeridos

- [x] Página de administración de ofertas con CRUD, activación/desactivación, validación y acceso por rol
- [x] Generador de CV en PDF a partir del perfil y experiencias
- [x] Sección de recursos educativos con filtros y progreso por usuario
- [x] Kanban de postulaciones con drag-and-drop, notas inline y filtros
- [x] Agregar mentoría con agenda de voluntarios
- [x] Analítica básica: perfiles completos y postulaciones en entrevista

### Roles y cambios de esquema

El acceso administrativo se controla con `perfiles.rol`: `admin`, `staff` o
`empresa` pueden gestionar ofertas y analítica; las cuentas nuevas reciben
`candidato`. El backend exige un Bearer token de Supabase y vuelve a consultar
el rol en cada request protegida. Para promover una cuenta existente, ejecuta
en el SQL Editor:

```sql
update perfiles
set rol = 'admin'
where id = 'UUID_DEL_USUARIO';
```

La clave `SUPABASE_SERVICE_ROLE_KEY` solo debe existir en el entorno del backend.
Si la clave que estaba en el ejemplo se usó fuera de desarrollo, rótala en
Supabase antes de desplegar.

Después de actualizar el proyecto, ejecuta de nuevo las secciones nuevas de
`docs/schema.sql` para crear `recursos_completados`, `mentores`,
`sesiones_mentoria` y las políticas de progreso y edición de postulaciones.
