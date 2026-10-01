// Ambil tangkapan layar cepat untuk dilihat bersama di percakapan.
// Pakai:  npm run lihat                  -> halaman apa adanya (kosong, Chrome baru)
//         npm run lihat -- --contoh      -> isi dulu dengan data contoh
//         npm run lihat -- --lebar=420   -> ukuran layar HP
// Hasil: ../tmp-screenshot/lihat.png (folder ini tidak masuk git)
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = 'file:///' + path.join(__dirname, '..', 'web', 'index.html').replace(/\\/g, '/');
const DIR = path.join(__dirname, '..', 'tmp-screenshot');
const OUT = path.join(DIR, 'lihat.png');

const args = process.argv.slice(2);
const pakaiContoh = args.includes('--contoh');
const lebarArg = args.find(a => a.startsWith('--lebar='));
const lebar = lebarArg ? Number(lebarArg.split('=')[1]) : 1400;

(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: lebar, height: 900, deviceScaleFactor: 1 });
  page.on('dialog', async d => { await d.accept(); });
  page.on('pageerror', e => console.log('Galat di halaman: ' + e.message));
  await page.goto(PAGE, { waitUntil: 'networkidle0' });

  if (pakaiContoh) {
    await page.evaluate(() => {
      localStorage.clear();
      transactions = [];
      const contoh = [
        ['Budi Reseller', '2026-09-28', { 2000: [30, 1600], 3000: [5, 2400], 5000: [0, 4000], 75000: [2, 70000] }],
        ['Siti Agen',     '2026-09-29', { 2000: [20, 1600], 3000: [0, 2400], 5000: [4, 4000], 75000: [1, 70000] }],
        ['Warung Pak De', '2026-09-30', { 2000: [12, 1600], 3000: [8, 2400], 5000: [3, 4000], 75000: [0, 70000] }]
      ];
      contoh.forEach(([nama, tgl, qh]) => {
        Object.entries(qh).forEach(([key, [qty, harga]]) => {
          const n = nominalList.find(x => x.key === Number(key));
          transactions.push({
            id: Date.now() + Math.random(), reseller: nama, tanggal: tgl,
            nominal: n.key, nominalLabel: n.label, qty, harga, total: qty * harga
          });
        });
      });
      saveData();
      renderTable();
    });
    await new Promise(r => setTimeout(r, 600));
  }

  await page.screenshot({ path: OUT, fullPage: true });
  console.log('Tangkapan layar disimpan: ' + OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
