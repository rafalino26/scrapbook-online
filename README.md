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

Laptop menampilkan dua halaman; HP menampilkan satu. Gunakan panah, keyboard kiri/kanan, swipe horizontal, atau daftar Isi buku. Jumlah halaman dan nomor diperbarui otomatis. Sampul dapat dibuka kembali melalui brand di kiri atas atau daftar isi.

Simpan lalu refresh browser setelah edit. File baru tidak otomatis masuk buku: masukkan path-nya ke content.js. Gunakan nama file sederhana dan perhatikan huruf besar/kecil. Disarankan MP4 H.264/AAC dan media yang telah dikompres.

Ilustrasi bawaan hanya placeholder. Versi desain scroll sebelumnya tersimpan lengkap di archive-scroll. Font memakai Google Fonts dengan fallback lokal. Untuk hosting cukup upload index.html, style.css, app.js, content.js, dan folder public. Perubahan lokal memerlukan deploy ulang agar terlihat pada website online.

## Animasi buku

Efek lipatan memakai StPageFlip 2.0.7 (MIT), disimpan lokal di `public/vendor/` bersama lisensinya. Sumber: https://github.com/Nodlik/StPageFlip. Sertakan folder vendor saat hosting. Tidak perlu React atau npm.

Tarik sudut lembaran untuk membalik, atau gunakan tombol/keyboard/gestur sentuh. Sampul memakai animasi hardcover, isi memakai lipatan kertas dengan bayangan dinamis. Preferensi sistem reduced motion menonaktifkan animasi dan memakai pergantian halaman langsung.

Ukuran lembaran tetap stabil saat dibalik. Jika tulisan terlalu panjang, bagian isi halaman bisa di-scroll; sebaiknya pecah teks panjang menjadi beberapa halaman. Format content.js dan cara mengganti foto/video tetap sama. Sampul belakang mengikuti judul dan identitas sampul depan, dengan pesan ui.end.

## GitHub Pages

Setelah push ke GitHub, buka Settings > Pages:

1. Source: Deploy from a branch.
2. Branch: main, folder: / (root).
3. Klik Save dan tunggu deployment selesai.

Alamat situs: https://rafalino26.github.io/scrapbook-online/

Semua path asset relatif sehingga kompatibel dengan subfolder project GitHub Pages. File .nojekyll menghindari pemrosesan Jekyll. Folder archive-scroll disimpan lokal dan tidak ikut push.

Responsivitas diperiksa pada viewport 320x568, 390x844, 768x1024, 1024x768, dan 1440x900. HP memakai satu halaman, layar lebar dua halaman. Layar pendek tetap bisa scroll vertikal dan teks panjang bisa scroll di dalam halaman. Pemeriksaan ini memakai browser desktop dengan ukuran viewport berbeda; pengujian perangkat HP asli tetap berguna untuk gestur dan performa.
