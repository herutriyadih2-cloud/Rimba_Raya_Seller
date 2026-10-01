// Uji end-to-end di Chrome sungguhan: input, edit, hapus, backup, restore, export Excel & PDF.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = 'file:///' + path.join(__dirname, '..', 'web', 'index.html').replace(/\\/g, '/');
const DL = fs.mkdtempSync(path.join(os.tmpdir(), 'rrs-dl-'));

let lulus = 0, gagal = 0;
function cek(nama, ok, detail) {
  if (ok) { lulus++; console.log('OK    ' + nama); }
  else { gagal++; console.log('GAGAL ' + nama + (detail ? ' -> ' + detail : '')); }
}

const tungguUnduhan = (ext, timeout = 20000) => new Promise((res, rej) => {
  const mulai = Date.now();
  const t = setInterval(() => {
    const f = fs.readdirSync(DL).filter(n => n.endsWith(ext));
    if (f.length) { clearInterval(t); res(path.join(DL, f[0])); }
    else if (Date.now() - mulai > timeout) { clearInterval(t); rej(new Error('unduhan ' + ext + ' tidak muncul')); }
  }, 250);
});

async function isiForm(page, nama, tanggal, qtyHarga) {
  await page.evaluate((nama, tanggal, qh) => {
    document.getElementById('namaReseller').value = nama;
    document.getElementById('tanggal').value = tanggal;
    Object.entries(qh).forEach(([k, v]) => {
      document.getElementById('qty' + k).value = v[0];
      document.getElementById('harga' + k).value = v[1];
    });
  }, nama, tanggal, qtyHarga);
  await page.click('#btnSimpan');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const errorKonsol = [];
  page.on('pageerror', e => errorKonsol.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errorKonsol.push('console.error: ' + m.text()); });
  page.on('requestfailed', r => errorKonsol.push('request gagal: ' + r.url()));
  page.on('dialog', async d => { await d.accept(); });   // terima alert/confirm

  await page._client().send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
  await page.goto(PAGE, { waitUntil: 'networkidle0' });

  // 1. halaman bersih saat dimuat
  cek('halaman dimuat tanpa error', errorKonsol.length === 0, errorKonsol.join(' ; '));

  // 2. library lokal benar-benar termuat (bukti tidak butuh internet)
  const lib = await page.evaluate(() => ({
    exceljs: typeof ExcelJS !== 'undefined',
    chart: typeof Chart !== 'undefined',
    jspdf: !!(window.jspdf && window.jspdf.jsPDF),
    bootstrap: typeof bootstrap !== 'undefined',
    fontAwesome: [...document.styleSheets].some(s => (s.href || '').includes('fontawesome'))
  }));
  Object.entries(lib).forEach(([k, v]) => cek('library termuat lokal: ' + k, v));

  // 3. autoTable (plugin PDF) terpasang
  cek('plugin jsPDF autoTable aktif',
    await page.evaluate(() => typeof new window.jspdf.jsPDF().autoTable === 'function'));

  // 4. input transaksi
  await page.evaluate(() => { localStorage.clear(); transactions = []; renderTable(); });
  await isiForm(page, 'Budi Agen', '2026-09-28', { 2000: [10, 1600], 3000: [5, 2400], 5000: [0, 4000], 75000: [2, 70000] });
  await isiForm(page, 'Siti Agen', '2026-09-29', { 2000: [20, 1600], 3000: [0, 2400], 5000: [4, 4000], 75000: [1, 70000] });

  let s = await page.evaluate(() => ({
    baris: transactions.length,
    totalNilai: document.getElementById('totalNilai').textContent,
    totalQty: document.getElementById('totalQty').textContent,
    reseller: document.getElementById('totalReseller').textContent
  }));
  // Budi: 10*1600 + 5*2400 + 0 + 2*70000 = 16000+12000+140000 = 168000 (17 pcs)
  // Siti: 20*1600 + 0 + 4*4000 + 1*70000 = 32000+16000+70000 = 118000 (25 pcs)
  cek('2 transaksi = 8 baris (4 nominal x 2)', s.baris === 8, 'dapat ' + s.baris);
  cek('total nilai = Rp 286.000', s.totalNilai === 'Rp 286.000', s.totalNilai);
  cek('total qty = 42 pcs', s.totalQty === '42 pcs', s.totalQty);
  cek('jumlah reseller = 2', s.reseller === '2', s.reseller);

  // 5. nama reseller berisi HTML tidak boleh merusak tabel
  await isiForm(page, '<img src=x onerror=alert(1)>', '2026-09-30', { 2000: [1, 1600], 3000: [0, 2400], 5000: [0, 4000], 75000: [0, 70000] });
  const xss = await page.evaluate(() => ({
    imgNakal: document.querySelectorAll('#tbodyTransaksi img').length,
    tampilApaAdanya: [...document.querySelectorAll('#tbodyTransaksi td')]
      .some(td => td.textContent.includes('<img src=x'))
  }));
  cek('nama HTML tidak jadi elemen nyata', xss.imgNakal === 0);
  cek('nama HTML ditampilkan apa adanya sebagai teks', xss.tampilApaAdanya);
  await page.evaluate(() => {
    transactions = transactions.filter(t => !t.reseller.includes('<img'));
    saveData(); renderTable();
  });

  // 6. EDIT: ubah qty Budi 10 -> 30, dan ganti namanya
  await page.evaluate(() => {
    const t = transactions.find(x => x.reseller === 'Budi Agen' && x.nominal === 2000);
    editTransaksi(t.id);
  });
  const formTerisi = await page.evaluate(() => ({
    nama: document.getElementById('namaReseller').value,
    tgl: document.getElementById('tanggal').value,
    q2000: document.getElementById('qty2000').value,
    q75000: document.getElementById('qty75000').value,
    banner: !document.getElementById('editBanner').classList.contains('d-none'),
    tombol: document.getElementById('btnSimpan').textContent.trim()
  }));
  cek('edit memuat ulang data ke form', formTerisi.nama === 'Budi Agen' && formTerisi.tgl === '2026-09-28'
    && formTerisi.q2000 === '10' && formTerisi.q75000 === '2', JSON.stringify(formTerisi));
  cek('banner mode edit muncul', formTerisi.banner);
  cek('tombol berubah jadi "Perbarui Transaksi"', formTerisi.tombol === 'Perbarui Transaksi', formTerisi.tombol);

  await isiForm(page, 'Budi Reseller', '2026-09-28', { 2000: [30, 1600], 3000: [5, 2400], 5000: [0, 4000], 75000: [2, 70000] });
  s = await page.evaluate(() => ({
    baris: transactions.length,
    adaNamaLama: transactions.some(t => t.reseller === 'Budi Agen'),
    total: document.getElementById('totalNilai').textContent,
    tombol: document.getElementById('btnSimpan').textContent.trim(),
    banner: document.getElementById('editBanner').classList.contains('d-none')
  }));
  // Budi baru: 30*1600 + 5*2400 + 2*70000 = 48000+12000+140000 = 200000 ; + Siti 118000 = 318000
  cek('edit ganti nama tidak menduplikasi baris', s.baris === 8, 'dapat ' + s.baris);
  cek('data reseller lama terhapus setelah rename', s.adaNamaLama === false);
  cek('total ikut diperbarui jadi Rp 318.000', s.total === 'Rp 318.000', s.total);
  cek('form kembali ke mode tambah setelah simpan', s.tombol === 'Simpan Transaksi' && s.banner);

  // 7. BACKUP
  await page.click('button[onclick="backupData()"]');
  const fileBackup = await tungguUnduhan('.json');
  const isi = JSON.parse(fs.readFileSync(fileBackup, 'utf8'));
  cek('file cadangan .json terunduh', fs.statSync(fileBackup).size > 0);
  cek('cadangan berisi 8 baris', isi.transactions.length === 8, 'dapat ' + (isi.transactions || []).length);
  cek('cadangan mencatat versi & tanggal', isi.version === 1 && !!isi.dibuat);

  // 8. RESTORE (mode GANTI, karena dialog otomatis di-accept)
  await page.evaluate(() => { transactions = []; saveData(); renderTable(); });
  const input = await page.$('#fileRestore');
  await input.uploadFile(fileBackup);
  await new Promise(r => setTimeout(r, 1200));
  s = await page.evaluate(() => ({
    baris: transactions.length,
    total: document.getElementById('totalNilai').textContent
  }));
  cek('restore mengembalikan 8 baris', s.baris === 8, 'dapat ' + s.baris);
  cek('restore mengembalikan total Rp 318.000', s.total === 'Rp 318.000', s.total);

  // 9. restore file rusak harus ditolak, bukan bikin data hilang
  const fileRusak = path.join(DL, 'rusak.json');
  fs.writeFileSync(fileRusak, '{"transactions":[{"reseller":"X"}]}');
  await (await page.$('#fileRestore')).uploadFile(fileRusak);
  await new Promise(r => setTimeout(r, 800));
  cek('file cadangan rusak ditolak tanpa merusak data',
    await page.evaluate(() => transactions.length === 8));

  // 10. EXPORT EXCEL
  errorKonsol.length = 0;
  await page.select('#exportFormat', 'excel');
  await page.select('#exportData', 'all');
  await page.click('button[onclick="prosesExport()"]');
  const fileXlsx = await tungguUnduhan('.xlsx', 30000);
  cek('file Excel terunduh', fs.statSync(fileXlsx).size > 5000, fs.statSync(fileXlsx).size + ' bytes');

  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(fileXlsx);
  const namaSheet = wb.worksheets.map(w => w.name);
  cek('Excel punya 3 sheet yang benar',
    namaSheet.join(',') === 'Rekap Harian per Reseller,Ringkasan Reseller,Grafik Penjualan', namaSheet.join(','));

  const ws = wb.getWorksheet('Rekap Harian per Reseller');
  let barisIsi = 0, grandTotal = null;
  ws.eachRow({ includeEmpty: false }, row => {
    barisIsi++;
    if (String(row.getCell(1).value).includes('GRAND TOTAL')) grandTotal = row.getCell(7).value;
  });
  cek('sheet rekap tidak kosong/terpotong', barisIsi >= 13, barisIsi + ' baris');
  cek('GRAND TOTAL di Excel = 318000', grandTotal === 318000, String(grandTotal));
  // bukan cuma ada di media â€” grafiknya harus benar-benar terpasang di dalam sheet
  cek('grafik benar-benar terpasang di sheet rekap', ws.getImages().length === 1,
    'gambar di sheet: ' + ws.getImages().length);
  const wsGrafik = wb.getWorksheet('Grafik Penjualan');
  cek('grafik terpasang di sheet "Grafik Penjualan"',
    !!wsGrafik && wsGrafik.getImages().length === 1,
    wsGrafik ? 'gambar: ' + wsGrafik.getImages().length : 'sheet tidak ada');

  const wsRingkas = wb.getWorksheet('Ringkasan Reseller');
  let totalRingkas = null;
  wsRingkas.eachRow(r => { if (String(r.getCell(1).value) === 'TOTAL') totalRingkas = r.getCell(3).value; });
  cek('TOTAL di sheet Ringkasan = 318000', totalRingkas === 318000, String(totalRingkas));

  // 11. EXPORT PDF
  await page.select('#exportFormat', 'pdf');
  await page.click('button[onclick="prosesExport()"]');
  const filePdf = await tungguUnduhan('.pdf', 30000);
  const bufPdf = fs.readFileSync(filePdf);
  cek('file PDF terunduh', bufPdf.length > 3000, bufPdf.length + ' bytes');
  cek('file PDF berformat valid', bufPdf.slice(0, 5).toString() === '%PDF-');

  cek('tidak ada error JS selama export', errorKonsol.length === 0, errorKonsol.join(' ; '));

  // 12. filter periode
  const hariIni = new Date().toISOString().slice(0, 10);
  await isiForm(page, 'Agen Hari Ini', hariIni, { 2000: [5, 1600], 3000: [0, 2400], 5000: [0, 4000], 75000: [0, 70000] });
  const f = await page.evaluate(() => ({
    semua: filterTransactions(transactions, 'all').length,
    hariIni: filterTransactions(transactions, 'today').length,
    bulanIni: filterTransactions(transactions, 'month').length
  }));
  cek('filter "Semua Waktu" = 12 baris', f.semua === 12, String(f.semua));
  cek('filter "Hari Ini" = 4 baris', f.hariIni === 4, String(f.hariIni));

  await browser.close();
  fs.rmSync(DL, { recursive: true, force: true });

  console.log(`\n=== ${lulus} LULUS, ${gagal} GAGAL ===`);
  process.exit(gagal === 0 ? 0 : 1);
})().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
