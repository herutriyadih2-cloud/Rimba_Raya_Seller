// Verifikasi index.html: sintaks JS, sisa CDN, dan keberadaan file aset.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const webDir = path.join(__dirname, '..', 'web');
const htmlPath = path.join(webDir, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
let gagal = 0;

// --- 1. sintaks script inline ---
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
inline.forEach((m, i) => {
  try {
    new vm.Script(m[1], { filename: `inline-script-${i + 1}.js` });
    console.log(`OK   sintaks script inline #${i + 1} (${m[1].split('\n').length} baris)`);
  } catch (e) {
    gagal++;
    console.log(`GAGAL sintaks script inline #${i + 1}: ${e.message}`);
  }
});

// --- 2. sisa referensi CDN / internet ---
const remote = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map(m => m[1]);
if (remote.length === 0) {
  console.log('OK   tidak ada referensi CDN tersisa');
} else {
  gagal++;
  remote.forEach(u => console.log('GAGAL masih memuat dari internet: ' + u));
}

// --- 3. semua aset lokal yang dirujuk benar-benar ada ---
const local = [...html.matchAll(/(?:src|href)="((?!https?:|#|data:)[^"]+)"/g)].map(m => m[1]);
local.forEach(ref => {
  const f = path.join(webDir, ref.split('?')[0]);
  if (fs.existsSync(f)) {
    console.log(`OK   aset ada: ${ref}`);
  } else {
    gagal++;
    console.log(`GAGAL aset hilang: ${ref}`);
  }
});

// --- 4. aset yang dirujuk dari dalam file CSS (font) ---
['assets/css/fontawesome.min.css', 'assets/css/inter.css', 'assets/css/bootstrap.min.css'].forEach(cssRef => {
  const cssFile = path.join(webDir, cssRef);
  if (!fs.existsSync(cssFile)) return;
  const css = fs.readFileSync(cssFile, 'utf8');
  const urls = new Set([...css.matchAll(/url\(([^)]+)\)/g)]
    .map(m => m[1].replace(/['"]/g, ''))
    .filter(u => !u.startsWith('data:') && !u.startsWith('http')));
  let hilang = 0;
  urls.forEach(u => {
    const f = path.resolve(path.dirname(cssFile), u.split('?')[0]);
    if (!fs.existsSync(f)) { hilang++; console.log(`GAGAL font hilang (${cssRef}): ${u}`); }
  });
  if (hilang === 0) console.log(`OK   semua ${urls.size} font lokal ada untuk ${cssRef}`);
  else gagal += hilang;
});

// --- 5. fungsi yang dipanggil dari onclick harus terdefinisi ---
const js = inline.map(m => m[1]).join('\n');
const dipanggil = new Set([...html.matchAll(/onclick="(\w+)\(/g)].map(m => m[1]));
dipanggil.forEach(fn => {
  const ada = new RegExp(`function\\s+${fn}\\s*\\(`).test(js);
  if (ada) console.log(`OK   onclick ${fn}() terdefinisi`);
  else { gagal++; console.log(`GAGAL onclick ${fn}() tidak ditemukan`); }
});

// --- 6. id yang diakses getElementById harus ada di HTML ---
const idDipakai = new Set([...js.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1]));
const idAda = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const idHilang = [...idDipakai].filter(i => !idAda.has(i));
if (idHilang.length === 0) console.log(`OK   semua ${idDipakai.size} id yang dipakai JS ada di HTML`);
else { gagal += idHilang.length; idHilang.forEach(i => console.log('GAGAL id tidak ada di HTML: ' + i)); }

console.log('\n' + (gagal === 0 ? '=== SEMUA PEMERIKSAAN LULUS ===' : `=== ${gagal} MASALAH DITEMUKAN ===`));
process.exit(gagal === 0 ? 0 : 1);
