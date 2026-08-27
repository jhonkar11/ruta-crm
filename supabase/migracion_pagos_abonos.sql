-- ============================================================
-- Migración ADITIVA: condiciones del crédito activo + libro de
-- abonos/pagos con recibo de caja digital.
-- Segura de ejecutar más de una vez. No borra ni modifica nada
-- existente.
-- ============================================================

-- 1) Condiciones del crédito activo del cliente (monto, tasa, plazo,
--    sistema de amortización). El cronograma NO se guarda fila por fila:
--    se recalcula en el frontend a partir de estas condiciones con
--    utils/creditoMath.js — así nunca queda desincronizado.
alter table clientes add column if not exists credito_monto numeric;
alter table clientes add column if not exists credito_tasa_tea numeric;
alter table clientes add column if not exists credito_plazo_meses integer;
alter table clientes add column if not exists credito_sistema text;              -- 'frances' | 'aleman'
alter table clientes add column if not exists credito_seguro_mensual numeric default 0;
alter table clientes add column if not exists credito_fecha_desembolso date;

-- 2) Libro de abonos/pagos — INMUTABLE a propósito (como "novedades"):
--    si un pago se registró mal, se corrige con un movimiento nuevo,
--    nunca editando o borrando un recibo ya emitido. Esa es la base de
--    cualquier auditoría de caja seria.
create table if not exists pagos_credito (
  id uuid primary key default gen_random_uuid(),
  cliente_id text not null references clientes(id) on delete cascade,
  numero_recibo text not null,
  fecha_pago date not null default current_date,
  monto_pagado numeric not null,
  abono_capital numeric not null default 0,
  abono_interes numeric not null default 0,
  abono_seguro numeric not null default 0,
  saldo_anterior numeric,
  saldo_nuevo numeric,
  cuota_numero integer,
  asesor_id uuid references usuarios(id),
  asesor_nombre text,
  observaciones text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_pagos_cliente on pagos_credito(cliente_id, creado_en desc);

alter table pagos_credito enable row level security;

drop policy if exists "pagos_select_autenticados" on pagos_credito;
create policy "pagos_select_autenticados"
  on pagos_credito for select to authenticated using (true);

drop policy if exists "pagos_insert_autenticados" on pagos_credito;
create policy "pagos_insert_autenticados"
  on pagos_credito for insert to authenticated with check (true);

-- Sin política de update/delete: es intencional (ver comentario arriba).
