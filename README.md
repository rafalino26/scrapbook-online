# Buku digital kita

HTML + CSS + JavaScript. Buka index.html langsung, atau jalankan:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Preview: http://127.0.0.1:4173

## Semua konten di content.js

- `pageTitle`: judul tab browser.
- `ui`: seluruh label tombol, petunjuk, nama brand, footer, dan pesan kesalahan.
- `cover`: judul, subjudul, catatan, media, dan tulisan kecil sampul.
- `pages`: daftar halaman. Urutan objek = urutan halaman. Tambahkan, pindahkan, atau hapus objek untuk menyusun buku.

Judul bisa memakai `\n` untuk baris baru. `paragraphs` berisi daftar paragraf. Semua teks ditampilkan sebagai teks biasa, bukan HTML. Untuk tanda kutip di dalam string, gunakan `\"`.

## Foto dan video menggunakan format yang SAMA di semua tempat

Drop file melalui File Explorer/editor ke public/photos atau public/videos. Kemudian edit `media` di `cover` atau di halaman mana pun:

```js
"media": {
  "type": "photo",
  "src": "public/photos/kita.jpg",
  "alt": "Kita berdua di pantai",
  "note": "Sore favoritku.",
  "fit": "cover",
  "position": "center"
}
```

Untuk menggantinya dengan video, ubah `type` dan `src`:

```js
"media": {
  "type": "video",
  "src": "public/videos/kita.mp4",
  "poster": "public/photos/sampul-video.jpg",
  "alt": "Video kita berdua",
  "note": "Putar lagi, ya.",
  "fit": "cover",
  "position": "center"
}
```

`poster` opsional. Tanpa poster, thumbnail menggunakan elemen video dengan preload metadata. Ketuk media untuk membuka player dengan tombol play, volume, dan fullscreen. Tidak ada autoplay. Untuk kembali ke foto, ubah type menjadi photo dan src ke file gambar; poster lama akan diabaikan.

`fit: "contain"` menampilkan gambar utuh; `cover` memenuhi bingkai dengan pemotongan. `position` mengatur bagian gambar yang terlihat, misalnya `center top`. Hapus properti `media` atau isi `null` untuk halaman tanpa media. Foto/video asli diperbesar dalam dialog tanpa crop.

## Menambah halaman

Salin salah satu objek di `pages` lalu edit:

```js
{
  "label": "HARI FAVORIT",
  "title": "Sore itu,\nsama kamu.",
  "paragraphs": ["Paragraf pertama.", "Paragraf kedua."],
  "media": { "type": "photo", "src": "public/photos/kita.jpg", "alt": "Foto kita", "note": "just us." },
  "note": "Catatan tulisan tangan."
}
```

`entries` opsional untuk cerita/timeline, dengan label, title, text. Semua halaman mendukung media, paragraf, entries, dan note. Halaman dengan banyak teks memanjang agar tulisan tidak terpotong; pecah surat panjang menjadi beberapa halaman untuk tampilan buku yang seimbang.

Laptop menampilkan dua halaman; HP menampilkan satu. Swipe ke kiri untuk lanjut dan ke kanan untuk balik, termasuk dari atas foto/video. Di laptop, klik-tahan lalu geser buku; keyboard kiri/kanan dan daftar Isi buku juga tersedia. Tombol sebelumnya/berikutnya dihilangkan. Jumlah halaman dan nomor diperbarui otomatis. Sampul dapat dibuka kembali melalui brand di kiri atas atau daftar isi.

Simpan lalu refresh browser setelah edit. File baru tidak otomatis masuk buku: masukkan path-nya ke content.js. Gunakan nama file sederhana dan perhatikan huruf besar/kecil. Disarankan MP4 H.264/AAC dan media yang telah dikompres.

Ilustrasi bawaan hanya placeholder. Versi desain scroll sebelumnya tersimpan lengkap di archive-scroll. Font memakai Google Fonts dengan fallback lokal. Untuk hosting cukup upload index.html, style.css, app.js, swipe.js, content.js, dan folder public. Perubahan lokal memerlukan deploy ulang agar terlihat pada website online.

## Animasi buku

Efek lipatan memakai StPageFlip 2.0.7 (MIT), disimpan lokal di `public/vendor/` bersama lisensinya. Sumber: https://github.com/Nodlik/StPageFlip. Sertakan folder vendor saat hosting. Tidak perlu React atau npm.

Geser horizontal di area buku untuk membalik. Gestur ditangani di swipe.js; setelah dilepas, StPageFlip menjalankan animasi hardcover untuk sampul dan lipatan kertas dengan bayangan untuk isi. Swipe tidak harus cepat, scroll vertikal tetap bisa, dan swipe di atas media tidak membuka viewer. Preferensi sistem reduced motion menonaktifkan animasi dan memakai pergantian halaman langsung.

Ukuran lembaran tetap stabil saat dibalik. Jika tulisan terlalu panjang, bagian isi halaman bisa di-scroll; sebaiknya pecah teks panjang menjadi beberapa halaman. Format content.js dan cara mengganti foto/video tetap sama. Sampul belakang mengikuti judul dan identitas sampul depan, dengan pesan ui.end.

Petunjuk geser bisa diedit di ui.hint, ui.coverHint, dan ui.backHint dalam content.js. Nama puzukuzuw & mizukuzuw dan semua kalimat tetap bisa diganti di file yang sama. Narator memakai puzukuzuw, penerima memakai mizukuzuw.

Tes regresi gestur: `node --test tests/swipe.test.cjs` (butuh Node hanya untuk tes, bukan untuk menjalankan website). Navigasi maju/balik juga diperiksa dengan drag langsung di browser pada viewport 320, 390, 768, dan 1440 piksel, termasuk kembali ke sampul depan dan dari sampul belakang. Ini simulasi ukuran layar di browser desktop, bukan tes sentuhan di perangkat HP fisik.

## GitHub Pages

Setelah push ke GitHub, buka Settings > Pages:

1. Source: Deploy from a branch.
2. Branch: main, folder: / (root).
3. Klik Save dan tunggu deployment selesai.

Alamat situs: https://rafalino26.github.io/scrapbook-online/

Semua path asset relatif sehingga kompatibel dengan subfolder project GitHub Pages. File .nojekyll menghindari pemrosesan Jekyll. Folder archive-scroll disimpan lokal dan tidak ikut push.

Responsivitas diperiksa pada viewport 320x568, 390x844, 768x1024, 1024x768, dan 1440x900. HP memakai satu halaman, layar lebar dua halaman. Layar pendek tetap bisa scroll vertikal dan teks panjang bisa scroll di dalam halaman. Pemeriksaan ini memakai browser desktop dengan ukuran viewport berbeda; pengujian perangkat HP asli tetap berguna untuk gestur dan performa.
