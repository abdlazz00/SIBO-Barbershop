# Product Requirements Document (PRD)
# Howell Barbershop — Sistem Informasi Manajemen & Booking Online

| Field | Detail |
|---|---|
| **Dokumen** | Product Requirements Document (PRD) |
| **Versi** | 1.0.0 |
| **Klien** | Howell Barbershop |
| **Tanggal** | 13 Juni 2026 |
| **Status** | Draft — Menunggu Validasi Klien |

---

## Daftar Isi

1. Executive Summary
2. Tujuan Produk
3. Scope & Out of Scope
4. Pengguna & Role
5. Tech Stack & Arsitektur
6. Alur Sistem Global
7. Modul & Fitur Detail
8. Entity Relationship (High-Level ERD)
9. Business Rules
10. Non-Functional Requirements
11. Future Roadmap (Post-MVP)

---

## 1. Executive Summary

Howell Barbershop membutuhkan sebuah **Sistem Informasi Manajemen & Booking Online** berbasis web yang menggantikan proses manual (pencatatan booking via WhatsApp, perhitungan komisi manual, dll). Sistem ini dirancang untuk mendukung operasional **multi-cabang** dengan empat jenis pengguna utama: Owner, Kasir (Cashier), Barber, dan Customer.

MVP dari sistem ini mencakup dua sisi utama:
- **Sisi Publik**: Landing page dan form booking online yang bisa diakses customer tanpa perlu login.
- **Sisi Internal**: Dashboard manajemen berbasis role untuk Owner, Cashier, dan Barber.

---

## 2. Tujuan Produk

| # | Tujuan | Indikator Keberhasilan |
|---|---|---|
| 1 | Memungkinkan customer booking secara mandiri 24/7 | Customer dapat menyelesaikan booking < 3 menit |
| 2 | Mengurangi beban administrasi kasir | Kasir tidak perlu rekap booking manual |
| 3 | Transparansi komisi barber | Barber dapat melihat komisi real-time |
| 4 | Owner mendapat visibilitas penuh atas performa semua cabang | Dashboard owner menampilkan data semua cabang |
| 5 | Mendigitalisasi POS dan manajemen stok produk | Stok produk terupdate otomatis pasca transaksi |

---

## 3. Scope & Out of Scope

### Dalam Scope (MVP)

- Booking online publik (guest + member)
- Management booking oleh kasir
- Point of Sale (service + produk, bayar di tempat)
- Management service, barber, produk, jadwal, staff
- Laporan komisi barber
- Dashboard per role (Owner, Cashier, Barber)
- Notifikasi real-time in-app (Laravel Reverb)
- Multi-branch dengan isolasi data per cabang
- Profile management semua user

### Di Luar Scope (MVP)

- Payment gateway online (Midtrans, Xendit, dll)
- Notifikasi WhatsApp / Email otomatis
- Mobile app native (Android/iOS)
- Loyalty program / sistem poin customer
- Export laporan PDF/Excel
- Inventory management lanjutan
- Multi-tenancy SaaS

---

## 4. Pengguna & Role

### 4.1 Deskripsi Role

| Role | Deskripsi | Akses Cabang |
|---|---|---|
| **Owner** | Pemilik bisnis Howell Barbershop. Mengelola semua cabang, staff, laporan, dan konfigurasi sistem. | Semua cabang |
| **Cashier** | Staf kasir per cabang. Mengelola booking harian, transaksi POS, dan produk di cabangnya. | Hanya cabang sendiri |
| **Barber** | Staf barber per cabang. Melihat jadwal dan booking yang di-assign kepadanya. | Hanya cabang sendiri |
| **Customer** | Pelanggan Howell Barbershop. Bisa booking sebagai guest atau member. | Landing page publik |

### 4.2 Matriks Akses Fitur

