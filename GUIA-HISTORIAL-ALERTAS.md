# Historial de actividad + Alertas de vencimientos + Filtros por documentación

Esta ronda se construyó sobre la integración anterior del checklist de
documentos (ver `GUIA-CHECKLIST-CREDITOS.md`). Necesitas haber corrido esa
migración primero, o correr las dos migraciones nuevas juntas — el orden
entre ellas ya no importa, quedaron protegidas para funcionar en cualquier
secuencia (ver sección 1).

## 1. Supabase — un script nuevo, aditivo

**Supabase Dashboard → SQL Editor → New query**, pega y ejecuta:

```
supabase/migracion_historial_alertas.sql
```

Qué agrega:
- Tabla `novedades` (la bitácora): quién hizo qué y cuándo, por cliente.
- Columna `clientes.estado_credito_actualizado_en`, mantenida al día por un
  **trigger** en la base de datos (no por el frontend) — así queda correcta
  sin importar desde dónde se edite un cliente en el futuro.
- Nada se borra ni se modifica de lo que ya tienes.

## 2. Pilar 1 — Historial de actividad (timeline por cliente)

Nuevo botón "Historial" (ícono de reloj con flecha) en la tarjeta del
cliente — en Mapa, Todos y Buscar — junto al de "Documentos". Abre un
timeline cronológico con:

- **Registro automático** de: llamadas iniciadas, WhatsApp enviados, cambios
  de estado comercial, cambios de etapa de crédito, documentos marcados o
  desmarcados del checklist, creación del registro, y archivado.
- **Nota rápida manual**: un campo de texto arriba del timeline para anotar
  algo en el momento ("Cliente pidió llamar después de las 3pm", etc.) sin
  tener que abrir el formulario de edición completo.

No tuviste que pedir nada más: cada acción que ya hacías (llamar, escribir
por WhatsApp, guardar cambios, archivar) ahora deja rastro solo, sin pasos
extra en tu flujo de trabajo diario.

## 3. Pilar 2 — Panel de alertas y vencimientos

Nuevo banner (debajo del de "visitas para mañana" que ya tenías), en rojo,
que aparece solo cuando hay algo pendiente. Al tocarlo abre el **Centro de
alertas**, con tres secciones:

| Sección | Regla |
|---|---|
| Seguimientos retrasados | `fecha_seguimiento` ya pasó y el cliente sigue sin estar Visitado/Cumplida/Cancelado |
| Documentos estancados | `estado_credito = "Documentación Pendiente"` desde hace **3+ días** |
| En estudio sin respuesta | `estado_credito = "En Estudio"` desde hace **5+ días** |

Los umbrales (3 y 5 días) están en `src/utils/alertas.js`
(`DIAS_ALERTA_DOCUMENTOS`, `DIAS_ALERTA_ESTUDIO`) — son dos constantes al
principio del archivo, cámbialos ahí si quieres otro número de días.

Cada tarjeta de alerta tiene botones directos de llamar, WhatsApp y editar
ficha, para que puedas actuar sin salir del panel.

## 4. Pilar 3 — Filtros por estado de documentación

Dos chips nuevos en la vista **Todos**, junto a los que ya tenías:
- 🗂️ **Faltan documentos** — expediente con checklist incompleto.
- ✅ **Expediente completo** — los 4 documentos ya marcados.

Se calculan con la misma función `calcularProgresoCredito` que ya usa el
modal de documentos, así que siempre están sincronizados con lo que marcas
ahí. Esto es justo lo que pediste: puedes filtrar, por ejemplo, a todos los
que les falte documentación y planear una ruta de recolección de papeles
en un solo vistazo.

## 5. Archivos nuevos y modificados en esta ronda

**Nuevos:**
```
src/utils/alertas.js
src/services/actividadService.js
src/components/historial/HistorialClienteModal.jsx
src/components/alertas/AlertasModal.jsx
supabase/migracion_historial_alertas.sql
```

**Modificados (edición puntual, no reemplazo):**
```
src/App.jsx                              -> estados, cálculo de alertas, registro automático de novedades, chips nuevos
src/hooks/useClientes.js                 -> registrarNovedad
src/components/clientes/ClientCard.jsx   -> botón Historial + registro de llamadas/WhatsApp
src/components/clientes/MapaView.jsx     -> lo mismo en la tarjeta flotante
supabase/schema.sql                      -> documentado para instalaciones nuevas (no toca tu BD)
```

## 6. Validación realizada (y sus límites — igual que la vez pasada)

- Los 32 archivos de `src/` pasan el chequeo de sintaxis de Babel (0 errores).
- Todas las rutas de `import` resuelven a un archivo real.
- Repasé a mano cada handler nuevo para confirmar que los props que
  `App.jsx` pasa hacia abajo coinciden exactamente con lo que cada
  componente espera recibir.

Sigo sin poder correr `npm run build` en este entorno (mismo motivo que la
vez anterior: sin internet aquí, y tu `node_modules` trae binarios de
Windows). Corre `npm install && npm run build` en tu máquina antes del
push — Vercel de todas formas instala todo limpio para Linux en cada
deploy, así que esto no debería afectarte ahí.

## 7. Desplegar

Sin cambios respecto a como ya lo tenías: mismas variables de entorno,
mismo Build Command (`npm run build`) y Output Directory (`dist`) en
Vercel. Solo asegúrate de correr el script SQL de la sección 1 en Supabase
antes o después del deploy — el orden entre eso y el deploy no importa.
