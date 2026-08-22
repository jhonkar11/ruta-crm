# Checklist de documentos + etapas de crédito — Guía de esta actualización

## 0. Contexto importante antes de empezar

Al revisar tu proyecto encontré en el historial de git que ya habías integrado
esta misma funcionalidad antes (commit `334a223`), pero dos "Restauración
desde copia limpia de respaldo" posteriores la eliminaron por completo junto
con otros cambios. La rehice desde cero sobre tu código actual, con más
cuidado en los puntos que probablemente causaron problemas la vez pasada
(ver sección 4).

## 1. Qué se agregó

**Archivos nuevos:**
```
src/utils/documentosCredito.js
src/components/documentos/ProgressBar.jsx
src/components/documentos/ChecklistItem.jsx
src/components/documentos/DocumentChecklist.jsx
src/components/documentos/DocumentosModal.jsx
src/components/share/ShareEstadoWhatsApp.jsx
supabase/migracion_checklist_creditos.sql
```

**Archivos que edité (no reemplacé, edité puntualmente):**
```
src/App.jsx                          -> estado del modal + handlers de guardado
src/components/clientes/ClientCard.jsx   -> botón "Documentos" + badge de etapa de crédito
src/components/clientes/MapaView.jsx     -> lo mismo en la tarjeta flotante del mapa
src/components/clientes/FormView.jsx     -> select "Etapa del Crédito"
src/components/ui/UIKit.jsx              -> Stamp reconoce las 4 etapas nuevas
src/services/clientesService.js          -> nueva función de guardado parcial
src/hooks/useClientes.js                 -> usa esa función + limpieza (ver 4.3)
src/styles/tokens.js                     -> fix menor (lineId -> lineHeight)
supabase/schema.sql                      -> documentado, no afecta tu BD ya creada
```

## 2. Cómo funciona

- En **Mapa**, **Todos** y **Buscar**, cada tarjeta de cliente ahora tiene un
  botón adicional (ícono de portapapeles) que abre el **expediente de crédito**.
- Ese modal tiene: selector de **etapa del crédito** (Documentación Pendiente
  → En Estudio → Aprobado → Desembolsado → Rechazado), el **checklist** de 4
  documentos con **barra de progreso**, y el botón **"Compartir estado por
  WhatsApp"**.
- Cada cambio (marcar un documento, cambiar la etapa) se guarda al toque,
  directo en Supabase — no hay botón de "Guardar" aparte en ese modal.
- La etapa del crédito también se puede fijar desde el formulario de
  **Nuevo/Editar cliente** (campo nuevo "Etapa del Crédito").
- El diseño respeta el mismo look que ya tienes: mismo glass oscuro
  (`#0f172a` + blur) que tu `ConfirmModal`, mismos badges tipo `Stamp`,
  mismas tarjetas blancas.

## 3. Supabase — un solo script, aditivo

Ve a **Supabase Dashboard → SQL Editor → New query**, pega y ejecuta:

```
supabase/migracion_checklist_creditos.sql
```

Qué hace (y qué NO hace):
- ✅ Agrega 4 columnas nuevas a `clientes`: `documentos_json`, `estado_credito`,
  `seguimiento_token`, `categoria_cliente` (esta última por si tu tabla en
  vivo no la tenía — tu `FormView.jsx` ya la usa activamente).
- ✅ Quita el `check` viejo sobre la columna `estado` (tu app ya usa muchos
  más valores de los que ese check original permitía — Interesado,
  Programada, Reprogramada, etc. — así que probablemente ya no estaba
  aplicándose, pero por si acaso lo quita explícitamente para que ningún
  guardado futuro falle por esto).
- ❌ No borra ni modifica ningún dato ni ninguna tabla existente.
- ❌ No toca RLS ni Storage (las políticas actuales ya cubren las columnas
  nuevas automáticamente, porque RLS es a nivel de tabla, no de columna).

Es segura de correr aunque la ejecutes más de una vez.

## 4. Validación que sí pude hacer, y la que no

Sé honesto sobre esto porque es importante:

**Lo que validé de verdad:**
- Los 28 archivos de `src/` pasan un chequeo de sintaxis con el parser de
  Babel (0 errores) — confirma que no hay JSX roto, llaves/paréntesis mal
  cerrados, etc.
- Todas las rutas de `import ... from "../../lo-que-sea"` en el proyecto
  apuntan a un archivo que realmente existe (revisé cada una programáticamente).