| Fitur | Owner | Cashier | Barber | Customer |
|---|:---:|:---:|:---:|:---:|
| Landing Page & Booking | Ya | Ya | Ya | Ya |
| Management Booking | Ya | Ya | Tidak | Tidak |
| Point of Sale | Ya | Ya | Tidak | Tidak |
| Management Service | Ya | Tidak | Tidak | Tidak |
| Management Barber | Ya | Tidak | Tidak | Tidak |
| Management Produk | Ya | Ya | Tidak | Tidak |
| Management Schedule | Ya | Tidak | View only | Tidak |
| Management Staff | Ya | Tidak | Tidak | Tidak |
| Laporan Komisi | Ya (semua) | Tidak | Ya (sendiri) | Tidak |
| Dashboard | Ya | Ya | Ya | Tidak |
| Profile Management | Ya | Ya | Ya | Ya |

---

## 5. Tech Stack & Arsitektur

### 5.1 Technology Stack

| Layer | Teknologi |
|---|---|
| **Backend Framework** | Laravel 12 (PHP) |
| **Frontend Framework** | React (via Inertia.js) |
| **Arsitektur Backend** | Monolith — Service-Repository Pattern |
| **Arsitektur Frontend** | Feature-Based Component Architecture |
| **UI Component Library** | Animate-UI |
| **Real-time** | Laravel Reverb (WebSocket) |
| **Database** | MySQL / PostgreSQL |
| **Authentication** | Laravel Breeze (session-based + Inertia) |

### 5.2 Arsitektur Backend (Service-Repository Pattern)

Alur request:
```
HTTP Request
    |
    v
[Controller]     <- Menerima request, validasi input, return response
    |
    v
[Service Layer]  <- Business logic, kalkulasi, orchestration
    |
    v
[Repository]     <- Database query abstraction (Eloquent)
    |
    v
[Model / Database]
```

Struktur Folder Backend:
```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Owner/
│   │   ├── Cashier/
│   │   └── Barber/
│   ├── Requests/
│   └── Middleware/
├── Services/
│   ├── BookingService.php
│   ├── ScheduleService.php
│   ├── TransactionService.php
│   └── CommissionService.php
├── Repositories/
│   ├── Interfaces/
│   └── Eloquent/
├── Models/
└── Events/ & Listeners/
```

### 5.3 Arsitektur Frontend (Feature-Based)

```
resources/js/
├── components/
│   ├── ui/           <- Animate-UI base components
│   └── shared/
├── features/
│   ├── booking/
│   ├── pos/
│   ├── schedule/
│   └── staff/
├── layouts/
└── pages/
```

---

## 6. Alur Sistem Global

### 6.1 Alur Utama: Booking hingga Selesai Transaksi

**SISI CUSTOMER (Publik):**
1. Customer buka landing page
2. Pilih Cabang -> Pilih Service -> Pilih Barber
3. Pilih Tanggal & Slot Waktu (berdasarkan durasi service dan jadwal barber)
4. Input Nama + No. HP (Guest) ATAU Login (Member)
5. Konfirmasi Booking -> STATUS: [CONFIRMED]
6. Notifikasi real-time dikirim ke Cashier & Barber

**SISI CASHIER (Internal):**
1. Kasir melihat booking baru di dashboard
2. Saat customer datang -> Kasir ubah status -> [IN-PROGRESS]
3. Barber mengerjakan service (atau Cashier cancel -> [CANCELLED])
4. Service selesai -> Kasir buka POS
5. POS: Pilih booking -> Tambah produk (opsional) -> Pilih tipe bayar (Cash/Transfer/QRIS) -> Catat transaksi
6. STATUS Booking -> [COMPLETED], stok produk berkurang, komisi barber terhitung

### 6.2 State Machine Status Booking

```
Booking dibuat   -> [CONFIRMED]
                       |
               Kasir ubah status (customer hadir)
                       |
                       v
                 [IN-PROGRESS]
                       |
               Pembayaran selesai
                       |
                       v
                  [COMPLETED]

Dari CONFIRMED atau IN-PROGRESS:
  -> [CANCELLED]  (hanya oleh Cashier)
```

