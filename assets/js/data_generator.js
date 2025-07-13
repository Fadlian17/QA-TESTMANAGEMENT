// test_data_generator.js

// Asumsi: window.checkLogin, window.displayMessageBox, window.getProjects
// sudah didefinisikan di testcase.js dan dibuat global.

// Mengambil referensi fungsi global dari window
const checkLogin = window.checkLogin;
const displayMessageBox = window.displayMessageBox;
const getProjects = window.getProjects;
const getTestCases = window.getTestCases; // Mungkin tidak langsung dipakai, tapi bagus untuk ada
const saveTestCases = window.saveTestCases; // Mungkin tidak langsung dipakai

let currentProjectName = "";
let generatedTestData = []; // Array untuk menyimpan data yang dihasilkan

// --- Fungsi-fungsi Umum ---

// Fungsi untuk mengisi dropdown pilihan proyek
function populateProjectDropdown() {
  const selectElement = document.getElementById("projectSelect");
  const projects = getProjects(); // Mengasumsikan getProjects mengembalikan array string

  selectElement.innerHTML = '<option value="">-- Pilih Proyek --</option>';

  projects.forEach(projectNameStr => {
    const option = document.createElement("option");
    option.value = projectNameStr;
    option.textContent = projectNameStr;
    selectElement.appendChild(option);
  });

  // Coba muat proyek terakhir yang dipilih dari sessionStorage
  const lastSelectedProject = sessionStorage.getItem('lastSelectedDataGenProject');
  if (lastSelectedProject && projects.includes(lastSelectedProject)) {
    selectElement.value = lastSelectedProject;
    loadSelectedProject();
  }
}

// Fungsi yang dipanggil saat tombol "Muat Proyek" diklik
function loadSelectedProject() {
  const selectElement = document.getElementById("projectSelect");
  const selectedProject = selectElement.value;

  if (selectedProject) {
    currentProjectName = selectedProject;
    sessionStorage.setItem('lastSelectedDataGenProject', selectedProject);
    document.getElementById("dataGenProjectTitle").textContent = `Proyek Aktif: ${currentProjectName}`;
    // Anda bisa menambahkan logika di sini untuk memuat definisi field yang disimpan per proyek
    // Untuk saat ini, kita hanya memperbarui nama proyek.
    displayMessageBox(`Proyek "${currentProjectName}" berhasil dimuat.`);
  } else {
    displayMessageBox("Mohon pilih proyek terlebih dahulu.");
    currentProjectName = "";
    document.getElementById("dataGenProjectTitle").textContent = "Proyek Aktif: (Silakan pilih proyek di atas)";
  }
}

// --- Fungsi untuk Definisi Field Dinamis ---

let fieldCounter = 0; // Untuk ID unik setiap field

function addField(fieldData = {}) {
  fieldCounter++;
  const fieldDefinitionsContainer = document.getElementById("fieldDefinitions");

  const fieldRow = document.createElement("div");
  fieldRow.id = `field-row-${fieldCounter}`;
  fieldRow.className = "flex flex-col md:flex-row gap-2 items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800";

  fieldRow.innerHTML = `
    <input type="text" id="fieldName-${fieldCounter}" placeholder="Nama Field (e.g., username)" value="${fieldData.name || ''}" class="input-field w-full md:w-1/4">
    <select id="fieldType-${fieldCounter}" class="input-field w-full md:w-1/4" onchange="toggleFieldOptions(${fieldCounter})">
      <option value="string" ${fieldData.type === 'string' ? 'selected' : ''}>String</option>
      <option value="number" ${fieldData.type === 'number' ? 'selected' : ''}>Number</option>
      <option value="boolean" ${fieldData.type === 'boolean' ? 'selected' : ''}>Boolean</option>
      <option value="date" ${fieldData.type === 'date' ? 'selected' : ''}>Date</option>
      <option value="list" ${fieldData.type === 'list' ? 'selected' : ''}>List (comma-separated)</option>
    </select>
    <input type="text" id="fieldOptions-${fieldCounter}" placeholder="Opsi (e.g., min-max, regex, list items)" value="${fieldData.options || ''}" class="input-field w-full md:w-2/4 flex-grow">
    <button onclick="removeField(${fieldCounter})" class="btn-danger p-2">🗑️</button>
  `;
  fieldDefinitionsContainer.appendChild(fieldRow);

  // Panggil toggleFieldOptions untuk menginisialisasi tampilan opsi
  toggleFieldOptions(fieldCounter);
  // Set nilai opsi setelah elemen dibuat dan toggle dilakukan
  document.getElementById(`fieldOptions-${fieldCounter}`).value = fieldData.options || '';
}

