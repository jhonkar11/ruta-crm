import { supabase } from "./supabaseClient";

function urlBase64ToUint8Array(base64String) {
  if (!base64String) {
    throw new Error("La clave VAPID pública está vacía o no configurada.");
  }
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSoportado() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

export async function registrarServiceWorker() {
  return navigator.serviceWorker.register("/sw.js");
}

// Pide permiso de notificaciones, suscribe el dispositivo y guarda
// la suscripción en Supabase asociada al usuario (asesor) actual.
export async function activarNotificaciones(usuarioId) {
  if (!pushSoportado()) {
    console.warn("Este navegador no soporta notificaciones push.");
    return null;
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn("Aviso: Falta configurar VITE_VAPID_PUBLIC_KEY en las variables de entorno. Las notificaciones push están desactivadas temporalmente.");
    return null;
  }

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") {
    throw new Error("Permiso de notificaciones denegado.");
  }

  const registration = await registrarServiceWorker();
  await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      usuario_id: usuarioId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;

  return subscription;
}

export async function notificacionesActivas() {
  if (!pushSoportado()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}