---

## 7. Modul & Fitur Detail

### 7.1 Autentikasi & Profil

#### 7.1.1 Login

**Aktor**: Owner, Cashier, Barber, Customer (member)

**Alur:**
```
User buka halaman login
    |
    v
Input email + password
    |
    +-- [Gagal] -> Tampilkan pesan error
    |
    +-- [Berhasil] -> Redirect ke dashboard sesuai role:
          Owner   -> /owner/dashboard
          Cashier -> /cashier/dashboard
          Barber  -> /barber/dashboard
          Customer -> /profile atau lanjut booking
```

Validasi:
- Email harus terdaftar di sistem
- Password minimum 8 karakter
- Akun non-aktif tidak bisa login

#### 7.1.2 Registrasi Customer

**Alur:**
```
Customer klik Daftar
    |
    v
Input: nama lengkap, nomor HP, email, password
    |
    v
Verifikasi (tidak ada duplikasi email/HP)
    |
    v
Akun aktif -> Redirect ke profil atau lanjut booking
```

#### 7.1.3 Profile Management

**Aktor**: Semua role

Data yang dapat diedit: Nama Lengkap, Foto Profil, Nomor HP, Email, Password

**Alur:**
```
User buka halaman profil
    |
    v
Tampilkan data profil saat ini
    |
    v
User edit field -> Klik Simpan
    |
    +-- [Validasi gagal] -> Tampilkan error per field
    +-- [Berhasil] -> Simpan ke DB, tampilkan notifikasi sukses
```

---

### 7.2 Landing Page & Booking Online (Customer)

#### 7.2.1 Konten Landing Page

- Header: Logo Howell Barbershop + navigasi (Login, Daftar, Booking)
- Hero section: CTA "Book Now"
- Daftar layanan unggulan (dari data service aktif)
- Daftar cabang + alamat & jam operasional
- Galeri / portofolio
- Footer: kontak, alamat, jam buka

#### 7.2.2 Alur Form Booking (Self-Service)

**Aktor**: Customer (Guest atau Member)

```
STEP 1: Pilih Cabang
  -> Tampilkan daftar cabang aktif
  -> Customer pilih cabang

STEP 2: Pilih Service
  -> Tampilkan daftar service cabang terpilih
  -> Info: nama, deskripsi, durasi, harga mulai dari...
  -> Customer pilih 1 service

STEP 3: Pilih Barber
  -> Tampilkan barber aktif di cabang
  -> Info: nama, foto, harga service (bisa berbeda senior/junior)
  -> Customer pilih barber

STEP 4: Pilih Tanggal & Slot Waktu
  -> Tampilkan kalender (min 7 hari ke depan)
  -> Tanggal libur barber ditandai tidak tersedia
  -> Customer pilih tanggal
  -> Sistem kalkulasi slot: Jam kerja - Booking existing - Durasi service
  -> Customer pilih slot waktu

STEP 5: Data Diri & Konfirmasi
  -> [Guest] Input: Nama Lengkap, Nomor HP Aktif
  -> [Member] Data terisi otomatis dari profil
  -> Tampilkan ringkasan: Cabang, Service, Barber, Tanggal, Waktu, Harga
  -> Customer klik "Konfirmasi Booking"
        |
        v
  Booking tersimpan STATUS: [CONFIRMED]
  Notifikasi real-time ke Cashier & Barber
  Customer melihat halaman sukses + detail booking
```

**Contoh Kalkulasi Slot Waktu:**

Barber A bekerja 09:00-17:00
Service: Haircut Premium (Durasi: 60 menit)
Booking sudah ada: 09:00-10:00 dan 13:00-14:00

Slot tersedia: 10:00, 11:00, 12:00, 14:00, 15:00, 16:00

