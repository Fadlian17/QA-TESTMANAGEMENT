// kanban_scrum.js

// Asumsi: Fungsi-fungsi dari testcase.js (getTestCases, saveTestCases, projectName, addAuditLog)
// sudah tersedia secara global atau diimpor.
// Jika tidak, Anda perlu memastikan testcase.js dimuat sebelum kanban_scrum.js di HTML,
// atau mengekspor/mengimpor fungsi-fungsi tersebut jika menggunakan modul ES6.

let currentProjectName = ""; // Variabel untuk menyimpan nama proyek aktif

// Fungsi untuk membuat elemen daftar (list item) untuk Kanban
function createKanbanItem(testCase) {
  const li = document.createElement("li");
  // Menggunakan ID test case sebagai ID elemen DOM
  li.id = `tc-kanban-${testCase.id}`; 
  li.textContent = `${testCase.id}: ${testCase.scenario} - ${testCase.feature}`;
  li.className =
    "bg-white dark:bg-gray-700 p-3 mb-2 rounded-lg shadow-sm cursor-grab border border-gray-200 dark:border-gray-600 " +
    "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200";
  li.draggable = true;

  li.ondragstart = (e) => {
    // Menyimpan ID test case yang sedang di-drag
    e.dataTransfer.setData("text/plain", testCase.id); 
    e.dataTransfer.effectAllowed = "move"; // Menunjukkan bahwa ini adalah operasi pemindahan
    li.classList.add("opacity-50"); // Memberikan efek visual saat di-drag
  };

  li.ondragend = (e) => {
    li.classList.remove("opacity-50"); // Menghilangkan efek visual setelah di-drag
  };

  // Tambahkan sedikit detail lain jika diinginkan, misal badge status
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
  // Ambil nama proyek dari URL atau dari variabel global `projectName` dari testcase.js
  const params = new URLSearchParams(window.location.search);
  currentProjectName = params.get("name") || window.projectName; // Gunakan projectName dari testcase.js jika ada

  if (!currentProjectName) {
    console.error("Nama proyek tidak ditemukan. Tidak dapat merender Kanban.");
    return;
  }

  // Bersihkan kolom-kolom Kanban terlebih dahulu
  document.getElementById("backlog").innerHTML = "";
  document.getElementById("todo").innerHTML = "";
  document.getElementById("inProgress").innerHTML = "";
  document.getElementById("done").innerHTML = "";

  // Dapatkan semua test case untuk proyek saat ini
  const testCases = getTestCases(); // Asumsi getTestCases() dari testcase.js

  testCases.forEach((tc) => {
    // Inisialisasi kanbanStatus jika belum ada (misal: saat test case baru dibuat)
    if (!tc.kanbanStatus) {
      tc.kanbanStatus = "Backlog"; // Default ke Backlog
    }

    const item = createKanbanItem(tc);
    const targetColumn = document.getElementById(tc.kanbanStatus.toLowerCase().replace(/\s/g, '')); // "Backlog" -> "backlog"

    if (targetColumn) {
      targetColumn.appendChild(item);
    } else {
      console.warn(`Kolom Kanban tidak ditemukan untuk status: ${tc.kanbanStatus}`);
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

    // Mencegah default behavior untuk memungkinkan drop
    column.ondragover = (e) => {
      e.preventDefault();
      // Tambahkan efek visual saat item di atas kolom
      column.classList.add("bg-indigo-50", "dark:bg-gray-600"); 
    };

    // Hapus efek visual saat item meninggalkan kolom
    column.ondragleave = (e) => {
      column.classList.remove("bg-indigo-50", "dark:bg-gray-600");
    };

    // Penanganan saat item di-drop
    column.ondrop = (e) => {
      e.preventDefault();
      column.classList.remove("bg-indigo-50", "dark:bg-gray-600"); // Hapus efek visual

      const testCaseId = e.dataTransfer.getData("text/plain"); // Ambil ID test case
      const draggedElement = document.getElementById(`tc-kanban-${testCaseId}`); // Dapatkan elemen yang di-drag

      if (draggedElement && column !== draggedElement.parentNode) { // Pastikan elemen ada dan tidak di-drop di kolom yang sama
        // Dapatkan test cases, temukan yang sesuai, update status Kanban, dan simpan
        const testCases = getTestCases();
        const tcIndex = testCases.findIndex((tc) => tc.id === testCaseId);

        if (tcIndex > -1) {
          const oldKanbanStatus = testCases[tcIndex].kanbanStatus;
          // Ubah nama kolom DOM ID menjadi format yang sesuai untuk kanbanStatus
          let newKanbanStatus = column.id;
          if (newKanbanStatus === "inprogress") newKanbanStatus = "In Progress"; // Perbaiki jika perlu
          if (newKanbanStatus === "notstarted") newKanbanStatus = "Not Started"; // Jika ada kolom 'notstarted'
          
          testCases[tcIndex].kanbanStatus = newKanbanStatus.charAt(0).toUpperCase() + newKanbanStatus.slice(1); // Kapitalisasi huruf pertama

          saveTestCases(testCases); // Asumsi saveTestCases() dari testcase.js
          
          // Tambahkan log audit untuk perubahan status Kanban
          addAuditLog(currentProjectName, { // Asumsi addAuditLog() dari testcase.js
            type: "testcase_kanban",
            id: testCaseId,
            action: "kanban_move",
            by: localStorage.getItem("loggedInUser") || "unknown",
            note: `Pindah dari '${oldKanbanStatus}' ke '${testCases[tcIndex].kanbanStatus}'`
          });

          // Pindahkan elemen DOM secara langsung
          column.appendChild(draggedElement);
        } else {
          console.error(`Test Case dengan ID ${testCaseId} tidak ditemukan.`);
        }
      }
    };
  });
}

// Handler saat DOM telah dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Pertama, pastikan proyek sudah dimuat oleh testcase.js
  // loadProjectPage() harus dipanggil di testcase.js terlebih dahulu
  // Setelah itu, kita bisa merender Kanban board
  
  // Jika kanban_scrum.js dimuat setelah testcase.js dan projectName sudah terisi:
  // Atau jika Anda perlu memastikan projectName terisi di sini:
  const checkProjectReady = setInterval(() => {
    const params = new URLSearchParams(window.location.search);
    currentProjectName = params.get("name") || window.projectName;
    if (currentProjectName) {
      clearInterval(checkProjectReady);
      renderKanbanBoard();
      setupDragAndDrop();
    }
  }, 100); // Coba setiap 100ms hingga nama proyek tersedia
});

