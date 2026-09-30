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
  - **Dictado por voz en tiempo real:** Integración nativa con Web Speech API (`es-CO`). Dicta el reporte en el sitio y el texto se transcribirá directamente en la caja de notas.
  - **Altavoz (Text-to-Speech):** Lee en voz alta la plantilla corporativa generada o las notas técnicas con entonación natural.
- **Gestión Inteligente de Imágenes Temporales:**
  - Carga rápida o drag-and-drop de pantallazos de WhatsApp o fotos desde el móvil.
  - **Compresión en el cliente:** Reduce automáticamente imágenes pesadas a menos de 1MB antes del envío.
  - **Optimización de costos y almacenamiento (TTL 7 Días):** Las capturas se marcan con caducidad. Una rutina automatizada (`purgar_archivos_temporales_soporte` vía `pg_cron`) elimina las fotos pasados 7 días, evitando saturación en Supabase Storage.

---

## 3. MOTOR DE INTELIGENCIA ARTIFICIAL MULTIMODAL (GOOGLE GEMINI)
Compatible con **Gemini 2.5 Flash**, **Gemini 2.0 Flash** y **Gemini 1.5 Pro**:
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