**Aturan Bisnis Booking:**
- Customer hanya bisa booking 1 service per booking
- Slot tidak boleh overlap dengan booking existing (confirmed/in-progress)
- Tidak bisa booking untuk hari libur barber
- Tidak bisa booking untuk tanggal yang sudah lewat

---

### 7.3 Management Booking (Cashier)

**Aktor**: Cashier (akses terbatas pada cabang sendiri)

#### 7.3.1 Daftar Booking

```
Kasir buka menu Booking
    |
    v
Tampilkan daftar booking dengan filter:
  - Hari ini (default)
  - Filter tanggal (date range)
  - Filter status (Confirmed, In-Progress, Completed, Cancelled)
  - Filter barber

Tiap booking menampilkan:
  - Nama customer, No. HP
  - Service yang dipesan
  - Barber yang di-assign
  - Tanggal & Waktu
  - Status (badge berwarna)
  - Aksi: Lihat Detail, Ubah Status, Cancel
```

#### 7.3.2 Update Status Booking

```
[CONFIRMED]   -> Klik "Mulai Service"  -> [IN-PROGRESS]
[IN-PROGRESS] -> Selesai via POS       -> [COMPLETED]
[CONFIRMED / IN-PROGRESS] -> Klik "Batalkan" -> Konfirmasi -> [CANCELLED]
```

#### 7.3.3 Tambah Booking Manual (Walk-in)

```
Kasir klik "Tambah Booking"
    |
    v
Pilih: Service -> Barber -> Tanggal & Slot
    |
    v
Input data customer:
  - Cari customer existing by nomor HP, ATAU
  - Input nama & no. HP baru (guest)
    |
    v
Simpan -> Booking langsung [CONFIRMED]
Notifikasi dikirim ke Barber yang di-assign
```

#### 7.3.4 Re-assign Barber

```
Kasir buka detail booking [CONFIRMED]
    |
    v
Klik "Ganti Barber"
    |
    v
Pilih barber pengganti (yang available di slot yang sama)
    |
    v
Simpan -> Notifikasi dikirim ke barber baru
```

---

### 7.4 Point of Sale / POS (Cashier)

**Aktor**: Cashier

#### 7.4.1 Alur Transaksi POS

```
STEP 1: Pilih Booking
  -> Kasir buka menu POS
  -> Tampilkan booking status [IN-PROGRESS] di cabang ini
  -> Kasir pilih booking -> service masuk ke keranjang otomatis

STEP 2: Tambah Produk (Opsional)
  -> Kasir tambahkan produk dari daftar
  -> Info: nama, harga, stok saat ini
  -> Input jumlah -> masuk ke keranjang
  -> Total harga update otomatis

STEP 3: Pilih Tipe Pembayaran
  -> Cash
  -> Transfer Bank
  -> QRIS

STEP 4: Konfirmasi Transaksi
  -> Kasir klik "Proses Pembayaran"
  -> Sistem (atomik):
       - Simpan transaksi ke database
       - Status booking -> [COMPLETED]
       - Kurangi stok produk yang terjual
       - Hitung & catat komisi barber
  -> Tampilkan struk transaksi (bisa di-print)
```

#### 7.4.2 Format Struk Transaksi

```
==============================
      HOWELL BARBERSHOP
        [Nama Cabang]
==============================
No. Transaksi : TRX-20260613-001
Kasir         : [Nama Kasir]
Tanggal       : 13 Juni 2026, 14:30
Barber        : [Nama Barber]
Customer      : [Nama Customer]
------------------------------
LAYANAN:
- Hair Cut Premium        Rp 80.000
PRODUK:
- Pomade Barber King      Rp 65.000
  (Qty: 1)
------------------------------
TOTAL               Rp 145.000
------------------------------
Pembayaran    : QRIS
==============================
  Terima kasih telah mengunjungi
       Howell Barbershop!
==============================
```

---

### 7.5 Management Service (Owner)

**Aktor**: Owner

#### 7.5.1 Daftar Service

