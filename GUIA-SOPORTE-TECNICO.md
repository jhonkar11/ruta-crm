# GUÍA MAESTRA: MÓDULO INTELIGENTE DE SOPORTE TÉCNICO Y CUENTAS DE COBRO (CRM)

Este módulo corporativo de nivel mundial automatiza el ciclo de vida de los servicios de soporte en campo, desde la extracción visual por IA hasta la generación de la cuenta de cobro en Excel lista para liquidar.

---

## 1. SEGURIDAD Y CONTROL DE ACCESO (RBAC)
- **Correo Administrador Exclusivo:** `Jhonka001@gmail.com`
- **Frontend:** La pestaña "Soporte" en el `BottomNav` y el botón "Soporte IT" en el `TopBar` están completamente ocultos para cualquier otro usuario. Si se intenta forzar la ruta `soporte`, la interfaz bloquea el acceso con un aviso de seguridad de doble capa.
- **Backend / Supabase:** Políticas RLS (Row Level Security) en `soporte_servicios`, `soporte_archivos_temporales` y el bucket `soporte-temporales` para garantizar que solo las peticiones de `jhonka001@gmail.com` puedan consultar, insertar o eliminar registros.

---

## 2. INTERFAZ Y EXPERIENCIA DE USUARIO (UX/UI ENTERPRISE)
- **Caja de Texto Ampliable (`AutoResizeTextarea`):** 
  - Ajuste dinámico de altura multilínea optimizado para textos largos, bitácoras y diagnósticos técnicos sin romper el diseño.
  - Modo pantalla completa con un clic para redacciones extensas.
- **Entrada de Voz Multimodal (Micrófono & Altavoz):**
  - **Dictado por voz en tiempo real:** Integración nativa con Web Speech API (`es-CO`) mediante el hook `useDictadoVoz`.
    - **Sin texto duplicado:** sólo se procesan los bloques definitivos (`isFinal === true`), recorriendo únicamente los índices nuevos a partir de `event.resultIndex`. Los resultados intermedios se muestran como vista previa y se *reemplazan* en el siguiente evento, en vez de acumularse.
    - El texto previo escrito por el técnico se captura de forma síncrona al pulsar el botón y se usa como base, de modo que el dictado se añade sin borrar lo anterior.
    - Libera el micrófono al navegar fuera, evita motores duplicados y reinicia la escucha si el motor se corta por silencio.
  - **Altavoz (Text-to-Speech):** Lee en voz alta la plantilla corporativa generada o las notas técnicas con entonación natural.
- **Gestión Inteligente de Imágenes Temporales:**
  - Carga rápida o drag-and-drop de pantallazos de WhatsApp o fotos desde el móvil.
  - **Compresión en el cliente:** Reduce automáticamente imágenes pesadas a menos de 1MB antes del envío.
  - **Optimización de costos y almacenamiento (TTL 7 Días):** Las capturas se marcan con caducidad. Una rutina automatizada (`purgar_archivos_temporales_soporte` vía `pg_cron`) elimina las fotos pasados 7 días, evitando saturación en Supabase Storage.

---

## 3. MOTOR DE INTELIGENCIA ARTIFICIAL MULTIMODAL (GOOGLE GEMINI)

### 3.1 Arquitectura segura (la llave NUNCA llega al navegador)
- La `GEMINI_API_KEY` vive **sólo** como variable de entorno de Vercel. El navegador no la pide, no la guarda en `localStorage` y no la recibe: no está en el bundle público.
- Todo el tráfico de IA pasa por la función serverless **`/api/gemini`**, que valida la sesión, aplica RBAC, aplica el modelo permitido, construye el prompt y recién entonces llama a Google.
- `vite.config.js` monta el mismo manejador en desarrollo, así que `npm run dev` y producción se comportan idénticamente.
- `envPrefix: ["VITE_"]` garantiza que ninguna variable sin ese prefijo llegue al bundle.

