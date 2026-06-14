# Laporan Temuan Bug & Hasil Pengujian Manual (UI Testing)
**Howell Barbershop — Sistem Informasi Manajemen & Booking Online**

| Field | Detail |
|---|---|
| **Dokumen** | Bug Findings & UI Testing Report |
| **Versi** | 1.0.0 |
| **Tanggal Pengujian** | 13 Juni 2026 |
| **Penguji** | Antigravity AI Pair Programmer |
| **Metode Pengujian** | Manual UI Flow via Chrome DevTools |

---

## 1. Ringkasan Hasil Pengujian (Executive Summary)

Pengujian manual menyeluruh telah dilakukan pada sistem **Howell Barbershop** menggunakan browser Chrome (diakses secara lokal pada `http://127.0.0.1:8000`). Pengujian mencakup semua fungsionalitas utama dari empat role yang berbeda: **Guest/Customer**, **Kasir (Cashier)**, **Barber**, dan **Owner**.

### Status Fitur Utama
*   **Booking Online (Guest)**: **PASS** (Berhasil membuat booking baru, harga override level senior ter-apply otomatis).
*   **Walk-in Booking (Cashier)**: **PASS** (Kasir dapat memasukkan antrean langsung dari dashboard kasir, slot waktu dihitung dinamis dan modal berhasil menutup pasca-submit).
*   **Queue Management (Cashier)**: **PASS** (Fungsi 'Mulai Service' merubah status ke `IN-PROGRESS` secara real-time).
*   **POS & Checkout (Cashier)**: **PASS** (Penambahan produk retail memperbarui Grand Total secara akurat, proses transaksi mengurangi stok produk otomatis di database, dan receipt thermal berhasil digenerate).
*   **Profile Management**: **PASS** (Upload foto profil dan edit biodata berjalan normal).
*   **Owner Analytics & CRUDs**: **PASS** (Grafik omset, metrik bisnis harian, performa barber, serta CRUD Produk/Layanan berjalan normal).
*   **Komisi & Laporan Keuangan**: **FAIL** (Halaman komisi owner dan komisi barber tidak dapat diakses/error 500).

---

## 2. Rincian Temuan Bug (Bug Findings List)

Selama proses testing, ditemukan **5 bug** (3 bug kritis/fungsional dan 2 bug visual/UX) yang perlu segera diselesaikan sebelum deploy ke tahap produksi. Sesuai instruksi, tidak ada perbaikan kode langsung yang dilakukan.

### Bug #1: Error 500 pada Halaman Komisi Owner (`/owner/commissions`)
*   **Tingkat Keparahan**: 🔴 **CRITICAL** (Error internal server, merusak fungsionalitas laporan owner).
*   **Gejala**: Mengakses halaman Laporan Komisi pada dashboard Owner memicu error 500:
    ```
    Call to a member function format() on string
    ```
