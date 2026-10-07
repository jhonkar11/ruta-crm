-- ============================================================
-- RUTA · CRM — MÓDULO DE PROVEEDORES / ENTIDADES SEGMENTADAS
-- Migración SQL para Supabase / PostgreSQL
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1. Agregar columna 'proveedor' en tabla soporte_servicios (cuentas de cobro)
alter table if exists soporte_servicios
  add column if not exists proveedor text default '';

create index if not exists idx_soporte_servicios_proveedor
  on soporte_servicios(proveedor);

-- 2. Agregar columna 'proveedor' en tabla soporte_registro_servicios (historial de plantillas)
alter table if exists soporte_registro_servicios
  add column if not exists proveedor text default '';

create index if not exists idx_soporte_registro_servicios_proveedor
  on soporte_registro_servicios(proveedor);

-- 3. Actualizar registros existentes que no tengan proveedor asignado
-- Por defecto se asigna 'Cencosud' a los registros de Jumbo Popayán
update soporte_servicios
set proveedor = 'Cencosud'
where (proveedor is null or proveedor = '')
  and cliente ilike '%Jumbo%';

update soporte_registro_servicios
set proveedor = 'Cencosud'
where (proveedor is null or proveedor = '')
  and cliente ilike '%Jumbo%';

-- Comentario informativo
comment on column soporte_servicios.proveedor is 'Proveedor o entidad contratante/intermediaria para segmentación de cuentas de cobro (ej. Cencosud, Grupo Aval, R&S Soluciones)';
comment on column soporte_registro_servicios.proveedor is 'Proveedor o entidad contratante para historial documental de servicios IT';
