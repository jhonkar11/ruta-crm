# Guía de migración y despliegue — RUTA·CRM v2 (con citas y alarmas)

## Qué incluye esta versión
- CRM completo de clientes (mapa, búsqueda, archivo, fotos con Supabase Storage).
- **Módulo de citas**: agendamiento, reprogramación (posponer) e historial completo por cliente.
- **Alarmas automáticas**: recordatorio 24h antes y 1h antes de cada cita.
  - Al **cliente**: mensaje de **WhatsApp** (WhatsApp Cloud API de Meta).
  - Al **asesor**: **notificación push** en su celular (la app se instala como PWA).
- Todo corre sobre Supabase (Postgres + Auth + Storage + Edge Functions + Cron).

> **Nota importante sobre el cliente final:** el cliente del banco no tiene la
> app instalada, así que su recordatorio llega por WhatsApp (canal que sí
> revisa a diario). El asesor sí usa la app, así que su recordatorio llega
> como notificación push nativa al instalarla en su celular (Add to Home
> Screen). Si prefieres SMS en vez de WhatsApp para el cliente, el mismo
> patrón de la función `enviarWhatsApp` en la Edge Function se puede
> reemplazar por Twilio SMS sin tocar el resto del sistema.

## 1. Crear el proyecto en Supabase
1. https://supabase.com → **New project**. Anota **Project URL** y **anon public key** (Settings → API).

## 2. Crear las tablas, RLS y el bucket de fotos
1. **SQL Editor → New query** → pega y ejecuta todo `supabase/schema.sql`.
   Esto crea `usuarios`, `clientes`, `visitas`, `citas`, `push_subscriptions`,
   las políticas RLS y el bucket `fotos-visitas`.
2. El bloque final del script (comentado) programa el cron cada 15 min;
   lo activarás en el paso 6, después de desplegar la función.

## 3. Crear los usuarios del equipo
1. **Authentication → Users → Add user** por cada asesor/admin (ej. `maria@turuta.com`).
2. Copia el `UUID` de cada uno y créales su perfil:
   ```sql
   insert into usuarios (id, nombre, rol, telefono) values
     ('UUID-DEL-USUARIO', 'María Restrepo', 'admin', '3001234567'),
     ('UUID-DEL-USUARIO', 'Carlos Gómez', 'asesor', '3007654321');
   ```

## 4. Configurar variables de entorno del frontend
1. Copia `.env.example` a `.env` y llena `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
2. Genera las llaves VAPID para las notificaciones push:
   ```bash
   npx web-push generate-vapid-keys
   ```
   Copia la **Public Key** en `VITE_VAPID_PUBLIC_KEY`. Guarda ambas (pública y
   privada) para el paso 6.

## 5. Instalar y correr en local
```bash
npm install
npm run dev
```
Inicia sesión con el correo/contraseña del paso 3. En el celular del asesor,
usa "Agregar a pantalla de inicio" para instalar la PWA y luego toca el
ícono de la campana en la barra superior para activar las notificaciones.

## 6. Desplegar la Edge Function de recordatorios
Requiere el [Supabase CLI](https://supabase.com/docs/guides/cli).
```bash
supabase login
supabase link --project-ref TU-PROYECTO
supabase functions deploy recordatorios-citas

# Secrets de la función (no van en el frontend, son solo del backend)
supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT="mailto:soporte@turuta.com"
supabase secrets set WHATSAPP_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=...
```
`WHATSAPP_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` salen de tu app en
[Meta for Developers](https://developers.facebook.com/) con el producto
**WhatsApp Business Platform** habilitado y un número verificado.

## 7. Activar el cron (cada 15 minutos)
En **SQL Editor**, ejecuta (reemplazando los valores reales):
```sql
select cron.schedule(
  'recordatorios-citas-cada-15-min',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://TU-PROYECTO.functions.supabase.co/recordatorios-citas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer TU_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
Puedes probar la función manualmente antes de programarla:
```bash
supabase functions invoke recordatorios-citas
```

## 8. Build y despliegue en Vercel
```bash
npm run build
```
1. Sube el proyecto a GitHub.
2. En Vercel → **Add New… → Project** → importa el repo (Vite se detecta solo:
   Build Command `npm run build`, Output Directory `dist`).
3. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY` y `VITE_VAPID_PUBLIC_KEY`.
4. **Deploy**.

## 9. Cómo funciona el ciclo completo de seguimiento
1. El asesor crea el prospecto y, si define **Próximo seguimiento**, el
   sistema agenda automáticamente una cita "Programada" (pestaña **Citas**).
2. Si necesita reprogramar, usa **Posponer / reprogramar** en la cita: la
   cita original queda como "Pospuesta" (no se borra, queda en el
   historial) y se crea una nueva "Programada" enlazada.
3. 24h y 1h antes de cada cita "Programada", la Edge Function le escribe
   por WhatsApp al cliente y envía un push al celular del asesor.
4. Al realizar la visita, el asesor la marca como **Cumplida** (o la
   gestiona desde la ficha del cliente adjuntando la foto, lo que además
   registra un renglón en `visitas`).

## 10. Seguridad (contexto bancario)
- RLS activo en las 5 tablas: sin sesión válida, no hay lectura ni escritura.
- Solo `admin` elimina clientes definitivamente; archivar es un `UPDATE`.
- Solo el asesor dueño de la cita (o un `admin`) puede editarla/cancelarla.
- Cada usuario solo puede leer/borrar sus propias suscripciones push; la
  Edge Function usa la `service_role key` (nunca expuesta al frontend) para
  leer las suscripciones de todos y enviar los recordatorios.
- El bucket de fotos es de lectura pública pero solo usuarios autenticados suben archivos.
