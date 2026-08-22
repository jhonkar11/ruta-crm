-- ============================================================
-- Migración ADITIVA: historial de actividad (novedades) + datos
-- necesarios para el panel de alertas de vencimientos.
-- Segura de ejecutar más de una vez. No borra ni modifica nada
-- existente.
-- ============================================================

-- 0) Salvaguarda: esta migración usa clientes.estado_credito en un trigger.
--    Si por algún motivo corres este script antes que
--    migracion_checklist_creditos.sql, esto evita que falle.
alter table clientes add column if not exists estado_credito text;

-- 1) Bitácora de novedades por cliente: llamadas, WhatsApp, notas
--    rápidas, cambios de estado, cambios de etapa de crédito, etc.
create table if not exists novedades (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null references clientes(id) on delete cascade,
  asesor_id uuid references usuarios(id),
  asesor_nombre text,
  tipo text not null default 'nota',   -- llamada | whatsapp | nota | estado | documento | credito | creacion | archivado
  descripcion text not null,
  creado_en timestamptz not null default now()
);

create index if not exists idx_novedades_cliente on novedades(cliente_id, creado_en desc);

alter table novedades enable row level security;

drop policy if exists "novedades_select_autenticados" on novedades;
create policy "novedades_select_autenticados"
  on novedades for select to authenticated using (true);

drop policy if exists "novedades_insert_autenticados" on novedades;
create policy "novedades_insert_autenticados"
  on novedades for insert to authenticated with check (true);

-- 2) Marca de tiempo de cuándo cambió por última vez la etapa del crédito.
--    La pone al día un trigger (no el frontend), así queda correcta sin
--    importar desde dónde se actualice el cliente en el futuro.
alter table clientes add column if not exists estado_credito_actualizado_en timestamptz;

create or replace function set_estado_credito_actualizado_en()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.estado_credito is not null then
      new.estado_credito_actualizado_en = now();
    end if;
  elsif new.estado_credito is distinct from old.estado_credito then
    new.estado_credito_actualizado_en = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clientes_estado_credito on clientes;
create trigger trg_clientes_estado_credito
  before insert or update on clientes
  for each row execute function set_estado_credito_actualizado_en();
