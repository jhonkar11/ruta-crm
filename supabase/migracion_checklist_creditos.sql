-- ============================================================
-- Migración ADITIVA: checklist de documentos + etapas de crédito
-- ============================================================
-- Segura de ejecutar aunque ya la hayas corrido antes (todo usa
-- IF NOT EXISTS). NO borra ni modifica ningún dato existente,
-- solo agrega columnas nuevas a la tabla "clientes" que ya tienes.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1) Checklist de documentos del expediente de crédito.
--    Se guarda como { "cedula_150": true, "extractos_3m": false, ... }
alter table clientes add column if not exists documentos_json jsonb not null default '{}'::jsonb;

-- 2) Etapa del crédito: Documentación Pendiente / En Estudio / Aprobado /
--    Desembolsado / Rechazado. Es un campo de texto libre a propósito
--    (igual que "estado" y "categoria_cliente" en tu tabla actual), para
--    que puedas agregar nuevas etapas desde el código sin tener que volver
--    a tocar la base de datos cada vez.
alter table clientes add column if not exists estado_credito text;

-- 3) Token único para el enlace de "transparencia" que se comparte por
--    WhatsApp. Es un UUID real generado por la base de datos (no un id
--    adivinable), listo para respaldar una página pública de seguimiento
--    el día que decidas construirla (ver GUIA-CHECKLIST-CREDITOS.md).
alter table clientes add column if not exists seguimiento_token uuid not null default gen_random_uuid();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clientes_seguimiento_token_key'
  ) then
    alter table clientes add constraint clientes_seguimiento_token_key unique (seguimiento_token);
  end if;
end $$;

-- 4) Tu FormView.jsx ya guarda "categoria_cliente" activamente — se asegura
--    que la columna exista (no pasa nada si ya estaba creada).
alter table clientes add column if not exists categoria_cliente text;

-- 5) El "estado" de tus clientes hoy usa muchos más valores de los que
--    declaraba el check original de la instalación base (Interesado,
--    Preoferta, Programada, Reprogramada, No localizado, etc.). Si ese
--    check sigue activo en tu proyecto, bloquearía cualquier guardado que
--    use un valor nuevo — se quita para que el formulario nunca falle por
--    esto. No afecta datos ya guardados.
alter table clientes drop constraint if exists clientes_estado_check;

-- Nada más que hacer: RLS ya está activo a nivel de tabla (no de columna),
-- así que las políticas que ya tienes cubren estas columnas nuevas
-- automáticamente. No hace falta tocar RLS ni Storage.
