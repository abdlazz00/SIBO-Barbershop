# Diagram Konteks & Alur Sistem (Context Diagram)

## Howell Barbershop — Sistem Informasi Manajemen & Booking Online

Dokumen ini mendefinisikan **Diagram Konteks (Context Diagram)** tingkat tinggi (DFD Level 0) dan aliran data sistem global untuk Howell Barbershop.

---

## 1. Diagram Konteks (Mermaid DFD Level 0)

Diagram Konteks menempatkan **Sistem Informasi & Booking Online (Howell Barbershop)** sebagai proses pusat, dengan aliran data yang terhubung langsung ke empat entitas eksternal: **Customer**, **Kasir (Cashier)**, **Barber**, dan **Owner**.

```mermaid
graph TD
    %% Define System Process
    System["● Sistem Informasi & Booking Online (Howell Barbershop)"]
    style System fill:#2D1B69,stroke:#C2EF4E,stroke-width:2px,color:#ffffff

    %% Define External Entities
    Customer["👤 Customer"]
    Cashier["💼 Kasir (Cashier)"]
    Barber["💈 Barber"]
    Owner["👑 Owner"]

    style Customer fill:#f8f7ff,stroke:#7C5CBF,stroke-width:2px,color:#1A0F3D
    style Cashier fill:#f8f7ff,stroke:#7C5CBF,stroke-width:2px,color:#1A0F3D
    style Barber fill:#f8f7ff,stroke:#7C5CBF,stroke-width:2px,color:#1A0F3D
    style Owner fill:#f8f7ff,stroke:#7C5CBF,stroke-width:2px,color:#1A0F3D

    %% Data Flows: Customer
    Customer -- "1. Data Registrasi & Login<br/>2. Input Booking (Cabang, Layanan, Barber, Jadwal)<br/>3. Pembaruan Profil" --> System
    System -- "1. Info Cabang, Layanan, Barber & Slot Waktu<br/>2. Detail Booking & Konfirmasi<br/>3. Data Profil & Nota Transaksi (jika Member)" --> Customer

    %% Data Flows: Cashier
    Cashier -- "1. Kredensial Login<br/>2. Booking Manual (Walk-in)<br/>3. Update Status Booking (In-Progress/Cancelled)<br/>4. Data Transaksi POS (Booking ID, Produk, Tipe Bayar)<br/>5. Penyesuaian Stok (Restock & Opname Cabang)" --> System
    System -- "1. Dashboard Antrean & Notifikasi Real-time<br/>2. Detail Booking & Riwayat Transaksi Cabang<br/>3. Cetak Struk Transaksi POS<br/>4. Status & Riwayat Stok Produk Cabang" --> Cashier

    %% Data Flows: Barber
    Barber -- "1. Kredensial Login<br/>2. Pembaruan Profil" --> System
    System -- "1. Dashboard Jadwal & Status Shift Kerja<br/>2. Notifikasi Booking assigned/updated/cancelled<br/>3. Laporan Komisi Pribadi & Riwayat Payout" --> Barber

    %% Data Flows: Owner
    Owner -- "1. Kredensial Login<br/>2. Kelola Cabang, Layanan, Staff & Produk Global<br/>3. Kelola Shift Mingguan & Libur/Cuti Staff<br/>4. Setting Override Harga Layanan per Barber<br/>5. Input Pembayaran Komisi Barber (Payout)" --> System
    System -- "1. Dashboard Global (Multi-Cabang)<br/>2. Laporan Omset & Grafik Tren Keuangan<br/>3. Laporan Transaksi Global (Semua Cabang)<br/>4. Laporan Performa & Komisi Semua Barber<br/>5. Kwitansi Bukti Payout Komisi (Cetak) & Riwayat Payout" --> Owner
```

---

## 2. Aliran Data Rinci (Data Flow Details)

### 2.1 Customer (Pelanggan)

* **Aliran Masuk (Data Input ke Sistem)**:
  * **Data Registrasi & Login**: Nama, email, no HP, dan password untuk membuat/mengakses akun member.
  * **Data Reservasi Booking**: Pilihan cabang, jenis layanan/treatment, barber, serta slot tanggal & waktu.
  * **Update Profil**: Perubahan data diri pribadi.
* **Aliran Keluar (Data Output dari Sistem)**:
  * **Katalog & Slot Ketersediaan**: Informasi detail cabang, layanan, harga, barber, dan slot waktu yang tersedia secara real-time.
  * **Konfirmasi & Detail Booking**: Lembar e-receipt booking dengan status `CONFIRMED` yang berisi kode booking dan instruksi reservasi.
  * **Nota Pembayaran (Invoice)**: Riwayat transaksi retail/treatment jika melakukan transaksi sebagai member.

### 2.2 Kasir (Cashier)

