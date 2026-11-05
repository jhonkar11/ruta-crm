import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { numeroALetras } from "../utils/numeroALetras";

/**
 * Formatea valores numéricos a formato COP formal ($ 1.030.000 o $ -)
 */
function formatCOP(valor) {
  const num = Number(valor);
  if (!num || isNaN(num) || num === 0) return "$ -";
  return "$ " + Math.round(num).toLocaleString("es-CO");
}

function formatCOPTotal(valor) {
  const num = Number(valor);
  if (isNaN(num)) return "$ 0";
  return "$ " + Math.round(num).toLocaleString("es-CO");
}

/**
 * Construye en el DOM la plantilla corporativa oficial idéntica al formato contable
 * clásico de R&S SOLUCIONES / ENTER Ltda. (según imagen de referencia contable).
 */
export function construirPlantillaCuentaCobroCorporativa({
  servicios = [],
  metadata = {},
  numeroCuenta = null
}) {
  const hoy = new Date();
  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const dia = String(hoy.getDate()).padStart(2, "0");
  const mesNombre = mesesNombres[hoy.getMonth()];
  const anio = hoy.getFullYear();

  const fechaLarga = metadata.fechaLarga || `${dia} de ${mesNombre} de ${anio}`;
  const fechaCorta = metadata.fechaCorta || `${dia}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${anio}`;
  const numCobro = numeroCuenta || metadata.numeroCuenta || (hoy.getMonth() + 1);

  // Normalizar registros
  const registros = servicios.map((s) => ({
    numero_caso: s.numero_caso || s.caso || "-",
    fecha_solicitud: s.fecha_solicitud || s.solicitud || "-",
    fecha_atencion: s.fecha_atencion || s.atencion || "-",
    fecha_finalizacion: s.fecha_finalizacion || s.fecha_fin || s.fin || "-",
    mesa: s.mesa || "-",
    cliente: s.cliente || "-",
    coordinador: s.coordinador || "-",
    valor_servicios: Number(s.valor_servicios || s.valor_servicio || s.total || 0),
    valor_viaticos: Number(s.valor_viaticos || 0),
    valor_materiales: Number(s.valor_materiales || 0)
  }));

  // Totales
  const totalServicios = registros.reduce((acc, s) => acc + s.valor_servicios, 0);
  const totalViaticos = registros.reduce((acc, s) => acc + s.valor_viaticos, 0);
  const totalMateriales = registros.reduce((acc, s) => acc + s.valor_materiales, 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;
  const textoEnLetras = numeroALetras(granTotal);
  const totalFormateado = Math.round(granTotal).toLocaleString("es-CO");

  // Rellenar con filas vacías si son menos de 11 para mantener la proporción contable exacta
  const filasTotales = Math.max(registros.length, 11);
  const filasParaRenderizar = [];
  for (let i = 0; i < filasTotales; i++) {
    filasParaRenderizar.push(registros[i] || null);
  }

  // Contenedor principal
  const container = document.createElement("div");
  container.id = "plantilla-cuenta-cobro-corporativa-export";
  container.style.cssText = `
    width: 1060px;
    background: #ffffff;
    color: #000000;
    font-family: Arial, Helvetica, sans-serif;
    padding: 16px 20px;
    box-sizing: border-box;
    margin: 0 auto;
    position: relative;
  `;

  container.innerHTML = `
    <!-- 1. ENCABEZADO SUPERIOR CORPORATIVO (R&S SOLUCIONES / CUENTA DE COBRO / VERSIÓN) -->
    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 2px;">
      <tr>
        <td style="width: 28%; border: 1.5px solid #000000; text-align: center; vertical-align: middle; padding: 6px; font-weight: 900; font-size: 15px; color: #135E6B; line-height: 1.15;">
          R&amp;S<br/>SOLUCIONES
        </td>
        <td style="width: 44%; border: 1.5px solid #000000; text-align: center; vertical-align: middle; background-color: #E9F2F7; font-weight: 800; font-size: 16px; color: #0F2B48; letter-spacing: 0.6px;">
          CUENTA DE COBRO
        </td>
        <td style="width: 28%; border: 1.5px solid #000000; padding: 0; vertical-align: middle;">
          <div style="border-bottom: 1px solid #000000; background-color: #DCE6F1; text-align: center; font-weight: 700; font-size: 9px; padding: 3px;">
            Versión: 04
          </div>
          <div style="background-color: #DCE6F1; text-align: center; font-weight: 700; font-size: 8px; padding: 3px;">
            Fecha: ${fechaLarga}
          </div>
        </td>
      </tr>
    </table>

    <!-- 2. BARRA CIUDAD Y FECHA -->
    <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; margin-bottom: 4px;">
      <tr>
        <td style="width: 14%; background-color: #0A192F; color: #ffffff; font-weight: 700; font-size: 9px; text-align: center; padding: 2.5px; border: 1px solid #000000;">
          Ciudad:
        </td>
        <td style="width: 36%; background-color: #ffffff; color: #000000; font-weight: 700; font-size: 9px; text-align: center; padding: 2.5px; border: 1px solid #000000;">
          Popayán
        </td>
        <td style="width: 14%; background-color: #0A192F; color: #ffffff; font-weight: 700; font-size: 9px; text-align: center; padding: 2.5px; border: 1px solid #000000;">
          Fecha:
        </td>
        <td style="width: 36%; background-color: #ffffff; color: #000000; font-weight: 700; font-size: 9px; text-align: center; padding: 2.5px; border: 1px solid #000000;">
          ${fechaCorta}
        </td>
      </tr>
    </table>

    <!-- 3. NÚMERO DE CUENTA DE COBRO (ALINEADO A LA DERECHA) -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
      <table style="border-collapse: collapse; border: 1.5px solid #000000; width: 330px;">
        <tr>
          <td style="background-color: #0A192F; color: #ffffff; font-weight: 700; font-size: 8.5px; text-align: center; padding: 2.5px 6px; border: 1px solid #000000; width: 68%;">
            Numero de cuenta de cobro:
          </td>
          <td style="background-color: #ffffff; color: #000000; font-weight: 800; font-size: 9.5px; text-align: center; padding: 2.5px; border: 1px solid #000000; width: 32%;">
            ${numCobro}
          </td>
        </tr>
      </table>
    </div>

    <!-- 4. BLOQUE CENTRAL DE LA EMPRESA Y BENEFICIARIO -->
    <div style="text-align: center; margin-bottom: 10px; font-family: Arial, Helvetica, sans-serif;">
      <div style="font-size: 11.5px; font-weight: 800; color: #000000; line-height: 1.2;">
        R&amp;S SOLUCIONES S.A.S.
      </div>
      <div style="font-size: 9px; font-weight: 700; color: #333333; margin-bottom: 6px;">
        NIT: 900.291.287-9
      </div>

      <div style="font-size: 10px; font-weight: 800; color: #000000; margin-bottom: 1px;">
        DEBE A: Jhon Alexander Vasquez Reveló
      </div>
      <div style="font-size: 9.5px; font-weight: 700; color: #000000; margin-bottom: 6px;">
        C.C. 10308105
      </div>

      <div style="font-size: 9px; font-weight: 700; color: #000000; margin-bottom: 1px;">
        LA SUMA DE (${textoEnLetras}):
      </div>
      <div style="font-size: 9px; font-weight: 700; color: #000000; margin-bottom: 6px;">
        SON (${totalFormateado}):
      </div>

      <div style="font-size: 9px; font-weight: 800; color: #000000; letter-spacing: 0.2px;">
        POR CONCEPTO DE : PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO.
      </div>
    </div>

    <!-- 5. TABLA FORMAL DE 10 COLUMNAS (EXACTA AL FORMATO CONTABLE) -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000000; margin-bottom: 0px;">
      <thead>
        <tr style="background-color: #135E6B; color: #ffffff;">
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 10%; text-align: center;">N° de Caso</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 9%; text-align: center;">Fecha de solicitud</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 9%; text-align: center;">Fecha Atencion</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 9%; text-align: center;">Fecha de finalización</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 6.5%; text-align: center;">Mesa</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 12.5%; text-align: center;">Cliente</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 12%; text-align: center;">Coordinador de serv.</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 11%; text-align: center;">Valor servicios</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 10%; text-align: center;">Valor Viaticos</th>
          <th style="border: 1px solid #000000; padding: 4px 2px; font-size: 8.5px; font-weight: 700; width: 10%; text-align: center;">Valor Materiales</th>
        </tr>
      </thead>
      <tbody>
        ${filasParaRenderizar.map((item) => {
          if (item) {
            return `
              <tr style="height: 18px;">
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center; font-weight: 600;">${item.numero_caso}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.fecha_solicitud}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.fecha_atencion}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.fecha_finalizacion}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.mesa}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.cliente}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">${item.coordinador}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right; font-weight: 600;">${formatCOP(item.valor_servicios)}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right;">${formatCOP(item.valor_viaticos)}</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right;">${formatCOP(item.valor_materiales)}</td>
              </tr>
            `;
          } else {
            return `
              <tr style="height: 18px;">
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 3px; font-size: 8px; text-align: center;">&nbsp;</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right;">$ -</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right;">$ -</td>
                <td style="border: 1px solid #000000; padding: 2.5px 4px; font-size: 8px; text-align: right;">$ -</td>
              </tr>
            `;
          }
        }).join("")}

        <!-- FILA DE SUBTOTALES -->
        <tr style="height: 20px;">
          <td colspan="4" style="border: 1px solid #000000; padding: 3px; text-align: center; font-size: 8px; font-style: italic; color: #555555;">
            Firma Digital Registrada
          </td>
          <td style="border: 1px solid #000000; padding: 3px 2px; text-align: center; font-size: 7.5px; font-weight: 700;">
            Acordados En servicio
          </td>
          <td style="border: 1px solid #000000; padding: 3px 2px; text-align: center; font-size: 7.5px; font-weight: 700;">
            Grupo Ava Viáticos
          </td>
          <td style="border: 1px solid #000000; padding: 3px 2px; text-align: center; font-size: 7.5px; font-weight: 700;">
            Materiales
          </td>
          <td style="border: 1px solid #000000; padding: 3px 4px; text-align: right; font-size: 8.5px; font-weight: 700;">
            ${formatCOPTotal(totalServicios)}
          </td>
          <td style="border: 1px solid #000000; padding: 3px 4px; text-align: right; font-size: 8.5px; font-weight: 700;">
            ${totalViaticos ? formatCOPTotal(totalViaticos) : "$ 0"}
          </td>
          <td style="border: 1px solid #000000; padding: 3px 4px; text-align: right; font-size: 8.5px; font-weight: 700;">
            ${totalMateriales ? formatCOPTotal(totalMateriales) : "$ 0"}
          </td>
        </tr>

        <!-- FILA DE TOTAL GENERAL -->
        <tr style="height: 22px;">
          <td colspan="7" style="border: 1px solid #000000; padding: 3px 8px; text-align: right; font-size: 9px; font-weight: 800;">
            TOTAL LIQUIDACIÓN CUENTA DE COBRO:
          </td>
          <td style="border: 1px solid #000000; padding: 3px 4px; text-align: right; font-size: 9.5px; font-weight: 900; color: #047857;">
            ${formatCOPTotal(granTotal)}
          </td>
          <td style="border: 1px solid #000000; padding: 3px;"></td>
          <td style="border: 1px solid #000000; padding: 3px;"></td>
        </tr>
      </tbody>
    </table>

    <!-- 6. SECCIÓN DE FIRMA Y DATOS DE IDENTIFICACIÓN -->
    <div style="margin-top: 10px; margin-bottom: 8px;">
      <div style="font-weight: 800; font-size: 9px; margin-bottom: 2px;">FIRMA</div>
      <!-- Trazado vectorial de la firma formal 'Jave' -->
      <div style="height: 36px; display: flex; align-items: flex-end; margin-bottom: 4px;">
        <svg width="115" height="34" viewBox="0 0 115 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 26 C 16 14, 22 4, 28 4 C 32 4, 34 16, 31 28 C 28 34, 23 33, 20 28 C 17 18, 26 10, 38 14 C 45 16, 49 28, 56 26 C 62 24, 66 14, 74 16 C 78 18, 81 28, 86 24 C 92 20, 96 12, 104 16 M 16 30 L 96 30" stroke="#000000" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="border-bottom: 1px solid #000000; width: 230px; margin-bottom: 6px;"></div>

      <div style="font-size: 8px; line-height: 1.45; color: #000000;">
        <div><strong>NOMBRE COMPLETO:</strong> Jhon Alexander Vasquez Reveló</div>
        <div><strong>TIPO DE IDENTIFICACION:</strong> Cedula</div>
        <div><strong>NUMERO DE IDENTIFICACION:</strong> 10308105</div>
        <div><strong>CIUDAD Y DIRECCION DE DOMICILIO:</strong> Popayán Cra 13 # 10-52 Las Américas</div>
        <div><strong>TELEFONO Y/O CELULAR:</strong> 3122174851 Cuenta de Ahorro Nequi 3122174851</div>
      </div>
    </div>

    <!-- 7. DECLARACIÓN LEGAL ART. 383 E.T. EN RECUADRO CON BORDE NEGRO -->
    <div style="border: 1px solid #000000; padding: 4px 6px; font-size: 7.2px; line-height: 1.25; font-style: italic; color: #000000; text-align: justify;">
      Yo, Jhon Alexander Vasquez Reveló identificado con CC numero: 10308105, con el fin de dar cumplimiento a las obligaciones establecidas en la ley
      1819 de 2016 y del parágrafo 2 del artículo 383 del estatuto tributario, manifiesto bajo gravedad de juramento que: para efectos de la tabla de retención en la fuente establecida en el artículo 383 del estatuto tributario
      por la cual se aplica a los pagos o abonos en cuenta por concepto de ingresos por honorarios o compensación por servicios personales, NO he contratado o vinculado mas de un trabajador asociado a la actividad
      que desarrollo y no reúno ninguno de los requisitos para ser declarante de renta.
    </div>
  `;

  return container;
}

/**
 * Servicio profesional de exportación a PDF para Cuentas de Cobro en Ruta CRM.
 * 
 * Genera el documento utilizando EXCLUSIVAMENTE el formato contable corporativo oficial:
 * - Cabecera formal con retícula (R&S SOLUCIONES, CUENTA DE COBRO, Versión, Fecha).
 * - Barra de Ciudad y Fecha, y recuadro de Número de Cuenta de Cobro.
 * - Textos de liquidación formales (DEBE A, LA SUMA DE, POR CONCEPTO DE).
 * - Tabla contable oficial de 10 columnas con encabezado #135E6B y bordes negros.
 * - Subtotales y Total de Liquidación con precisión contable.
 * - Trazado de firma y declaración juramentada legal Art. 383 E.T. en recuadro.
 * - Ajuste perfecto en 1 página A4 Paisaje (Landscape) sin cortes de tabla.
 */
export async function exportarCuentaCobroPDF(datosOServicios, opciones = {}) {
  // Determinar si recibimos un array de servicios o si viene dentro de opciones
  let listaServicios = [];
  if (Array.isArray(datosOServicios)) {
    listaServicios = datosOServicios;
  } else if (datosOServicios && Array.isArray(datosOServicios.servicios)) {
    listaServicios = datosOServicios.servicios;
  } else if (Array.isArray(opciones.servicios)) {
    listaServicios = opciones.servicios;
  }

  const {
    fileName = "Cuenta_de_Cobro_Oficial.pdf",
    metadata = {},
    numeroCuenta = null
  } = opciones;

  let plantillaDOM = null;
  let esPlantillaGenerada = false;

  if (listaServicios && listaServicios.length > 0) {
    // Generar la plantilla corporativa oficial idéntica al formato contable
    plantillaDOM = construirPlantillaCuentaCobroCorporativa({
      servicios: listaServicios,
      metadata: {
        ...metadata,
        periodo: opciones.periodo
      },
      numeroCuenta: numeroCuenta || opciones.numeroCuenta
    });

    // Añadir al DOM de forma invisible para que html2canvas pueda medir y renderizar fuentes y estilos
    plantillaDOM.style.position = "fixed";
    plantillaDOM.style.left = "-9999px";
    plantillaDOM.style.top = "0";
    plantillaDOM.style.zIndex = "-100";
    document.body.appendChild(plantillaDOM);
    esPlantillaGenerada = true;
  } else if (datosOServicios instanceof HTMLElement) {
    plantillaDOM = datosOServicios;
  } else {
    throw new Error("No se proporcionaron servicios válidos ni contenedor para la cuenta de cobro.");
  }

  try {
    // Renderizado en alta definición (2.5x retina ~ 250-300 DPI)
    const canvas = await html2canvas(plantillaDOM, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200
    });

    // Configuración jsPDF A4 Paisaje
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true
    });

    const pageWidth = 297; // mm
    const pageHeight = 210; // mm
    const marginX = 8; // mm
    const marginY = 8; // mm
    const printableWidth = pageWidth - marginX * 2; // 281 mm
    const printableHeight = pageHeight - marginY * 2; // 194 mm

    const pxToMm = printableWidth / canvas.width;
    const totalHeightMm = canvas.height * pxToMm;

    // Si el documento cabe en una página (incluso con escalado suave hasta 250mm):
    // Garantizamos que TODO el formato contable (cabecera, tabla, subtotales, firma y Art 383)
    // quede en 1 SOLA PÁGINA EXACTA sin divisiones ni saltos indeseados.
    const factorEscala = totalHeightMm > printableHeight ? (printableHeight - 2) / totalHeightMm : 1;
    const finalWidth = printableWidth * factorEscala;
    const finalHeight = totalHeightMm * factorEscala;
    const offsetX = marginX + (printableWidth - finalWidth) / 2;
    const offsetY = marginY;

    pdf.addImage(canvas, "JPEG", offsetX, offsetY, finalWidth, finalHeight, "", "FAST");

    // Guardar el PDF oficial
    pdf.save(fileName);
    return true;
  } finally {
    // Limpiar nodo temporal del DOM
    if (esPlantillaGenerada && plantillaDOM && plantillaDOM.parentNode) {
      plantillaDOM.parentNode.removeChild(plantillaDOM);
    }
  }
}
