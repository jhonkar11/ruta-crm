"""
Procesador Corporativo de Cuentas de Cobro en Python (openpyxl & pandas)
Genera e inyecta servicios en la plantilla oficial:
'Formato de cuenta de cobro - Jhon Vasquez # 4.xlsx'
"""

import os
from typing import List, Dict, Any
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
import pandas as pd

def numero_a_letras(monto: float) -> str:
    """Convierte un valor numérico a su representación en letras en español."""
    unidades = ["", "Un", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"]
    decenas_10 = ["Diez", "Once", "Doce", "Trece", "Catorce", "Quince", "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve"]
    decenas = ["", "Diez", "Veinte", "Treinta", "Cuarenta", "Cincuenta", "Sesenta", "Setenta", "Ochenta", "Noventa"]
    centenas = ["", "Ciento", "Doscientos", "Trescientos", "Cuatrocientos", "Quinientos", "Seiscientos", "Setecientos", "Ochocientos", "Novecientos"]

    entero = int(abs(monto))
    if entero == 0:
        return "Cero Pesos"

    def convertir_centenas(n):
        if n == 100:
            return "Cien"
        c = n // 100
        d = (n % 100) // 10
        u = n % 10
        res = []
        if c > 0:
            res.append(centenas[c])
        if d == 1:
            res.append(decenas_10[u])
        elif d == 2:
            res.append("Veinte" if u == 0 else f"Veinti{unidades[u].lower()}")
        elif d > 2:
            res.append(f"{decenas[d]} y {unidades[u]}" if u > 0 else decenas[d])
        elif u > 0:
            res.append(unidades[u])
        return " ".join(res).strip()

    millones = entero // 1_000_000
    resto_millones = entero % 1_000_000
    miles = resto_millones // 1_000
    resto = resto_millones % 1_000

    partes = []
    if millones > 0:
        partes.append(f"{convertir_centenas(millones)} {'Millones' if millones > 1 else 'Millón'}")
    if miles > 0:
        partes.append("Mil" if miles == 1 else f"{convertir_centenas(miles)} mil")
    if resto > 0:
        partes.append(convertir_centenas(resto))

    texto = " ".join(partes).strip()
    return f"{texto} Pesos"


class CuentaCobroExcelProcessor:
    def __init__(self, filename: str = "Formato de cuenta de cobro - Jhon Vasquez # 4.xlsx"):
        self.filename = filename

    def exportar_cuenta_cobro(self, servicios: List[Dict[str, Any]], metadata: Dict[str, str] = None) -> str:
        """
        Crea o actualiza el archivo Excel con el diseño idéntico al formato oficial.
        Inyecta las filas a partir de la fila 24 (headers en fila 24, datos en 25+).
        """
        if metadata is None:
            metadata = {
                "nombre": "Jhon Alexander Vasquez Reveló",
                "cedula": "10308105"
            }

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Formato"

        # Configuración de anchos de columna
        anchos = {
            "A": 4, "B": 28, "C": 16, "D": 16, "E": 18,
            "F": 10, "G": 24, "H": 20, "I": 16, "J": 16, "K": 16, "L": 4
        }
        for col, ancho in anchos.items():
            ws.column_dimensions[col].width = ancho

        font_bold = Font(name="Arial", size=10, bold=True)
        font_regular = Font(name="Arial", size=10)
        teal_fill = PatternFill(start_color="135E6B", end_color="135E6B", fill_type="solid")
        font_header = Font(name="Arial", size=9.5, bold=True, color="FFFFFF")

        thin = Side(border_style="thin", color="7F7F7F")
        border_cell = Border(left=thin, right=thin, top=thin, bottom=thin)

        # Fila 12: DEBE A
        ws.merge_cells("B12:K12")
        ws["B12"] = f"DEBE A: {metadata['nombre']}"
        ws["B12"].font = font_bold
        ws["B12"].alignment = Alignment(horizontal="center", vertical="center")

        # Fila 14: Cédula
        ws.merge_cells("B14:K14")
        ws["B14"] = f"C.C. {metadata['cedula']}"
        ws["B14"].font = font_bold
        ws["B14"].alignment = Alignment(horizontal="center", vertical="center")

        # Calcular totales
        total_servicios = sum(float(s.get("valor_servicios", 0) or 0) for s in servicios)
        total_viaticos = sum(float(s.get("valor_viaticos", 0) or 0) for s in servicios)
        total_materiales = sum(float(s.get("valor_materiales", 0) or 0) for s in servicios)
        gran_total = total_servicios + total_viaticos + total_materiales

        total_en_letras = numero_a_letras(gran_total)
        total_formateado = f"{gran_total:,.0f}".replace(",", ".")

        # Fila 17: LA SUMA DE
        ws.merge_cells("B17:K17")
        ws["B17"] = f"LA SUMA DE {total_en_letras}):"
        ws["B17"].font = font_bold
        ws["B17"].alignment = Alignment(horizontal="center", vertical="center")

        # Fila 18: SON
        ws.merge_cells("B18:K18")
        ws["B18"] = f"SON ({total_formateado}):"
        ws["B18"].font = font_bold
        ws["B18"].alignment = Alignment(horizontal="center", vertical="center")

        # Fila 22: POR CONCEPTO DE
        ws.merge_cells("B22:K22")
        ws["B22"] = "POR CONCEPTO DE : PRESTACIÓN DE SERVICIOS DE SOPORTE TÉCNICO EN SITIO."
        ws["B22"].font = font_bold
        ws["B22"].alignment = Alignment(horizontal="center", vertical="center")

        # Fila 24: ENCABEZADOS DE LA TABLA
        headers = [
            ("B", "N° de Caso"),
            ("C", "Fecha de solicitud"),
            ("D", "Fecha Atencion"),
            ("E", "Fecha de finalización"),
            ("F", "Mesa"),
            ("G", "Cliente"),
            ("H", "Coordinador de serv."),
            ("I", "Valor servicios"),
            ("J", "Valor Viaticos"),
            ("K", "Valor Materiales"),
        ]

        ws.row_dimensions[24].height = 24
        for col_letter, title in headers:
            cell = ws[f"{col_letter}24"]
            cell.value = title
            cell.font = font_header
            cell.fill = teal_fill
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = border_cell

        # Filas de datos a partir de fila 25
        fila_inicio = 25
        num_filas = max(len(servicios), 7)

        for i in range(num_filas):
            row_idx = fila_inicio + i
            ws.row_dimensions[row_idx].height = 20
            s = servicios[i] if i < len(servicios) else {}

            ws[f"B{row_idx}"] = s.get("numero_caso", "")
            ws[f"B{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"C{row_idx}"] = s.get("fecha_solicitud", "")
            ws[f"C{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"D{row_idx}"] = s.get("fecha_atencion", "")
            ws[f"D{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"E{row_idx}"] = s.get("fecha_finalizacion", "")
            ws[f"E{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"F{row_idx}"] = s.get("mesa", "")
            ws[f"F{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"G{row_idx}"] = s.get("cliente", "")
            ws[f"G{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            ws[f"H{row_idx}"] = s.get("coordinador", "")
            ws[f"H{row_idx}"].alignment = Alignment(horizontal="center", vertical="center")

            # Valores Monetarios
            val_s = float(s.get("valor_servicios", 0) or 0)
            ws[f"I{row_idx}"] = val_s if s else None
            ws[f"I{row_idx}"].number_format = '"$" #,##0'
            ws[f"I{row_idx}"].alignment = Alignment(horizontal="right", vertical="center")

            val_v = float(s.get("valor_viaticos", 0) or 0)
            ws[f"J{row_idx}"] = val_v if s else None
            ws[f"J{row_idx}"].number_format = '"$" #,##0'
            ws[f"J{row_idx}"].alignment = Alignment(horizontal="right", vertical="center")

            val_m = float(s.get("valor_materiales", 0) or 0)
            ws[f"K{row_idx}"] = val_m if s else None
            ws[f"K{row_idx}"].number_format = '"$" #,##0'
            ws[f"K{row_idx}"].alignment = Alignment(horizontal="right", vertical="center")

            for col_l in ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]:
                ws[f"{col_l}{row_idx}"].font = font_regular
                ws[f"{col_l}{row_idx}"].border = border_cell

        # Fila de Totales
        fila_total = fila_inicio + num_filas
        ws.row_dimensions[fila_total].height = 22
        ws[f"I{fila_total}"] = f"=SUM(I{fila_inicio}:I{fila_total - 1})"
        ws[f"I{fila_total}"].number_format = '"$" #,##0'
        ws[f"I{fila_total}"].font = font_bold
        ws[f"I{fila_total}"].alignment = Alignment(horizontal="right", vertical="center")
        ws[f"I{fila_total}"].border = border_cell

        ws[f"J{fila_total}"] = f"=SUM(J{fila_inicio}:J{fila_total - 1})"
        ws[f"J{fila_total}"].number_format = '"$" #,##0'
        ws[f"J{fila_total}"].font = font_bold
        ws[f"J{fila_total}"].alignment = Alignment(horizontal="right", vertical="center")
        ws[f"J{fila_total}"].border = border_cell

        ws[f"K{fila_total}"] = f"=SUM(K{fila_inicio}:K{fila_total - 1})"
        ws[f"K{fila_total}"].number_format = '"$" #,##0'
        ws[f"K{fila_total}"].font = font_bold
        ws[f"K{fila_total}"].alignment = Alignment(horizontal="right", vertical="center")
        ws[f"K{fila_total}"].border = border_cell

        # Fila de firma
        ws[f"B{fila_total + 3}"] = "FIRMA _______________________________________"
        ws[f"B{fila_total + 3}"].font = font_bold

        wb.save(self.filename)
        return self.filename