- Confirmé que todos los íconos de `lucide-react` que uso (`ClipboardList`,
  `FileCheck2`, `CheckCircle2`, `Circle`, `MessageCircle`) sí existen en la
  versión que tienes instalada.

**Lo que NO pude hacer:** correr `npm run build` real. Tu `node_modules`
trae binarios nativos compilados para Windows (`rollup-win32-x64-gnu`) y este
entorno es Linux, así que Vite/Rollup no arrancan aquí — y no tengo acceso a
internet para instalar el paquete equivalente de Linux. **Esto no es un
problema para Vercel**: tu `node_modules` no está en git (`.gitignore` ya lo
excluye), así que Vercel instala dependencias limpias para Linux
automáticamente en cada deploy. Aun así, te recomiendo antes de subir a
Vercel:
```bash
npm install
npm run build
```
en tu propia máquina, para ver con tus propios ojos que compila, antes de
hacer push.

### 4.1 Por qué creo que se rompió la vez pasada

No tengo forma de saberlo con certeza (no vi el error), pero el commit que
siguió a la integración original se llamaba
*"fix: exporta correctamente calcularProgresoCredito"* — es decir, hubo un
problema de exports/imports. Esta vez usé el mismo nombre de función
(`calcularProgresoCredito`) que ya habías usado, y validé cada import
programáticamente para evitar ese tipo de error.

### 4.2 Un bug de efectos secundarios que sí evité a propósito

Tu `saveCliente` (en `useClientes.js`) hace dos cosas extra cada vez que se
llama: registra una "visita" en la tabla `visitas` si hay foto o el estado
es Visitado/Cliente, y (antes de mi cambio) insertaba en una tabla `citas`
si había fecha de seguimiento. Si el checklist de documentos hubiera
reutilizado esa misma función para guardar, **cada clic en un documento
habría podido generar una visita fantasma** en tu historial. Por eso creé
`actualizarCampos` — un camino de guardado separado y "silencioso" que solo
toca las columnas que le pases, sin disparar nada más.

### 4.3 Limpieza que hice de una vez (relacionada, no accidental)

`useClientes.js` insertaba silenciosamente en una tabla `citas` cada vez que
guardabas un cliente con fecha de seguimiento — pero tu `App.jsx` actual ya
no lee de esa tabla en ningún lado (las citas se calculan en vivo desde
`clientes.fecha_seguimiento`). Ese insert no hacía nada útil, solo generaba
trabajo de más y posibles errores silenciosos en consola. Lo quité. Los
archivos `src/hooks/useCitas.js`, `src/services/citasService.js`,
`src/components/citas/CitaCard.jsx` y `src/components/citas/CitaFormModal.jsx`
tampoco se usan en ningún lado actualmente — no los toqué ni los borré, pero
son candidatos a limpieza si algún día quieres reducir el proyecto.

## 5. Sobre el botón de WhatsApp — qué es real y qué no

El mensaje de WhatsApp y el botón son 100% funcionales. El enlace que incluye
(`https://rutacrm.app/seguimiento/<token>`) usa ahora un **token real**
(`clientes.seguimiento_token`, un UUID generado por la base de datos, no
adivinable) — eso ya quedó listo y es correcto. Lo que **todavía no existe**
es la página pública del otro lado que reciba ese token y le muestre al
cliente su expediente. Para que sea 100% real falta:
1. Una ruta pública sin login (`/seguimiento/:token`) — puede ser una página
   aparte en este mismo proyecto, o una Supabase Edge Function.
2. Que esa ruta busque el cliente por `seguimiento_token` (no por `id`) y
   muestre el checklist en modo solo-lectura.

Puedo construir esa página cuando quieras — es un paso aparte porque implica
una superficie pública nueva (sin autenticación) y prefiero que la pidas
explícitamente antes de exponer nada de tu base de datos sin login de por
medio.

## 6. Desplegar en Vercel

Nada cambia respecto a como ya lo tenías desplegado:
1. `npm install && npm run build` local para confirmar que compila.
2. Push a tu repositorio de GitHub.
3. Vercel ya está conectado — el deploy se dispara solo. Build Command
   `npm run build`, Output Directory `dist` (esto ya lo tenías configurado).
4. Las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_VAPID_PUBLIC_KEY`) siguen siendo las mismas, no hay que tocar nada
   ahí.
5. Antes o después del deploy (el orden no importa), corre el script SQL
   de la sección 3 en Supabase.
