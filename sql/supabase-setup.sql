-- =====================================================
-- Configuración de la base de datos de la boda
-- Pegar TODO este archivo en: Supabase → SQL Editor → Run
-- =====================================================

-- Tabla de confirmaciones de asistencia
create table if not exists confirmaciones (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  nombre text not null,
  ceremonia text,
  fiesta text,
  restricciones text,
  mensaje text
);

-- Tabla de canciones sugeridas
create table if not exists canciones (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  nombre text not null,
  cancion text not null,
  link text
);

-- Seguridad: activar Row Level Security
alter table confirmaciones enable row level security;
alter table canciones enable row level security;

-- Nadie puede leer ni escribir directo en las tablas: todo pasa
-- por las funciones de abajo (security definer), que son las únicas
-- con permiso para insertar. Solo tú, autenticado, puedes leer.
create policy "leer autenticado" on confirmaciones
  for select to authenticated using (true);

create policy "leer autenticado" on canciones
  for select to authenticated using (true);

-- Función que recibe la confirmación de un invitado y la inserta
-- (corre con privilegios de administrador, evita depender de RLS)
create or replace function public.confirmar_asistencia(
  p_nombre text,
  p_ceremonia text default null,
  p_fiesta text default null,
  p_restricciones text default null,
  p_mensaje text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into confirmaciones (nombre, ceremonia, fiesta, restricciones, mensaje)
  values (p_nombre, p_ceremonia, p_fiesta, p_restricciones, p_mensaje);
end;
$$;

-- Función que recibe una canción sugerida y la inserta
create or replace function public.sugerir_cancion(
  p_nombre text,
  p_cancion text,
  p_link text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into canciones (nombre, cancion, link)
  values (p_nombre, p_cancion, p_link);
end;
$$;

-- Cualquier visitante (incluso sin sesión) puede llamar estas funciones
grant execute on function public.confirmar_asistencia to anon, authenticated, public;
grant execute on function public.sugerir_cancion to anon, authenticated, public;
