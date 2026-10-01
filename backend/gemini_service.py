"""
Servicio Python de Orquestación Gemini Multimodal (gemini-2.0-flash)
Procesa capturas de pantalla de soporte (WhatsApp), notas técnicas y genera plantillas corporativas.
"""

import os
import json
from typing import Dict, Any, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:  # pragma: no cover
    genai = None
    types = None

ADMIN_EMAIL = "jhonka001@gmail.com"

# Modelos retirados por Google (gemini-1.5-* y gemini-2.5-flash) devuelven HTTP 404.
MODELOS_SOPORTADOS = [
    "gemini-2.0-flash",
]

MODELO_POR_DEFECTO = "gemini-2.0-flash"

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
    key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not key:
        raise ValueError("No se encontró GEMINI_API_KEY en variables de entorno ni parámetros.")

    if genai is None:
        raise ImportError(
            "Falta el SDK de Google. Instálalo con: pip install -q google-genai"
        )

    # Lista blanca estricta: evita requesting modelos retirados (404).
    if model_name not in MODELOS_SOPORTADOS:
        model_name = MODELO_POR_DEFECTO

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

NOTAS TÉCNICAS:
{notas_dictadas}

Responde ÚNICAMENTE un JSON con esta estructura exacta sin explicaciones adicionales.
"""

    client = genai.Client(api_key=key)

    if image_bytes:
        contents = [
            types.Content(
                role="user",
                parts=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    types.Part.from_text(text=prompt),
                ],
            )
        ]
    else:
        contents = [
            types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
        ]

    response = client.models.generate_content(model=model_name, contents=contents)
    texto = (response.text or "").strip()
    if texto.startswith("```json"):
        texto = texto[7:]
    if texto.endswith("```"):
        texto = texto[:-3]

    return json.loads(texto.strip())
