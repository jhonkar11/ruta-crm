import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Servicio profesional de exportación a PDF para Cuentas de Cobro en Ruta CRM.
 * 
 * Diseñado bajo estándares corporativos colombianos (Art. 383 E.T.):
 * - Renderizado nítido a 2.5x escala (equivalente a 250-300 DPI de imprenta).
 * - Estilo ultra-compacto y corporativo para maximizar legibilidad y espacio útil.
 * - Auto-ajuste prioritario a 1 PÁGINA EXACTA (evita desbordamientos y cortes innecesarios).
 * - Corte inteligente respetando límites de filas (evita cortar texto o registros a la mitad).
 * - Sanitización automática del modo oscuro (fuerza salida en papel blanco corporativo).
 * - Exclusión estricta de elementos de interfaz (botones, buscador, columna de acciones).
 * 
 * @param {HTMLElement} containerElement - Nodo DOM que contiene la cuenta de cobro oficial.
 * @param {Object} opciones - Opciones de exportación.
 * @param {string} opciones.fileName - Nombre del archivo PDF a descargar.
 * @param {string} [opciones.periodo] - Texto del periodo (ej. "Octubre + Noviembre 2026").
 * @param {string} [opciones.proveedor] - Nombre del proveedor o entidad.
 * @param {boolean} [opciones.isDark] - Indica si el CRM está en modo oscuro.
 * @returns {Promise<boolean>}
 */
