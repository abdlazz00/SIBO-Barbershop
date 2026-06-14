---
version: 1.0
name: Howell-Barbershop-Design-System
description: Design language untuk Howell Barbershop - sistem manajemen dan booking barbershop premium multi-cabang. Diadaptasi dari filosofi Sentry design language: light-dominant canvas dengan deep violet sebagai brand identity, electric lime sebagai accent signature, Space Grotesk untuk display headline, dan Rubik untuk seluruh UI copy. Dark canvas digunakan secara strategis pada hero landing page dan sidebar navigasi internal.

colors:
  primary: "#2D1B69"
  primary-dark: "#1A0F3D"
  primary-deeper: "#150B35"
  on-primary: "#ffffff"
  accent-lime: "#C2EF4E"
  accent-lime-muted: "#A8D93E"
  accent-violet: "#7C5CBF"
  accent-violet-deep: "#4A2D8A"
  accent-violet-mid: "#8B72B0"
  accent-warm: "#9B7FD4"
  surface-canvas-light: "#ffffff"
  surface-canvas-dark: "#2D1B69"
  surface-hero: "#1A0F3D"
  surface-sidebar: "#2D1B69"
  surface-card: "#f8f7ff"
  surface-card-dark: "#1A0F3D"
  surface-press-light: "#f0eeff"
  surface-press-stronger: "#e8e4ff"
  surface-input: "#ffffff"
  hairline-violet: "#3D2880"
  hairline-violet-light: "#C4B8E8"
  hairline-cloud: "#E5E7EB"
  hairline-cool: "#D0CAE8"
  ink: "#1A0F3D"
  ink-deep: "#150B35"
  ink-press: "#0D0820"
  on-dark-primary: "#ffffff"
  on-dark-muted: "#C5B8E0"
  on-dark-faint: "rgba(255,255,255,0.15)"
  on-light-muted: "#6B5A8E"
  on-light-faint: "#9B8FC0"
  status-success: "#22C55E"
  status-warning: "#F59E0B"
  status-danger: "#EF4444"
  status-info: "#3B82F6"
  booking-confirmed: "#3B82F6"
  booking-in-progress: "#F59E0B"
  booking-completed: "#22C55E"
  booking-cancelled: "#EF4444"
  ring-focus: "rgba(124,92,191,0.4)"

typography:
  display-hero:
    fontFamily: "Space Grotesk, Rubik, system-ui, sans-serif"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.5px"
  display-large:
    fontFamily: "Space Grotesk, Rubik, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.25px"
  display-medium:
    fontFamily: "Space Grotesk, Rubik, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.25px"
  heading-xl:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  heading-lg:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  heading-md:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: 0
  heading-sm:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0
  body-lg:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: 0
  body-md:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  body-strong:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: 0
  eyebrow:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "1.5px"
    textTransform: "uppercase"
  button-cap:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.14
    letterSpacing: "0.3px"
  button-cap-light:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.29
    letterSpacing: "0.2px"
  caption:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: 0
  label:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  micro-cap:
    fontFamily: "Rubik, -apple-system, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.8
    letterSpacing: "0.5px"
    textTransform: "uppercase"

rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  xxl: "20px"
  card: "12px"
  full: "9999px"

spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  section: "80px"