function removeField(id) {
  document.getElementById(`field-row-${id}`).remove();
}

function toggleFieldOptions(id) {
  const fieldType = document.getElementById(`fieldType-${id}`).value;
  const fieldOptions = document.getElementById(`fieldOptions-${id}`);

  fieldOptions.placeholder = "";
  fieldOptions.disabled = false;

  switch (fieldType) {
    case 'string':
      fieldOptions.placeholder = "Panjang (e.g., 10), atau regex (e.g., /^[A-Z]{3}\\d{4}$/)";
      break;
    case 'number':
      fieldOptions.placeholder = "Rentang (e.g., 1-100)";
      break;
    case 'boolean':
      fieldOptions.placeholder = "Tidak ada opsi";
      fieldOptions.disabled = true;
      break;
    case 'date':
      fieldOptions.placeholder = "Rentang tanggal (e.g., 2020-01-01,2023-12-31)";
      break;
    case 'list':
      fieldOptions.placeholder = "Item daftar (e.g., apple,banana,orange)";
      break;
    default:
      fieldOptions.placeholder = "Opsi";
      break;
  }
}

// --- Fungsi Generasi Data ---

function generateData() {
  if (!currentProjectName) {
    displayMessageBox("Mohon pilih proyek terlebih dahulu sebelum membuat data.");
    return;
  }

  const numRecords = parseInt(document.getElementById("numRecords").value);
  if (isNaN(numRecords) || numRecords <= 0) {
    displayMessageBox("Jumlah Record harus angka positif.");
    return;
  }

  const fieldDefinitions = [];
  document.querySelectorAll('[id^="fieldName-"]').forEach(input => {
    const id = input.id.split('-')[1];
    const name = input.value.trim();
    const type = document.getElementById(`fieldType-${id}`).value;
    const options = document.getElementById(`fieldOptions-${id}`).value.trim();

    if (name) {
      fieldDefinitions.push({ name, type, options });
    }
  });

  if (fieldDefinitions.length === 0) {
    displayMessageBox("Mohon tambahkan setidaknya satu definisi field.");
    return;
  }

  generatedTestData = [];
  for (let i = 0; i < numRecords; i++) {
    const record = {};
    fieldDefinitions.forEach(field => {
      record[field.name] = generateFieldValue(field.type, field.options);
    });
    generatedTestData.push(record);
  }

  renderPreviewTable(fieldDefinitions);
  document.getElementById("downloadCsvBtn").disabled = false;
  document.getElementById("downloadExcelBtn").disabled = false;
  displayMessageBox(`Berhasil membuat ${numRecords} record data.`);
}

function generateFieldValue(type, options) {
  switch (type) {
    case 'string':
      return generateString(options);
    case 'number':
      return generateNumber(options);
    case 'boolean':
      return Math.random() < 0.5;
    case 'date':
      return generateDate(options);
    case 'list':
      return generateFromList(options);
    default:
      return '';
  }
}