### 3.2 Controles de seguridad aplicados en `/api/gemini`
| Control | Detalle |
|---|---|
| Autenticación | Exige `Authorization: Bearer <token de sesión de Supabase>`. Sin token → `401` (antes la petición pasaba sin header) |
| Verificación del token | HS256 local con `SUPABASE_JWT_SECRET` (`timingSafeEqual`, valida `exp`) o, en su defecto, consulta a `{SUPABASE_URL}/auth/v1/user` |
| RBAC | Sólo el correo de `SOPORTE_ADMIN_EMAIL` puede gastar cuota → `403` |
| Lista blanca de modelos | Sólo la cadena vigente (`gemini-3.8-flash` → `gemini-3.1-flash-lite`). Cualquier otro identificador, incluidos los retirados, se normaliza al vigente |
| Validación de entrada | Límite de 4 MB en base64, 5000 caracteres de notas, **24.000 caracteres de plantilla institucional**, MIME de imagen en lista blanca, cuerpo máximo 4.5 MB |
| Rate limiting | 30 peticiones/min por IP (configurable con `GEMINI_RATE_LIMIT`) |
| Fallo cerrado | Si falta `GEMINI_API_KEY` o la verificación de sesión → `503` con mensaje accionable, nunca acceso abierto |
| Prompt en servidor | El cliente no puede alterar el prompt ni el modelo |

### 3.3 Variables de entorno requeridas en Vercel
`GEMINI_API_KEY` · `SUPABASE_JWT_SECRET` (o `SUPABASE_URL` + `SUPABASE_ANON_KEY`) · opcional `SOPORTE_ADMIN_EMAIL`, `GEMINI_RATE_LIMIT`, `GEMINI_MODEL`

### 3.4 Extracción

La llamada se hace con `fetch` directo a la URL oficial, sin SDK, para que el endpoint sea auditable:

```
POST https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent?key={GEMINI_API_KEY}
Content-Type: application/json

{ "contents": [ { "role": "user", "parts": [ { "inlineData": { "mimeType": "image/png", "data": "<base64>" } }, { "text": "<prompt>" } ] } ],
  "generationConfig": { "temperature": 0.2, "responseMimeType": "application/json" } }
```

> **Por qué el módulo devolvía `HTTP 404`.** No era la URL: la ruta es exactamente esa. Google **retiró** los modelos `gemini-1.5-*`, `gemini-2.0-flash` y `gemini-2.5-*`, así que pedirlos responde
> `404 This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash...`.
> Verificado contra la API real: `gemini-2.0-flash` ya no aparece en `ListModels`. Por eso el identificador por defecto es **`gemini-3.8-flash`**.

> **Resiliencia.** Google devuelve `503 "This model is currently experiencing high demand"` de forma intermitente. El servidor recorre la cadena `gemini-3.8-flash → gemini-3.7-flash → gemini-3.6-flash → gemini-3.5-flash → gemini-3.1-flash-lite`, probando `v1beta` y luego `v1`, con reintento y backoff en `503`/`429`; en `404` salta al siguiente modelo. `GEMINI_MODEL` permite fijar uno sin redesplegar. Un `404` de un modelo retirado nunca llega al cliente: se traduce a `502`.

- **Paso 0: Entrada de Plantilla Institucional del Banco:**
  - Textarea independiente (hasta **24.000 caracteres**) para pegar el requerimiento o la plantilla oficial tal como la entrega la entidad (AV Villas, Popular, Almaviva, Davivienda…).
  - Acepta texto extenso de múltiples líneas con cualquier formato (viñetas, encabezados, tablas copiadas de Excel/Word). El contenido se envía **en bruto** al servidor; no se recorta en el cliente.
  - El texto pegado es una fuente de entrada válida por sí sola: no hace falta imagen para procesar.
  - Botón **"Regenerar"** en la tarjeta de la Plantilla Corporativa vuelve a mapear el texto institucional sin reprocesar la captura (útil tras editar el requerimiento del banco).
- **Paso 1: Extracción de Datos de Servicio (OCR & Parsing):**
  - Procesa visualmente la imagen, las notas dictadas y la plantilla institucional, y extrae en el bloque **"1. Datos de servicio requerido"**:
    - N° de Caso / Requerimiento (ej. `RE26014844 / RF637620` o `2303375`)
    - Fechas (Solicitud, Atención, Finalización)
    - Mesa / Soporte (ej. `Mesa IBM`, `Mesa 2`)
    - Cliente final (ej. `Banco Popular`, `Jumbo Popayán`, `Davivienda`)
    - Coordinador(a) (ej. `Oswaldo`)
    - Tarifas, Viáticos y Materiales
