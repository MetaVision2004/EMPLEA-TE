# Evidencia del proyecto Supabase

Panel del proyecto: [Emplea-TE en Supabase](https://supabase.com/dashboard/project/funzpejykxchhyccejsi)

Para obtener la evidencia solicitada, inicia sesión en Supabase y verifica en el panel del proyecto:

| Servicio | Ubicación | Estado esperado |
| --- | --- | --- |
| Auth | Authentication | Activo |
| Database | Table Editor o Database | Activo |
| Storage | Storage | Activo, con el bucket privado `documentos` |

Antes de desplegar, revisa también Authentication → URL Configuration:

- Site URL: el dominio principal de producción, por ejemplo `https://emplea-te.vercel.app`.
- Redirect URLs: `https://emplea-te.vercel.app/**` y `http://localhost:3000/**` para desarrollo.
- Authentication → Settings: longitud mínima de contraseña de 8 caracteres.

Después ejecuta `docs/schema.sql` en SQL Editor. El esquema protege `perfiles.rol`,
activa RLS en `empresas` y `ofertas`, habilita la RPC `admin_stats` y exige una
relación `empresas.owner_id` para que una cuenta empresa gestione sus ofertas.

La captura debe incluir el nombre del proyecto y el estado visible de los tres servicios. El estado no se marca automáticamente en este documento porque depende de la sesión y del panel privado de Supabase.