function generateString(options) {
  // Options can be length (e.g., "10") or regex (e.g., "/^[A-Z]{3}\\d{4}$/")
  if (options.startsWith('/') && options.endsWith('/')) {
    // Basic regex generation (very limited, for full regex use a library)
    // This is a simplified example. Real regex generation is complex.
    const regexStr = options.slice(1, -1);
    // For simplicity, let's just generate a random string of fixed length if regex is too complex
    // Or you can use a more robust regex generator library
    return Math.random().toString(36).substring(2, 2 + (parseInt(regexStr.length / 2) || 8)); // Fallback
  } else {
    const length = parseInt(options) || 10; // Default length 10
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}

function generateNumber(options) {
  const parts = options.split('-').map(Number);
  const min = parts[0] || 0;
  const max = parts[1] || 100;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDate(options) {
  const parts = options.split(',').map(d => new Date(d));
  const startDate = parts[0] || new Date(2000, 0, 1);
  const endDate = parts[1] || new Date(); // Today
  
  const startMillis = startDate.getTime();
  const endMillis = endDate.getTime();
  const randomMillis = startMillis + Math.random() * (endMillis - startMillis);
  
  return new Date(randomMillis).toISOString().split('T')[0]; // YYYY-MM-DD
}

function generateFromList(options) {
  const items = options.split(',').map(item => item.trim());
  if (items.length === 0) return '';
  return items[Math.floor(Math.random() * items.length)];
}

// --- Fungsi Pratinjau ---

function renderPreviewTable(fieldDefinitions) {
  const tableHeader = document.getElementById("previewTableHeader");
  const tableBody = document.getElementById("previewTableBody");
  const previewMessage = document.getElementById("previewMessage");

  tableHeader.innerHTML = '';
  tableBody.innerHTML = '';
  previewMessage.classList.add("hidden"); // Sembunyikan pesan

  if (generatedTestData.length === 0) {
    previewMessage.classList.remove("hidden");
    previewMessage.textContent = "Data yang dibuat akan muncul di sini.";
    return;
  }

  // Render Header
  const headerRow = document.createElement("tr");
  fieldDefinitions.forEach(field => {
    const th = document.createElement("th");
    th.className = "table-header";
    th.textContent = field.name;
    headerRow.appendChild(th);
  });
  tableHeader.appendChild(headerRow);

  // Render Body
  generatedTestData.forEach(record => {
    const row = document.createElement("tr");
    row.className = "table-row";
    fieldDefinitions.forEach(field => {
      const td = document.createElement("td");
      td.textContent = record[field.name];
      row.appendChild(td);
    });
    tableBody.appendChild(row);
  });
}

// --- Fungsi Unduh ---

function downloadCSV() {
  if (generatedTestData.length === 0) {
    displayMessageBox("Tidak ada data untuk diunduh.");
    return;
  }

  const headers = Object.keys(generatedTestData[0]);
  const csvRows = [];

  // Add header row
  csvRows.push(headers.join(','));

  // Add data rows
  generatedTestData.forEach(row => {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`; // Enclose in double quotes
    });
    csvRows.push(values.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${currentProjectName || 'test_data'}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  displayMessageBox("File CSV berhasil diunduh.");
}

function downloadExcel() {
  if (generatedTestData.length === 0) {
    displayMessageBox("Tidak ada data untuk diunduh.");
    return;
  }

  // Convert JSON to worksheet
  const ws = XLSX.utils.json_to_sheet(generatedTestData);

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "TestData");

  // Write the workbook to a file
  XLSX.writeFile(wb, `${currentProjectName || 'test_data'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  displayMessageBox("File Excel berhasil diunduh.");
}


// --- Inisialisasi ---
document.addEventListener("DOMContentLoaded", () => {
  checkLogin(); // Validasi login
  populateProjectDropdown(); // Isi dropdown proyek

  // Tambahkan satu field definisi secara default saat halaman dimuat
  addField(); 

  // Logic untuk menentukan proyek yang akan dimuat saat pertama kali halaman dibuka
  const params = new URLSearchParams(window.location.search);
  const projectFromURL = params.get("name");
  const lastSelectedFromSession = sessionStorage.getItem('lastSelectedDataGenProject');
  const projectsAvailable = getProjects();

  let projectToLoad = null;

  // Prioritas 1: Proyek dari URL
  if (projectFromURL && projectsAvailable.includes(projectFromURL)) {
    projectToLoad = projectFromURL;
  } 
  // Prioritas 2: Proyek dari sessionStorage (jika tidak ada di URL atau URL tidak valid)
  else if (lastSelectedFromSession && projectsAvailable.includes(lastSelectedFromSession)) {
    projectToLoad = lastSelectedFromSession;
  }

  if (projectToLoad) {
    currentProjectName = projectToLoad;
    document.getElementById("projectSelect").value = projectToLoad;
    document.getElementById("dataGenProjectTitle").textContent = `Proyek Aktif: ${currentProjectName}`;
  } else {
    currentProjectName = "";
    document.getElementById("dataGenProjectTitle").textContent = "Proyek Aktif: (Silakan pilih proyek di atas)";
  }
});
