// kanban_scrum.js

// Asumsi: Fungsi-fungsi dari testcase.js (window.getTestCases, window.saveTestCases, window.addAuditLog)
// sudah tersedia secara global.
// Diasumsikan uga window.checkLogin dan window.displayMessageBox tersedia global.


// Fungsi untuk mendapatkan daftar nama proyek dari localStorage yang memiliki setup (projectSetup_*)
function getAllSetupProjects() {
  const projectsSet = new Set();
  // Cari dari projectSetup_*
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('projectSetup_')) {
      const projectName = key.substring('projectSetup_'.length);
      projectsSet.add(projectName);
    }
    // Tambahkan juga dari testCases_*
    if (key.startsWith('testCases_')) {
      const projectName = key.substring('testCases_'.length);
      projectsSet.add(projectName);
    }
  }
  return Array.from(projectsSet);
}

// Fungsi untuk mendapatkan nama proyek aktif dari URL atau localStorage/sessionStorage
// Sekarang konsisten menggunakan parameter 'project' di URL
window.getActiveProject = function () {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("project") ||
    localStorage.getItem("lastProject") ||
    sessionStorage.getItem("lastSelectedKanbanProject")
  );
};


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
  const projects = getAllSetupProjects(); // Ambil dari localStorage projectSetup_* dan testCases_*

  selectElement.innerHTML = '<option value="">-- Pilih Proyek --</option>';

  projects.forEach(projectNameStr => {
    const option = document.createElement("option");
    option.value = projectNameStr;
    option.textContent = projectNameStr;
    selectElement.appendChild(option);
  });
}


// Fungsi untuk membuat elemen daftar (list item) untuk Kanban
function createKanbanItem(testCase) {
  const li = document.createElement("li");
  li.id = `tc-kanban-${testCase.id}`;
  li.className = "kanban-item";
  // Tampilkan ID, scenario, feature, dan status
  li.innerHTML = `<div class="font-bold">${testCase.id}: ${testCase.scenario}</div>
    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Feature: ${testCase.feature}</div>
    <span class="ml-0 mt-1 px-2 py-1 rounded-full text-xs font-semibold ${getKanbanStatusColorClass(testCase.status)}">${testCase.status}</span>`;
  li.draggable = true;
  li.ondragstart = (e) => {
    e.dataTransfer.setData("text/plain", testCase.id);
    e.dataTransfer.effectAllowed = "move";
    li.classList.add("opacity-50");
  };
  li.ondragend = (e) => {
    li.classList.remove("opacity-50");
  };
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
    // Reset badge count
    updateKanbanColumnCounts({});
    return; // Berhenti jika tidak ada proyek yang dipilih
  }

  document.getElementById("kanbanProjectTitle").textContent = `Project: ${currentProjectName}`;

  // Bersihkan kolom-kolom Kanban terlebih dahulu
  document.getElementById("backlog").innerHTML = "";
  document.getElementById("todo").innerHTML = "";
  document.getElementById("inProgress").innerHTML = "";
  document.getElementById("done").innerHTML = "";

  // Dapatkan semua test case untuk proyek saat ini
  const testCases = getTestCases(currentProjectName);

  // Hitung jumlah per kolom
  const kanbanCounts = {
    Backlog: 0,
    "To Do": 0,
    "In Progress": 0,
    Done: 0
  };

  testCases.forEach((tc, idx) => {
    // Inisialisasi kanbanStatus jika belum ada (misal: saat test case baru dibuat)
    if (!tc.kanbanStatus) {
      tc.kanbanStatus = "Backlog"; // Default ke Backlog
      // Simpan perubahan ini kembali ke localStorage
      saveTestCases(testCases, currentProjectName);
    }
    // Hitung jumlah per kolom
    if (kanbanCounts[tc.kanbanStatus] !== undefined) {
      kanbanCounts[tc.kanbanStatus]++;
    }
    const item = createKanbanItem(tc);
    // Menggunakan toLowerCase().replace(/\s/g, '') untuk mencocokkan ID kolom
    const targetColumn = document.getElementById(tc.kanbanStatus.toLowerCase().replace(/\s/g, ''));
    if (targetColumn) {
      targetColumn.appendChild(item);
    } else {
      document.getElementById("backlog").appendChild(item); // Fallback ke backlog
      kanbanCounts.Backlog++;
    }
  });
  updateKanbanColumnCounts(kanbanCounts);
}

// Fungsi untuk update badge jumlah test case di header kolom
function updateKanbanColumnCounts(counts) {
  // Backlog
  let backlogHeader = document.querySelector('section h2');
  if (backlogHeader) {
    backlogHeader.innerHTML = `📌 Backlog (Test Case Baru / Belum Terencana) <span class="inline-block bg-gray-300 text-gray-800 text-xs font-bold px-2 py-1 rounded ml-2 align-middle">${counts.Backlog || 0}</span>`;
  }
  // To Do
  let todoHeader = document.querySelector('div > h3.text-lg.font-bold.mb-4.text-gray-700');
  if (todoHeader) {
    todoHeader.innerHTML = `To Do <span class="inline-block bg-gray-300 text-gray-800 text-xs font-bold px-2 py-1 rounded ml-2 align-middle">${counts["To Do"] || 0}</span>`;
  }
  // In Progress
  let inProgressHeader = document.querySelector('div > h3.text-lg.font-bold.mb-4.text-blue-700');
  if (inProgressHeader) {
    inProgressHeader.innerHTML = `In Progress <span class="inline-block bg-blue-200 text-blue-800 text-xs font-bold px-2 py-1 rounded ml-2 align-middle">${counts["In Progress"] || 0}</span>`;
  }
  // Done
  let doneHeader = document.querySelector('div > h3.text-lg.font-bold.mb-4.text-green-700');
  if (doneHeader) {
    doneHeader.innerHTML = `Done <span class="inline-block bg-green-200 text-green-800 text-xs font-bold px-2 py-1 rounded ml-2 align-middle">${counts.Done || 0}</span>`;
  }
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
window.loadSelectedProject = function () {
  const selectElement = document.getElementById("projectSelect");
  const selectedProject = selectElement.value;

  if (selectedProject) {
    currentProjectName = selectedProject;
    localStorage.setItem("lastProject", selectedProject);
    sessionStorage.setItem("lastSelectedKanbanProject", selectedProject);
    // Redirect ke halaman proyek dengan parameter 'project'
    window.location.href = `project.html?project=${encodeURIComponent(selectedProject)}`;
  } else {
    displayMessageBox("Mohon pilih proyek terlebih dahulu.");
    currentProjectName = "";
    renderKanbanBoard();
  }
};


// Handler saat DOM telah dimuat
document.addEventListener("DOMContentLoaded", () => {
  checkLogin(); 
  populateProjectDropdown(); 

  // Logic untuk menentukan proyek yang akan dimuat saat pertama kali halaman dibuka
  let projectToLoad = getActiveProject();
  const projectsAvailable = getAllSetupProjects(); // Ambil daftar proyek yang tersedia

  // Prioritas: Proyek dari URL (parameter 'project')
  if (projectToLoad && projectsAvailable.includes(projectToLoad)) {
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
