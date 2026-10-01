from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation
from datetime import datetime

# --- Setup workbook ---
wb = Workbook()

# Styles
header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
header_font = Font(bold=True, color="FFFFFF", size=11)
subheader_fill = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
subheader_font = Font(bold=True, size=10)
title_font = Font(bold=True, size=14, color="1F4E78")
normal_font = Font(size=10)
center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)
thin_border = Border(
    left=Side(style="thin"), right=Side(style="thin"),
    top=Side(style="thin"), bottom=Side(style="thin")
)

money_fmt = '"Rp "#,##0'
date_fmt = 'DD/MM/YYYY'
num_fmt = '#,##0'

# Helper: apply header style
def style_header(ws, row, cols):
    for col in range(1, cols + 1):
        cell = ws.cell(row=row, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border

# Helper: apply border to range
def apply_border(ws, min_row, max_row, min_col, max_col):
    for row in ws.iter_rows(min_row=min_row, max_row=max_row, min_col=min_col, max_col=max_col):
        for cell in row:
            cell.border = thin_border
            cell.font = normal_font
            cell.alignment = center_align

# Helper: set column widths
def set_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w

# ============================================================
# SHEET 1: PETUNJUK
# ============================================================
ws1 = wb.active
ws1.title = "Petunjuk"
ws1.merge_cells("A1:C1")
ws1["A1"] = "MODUL PEMBUKUAN PENJUALAN VOUCHER WiFi"
ws1["A1"].font = title_font
ws1["A1"].alignment = center_align

petunjuk = [
    ("",),
    ("CARA PENGGUNAAN:",),
    ("1. Sheet 'Stok Voucher'", "Isi daftar nominal voucher, stok awal, dan stok masuk. Stok terjual akan ter-update otomatis dari sheet Transaksi."),
    ("2. Sheet 'Transaksi'", "Catat setiap penjualan voucher. Kolom Total, Modal, dan Laba akan dihitung otomatis."),
    ("3. Sheet 'Rekap Harian'", "Ringkasan penjualan per hari, dihitung otomatis dari data transaksi."),
    ("4. Sheet 'Rekap Bulanan'", "Ringkasan penjualan per bulan, dihitung otomatis dari data transaksi."),
    ("",),
    ("TIPS:",),
    ("- Gunakan dropdown Metode Pembayaran & Status untuk menghindari typo.",),
    ("- Jangan hapus baris/header dengan formula agar rekap tetap berjalan.",),
    ("- Simpan file dengan nama berbeda setiap periode (contoh: Pembukuan_Oktober2026.xlsx).",),
    ("",),
    ("Dibuat pada:", str(datetime.now().strftime("%d %B %Y"))),
]

for r, row_data in enumerate(petunjuk, 3):
    for c, val in enumerate(row_data, 1):
        cell = ws1.cell(row=r, column=c, value=val)
        cell.font = Font(bold=(c == 1 and r in [4, 11]), size=10)
        cell.alignment = left_align

ws1.column_dimensions["A"].width = 30
ws1.column_dimensions["B"].width = 70
ws1.column_dimensions["C"].width = 20

# ============================================================
# SHEET 2: STOK VOUCHER
# ============================================================
ws2 = wb.create_sheet("Stok Voucher")
headers_stok = ["No", "Nominal Voucher", "Stok Awal", "Stok Masuk", "Stok Terjual", "Sisa Stok", "Harga Modal", "Harga Jual", "Keterangan"]
for c, h in enumerate(headers_stok, 1):
    ws2.cell(row=1, column=c, value=h)
style_header(ws2, 1, len(headers_stok))

# Sample data
sample_stok = [
    [1, 2000, 100, 50, 0, "=C2+D2-E2", 1500, 2000, ""],
    [2, 3000, 100, 50, 0, "=C3+D3-E3", 2500, 3000, ""],
    [3, 5000, 100, 50, 0, "=C4+D4-E4", 4000, 5000, ""],
    [4, 10000, 50, 30, 0, "=C5+D5-E5", 8500, 10000, ""],
    [5, 20000, 50, 30, 0, "=C6+D6-E6", 18000, 20000, ""],
    [6, 50000, 20, 20, 0, "=C7+D7-E7", 47000, 50000, ""],
    [7, 100000, 10, 10, 0, "=C8+D8-E8", 95000, 100000, ""],
]

for r, row_data in enumerate(sample_stok, 2):
    for c, val in enumerate(row_data, 1):
        cell = ws2.cell(row=r, column=c, value=val)
        cell.border = thin_border
        cell.alignment = center_align
        if c in [3, 4, 5, 6, 7, 8]:
            cell.number_format = num_fmt if c in [3,4,5,6] else money_fmt

# Stok Terjual formula akan di-update manual atau via VBA, di sini kita set 0 saja
ws2["E2"] = 0
ws2["E3"] = 0
ws2["E4"] = 0
ws2["E5"] = 0
ws2["E6"] = 0
ws2["E7"] = 0
ws2["E8"] = 0

set_widths(ws2, [5, 18, 12, 12, 13, 12, 14, 13, 20])

# ============================================================
# SHEET 3: TRANSAKSI
# ============================================================
ws3 = wb.create_sheet("Transaksi")
headers_trans = [
    "No", "Tanggal", "Nominal Voucher", "Jumlah", "Harga Modal",
    "Harga Jual", "Total Penjualan", "Total Modal", "Laba Kotor",
    "Metode Pembayaran", "Status", "Nama Pelanggan", "Keterangan"
]
for c, h in enumerate(headers_trans, 1):
    ws3.cell(row=1, column=c, value=h)
style_header(ws3, 1, len(headers_trans))

# Sample rows
for r in range(2, 102):
    ws3.cell(row=r, column=1, value=r-1).border = thin_border
    ws3.cell(row=r, column=2).border = thin_border
    ws3.cell(row=r, column=2).number_format = date_fmt
    ws3.cell(row=r, column=3).border = thin_border
    ws3.cell(row=r, column=3).number_format = money_fmt
    ws3.cell(row=r, column=4).border = thin_border
    ws3.cell(row=r, column=5).border = thin_border
    ws3.cell(row=r, column=5).number_format = money_fmt
    ws3.cell(row=r, column=6).border = thin_border
    ws3.cell(row=r, column=6).number_format = money_fmt
    ws3.cell(row=r, column=7, value=f"=D{r}*F{r}").border = thin_border
    ws3.cell(row=r, column=7).number_format = money_fmt
    ws3.cell(row=r, column=8, value=f"=D{r}*E{r}").border = thin_border
    ws3.cell(row=r, column=8).number_format = money_fmt
    ws3.cell(row=r, column=9, value=f"=G{r}-H{r}").border = thin_border
    ws3.cell(row=r, column=9).number_format = money_fmt
    ws3.cell(row=r, column=10).border = thin_border
    ws3.cell(row=r, column=11).border = thin_border
    ws3.cell(row=r, column=12).border = thin_border
    ws3.cell(row=r, column=13).border = thin_border

# Dropdown Metode Pembayaran
dv_pay = DataValidation(type="list", formula1='"Cash,Transfer,Qris,Kredit"', allow_blank=True)
dv_pay.error = "Pilih dari dropdown"
dv_pay.errorTitle = "Metode Pembayaran"
ws3.add_data_validation(dv_pay)
dv_pay.add(f"J2:J102")

# Dropdown Status
dv_status = DataValidation(type="list", formula1='"Lunas,Belum Lunas"', allow_blank=True)
dv_status.error = "Pilih dari dropdown"
dv_status.errorTitle = "Status"
ws3.add_data_validation(dv_status)
dv_status.add(f"K2:K102")

set_widths(ws3, [5, 13, 18, 10, 14, 13, 17, 14, 14, 20, 14, 18, 22])

# ============================================================
# SHEET 4: REKAP HARIAN
# ============================================================
ws4 = wb.create_sheet("Rekap Harian")
ws4.merge_cells("A1:H1")
ws4["A1"] = "REKAP PENJUALAN HARIAN"
ws4["A1"].font = title_font
ws4["A1"].alignment = center_align

headers_harian = ["No", "Tanggal", "Total Transaksi", "Jumlah Voucher Terjual", "Total Penjualan", "Total Modal", "Laba Kotor", "Status Belum Lunas"]
for c, h in enumerate(headers_harian, 1):
    ws4.cell(row=3, column=c, value=h)
style_header(ws4, 3, len(headers_harian))

# Generate 31 rows dates
for r in range(4, 35):
    ws4.cell(row=r, column=1, value=r-3).border = thin_border
    ws4.cell(row=r, column=2, value=f"=DATE(YEAR(TODAY()),MONTH(TODAY()),{r-3})").border = thin_border
    ws4.cell(row=r, column=2).number_format = date_fmt
    ws4.cell(row=r, column=3, value=f"=COUNTIF(Transaksi!$B$2:$B$102,B{r})").border = thin_border
    ws4.cell(row=r, column=4, value=f"=SUMIF(Transaksi!$B$2:$B$102,B{r},Transaksi!$D$2:$D$102)").border = thin_border
    ws4.cell(row=r, column=5, value=f"=SUMIF(Transaksi!$B$2:$B$102,B{r},Transaksi!$G$2:$G$102)").border = thin_border
    ws4.cell(row=r, column=5).number_format = money_fmt
    ws4.cell(row=r, column=6, value=f"=SUMIF(Transaksi!$B$2:$B$102,B{r},Transaksi!$H$2:$H$102)").border = thin_border
    ws4.cell(row=r, column=6).number_format = money_fmt
    ws4.cell(row=r, column=7, value=f"=E{r}-F{r}").border = thin_border
    ws4.cell(row=r, column=7).number_format = money_fmt
    ws4.cell(row=r, column=8, value=f"=SUMIFS(Transaksi!$G$2:$G$102,Transaksi!$B$2:$B$102,B{r},Transaksi!$K$2:$K$102,\"Belum Lunas\")").border = thin_border
    ws4.cell(row=r, column=8).number_format = money_fmt

# Total
last_row = 35
ws4.cell(row=last_row, column=2, value="TOTAL").font = Font(bold=True)
ws4.cell(row=last_row, column=3, value=f"=SUM(C4:C34)").border = thin_border
ws4.cell(row=last_row, column=4, value=f"=SUM(D4:D34)").border = thin_border
ws4.cell(row=last_row, column=5, value=f"=SUM(E4:E34)").border = thin_border
ws4.cell(row=last_row, column=5).number_format = money_fmt
ws4.cell(row=last_row, column=6, value=f"=SUM(F4:F34)").border = thin_border
ws4.cell(row=last_row, column=6).number_format = money_fmt
ws4.cell(row=last_row, column=7, value=f"=SUM(G4:G34)").border = thin_border
ws4.cell(row=last_row, column=7).number_format = money_fmt
ws4.cell(row=last_row, column=8, value=f"=SUM(H4:H34)").border = thin_border
ws4.cell(row=last_row, column=8).number_format = money_fmt
apply_border(ws4, last_row, last_row, 1, 8)
for c in range(1, 9):
    ws4.cell(row=last_row, column=c).font = Font(bold=True, size=10)
    ws4.cell(row=last_row, column=c).alignment = center_align

set_widths(ws4, [5, 13, 17, 22, 17, 15, 14, 20])

# ============================================================
# SHEET 5: REKAP BULANAN
# ============================================================
ws5 = wb.create_sheet("Rekap Bulanan")
ws5.merge_cells("A1:G1")
ws5["A1"] = "REKAP PENJUALAN BULANAN"
ws5["A1"].font = title_font
ws5["A1"].alignment = center_align

headers_bulanan = ["No", "Bulan", "Jumlah Voucher Terjual", "Total Penjualan", "Total Modal", "Laba Kotor", "Piutang Belum Lunas"]
for c, h in enumerate(headers_bulanan, 1):
    ws5.cell(row=3, column=c, value=h)
style_header(ws5, 3, len(headers_bulanan))

bulan_list = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
for r, bln in enumerate(bulan_list, 4):
    ws5.cell(row=r, column=1, value=r-3).border = thin_border
    ws5.cell(row=r, column=2, value=bln).border = thin_border
    ws5.cell(row=r, column=3, value=f"=SUMPRODUCT((MONTH(Transaksi!$B$2:$B$102)={r-3})*(Transaksi!$D$2:$D$102))").border = thin_border
    ws5.cell(row=r, column=4, value=f"=SUMPRODUCT((MONTH(Transaksi!$B$2:$B$102)={r-3})*(Transaksi!$G$2:$G$102))").border = thin_border
    ws5.cell(row=r, column=4).number_format = money_fmt
    ws5.cell(row=r, column=5, value=f"=SUMPRODUCT((MONTH(Transaksi!$B$2:$B$102)={r-3})*(Transaksi!$H$2:$H$102))").border = thin_border
    ws5.cell(row=r, column=5).number_format = money_fmt
    ws5.cell(row=r, column=6, value=f"=D{r}-E{r}").border = thin_border
    ws5.cell(row=r, column=6).number_format = money_fmt
    ws5.cell(row=r, column=7, value=f"=SUMPRODUCT((MONTH(Transaksi!$B$2:$B$102)={r-3})*(Transaksi!$K$2:$K$102=\"Belum Lunas\")*(Transaksi!$G$2:$G$102))").border = thin_border
    ws5.cell(row=r, column=7).number_format = money_fmt

# Total
last_row2 = 16
ws5.cell(row=last_row2, column=2, value="TOTAL").font = Font(bold=True)
ws5.cell(row=last_row2, column=3, value="=SUM(C4:C15)").border = thin_border
ws5.cell(row=last_row2, column=4, value="=SUM(D4:D15)").border = thin_border
ws5.cell(row=last_row2, column=4).number_format = money_fmt
ws5.cell(row=last_row2, column=5, value="=SUM(E4:E15)").border = thin_border
ws5.cell(row=last_row2, column=5).number_format = money_fmt
ws5.cell(row=last_row2, column=6, value="=SUM(F4:F15)").border = thin_border
ws5.cell(row=last_row2, column=6).number_format = money_fmt
ws5.cell(row=last_row2, column=7, value="=SUM(G4:G15)").border = thin_border
ws5.cell(row=last_row2, column=7).number_format = money_fmt
apply_border(ws5, last_row2, last_row2, 1, 7)
for c in range(1, 8):
    ws5.cell(row=last_row2, column=c).font = Font(bold=True, size=10)
    ws5.cell(row=last_row2, column=c).alignment = center_align

set_widths(ws5, [5, 14, 24, 18, 15, 14, 22])

# ============================================================
# SIMPAN
# ============================================================
output_path = r"C:\Users\drago\Documents\Modul_Pembukuan_Voucher_WiFi.xlsx"
wb.save(output_path)
print(f"File berhasil dibuat: {output_path}")
