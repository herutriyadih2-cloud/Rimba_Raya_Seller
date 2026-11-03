# Hosting RIMBA RAYA SELLER

## Status
- GitHub Pages: **AKTIF**
- Repository: public
- Source: branch `main`, folder `/docs`
- Default URL: https://herutriyadih2-cloud.github.io/Rimba_Raya_Seller/
- Custom domain: **rimbaseller.my.id**

## Setting DNS di Hostinger
Agar custom domain `rimbaseller.my.id` bisa diakses, tambahkan record berikut di DNS Zone Hostinger:

### A Records (apex domain @)
| Type | Host / Name | Value |
|------|-------------|-------|
| A    | @           | 185.199.108.153 |
| A    | @           | 185.199.109.153 |
| A    | @           | 185.199.110.153 |
| A    | @           | 185.199.111.153 |

### CNAME Record (www)
| Type  | Host / Name | Value |
|-------|-------------|-------|
| CNAME | www         | herutriyadih2-cloud.github.io |

## Langkah-langkah di Hostinger
1. Login ke https://www.hostinger.co.id/
2. Buka menu **Domains** → pilih domain `rimbaseller.my.id`
3. Pilih **DNS / DNS Zone**
4. Hapus A record lama yang mengarah ke Hostinger (jika ada) untuk host `@`
5. Tambahkan 4 A record ke IP GitHub Pages di atas
6. Tambahkan CNAME `www` mengarah ke `herutriyadih2-cloud.github.io`
7. Simpan perubahan

## Setelah DNS diperbarui
- Propagasi DNS biasanya memakan waktu **5 menit - 48 jam**.
- Setelah aktif, buka https://rimbaseller.my.id/
- Jika muncul error certificate HTTPS, tunggu beberapa menit hingga GitHub memproses SSL.

## Keamanan Penting
## Keamanan Penting
Token GitHub yang pernah muncul di chat harus **segera direvoke**:
1. Buka https://github.com/settings/tokens
2. Cari token yang pernah terexpose
3. Klik **Delete / Revoke**
4. Buat token baru jika masih dibutuhkan