* **Aliran Masuk (Data Input ke Sistem)**:
  * **Booking Manual (Walk-in)**: Input reservasi langsung untuk customer yang tidak menggunakan website booking online.
  * **Update Status Layanan**: Pembaruan status booking dari `CONFIRMED` menjadi `IN-PROGRESS` (layanan dimulai) atau `CANCELLED`.
  * **Data Transaksi POS**: Checkout tagihan booking dengan menambahkan produk retail (pomade, shampoo, dsb), kuantitas, dan metode pembayaran.
  * **Mutasi Stok Produk**: Form input bulk restock (stok masuk) dan bulk opname (penyesuaian stok fisik) di cabang bersangkutan.
* **Aliran Keluar (Data Output dari Sistem)**:
  * **Visualisasi Dashboard**: Daftar antrean harian cabang, status barber, dan notifikasi real-time via WebSocket.
  * **Cetak Struk Pembayaran**: Nota kasir format thermal roll untuk diserahkan ke pelanggan.
  * **Laporan Cabang**: Rekapitulasi transaksi harian dan status inventaris/stok retail cabang.

### 2.3 Barber

* **Aliran Masuk (Data Input ke Sistem)**:
  * **Kredensial Login**: Akses otentikasi dashboard internal barber.
* **Aliran Keluar (Data Output dari Sistem)**:
  * **Tugas Antrean Hari Ini**: Jadwal detail pengerjaan customer dan jenis layanan yang di-assign padanya.
  * **Notifikasi Real-time**: Peringatan saat ada booking baru, booking dipindah, atau dibatalkan oleh kasir.
  * **Laporan Komisi**: Transparansi perhitungan komisi jasa secara kumulatif berdasarkan persentase komisi yang ditetapkan owner.
  * **Riwayat Payout**: Informasi dan rincian transaksi pencairan komisi yang telah dibayarkan oleh Owner.

### 2.4 Owner (Pemilik)

* **Aliran Masuk (Data Input ke Sistem)**:
  * **Data Master Global**: Kelola data cabang, katalog layanan, data produk global, dan pendaftaran staff baru (kasir & barber).
  * **Roster & Penjadwalan**: Roster jam kerja mingguan staff dan tanggal libur cuti (leave schedule).
  * **Kebijakan Komisi & Harga**: Penetapan persentase komisi per barber dan pengaturan override harga layanan jika ada harga khusus per barber.
  * **Input Pembayaran Komisi (Payout)**: Memproses pembayaran komisi belum dibayar untuk barber tertentu (memilih satu atau beberapa transaksi komisi, memasukkan metode pembayaran, no. referensi, dan catatan).
* **Aliran Keluar (Data Output dari Sistem)**:
  * **Dashboard Keuangan Global**: Grafik tren omset, perbandingan pendapatan antar cabang, rekapitulasi penjualan produk, dan breakdown biaya komisi.
  * **Laporan Audit**: Riwayat transaksi detail dari semua cabang dan laporan kerja performa barber.
  * **Kwitansi & Riwayat Payout**: Kwitansi bukti pembayaran komisi yang mencakup seluruh item transaksi komisi yang dibayarkan dan riwayat pencairannya.

---

## 3. Aliran Sistem Global (Global Sequence Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Guest/Member)
    actor Cashier as Kasir (Cashier)
    actor Barber as Barber (Staff)
    actor Owner as Pemilik (Owner)
    participant System as Sistem Howell Barbershop

    %% Booking
    Customer->>System: Cari slot waktu (Cabang, Layanan, Barber, Tanggal)
    System-->>Customer: Tampilkan slot waktu tersedia (dihitung dinamis)
    Customer->>System: Kirim form booking (Data Diri + Pilihan slot)
    System->>System: Validasi concurrency & DB Lock slot waktu
    System-->>Customer: Konfirmasi Booking (Status: CONFIRMED)
    System-->>Cashier: Notifikasi Real-time: Booking Baru (Laravel Reverb)
    System-->>Barber: Notifikasi Real-time: Tugas Booking Baru (Laravel Reverb)

    %% Layanan
    Cashier->>System: Ubah status booking menjadi [IN-PROGRESS] (Customer datang)
    System-->>Barber: Notifikasi Real-time: Mulai Pengerjaan Layanan
    Barber->>Customer: Melakukan haircut / treatment

    %% Pembayaran
    Cashier->>System: Buka POS -> Pilih booking -> Tambah produk -> Proses Transaksi
    System->>System: Kurangi stok produk cabang, hitung komisi barber, ubah status [COMPLETED]
    System-->>Cashier: Tampilkan Struk/Nota Pembayaran (Thermal)
    System-->>Barber: Update Laporan Komisi Bulan Ini

    %% Monitoring & Payout
    Owner->>System: Buka dashboard global & rekap laporan
    System-->>Owner: Tampilkan omset, transaksi, & performa staff semua cabang
    Owner->>System: Pilih beberapa transaksi komisi & input Pembayaran (Payout)
    System->>System: Rekam data Payout, kaitkan dengan record komisi, perbarui status menjadi Paid
    System-->>Owner: Tampilkan & Cetak Bukti Payout Komisi (Gabungan)
    System-->>Barber: Tampilkan status komisi Terbayar di Riwayat Payout
```