Tampilkan tabel: Nama Service, Kategori, Durasi (menit), Harga Default, Status
Aksi: Edit, Non-aktifkan
Filter: per kategori

#### 7.5.2 Form Tambah / Edit Service

| Field | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Nama Service | Text | Ya | Misal: "Hair Cut Premium" |
| Kategori | Dropdown | Ya | Haircut, Coloring, Treatment |
| Deskripsi | Textarea | Tidak | |
| Durasi | Number (menit) | Ya | Untuk kalkulasi slot booking |
| Harga Default | Currency | Ya | Sebelum override per barber |
| Foto / Gambar | Image Upload | Tidak | Tampil di landing page |
| Status | Toggle | Ya | Aktif / Non-aktif |

Aturan Bisnis:
- Service yang sudah pernah di-booking tidak bisa dihapus, hanya dinon-aktifkan
- Service non-aktif tidak muncul di form booking customer

---

### 7.6 Management Barber (Owner)

**Aktor**: Owner

#### 7.6.1 Daftar Barber

Tampilkan: Foto, Nama, Cabang, Persentase Komisi (%), Status Aktif
Aksi: Lihat Detail, Edit, Non-aktifkan

#### 7.6.2 Form Tambah / Edit Barber

| Field | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Nama Lengkap | Text | Ya | |
| Foto Profil | Image Upload | Tidak | |
| Cabang | Dropdown | Ya | Assign ke cabang tertentu |
| Persentase Komisi | Number (%) | Ya | Misal: 40 = 40% |
| Status | Toggle | Ya | Aktif / Non-aktif |

#### 7.6.3 Harga Service per Barber (Override)

```
Di halaman detail barber -> Section "Harga Service"
    |
    v
Tampilkan semua service aktif + harga default
    |
    v
Owner bisa set harga override:
  - Hair Cut Regular : Default Rp 50.000 -> Override: Rp 60.000
  - Hair Cut Premium : Default Rp 80.000 -> Override: Rp 100.000

Jika tidak di-override -> sistem pakai harga default
Harga ini yang tampil di form booking customer
```

---

### 7.7 Management Produk (Owner / Cashier)

**Aktor**: Owner (full CRUD), Cashier (tambah/edit stok)

#### 7.7.1 Daftar Produk

Tampilkan: Foto, Nama Produk, Kategori, Harga Jual, Stok, Status
Aksi: Edit, Non-aktifkan

#### 7.7.2 Form Tambah / Edit Produk

| Field | Tipe | Wajib | Keterangan |
|---|---|:---:|---|
| Nama Produk | Text | Ya | |
| Kategori | Dropdown | Ya | Pomade, Shampoo, Aksesoris |
| Harga Jual | Currency | Ya | |
| Stok | Number | Ya | |
| Deskripsi | Textarea | Tidak | |
| Foto Produk | Image Upload | Tidak | |
| Status | Toggle | Ya | Aktif / Non-aktif |

Aturan Bisnis:
- Produk non-aktif tidak muncul di POS
- Stok tidak bisa negatif (validasi di POS)
- Stok berkurang otomatis setiap produk terjual via POS

---

### 7.8 Management Schedule Barber (Owner)

**Aktor**: Owner (create/edit), Barber (view only)

#### 7.8.1 Jadwal Shift Mingguan

```
Owner buka menu Schedule -> Pilih Barber
    |
    v
Tampilkan grid 7 hari (Senin-Minggu)
    |
    v
Per hari, Owner set:
  - Status: Kerja / Libur (toggle)
  - Jam Mulai (jika kerja)
  - Jam Selesai (jika kerja)
    |
    v
Simpan -> Template jadwal mingguan tersimpan
```

Contoh Template:

| Hari | Status | Jam Mulai | Jam Selesai |
|---|---|---|---|
| Senin | Kerja | 09:00 | 17:00 |
| Selasa | Kerja | 09:00 | 17:00 |
| Rabu | Kerja | 09:00 | 17:00 |
| Kamis | Kerja | 09:00 | 17:00 |
| Jumat | Kerja | 09:00 | 17:00 |
| Sabtu | Kerja | 10:00 | 18:00 |
| Minggu | Libur | - | - |

