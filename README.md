# Howell Barbershop — Sistem Informasi Manajemen & Booking Online

Sistem informasi manajemen operasional dan booking online mandiri untuk **Howell Barbershop** (Jaringan Barbershop Premium Multi-Cabang). Sistem ini dirancang untuk mendigitalisasi operasional harian, mulai dari pemesanan slot potong rambut oleh pelanggan, antrean kasir, pencatatan transaksi kasir POS (*Point of Sale*), pembagian komisi barber otomatis, hingga analisis keuangan owner.

---

## 🚀 Fitur Utama Berdasarkan Role

### 1. Pelanggan (Guest / Member)
*   **Landing Page Dinamis**: Menampilkan galeri, daftar cabang terdekat, jam operasional, menu layanan premium, dan daftar barber professional yang bertugas.
*   **Booking Wizard Mandiri (Self-Service)**:
    *   Pemilihan Cabang -> Pemilihan Layanan -> Pemilihan Barber -> Pemilihan Tanggal & Slot Waktu -> Input Data Konfirmasi.
    *   Kalkulasi slot waktu kosong secara dinamis berdasarkan jam kerja barber, jadwal cuti, dan durasi layanan terpilih.
    *   Harga layanan menyesuaikan secara dinamis jika barber yang dipilih memiliki harga khusus (*override pricing*).
*   **Customer Profile**: Kelola profil, ubah kontak, dan ganti foto profil langsung dari header landing page.

### 2. Kasir (Cashier)
*   **Antrean Dashboard**: Pemantauan antrean hari ini (`Confirmed`, `In-Progress`, `Completed`, `Cancelled`) secara real-time.
*   **Queue Control**: Ubah status antrean pelanggan saat tiba di outlet (`Mulai Service`) atau batalkan jika berhalangan.
*   **Walk-in Booking**: Input pemesanan langsung untuk pelanggan walk-in yang datang ke outlet secara manual.
*   **Point of Sale (POS) & Checkout**:
    *   Layanan potong rambut otomatis masuk ke keranjang POS saat checkout antrean.
    *   Dapat menambahkan produk ritel (pomade, vitamin, shampoo) ke keranjang belanja dengan pengecekan stok otomatis.
    *   Pencatatan transaksi secara atomik (mengurangi stok produk, memperbarui status booking, dan menghitung komisi barber secara instan).
    *   Pencetakan struk transaksi (*receipt* thermal).

### 3. Barber
*   **Personal Dashboard**: Melihat antrean tugas harian yang di-assign kepadanya.
*   **Laporan Komisi**: Transparansi perolehan komisi bulanan (total komisi & rincian komisi per transaksi service).

### 4. Pemilik (Owner)
*   **Dashboard Analytics**: Visualisasi grafik tren omset bisnis harian (layanan + produk retail), total penjualan produk, status booking, dan performa kerja masing-masing barber.
*   **CRUD Staff & Karyawan**: Manajemen akun Kasir dan Barber lengkap dengan pemetaan cabang kerja, persentase komisi barber, dan upload foto profil karyawan.
*   **CRUD Menu Layanan & Override Harga**:
    *   Kelola katalog layanan utama, durasi pengerjaan, kategori, harga default, dan foto layanan.
    *   **Override Harga Barber**: Mengatur tarif khusus untuk layanan tertentu per barber (misal: tarif lebih mahal untuk Senior Barber).
*   **CRUD Produk Retail**: Inventarisasi produk retail per cabang dengan pelacakan stok dan foto produk.
*   **Jadwal & Shift Kerja**: Pengaturan jadwal kerja mingguan barber dan penandaan tanggal cuti/libur barber (*rolling leave*).
*   **Laporan Komisi Global**: Rekapitulasi komisi seluruh barber dari semua cabang dengan filter rentang tanggal.

---

## 🛠️ Tech Stack & Arsitektur

Sistem ini dibangun menggunakan arsitektur modern berkinerja tinggi:
*   **Backend Framework**: Laravel 12 (PHP 8.2+) dengan Service-Repository Pattern.
*   **Frontend Framework**: React 18 + Inertia.js (tanpa reload halaman, terasa seperti SPA).
*   **Styling**: Vanilla CSS custom dengan utility CSS pendukung untuk fleksibilitas premium.
*   **Real-time Communication**: Laravel Reverb (WebSockets).
*   **Database**: PostgreSQL / SQLite (mendukung transaksi atomik).
*   **Image Processing**: Native PHP GD Library untuk kompresi dan optimasi otomatis foto yang diunggah (di bawah 2MB, resolusi maks 1000px).

---

## 💻 Panduan Instalasi & Jalankan Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan project di komputer lokal Anda:

### 1. Persiapan Awal
Pastikan Anda sudah menginstal **PHP (v8.2+)**, **Composer**, **Node.js (v18+)**, dan database (**MySQL/PostgreSQL/SQLite**).

### 2. Kloning Project & Install Dependensi
```bash
# Clone repositori
git clone <url-repo-anda>
cd howell-barber

# Install dependensi PHP (Laravel)
composer install

# Install dependensi Javascript (React)
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env` dan konfigurasikan koneksi database Anda:
```bash
cp .env.example .env
```
Buat kunci aplikasi:
```bash
php artisan key:generate
```

### 4. Jalankan Migrasi & Database Seeder
Lakukan migrasi tabel beserta data demo bawaan (seperti cabang, akun staff default, layanan, dan produk retail):
```bash
php artisan migrate:fresh --seed
```

### 5. Buat Symlink Storage
Agar foto staff, layanan, dan produk yang diunggah dapat diakses oleh publik:
```bash
php artisan storage:link
```

### 6. Jalankan Server Pengembangan
Jalankan Laravel Backend, Vite Server (Frontend compiler), dan Reverb Server (Websockets) secara bersamaan:

```bash
# Jalankan Laravel Server
php artisan serve

# Jalankan Vite Compiler (Terminal Terpisah)
npm run dev

# Jalankan Laravel Reverb WebSockets (Terminal Terpisah, Opsional untuk Real-time Notification)
php artisan reverb:start
```
Buka browser dan akses aplikasi di: `http://127.0.0.1:8000`

---

## 🔑 Akun Demo Pengujian (Seeder)

Gunakan akun-akun di bawah ini untuk menguji berbagai peran di dalam sistem (password untuk semua akun adalah `password`):

| Role | Email | Cabang Kerja | Deskripsi |
|---|---|---|---|
| **Owner (Joko)** | `owner@howell.com` | Semua Cabang | Akses penuh statistik bisnis, kelola staff, harga, dan jadwal. |
| **Cashier Kemang (Andi)** | `cashier.kemang@howell.com` | Cabang Kemang | Kasir untuk outlet Kemang, POS & kelola antrean harian. |
| **Cashier Senopati (Siti)** | `cashier.senopati@howell.com` | Cabang Senopati | Kasir untuk outlet Senopati. |
| **Barber Kemang (Budi)** | `budi.barber@howell.com` | Cabang Kemang | Akun Senior Barber Kemang, komisi default 45%. |
| **Barber Kemang (Cecep)** | `cecep.barber@howell.com` | Cabang Kemang | Akun Junior Barber Kemang, komisi default 35%. |
| **Barber Senopati (Dedi)** | `dedi.barber@howell.com` | Cabang Senopati | Akun Senior Barber Senopati. |
| **Customer Member (Rian)** | `rian@gmail.com` | - | Akun member pelanggan untuk auto-fill form booking. |
