# Hosting RIMBA RAYA SELLER

## Status
- GitHub Pages: **AKTIF**
- Repository: public
- Source: branch `main`, folder `/docs`
- Default URL: https://herutriyadih2-cloud.github.io/Rimba_Raya_Seller/
- Custom domain: **rimbarayaseller.my.id**

## Perbaikan yang perlu dilakukan di Hostinger
Berdasarkan screenshot DNS Hostinger, domain yang aktif adalah `rimbarayaseller.my.id` (bukan `rimbaseller.my.id`). Ada 2 record yang harus diperbaiki:

### 1. Hapus A record yang tidak perlu
A record ke `2.57.91.91` untuk host `@` sebaiknya **dihapus** karena bukan milik GitHub Pages.

### 2. Perbaiki CNAME `www`
CNAME `www` saat ini mengarah ke `rimbarayaseller.my.id`. Harus diubah mengarah ke:
```
herutriyadih2-cloud.github.io
```

### Setting DNS yang benar
| Type | Host | Value |
|------|------|-------|
| A    | @    | 185.199.108.153 |
| A    | @    | 185.199.109.153 |
| A    | @    | 185.199.110.153 |
| A    | @    | 185.199.111.153 |
| CNAME| www  | herutriyadih2-cloud.github.io |

## Langkah-langkah di Hostinger
1. Login ke https://www.hostinger.co.id/
2. Buka menu **Domains** → pilih domain `rimbarayaseller.my.id`
3. Pilih **DNS/Nameserver**
4. Hapus A record `@` yang mengarah ke `2.57.91.91`
5. Edit CNAME `www` dari `rimbarayaseller.my.id` menjadi `herutriyadih2-cloud.github.io`
6. Simpan perubahan

## Setelah DNS diperbarui
- Propagasi DNS biasanya memakan waktu **5 menit - 48 jam**.
- Setelah aktif, buka https://rimbarayaseller.my.id/
- Jika muncul halaman **Parked Domain name on Hostinger DNS system**, berarti Hostinger CDN/Parking Page masih aktif. Coba:
  1. Matikan fitur **Parking Page** / **Default Page** di Hostinger
  2. Tunggu 15-60 menit agar CDN Hostinger update cache
  3. Coba akses dari jaringan lain atau mode incognito
- Jika muncul error certificate HTTPS, tunggu beberapa menit hingga GitHub memproses SSL.

## Keamanan Penting
Token GitHub yang pernah muncul di chat harus **segera direvoke**:
1. Buka https://github.com/settings/tokens
2. Cari token yang pernah terexpose
3. Klik **Delete / Revoke**
4. Buat token baru jika masih dibutuhkan