shadows:
  card: "0 1px 3px rgba(45,27,105,0.08), 0 4px 12px rgba(45,27,105,0.06)"
  card-hover: "0 4px 16px rgba(45,27,105,0.12), 0 8px 24px rgba(45,27,105,0.08)"
  button-glow: "0 0 0 3px rgba(194,239,78,0.35)"
  sidebar: "4px 0 24px rgba(21,11,53,0.25)"
  modal: "0 20px 60px rgba(21,11,53,0.3)"
  input-focus: "0 0 0 3px rgba(124,92,191,0.25)"

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-accent:
    backgroundColor: "{colors.accent-lime}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-inverted:
    backgroundColor: "{colors.on-primary}"
    textColor: "{colors.primary}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    border: "2px solid {colors.primary}"
  button-ghost-on-dark:
    backgroundColor: "{colors.on-dark-faint}"
    textColor: "{colors.on-dark-primary}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.lg}"
    padding: "10px 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.button-cap-light}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    border: "1.5px solid {colors.accent-violet}"
  button-disabled:
    backgroundColor: "{colors.hairline-cloud}"
    textColor: "{colors.on-light-faint}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.status-danger}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-cap}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  sidebar-nav:
    backgroundColor: "{colors.surface-sidebar}"
    textColor: "{colors.on-dark-primary}"
    typography: "{typography.body-md}"
    padding: "12px 16px"
    rounded: "{rounded.md}"
  sidebar-nav-active:
    backgroundColor: "rgba(255,255,255,0.1)"
    textColor: "{colors.accent-lime}"
    typography: "{typography.body-strong}"
    padding: "12px 16px"
    rounded: "{rounded.md}"
    borderLeft: "3px solid {colors.accent-lime}"
  text-input:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    border: "1px solid {colors.hairline-cool}"
  text-input-focused:
    backgroundColor: "{colors.surface-input}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    border: "1.5px solid {colors.accent-violet}"
    shadow: "{shadows.input-focus}"
  card-booking:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card}"
    padding: "24px"
    border: "1px solid {colors.hairline-cloud}"
  card-booking-dark:
    backgroundColor: "{colors.surface-card-dark}"
    textColor: "{colors.on-dark-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.card}"
    padding: "24px"
    border: "1px solid {colors.hairline-violet}"
  chip-lime-highlight:
    backgroundColor: "{colors.accent-lime}"
    textColor: "{colors.ink-deep}"
    typography: "{typography.eyebrow}"
    rounded: "{rounded.xs}"
    padding: "4px 8px"
---

# Howell Barbershop Design System

## Overview
Design System Howell Barbershop adalah panduan visual dan teknis yang diadaptasi dari filosofi bahasa desain **Sentry**. Sistem ini dirancang untuk menghadirkan pengalaman digital yang premium, maskulin, dan bertenaga tinggi bagi bisnis barbershop modern multi-cabang. 

### Filosofi Utama
1. **Dua Polaritas Canvas (Two-Polarity Canvas)**: 
   Sistem ini membedakan secara tegas antara halaman pemasaran/fitur hero yang menggunakan **Dark Canvas** (`#2D1B69`) untuk kesan premium maskulin, dan halaman transaksi operasional (seperti dashboard internal, POS kasir, list data, dan formulir padat) yang menggunakan **Light Canvas** (`#ffffff`) demi kemudahan pemindaian informasi dan efisiensi kerja.
2. **Aksen Lime Elektrik (Electric Lime Highlight)**:
   Warna Electric Lime (`#C2EF4E`) digunakan sebagai penarik perhatian utama yang diaplikasikan secara terbatas (misalnya, membungkus satu kata kunci pada display hero, garis pembatas footer berkelok, atau indikator navigasi aktif) agar tidak melelahkan mata namun tetap ikonik.
3. **Penyelarasan Tipografi**:
   Mengkombinasikan **Space Grotesk** yang bertenaga untuk judul besar (Display) dan **Rubik** yang bersih dan sangat ramah dibaca untuk teks UI copy harian.
4. **Sentuhan Maskulin & Premium**:
   Menggunakan paduan warna ungu tua yang kokoh, kontras neon, border hairline tipis, dan efek micro-shadow untuk menonjolkan estetika barbershop modern yang berkelas tinggi.

---

## Colors

### Brand & Accent
*   **Deep Violet** (`{colors.primary}` - `#2D1B69`): Identitas warna utama. Digunakan untuk tombol utama pada canvas terang, latar belakang sidebar, dan elemen visual primer.
*   **Deep Violet Dark** (`{colors.primary-dark}` - `#1A0F3D`): Varian lebih gelap untuk interaksi hover tombol dan kontras lebih tinggi.
*   **Deep Violet Deeper** (`{colors.primary-deeper}` - `#150B35`): Tone terdalam untuk area transisi yang sangat kontras.
*   **Electric Lime** (`{colors.accent-lime}` - `#C2EF4E`): Warna aksen khas. Digunakan untuk sorotan kata kunci, border aktif, dan dekorasi visual khusus.
*   **Electric Lime Muted** (`{colors.accent-lime-muted}` - `#A8D93E`): Warna sekunder lime untuk kebutuhan kontras teks atau area hover lime.
*   **Accent Violet** (`{colors.accent-violet}` - `#7C5CBF`): Digunakan untuk link inline pada canvas terang, serta border focus input.
*   **Accent Violet Deep** (`{colors.accent-violet-deep}` - `#4A2D8A`): Latar belakang seleksi atau highlight gelap.
*   **Accent Warm** (`{colors.accent-warm}` - `#9B7FD4`): Aksen pendukung untuk memberi nuansa barbershop yang lebih bersahabat dan hangat.

