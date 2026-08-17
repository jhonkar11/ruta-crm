// Edge Function: recordatorios-citas
// Se ejecuta cada 15 min (vía pg_cron, ver supabase/schema.sql).
// Revisa las citas "Programada" que caen dentro de las próximas 24h o 1h
// y, si aún no se ha enviado el recordatorio correspondiente:
//   1) envía un mensaje de WhatsApp al CLIENTE (WhatsApp Cloud API de Meta)
//   2) envía una notificación push al celular del ASESOR (Web Push / PWA)
//
// Variables de entorno requeridas (Supabase → Edge Functions → Secrets):
//   SUPABASE_URL                  (ya la inyecta Supabase automáticamente)
//   SUPABASE_SERVICE_ROLE_KEY     (ya la inyecta Supabase automáticamente)
//   WHATSAPP_TOKEN                token permanente de WhatsApp Cloud API
//   WHATSAPP_PHONE_NUMBER_ID      ID del número de WhatsApp Business
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY   generadas con `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT                 ej. "mailto:soporte@turuta.com"

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:soporte@example.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

function formatoHora(iso: string) {
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

async function enviarWhatsApp(numero: string, mensaje: string) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("WhatsApp no configurado, se omite el envío al cliente.");
    return;
  }
  const to = numero.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: `57${to}`,
      type: "text",
      text: { body: mensaje },
    }),
  });
  if (!res.ok) console.error("Error enviando WhatsApp:", await res.text());
}

async function enviarPushAsesor(asesorId: string, titulo: string, cuerpo: string) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID no configurado, se omite el push al asesor.");
    return;
  }
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("usuario_id", asesorId);

  for (const sub of subs ?? []) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title: titulo, body: cuerpo, url: "/" })
      );
    } catch (err) {
      console.error("Push fallido, se elimina suscripción caducada:", err.message);
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    }
  }
}

async function procesarVentana(horas: number, campo: "recordatorio_24h_enviado" | "recordatorio_1h_enviado") {
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + horas * 60 * 60 * 1000);

  const { data: citas, error } = await supabase
    .from("citas")
    .select(`
      id, fecha_hora, asesor_id, notas,
      cliente:cliente_id ( nombres, apellidos, whatsapp, direccion, barrio, ciudad )
    `)
    .eq("estado", "Programada")
    .eq(campo, false)
    .gte("fecha_hora", ahora.toISOString())
    .lte("fecha_hora", limite.toISOString());

  if (error) {
    console.error("Error consultando citas:", error.message);
    return 0;
  }

  for (const cita of citas ?? []) {
    const cliente = cita.cliente as any;
    const cuando = formatoHora(cita.fecha_hora);
    const direccion = [cliente?.direccion, cliente?.barrio, cliente?.ciudad].filter(Boolean).join(", ");

    if (cliente?.whatsapp) {
      const mensaje = horas === 24
        ? `Hola ${cliente.nombres}, te recordamos tu visita del asesor bancario programada para el ${cuando}${direccion ? ` en ${direccion}` : ""}. Si necesitas reprogramarla, contáctanos.`
        : `Hola ${cliente.nombres}, tu visita está programada en aproximadamente 1 hora (${cuando}). ¡Te esperamos!`;
      await enviarWhatsApp(cliente.whatsapp, mensaje);
    }

    if (cita.asesor_id) {
      const tituloAsesor = horas === 24 ? "Visita programada mañana" : "Visita en 1 hora";
      const cuerpoAsesor = `${cliente?.nombres ?? ""} ${cliente?.apellidos ?? ""} — ${cuando}${direccion ? ` · ${direccion}` : ""}`;
      await enviarPushAsesor(cita.asesor_id, tituloAsesor, cuerpoAsesor);
    }

    await supabase.from("citas").update({ [campo]: true }).eq("id", cita.id);
  }

  return citas?.length ?? 0;
}

Deno.serve(async () => {
  const enviados24h = await procesarVentana(24, "recordatorio_24h_enviado");
  const enviados1h = await procesarVentana(1, "recordatorio_1h_enviado");

  return new Response(
    JSON.stringify({ ok: true, recordatorios_24h: enviados24h, recordatorios_1h: enviados1h }),
    { headers: { "Content-Type": "application/json" } }
  );
});
