import ExcelJS from "exceljs";
import { numeroALetras } from "../utils/numeroALetras";
import {
  EMPRESA,
  celdaTexto,
  normalizarFecha,
  normalizarMoneda
} from "../utils/excelNormalizadores";

export { EMPRESA, celdaTexto, normalizarFecha, normalizarMoneda };

/**
 * Genera el libro Excel de Cuenta de Cobro de R&S Soluciones con el formato
 * corporativo oficial: los datos estructurados del soporte se inyectan desde la
 * fila 25 respetando los diez campos de la plantilla (N° de Caso, Fecha de
 * solicitud, Fecha Atención, Fecha de finalización, Mesa, Cliente,
 * Coordinador de serv., Valor servicios, Valor Viáticos, Valor Materiales).
 *
 * @param {Array} servicios - Servicios a inyectar a partir de la fila 25
 * @param {object} metadata - { nombre, cedula }
 */
export async function generarExcelCuentaCobro(servicios = [], metadata = {}) {
  // Se normaliza por adelantado: una fila con valores sucios rompería el formato
  // de moneda o dejaría celdas de fecha con texto crudo de la IA.
  const registros = (Array.isArray(servicios) ? servicios : []).map((s) => ({
    numero_caso: celdaTexto(s?.numero_caso),
    fecha_solicitud: normalizarFecha(s?.fecha_solicitud),
    fecha_atencion: normalizarFecha(s?.fecha_atencion),
    fecha_finalizacion: normalizarFecha(s?.fecha_finalizacion),
    mesa: celdaTexto(s?.mesa),
    cliente: celdaTexto(s?.cliente),
    coordinador: celdaTexto(s?.coordinador),
    valor_servicios: normalizarMoneda(s?.valor_servicios),
    valor_viaticos: normalizarMoneda(s?.valor_viaticos),
    valor_materiales: normalizarMoneda(s?.valor_materiales)
  }));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = `${EMPRESA} · CRM Soporte Técnico`;
  workbook.lastModifiedBy = metadata.nombre || "R&S Soluciones";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Formato", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 }
  });

  // Ajuste de anchos de columna
  worksheet.getColumn("A").width = 4;
  worksheet.getColumn("B").width = 28; // N° de Caso
  worksheet.getColumn("C").width = 16; // Fecha de solicitud
  worksheet.getColumn("D").width = 16; // Fecha Atencion
  worksheet.getColumn("E").width = 18; // Fecha de finalización
  worksheet.getColumn("F").width = 10; // Mesa
  worksheet.getColumn("G").width = 24; // Cliente
  worksheet.getColumn("H").width = 20; // Coordinador de serv.
  worksheet.getColumn("I").width = 16; // Valor servicios
  worksheet.getColumn("J").width = 16; // Valor Viaticos
  worksheet.getColumn("K").width = 16; // Valor Materiales
  worksheet.getColumn("L").width = 4;

  const fontGeneral = { name: "Arial", size: 10, color: { argb: "FF000000" } };
  const fontBold = { name: "Arial", size: 10, bold: true, color: { argb: "FF000000" } };

  // Fila 9: Razón social del emisor / Entidad
  worksheet.mergeCells("B9:K9");
  const cellEmpresa = worksheet.getCell("B9");
  cellEmpresa.value = metadata.empresa || EMPRESA;
  cellEmpresa.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF135E6B" } };
  cellEmpresa.alignment = { horizontal: "center", vertical: "middle" };

  // Fila 12: DEBE A
  worksheet.mergeCells("B12:K12");
  const cellDebeA = worksheet.getCell("B12");
  cellDebeA.value = `DEBE A: ${metadata.nombre || "Jhon Alexander Vasquez Reveló"}`;
  cellDebeA.font = fontBold;
  cellDebeA.alignment = { horizontal: "center", vertical: "middle" };

  // Fila 14: Cédula
  worksheet.mergeCells("B14:K14");
  const cellCC = worksheet.getCell("B14");
  cellCC.value = `C.C. ${metadata.cedula || "10308105"}`;
  cellCC.font = fontBold;
  cellCC.alignment = { horizontal: "center", vertical: "middle" };

  // Calcular totales sobre los registros ya normalizados
  const totalServicios = registros.reduce((acc, s) => acc + s.valor_servicios, 0);
  const totalViaticos = registros.reduce((acc, s) => acc + s.valor_viaticos, 0);
  const totalMateriales = registros.reduce((acc, s) => acc + s.valor_materiales, 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;

  const textoEnLetras = numeroALetras(granTotal);
  const totalFormateado = new Intl.NumberFormat("es-CO").format(granTotal);

  // Fila 17: LA SUMA DE
  worksheet.mergeCells("B17:K17");
  const cellSuma = worksheet.getCell("B17");
  cellSuma.value = `LA SUMA DE ${textoEnLetras}):`;
  cellSuma.font = fontBold;
  cellSuma.alignment = { horizontal: "center", vertical: "middle" };
  cellSuma.border = {
    top: { style: "thin", color: { argb: "FF00A86B" } },
    left: { style: "thin", color: { argb: "FF00A86B" } },
    right: { style: "thin", color: { argb: "FF00A86B" } },
  };

  // Fila 18: SON (VALOR)
  worksheet.mergeCells("B18:K18");
  const cellSon = worksheet.getCell("B18");
  cellSon.value = `SON (${totalFormateado}):`;
  cellSon.font = fontBold;
  cellSon.alignment = { horizontal: "center", vertical: "middle" };
  cellSon.border = {
    bottom: { style: "thin", color: { argb: "FF00A86B" } },
    left: { style: "thin", color: { argb: "FF00A86B" } },
    right: { style: "thin", color: { argb: "FF00A86B" } },
  };

  // Fila 22: POR CONCEPTO DE
  worksheet.mergeCells("B22:K22");
  const cellConcepto = worksheet.getCell("B22");
  cellConcepto.value = "POR CONCEPTO DE : PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO.";
  cellConcepto.font = fontBold;
  cellConcepto.alignment = { horizontal: "center", vertical: "middle" };

  // Fila 24: ENCABEZADOS DE LA TABLA
  const encabezados = [
    { col: "B", titulo: "N° de Caso" },
    { col: "C", titulo: "Fecha de solicitud" },
    { col: "D", titulo: "Fecha Atencion" },
    { col: "E", titulo: "Fecha de finalización" },
    { col: "F", titulo: "Mesa" },
    { col: "G", titulo: "Cliente" },
    { col: "H", titulo: "Coordinador de serv." },
    { col: "I", titulo: "Valor servicios" },
    { col: "J", titulo: "Valor Viaticos" },
    { col: "K", titulo: "Valor Materiales" },
  ];

  const tealColor = "FF135E6B"; // Color idéntico al screenshot oficial
  const borderThin = {
    top: { style: "thin", color: { argb: "FF7F7F7F" } },
    left: { style: "thin", color: { argb: "FF7F7F7F" } },
    bottom: { style: "thin", color: { argb: "FF7F7F7F" } },
    right: { style: "thin", color: { argb: "FF7F7F7F" } },
  };

  encabezados.forEach(({ col, titulo }) => {
    const cell = worksheet.getCell(`${col}24`);
    cell.value = titulo;
    cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: tealColor },
    };
    cell.border = borderThin;
  });
  worksheet.getRow(24).height = 24;

  // Filas de Datos a partir de la fila 25
  const filaInicio = 25;
  // Mínimo 7 filas visibles para conservar el espacio del formato oficial; por
  // encima de eso crece con el número real de casos (exportación masiva).
  const numItems = Math.max(registros.length, 7);

  for (let idx = 0; idx < numItems; idx++) {
    const rowNum = filaInicio + idx;
    const item = registros[idx] || null;
    const row = worksheet.getRow(rowNum);
    row.height = 20;

    const cellB = worksheet.getCell(`B${rowNum}`);
    const cellC = worksheet.getCell(`C${rowNum}`);
    const cellD = worksheet.getCell(`D${rowNum}`);
    const cellE = worksheet.getCell(`E${rowNum}`);
    const cellF = worksheet.getCell(`F${rowNum}`);
    const cellG = worksheet.getCell(`G${rowNum}`);
    const cellH = worksheet.getCell(`H${rowNum}`);
    const cellI = worksheet.getCell(`I${rowNum}`);
    const cellJ = worksheet.getCell(`J${rowNum}`);
    const cellK = worksheet.getCell(`K${rowNum}`);

    if (item) {
      cellB.value = item.numero_caso;
      cellB.alignment = { horizontal: "center", vertical: "middle" };

      cellC.value = item.fecha_solicitud || "n/d";
      cellC.alignment = { horizontal: "center", vertical: "middle" };

      cellD.value = item.fecha_atencion || "n/d";
      cellD.alignment = { horizontal: "center", vertical: "middle" };

      cellE.value = item.fecha_finalizacion || "n/d";
      cellE.alignment = { horizontal: "center", vertical: "middle" };

      cellF.value = item.mesa;
      cellF.alignment = { horizontal: "center", vertical: "middle" };

      cellG.value = item.cliente;
      cellG.alignment = { horizontal: "center", vertical: "middle" };

      cellH.value = item.coordinador;
      cellH.alignment = { horizontal: "center", vertical: "middle" };

      // Valores numéricos con formato moneda
      cellI.value = item.valor_servicios;
      cellI.numFmt = '"$" #,##0';
      cellI.alignment = { horizontal: "right", vertical: "middle" };

      cellJ.value = item.valor_viaticos;
      cellJ.numFmt = '"$" #,##0';
      cellJ.alignment = { horizontal: "right", vertical: "middle" };

      cellK.value = item.valor_materiales;
      cellK.numFmt = '"$" #,##0';
      cellK.alignment = { horizontal: "right", vertical: "middle" };
    }

    [cellB, cellC, cellD, cellE, cellF, cellG, cellH, cellI, cellJ, cellK].forEach((c) => {
      c.font = fontGeneral;
      c.border = borderThin;
    });
  }

  // Fila de Totales
  const filaTotal = filaInicio + numItems;
  const rowTot = worksheet.getRow(filaTotal);
  rowTot.height = 22;

  // Limpiar celdas B..H de la fila total
  for (let c = 2; c <= 8; c++) {
    const cell = rowTot.getCell(c);
    cell.border = borderThin;
  }

  const cellTotI = worksheet.getCell(`I${filaTotal}`);
  cellTotI.value = { formula: `SUM(I${filaInicio}:I${filaTotal - 1})`, result: totalServicios };
  cellTotI.font = fontBold;
  cellTotI.numFmt = '"$" #,##0';
  cellTotI.alignment = { horizontal: "right", vertical: "middle" };
  cellTotI.border = borderThin;

  const cellTotJ = worksheet.getCell(`J${filaTotal}`);
  cellTotJ.value = { formula: `SUM(J${filaInicio}:J${filaTotal - 1})`, result: totalViaticos };
  cellTotJ.font = fontBold;
  cellTotJ.numFmt = '"$" #,##0';
  cellTotJ.alignment = { horizontal: "right", vertical: "middle" };
  cellTotJ.border = borderThin;

  const cellTotK = worksheet.getCell(`K${filaTotal}`);
  cellTotK.value = { formula: `SUM(K${filaInicio}:K${filaTotal - 1})`, result: totalMateriales };
  cellTotK.font = fontBold;
  cellTotK.numFmt = '"$" #,##0';
  cellTotK.alignment = { horizontal: "right", vertical: "middle" };
  cellTotK.border = borderThin;

  // Fila de Firma
  const filaFirma = filaTotal + 3;
  const cellFirma = worksheet.getCell(`B${filaFirma}`);
  cellFirma.value = "FIRMA _______________________________________";
  cellFirma.font = fontBold;

  // Encabezado del archivo: se antepone la razón social y la fecha de emisión para
  // que el .xlsx quede identificable cuando se cargan varios en la misma carpeta.
  const hoy = new Date();
  const fechaEmision = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  worksheet.getCell(`B${filaFirma + 1}`).value = `${EMPRESA} · Documento generado el ${fechaEmision}`;

  // Generar buffer binario
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Dispara la descarga del archivo Excel en el navegador del usuario.
 */
export function descargarExcelEnNavegador(
  buffer,
  nombreArchivo = "Cuenta de Cobro - R&S Soluciones.xlsx"
) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
