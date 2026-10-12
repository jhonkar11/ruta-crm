-- ==============================================================================
-- MIGRACIÓN: CREACIÓN DE TABLA OFICIAL injected_services (Y soporte_servicios)
-- ==============================================================================

-- 1. Crear tabla oficial injected_services si no existe
create table if not exists injected_services (
  id text primary key,
  case_number text,
  request_date text,
  service_date text,
  end_date text,
  mesa text default '2',
  provider_entity text default '',
  client text default '',
  coordinator text default 'Oswaldo',
  service_value numeric default 0,
  travel_expenses numeric default 0,
  materials numeric default 0,
  status text default 'confirmed',
  template_data text default '',
  evidence_image text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices de consulta rápida
create index if not exists idx_injected_services_provider on injected_services(provider_entity);
create index if not exists idx_injected_services_created on injected_services(created_at desc);
create index if not exists idx_injected_services_case on injected_services(case_number);

-- Políticas RLS para injected_services
alter table injected_services enable row level security;

drop policy if exists "injected_services_all_anon" on injected_services;
create policy "injected_services_all_anon"
  on injected_services for all
  to anon, authenticated
  using (true)
  with check (true);

-- 2. Asegurar que soporte_servicios también exista por compatibilidad total
create table if not exists soporte_servicios (
  id text primary key,
  numero_caso text,
  fecha_solicitud text,
  fecha_atencion text,
  fecha_finalizacion text,
  mesa text default '2',
  proveedor text default '',
  cliente text default '',
  coordinador text default 'Oswaldo',
  valor_servicios numeric default 0,
  valor_viaticos numeric default 0,
  valor_materiales numeric default 0,
  sh text default 'SOFTWARE - HARDWARE',
  tecnico text default 'Jhon Alexander Vasquez Reveló',
  medio text default 'SITIO',
  equipo text default '',
  falla text default '',
  causa text default '',
  solucion text default '',
  pruebas text default '',
  horas jsonb default '{}'::jsonb,
  plantilla_completa text default '',
  foto_url text default '',
  payment_status text default 'confirmed',
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

alter table soporte_servicios enable row level security;

drop policy if exists "soporte_servicios_all_anon" on soporte_servicios;
create policy "soporte_servicios_all_anon"
  on soporte_servicios for all
  to anon, authenticated
  using (true)
  with check (true);