export async function exportarCuentaCobroPDF(containerElement, opciones = {}) {
  if (!containerElement) {
    throw new Error("No se proporcionó el contenedor de la cuenta de cobro.");
  }

  const {
    fileName = "Cuenta_de_Cobro_Oficial.pdf",
    periodo = "",
    proveedor = ""
  } = opciones;

  // Variables para almacenar las posiciones relativas de las filas de la tabla
  let rowSplitCandidates = [];

  // 1. Capturar el contenedor mediante html2canvas con clonación aislada
  const canvas = await html2canvas(containerElement, {
    scale: 2.5, // Resolución nítida de alta densidad
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1200, // Ancho óptimo horizontal para tablas multimes
    onclone: (clonedDoc, clonedElement) => {
      // A. Eliminar botones, buscadores y columna de acciones interactivas
      const elementosOcultar = clonedElement.querySelectorAll(
        '.no-pdf, .no-print, [data-html2pdf-ignore="true"]'
      );
      elementosOcultar.forEach((el) => el.remove());

      // B. Dimensionamiento fijo y compacto para formato horizontal corporativo A4
      clonedElement.style.width = "1120px";
      clonedElement.style.maxWidth = "1120px";
      clonedElement.style.minWidth = "1120px";
      clonedElement.style.padding = "12px 16px";
      clonedElement.style.margin = "0 auto";
      clonedElement.style.background = "#ffffff";
      clonedElement.style.color = "#0f172a";
      clonedElement.style.borderRadius = "0px";
      clonedElement.style.boxShadow = "none";
      clonedElement.style.border = "none";
      clonedElement.style.boxSizing = "border-box";
      clonedElement.style.display = "flex";
      clonedElement.style.flexDirection = "column";
      clonedElement.style.gap = "8px";

      // C. Inyectar hoja de estilos de alta prioridad para forzar diseño ultra-compacto
      const styleEl = clonedDoc.createElement("style");
      styleEl.innerHTML = `
        * {
          box-shadow: none !important;
          text-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* Tarjetas con espaciado compacto */
        .pdf-section-card {
          background-color: #ffffff !important;
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          border-radius: 8px !important;
          box-shadow: none !important;
          margin-bottom: 6px !important;
          padding: 10px 14px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Cabecera oficial compacta */
        .pdf-header-title {
          font-size: 15px !important;
          margin-top: 1px !important;
          font-weight: 800 !important;
        }

        /* Cuadro de liquidación en letras */
        .pdf-settlement-box {
          background-color: #f0fdf4 !important;
          border: 1px solid #86efac !important;
          color: #0f172a !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          gap: 8px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Declaración juramentada legal Art. 383 E.T. */
        .pdf-legal-box {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
          border-radius: 6px !important;
          padding: 6px 10px !important;
          font-size: 8.5px !important;
          line-height: 1.35 !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        /* Tabla oficial de servicios */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          background-color: #ffffff !important;
          font-size: 9.5px !important;
          line-height: 1.2 !important;
        }

        thead tr {
          background-color: #135E6B !important;
          color: #ffffff !important;
        }

        thead th {
          background-color: #135E6B !important;
          color: #ffffff !important;
          border: 1px solid #0e454e !important;
          padding: 4.5px 3.5px !important;
          font-weight: 700 !important;
          text-align: center !important;
          font-size: 9.5px !important;
          line-height: 1.2 !important;
        }

        tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        tbody td {
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          padding: 3.5px 3.5px !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
          background-color: #ffffff !important;
        }

        tbody tr:nth-child(even) td {
          background-color: #f8fafc !important;
        }

        /* Filas de totales y subtotales */
        .pdf-subtotal-row td {
          background-color: #e2e8f0 !important;
          color: #0f172a !important;
          font-weight: 700 !important;
          border: 1px solid #94a3b8 !important;
          padding: 4px 3.5px !important;
          font-size: 9.5px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .pdf-total-row td {
          background-color: #cbd5e1 !important;
          color: #0f172a !important;
          font-weight: 900 !important;
          border: 1px solid #94a3b8 !important;
          padding: 5px 4px !important;
          font-size: 10px !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .pdf-total-value {
          color: #047857 !important;
          font-weight: 800 !important;
        }

        /* Línea y fuente de la firma digital */
        .pdf-signature-line {
          border-bottom: 1.5px solid #000000 !important;
          height: 28px !important;
          width: 220px !important;
          padding-bottom: 2px !important;
        }

        .pdf-signature-text {
          font-family: 'Dancing Script', cursive, serif !important;
          color: #0284c7 !important;
          font-size: 18px !important;
        }
      `;
      clonedDoc.head.appendChild(styleEl);

      // D. Sanitizar nodos internos del clon para eliminar rastros de fondos oscuros
      const todosNodos = clonedElement.querySelectorAll("*");
      todosNodos.forEach((nodo) => {
        // Quitar scroll horizontal
        if (nodo.style.overflow || nodo.style.overflowX) {
          nodo.style.overflow = "visible";
          nodo.style.overflowX = "visible";
        }

        // Si el estilo en línea tiene fondos oscuros del tema dark
        const bg = (nodo.style.background || nodo.style.backgroundColor || "").toLowerCase();
        if (
          bg.includes("rgba(15, 23, 42") ||
          bg.includes("#0f172a") ||
          bg.includes("rgba(0, 0, 0") ||
          bg.includes("rgba(0,0,0") ||
          bg.includes("rgb(15, 23, 42)") ||
          bg.includes("#1e293b")
        ) {
          nodo.style.background = "#ffffff";
          nodo.style.backgroundColor = "#ffffff";
        }

        // Si el texto en línea era blanco (por el modo oscuro), pasarlo a texto legible oscuro
        const col = (nodo.style.color || "").toLowerCase();
        if (
          col === "#ffffff" ||
          col === "#fff" ||
          col.includes("255, 255, 255") ||
          col.includes("255,255,255")
        ) {
          const estaEnEncabezadoTabla = nodo.closest("thead") || nodo.closest("th");
          if (!estaEnEncabezadoTabla) {
            nodo.style.color = "#0f172a";
          }
        }

        // Limpiar bordes semi-transparentes de modo oscuro
        const bCol = (nodo.style.borderColor || "").toLowerCase();
        if (bCol.includes("rgba(255, 255, 255") || bCol.includes("rgba(255,255,255")) {
          nodo.style.borderColor = "#cbd5e1";
        }
      });

      // E. Medir las posiciones verticales de las filas de la tabla para cortes inteligentes
      const tableRows = clonedElement.querySelectorAll("tbody tr");
      const containerTop = clonedElement.getBoundingClientRect().top;
      tableRows.forEach((tr) => {
        const rect = tr.getBoundingClientRect();
        // distancia en px desde el inicio del contenedor hasta el borde inferior de la fila
        rowSplitCandidates.push(rect.bottom - containerTop);
      });
    }
  });

  // 2. Configurar el documento jsPDF en A4 Paisaje (Landscape)
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true
  });

  const pageWidth = 297; // mm
  const pageHeight = 210; // mm
  const marginX = 8; // mm (márgenes laterales compactos)
  const marginY = 8; // mm (márgenes verticales compactos)
  const printableWidth = pageWidth - marginX * 2; // 281 mm
  const printableHeight = pageHeight - marginY * 2; // 194 mm

  const pxToMm = printableWidth / canvas.width;
  const totalHeightMm = canvas.height * pxToMm;

  // 3. Estrategia de Auto-Ajuste Prioritario a 1 Página
  // Si la altura natural es menor o igual a 265mm (~1.38x del alto imprimible),
  // escalamos proporcionalmente para que TODO el documento (cabecera, tabla, totales y firma)
  // quede UNIFICADO en 1 PÁGINA EXACTA sin cortes ni desbordamientos.
  const umbralMaximoUnaPaginaMm = 265;

  if (totalHeightMm <= umbralMaximoUnaPaginaMm) {
    // ── CASO 1: ENCAJA PERFECTAMENTE EN 1 SOLA PÁGINA CORPORATIVA ──
    const factorEscala = totalHeightMm > (printableHeight - 6) 
      ? (printableHeight - 6) / totalHeightMm 
      : 1;

    const finalWidth = printableWidth * factorEscala;
    const finalHeight = totalHeightMm * factorEscala;
    const offsetX = marginX + (printableWidth - finalWidth) / 2;
    const offsetY = marginY;

    pdf.addImage(canvas, "JPEG", offsetX, offsetY, finalWidth, finalHeight, "", "FAST");

    // Pie de página oficial
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(
      `Ruta CRM · ENTER Ltda. · Cuenta de Cobro Oficial${proveedor ? ` · ${proveedor}` : ""}${periodo ? ` · ${periodo}` : ""}`,
      marginX,
      pageHeight - 4
    );
    pdf.text("Página 1 de 1", pageWidth - marginX - 16, pageHeight - 4);
  } else {
    // ── CASO 2: DOCUMENTO EXTENSO (>20 registros) AJUSTADO A 2 PÁGINAS LIMPIAS ──
    // En lugar de cortar a ciegas en medio de una fila, usamos la posición exacta
    // de la última fila que cabe antes del corte de página.
    const alturaMaximaPagina1Mm = printableHeight - 8;
    const limiteIdealCortePx = Math.floor(alturaMaximaPagina1Mm / pxToMm);

    // Relación de escala del DOM clonado al canvas renderizado (scale: 2.5)
    const scaleFactorCanvas = canvas.height / (canvas.height / 2.5); // 2.5

    // Buscar la fila de la tabla cuyo fondo esté lo más cerca posible de limiteIdealCortePx
    let corteOptimoPx = limiteIdealCortePx;
    if (rowSplitCandidates.length > 0) {
      // Convertir posiciones relativas del DOM al canvas
      const candidatosCanvasPx = rowSplitCandidates.map((pos) => pos * (canvas.height / (totalHeightMm / pxToMm)));
      const filasQueCaben = candidatosCanvasPx.filter((pos) => pos <= limiteIdealCortePx);
      if (filasQueCaben.length > 0) {
        // Cortar exactamente en el borde inferior de la última fila que cabe completa
        corteOptimoPx = Math.floor(filasQueCaben[filasQueCaben.length - 1]);
      }
    }

    // Canvas de la Página 1
    const canvasP1 = document.createElement("canvas");
    canvasP1.width = canvas.width;
    canvasP1.height = corteOptimoPx;
    const ctx1 = canvasP1.getContext("2d");
    ctx1.fillStyle = "#ffffff";
    ctx1.fillRect(0, 0, canvasP1.width, canvasP1.height);
    ctx1.drawImage(canvas, 0, 0, canvas.width, corteOptimoPx, 0, 0, canvas.width, corteOptimoPx);

    // Canvas de la Página 2 (inicia exactamente donde terminó la fila anterior)
    const restantePx = canvas.height - corteOptimoPx;
    const canvasP2 = document.createElement("canvas");
    canvasP2.width = canvas.width;
    canvasP2.height = restantePx;
    const ctx2 = canvasP2.getContext("2d");
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, canvasP2.width, canvasP2.height);
    ctx2.drawImage(canvas, 0, corteOptimoPx, canvas.width, restantePx, 0, 0, canvas.width, restantePx);

    // Renderizar Página 1
    const p1HeightMm = corteOptimoPx * pxToMm;
    pdf.addImage(canvasP1, "JPEG", marginX, marginY, printableWidth, p1HeightMm, "", "FAST");

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Ruta CRM · ENTER Ltda. · Cuenta de Cobro Oficial${proveedor ? ` · ${proveedor}` : ""}${periodo ? ` · ${periodo}` : ""}`,
      marginX,
      pageHeight - 4
    );
    pdf.text("Página 1 de 2", pageWidth - marginX - 16, pageHeight - 4);

    // Renderizar Página 2
    pdf.addPage("a4", "landscape");
    let p2HeightMm = restantePx * pxToMm;
    let factorP2 = 1;
    if (p2HeightMm > (printableHeight - 8)) {
      factorP2 = (printableHeight - 8) / p2HeightMm;
      p2HeightMm = p2HeightMm * factorP2;
    }
    const finalWidthP2 = printableWidth * factorP2;
    const offsetXP2 = marginX + (printableWidth - finalWidthP2) / 2;

    pdf.addImage(canvasP2, "JPEG", offsetXP2, marginY, finalWidthP2, p2HeightMm, "", "FAST");

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Ruta CRM · ENTER Ltda. · Cuenta de Cobro Oficial${proveedor ? ` · ${proveedor}` : ""}${periodo ? ` · ${periodo}` : ""}`,
      marginX,
      pageHeight - 4
    );
    pdf.text("Página 2 de 2", pageWidth - marginX - 16, pageHeight - 4);
  }

  // 4. Descargar el archivo PDF en el navegador
  pdf.save(fileName);
  return true;
}