### Surface
*   **Light Canvas** (`{colors.surface-canvas-light}` - `#ffffff`): Latar belakang utama untuk modul POS, manajemen booking, dan tabel data dashboard.
*   **Dark Canvas** (`{colors.surface-canvas-dark}` - `#2D1B69`): Latar belakang untuk landing page hero dan sidebar internal.
*   **Surface Card Light** (`{colors.surface-card}` - `#f8f7ff`): Latar belakang card default pada canvas terang, memberikan kedalaman lembut di atas background putih murni.
*   **Surface Card Dark** (`{colors.surface-card-dark}` - `#1A0F3D`): Latar belakang card di dalam canvas gelap.
*   **Surface Input** (`{colors.surface-input}` - `#ffffff`): Latar belakang semua form text input.

### Hairline (Borders)
*   **Hairline Violet** (`{colors.hairline-violet}` - `#3D2880`): Garis pembatas tipis 1px untuk elemen di canvas gelap.
*   **Hairline Cloud** (`{colors.hairline-cloud}` - `#E5E7EB`): Garis pembatas abu-abu tipis 1px untuk tabel dan card di canvas terang.
*   **Hairline Cool** (`{colors.hairline-cool}` - `#D0CAE8`): Garis pembatas berwarna violet lembut untuk form input non-focus.

### Text Colors
*   **Ink** (`{colors.ink}` - `#1A0F3D`): Warna teks utama pada canvas terang (menggantikan hitam murni agar lebih elegan).
*   **Ink Deep** (`{colors.ink-deep}` - `#150B35`): Warna teks tebal atau judul pada canvas terang.
*   **On Primary** (`{colors.on-primary}` - `#ffffff`): Semua teks di atas tombol utama atau latar belakang canvas gelap.
*   **On Light Muted** (`{colors.on-light-muted}` - `#6B5A8E`): Teks sekunder (deskripsi atau info pendukung) pada canvas terang.
*   **On Dark Muted** (`{colors.on-dark-muted}` - `#C5B8E0`): Teks sekunder pada canvas gelap.

### Booking Status Colors
*   **Confirmed** (`{colors.booking-confirmed}` - `#3B82F6`): Warna biru untuk status booking yang telah disetujui.
*   **In-Progress** (`{colors.booking-in-progress}` - `#F59E0B`): Warna amber/kuning untuk booking yang sedang dilayani barber.
*   **Completed** (`{colors.booking-completed}` - `#22C55E`): Warna hijau untuk booking yang telah selesai transaksi pembayarannya.
*   **Cancelled** (`{colors.booking-cancelled}` - `#EF4444`): Warna merah untuk booking yang dibatalkan.

---

## Typography

Sistem tipografi dirancang secara terstruktur untuk mencerminkan nuansa kokoh namun bersih.

### Font Family
1.  **Display Font (Space Grotesk)**: Digunakan khusus untuk Headline Hero, sub-headline besar, dan angka transaksi besar yang memerlukan daya tarik visual yang kuat.
2.  **UI/Body Font (Rubik)**: Digunakan untuk seluruh teks UI, deskripsi layanan, data tabel, formulir, label, tombol, dan teks navigasi.

### Hierarchy Table

