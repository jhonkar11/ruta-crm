"""
Servicio Python de Orquestación Gemini Multimodal (gemini-3.8-flash)
Procesa capturas de pantalla de soporte (WhatsApp), notas técnicas y genera plantillas corporativas.

Equivalente en Python de `api/_lib/gemini.js`. Ambos deben mantener la misma
cadena de modelos.
"""

import os
import json
import urllib.request
import urllib.error
import base64
import time
from typing import Dict, Any, Optional

ADMIN_EMAIL = "jhonka001@gmail.com"

# Google RETIRO gemini-1.5-*, gemini-2.0-flash y gemini-2.5-*. Llamarlos devuelve
# HTTP 404 con "This model ... is no longer available", que es la causa raiz del
# 404 que reportaba el modulo. Se recorren en orden hasta obtener respuesta.
MODELOS_SOPORTADOS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
]

MODELOS_RETIRADOS = {
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
}

MODELO_POR_DEFECTO = MODELOS_SOPORTADOS[0]

BASE_URL = "https://generativelanguage.googleapis.com"
VERSION_PREFERIDA = "v1beta"
REINTENTOS_503 = 2
ESPERA_BASE_S = 0.7


def construir_url(model: str, api_version: str, api_key: str) -> str:
    """URL oficial de generateContent. Su forma incorrecta es lo que produce 404."""
    return f"{BASE_URL}/{api_version}/models/{model}:generateContent?key={api_key}"


def normalizar_modelo(model_name: Optional[str]) -> str:
    """Lista blanca estricta: evita pedir modelos retirados."""
    override = (os.getenv("GEMINI_MODEL") or "").strip()
    candidatos = ([override] if override and override not in MODELOS_RETIRADOS else []) + MODELOS_SOPORTADOS
    if model_name and model_name in candidatos:
        return model_name
    return candidatos[0]


def _error_de_google(cuerpo: str) -> str:
    try:
        return (json.loads(cuerpo).get("error") or {}).get("message", cuerpo[:200])
    except Exception:
        return cuerpo[:200]


def extraer_datos_soporte(
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    notas_dictadas: str = "",
    model_name: str = MODELO_POR_DEFECTO,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extrae los datos de servicio técnico y genera la plantilla oficial para WhatsApp y Cuenta de Cobro.
    """
    key = api_key or os.getenv("GEMINI_API_KEY")
    if not key:
        raise ValueError("No se encontro GEMINI_API_KEY en variables de entorno ni parametros.")

    modelo_inicial = normalizar_modelo(model_name)
    candidatos = [modelo_inicial] + [m for m in MODELOS_SOPORTADOS if m != modelo_inicial]

    prompt = f"""
Eres un Arquitecto de Soporte Técnico e IT empresarial de nivel mundial para mesas de ayuda (Mesa IBM, Redes, Hardware y Software).
Tu objetivo es analizar la imagen provista (captura de WhatsApp) o las notas técnicas y extraer:
- numero_caso (ej: RE26014844 / RF637620 o 2303375)
- fecha_solicitud (DD/MM/AAAA)
- fecha_atencion (DD/MM/AAAA)
- fecha_finalizacion (DD/MM/AAAA)
- mesa (ej: Mesa IBM / Mesa 2)
- cliente (ej: Banco Popular, Davivienda, Banco AV Villas, Jumbo Popayán)
- coordinador (ej: Oswaldo)
- valor_servicios (entero en COP, ej: 70000, 150000, 200000)
- valor_viaticos (entero en COP, ej: 0)
- valor_materiales (entero en COP, ej: 0)
- sh (SOFTWARE - HARDWARE, SOFTWARE o HARDWARE)
- tecnico (Jhon Alexander Vasquez Reveló)
- medio (SITIO o REMOTO)
- equipo (serial o hostname corporativo)
- falla (resumen de falla)
- causa (diagnóstico técnico)
- solucion (descripción detallada)
- pruebas (validación con usuario)
- horas ({{"inicio": "11:00 am", "fin": "4:00 pm", "desplazamiento": "10:00 am"}})
- plantilla_completa (texto oficial para WhatsApp con formato *PLANTILLA Cliente Caso* ...)

REGLAS DE VALORES POR DEFECTO (para no dejar campos vacios en la cuenta de cobro):
- fecha_solicitud / fecha_atencion / fecha_finalizacion: formato DD/MM/AAAA. Si no hay fecha explicita, usa la fecha de atencion o la fecha actual.
- coordinador: si no aparece, coloca "Oswaldo".
- valor_servicios: si no aparece, estima un valor base estandar segun complejidad (ej: 70000). NUNCA lo dejes en 0 si hay trabajo de campo.
- valor_viaticos y valor_materiales: 0 cuando no aplique.
- horas: SIEMPRE objeto con los tres campos. Si falta alguno, estima una jornada tipica de soporte (desplazamiento "10:00 am", inicio "11:00 am", fin "4:00 pm").
- sh: "SOFTWARE - HARDWARE", "SOFTWARE" o "HARDWARE".
- medio: "SITIO" o "REMOTO".
- tecnico: si no aparece, "Jhon Alexander Vasquez Reveló".

NOTAS TÉCNICAS:
{notas_dictadas}

Responde ÚNICAMENTE un JSON con esta estructura exacta sin explicaciones adicionales.
"""

    parts = []
    if image_bytes:
        parts.append(
            {
                "inlineData": {
                    "mimeType": mime_type or "image/png",
                    "data": base64.b64encode(image_bytes).decode("ascii"),
                }
            }
        )
    parts.append({"text": prompt})

    payload = json.dumps(
        {
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
    ).encode("utf-8")

    ultimo_estado, ultimo_mensaje = 502, "Sin intentos."
    for modelo in candidatos:
        for api_version in (VERSION_PREFERIDA, "v1"):
            for intento in range(1, REINTENTOS_503 + 1):
                req = urllib.request.Request(
                    construir_url(modelo, api_version, key),
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                try:
                    with urllib.request.urlopen(req, timeout=90) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                except urllib.error.HTTPError as err:
                    ultimo_estado, ultimo_mensaje = err.code, _error_de_google(err.read().decode("utf-8", "replace"))
                    if err.code == 404:
                        break  # modelo/version invalida: siguiente candidato
                    if err.code in (503, 429) and intento < REINTENTOS_503:
                        time.sleep(ESPERA_BASE_S * intento * 2)
                        continue
                    break
                except Exception as err:  # red
                    ultimo_estado, ultimo_mensaje = 502, f"Fallo de red: {err}"
                    time.sleep(ESPERA_BASE_S * intento)
                    continue

                texto = "".join(
                    p.get("text", "") for p in (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
                ).strip()
                if texto:
                    if texto.startswith("```json"):
                        texto = texto[7:]
                    if texto.endswith("```"):
                        texto = texto[:-3]
                    return json.loads(texto.strip())
                ultimo_estado, ultimo_mensaje = 502, "La API de Gemini devolvio una respuesta vacia."
                break

    raise RuntimeError(f"Gemini no respondio (ultimo {ultimo_estado}): {ultimo_mensaje}")
