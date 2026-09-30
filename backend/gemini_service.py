"""
Servicio Python de Orquestación Gemini Multimodal (2.5 Flash, 2.0 Flash, 1.0 Pro)
Procesa capturas de pantalla de soporte (WhatsApp), notas técnicas y genera plantillas corporativas.
"""

import os
import json
from typing import Dict, Any, Optional

try:
    from google import genai
    from google.genai import types
except ImportError:
    import google.generativeai as genai

ADMIN_EMAIL = "jhonka001@gmail.com"

MODELOS_SOPORTADOS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]

def extraer_datos_soporte(
    image_bytes: Optional[bytes] = None,
    mime_type: str = "image/png",
    notas_dictadas: str = "",
    model_name: str = "gemini-2.0-flash",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Extrae los datos de servicio técnico y genera la plantilla oficial para WhatsApp y Cuenta de Cobro.
    """
    key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("VITE_GEMINI_API_KEY")
    if not key:
        raise ValueError("No se encontró GEMINI_API_KEY en variables de entorno ni parámetros.")

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

    genai.configure(api_key=key)
    model = genai.GenerativeModel(model_name)

    contents = []
    if image_bytes:
        contents.append({
            "mime_type": mime_type,
            "data": image_bytes
        })
    contents.append(prompt)

    response = model.generate_content(contents)
    texto = response.text.strip()
    if texto.startswith("```json"):
        texto = texto[7:]
    if texto.endswith("```"):
        texto = texto[:-3]

    return json.loads(texto.strip())