#### 7.8.2 Jadwal Libur Rolling

```
Owner buka kalender jadwal barber
    |
    v
Pilih tanggal -> Klik "Tandai Libur"
    |
    v
Input keterangan (opsional): Cuti, Sakit, Libur Nasional
    |
    v
Simpan -> Tanggal tersebut tidak tersedia untuk booking
Booking yang sudah ada perlu di-reschedule oleh kasir
```

Formula Slot Tersedia:
```
Slot Tersedia = Jam Kerja (template mingguan)
                - Durasi booking yang sudah confirmed/in-progress
                - Tanggal libur rolling barber
```

---

### 7.9 Management Staff (Owner)

**Aktor**: Owner

#### 7.9.1 Daftar Staff

Tampilkan: Nama, Foto, Role (Cashier/Barber), Cabang, Status Akun
Filter: per role, per cabang, per status
Aksi: Edit, Reset Password, Non-aktifkan

#### 7.9.2 Tambah Staff Baru

```
Owner klik "Tambah Staff" -> Pilih Role: Cashier ATAU Barber
    |
    v
Input form:
  - Nama Lengkap
  - Email (untuk login)
  - Nomor HP
  - Password awal
  - Cabang (assign)
  - [Jika Barber] Persentase komisi (%)
    |
    v
Simpan -> Akun langsung aktif, staff bisa login
```

#### 7.9.3 Kelola Staff

- Edit data profil staff
- Pindah cabang (re-assign)
- Ubah persentase komisi (barber)
- Aktifkan / Non-aktifkan akun
- Reset password (owner set password baru)

Aturan Bisnis:
- Staff yang dinonaktifkan tidak bisa login
- Barber yang dinonaktifkan tidak muncul di form booking customer
- Hanya Owner yang bisa mengelola akun staff

---

### 7.10 Laporan Komisi Barber

**Aktor**: Owner (semua barber & cabang), Barber (komisi dirinya sendiri)

#### 7.10.1 Formula Komisi

```
Komisi Barber = Total Pendapatan Service x Persentase Komisi Barber

Contoh:
  Barber A (Komisi: 40%), periode: Juni 2026
  Transaksi:
    10 x Hair Cut Regular @ Rp 60.000 = Rp 600.000
     5 x Hair Cut Premium @ Rp 100.000 = Rp 500.000
  Total Pendapatan Service = Rp 1.100.000
  Komisi Barber A = Rp 1.100.000 x 40% = Rp 440.000

Catatan: Komisi dihitung dari pendapatan SERVICE SAJA,
         tidak termasuk penjualan produk.
```

#### 7.10.2 Filter Laporan Komisi

- Periode: Harian, Mingguan, Bulanan, Custom (date range)
- Barber (untuk Owner)
- Cabang (untuk Owner)

Data yang ditampilkan:
| Kolom | Keterangan |
|---|---|
| Nama Barber | |
| Cabang | |
| Total Booking Selesai | Jumlah transaksi service dalam periode |
| Total Pendapatan Service | Akumulasi harga service |
| Persentase Komisi | % komisi barber |
| Total Komisi | Nilai komisi dalam rupiah |

Tampilan Barber (Self View):
- Hanya data komisi miliknya sendiri
- Rincian per booking: tanggal, customer, service, harga, komisi per transaksi

---

### 7.11 Dashboard per Role

#### 7.11.1 Dashboard Owner

Konten:
- Summary cards (filter semua cabang / per cabang): Total Omset, Total Booking, Total Produk Terjual, Total Komisi Barber
- Grafik omset: line chart 30 hari terakhir, bisa filter per cabang
- Performa barber: tabel Nama | Cabang | Booking | Pendapatan | Komisi
- Breakdown tipe pembayaran: chart Cash vs Transfer vs QRIS
- Booking terbaru: 5 terakhir dari semua cabang

