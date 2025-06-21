// kanban_scrum.js

// Asumsi: Fungsi-fungsi dari testcase.js (window.getTestCases, window.saveTestCases, window.addAuditLog)
// sudah tersedia secara global.
// Diasumsikan juga window.checkLogin dan window.displayMessageBox tersedia global.

let currentProjectName = ""; // Variabel untuk menyimpan nama proyek aktif

// Mengambil fungsi-fungsi global untuk kejelasan
const getTestCases = window.getTestCases;
const saveTestCases = window.saveTestCases;
const addAuditLog = window.addAuditLog;
const checkLogin = window.checkLogin;
const displayMessageBox = window.displayMessageBox;


// Fungsi untuk mendapatkan daftar proyek dari localStorage
// Mengasumsikan 'projects' disimpan sebagai Array of Strings
function getProjects() {
  const data = localStorage.getItem('projects');
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Gagal parse projects:", e);
    return [];
  }
}

// Fungsi untuk mengisi dropdown pilihan proyek
function populateProjectDropdown() {
  const selectElement = document.getElementById("projectSelect");
  const projects = getProjects(); // Ini akan mengembalikan array string

  selectElement.innerHTML = '<option value="">-- Pilih Proyek --</option>'; // Reset dropdown

  projects.forEach(projectNameStr => { // Iterasi array string
    const option = document.createElement("option");
    option.value = projectNameStr; // Nilai opsi adalah string nama proyek
    option.textContent = projectNameStr; // Teks opsi juga string nama proyek
    selectElement.appendChild(option);
  });

  // Logic pemuatan proyek terakhir dipindahkan ke DOMContentLoaded
}


// Fungsi untuk membuat elemen daftar (list item) untuk Kanban
function createKanbanItem(testCase) {
  const li = document.createElement("li");
  li.id = `tc-kanban-${testCase.id}`; 
  li.className = "kanban-item"; 
  li.textContent = `${testCase.id}: ${testCase.scenario}`;
  
  const featureSpan = document.createElement("span");
  featureSpan.className = "block text-sm text-gray-500 dark:text-gray-400 mt-1";
  featureSpan.textContent = `Feature: ${testCase.feature}`;
  li.appendChild(featureSpan);

  li.draggable = true;

  li.ondragstart = (e) => {
    e.dataTransfer.setData("text/plain", testCase.id); 
    e.dataTransfer.effectAllowed = "move";
    li.classList.add("opacity-50"); 
  };

  li.ondragend = (e) => {
    li.classList.remove("opacity-50"); 
  };

  const statusBadge = document.createElement("span");
  statusBadge.textContent = testCase.status;
  statusBadge.className = `ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getKanbanStatusColorClass(testCase.status)}`;
  li.appendChild(statusBadge);

  return li;
}

// Fungsi pembantu untuk mendapatkan kelas warna berdasarkan status eksekusi test case
function getKanbanStatusColorClass(status) {
    switch (status) {
        case "Passed": return "bg-green-200 text-green-800";
        case "Failed": return "bg-red-200 text-red-800";
        case "In Progress": return "bg-yellow-200 text-yellow-800";
        case "Blocked": return "bg-orange-200 text-orange-800";
        case "Retested": return "bg-blue-200 text-blue-800";
        case "Not Started": 
        default: return "bg-gray-200 text-gray-800";
    }
}


// Fungsi untuk merender (menggambar ulang) seluruh papan Kanban
function renderKanbanBoard() {
  if (!currentProjectName) {
    document.getElementById("kanbanProjectTitle").textContent = "Project: (Silakan pilih proyek di atas)";
    // Bersihkan papan jika tidak ada proyek yang dipilih
    document.getElementById("backlog").innerHTML = "";
    document.getElementById("todo").innerHTML = "";
    document.getElementById("inProgress").innerHTML = "";
    document.getElementById("done").innerHTML = "";
    return; // Berhenti jika tidak ada proyek yang dipilih
  }

  document.getElementById("kanbanProjectTitle").textContent = `Project: ${currentProjectName}`;

  // Bersihkan kolom-kolom Kanban terlebih dahulu
  document.getElementById("backlog").innerHTML = "";
  document.getElementById("todo").innerHTML = "";
  document.getElementById("inProgress").innerHTML = "";
  document.getElementById("done").innerHTML = "";

  // Dapatkan semua test case untuk proyek saat ini
  // Panggil getTestCases dengan currentProjectName sebagai argumen
  const testCases = getTestCases(currentProjectName); 

  testCases.forEach((tc) => {
    // Inisialisasi kanbanStatus jika belum ada (misal: saat test case baru dibuat)
    if (!tc.kanbanStatus) {
      tc.kanbanStatus = "Backlog"; // Default ke Backlog
      // Penting: Simpan perubahan ini kembali ke localStorage
      saveTestCases(testCases, currentProjectName); 
    }

    const item = createKanbanItem(tc);
    // Menggunakan toLowerCase().replace(/\s/g, '') untuk mencocokkan ID kolom
    const targetColumn = document.getElementById(tc.kanbanStatus.toLowerCase().replace(/\s/g, '')); 

    if (targetColumn) {
      targetColumn.appendChild(item);
    } else {
      console.warn(`Kolom Kanban tidak ditemukan untuk status: ${tc.kanbanStatus}. Menggunakan Backlog sebagai fallback.`);
      document.getElementById("backlog").appendChild(item); // Fallback ke backlog
    }
  });
}

