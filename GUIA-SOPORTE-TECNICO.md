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
| Lista blanca de modelos | Sólo `gemini-2.0-flash`. Cualquier otro identificador se normaliza |
| Validación de entrada | Límite de 4 MB en base64, 5000 caracteres de notas, MIME de imagen en lista blanca, cuerpo máximo 4.5 MB |
| Rate limiting | 30 peticiones/min por IP (configurable con `GEMINI_RATE_LIMIT`) |
| Fallo cerrado | Si falta `GEMINI_API_KEY` o la verificación de sesión → `503` con mensaje accionable, nunca acceso abierto |
| Prompt en servidor | El cliente no puede alterar el prompt ni el modelo |

### 3.3 Variables de entorno requeridas en Vercel
`GEMINI_API_KEY` · `SUPABASE_JWT_SECRET` (o `SUPABASE_URL` + `SUPABASE_ANON_KEY`) · opcional `SOPORTE_ADMIN_EMAIL`, `GEMINI_RATE_LIMIT`

### 3.4 Extracción
Compatible con **Gemini 2.0 Flash** mediante el SDK oficial `@google/genai` (API estable `v1`):
> Nota: los modelos `gemini-1.5-flash` / `gemini-1.5-pro` fueron **retirados** por Google y devuelven `HTTP 404`. No deben referenciarse en ninguna llamada.
- **Paso 1: Extracción de Datos de Servicio (OCR & Parsing):**
  - Procesa visualmente la imagen o notas dictadas y extrae en el bloque **"1. Datos de servicio requerido"**:
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
- **Paso 3: Automatización de Cuenta de Cobro:**
  - Al presionar **"3. Agregar servicio a cuenta de cobro"**, se guarda en la base de datos y se lista en la tabla oficial a partir de la fila 24.
  - Calcula automáticamente subtotales, viáticos, materiales y el valor total en números y en letras ("LA SUMA DE Setecientos Ochenta y cinco mil Pesos M/CTE").
  - Botón **"Descargar Excel Oficial (.xlsx)"** genera el archivo exacto: `Formato de cuenta de cobro - Jhon Vasquez # 4.xlsx` con estilos, colores verde azulado corporativo (`#135E6B`), bordes y fórmulas.

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
