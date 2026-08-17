-- ============================================================
-- RUTA · CRM — Esquema de base de datos para Supabase (Postgres)
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- ------------------------------------------------------------
-- 1. USUARIOS (perfil vinculado a auth.users de Supabase Auth)
-- ------------------------------------------------------------
create table if not exists usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin', 'asesor')),
  telefono text,                          -- celular del asesor, para SMS/WhatsApp de respaldo
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. CLIENTES / PROSPECTOS
-- ------------------------------------------------------------
create table if not exists clientes (
  id text primary key,                 -- Cédula o NIT
  nombres text not null,
  apellidos text not null,
  telefono text not null,
  whatsapp text,
  correo text,
  direccion text,
  barrio text,
  ciudad text,
  lat double precision,
  lng double precision,
  tipo_negocio text,
  estado text not null default 'Pendiente'
    check (estado in ('Pendiente','Contactado','Visitado','Cliente','No Viable','Archivado')),
  fecha_ultima_visita date,
  fecha_seguimiento date,
  observaciones text,
  foto_url text,
  asesor_id uuid references usuarios(id),
  asesor_nombre text,
  fecha_creacion timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. VISITAS (histórico de cada visita realmente ejecutada)
-- ------------------------------------------------------------
create table if not exists visitas (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null references clientes(id) on delete cascade,
  asesor_id uuid references usuarios(id),
  fecha timestamptz not null default now(),
  observaciones text,
  foto_url text,
  estado_resultante text,
  creado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. CITAS (agendamiento: programadas, pospuestas, cumplidas, canceladas)
-- ------------------------------------------------------------
create table if not exists citas (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null references clientes(id) on delete cascade,
  asesor_id uuid not null references usuarios(id),
  fecha_hora timestamptz not null,
  estado text not null default 'Programada'
    check (estado in ('Programada','Pospuesta','Cumplida','Cancelada')),
  notas text,
  cita_anterior_id uuid references citas(id),   -- si nace de una reprogramación
  recordatorio_24h_enviado boolean not null default false,
  recordatorio_1h_enviado boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. SUSCRIPCIONES PUSH (celular del asesor, vía PWA instalada)
-- ------------------------------------------------------------
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  creado_en timestamptz not null default now()
);

-- Índices
create index if not exists idx_clientes_estado on clientes(estado);
create index if not exists idx_clientes_asesor on clientes(asesor_id);
create index if not exists idx_visitas_cliente on visitas(cliente_id);
create index if not exists idx_citas_fecha on citas(fecha_hora);
create index if not exists idx_citas_estado on citas(estado);
create index if not exists idx_citas_cliente on citas(cliente_id);
create index if not exists idx_push_usuario on push_subscriptions(usuario_id);

-- Trigger genérico: mantener actualizado_en al día
create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clientes_actualizado on clientes;
create trigger trg_clientes_actualizado
  before update on clientes
  for each row execute function set_actualizado_en();

drop trigger if exists trg_citas_actualizado on citas;
create trigger trg_citas_actualizado
  before update on citas
  for each row execute function set_actualizado_en();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table usuarios enable row level security;
alter table clientes enable row level security;
alter table visitas enable row level security;
alter table citas enable row level security;
alter table push_subscriptions enable row level security;

-- USUARIOS
drop policy if exists "usuarios_select_propio_o_admin" on usuarios;
create policy "usuarios_select_propio_o_admin"
  on usuarios for select
  using (
    id = auth.uid()
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

drop policy if exists "usuarios_update_propio" on usuarios;
create policy "usuarios_update_propio"
  on usuarios for update
  using (id = auth.uid());

-- CLIENTES
drop policy if exists "clientes_select_autenticados" on clientes;
create policy "clientes_select_autenticados"
  on clientes for select to authenticated using (true);

drop policy if exists "clientes_insert_autenticados" on clientes;
create policy "clientes_insert_autenticados"
  on clientes for insert to authenticated with check (true);

drop policy if exists "clientes_update_autenticados" on clientes;
create policy "clientes_update_autenticados"
  on clientes for update to authenticated using (true);

drop policy if exists "clientes_delete_admin" on clientes;
create policy "clientes_delete_admin"
  on clientes for delete to authenticated
  using (exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin'));

-- VISITAS
drop policy if exists "visitas_select_autenticados" on visitas;
create policy "visitas_select_autenticados"
  on visitas for select to authenticated using (true);

drop policy if exists "visitas_insert_autenticados" on visitas;
create policy "visitas_insert_autenticados"
  on visitas for insert to authenticated with check (true);

-- CITAS: cualquier autenticado ve y crea; solo el asesor dueño (o admin) edita/cancela
drop policy if exists "citas_select_autenticados" on citas;
create policy "citas_select_autenticados"
  on citas for select to authenticated using (true);

drop policy if exists "citas_insert_autenticados" on citas;
create policy "citas_insert_autenticados"
  on citas for insert to authenticated with check (true);

drop policy if exists "citas_update_propio_o_admin" on citas;
create policy "citas_update_propio_o_admin"
  on citas for update to authenticated
  using (
    asesor_id = auth.uid()
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- PUSH_SUBSCRIPTIONS: cada usuario administra solo las suyas;
-- el servicio (service_role, usado por la Edge Function) puede leerlas todas.
drop policy if exists "push_select_propio" on push_subscriptions;
create policy "push_select_propio"
  on push_subscriptions for select to authenticated
  using (usuario_id = auth.uid());

drop policy if exists "push_insert_propio" on push_subscriptions;
create policy "push_insert_propio"
  on push_subscriptions for insert to authenticated
  with check (usuario_id = auth.uid());

drop policy if exists "push_delete_propio" on push_subscriptions;
create policy "push_delete_propio"
  on push_subscriptions for delete to authenticated
  using (usuario_id = auth.uid());

-- ============================================================
-- STORAGE: bucket para las fotos de las visitas
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fotos-visitas', 'fotos-visitas', true)
on conflict (id) do nothing;

drop policy if exists "fotos_visitas_lectura_publica" on storage.objects;
create policy "fotos_visitas_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'fotos-visitas');

drop policy if exists "fotos_visitas_insert_autenticados" on storage.objects;
create policy "fotos_visitas_insert_autenticados"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos-visitas');

-- ============================================================
-- PROGRAMACIÓN AUTOMÁTICA DE RECORDATORIOS (pg_cron + pg_net)
-- Llama cada 15 minutos a la Edge Function "recordatorios-citas",
-- que revisa las citas próximas (24h y 1h antes) y envía:
--  - WhatsApp al cliente
--  - Push al celular del asesor
-- IMPORTANTE: reemplaza TU-PROYECTO y TU_SERVICE_ROLE_KEY antes de ejecutar,
-- o corre este bloque desde la guía después de desplegar la función.
-- ============================================================
-- select cron.schedule(
--   'recordatorios-citas-cada-15-min',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://TU-PROYECTO.functions.supabase.co/recordatorios-citas',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer TU_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