| Token | Family | Size | Weight | Line Height | Letter Spacing | Kegunaan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-hero` | Space Grotesk | 80px | 700 | 1.1 | -0.5px | Headline landing page utama |
| `display-large` | Space Grotesk | 56px | 600 | 1.15 | -0.25px | Judul bagian halaman besar |
| `display-medium` | Space Grotesk | 40px | 600 | 1.2 | -0.25px | Sub-judul bagian utama |
| `heading-xl` | Rubik | 30px | 500 | 1.2 | 0 | Judul halaman internal / dashboard |
| `heading-lg` | Rubik | 24px | 500 | 1.25 | 0 | Judul card besar atau modul utama |
| `heading-md` | Rubik | 20px | 500 | 1.25 | 0 | Judul card sedang atau sub-modul |
| `heading-sm` | Rubik | 16px | 600 | 1.3 | 0 | Sub-header tabel atau detail data |
| `body-lg` | Rubik | 16px | 400 | 1.8 | 0 | Paragraf teks penjelasan landing page |
| `body-md` | Rubik | 15px | 400 | 1.5 | 0 | Teks UI default, sel tabel, data form |
| `body-strong` | Rubik | 15px | 600 | 1.5 | 0 | Teks tebal penekanan UI |
| `eyebrow` | Rubik | 12px | 600 | 1.4 | 1.5px (Caps) | Label kecil di atas judul section |
| `button-cap` | Rubik | 14px | 700 | 1.14 | 0.3px | Teks tombol utama (Uppercase) |
| `button-cap-light`| Rubik | 14px | 500 | 1.29 | 0.2px | Teks tombol sekunder / outline |
| `caption` | Rubik | 13px | 400 | 1.43 | 0 | Teks keterangan bawah, info halus |
| `label` | Rubik | 13px | 500 | 1.4 | 0 | Label input form |
| `micro-cap` | Rubik | 10px | 700 | 1.8 | 0.5px (Caps) | Tag kecil, badge status booking |

---

## Layout & Spacing

### Spacing Scale
Sistem spacing berbasis kelipatan **8px** untuk menjamin keseimbangan tata letak:
*   `xxs`: 2px · `xs`: 4px · `sm`: 8px · `md`: 12px · `lg`: 16px · `xl`: 24px · `xxl`: 32px · `section`: 80px
*   **Section Padding**: Gunakan `spacing.section` (80px) untuk jarak antar blok halaman pemasaran desktop, menyusut menjadi `spacing.xxl` (32px) pada mobile.
*   **Card Internal Padding**: Gunakan `spacing.xl` (24px) sebagai padding standar di dalam card data booking atau POS.

### Container Max Width
*   Halaman publik dibatasi pada lebar maksimal **1200px** untuk tampilan desktop yang seimbang dan mudah dipindai.
*   Halaman dashboard internal mengoptimalkan tata letak grid cairan lebar penuh (fluid layout) dengan margin tepi kiri dan kanan sebesar `spacing.xl` (24px).

---

## Elevation & Depth

*   `shadows.card`: `0 1px 3px rgba(45,27,105,0.08), 0 4px 12px rgba(45,27,105,0.06)`
    Memberikan kedalaman melayang tipis yang elegan untuk card status booking atau item produk di halaman POS.
*   `shadows.card-hover`: `0 4px 16px rgba(45,27,105,0.12), 0 8px 24px rgba(45,27,105,0.08)`
    Digunakan saat card disorot (hover) untuk menunjukkan interaktivitas.
*   `shadows.sidebar`: `4px 0 24px rgba(21,11,53,0.25)`
    Bayangan tegas untuk sidebar menu navigasi kiri.
*   `shadows.modal`: `0 20px 60px rgba(21,11,53,0.3)`
    Efek bayangan gelap tebal untuk menonjolkan pop-up konfirmasi pembayaran POS atau form booking manual di atas konten lainnya.
*   `shadows.input-focus`: `0 0 0 3px rgba(124,92,191,0.25)`
    Cincin glow halus warna ungu muda saat kolom input teks menerima fokus keyboard.

---

## Shapes

*   `rounded.xs` (4px): Badge status booking kecil, tag cabang, chip kategori.
*   `rounded.sm` (6px): Form text input, dropdown pilihan barber.
*   `rounded.md` (8px): Tombol aksi utama, tombol transaksi POS.
*   `rounded.lg` (12px): Container panel sedang, dialog konfirmasi kecil.
*   `rounded.card` (12px): Seluruh card booking harian, card detail barber.
*   `rounded.xl` (16px): Panel dashboard, pop-up modal transaksi besar.
*   `rounded.xxl` (20px): Blok visual dekoratif, frame gambar portofolio barbershop.
*   `rounded.full` (9999px): Foto bulat barber, avatar customer, tombol ikon bulat.

---

## Components

### Buttons
*   **`button-primary`**
    Tombol aksi utama pada canvas terang. Menggunakan background `{colors.primary}`, teks `{colors.on-primary}`, tipografi `{typography.button-cap}`, dan padding `10px 20px` dengan sudut membulat `{rounded.md}`.
*   **`button-primary-hover`**
    State hover untuk tombol utama. Background berubah menjadi `{colors.primary-dark}`.
*   **`button-accent`**
    Tombol aksi bermuatan energetik tinggi. Menggunakan background `{colors.accent-lime}` and teks `{colors.ink-deep}`. Cocok untuk tombol "Book Now" di landing page.
*   **`button-inverted`**
    Tombol sekunder di canvas gelap (hero landing/sidebar). Menggunakan background `{colors.on-primary}`, teks `{colors.primary}`, dan border `2px solid {colors.primary}`.
*   **`button-outline`**
    Tombol sekunder elegan. Background transparan dengan border `1.5px solid {colors.accent-violet}` dan warna teks `{colors.primary}`.
*   **`button-danger`**
    Tombol untuk aksi destruktif seperti pembatalan booking. Background `{colors.status-danger}` dengan teks `{colors.on-primary}`.
*   **`button-disabled`**
    Tombol non-aktif. Background abu-abu terang `{colors.hairline-cloud}` dengan teks `{colors.on-light-faint}`.

### Inputs
*   **`text-input`**
    Form input standar. Background `{colors.surface-input}`, warna teks `{colors.ink}`, border `1px solid {colors.hairline-cool}`, padding `8px 12px`, sudut membulat `{rounded.sm}`.
*   **`text-input-focused`**
    State focus form input. Border berubah menjadi `1.5px solid {colors.accent-violet}` dengan tambahan efek `{shadows.input-focus}`.

### Cards
*   **`card-booking`**
    Card standar transaksi/booking di panel kasir. Background `{colors.surface-card}`, border `1px solid {colors.hairline-cloud}`, padding `24px` dengan sudut membulat `{rounded.card}`, serta bayangan `{shadows.card}`.
*   **`card-booking-dark`**
    Card informasi yang berada di canvas gelap (misal: detail jadwal barber di dasbor barber). Latar belakang `{colors.surface-card-dark}` dengan border `{colors.hairline-violet}`.

### Navigation
*   **`sidebar-nav`**
    Menu item navigasi internal. Background transparan atau `{colors.surface-sidebar}`, warna teks `{colors.on-dark-muted}`, tipografi `{typography.body-md}`, padding `12px 16px`.
*   **`sidebar-nav-active`**
    State aktif menu navigasi. Background `{colors.on-dark-faint}` (ungu transparan), warna teks `{colors.accent-lime}` (hijau elektrik), tipografi `{typography.body-strong}`, border kiri tebal `3px solid {colors.accent-lime}`.

---

## Do's and Don'ts

### Do
*   **Jaga Kontras**: Selalu gunakan warna teks `{colors.ink}` atau `{colors.ink-deep}` di atas canvas terang untuk readability yang maksimal.
*   **Batasi Penggunaan Lime**: Gunakan Electric Lime `{colors.accent-lime}` sebagai aksen visual penarik perhatian saja. Jangan menggunakannya sebagai warna background teks paragraf panjang karena akan merusak keterbacaan.
*   **Konsisten dengan Sudut Membulat**: Gunakan `{rounded.card}` (12px) untuk card dan `{rounded.md}` (8px) untuk tombol aksi agar konsistensi bentuk tetap terjaga.
*   **Terapkan Uppercase untuk Kategori**: Gunakan `{typography.eyebrow}` atau `{typography.micro-cap}` dalam format huruf kapital (Uppercase) untuk label kategori, menu bar, dan status booking agar UI terlihat kokoh dan tertata.

### Don't
*   **Jangan Gunakan Shadows Kasar**: Hindari drop shadow hitam pekat. Selalu gunakan bayangan bernuansa ungu transparan seperti `{shadows.card}` agar menyatu secara alami dengan nuansa violet sistem.
*   **Jangan Campurkan Polaritas**: Jangan menaruh card putih murni di dalam hero section gelap tanpa border pemisah, atau sebaliknya. Jaga batas polaritas canvas tetap bersih.
*   **Jangan Gunakan Font Asing**: Seluruh teks aplikasi harus menggunakan Space Grotesk (judul besar) atau Rubik (UI & body text) saja untuk menjaga estetika brand Howell Barbershop.

---

## Responsive Behavior

### Breakpoints
*   **Desktop & Large Screen** (`≥ 1024px`): Layout dashboard menampilkan sidebar kiri secara permanen berdampingan dengan area konten utama. Grid transaksi POS menampilkan daftar booking dan keranjang belanja secara berdampingan.
*   **Tablet** (`768px - 1023px`): Sidebar kiri disembunyikan ke dalam slide-out laci (drawer menu). Grid POS beralih menjadi susunan tumpuk vertikal (stack). Jarak padding luar mengecil dari 24px menjadi 16px.
*   **Mobile** (`< 768px`): Header atas menampilkan hamburger menu. Tombol navigasi dan form input mengembang untuk memenuhi target ketukan minimal 44px. Desain card beralih menjadi 1 kolom penuh lebar layar.

---

## Design Implementation Code (CSS/Variables)

Berikut adalah CSS custom properties yang siap diintegrasikan pada berkas styling global (misal: `index.css`) proyek Howell Barbershop.

```css
:root {
  /* Brand & Accents */
  --color-primary: #2D1B69;
  --color-primary-dark: #1A0F3D;
  --color-primary-deeper: #150B35;
  --color-on-primary: #ffffff;
  --color-accent-lime: #C2EF4E;
  --color-accent-lime-muted: #A8D93E;
  --color-accent-violet: #7C5CBF;
  --color-accent-violet-deep: #4A2D8A;
  --color-accent-violet-mid: #8B72B0;
  --color-accent-warm: #9B7FD4;

  /* Canvas & Surfaces */
  --color-surface-canvas-light: #ffffff;
  --color-surface-canvas-dark: #2D1B69;
  --color-surface-hero: #1A0F3D;
  --color-surface-sidebar: #2D1B69;
  --color-surface-card: #f8f7ff;
  --color-surface-card-dark: #1A0F3D;
  --color-surface-input: #ffffff;

  /* Hairlines (Borders) */
  --color-hairline-violet: #3D2880;
  --color-hairline-violet-light: #C4B8E8;
  --color-hairline-cloud: #E5E7EB;
  --color-hairline-cool: #D0CAE8;

  /* Typography Colors */
  --color-ink: #1A0F3D;
  --color-ink-deep: #150B35;
  --color-on-dark-primary: #ffffff;
  --color-on-dark-muted: #C5B8E0;
  --color-on-dark-faint: rgba(255, 255, 255, 0.15);
  --color-on-light-muted: #6B5A8E;
  --color-on-light-faint: #9B8FC0;

  /* Booking Statuses */
  --color-booking-confirmed: #3B82F6;
  --color-booking-in-progress: #F59E0B;
  --color-booking-completed: #22C55E;
  --color-booking-cancelled: #EF4444;

  /* Semantic */
  --color-status-success: #22C55E;
  --color-status-warning: #F59E0B;
  --color-status-danger: #EF4444;
  --color-status-info: #3B82F6;
  --color-ring-focus: rgba(124, 92, 191, 0.4);

  /* Border Radii */
  --rounded-xs: 4px;
  --rounded-sm: 6px;
  --rounded-md: 8px;
  --rounded-lg: 12px;
  --rounded-card: 12px;
  --rounded-xl: 16px;
  --rounded-xxl: 20px;
  --rounded-full: 9999px;

  /* Spacing Scale */
  --spacing-xxs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;
  --spacing-section: 80px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(45, 27, 105, 0.08), 0 4px 12px rgba(45, 27, 105, 0.06);
  --shadow-card-hover: 0 4px 16px rgba(45, 27, 105, 0.12), 0 8px 24px rgba(45, 27, 105, 0.08);
  --shadow-sidebar: 4px 0 24px rgba(21, 11, 53, 0.25);
  --shadow-modal: 0 20px 60px rgba(21, 11, 53, 0.3);
  --shadow-input-focus: 0 0 0 3px rgba(124, 92, 191, 0.25);
}

