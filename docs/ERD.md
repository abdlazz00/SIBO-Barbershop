# Entity Relationship Diagram (ERD)
## Howell Barbershop — Sistem Informasi Manajemen & Booking Online

> **Catatan Schema:**
> - `products` tidak lagi memiliki `branch_id` dan `stock` (di-drop saat restrukturisasi stok).
> - Stok produk dikelola per-cabang melalui tabel pivot `branch_product_stocks`.
> - `product_stock_mutations` memiliki `branch_id` untuk melacak mutasi per cabang.
> - `commission_records` terhubung ke `commission_payouts` melalui `payout_id` (nullable) untuk mencatat histori pembayaran komisi barber.

---

```mermaid
erDiagram

    %% ============================================================
    %% CORE ENTITIES
    %% ============================================================

    users {
        bigint      id                  PK
        uuid        uuid                UK
        varchar     name
        varchar     email               UK
        timestamp   email_verified_at
        varchar     password
        varchar     phone               UK
        varchar     role
        varchar     photo_path
        varchar     remember_token
        timestamp   created_at
        timestamp   updated_at
        timestamp   deleted_at
        bigint      branch_id           FK
    }

    branches {
        bigint      id                  PK
        uuid        uuid                UK
        varchar     name
        text        address
        varchar     phone
        timestamp   created_at
        timestamp   updated_at
        timestamp   deleted_at
    }

    barbers {
        bigint      id                  PK
        uuid        uuid                UK
        bigint      user_id             FK
        bigint      branch_id           FK
        decimal     commission_percentage
        varchar     status
        varchar     photo_path
        timestamp   created_at
        timestamp   updated_at
        timestamp   deleted_at
    }

    services {
        bigint      id                  PK
        uuid        uuid                UK
        varchar     name
        varchar     category
        text        description
        integer     duration_minutes
        decimal     default_price
        varchar     photo_path
        varchar     status
        timestamp   created_at
        timestamp   updated_at
        timestamp   deleted_at
    }

    %% ============================================================
    %% PIVOT / JUNCTION TABLES
    %% ============================================================

    barber_services {
        bigint      id                  PK
        bigint      barber_id           FK
        bigint      service_id          FK
        decimal     price
        timestamp   created_at
        timestamp   updated_at
    }

    %% ============================================================
    %% PRODUCT & INVENTORY
    %% ============================================================

    products {
        bigint      id                  PK
        uuid        uuid                UK
        varchar     name
        varchar     category
        decimal     price
        varchar     photo_path
        varchar     status
        timestamp   created_at
        timestamp   updated_at
        timestamp   deleted_at
    }

    branch_product_stocks {
        bigint      id                  PK
        bigint      product_id          FK
        bigint      branch_id           FK
        integer     stock
        timestamp   created_at
        timestamp   updated_at
    }

    product_stock_mutations {
        bigint      id                  PK
        bigint      product_id          FK
        bigint      branch_id           FK
        varchar     type
        bigint      reference_id
        integer     qty
        integer     stock_before
        integer     stock_after
        text        notes
        bigint      created_by          FK
        timestamp   created_at
        timestamp   updated_at
    }

    %% ============================================================
    %% BOOKING & SCHEDULING
    %% ============================================================

    bookings {
        bigint      id                  PK
        uuid        uuid                UK
        bigint      branch_id           FK
        bigint      customer_id         FK
        varchar     guest_name
        varchar     guest_phone
        bigint      barber_id           FK
        bigint      service_id          FK
        timestamp   slot_start
        timestamp   slot_end
        varchar     status
        timestamp   created_at
        timestamp   updated_at
    }

    weekly_schedules {
        bigint      id                  PK
        bigint      barber_id           FK
        integer     day_of_week
        time        start_time
        time        end_time
        boolean     is_off
        timestamp   created_at
        timestamp   updated_at
    }

    leave_schedules {
        bigint      id                  PK
        bigint      barber_id           FK
        date        leave_date
        varchar     notes
        timestamp   created_at
        timestamp   updated_at
    }

    %% ============================================================
    %% TRANSACTION & POS
    %% ============================================================

    transactions {
        bigint      id                  PK
        uuid        uuid                UK
        varchar     invoice_number      UK
        bigint      booking_id          FK
        bigint      cashier_id          FK
        varchar     payment_type
        decimal     total_service
        decimal     total_product
        decimal     grand_total
        timestamp   created_at
        timestamp   updated_at
    }

    transaction_items {
        bigint      id                  PK
        bigint      transaction_id      FK
        varchar     item_type
        bigint      reference_id
        integer     qty
        decimal     unit_price
        decimal     subtotal
        timestamp   created_at
    }

    %% ============================================================
    %% COMMISSION
    %% ============================================================

    commission_records {
        bigint      id                  PK
        bigint      transaction_id      FK
        bigint      barber_id           FK
        decimal     service_amount
        decimal     percentage
        decimal     commission_amount
        timestamp   created_at
        bigint      payout_id           FK
    }

    commission_payouts {
        bigint      id                  PK
        bigint      barber_id           FK
        bigint      paid_by             FK
        decimal     payout_amount
        varchar     payment_method
        varchar     reference_number
        text        notes
        timestamp   paid_at
        timestamp   created_at
        timestamp   updated_at
    }

    %% ============================================================
    %% AUTH SUPPORT
    %% ============================================================

    password_reset_tokens {
        varchar     email               PK
        varchar     token
        timestamp   created_at
    }

    sessions {
        varchar     id                  PK
        bigint      user_id
        varchar     ip_address
        text        user_agent
        longtext    payload
        integer     last_activity
    }

    %% ============================================================
    %% RELATIONSHIPS
    %% ============================================================

    branches ||--o{ users                   : "staff cabang"
    branches ||--o{ barbers                 : "barber cabang"
    branches ||--o{ bookings                : "booking cabang"
    branches ||--o{ branch_product_stocks   : "stok produk"
    branches ||--o{ product_stock_mutations : "mutasi stok"

    users ||--o| barbers                    : "profil barber"
    users ||--o{ bookings                   : "customer booking"
    users ||--o{ transactions               : "kasir proses"
    users ||--o{ commission_payouts         : "owner bayar komisi"
    users ||--o{ product_stock_mutations    : "input mutasi stok"

    barbers ||--o{ barber_services          : "harga override"
    barbers ||--o{ bookings                 : "di-assign"
    barbers ||--o{ commission_records       : "dapat komisi"
    barbers ||--o{ commission_payouts       : "terima pembayaran"
    barbers ||--o{ weekly_schedules         : "jadwal mingguan"
    barbers ||--o{ leave_schedules          : "jadwal libur"

    services ||--o{ barber_services         : "harga per barber"
    services ||--o{ bookings                : "dipilih"

    products ||--o{ branch_product_stocks   : "stok per cabang"
    products ||--o{ product_stock_mutations : "riwayat mutasi"

    bookings ||--o| transactions            : "menghasilkan transaksi"

    transactions ||--o{ transaction_items   : "detail item"
    transactions ||--o| commission_records  : "hitung komisi"

    commission_payouts ||--o{ commission_records : "lunasi komisi"
```
