-- ==============================================================================
-- Migración: Tabla Independiente soporte_registro_servicios
-- Propósito: Separación documental de plantillas corporativas IT y metadatos técnicos
--            respecto a las cuentas de cobro financieras en Comercia POS.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS soporte_registro_servicios (
  id TEXT PRIMARY KEY,
  numero_caso TEXT NOT NULL,
  fecha_solicitud TEXT,
  fecha_atencion TEXT,
  fecha_finalizacion TEXT,
  mesa TEXT,
  cliente TEXT,
  coordinador TEXT,
  equipo TEXT,
  falla TEXT,
  causa TEXT,
  solucion TEXT,
  pruebas TEXT,
  horas JSONB DEFAULT '{}'::jsonb,
  plantilla_completa TEXT,
  foto_url TEXT,
  sh TEXT DEFAULT 'SOFTWARE - HARDWARE',
  tecnico TEXT DEFAULT 'Jhon Alexander Vasquez Reveló',
  medio TEXT DEFAULT 'SITIO',
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices optimizados para búsqueda rápida por caso y fecha
CREATE INDEX IF NOT EXISTS idx_soporte_reg_caso ON soporte_registro_servicios(numero_caso);
CREATE INDEX IF NOT EXISTS idx_soporte_reg_fecha ON soporte_registro_servicios(fecha_atencion);
CREATE INDEX IF NOT EXISTS idx_soporte_reg_creado ON soporte_registro_servicios(creado_en DESC);

-- Habilitar RLS
ALTER TABLE soporte_registro_servicios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total para usuarios autenticados soporte_registro_servicios"
  ON soporte_registro_servicios
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
