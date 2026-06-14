# Database Design Document
# Howell Barbershop — Sistem Informasi Manajemen & Booking Online

| Field | Detail |
|---|---|
| **Dokumen** | Database Design Document |
| **Versi** | 1.0.0 |
| **Target RDBMS** | PostgreSQL 15+ |
| **Status** | Final — Siap Implementasi Migrasi |

---

## 1. Pendahuluan

Dokumen ini mendefinisikan rancangan basis data untuk aplikasi manajemen dan booking online **Howell Barbershop**. Rancangan ini dioptimalkan untuk performa tinggi di lingkungan **PostgreSQL**, menerapkan indexing strategis untuk operasi harian yang krusial (seperti pengecekan ketersediaan slot barber dan POS), serta menjamin integritas data transaksi menggunakan kombinasi **Soft Deletes** dan **Foreign Key Constraint**.

### Keputusan Arsitektur Database:
1. **RDBMS**: PostgreSQL digunakan untuk memanfaatkan fitur indeks canggih (seperti *partial indexes* dan pencarian rentang waktu/timestamp secara efisien).
2. **Primary Key (PK) Hybrid**:
   * **Internal PK**: Menggunakan `BIGSERIAL` (Auto-Increment BigInteger) untuk semua primary key fisik demi efisiensi join dan ukuran index b-tree.
   * **Public Key**: Menggunakan kolom `uuid` (tipe data `UUID` PostgreSQL) untuk rujukan entitas luar di API dan URL (menghindari manipulasi ID/guessing).
3. **Penyimpanan Foto**: Menggunakan atribut kolom bertipe `VARCHAR` (menyimpan path string lokal/S3) langsung pada entitas terkait (`users`, `barbers`, `services`, `products`) untuk performa baca maksimum tanpa join tambahan.
4. **Soft Deletes**: Menggunakan kolom timestamp `deleted_at` pada tabel master untuk mengisolasi data tidak aktif tanpa memutus relasi historis transaksi.

---

## 2. Struktur Tabel & Skema Detail

### 2.1 Tabel `branches` (Cabang Barbershop)
Tabel untuk mengelola multi-cabang Howell Barbershop.

```sql
CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 2.2 Tabel `users` (Pengguna Sistem)
Tabel kredensial dan data dasar untuk semua role (Owner, Cashier, Barber, Customer).

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'cashier', 'barber', 'customer')),
    photo_path VARCHAR(255) NULL, -- Path foto profil user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 2.3 Tabel `barbers` (Profil Barber)
Tabel profil spesifik barber yang terelasi ke user dan cabang tertentu.

```sql
CREATE TABLE barbers (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    branch_id BIGINT NOT NULL,
    commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 40.00, -- Persentase komisi (misal: 40.00 untuk 40%)
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    photo_path VARCHAR(255) NULL, -- Override foto khusus display barber
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_barbers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_barbers_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);
```

### 2.4 Tabel `services` (Layanan Barbershop)
Tabel master layanan yang disediakan secara default.

```sql
CREATE TABLE services (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Haircut, Coloring, Treatment, dll.
    description TEXT NULL,
    duration_minutes INTEGER NOT NULL, -- Untuk kalkulasi rentang slot booking
    default_price DECIMAL(12,2) NOT NULL,
    photo_path VARCHAR(255) NULL, -- Foto contoh hasil layanan
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);
```

### 2.5 Tabel `barber_services` (Harga Layanan Ter-override Barber)
Menampung penyesuaian harga layanan berdasarkan level keahlian barber (misal: Barber Senior memiliki harga haircut lebih tinggi dibanding Barber Junior).

```sql
CREATE TABLE barber_services (
    id BIGSERIAL PRIMARY KEY,
    barber_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    price DECIMAL(12,2) NOT NULL, -- Harga override untuk barber ini
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_barber_services_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    CONSTRAINT fk_barber_services_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT uq_barber_service UNIQUE (barber_id, service_id)
);
```

### 2.6 Tabel `products` (Produk Retail Per Cabang)
Tabel stok produk (seperti pomade, vitamin rambut) per cabang.

```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    branch_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Pomade, Vitamin, Shampoo, Aksesoris
    price DECIMAL(12,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    photo_path VARCHAR(255) NULL, -- Foto produk
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    CONSTRAINT fk_products_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT
);
```

### 2.7 Tabel `bookings` (Pemesanan Slot)
Menyimpan transaksi pemesanan layanan oleh pelanggan.

```sql
CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    branch_id BIGINT NOT NULL,
    customer_id BIGINT NULL, -- Nullable jika dipesan sebagai Guest
    guest_name VARCHAR(100) NULL,
    guest_phone VARCHAR(20) NULL,
    barber_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL, -- Waktu mulai booking
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL, -- Waktu selesai booking (slot_start + service duration)
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_bookings_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);
```

### 2.8 Tabel `transactions` (POS Transaksi Pembayaran)
Mencatat transaksi akhir pembayaran yang diproses di kasir.

```sql
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL, -- TRX-YYYYMMDD-XXXX
    booking_id BIGINT NULL, -- Nullable jika transaksi POS murni produk tanpa booking haircut
    cashier_id BIGINT NOT NULL, -- Referensi ke users(id) dengan role cashier/owner
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('cash', 'transfer', 'qris')),
    total_service DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_product DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transactions_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_cashier FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE RESTRICT
);
```

### 2.9 Tabel `transaction_items` (Item Detil Transaksi)
Menampung rincian layanan dan produk yang dibeli dalam satu transaksi.

```sql
CREATE TABLE transaction_items (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('service', 'product')),
    reference_id BIGINT NOT NULL, -- Merujuk ke services.id jika service, atau products.id jika product
    qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_transaction_items_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