*   **File Terdampak**: [OwnerController.php](file:///E:/Study%20Area/JOKI/howell-barber/app/Http/Controllers/OwnerController.php#L489)
*   **Analisis Teknis**:
    Pada baris 489, controller mencoba memformat field `created_at` dari model `CommissionRecord`:
    ```php
    'date' => $rec->created_at->format('d M Y, H:i'),
    ```
    Namun, di model [CommissionRecord.php](file:///E:/Study%20Area/JOKI/howell-barber/app/Models/CommissionRecord.php#L13), terdapat baris `public $timestamps = false;` (karena tabel migrasi hanya memiliki kolom `created_at` tanpa `updated_at`). 
    Karena `$timestamps = false` dan tidak ada casting eksplisit pada model, Eloquent mengembalikan field `created_at` sebagai **raw string** dari database, bukan objek **Carbon/DateTime**, sehingga memicu error fatal saat method `format()` dipanggil.
*   **Rekomendasi Perbaikan**:
    Tambahkan casting datetime ke property `$casts` di model `CommissionRecord`:
    ```php
    protected $casts = [
        'created_at' => 'datetime',
    ];
    ```

---

### Bug #2: Error 500 pada Halaman Komisi Barber (`/barber/commissions`)
*   **Tingkat Keparahan**: 🔴 **CRITICAL** (Error internal server, merusak fungsionalitas dashboard barber).
*   **Gejala**: Saat masuk dengan akun Barber dan membuka tab Komisi, halaman memicu error 500 yang identik:
    ```
    Call to a member function format() on string
    ```
*   **File Terdampak**: [BarberController.php](file:///E:/Study%20Area/JOKI/howell-barber/app/Http/Controllers/BarberController.php#L119)
*   **Analisis Teknis**:
    Sama seperti Bug #1, query mengambil record dari model `CommissionRecord` dan memanggil:
    ```php
    'date' => $rec->created_at->format('d M Y, H:i'),
    ```
    karena model `CommissionRecord` belum memiliki casting untuk `created_at`, PHP melempar error fatal karena tipe datanya adalah string.
*   **Rekomendasi Perbaikan**:
    Penerapan rekomendasi dari Bug #1 (menambahkan `$casts` ke model `CommissionRecord`) akan otomatis menyelesaikan masalah ini secara global.

---

### Bug #3: Tombol Navigasi Header Customer Tidak Memiliki Akses Profile (UX Bug)
*   **Tingkat Keparahan**: 🟡 **MEDIUM** (Hambatan navigasi bagi pengguna).
*   **Gejala**: 
    Ketika customer (role: `customer`) telah log in, tombol di header berubah dari "Masuk" / "Daftar" menjadi "Dashboard". 
    1. Tombol "Dashboard" ini merujuk ke `/dashboard`, yang oleh `web.php` diredirect kembali ke `/` (landing page) karena role customer tidak memiliki dashboard internal. Hal ini membuat navigasi berputar tanpa arah (looping).
    2. Tidak ada menu dropdown atau tombol di header yang menautkan ke `/profile`, padahal halaman `/profile` sudah diimplementasikan dan dapat diakses jika diketik manual pada URL bar.
*   **File Terdampak**: [Welcome.jsx (Header/Navbar Section)](file:///E:/Study%20Area/JOKI/howell-barber/resources/js/Pages/Welcome.jsx#L38-L44) dan [web.php](file:///E:/Study%20Area/JOKI/howell-barber/routes/web.php#L30-L38)
*   **Analisis Teknis**:
    Struktur routing mengarahkan default role (customer) ke `/` ketika mengakses `/dashboard`. Navigasi pada `Welcome.jsx` tidak mendeteksi apakah user adalah customer atau staf internal saat menampilkan tombol "Dashboard".
*   **Rekomendasi Perbaikan**:
    Ubah logika rendering navigasi pada `Welcome.jsx`. Jika `auth.user.role === 'customer'`, ganti tombol "Dashboard" menjadi dropdown user yang berisi tautan ke halaman **"Profil Saya"** (`/profile`) dan tombol **"Keluar (Log Out)"**, mirip seperti yang ada pada dashboard internal staff.

---

### Bug #4: Mismatch Data Cabang Barber pada Manajemen Staff Owner
*   **Tingkat Keparahan**: 🟡 **MEDIUM** (Data tidak konsisten pada panel Owner).
*   **Gejala**:
    1. Di tabel halaman `/owner/staff`, semua barber (Budi, Cecep, Dedi) menampilkan tanda minus `-` pada kolom **CABANG**, padahal di database mereka jelas dipetakan ke cabang tertentu (Kemang/Senopati).
    2. Saat mengklik tombol **Edit** untuk mengedit data Barber, input dropdown **Cabang Kerja** secara default memilih `-- Pilih --` (unassigned) dan ditandai sebagai invalid/kosong, memaksa owner untuk memilih ulang cabang setiap kali mengedit data barber.
*   **File Terdampak**: [Staff.jsx](file:///E:/Study%20Area/JOKI/howell-barber/resources/js/Pages/Owner/Staff.jsx#L138) & [OwnerController.php (listStaff)](file:///E:/Study%20Area/JOKI/howell-barber/app/Http/Controllers/OwnerController.php#L112)
*   **Analisis Teknis**:
    Sistem menyimpan data cabang dengan cara yang tidak konsisten antara role Cashier dan Barber:
    *   Cashier: data cabang disimpan di kolom `branch_id` pada tabel `users`.
    *   Barber: data cabang disimpan di kolom `branch_id` pada tabel `barbers` (profil sekunder barber), sementara kolom `branch_id` pada tabel `users` bernilai `null` (khusus untuk data seeder bawaan).
    
    Pada `Staff.jsx`, tabel merender cabang menggunakan:
    ```javascript
    s.branch?.name || '-'
    ```
    Dan edit modal mengisi state awal cabang menggunakan:
    ```javascript
    setBranchId(s.branch_id || '');
    ```
    Karena `s` adalah objek `User`, dan bagi barber `users.branch_id` bernilai null, frontend gagal mendeteksi cabangnya (meskipun `s.barber.branch_id` bernilai benar).
*   **Rekomendasi Perbaikan**:
    Sesuaikan kode frontend pada `Staff.jsx` agar mengecek relasi barber jika role user adalah barber:
    *   Di tabel:
        ```javascript
        s.role === 'barber' ? (s.barber?.branch?.name || '-') : (s.branch?.name || '-')
        ```
    *   Di pemanggilan modal edit:
        ```javascript
        setBranchId(s.role === 'barber' ? (s.barber?.branch_id || '') : (s.branch_id || ''));
        ```

---

### Bug #5: Data Cabang Barber Bernilai Minus `-` pada Halaman Jadwal Owner
*   **Tingkat Keparahan**: 🔵 **LOW** (Minor visual bug).
*   **Gejala**: Pada halaman `/owner/schedules` (Kelola Jadwal), ketika memilih salah satu barber di dropdown, label cabang di bawahnya selalu menampilkan `Cabang: -`.
*   **File Terdampak**: [Schedules.jsx](file:///E:/Study%20Area/JOKI/howell-barber/resources/js/Pages/Owner/Schedules.jsx#L125) & [OwnerController.php (listSchedules)](file:///E:/Study%20Area/JOKI/howell-barber/app/Http/Controllers/OwnerController.php#L376)
*   **Analisis Teknis**:
    Pada `OwnerController.php`, method `listSchedules()` meload data barber dengan query:
    ```php
    $barbers = Barber::with(['user', 'weeklySchedules', 'leaveSchedules'])->get();
    ```
    Controller lupa melakukan *eager loading* untuk relasi `branch` pada model `Barber`. Akibatnya, objek barber yang dikirim ke frontend tidak membawa data branch (`selectedBarber.branch` bernilai `undefined`), sehingga fallback ke `-` ter-render di UI:
    ```javascript
    Cabang: {selectedBarber.branch?.name || '-'}
    ```
*   **Rekomendasi Perbaikan**:
    Ubah pemanggilan eager loading di `OwnerController.php` method `listSchedules()` menjadi:
    ```php
    $barbers = Barber::with(['user', 'branch', 'weeklySchedules', 'leaveSchedules'])
        ->where('status', 'active')
        ->whereNull('deleted_at')
        ->get();
    ```

---

## 3. Matriks Hasil Pengujian Fitur (Test Matrix)

| Fitur / Halaman | Role Terlibat | Status | Detail Temuan / Catatan |
|---|---|---|---|
| **Landing Page (`/`)** | Publik / Guest | **PASS** | Tampilan responsive, katalog layanan & cabang ter-render secara dinamis dari database. |
| **Booking Wizard (`/booking`)** | Guest / Member | **PASS** | Pemilihan cabang, pencarian barber, dan kalkulasi slot waktu real-time berjalan sempurna. Harga override ter-apply sesuai barber. |
| **Pendaftaran Member** | Guest | **PASS** | Registrasi member baru dari UI berjalan sukses, data masuk ke database. |
| **Dashboard Kasir (`/cashier/dashboard`)** | Kasir (Cashier) | **PASS** | Menampilkan antrean hari ini, filter status, filter pencarian. Antrean terupdate real-time. |
| **Tambah Walk-in (`➕ WALK-IN BOOKING`)** | Kasir (Cashier) | **PASS** | Menambahkan antrean walk-in langsung dari panel kasir berjalan lancar. |
| **POS & Kasir (`/cashier/pos/{booking}`)** | Kasir (Cashier) | **PASS** | Keranjang belanja otomatis memuat layanan booking. Tambah produk retail update grand total dengan benar. |
| **Checkout & Cetak Struk** | Kasir (Cashier) | **PASS** | Tombol bayar memproses transaksi secara atomik, stok produk terpotong, struk thermal tercetak dengan format rapi. |
| **Dashboard Barber (`/barber/dashboard`)** | Barber | **PASS** | Menampilkan antrean harian khusus barber yang bersangkutan, ringkasan komisi bulan ini, dan riwayat service. |
| **Komisi Barber (`/barber/commissions`)** | Barber | **FAIL** | Terjadi Error 500 karena format string pada Carbon di model `CommissionRecord` (**Bug #2**). |
| **Dashboard Owner (`/owner/dashboard`)** | Pemilik (Owner) | **PASS** | Menampilkan grafik pendapatan, total omset, booking selesai, produk terjual, komisi terbayar, dan performa individual barber secara akurat. |
| **Kelola Staff (`/owner/staff`)** | Pemilik (Owner) | **PARTIAL** | Fitur simpan staff baru & edit biodata berjalan lancar, namun visual cabang barber bernilai minus (-) dan modal edit kosong (**Bug #4**). |
| **Kelola Layanan (`/owner/services`)** | Pemilik (Owner) | **PASS** | CRUD Layanan utama berjalan lancar. Manajemen override harga per barber berfungsi penuh. |
| **Kelola Produk (`/owner/products`)** | Pemilik (Owner) | **PASS** | CRUD inventaris produk retail berjalan lancar dengan filter cabang. |
| **Kelola Jadwal (`/owner/schedules`)** | Pemilik (Owner) | **PARTIAL** | Pengaturan shift mingguan default & libur cuti tersimpan dengan benar di DB, namun label cabang barber bernilai minus (-) (**Bug #5**). |
| **Komisi Owner (`/owner/commissions`)** | Pemilik (Owner) | **FAIL** | Terjadi Error 500 karena format string pada Carbon di model `CommissionRecord` (**Bug #1**). |
| **Kelola Profil (`/profile`)** | Semua Role | **PASS** | Berhasil mengubah nama, kontak, password, dan foto profil. Namun tautan navigasi bagi customer tidak ada (**Bug #3**). |