- **Paso 2: Generación en Tiempo Real de la "Plantilla de Solución":**
  - Redacta de forma instantánea el formato técnico corporativo para WhatsApp:
    ```
    *PLANTILLA Banco Popular RE26014844 REQUERIMIENTO /RF637620*
    SH: SOFTWARE - HARDWARE.
    Tecnico: JHON ALEXANDER
    Medio: SITIO
    Nombre del equipo: W005290ADM15 MJOG6EFA
    Falla: ACTUALIZACION SISTEMA OPERATIVO
    Causa: Equipo desactualizado...
    Solución: Se realiza asistencia soporte en sitio...
    Pruebas: usuario ingresa con sus credenciales...
    Fecha de 1 atención: 23/09/2026
    Hora inicio: 11:00 am
    Hora fin: 4:00pm
    Hora de desplazamiento: 10:00 am
    Tecnico: JHON ALEXANDER Vasquez Reveló
    ```
  - Botón rápido "Copiar Plantilla" listo para pegar en WhatsApp.
  - **Mapeo exacto desde la plantilla institucional:** el prompt del servidor obliga a leer el bloque completo de principio a fin, normaliza abreviaturas del sector (`SH/SO`, `HW/HD`, `REM`, `SIT`, `CC`) y convierte cualquier formato de fecha a `DD/MM/AAAA`. Prohíbe resumir con "varios" o puntos suspensivos cuando la información sí está en el texto.
  - El bloque `plantilla_completa` se devuelve con saltos de línea reales (texto plano) en una llamada dedicada (`accion: "plantilla"`), no incrustados en un string JSON, para evitar truncamientos y escapes en reportes extensos.
- **Paso 3: Automatización de Cuenta de Cobro:**
  - Al presionar **"3. Agregar servicio a cuenta de cobro"**, se guarda en la base de datos y se lista en la tabla oficial a partir de la fila 24.
  - Calcula automáticamente subtotales, viáticos, materiales y el valor total en números y en letras ("LA SUMA DE Setecientos Ochenta y cinco mil Pesos M/CTE").
  - Botón **"Descargar Excel Oficial (.xlsx)"** genera el archivo de **R&S Soluciones**: `Cuenta de Cobro - R&S Soluciones (N casos).xlsx` con estilos, colores verde azulado corporativo (`#135E6B`), bordes y fórmulas.
  - **Inyección masiva:** los diez campos de la plantilla oficial (N° de Caso, Fecha de solicitud, Fecha Atención, Fecha de finalización, Mesa, Cliente, Coordinador de serv., Valor servicios, Valor Viáticos, Valor Materiales) se escriben desde la fila 25. El número de filas crece con la cantidad real de casos, con un mínimo de 7 filas para conservar el aspecto del formato.
  - **Normalización previa a la exportación** (`src/utils/excelNormalizadores.js`): las monedas se limpian a número antes de aplicar el formato `"$" #,##0` (así `"$ 70.000"` y `"1.250.500"` no rompen la columna), las fechas se pasan a `DD/MM/AAAA` y los campos de texto vacíos se rellenan con `n/d` para no dejar huecos en la tabla.

---

## 4. INSTALACIÓN DE BASE DE DATOS EN SUPABASE
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra al **SQL Editor**.
3. Abre el archivo `supabase/migracion_soporte_cuentas_cobro.sql` y ejecútalo.
4. Listo: las tablas `soporte_servicios`, `soporte_archivos_temporales`, el bucket `soporte-temporales` y las políticas RLS quedarán activadas.

---

## 5. PROCESAMIENTO EN PYTHON (OPCIONAL / OFFLINE)
Si deseas generar o procesar la cuenta de cobro o correr el OCR en scripts locales de Python:
```bash
cd backend
pip install -r requirements.txt
python excel_processor.py
```
El archivo `backend/excel_processor.py` utiliza `openpyxl` y `pandas` para manipular el libro de Excel con idéntica precisión.