```

### 2.10 Tabel `commission_records` (Catatan Komisi Pendapatan Barber)
Tabel terisolasi untuk merekam komisi barber per service yang diselesaikan secara real-time.

```sql
CREATE TABLE commission_records (
    id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL,
    barber_id BIGINT NOT NULL,
    service_amount DECIMAL(12,2) NOT NULL, -- Nilai pendapatan dari service saja
    percentage DECIMAL(5,2) NOT NULL, -- Persentase komisi yang berlaku saat transaksi terjadi
    commission_amount DECIMAL(12,2) NOT NULL, -- Hasil perhitungan (service_amount * percentage / 100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_commissions_tx FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    CONSTRAINT fk_commissions_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE RESTRICT
);
```

### 2.11 Tabel `weekly_schedules` (Jadwal Kerja Barber Mingguan)
Menentukan jam operasional kerja default barber per hari dalam seminggu.

```sql
CREATE TABLE weekly_schedules (
    id BIGSERIAL PRIMARY KEY,
    barber_id BIGINT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Minggu, 1 = Senin, dst.
    start_time TIME NULL, -- Jam mulai (null jika hari libur)
    end_time TIME NULL, -- Jam selesai (null jika hari libur)
    is_off BOOLEAN NOT NULL DEFAULT FALSE, -- Menandakan hari libur rutin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_schedules_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    CONSTRAINT uq_barber_day UNIQUE (barber_id, day_of_week)
);
```

### 2.12 Tabel `leave_schedules` (Jadwal Cuti/Libur Tambahan Barber)
Menampung tanggal libur insidental (sakit, cuti tahunan, dll) untuk memblokir ketersediaan booking.

```sql
CREATE TABLE leave_schedules (
    id BIGSERIAL PRIMARY KEY,
    barber_id BIGINT NOT NULL,
    leave_date DATE NOT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_leaves_barber FOREIGN KEY (barber_id) REFERENCES barbers(id) ON DELETE CASCADE,
    CONSTRAINT uq_barber_leave_date UNIQUE (barber_id, leave_date)
);
```

---

## 3. Strategi Indexing & Optimasi Performa

Untuk mendapatkan performa maksimal dengan volume data tinggi, skema PostgreSQL ini menerapkan strategi indexing khusus:

### 3.1 Pengecekan Ketersediaan Barber (Booking Collision Check)
Ketika customer memilih slot booking, sistem harus memeriksa apakah Barber A sedang sibuk pada rentang waktu `slot_start` dan `slot_end`. Query yang dijalankan:
```sql
SELECT 1 FROM bookings 
WHERE barber_id = :barber_id 
  AND status IN ('confirmed', 'in_progress') 
  AND slot_start < :requested_end 
  AND slot_end > :requested_start;
```
#### Optimasi Indeks: **Partial Composite Index**
Karena booking dengan status `cancelled` atau `completed` tidak lagi memblokir slot waktu, kita tidak perlu memasukkannya ke dalam indeks pencarian slot aktif. Kita membuat **Partial Index** untuk memperkecil ukuran index file dan mempercepat pencarian:
```sql
CREATE INDEX idx_bookings_active_slots 
ON bookings (barber_id, slot_start, slot_end) 
WHERE status IN ('confirmed', 'in_progress');
```
*Mengapa ini cepat?* PostgreSQL hanya akan memindai data booking yang masih berjalan, mengabaikan ribuan baris booking masa lalu (`completed`) atau batal (`cancelled`).

### 3.2 Isolasi Multi-Cabang (Multi-Branch Partitioning / Filtering)
Semua query kasir dan barber disaring berdasarkan `branch_id`. Contoh:
```sql
SELECT * FROM products WHERE branch_id = :branch_id AND status = 'active';
```
#### Optimasi Indeks: **Composite B-Tree Indexes**
Untuk tabel-tabel transaksional dan master yang sering difilter berdasarkan cabang dan status, kita menerapkan composite index:
```sql
-- Produk per cabang
CREATE INDEX idx_products_branch_status ON products (branch_id, status);

-- Booking per cabang untuk antrean kasir harian
CREATE INDEX idx_bookings_branch_time ON bookings (branch_id, slot_start);
```

### 3.3 Pencarian Unik & Login
*   **Unique Index** secara otomatis dibuat untuk kolom `users.email`.
*   Kita menambahkan **Unique Index** untuk kolom nomor ponsel (`users.phone`) untuk pencarian cepat customer kasir walk-in berdasarkan nomor HP:
```sql
CREATE UNIQUE INDEX idx_users_phone_unique ON users (phone) WHERE deleted_at IS NULL;
```
*(Catatan: Menggunakan filter `WHERE deleted_at IS NULL` memungkinkan nomor ponsel yang sama didaftarkan kembali jika akun sebelumnya telah di-soft-delete).*

### 3.4 Laporan Komisi Barber (Real-time Commission Analytics)
Owner dan barber sering memantau komisi mereka per periode waktu tertentu. Query:
```sql
SELECT * FROM commission_records 
WHERE barber_id = :barber_id 
  AND created_at BETWEEN :start_date AND :end_date;
```
#### Optimasi Indeks: **Composite Index**
```sql
CREATE INDEX idx_commissions_barber_date ON commission_records (barber_id, created_at DESC);
```
Ini membuat pencarian komisi barber harian/bulanan terurut langsung dari transaksi terbaru tanpa melakukan penyortiran memori tambahan (*Avoid Filesort*).

### 3.5 UUID Lookups
Karena UUID digunakan sebagai pengenal publik di URL (misal: `/invoice/{uuid}` atau `/booking/{uuid}`), pencarian berdasarkan UUID akan sering terjadi dari request client.
```sql
CREATE UNIQUE INDEX idx_bookings_uuid ON bookings (uuid);
```
*(Meskipun PostgreSQL mendukung UUID asli, pembuatan indeks unik ini memastikan pencarian direct data dari front-end diselesaikan dalam waktu O(1)).*

---

## 4. Rangkuman Indexing yang Dibuat

Berikut daftar perintah DDL Indexing lengkap yang wajib dieksekusi pasca pembuatan tabel:

```sql
-- 1. Index pencarian ketersediaan slot (aktif)
CREATE INDEX idx_bookings_active_slots 
ON bookings (barber_id, slot_start, slot_end) 
WHERE status IN ('confirmed', 'in_progress');

-- 2. Index pencarian UUID untuk rujukan URL Publik
CREATE UNIQUE INDEX idx_users_uuid ON users (uuid);
CREATE UNIQUE INDEX idx_barbers_uuid ON barbers (uuid);
CREATE UNIQUE INDEX idx_services_uuid ON services (uuid);
CREATE UNIQUE INDEX idx_products_uuid ON products (uuid);
CREATE UNIQUE INDEX idx_bookings_uuid ON bookings (uuid);
CREATE UNIQUE INDEX idx_transactions_uuid ON transactions (uuid);

-- 3. Index pencarian nomor HP unik untuk registrasi/kasir
CREATE UNIQUE INDEX idx_users_phone_unique ON users (phone) WHERE deleted_at IS NULL;

-- 4. Index filter cabang pada produk & booking kasir
CREATE INDEX idx_products_branch_status ON products (branch_id, status);
CREATE INDEX idx_bookings_branch_time ON bookings (branch_id, slot_start DESC);

-- 5. Index laporan komisi & histori performa barber
CREATE INDEX idx_commissions_barber_date ON commission_records (barber_id, created_at DESC);
CREATE INDEX idx_bookings_barber_status ON bookings (barber_id, status);
```

Dengan desain skema dan strategi indexing di atas, database Howell Barbershop dijamin memiliki integritas data yang kokoh sekaligus performa query yang sangat responsif, bahkan saat volume data booking dan transaksi POS meningkat pesat.
