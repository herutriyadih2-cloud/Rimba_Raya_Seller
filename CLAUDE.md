# RIMBA RAYA SELLER — Catatan Project

## Apa ini
Aplikasi pembukuan untuk usaha **penjualan voucher WiFi ke reseller/agen**.
Satu halaman web mandiri, tanpa server, tanpa internet. Dibuka langsung dari file.

Pemilik usaha mencatat: reseller mana, tanggal berapa, beli berapa voucher di tiap
nominal, dan harga per voucher. Aplikasi menghitung total dan membuat laporan
Excel/PDF.

**Bukan** aplikasi kasir dan **bukan** pencatat penjualan ke pengguna akhir.
Tidak ada konsep "stok", "terjual", atau "laba" — itu pernah ada lalu dibuang
karena tidak sesuai cara kerja usahanya.

## Struktur
```
web/index.html          Seluruh aplikasi: HTML + CSS + JS dalam satu file
web/assets/             Library pihak ketiga, SEMUA lokal
tests/                  Pemeriksaan otomatis (Node.js)
docs/                   Tangkapan layar
template-excel/         Script Python pembuat template Excel (terpisah dari web)
```

## Aturan yang tidak boleh dilanggar

**1. Jangan pernah pakai CDN.**
Bootstrap, Font Awesome, font Inter, ExcelJS, Chart.js, jsPDF, jspdf-autotable —
semuanya sudah ada di `web/assets/`. Aplikasi ini dipakai di tempat yang
internetnya tidak bisa diandalkan. Pernah dulu pakai CDN: tanpa internet ikon
hilang dan export PDF gagal total. Kalau menambah library, unduh ke `assets/`.
Naikkan angka cache-busting `?v=N` di `index.html` setiap kali aset diganti.

**2. Jangan anggap selesai sebelum tes lulus.**
```
cd tests
npm install        # sekali saja
npm test           # harus: 41 LULUS, 0 GAGAL
```
`e2e.js` menjalankan aplikasi di Chrome sungguhan, lalu **membuka kembali file
.xlsx dan .pdf hasil unduhan** untuk memeriksa isinya. Membaca kode saja tidak
cukup — beberapa bug di project ini hanya ketahuan dari file hasilnya.

**3. Data pengguna sakral.**
Pembukuan tersimpan di `localStorage` kunci `pembukuan_voucher_wifi_v2`.
Jangan ubah format record tanpa jalur migrasi, jangan hapus data tanpa
konfirmasi, dan pastikan `parseBackup()` tetap menerima file cadangan lama.

## Model data
Satu record = satu kombinasi **reseller + tanggal + nominal**. Menyimpan satu
transaksi selalu membuat/menimpa 4 record (karena ada 4 nominal). Jumlah 0 tetap
dicatat supaya laporan setiap reseller lengkap barisnya.

```js
{ id, reseller, tanggal, nominal, nominalLabel, qty, harga, total }
```

Nominal & harga beli default ada di array `nominalList` di dalam `index.html`:
Rp 2.000→1.600 · Rp 3.000→2.400 · Rp 5.000→4.000 · Rp 75.000→70.000.
Menambah nominal cukup menambah entri di array ini, tapi **periksa juga**
`applyData()` di `exportExcel` yang masih menentukan perataan kolom lewat
nomor kolom.

## Jebakan yang pernah menggigit

- **`workbook.addImage()` mengembalikan `0`** untuk gambar pertama. Memeriksanya
  dengan `if (chartImageId)` membuat grafik tidak pernah tersemat karena `0`
  bernilai falsy. Harus `if (chartImageId !== null)`.
- Pernah ditambahkan sheet Sampul + `pageSetup` landscape fit-to-page pada export
  Excel, hasilnya **file kosong/terpotong**. Sudah direvert. Kalau mau dicoba lagi,
  wajib lewat `tests/e2e.js`.
- Export Excel memakai **rumus** (Total, Subtotal, Grand Total). ExcelJS membacanya sebagai
  `{ formula, result }`, bukan angka — tes harus membaca `.result`.
- Tema laporan Excel & PDF (hitam/arang + aksen emas) dipusatkan di konstanta `TEMA`;
  angka turunan, penjelasan, dan gambar grafik dibuat sekali oleh `siapkanLaporan()` dan
  dipakai bersama `exportExcel` & `exportPDF`. Ubah warna/isi di sana, jangan di dua tempat.
- Nama reseller diketik bebas lalu masuk `innerHTML`. Selalu lewat `escapeHtml()`.

## Gaya penulisan
- Komentar dan teks antarmuka dalam **bahasa Indonesia**.
- Indentasi 4 spasi di `index.html`, 2 spasi di file tes.
- Tidak ada build step. Edit `index.html`, muat ulang browser, selesai.

## Sejarah singkat
Project ini dimulai dengan asisten AI lain (Kimi) di folder
`Documents\Project_Pembukuan_Voucher_WiFi`. Folder itu **diarsipkan** dan tidak
lagi dikembangkan. Project ini adalah kelanjutannya yang bersih, mulai dari
riwayat git baru pada 1 Oktober 2026.
