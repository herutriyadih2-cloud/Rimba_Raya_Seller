// Ambil tangkapan layar website dengan data contoh, untuk dokumentasi.
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PAGE = 'file:///' + path.join(__dirname, '..', 'web', 'index.html').replace(/\\/g, '/');
const OUT = path.join(__dirname, '..', 'docs', 'tampilan-website.png');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
  page.on('dialog', async d => { await d.accept(); });
  await page.goto(PAGE, { waitUntil: 'networkidle0' });

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
  await page.screenshot({ path: OUT, fullPage: true });
  console.log('Tangkapan layar disimpan: ' + OUT);
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
