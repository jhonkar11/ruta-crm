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

  const fontGeneral = { name: "Arial", size: 9.5, color: { argb: "FF000000" } };
  const fontBold = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF000000" } };

  const borderThin = {
    top: { style: "thin", color: { argb: "FF000000" } },
    left: { style: "thin", color: { argb: "FF000000" } },
    bottom: { style: "thin", color: { argb: "FF000000" } },
    right: { style: "thin", color: { argb: "FF000000" } },
  };

  // ── FILAS 1 A 4: CABECERA CORPORATIVA OFICIAL ──
  // B1..D3: Logo / Texto R&S SOLUCIONES
  worksheet.mergeCells("B1:D3");
  const cellLogo = worksheet.getCell("B1");
  cellLogo.value = "R&S\nSOLUCIONES";
  cellLogo.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF135E6B" } };
  cellLogo.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  ["B1", "C1", "D1", "B2", "C2", "D2", "B3", "C3", "D3"].forEach((c) => {
    worksheet.getCell(c).border = borderThin;
  });

  // E1..H3: Título CUENTA DE COBRO
  worksheet.mergeCells("E1:H3");
  const cellTitulo = worksheet.getCell("E1");
  cellTitulo.value = "CUENTA DE COBRO";
  cellTitulo.font = { name: "Arial", size: 17, bold: true, color: { argb: "FF0F2B48" } };
  cellTitulo.alignment = { horizontal: "center", vertical: "middle" };
  cellTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9F2F7" } };
  for (let r = 1; r <= 3; r++) {
    ["E", "F", "G", "H"].forEach((col) => {
      worksheet.getCell(`${col}${r}`).border = borderThin;
    });
  }

  // I1..K2: Versión: 04
  worksheet.mergeCells("I1:K2");
  const cellVersion = worksheet.getCell("I1");
  cellVersion.value = "Versión: 04";
  cellVersion.font = { name: "Arial", size: 9.5, bold: true };
  cellVersion.alignment = { horizontal: "center", vertical: "middle" };
  cellVersion.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F1" } };
  for (let r = 1; r <= 2; r++) {
    ["I", "J", "K"].forEach((col) => {
      worksheet.getCell(`${col}${r}`).border = borderThin;
    });
  }

  // I3..K3: Fecha: 04 de Junio de 2026 (o fecha actual)
  worksheet.mergeCells("I3:K3");
  const cellFechaDoc = worksheet.getCell("I3");
  const hoy = new Date();
  const mesesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const fechaDocTexto = `Fecha: ${String(hoy.getDate()).padStart(2, "0")} de ${mesesNombres[hoy.getMonth()]} de ${hoy.getFullYear()}`;
  cellFechaDoc.value = fechaDocTexto;
  cellFechaDoc.font = { name: "Arial", size: 8.5, bold: true };
  cellFechaDoc.alignment = { horizontal: "center", vertical: "middle" };
  cellFechaDoc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDCE6F1" } };
  ["I3", "J3", "K3"].forEach((col) => {
    worksheet.getCell(col).border = borderThin;
  });

  // ── FILA 5: CIUDAD Y FECHA ──
  // B5:C5: Ciudad: Popayán
  worksheet.mergeCells("B5:C5");
  const cellCiudadEtq = worksheet.getCell("B5");
  cellCiudadEtq.value = "Ciudad:";
  cellCiudadEtq.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  cellCiudadEtq.alignment = { horizontal: "center", vertical: "middle" };
  cellCiudadEtq.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A192F" } };
  cellCiudadEtq.border = borderThin;
  worksheet.getCell("C5").border = borderThin;

  worksheet.mergeCells("D5:F5");
  const cellCiudadVal = worksheet.getCell("D5");
  cellCiudadVal.value = "Popayán";
  cellCiudadVal.font = fontBold;
  cellCiudadVal.alignment = { horizontal: "center", vertical: "middle" };
  ["D5", "E5", "F5"].forEach((c) => { worksheet.getCell(c).border = borderThin; });

  // G5..H5: Fecha:
  worksheet.mergeCells("G5:H5");
  const cellFechaEtq = worksheet.getCell("G5");
  cellFechaEtq.value = "Fecha:";
  cellFechaEtq.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
  cellFechaEtq.alignment = { horizontal: "center", vertical: "middle" };
  cellFechaEtq.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A192F" } };
  cellFechaEtq.border = borderThin;
  worksheet.getCell("H5").border = borderThin;

  // I5..K5: Fecha valor (DD/MM/AAAA)
  worksheet.mergeCells("I5:K5");
  const cellFechaVal = worksheet.getCell("I5");
  const fechaCorta = `${String(hoy.getDate()).padStart(2, "0")}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${hoy.getFullYear()}`;
  cellFechaVal.value = fechaCorta;
  cellFechaVal.font = fontBold;
  cellFechaVal.alignment = { horizontal: "center", vertical: "middle" };
  ["I5", "J5", "K5"].forEach((c) => { worksheet.getCell(c).border = borderThin; });

  // ── FILA 7: NÚMERO DE CUENTA DE COBRO ──
  worksheet.mergeCells("H7:I7");
  const cellNumCuentaEtq = worksheet.getCell("H7");
  cellNumCuentaEtq.value = "Numero de cuenta de cobro:";
  cellNumCuentaEtq.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
  cellNumCuentaEtq.alignment = { horizontal: "center", vertical: "middle" };
  cellNumCuentaEtq.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0A192F" } };
  cellNumCuentaEtq.border = borderThin;
  worksheet.getCell("I7").border = borderThin;

  worksheet.mergeCells("J7:K7");
  const cellNumCuentaVal = worksheet.getCell("J7");
  // Número de cobro según el mes o consecutivo
  const numCuentaDefecto = metadata.numeroCuenta || (hoy.getMonth() + 1);
  cellNumCuentaVal.value = numCuentaDefecto;
  cellNumCuentaVal.font = { name: "Arial", size: 10, bold: true };
  cellNumCuentaVal.alignment = { horizontal: "center", vertical: "middle" };
  cellNumCuentaVal.border = borderThin;
  worksheet.getCell("K7").border = borderThin;

  // ── FILA 9: R&S SOLUCIONES S.A.S. / NIT ──
  worksheet.mergeCells("B9:K9");
  const cellEmpresa = worksheet.getCell("B9");
  cellEmpresa.value = "R&S SOLUCIONES S.A.S.";
  cellEmpresa.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF000000" } };
  cellEmpresa.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("B10:K10");
  const cellNit = worksheet.getCell("B10");
  cellNit.value = "NIT: 900.291.287-9";
  cellNit.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF333333" } };
  cellNit.alignment = { horizontal: "center", vertical: "middle" };

  // ── FILA 12: DEBE A ──
  worksheet.mergeCells("B12:K12");
  const cellDebeA = worksheet.getCell("B12");
  cellDebeA.value = `DEBE A:  ${metadata.nombre || "Jhon Alexander Vasquez Reveló"}`;
  cellDebeA.font = { name: "Arial", size: 10, bold: true };
  cellDebeA.alignment = { horizontal: "center", vertical: "middle" };

  // ── FILA 14: CÉDULA ──
  worksheet.mergeCells("B14:K14");
  const cellCC = worksheet.getCell("B14");
  cellCC.value = `C.C. ${metadata.cedula || "10308105"}`;
  cellCC.font = { name: "Arial", size: 10, bold: true };
  cellCC.alignment = { horizontal: "center", vertical: "middle" };

  // Calcular totales
  const totalServicios = registros.reduce((acc, s) => acc + s.valor_servicios, 0);
  const totalViaticos = registros.reduce((acc, s) => acc + s.valor_viaticos, 0);
  const totalMateriales = registros.reduce((acc, s) => acc + s.valor_materiales, 0);
  const granTotal = totalServicios + totalViaticos + totalMateriales;

  const textoEnLetras = numeroALetras(granTotal);
  const totalFormateado = new Intl.NumberFormat("es-CO").format(granTotal);

  // ── FILA 17: LA SUMA DE ──
  worksheet.mergeCells("B17:K17");
  const cellSuma = worksheet.getCell("B17");
  cellSuma.value = `LA SUMA DE (${textoEnLetras}):`;
  cellSuma.font = { name: "Arial", size: 9.5, bold: true };
  cellSuma.alignment = { horizontal: "center", vertical: "middle" };

  // ── FILA 18: SON (VALOR) ──
  worksheet.mergeCells("B18:K18");
  const cellSon = worksheet.getCell("B18");
  cellSon.value = `SON (${totalFormateado}):`;
  cellSon.font = { name: "Arial", size: 9.5, bold: true };
  cellSon.alignment = { horizontal: "center", vertical: "middle" };

  // ── FILA 21: POR CONCEPTO DE ──
  worksheet.mergeCells("B21:K21");
  const cellConcepto = worksheet.getCell("B21");
  cellConcepto.value = "POR CONCEPTO DE : PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO.";
  cellConcepto.font = { name: "Arial", size: 9.5, bold: true };
  cellConcepto.alignment = { horizontal: "center", vertical: "middle" };

  // ── FILA 23: ENCABEZADOS DE LA TABLA (Idénticos al screenshot) ──
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
  const filaEncabezado = 23;

  encabezados.forEach(({ col, titulo }) => {
    const cell = worksheet.getCell(`${col}${filaEncabezado}`);
    cell.value = titulo;
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: tealColor },
    };
    cell.border = borderThin;
  });
  worksheet.getRow(filaEncabezado).height = 24;

  // Filas de Datos a partir de la fila 24
  const filaInicio = 24;
  const numItems = Math.max(registros.length, 12); // Conserva el espacio visual del formato

  for (let idx = 0; idx < numItems; idx++) {
    const rowNum = filaInicio + idx;
    const item = registros[idx] || null;
    const row = worksheet.getRow(rowNum);
    row.height = 19;

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

      cellC.value = item.fecha_solicitud || "-";
      cellC.alignment = { horizontal: "center", vertical: "middle" };

      cellD.value = item.fecha_atencion || "-";
      cellD.alignment = { horizontal: "center", vertical: "middle" };

      cellE.value = item.fecha_finalizacion || "-";
      cellE.alignment = { horizontal: "center", vertical: "middle" };

      cellF.value = item.mesa || "-";
      cellF.alignment = { horizontal: "center", vertical: "middle" };

      cellG.value = item.cliente || "-";
      cellG.alignment = { horizontal: "center", vertical: "middle" };

      cellH.value = item.coordinador || "-";
      cellH.alignment = { horizontal: "center", vertical: "middle" };

      cellI.value = item.valor_servicios;
      cellI.numFmt = '"$" #,##0;("$" #,##0);"-"';
      cellI.alignment = { horizontal: "right", vertical: "middle" };

      cellJ.value = item.valor_viaticos;
      cellJ.numFmt = '"$" #,##0;("$" #,##0);"-"';
      cellJ.alignment = { horizontal: "right", vertical: "middle" };

      cellK.value = item.valor_materiales;
      cellK.numFmt = '"$" #,##0;("$" #,##0);"-"';
      cellK.alignment = { horizontal: "right", vertical: "middle" };
    } else {
      // Celdas vacías con guión de moneda según la imagen
      cellI.value = 0;
      cellI.numFmt = '"$" -';
      cellI.alignment = { horizontal: "right", vertical: "middle" };

      cellJ.value = 0;
      cellJ.numFmt = '"$" -';
      cellJ.alignment = { horizontal: "right", vertical: "middle" };

      cellK.value = 0;
      cellK.numFmt = '"$" -';
      cellK.alignment = { horizontal: "right", vertical: "middle" };
    }

    [cellB, cellC, cellD, cellE, cellF, cellG, cellH, cellI, cellJ, cellK].forEach((c) => {
      c.font = fontGeneral;
      c.border = borderThin;
    });
  }

  // ── FILA DE RESUMEN SUBTOTAL: Acordados En servicio, Grupo Ava Viáticos, Materiales ──
  const filaSubtotal = filaInicio + numItems;
  const rowSub = worksheet.getRow(filaSubtotal);
  rowSub.height = 20;

  worksheet.mergeCells(`B${filaSubtotal}:E${filaSubtotal}`);
  const cellFirmaMini = worksheet.getCell(`B${filaSubtotal}`);
  cellFirmaMini.value = "Firma Digital Registrada";
  cellFirmaMini.font = { name: "Arial", size: 8.5, italic: true, color: { argb: "FF555555" } };
  cellFirmaMini.alignment = { horizontal: "center", vertical: "middle" };
  for (let c = 2; c <= 5; c++) worksheet.getCell(filaSubtotal, c).border = borderThin;

  worksheet.getCell(`F${filaSubtotal}`).value = "Acordados En servicio";
  worksheet.getCell(`F${filaSubtotal}`).font = { name: "Arial", size: 8, bold: true };
  worksheet.getCell(`F${filaSubtotal}`).alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getCell(`F${filaSubtotal}`).border = borderThin;

  worksheet.getCell(`G${filaSubtotal}`).value = "Grupo Ava  Viáticos";
  worksheet.getCell(`G${filaSubtotal}`).font = { name: "Arial", size: 8, bold: true };
  worksheet.getCell(`G${filaSubtotal}`).alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getCell(`G${filaSubtotal}`).border = borderThin;

  worksheet.getCell(`H${filaSubtotal}`).value = "Materiales";
  worksheet.getCell(`H${filaSubtotal}`).font = { name: "Arial", size: 8, bold: true };
  worksheet.getCell(`H${filaSubtotal}`).alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getCell(`H${filaSubtotal}`).border = borderThin;

  const cellTotI = worksheet.getCell(`I${filaSubtotal}`);
  cellTotI.value = { formula: `SUM(I${filaInicio}:I${filaSubtotal - 1})`, result: totalServicios };
  cellTotI.font = fontBold;
  cellTotI.numFmt = '"$" #,##0';
  cellTotI.alignment = { horizontal: "right", vertical: "middle" };
  cellTotI.border = borderThin;

  const cellTotJ = worksheet.getCell(`J${filaSubtotal}`);
  cellTotJ.value = { formula: `SUM(J${filaInicio}:J${filaSubtotal - 1})`, result: totalViaticos };
  cellTotJ.font = fontBold;
  cellTotJ.numFmt = '"$" #,##0';
  cellTotJ.alignment = { horizontal: "right", vertical: "middle" };
  cellTotJ.border = borderThin;

  const cellTotK = worksheet.getCell(`K${filaSubtotal}`);
  cellTotK.value = { formula: `SUM(K${filaInicio}:K${filaSubtotal - 1})`, result: totalMateriales };
  cellTotK.font = fontBold;
  cellTotK.numFmt = '"$" #,##0';
  cellTotK.alignment = { horizontal: "right", vertical: "middle" };
  cellTotK.border = borderThin;

  // ── FILA TOTAL GENERAL (SON) ──
  const filaGranTotal = filaSubtotal + 1;
  worksheet.mergeCells(`B${filaGranTotal}:H${filaGranTotal}`);
  const cellTotLbl = worksheet.getCell(`B${filaGranTotal}`);
  cellTotLbl.value = "TOTAL LIQUIDACIÓN CUENTA DE COBRO:";
  cellTotLbl.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF0A192F" } };
  cellTotLbl.alignment = { horizontal: "right", vertical: "middle" };
  for (let c = 2; c <= 8; c++) worksheet.getCell(filaGranTotal, c).border = borderThin;

  const cellGranTotVal = worksheet.getCell(`I${filaGranTotal}`);
  cellGranTotVal.value = { formula: `SUM(I${filaSubtotal}:K${filaSubtotal})`, result: granTotal };
  cellGranTotVal.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF059669" } };
  cellGranTotVal.numFmt = '"$" #,##0';
  cellGranTotVal.alignment = { horizontal: "right", vertical: "middle" };
  cellGranTotVal.border = borderThin;

  worksheet.getCell(`J${filaGranTotal}`).border = borderThin;
  worksheet.getCell(`K${filaGranTotal}`).border = borderThin;

  // ── BLOQUE DE FIRMA Y DATOS DE IDENTIFICACIÓN (Filas posteriores) ──
  const fFirma = filaGranTotal + 3;
  worksheet.getCell(`B${fFirma}`).value = "FIRMA";
  worksheet.getCell(`B${fFirma}`).font = fontBold;

  worksheet.getCell(`B${fFirma + 1}`).value = "__________________________________________________";
  worksheet.getCell(`B${fFirma + 1}`).font = fontBold;

  worksheet.getCell(`B${fFirma + 3}`).value = `NOMBRE COMPLETO: ${metadata.nombre || "Jhon Alexander Vasquez Reveló"}`;
  worksheet.getCell(`B${fFirma + 3}`).font = fontGeneral;

  worksheet.getCell(`B${fFirma + 4}`).value = "TIPO DE IDENTIFICACION: Cedula";
  worksheet.getCell(`B${fFirma + 4}`).font = fontGeneral;

  worksheet.getCell(`B${fFirma + 5}`).value = `NUMERO DE IDENTIFICACION: ${metadata.cedula || "10308105"}`;
  worksheet.getCell(`B${fFirma + 5}`).font = fontGeneral;

  worksheet.getCell(`B${fFirma + 6}`).value = "CIUDAD Y DIRECCION DE DOMICILIO: Popayán Cra 13 # 10-52 Las Américas";
  worksheet.getCell(`B${fFirma + 6}`).font = fontGeneral;

  worksheet.getCell(`B${fFirma + 7}`).value = "TELEFONO Y/O CELULAR: 3122174851   Cuenta de Ahorro Nequi 3122174851";
  worksheet.getCell(`B${fFirma + 7}`).font = fontGeneral;

  // ── TEXTO LEGAL DE RETENCIÓN EN LA FUENTE (Art. 383 E.T.) ──
  const fLegal = fFirma + 9;
  worksheet.mergeCells(`B${fLegal}:K${fLegal + 3}`);
  const cellLegal = worksheet.getCell(`B${fLegal}`);
  cellLegal.value =
    "Yo, Jhon Alexander Vasquez Reveló identificado con CC numero: 10308105, con el fin de dar cumplimiento a las obligaciones establecidas en la ley\n" +
    "1819 de 2016 y del parágrafo 2 del artículo 383 del estatuto tributario, manifiesto bajo gravedad de juramento que: para efectos de la tabla de retención en la fuente establecida en el artículo 383 del estatuto tributario\n" +
    "por la cual se aplica a los pagos o abonos en cuenta por concepto de ingresos por honorarios o compensación por servicios personales, NO he contratado o vinculado mas de un trabajador asociado a la actividad\n" +
    "que desarrollo y no reúno ninguno de los requisitos para ser declarante de renta.";
  cellLegal.font = { name: "Arial", size: 7.5, italic: true };
  cellLegal.alignment = { horizontal: "left", vertical: "top", wrapText: true };
  for (let r = fLegal; r <= fLegal + 3; r++) {
    for (let c = 2; c <= 11; c++) {
      worksheet.getCell(r, c).border = borderThin;
    }
  }

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
