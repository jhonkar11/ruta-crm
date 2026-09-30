-- ============================================================
-- RUTA · CRM — MÓDULO INTELIGENTE DE SOPORTE TÉCNICO Y CUENTAS DE COBRO
-- Migración SQL para Supabase / PostgreSQL
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";

-- ------------------------------------------------------------
-- 1. TABLA: soporte_servicios (Casos de soporte y cuentas de cobro)
-- ------------------------------------------------------------
create table if not exists soporte_servicios (
  id text primary key,                                 -- ID único de servicio (ej: serv-...)
  numero_caso text not null,                           -- N° de Caso / Código de requerimiento (ej: RE26014844 / 2303375)
  fecha_solicitud text,                                -- Fecha solicitud (DD/MM/AAAA)
  fecha_atencion text,                                 -- Fecha atención (DD/MM/AAAA)
  fecha_finalizacion text,                             -- Fecha finalización (DD/MM/AAAA)
  mesa text default '2',                               -- Mesa o tipo de soporte (ej: Mesa IBM / Mesa 2)
  cliente text not null,                               -- Cliente final (ej: Banco Popular, Jumbo Popayán, etc.)
  coordinador text default 'Oswaldo',                  -- Coordinador del servicio
  valor_servicios numeric not null default 0,          -- Tarifa del servicio ($ COP)
  valor_viaticos numeric not null default 0,           -- Viáticos ($ COP)
  valor_materiales numeric not null default 0,         -- Materiales o repuestos ($ COP)
  sh text default 'SOFTWARE - HARDWARE',               -- Tipo: SOFTWARE, HARDWARE, SOFTWARE - HARDWARE
  tecnico text default 'Jhon Alexander Vasquez Reveló', -- Nombre del técnico responsable
  medio text default 'SITIO',                          -- Medio: SITIO o REMOTO
  equipo text,                                         -- Nombre del equipo, serial o hostname
  falla text,                                          -- Descripción corta de la falla
  causa text,                                          -- Diagnóstico técnico de la causa raíz
  solucion text,                                       -- Detalle técnico de la solución aplicada
  pruebas text,                                        -- Pruebas de validación con usuario
  horas jsonb default '{}'::jsonb,                     -- Horas: { inicio, fin, desplazamiento }
  plantilla_completa text,                             -- Plantilla corporativa formateada para WhatsApp
  foto_url text,                                       -- URL de imagen temporal o evidencia
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_soporte_servicios_fecha on soporte_servicios(creado_en desc);
create index if not exists idx_soporte_servicios_cliente on soporte_servicios(cliente);
create index if not exists idx_soporte_servicios_caso on soporte_servicios(numero_caso);

-- Trigger para mantener actualizado_en
drop trigger if exists trg_soporte_servicios_actualizado on soporte_servicios;
create trigger trg_soporte_servicios_actualizado
  before update on soporte_servicios
  for each row execute function set_actualizado_en();

-- ------------------------------------------------------------
-- 2. TABLA: soporte_archivos_temporales (Control de TTL / 7 días)
-- ------------------------------------------------------------
create table if not exists soporte_archivos_temporales (
  id uuid primary key default gen_random_uuid(),
  archivo_nombre text not null,
  bucket_id text not null default 'soporte-temporales',
  subido_por text default 'jhonka001@gmail.com',
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null default (now() + interval '7 days'),
  purgado boolean not null default false
);

create index if not exists idx_archivos_expira on soporte_archivos_temporales(expira_en, purgado);

-- ------------------------------------------------------------
-- 3. STORAGE: BUCKET PARA IMÁGENES TEMPORALES (TTL 7 DÍAS)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('soporte-temporales', 'soporte-temporales', true)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 4. SEGURIDAD Y CONTROL DE ACCESO (RBAC) - Jhonka001@gmail.com
-- ------------------------------------------------------------
alter table soporte_servicios enable row level security;
alter table soporte_archivos_temporales enable row level security;

-- Política de lectura: Exclusiva para jhonka001@gmail.com o usuario admin asociado
drop policy if exists "soporte_servicios_select_admin" on soporte_servicios;
create policy "soporte_servicios_select_admin"
  on soporte_servicios for select to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- Política de inserción: Exclusiva para jhonka001@gmail.com
drop policy if exists "soporte_servicios_insert_admin" on soporte_servicios;
create policy "soporte_servicios_insert_admin"
  on soporte_servicios for insert to authenticated
  with check (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- Política de actualización: Exclusiva para jhonka001@gmail.com
drop policy if exists "soporte_servicios_update_admin" on soporte_servicios;
create policy "soporte_servicios_update_admin"
  on soporte_servicios for update to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- Política de eliminación: Exclusiva para jhonka001@gmail.com
drop policy if exists "soporte_servicios_delete_admin" on soporte_servicios;
create policy "soporte_servicios_delete_admin"
  on soporte_servicios for delete to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
    or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
  );

-- Políticas RLS sobre Storage (soporte-temporales)
drop policy if exists "soporte_storage_select" on storage.objects;
create policy "soporte_storage_select"
  on storage.objects for select
  using (
    bucket_id = 'soporte-temporales'
    and (
      lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
      or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
    )
  );

drop policy if exists "soporte_storage_insert" on storage.objects;
create policy "soporte_storage_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'soporte-temporales'
    and (
      lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
      or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
    )
  );

drop policy if exists "soporte_storage_delete" on storage.objects;
create policy "soporte_storage_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'soporte-temporales'
    and (
      lower(coalesce(auth.jwt() ->> 'email', '')) = 'jhonka001@gmail.com'
      or exists (select 1 from usuarios u where u.id = auth.uid() and u.rol = 'admin')
    )
  );

-- ------------------------------------------------------------
-- 5. FUNCIÓN Y CRON JOB PARA PURGA AUTOMÁTICA DE IMÁGENES (7 DÍAS)
-- ------------------------------------------------------------
create or replace function purgar_archivos_temporales_soporte(dias_retencion int default 7)
returns int as $$
declare
  total_eliminados int := 0;
begin
  -- Eliminar objetos de storage con más de 'dias_retencion' días de antigüedad
  delete from storage.objects
  where bucket_id = 'soporte-temporales'
    and created_at < now() - (dias_retencion || ' days')::interval;
  
  get diagnostics total_eliminados = row_count;

  -- Marcar en la tabla de control
  update soporte_archivos_temporales
  set purgado = true
  where expira_en < now() and purgado = false;

  return total_eliminados;
end;
$$ language plpgsql security definer;

-- Programar ejecución diaria a las 3:00 AM vía pg_cron
-- select cron.schedule(
--   'purga-imagenes-soporte-diaria',
--   '0 3 * * *',
--   $$ select purgar_archivos_temporales_soporte(7); $$
-- );