#### 7.11.2 Dashboard Cashier

Konten:
- Summary hari ini: Total Booking, In-Progress, Completed, Omset, Produk Terjual
- Notifikasi real-time: bell icon + badge, list booking baru
- Booking hari ini: list + status + quick action (Mulai Service / Buka POS)
- Transaksi terbaru: 5 transaksi terakhir hari ini

#### 7.11.3 Dashboard Barber

Konten:
- Jadwal hari ini: jam kerja & status (Kerja / Libur)
- Booking hari ini: list yang di-assign ke barber ini (customer, service, jam, status)
- Komisi bulan ini: total pendapatan service, total komisi, persentase komisi saya
- Riwayat service 7 hari terakhir: tanggal, customer, service, komisi per transaksi

---

### 7.12 Notifikasi Real-time

**Teknologi**: Laravel Reverb (WebSocket)

#### 7.12.1 Tabel Event Notifikasi

| Event | Dikirim Ke | Isi Notifikasi |
|---|---|---|
| Booking baru dari landing page | Cashier cabang + Barber di-assign | "Booking baru dari [Nama] untuk [Service] pada [Tanggal Jam]" |
| Booking di-assign ke barber | Barber yang di-assign | "Kamu mendapat booking baru dari [Nama Customer]" |
| Booking di-cancel oleh cashier | Barber yang di-assign | "Booking [Customer] pada [Waktu] telah dibatalkan" |
| Booking dimulai (In-Progress) | Barber yang di-assign | "Service [Nama Service] untuk [Customer] dimulai" |

#### 7.12.2 UI Notifikasi

- Bell icon di navbar dengan badge jumlah notifikasi belum dibaca
- Dropdown list notifikasi terbaru (update real-time via WebSocket)
- Klik notifikasi -> redirect ke halaman yang relevan
- Tandai sudah dibaca (satu per satu atau semua sekaligus)

---

## 8. Entity Relationship (High-Level ERD)

Entitas dan relasi utama:

```
Branch
  |-- has many --> Staff (cashier / barber)
  |-- has many --> Booking
  |-- has many --> Product

Customer
  |-- has many --> Booking

Booking
  |-- belongs to --> Branch
  |-- belongs to --> Customer (nullable, atau guest_name + guest_phone)
  |-- belongs to --> Barber (Staff)
  |-- belongs to --> Service
  |-- has one   --> Transaction

  Fields: branch_id, barber_id, cashier_id, customer_id,
          guest_name, guest_phone, service_id,
          slot_start, slot_end, status

Transaction
  |-- belongs to --> Booking
  |-- belongs to --> Cashier (Staff)
  |-- has many   --> TransactionItem
  |-- has one    --> CommissionRecord

  Fields: booking_id, cashier_id, payment_type,
          total_service, total_product, grand_total

TransactionItem
  |-- belongs to --> Transaction
  Fields: transaction_id, type (service/product),
          ref_id, qty, unit_price

CommissionRecord
  |-- belongs to --> Transaction
  |-- belongs to --> Barber
  Fields: barber_id, transaction_id,
          service_amount, percentage, commission_amount

Service
  |-- has many --> BarberService (harga override per barber)

BarberService
  Fields: barber_id, service_id, price

Staff (Barber)
  |-- has many --> WeeklySchedule (shift mingguan)
  |-- has many --> LeaveSchedule (libur rolling)

WeeklySchedule
  Fields: barber_id, day_of_week, start_time, end_time, is_off

LeaveSchedule
  Fields: barber_id, leave_date, notes

Product
  |-- belongs to --> Branch
  Fields: branch_id, name, category, price, stock, status
```

---

## 9. Business Rules

