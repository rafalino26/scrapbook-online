# Scrapbook Nailong

Website scrapbook anniversary puzukuzuw & mizukuzuw. Satu versi utama di `index.html`, memakai HTML, CSS, dan JavaScript tanpa proses build atau backend.

## Preview lokal

```powershell
python -m http.server 4182 --bind 127.0.0.1
```

Buka http://127.0.0.1:4182/.

## Edit isi buku

- `content.js`: semua judul, paragraf, caption, petunjuk, dan urutan foto/halaman.
- `nailong-content.js`: teks pembuka, pilihan stiker statis/GIF, pesan klik, dan penutup.
- `music-content.js`: file lagu, judul, artis, volume, dan loop.

Foto ada di `public/photos/foto-01.jpeg` sampai `foto-35.jpeg`. Daftar nama asli dan dimensi disimpan di `photo-index.json`. Drop foto baru ke folder tersebut, lalu ganti `src` dalam `content.js`. File yang ditambahkan tidak otomatis masuk halaman.

```js
"media": {
  "type": "photo",
  "src": "public/photos/foto-01.jpeg",
  "alt": "puzukuzuw & mizukuzuw",
  "note": "",
  "orientation": "portrait",
  "fit": "cover",
  "position": "center"
}
```

`media` untuk satu foto; `mediaItems` untuk beberapa foto. `orientation` dapat berupa `portrait` atau `landscape`. Caption di dalam bingkai memakai `note` pada media; tulisan di bawah bingkai memakai `paragraphs` atau `note` pada halaman. Untuk menambah halaman, salin objek dalam `pages` lalu sesuaikan isinya. Judul dan tulisan dapat memakai `\n` untuk baris baru.

Saat ini semua media buku adalah foto. Renderer tetap mendukung `type: "video"` dengan `src` video dan `poster` opsional bila suatu saat diperlukan.

## Interaksi dan tampilan

- Swipe kiri/kanan, drag mouse, keyboard panah, dan menu Isi buku untuk navigasi.
- Laptop dan iPad landscape menampilkan dua halaman; HP dan tablet portrait menampilkan satu halaman.
- Ukuran buku mengikuti ruang layar; teks diukur agar tidak perlu scroll di dalam halaman.
- Foto dapat diketuk untuk diperbesar, lalu pilih `balikw` untuk menutup.
- Halaman 6: strip foto kiri turun dan kanan naik.
- Halaman 8: kamera otomatis menjepret setiap 2,5 detik, bergantian tiga foto, dengan flash lokal. Tombol manual tetap tersedia.
- Sesudah halaman 10, swipe lagi untuk menutup sampul dan memunculkan Nailong berjalan membawa love setelah 0,5 detik.

Stiker bergerak dicampur dengan stiker statis di dalam buku, maksimal dua animasi per halaman. Animasi halaman berhenti saat tidak terlihat, sedang dibalik, atau viewer terbuka. GIF di luar layar juga diganti gambar diam. Tombol `istirahat duluw` menjeda stiker bergerak. Reduced motion mengikuti pengaturan perangkat.

Ubah `pageAnimations` menjadi `false` di `nailong-content.js` untuk mematikan GIF dalam buku saja. Daftar `animatedFriends` mengatur 15 variasi GIF. Pengaturan `ending` mengatur GIF penutup, jeda, durasi, dan teksnya. Cadangan percobaan lama di `revisions/` hanya lokal dan tidak ikut Git.

## Musik

Lagu BEAUTiFUL — Paul Partohap ada di `public/music/beautiful.mp3`. Klik tombol pembuka hadiah untuk memulai buku dan mencoba memutar musik dari interaksi pengguna. Browser dapat membatasi autoplay tanpa interaksi; tombol play/pause tetap tersedia. Previous/next nonaktif karena hanya satu lagu. Ganti file atau pengaturannya di `music-content.js`.

## GitHub Pages

Semua aset memakai path relatif, sehingga dapat dihosting pada subfolder project GitHub Pages tanpa npm, React, atau server. `.nojekyll` tersedia agar file statis langsung disajikan.

Setelah push, buka repository **Settings → Pages**:

1. Source: **Deploy from a branch**.
2. Branch: **main**, folder **/ (root)**.
3. Klik **Save** dan tunggu deployment selesai.

Alamat situs: https://rafalino26.github.io/scrapbook-online/

Halaman utama hanya `index.html`; versi non-Nailong sudah dihapus. Setelah mengubah konten/aset, commit dan push ulang. Jika mengganti JS/CSS, perbarui parameter versi pada URL di `index.html` agar cache lama tidak terpakai.

GitHub Pages pada GitHub Free memerlukan repository public. GitHub Pro/Team mendukung Pages dari repository private juga. Referensi: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

## Validasi

Swipe sentuh mengabaikan `lostpointercapture` dari elemen anak ketika browser memindahkan implicit capture ke area buku. Kehilangan capture pada area buku itu sendiri tetap membatalkan gestur. Regresi khusus sentuhan ini tercakup di tes swipe; uji viewport desktop saja tidak mensimulasikan seluruh perilaku sentuh perangkat nyata.

```powershell
node --test tests/swipe.test.cjs tests/music-player.test.cjs
node tools/verify-site.cjs
```

Node hanya dipakai untuk pemeriksaan, bukan untuk menjalankan website. Pemeriksaan responsif menggunakan browser desktop pada berbagai ukuran viewport, belum pengujian sentuhan di iPad/HP fisik.

PageFlip 2.0.7 beserta lisensi MIT disimpan di `public/vendor/`. Sumber ilustrasi dan stiker dicatat di `public/nailong/SOURCES.md` serta manifest sumber di folder yang sama.
