# 🧪 QA Test Management System (Web-Based)

Sistem manajemen test case berbasis website yang ringan dan efisien. Dibuat untuk mendukung tim QA dalam mencatat, menjalankan, dan mengevaluasi test case secara fleksibel. **Tanpa backend, 100% client-side** — hanya butuh browser.

---

## 📸 Preview

![preview](assets/img/preview.png) <!-- Tambahkan screenshot jika tersedia -->

---

## 🚀 Fitur Utama

- 🔐 Login & Register dengan **role (admin/dev)**
- 🗃 Manajemen **project**, test case, dan scenario
- 🏷 Test labeling (Smoke, Regression, Functional, dll)
- ✅ Status eksekusi: Passed, Failed, Blocked, dll
- 📥 Export:
  - Chart ke PNG / PDF
  - Matriks coverage ke PDF
- 📊 Laporan visual (Chart.js)
- 🧮 Matrix Requirement ↔ Scenario ↔ Test Case
- 📬 Webhook siap integrasi ke **Slack / Email / Odoo**

---

## 🛠 Teknologi yang Digunakan

- HTML, JavaScript, Tailwind CSS
- Chart.js (visualisasi)
- jsPDF (export PDF)
- LocalStorage (penyimpanan data)
- Tanpa backend!

---

## 📁 Struktur Folder

qa-test-management/ 
├── index.html ← Halaman login ├── register.html ← Halaman registrasi ├── dashboard.html ← Daftar project ├── project.html ← Test case management ├── result.html ← Chart laporan ├── matrix.html ← Matriks requirement ├── assets/ │ ├── img/ │ │ └── logo.svg │ ├── js/ │ │ ├── auth.js │ │ ├── dashboard.js │ │ ├── testcase.js │ │ ├── result.js │ │ └── matrix.js

# via file explorer
open index.html