/* Helper Components Class */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-family: 'Rubik', sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--rounded-md);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-primary:active {
  transform: scale(0.98);
}

.btn-accent {
  background-color: var(--color-accent-lime);
  color: var(--color-ink-deep);
  font-family: 'Rubik', sans-serif;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 10px 20px;
  border: none;
  border-radius: var(--rounded-md);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.btn-accent:hover {
  background-color: var(--color-accent-lime-muted);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-primary);
  font-family: 'Rubik', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  padding: 10px 20px;
  border: 1.5px solid var(--color-accent-violet);
  border-radius: var(--rounded-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background-color: var(--color-surface-press-light);
  border-color: var(--color-primary);
}

.card-booking-item {
  background-color: var(--color-surface-card);
  color: var(--color-ink);
  border: 1px solid var(--color-hairline-cloud);
  border-radius: var(--rounded-card);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.card-booking-item:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.input-field {
  background-color: var(--color-surface-input);
  color: var(--color-ink);
  font-family: 'Rubik', sans-serif;
  font-size: 15px;
  border: 1px solid var(--color-hairline-cool);
  border-radius: var(--rounded-sm);
  padding: 8px 12px;
  outline: none;
  transition: all 0.2s ease;
}

.input-field:focus {
  border-color: var(--color-accent-violet);
  box-shadow: var(--shadow-input-focus);
}

/* Sidebar Nav Item */
.sidebar-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: var(--color-on-dark-muted);
  font-family: 'Rubik', sans-serif;
  font-size: 15px;
  text-decoration: none;
  border-radius: var(--rounded-md);
  transition: all 0.2s ease;
}

.sidebar-link:hover {
  background-color: var(--color-on-dark-faint);
  color: var(--color-on-dark-primary);
}

.sidebar-link.active {
  background-color: var(--color-on-dark-faint);
  color: var(--color-accent-lime);
  font-weight: 600;
  border-left: 3px solid var(--color-accent-lime);
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```

---

## Tailwind CSS v3.4 Configuration

Gunakan konfigurasi `tailwind.config.js` di bawah ini untuk memetakan seluruh token warna, tipografi, dan border radius sistem desain Howell Barbershop secara langsung ke kelas utilitas Tailwind CSS.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.jsx",
    "./resources/**/*.ts",
    "./resources/**/*.tsx",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Brand & Accents
        primary: {
          DEFAULT: '#2D1B69',
          dark: '#1A0F3D',
          deeper: '#150B35',
        },
        accent: {
          lime: {
            DEFAULT: '#C2EF4E',
            muted: '#A8D93E',
          },
          violet: {
            DEFAULT: '#7C5CBF',
            deep: '#4A2D8A',
            mid: '#8B72B0',
          },
          warm: '#9B7FD4',
        },
        // Canvas & Surfaces
        surface: {
          canvas: {
            light: '#ffffff',
            dark: '#2D1B69',
          },
          hero: '#1A0F3D',
          sidebar: '#2D1B69',
          card: {
            DEFAULT: '#f8f7ff',
            dark: '#1A0F3D',
          },
          input: '#ffffff',
        },
        // Hairlines (Borders)
        hairline: {
          violet: {
            DEFAULT: '#3D2880',
            light: '#C4B8E8',
          },
          cloud: '#E5E7EB',
          cool: '#D0CAE8',
        },
        // Typography / Ink
        ink: {
          DEFAULT: '#1A0F3D',
          deep: '#150B35',
          press: '#0D0820',
        },
        on: {
          dark: {
            primary: '#ffffff',
            muted: '#C5B8E0',
            faint: 'rgba(255, 255, 255, 0.15)',
          },
          light: {
            muted: '#6B5A8E',
            faint: '#9B8FC0',
          },
        },
        // Booking Statuses
        booking: {
          confirmed: '#3B82F6',
          'in-progress': '#F59E0B',
          completed: '#22C55E',
          cancelled: '#EF4444',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Rubik', 'sans-serif'],
        sans: ['Rubik', 'sans-serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        card: '12px',
        xl: '16px',
        xxl: '20px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(45, 27, 105, 0.08), 0 4px 12px rgba(45, 27, 105, 0.06)',
        'card-hover': '0 4px 16px rgba(45, 27, 105, 0.12), 0 8px 24px rgba(45, 27, 105, 0.08)',
        sidebar: '4px 0 24px rgba(21, 11, 53, 0.25)',
        modal: '0 20px 60px rgba(21, 11, 53, 0.3)',
      },
      spacing: {
        xxs: '2px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
        section: '80px',
      },
    },
  },
  plugins: [],
}
```

