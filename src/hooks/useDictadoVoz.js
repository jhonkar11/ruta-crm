import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook de dictado por voz sobre la Web Speech API nativa (WebkitSpeechRecognition).
 *
 * Corrige la duplicación/repetición infinita de palabras delcallback anterior:
 *
 *  1. `event.results` es ACUMULATIVO y se re-emite completo en cada evento. Recorrerlo
 *     entero en cada `onresult` concatenaba una y otra vez los mismos bloques
 *     (finales + hipótesis intermedias), multiplicando el texto en el textarea.
 *  2. Se procesa ÚNICAMENTE lo definitivo (`isFinal === true`). Cada resultado final
 *     se incorpora al acumulado exactamente una vez, saltando los índices ya
 *     consumidos con `event.resultIndex`.
 *  3. Los resultados intermedios (interim) NUNCA se acumulan: se muestran como
 *     "vista previa" y se reemplazan en el siguiente evento por la hipótesis
 *     corregida por el motor. Sólo se vuelcan al acumulado al volverse finales.
 */

function obtenerConstructor() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function normalizar(texto) {
  return (texto || "").replace(/\s+/g, " ").trim();
}

function componer(base, final, interim) {
  const partes = [normalizar(base), normalizar(final), normalizar(interim)].filter(Boolean);
  return partes.join(" ").replace(/\s{2,}/g, " ").trimStart();
}

export function useDictadoVoz({ lang = "es-CO", onTexto, onError } = {}) {
  const [isDictando, setIsDictando] = useState(false);
  const [soportado, setSoportado] = useState(() => !!obtenerConstructor());

  const recognitionRef = useRef(null);
  const baseRef = useRef("");
  const finalRef = useRef("");
  const consumerRef = useRef({ onTexto, onError });
  const debeContinuarRef = useRef(false);

  // Mantiene los callbacks actualizados sin recrear el motor de reconocimiento.
  useEffect(() => {
    consumerRef.current = { onTexto, onError };
  }, [onTexto, onError]);

  const detener = useCallback(() => {
    debeContinuarRef.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onend = null;
        recognition.stop();
      } catch {
        /* ya detenido */
      }
    }
    recognitionRef.current = null;
    finalRef.current = "";
    setIsDictando(false);
  }, []);

  const iniciar = useCallback((getTextoActual) => {
    const SpeechRecognition = obtenerConstructor();
    if (!SpeechRecognition) {
      setSoportado(false);
      consumerRef.current.onError?.(
        "Este navegador no soporta el dictado por voz. Usa Google Chrome o Microsoft Edge."
      );
      return;
    }

    // Nunca dejes dos motores vivos a la vez: start() sobre uno ya iniciado
    // lanza InvalidStateError y el botón deja de responder.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* noop */
      }
      recognitionRef.current = null;
    }

    // La base se captura de forma SINCRÓNICA al pulsar el botón (no dentro de
    // onstart), de lo contrario el primer bloque definitivo pisaba lo ya escrito.
    const baseActual = typeof getTextoActual === "function" ? getTextoActual() || "" : "";
    baseRef.current = baseActual;
    finalRef.current = "";

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      debeContinuarRef.current = true;
      setIsDictando(true);
      consumerRef.current.onTexto?.(componer(baseRef.current, finalRef.current, ""));
    };

    recognition.onresult = (event) => {
      let nuevosFinales = "";
      let interim = "";

      // Sólo se recorren los bloques NUEVOS (resultIndex en adelante).
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const resultado = event.results[i];
        const transcripcion = resultado?.[0]?.transcript || "";
        if (resultado.isFinal) {
          nuevosFinales += transcripcion;
        } else {
          interim += transcripcion;
        }
      }

      // Los finales se consumen UNA sola vez y se fijan en el acumulado.
      if (normalizar(nuevosFinales)) {
        finalRef.current = normalizar(`${finalRef.current} ${nuevosFinales}`);
        interim = "";
      }

      consumerRef.current.onTexto?.(componer(baseRef.current, finalRef.current, interim));
    };

    recognition.onerror = (event) => {
      debeContinuarRef.current = false;
      setIsDictando(false);
      if (event?.error && event.error !== "aborted" && event.error !== "no-speech") {
        const mensaje =
          event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Permiso de micrófono denegado. Habilítalo en el candado de la barra de direcciones."
            : `Error de dictado por voz: ${event.error}`;
        consumerRef.current.onError?.(mensaje);
      }
    };

    recognition.onend = () => {
      // Con continuous=true el motor se corta solo tras un silencio. Si el usuario
      // sigue en modo dictado, se reinicia para que no se corte a media frase.
      if (debeContinuarRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          debeContinuarRef.current = false;
        }
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      finalRef.current = "";
      setIsDictando(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsDictando(true);
    } catch (err) {
      recognitionRef.current = null;
      debeContinuarRef.current = false;
      setIsDictando(false);
      consumerRef.current.onError?.(`No se pudo iniciar el micrófono: ${err?.message || err}`);
    }
  }, [lang]);

  const toggle = useCallback(
    (getTextoActual) => {
      if (isDictando) detener();
      else iniciar(getTextoActual);
    },
    [isDictando, iniciar, detener]
  );

  // Libera el micrófono si el usuario navega fuera mientras dicta.
  useEffect(() => {
    return () => {
      debeContinuarRef.current = false;
      const recognition = recognitionRef.current;
      if (recognition) {
        try {
          recognition.onend = null;
          recognition.abort();
        } catch {
          /* noop */
        }
      }
      recognitionRef.current = null;
    };
  }, []);

  return { isDictando, soportado, iniciar, detener, toggle };
}

export default useDictadoVoz;