// Fungsi untuk menyiapkan fungsionalitas drag and drop pada kolom-kolom Kanban
function setupDragAndDrop() {
  const columns = ["backlog", "todo", "inProgress", "done"];

  columns.forEach((id) => {
    const column = document.getElementById(id);
    if (!column) return; // Pastikan elemen kolom ada

    column.ondragover = (e) => {
      e.preventDefault();
      column.classList.add("bg-indigo-50", "dark:bg-gray-600"); 
    };

    column.ondragleave = (e) => {
      column.classList.remove("bg-indigo-50", "dark:bg-gray-600");
    };

    column.ondrop = (e) => {
      e.preventDefault();
      column.classList.remove("bg-indigo-50", "dark:bg-gray-600"); 

      const testCaseId = e.dataTransfer.getData("text/plain"); 
      const draggedElement = document.getElementById(`tc-kanban-${testCaseId}`); 

      if (draggedElement && column !== draggedElement.parentNode) { 
        const testCases = getTestCases(currentProjectName); 
        const tcIndex = testCases.findIndex((tc) => tc.id === testCaseId);

        if (tcIndex > -1) {
          const oldKanbanStatus = testCases[tcIndex].kanbanStatus;
          let newKanbanStatus = column.id;
          if (newKanbanStatus === "inprogress") newKanbanStatus = "In Progress";
          else if (newKanbanStatus === "todo") newKanbanStatus = "To Do"; 
          else newKanbanStatus = newKanbanStatus.charAt(0).toUpperCase() + newKanbanStatus.slice(1); 

          testCases[tcIndex].kanbanStatus = newKanbanStatus;

          saveTestCases(testCases, currentProjectName); 
          
          addAuditLog(currentProjectName, { 
            type: "testcase_kanban",
            id: testCaseId,
            action: "kanban_move",
            by: localStorage.getItem("loggedUser")?.username || "unknown", 
            note: `Pindah dari '${oldKanbanStatus}' ke '${testCases[tcIndex].kanbanStatus}'`
          });

          column.appendChild(draggedElement);
        } else {
          console.error(`Test Case dengan ID ${testCaseId} tidak ditemukan.`);
        }
      }
    };
  });
}

// Fungsi yang dipanggil saat tombol "Load Project" diklik
window.loadSelectedProject = function() { // Dijadikan global agar bisa diakses dari HTML
  const selectElement = document.getElementById("projectSelect");
  const selectedProject = selectElement.value;

  if (selectedProject) {
    currentProjectName = selectedProject;
    sessionStorage.setItem('lastSelectedKanbanProject', selectedProject); 
    renderKanbanBoard();
    setupDragAndDrop(); 
  } else {
    displayMessageBox("Mohon pilih proyek terlebih dahulu.");
    currentProjectName = ""; 
    renderKanbanBoard(); // Clear board
  }
};

// Handler saat DOM telah dimuat
document.addEventListener("DOMContentLoaded", () => {
  checkLogin(); 
  populateProjectDropdown(); 

  // Logic untuk menentukan proyek yang akan dimuat saat pertama kali halaman dibuka
  const params = new URLSearchParams(window.location.search);
  const projectFromURL = params.get("name");
  const lastSelectedFromSession = sessionStorage.getItem('lastSelectedKanbanProject');
  const projectsAvailable = getProjects(); // Ambil daftar proyek yang tersedia

  let projectToLoad = null;

  // Prioritas 1: Proyek dari URL
  if (projectFromURL && projectsAvailable.includes(projectFromURL)) { // Cek jika nama proyek string ada di array string
    projectToLoad = projectFromURL;
  } 
  // Prioritas 2: Proyek dari sessionStorage (jika tidak ada di URL atau URL tidak valid)
  else if (lastSelectedFromSession && projectsAvailable.includes(lastSelectedFromSession)) { // Cek jika nama proyek string ada di array string
    projectToLoad = lastSelectedFromSession;
  }

  if (projectToLoad) {
    currentProjectName = projectToLoad;
    document.getElementById("projectSelect").value = projectToLoad; // Set dropdown value
    renderKanbanBoard();
    setupDragAndDrop(); 
  } else {
    // Jika tidak ada proyek yang otomatis dimuat, render papan kosong dengan pesan
    currentProjectName = ""; 
    renderKanbanBoard(); 
    setupDragAndDrop(); 
  }
});
