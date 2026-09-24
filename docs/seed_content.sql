-- Contenido inicial para que el MVP tenga recursos y mentoría disponibles.
-- Ejecutar después de docs/schema.sql en el SQL Editor de Supabase.

alter table public.recursos add column if not exists descripcion text;
alter table public.recursos add column if not exists duracion text;

insert into public.recursos (titulo, tipo, url, categoria, nivel, descripcion, duracion)
select * from (values
  ('Cómo hacer una hoja de vida sin experiencia', 'articulo', 'https://www.mintrabajo.gov.co/', 'Hoja de vida', 'Inicial', 'Estructura tu perfil, logros y habilidades para destacar aunque estés comenzando.', '8 min'),
  ('Prepárate para tu primera entrevista', 'video', 'https://www.youtube.com/results?search_query=entrevista+de+trabajo+primer+empleo', 'Entrevistas', 'Inicial', 'Practica respuestas claras y aprende a comunicar tus fortalezas con confianza.', '15 min'),
  ('Excel básico para el trabajo', 'curso', 'https://support.microsoft.com/es-es/excel', 'Herramientas', 'Inicial', 'Repasa tablas, filtros y fórmulas que aparecen en muchos primeros empleos.', '45 min'),
  ('Comunicación profesional por correo', 'articulo', 'https://edu.gcfglobal.org/es/creacion-de-un-correo-electronico/', 'Comunicación', 'Inicial', 'Aprende a escribir asuntos, saludos y mensajes profesionales.', '10 min'),
  ('Organiza tu búsqueda laboral', 'articulo', 'https://www.serviciodeempleo.gov.co/', 'Búsqueda laboral', 'Intermedio', 'Crea una rutina para buscar ofertas, hacer seguimiento y prepararte mejor.', '12 min'),
  ('Derechos básicos del trabajador', 'articulo', 'https://www.mintrabajo.gov.co/', 'Derechos laborales', 'Intermedio', 'Conoce los conceptos básicos de contrato, salario y jornada laboral.', '12 min')
) as contenido(titulo, tipo, url, categoria, nivel, descripcion, duracion)
where not exists (select 1 from public.recursos where recursos.titulo = contenido.titulo);

insert into public.mentores (nombre, especialidad, bio, disponible)
select * from (values
  ('Laura Méndez', 'Entrevistas y hoja de vida', 'Acompaño a jóvenes a presentar mejor su experiencia, habilidades y proyectos.', true),
  ('Andrés Rojas', 'Tecnología y herramientas digitales', 'Te ayudo a organizar tu ruta de aprendizaje y fortalecer tus habilidades digitales.', true),
  ('Camila Torres', 'Orientación laboral', 'Conversamos sobre opciones de primer empleo y cómo planear tu búsqueda.', true)
) as mentoria(nombre, especialidad, bio, disponible)
where not exists (select 1 from public.mentores where mentores.nombre = mentoria.nombre);