| # | Rule ID | Pernyataan | Dampak |
|---|---|---|---|
| 1 | BR-01 | Customer hanya bisa booking 1 service per booking | Form booking hanya allow 1 service dipilih |
| 2 | BR-02 | Slot waktu booking dihitung dinamis berdasarkan durasi service | Tidak ada slot waktu tetap |
| 3 | BR-03 | Harga service bisa berbeda per barber | Tampilkan override jika ada, fallback ke harga default |
| 4 | BR-04 | Booking langsung CONFIRMED saat customer submit | Tidak ada approval flow |
| 5 | BR-05 | Hanya Cashier yang bisa cancel booking | Customer tidak dapat self-cancel di MVP |
| 6 | BR-06 | Status COMPLETED hanya saat transaksi POS tercatat | Otomatis berubah saat kasir proses pembayaran |
| 7 | BR-07 | Komisi dihitung dari pendapatan SERVICE saja | Penjualan produk tidak masuk kalkulasi komisi |
| 8 | BR-08 | Persentase komisi diset unik per barber | Bukan setting global |
| 9 | BR-09 | Stok produk berkurang otomatis saat transaksi POS | Tidak bisa jual produk jika stok = 0 |
| 10 | BR-10 | Cashier & Barber hanya akses data cabangnya sendiri | Query di-scope dengan branch_id |
| 11 | BR-11 | Owner dapat mengakses data semua cabang | Termasuk laporan, staff, booking |
| 12 | BR-12 | Barber non-aktif tidak muncul di form booking customer | |
| 13 | BR-13 | Service non-aktif tidak muncul di form booking customer | |
| 14 | BR-14 | Hari libur rolling barber memblokir slot booking | |
| 15 | BR-15 | Transaksi POS bersifat atomik | Gagal satu langkah -> seluruh transaksi dibatalkan |
| 16 | BR-16 | Slot booking tidak boleh overlap per barber | Validasi dengan DB lock untuk concurrency |

---

## 10. Non-Functional Requirements

| Aspek | Requirement | Detail |
|---|---|---|
| **Performance** | Halaman landing page load < 3 detik | Pada koneksi rata-rata 4G |
| **Responsivitas** | Tampilan optimal di desktop & mobile | Breakpoint: 375px, 768px, 1280px |
| **Real-time Latency** | Notifikasi terkirim < 2 detik setelah event | Via Laravel Reverb WebSocket |
| **Security** | CSRF protection, server-side validation semua input | Laravel built-in security |
| **Data Isolation** | Semua query staff di-scope dengan branch_id | Middleware atau Global Scope di Eloquent |
| **Concurrency** | Tidak ada double-booking pada slot yang sama | DB transaction + optimistic locking |
| **Availability** | Target uptime 99% | |
| **Maintainability** | PSR-12 (PHP) dan ESLint (JS) | Agar mudah dikembangkan |

---

## 11. Future Roadmap (Post-MVP)

| Fase | Versi | Fitur |
|---|---|---|
| Post-MVP 1 | v1.1 | Export laporan komisi & transaksi ke PDF/Excel |
| Post-MVP 2 | v1.2 | Notifikasi WhatsApp otomatis (konfirmasi booking, reminder H-1) |
| Post-MVP 3 | v1.3 | Loyalty program / sistem poin untuk customer member |
| Post-MVP 4 | v2.0 | Integrasi payment gateway (Midtrans/Xendit) |
| Post-MVP 5 | v2.1 | Mobile app (React Native) untuk barber |
| Post-MVP 6 | v2.2 | Inventory management lanjutan: alert stok, riwayat restock |
| Post-MVP 7 | v3.0 | Platform SaaS multi-tenant untuk jaringan franchise |

---

*Dokumen PRD ini disusun berdasarkan hasil sesi requirements elicitation.*
*Perlu validasi dan sign-off dari klien Howell Barbershop sebelum masuk ke fase desain database dan development.*

---

**Disiapkan oleh:** Tim Pengembang
**Divalidasi oleh:** *(tanda tangan klien)*
**Dokumen berikutnya:** ERD Detail + Database Schema + API Specification
