# 🧪 QA Test Management Platform (-Web Based-)

Platform berbasis web untuk membantu tim QA dalam mengelola test case, requirement, issue tracking, serta pelaporan pengujian dengan visualisasi.

## 📸 Preview

![preview](assets/img/preview1.png) <!-- Tambahkan screenshot jika tersedia -->
![preview](assets/img/preview2.png) <!-- Tambahkan screenshot jika tersedia -->
![preview](assets/img/preview3.png) <!-- Tambahkan screenshot jika tersedia -->
![preview](assets/img/preview4.png) <!-- Tambahkan screenshot jika tersedia -->
![preview](assets/img/preview5.png) <!-- Tambahkan screenshot jika tersedia -->
---

## 🌐 Fitur Utama

### ✅ Test Case Management
- CRUD test case berbasis per project.
- Kategori (Smoke, Regression, Functional).
- Status eksekusi: Not Started, In Progress, Passed, Failed, Blocked, Retested.
- Versi test case, notes & log testing.
- Export ke CSV, XLSX, PDF.
- Navigasi antar test case, filter, dan search.

### 📋 Requirement Management
- CRUD requirement dengan:
  - ID unik + validasi
  - Judul, deskripsi
  - User Flow, Performance, Supported Devices, Recovery
  - Upload Diagram (image preview)
- Link otomatis ke test case.
- Hitung jumlah test case per requirement.
- Export requirement ke PDF.

### 🐞 Issue Tracking
- CRUD issue tracking per project.
- Filter by Status (Open, Resolved, etc) & Severity (Low, High, Critical).
- Link otomatis dari test case yang gagal (`Failed` → “Laporkan ke Issue”).
- Upload Screenshot/file.
- Auto-populate issue jika dari test case gagal.
- Dashboard ringkasan: total, open, high severity, dsb.

### 📊 Reporting & Matriks
- Pie/Bar chart hasil test case.
- Execution timeline (per waktu).
- AI Summary & AI Suggestion (analisa eksekusi).
- Matriks coverage berbasis requirement → test case.
- Navigasi langsung dari matriks ke test case.
- Export PDF dari report dan matriks.

### 🔐 Auth & Multi-Project
- Login sederhana (localStorage).
- Pemilihan project sebelum masuk halaman fitur.
- Sidebar navigasi (responsive).
- Proteksi halaman jika belum login.
- Setup project (overview, link penting, dokumentasi gambar).
- Export project setup ke PDF.

## 🚀 Cara Menjalankan

1. **Download repo atau clone**
   ```bash
   git clone https://github.com/username/qa-test-management.git
