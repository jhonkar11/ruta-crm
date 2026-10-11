-- ==============================================================================
-- Migración: Tabla shared_audits (Snapshots Compartidos de Auditoría)
-- Propósito: Garantizar coincidencia 100% inmutable entre el CRM y la vista pública
--            compartida mediante token único y arreglo de service_ids exactos.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS shared_audits (
  token TEXT PRIMARY KEY,
  provider_entity TEXT NOT NULL,
  month TEXT,
  year TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  service_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  services_snapshot JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices optimizados
CREATE INDEX IF NOT EXISTS idx_shared_audits_provider ON shared_audits(provider_entity);
CREATE INDEX IF NOT EXISTS idx_shared_audits_created ON shared_audits(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE shared_audits ENABLE ROW LEVEL SECURITY;

-- Política de lectura: Acceso público (anon y authenticated) por token
DROP POLICY IF EXISTS "shared_audits_select_public" ON shared_audits;
CREATE POLICY "shared_audits_select_public"
  ON shared_audits
  FOR SELECT
  TO public
  USING (true);

-- Política de inserción/actualización: Acceso para usuarios autenticados
DROP POLICY IF EXISTS "shared_audits_insert_auth" ON shared_audits;
CREATE POLICY "shared_audits_insert_auth"
  ON shared_audits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "shared_audits_update_auth" ON shared_audits;
CREATE POLICY "shared_audits_update_auth"
  ON shared_audits
  FOR UPDATE
  TO authenticated
  USING (true);
