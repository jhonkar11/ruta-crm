import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Servicio profesional de exportación a PDF para Cuentas de Cobro en Ruta CRM.
 * 
 * Diseñado bajo estándares corporativos colombianos (Art. 383 E.T.):
 * - Renderizado nítido a 2.5x escala (equivalente a 250-300 DPI de imprenta).
 * - Sanitización automática del modo oscuro (fuerza salida en papel blanco corporativo).
 * - Exclusión de elementos de interfaz (botones, buscadores, columna de acciones).
 * - Ajuste inteligente a 1 o 2 páginas exactas sin desbordamientos ni saltos en blanco.
 * 
 * @param {HTMLElement} containerElement - Nodo DOM que contiene la cuenta de cobro oficial.
 * @param {Object} opciones - Opciones de exportación.
 * @param {string} opciones.fileName - Nombre del archivo PDF a descargar.
 * @param {string} [opciones.periodo] - Texto del periodo (ej. "Septiembre 2026").
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

  // 1. Capturar el contenedor mediante html2canvas con clonación aislada
  const canvas = await html2canvas(containerElement, {
    scale: 2.5, // Resolución nítida de alta densidad
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 1240, // Ancho óptimo horizontal para tablas multimes
    onclone: (clonedDoc, clonedElement) => {
      // A. Eliminar botones, buscadores y columna de acciones interactivas
      const elementosOcultar = clonedElement.querySelectorAll(
        '.no-pdf, .no-print, [data-html2pdf-ignore="true"]'
      );
      elementosOcultar.forEach((el) => el.remove());

      // B. Dimensionamiento fijo para formato horizontal corporativo A4
      clonedElement.style.width = "1180px";
      clonedElement.style.maxWidth = "1180px";
      clonedElement.style.minWidth = "1180px";
      clonedElement.style.padding = "24px";
      clonedElement.style.margin = "0 auto";
      clonedElement.style.background = "#ffffff";
      clonedElement.style.color = "#0f172a";
      clonedElement.style.borderRadius = "0px";
      clonedElement.style.boxShadow = "none";
      clonedElement.style.border = "none";
      clonedElement.style.boxSizing = "border-box";

      // C. Inyectar hoja de estilos de alta prioridad para forzar diseño corporativo
      const styleEl = clonedDoc.createElement("style");
      styleEl.innerHTML = `
        * {
          box-shadow: none !important;
          text-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }

        /* Tarjetas con borde sutil corporativo */
        .pdf-section-card {
          background-color: #ffffff !important;
          border: 1.5px solid #cbd5e1 !important;
          color: #0f172a !important;
          border-radius: 12px !important;
          box-shadow: none !important;
          margin-bottom: 16px !important;
        }

        /* Cuadro de liquidación en letras */
        .pdf-settlement-box {
          background-color: #f0fdf4 !important;
          border: 1.5px solid #86efac !important;
          color: #0f172a !important;
        }

        /* Declaración juramentada legal Art. 383 E.T. */
        .pdf-legal-box {
          background-color: #f8fafc !important;
          border: 1px solid #cbd5e1 !important;
          color: #334155 !important;
        }

        /* Tabla oficial de servicios */
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          background-color: #ffffff !important;
          font-size: 11px !important;
        }

        thead tr {
          background-color: #135E6B !important;
          color: #ffffff !important;
        }

        thead th {
          background-color: #135E6B !important;
          color: #ffffff !important;
          border: 1px solid #0e454e !important;
          padding: 7px 5px !important;
          font-weight: 700 !important;
          text-align: center !important;
        }

        tbody td {
          border: 1px solid #cbd5e1 !important;
          color: #0f172a !important;
          padding: 6px 5px !important;
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
        }

        .pdf-total-row td {
          background-color: #cbd5e1 !important;
          color: #0f172a !important;
          font-weight: 900 !important;
          border: 1px solid #94a3b8 !important;
        }

        .pdf-total-value {
          color: #047857 !important;
          font-weight: 800 !important;
        }

        /* Línea y fuente de la firma digital */
        .pdf-signature-line {
          border-bottom: 1.5px solid #000000 !important;
        }

        .pdf-signature-text {
          font-family: 'Dancing Script', cursive, serif !important;
          color: #0284c7 !important;
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
        // excepto si está dentro del encabezado azul oscuro (#135E6B) de la tabla
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
  const marginX = 10; // mm
  const marginY = 10; // mm
  const printableWidth = pageWidth - marginX * 2; // 277 mm
  const printableHeight = pageHeight - marginY * 2; // 190 mm

  const pxToMm = printableWidth / canvas.width;
  const totalHeightMm = canvas.height * pxToMm;

  // 3. Ajuste inteligente a 1 o 2 páginas exactas sin desbordamiento
  // Si la altura está cerca de una página (hasta un 15% más), se escala suavemente para caber en 1 página exacta
  const umbralUnaPagina = printableHeight * 1.15; // ~218 mm

  if (totalHeightMm <= umbralUnaPagina) {
    // ── CASO A: CABE PERFECTAMENTE EN 1 PÁGINA ──
    const factorEscala = totalHeightMm > printableHeight ? (printableHeight - 8) / totalHeightMm : 1;
    const finalWidth = printableWidth * factorEscala;
    const finalHeight = totalHeightMm * factorEscala;
    const offsetX = marginX + (printableWidth - finalWidth) / 2;
    const offsetY = marginY;

    pdf.addImage(canvas, "JPEG", offsetX, offsetY, finalWidth, finalHeight, "", "FAST");

    // Pie de página institucional oficial
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(
      `Ruta CRM · ENTER Ltda. · Cuenta de Cobro Oficial${proveedor ? ` · ${proveedor}` : ""}${periodo ? ` · ${periodo}` : ""}`,
      marginX,
      pageHeight - 5
    );
    pdf.text("Página 1 de 1", pageWidth - marginX - 16, pageHeight - 5);
  } else {
    // ── CASO B: MULTI-PÁGINA (AJUSTADO A 2 PÁGINAS EXACTAS) ──
    const alturaPagina1Mm = printableHeight - 8; // Reserva para el pie de página
    const cortePx = Math.floor(alturaPagina1Mm / pxToMm);

    // Canvas de la Página 1
    const canvasP1 = document.createElement("canvas");
    canvasP1.width = canvas.width;
    canvasP1.height = cortePx;
    const ctx1 = canvasP1.getContext("2d");
    ctx1.fillStyle = "#ffffff";
    ctx1.fillRect(0, 0, canvasP1.width, canvasP1.height);
    ctx1.drawImage(canvas, 0, 0, canvas.width, cortePx, 0, 0, canvas.width, cortePx);

    // Canvas de la Página 2
    const restantePx = canvas.height - cortePx;
    const canvasP2 = document.createElement("canvas");
    canvasP2.width = canvas.width;
    canvasP2.height = restantePx;
    const ctx2 = canvasP2.getContext("2d");
    ctx2.fillStyle = "#ffffff";
    ctx2.fillRect(0, 0, canvasP2.width, canvasP2.height);
    ctx2.drawImage(canvas, 0, cortePx, canvas.width, restantePx, 0, 0, canvas.width, restantePx);

    // Renderizar Página 1
    const p1HeightMm = cortePx * pxToMm;
    pdf.addImage(canvasP1, "JPEG", marginX, marginY, printableWidth, p1HeightMm, "", "FAST");

    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Ruta CRM · ENTER Ltda. · Cuenta de Cobro Oficial${proveedor ? ` · ${proveedor}` : ""}${periodo ? ` · ${periodo}` : ""}`,
      marginX,
      pageHeight - 5
    );
    pdf.text("Página 1 de 2", pageWidth - marginX - 16, pageHeight - 5);

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
      pageHeight - 5
    );
    pdf.text("Página 2 de 2", pageWidth - marginX - 16, pageHeight - 5);
  }

  // 4. Descargar el archivo PDF en el navegador
  pdf.save(fileName);
  return true;
}
