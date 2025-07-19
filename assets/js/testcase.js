let projectName = ""; // Ini akan diatur saat loadProjectPage dipanggil
let editIndex = null;

// Fungsi untuk mendapatkan nama proyek aktif dari URL atau localStorage
// Fungsi ini dibuat global secara eksplisit untuk memastikan dapat diakses dari kanban_scrum.js
window.getActiveProject = function () {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("name") ||
    localStorage.getItem("lastProject") ||
    sessionStorage.getItem("lastSelectedKanbanProject")
  );
};



// Fungsi untuk mendapatkan data test cases. Sekarang menerima 'name' sebagai parameter opsional.
// Fungsi ini dibuat global secara eksplisit untuk memastikan dapat diakses dari kanban_scrum.js
window.getTestCases = function(name = projectName) { 
  // Menggunakan 'name' dari parameter, atau fallback ke projectName global jika tidak diberikan
  const data = localStorage.getItem(`testCases_${name}`);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Gagal parse testCases:", e);
    return [];
  }
};

// Fungsi untuk menyimpan data test cases. Sekarang menerima 'name' sebagai parameter opsional.
// Fungsi ini dibuat global secara eksplisit untuk memastikan dapat diakses dari kanban_scrum.js
window.saveTestCases = function(data, name = projectName) {
  // Menggunakan 'name' dari parameter, atau fallback ke projectName global jika tidak diberikan
  localStorage.setItem(`testCases_${name}`, JSON.stringify(data));
};

// Audit Log (Diasumsikan juga perlu diakses secara global oleh script lain)
window.addAuditLog = function(projectName, logEntry) {
  const logs = JSON.parse(localStorage.getItem(`auditLogs_${projectName}`)) || [];
  logEntry.timestamp = new Date().toISOString();
  logs.push(logEntry);
  localStorage.setItem(`auditLogs_${projectName}`, JSON.stringify(logs));
};


// ✅ Validasi login (pastikan kunci localStorage konsisten dengan issue.js dan kanban_scrum.js)
window.checkLogin = function() {
  const user = JSON.parse(localStorage.getItem("loggedUser")); 
  console.log("🔒 Logged in user:", user?.username || null);
  if (!user) {
    displayMessageBox("Silakan login terlebih dahulu."); // Menggunakan displayMessageBox
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500); 
  }
  // Menampilkan user yang login di UI (jika ada elemen dengan ID "loggedUser")
  if (document.getElementById("loggedUser")) {
    document.getElementById("loggedUser").textContent = user?.username || "-";
  }
};

// Fungsi untuk menampilkan kotak pesan kustom (pengganti alert)
window.displayMessageBox = function(message) {
  let messageBox = document.getElementById("customMessageBox");
  if (!messageBox) {
    messageBox = document.createElement("div");
    messageBox.id = "customMessageBox";
    messageBox.className = "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 z-50 text-center";
    messageBox.style.cssText = "min-width: 250px;"; // Agar tidak terlalu kecil
    document.body.appendChild(messageBox);
  }
  messageBox.innerHTML = `
    <p class="text-lg font-semibold mb-4">${message}</p>
    <button onclick="document.getElementById('customMessageBox').remove()" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">OK</button>
  `;
  messageBox.classList.remove("hidden");
};


// Fungsi yang memuat halaman proyek berdasarkan parameter URL
function loadProjectPage() {
  // const params = new URLSearchParams(window.location.search);
  // projectName = params.getActiveProject(); // Menggunakan fungsi global getActiveProject
  projectName = window.getActiveProject(); // Perbaikan: gunakan fungsi global
  localStorage.setItem("lastProject", projectName);

  console.log("Project:", projectName);

  if (!projectName) {
    displayMessageBox("Project tidak ditemukan.");
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
    return;
  }

  localStorage.setItem("lastProject", projectName); // ✅ simpan sebagai fallback

  const projectTitleElem = document.getElementById("projectTitle");
  if (projectTitleElem) {
    projectTitleElem.textContent = `Project: ${projectName}`;
  }

  const resultBtn = document.getElementById("toResult");
  if (resultBtn && projectName) {
    resultBtn.href = `result.html?project=${encodeURIComponent(projectName)}`;
  }

  renderTable();
  populateRequirementFilter();
}

// Fungsi untuk memuat proyek yang dipilih dari dropdown
// Fungsi ini akan dipanggil saat tombol "Pilih Proyek" ditekan
function loadSelectedProject() {
  const selected = document.getElementById("projectSelector").value;

  if (!selected) {
    displayMessageBox("Silakan pilih proyek terlebih dahulu.");
    return;
  }

  localStorage.setItem("lastProject", selected); // Simpan untuk fallback
  window.location.href = `testcase.html?name=${encodeURIComponent(selected)}`; // Ganti URL sesuai file
}



function openAddModal() {
  editIndex = null;
  resetModalFields();
  document.getElementById("modalTitle").innerText = "Tambah Test Case";
  document.getElementById("testCaseModal").classList.remove("hidden");
  toggleModalNavButtons();
  populateRequirementOptions();

  // Ini tampaknya adalah kode yang salah tempat untuk Issue Modal di Test Case Modal
  // Seharusnya ini ada di issue.js atau dipisahkan.
  // Jika issueModal muncul bersamaan dengan testCaseModal, ini adalah bug.
  // Asumsi: baris ini terkait dengan openAddModal di issue.js, dan bukan untuk testcase.js
  // document.getElementById("modalTitle").textContent = "Tambah Issue"; // Ini salah jika modalnya Test Case
  // const draft = JSON.parse(localStorage.getItem("issueDraft")) || {};
  // document.getElementById("issueTitle").value = draft.title || "";
  // document.getElementById("issueDesc").value = draft.desc || "";
  // document.getElementById("issueSeverity").value = draft.severity || "Low";
  // document.getElementById("issueStatus").value = draft.status || "Open";
  // document.getElementById("linkedTestCase").value = draft.linkedTestCase || "";
  // document.getElementById("issueFile").value = "";
  // document.getElementById("issueModal").classList.remove("hidden");
  // localStorage.removeItem("issueDraft");
}

function openEditModal(index) {
  // Panggil getTestCases tanpa argumen karena kita berada di testcase.js
  const tc = getTestCases()[index]; 
  editIndex = index;

  // ⏱️ Pastikan dropdown Requirement sudah terisi sebelum set value
  populateRequirementOptions();

  document.getElementById("modalTitle").innerText = `Edit Test Case (${tc.id})`;
  document.getElementById("tcScenario").value = tc.scenario;
  document.getElementById("tcFeature").value = tc.feature;
  document.getElementById("tcSteps").value = tc.steps;
  document.getElementById("tcExpected").value = tc.expected;
  document.getElementById("tcRequirement").value = tc.requirement || "";
  document.getElementById("tcLabel").value = tc.label;
  document.getElementById("tcSchedule").value = tc.schedule || "";
  document.getElementById("tcExecutedAt").value = tc.executedAt || "";
  document.getElementById("tcLog").value = tc.log || "";
  document.getElementById("tcAttachment").value = tc.attachment || "";

  document.getElementById("testCaseModal").classList.remove("hidden");
  toggleModalNavButtons();
}


function toggleModalNavButtons() {
  const leftBtn = document.getElementById("navLeft");
  const rightBtn = document.getElementById("navRight");
  const testCases = getTestCases(); // Panggil tanpa argumen

  if (editIndex === null || testCases.length <= 1) {
    leftBtn.classList.add("hidden");
    rightBtn.classList.add("hidden");
  } else {
    leftBtn.classList.toggle("hidden", editIndex === 0);
    rightBtn.classList.toggle("hidden", editIndex === testCases.length - 1);
  }
}

function resetModalFields() {
  document.getElementById("tcScenario").value = "";
  document.getElementById("tcFeature").value = "";
  document.getElementById("tcSteps").value = "";
  document.getElementById("tcExpected").value = "";
  document.getElementById("tcRequirement").value = "";
  document.getElementById("tcLabel").value = "Functional";
  // Tambahkan inisialisasi kanbanStatus jika belum ada
  // Document.getElementById("tcKanbanStatus") // Jika ada elemen untuk ini di modal
}

function closeModal() {
  document.getElementById("testCaseModal").classList.add("hidden");
}

function saveTestCase() {
  const scenario = document.getElementById("tcScenario").value.trim();
  const feature = document.getElementById("tcFeature").value.trim();
  const steps = document.getElementById("tcSteps").value.trim();
  const expected = document.getElementById("tcExpected").value.trim();
  const label = document.getElementById("tcLabel").value;
  const requirement = document.getElementById("tcRequirement").value.trim();
  const schedule = document.getElementById("tcSchedule").value;
  const executedAt = document.getElementById("tcExecutedAt").value;
  const log = document.getElementById("tcLog").value.trim();
  const attachment = document.getElementById("tcAttachment").value.trim();


  if (!scenario || !feature || !steps || !expected) {
    return displayMessageBox("Harap isi semua field utama."); // Menggunakan displayMessageBox
  }

  const testCases = getTestCases(); // Panggil tanpa argumen

  let newId; // Deklarasikan newId di luar blok if/else

  if (editIndex === null) {
    newId = `TC${testCases.length + 1}`;
    testCases.push({
      id: newId,
      scenario,
      feature,
      steps,
      expected,
      label,
      requirement,
      status: "Not Started",
      kanbanStatus: "Backlog", // Penting: Inisialisasi kanbanStatus
      notes: "",
      schedule,
      executedAt,
      log,
      attachment    // NEW
    });
    
  } else {
    const tc = testCases[editIndex];
    tc.scenario = scenario;
    tc.feature = feature;
    tc.steps = steps;
    tc.expected = expected;
    tc.label = label;
    tc.requirement = requirement;
    tc.schedule = schedule;
    tc.executedAt = executedAt;
    tc.log = log;
    tc.attachment = attachment;
    newId = tc.id; // Pastikan newId juga diset untuk kasus edit agar tidak undefined di addAuditLog
  }

  saveTestCases(testCases); // Panggil tanpa argumen
  closeModal();
  renderTable();

  addAuditLog(projectName, { // projectName global digunakan di sini
    type: "testcase",
    id: newId, // Gunakan newId yang sudah diatur
    action: editIndex === null ? "add" : "edit",
    by: localStorage.getItem("loggedUser")?.username || "unknown", // KUNCI DIPERBAIKI: "loggedUser"
    note: editIndex === null ? "Menambahkan test case" : "Mengedit test case"
  });
  
}

function deleteTestCase(index) {
  // Menggunakan displayMessageBox sebagai pengganti confirm()
  const confirmation = new Promise((resolve) => {
    let confirmBox = document.getElementById("customConfirmBox");
    if (!confirmBox) {
      confirmBox = document.createElement("div");
      confirmBox.id = "customConfirmBox";
      confirmBox.className = "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-300 dark:border-gray-700 z-50 text-center";
      confirmBox.innerHTML = `
        <p class="text-lg font-semibold mb-4">Yakin ingin menghapus test case ini?</p>
        <div class="flex justify-center gap-4">
          <button id="confirmYes" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Ya</button>
          <button id="confirmNo" class="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500">Tidak</button>
        </div>
      `;
      document.body.appendChild(confirmBox);
    }
    confirmBox.classList.remove("hidden");

    document.getElementById("confirmYes").onclick = () => { confirmBox.remove(); resolve(true); };
    document.getElementById("confirmNo").onclick = () => { confirmBox.remove(); resolve(false); };
  });

  confirmation.then((result) => {
    if (result) {
      const testCases = getTestCases(); // Panggil tanpa argumen
      const deletedId = testCases[index]?.id; // Ambil ID sebelum dihapus
      testCases.splice(index, 1);
      saveTestCases(testCases); // Panggil tanpa argumen
      renderTable();

      addAuditLog(projectName, { // projectName global digunakan di sini
        type: "testcase",
        id: deletedId || "unknown",
        action: "delete",
        by: localStorage.getItem("loggedUser")?.username || "unknown",
        note: "Menghapus test case"
      });
    }
  });
}

function renderTable() {
  const testCases = getTestCases(); // Panggil tanpa argumen
  const table = document.getElementById("testCaseTable");
  if (!table) return; // Stop jika elemen tidak ada
  const searchKeyword = document.getElementById("searchInput")?.value?.toLowerCase() || "";
  const selectedLabel = document.getElementById("labelFilter")?.value || "";
  const selectedStatus = document.getElementById("statusFilter")?.value || "";
  const selectedReq = document.getElementById("reqFilter")?.value || "";

  table.innerHTML = "";

  testCases.forEach((tc, i) => {
    const matchesSearch =
      tc.scenario?.toLowerCase().includes(searchKeyword) ||
      tc.feature?.toLowerCase().includes(searchKeyword) ||
      tc.steps?.toLowerCase().includes(searchKeyword);

    const matchesLabel = !selectedLabel || tc.label === selectedLabel;
    const matchesStatus = !selectedStatus || tc.status === selectedStatus;
    const matchesRequirement = !selectedReq || tc.requirement === selectedReq;

    if (!matchesSearch || !matchesLabel || !matchesStatus || !matchesRequirement) return;

    const statusClass = getStatusColorClass(tc.status || "Not Started");

    const row = document.createElement("tr");

    row.innerHTML = `
      <td class="border p-2">${tc.id}</td>
      <td class="border p-2">${tc.scenario}</td>
      <td class="border p-2">${tc.feature}</td>
      <td class="border p-2 whitespace-pre-line text-sm">${tc.steps}</td>
      <td class="border p-2">${tc.expected}</td>
      <td class="border p-2">${tc.label}</td>
      <td class="border p-2">
        <select onchange="updateStatus(${i}, this.value)" class="text-sm px-2 py-1 border rounded ${statusClass}">
          <option ${tc.status === "Not Started" ? "selected" : ""}>Not Started</option>
          <option ${tc.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option ${tc.status === "Passed" ? "selected" : ""}>Passed</option>
          <option ${tc.status === "Failed" ? "selected" : ""}>Failed</option>
          <option ${tc.status === "Blocked" ? "selected" : ""}>Blocked</option>
          <option ${tc.status === "Retested" ? "selected" : ""}>Retested</option>
        </select>
      </td>
      <td class="border p-2">${tc.notes || "-"}</td>
      <td class="border p-2">${tc.schedule || "-"}</td>
      <td class="border p-2">${tc.executedAt || "-"}</td>
      <td class="border p-2">${tc.log || "-"}</td>
      <td class="border p-2">${tc.attachment || "-"}</td>
      <td class="border p-2 text-center space-x-2">
        <button onclick="openEditModal(${i})" class="text-blue-600 hover:underline text-sm">Edit</button>
        <button onclick="deleteTestCase(${i})" class="text-red-600 hover:underline text-sm">Hapus</button>

        ${tc.status === "Failed" ? `
          <button onclick="reportToIssue(${i})" class="text-orange-600 hover:underline text-sm">Laporkan Issue</button>
        ` : ""}
      </td>
    `;

    table.appendChild(row);
  });
}




// Navigasi antar test case dari modal
function navigateTestCase(direction) {
  const testCases = getTestCases(); // Panggil tanpa argumen
  if (editIndex === null) return;

  let newIndex = editIndex + direction;
  if (newIndex >= 0 && newIndex < testCases.length) {
    openEditModal(newIndex);
  }
}

// document.addEventListener("DOMContentLoaded", loadProjectPage); // Dihapus karena akan dipanggil di akhir file ini

function updateStatus(index, value) {
  const testCases = getTestCases(); // Panggil tanpa argumen
  testCases[index].status = value;
  saveTestCases(testCases); // Panggil tanpa argumen
  renderTable(); // optional kalau ingin refresh

  // Tambahkan audit log untuk perubahan status
  addAuditLog(projectName, {
    type: "testcase",
    id: testCases[index]?.id || "unknown",
    action: "status_update",
    by: localStorage.getItem("loggedUser")?.username || "unknown",
    note: `Mengubah status test case ke '${value}'`
  });
}



function getStatusColorClass(status) {
  switch (status) {
    case "Passed": return "bg-green-100 text-green-800 font-semibold";
    case "Failed": return "bg-red-100 text-red-800 font-semibold";
    case "In Progress": return "bg-yellow-100 text-yellow-800 font-semibold";
    case "Not Started": return "bg-gray-100 text-gray-700";
    case "Blocked": return "bg-orange-100 text-orange-800 font-semibold";
    case "Retested": return "bg-blue-100 text-blue-800 font-semibold";
    default: return "bg-gray-100 text-gray-700";
  }
}

//cari requirement
function populateRequirementOptions() {
  const select = document.getElementById("tcRequirement");
  if (!select || !projectName) return; // Menggunakan projectName global

  const reqData = JSON.parse(localStorage.getItem(`requirements_${projectName}`)) || [];

  select.innerHTML = `<option value="">-- Pilih Requirement --</option>`;

  reqData.forEach(req => {
    const opt = document.createElement("option");
    opt.value = req.id;
    opt.textContent = `${req.id} - ${req.title}`;
    select.appendChild(opt);
  });
}


function populateRequirementFilter() {
  const select = document.getElementById("reqFilter");
  if (!select) return; // berhenti jika elemen tidak ditemukan

  const data = JSON.parse(localStorage.getItem(`requirements_${projectName}`)) || []; // Menggunakan projectName global
  select.innerHTML = `<option value="">-- Semua Requirement --</option>`;
  data.forEach(req => {
    const opt = document.createElement("option");
    opt.value = req.id;
    opt.textContent = req.id;
    select.appendChild(opt);
  });
}


function reportToIssue(index) {
  const tc = getTestCases()[index]; // Panggil tanpa argumen
  const issueData = {
    title: `Bug dari Test Case ${tc.id}`,
    desc: `Fitur: ${tc.feature}\nSkenario: ${tc.scenario}\nLangkah: ${tc.steps}\nEkspektasi: ${tc.expected}\n\nStatus: ${tc.status}`,
    severity: "High",
    status: "Open",
    linkedTestCase: tc.id,
    fromProject: projectName, // Menggunakan projectName global
    attachment: null
  };

  localStorage.setItem("issueDraft", JSON.stringify(issueData));
  window.location.href = `issue.html?name=${projectName}`; // Menggunakan projectName global
}


function applyGherkinTemplate() {
  const stepsField = document.getElementById("tcSteps");
  const defaultGherkin = 
`Feature: [Fitur yang diuji]
  Scenario: [Judul skenario]
    Given [kondisi awal]
    When [aksi yang dilakukan]
    Then [hasil yang diharapkan]`;

  stepsField.value = defaultGherkin;
  stepsField.focus();
}


function submitComment() {
  const comment = document.getElementById("commentInput").value.trim();
  if (!comment) return;

  addAuditLog(projectName, { // Menggunakan projectName global
    type: "testcase",
    id: getTestCases()[editIndex]?.id || "unknown", // Panggil tanpa argumen
    action: "comment",
    by: localStorage.getItem("loggedUser")?.username || "unknown", // KUNCI DIPERBAIKI: "loggedUser"
    note: comment
  });

  document.getElementById("commentInput").value = "";
  renderComments(); // refresh
}

function renderComments() {
  const comments = JSON.parse(localStorage.getItem(`auditLogs_${projectName}`)) || []; // Menggunakan projectName global
  const related = comments.filter(l => l.type === "testcase" && l.id === getTestCases()[editIndex]?.id); // Panggil tanpa argumen
  const list = document.getElementById("commentList");

  list.innerHTML = "";
  related.forEach(log => {
    const li = document.createElement("li");
    li.textContent = `🕒 ${new Date(log.timestamp).toLocaleString()} - ${log.by}: ${log.note}`;
    list.appendChild(li);
  });
}


function runMCPAssistant() {
  const projectParam = new URLSearchParams(window.location.search).get("name") || "default"; // Tetap gunakan projectParam di sini
  const testCases = JSON.parse(localStorage.getItem(`testCases_${projectParam}`)) || [];

  const failed = testCases.find(tc => tc.status === "Failed");

  if (failed) {
    document.getElementById("linkedTestCase").value = failed.id;
    const suggestion = `
      📛 Issue ini berkaitan dengan Test Case <strong>${failed.id}</strong> - <em>${failed.scenario}</em>.<br/>
      📝 Saran Deskripsi: "${failed.feature} gagal saat step: ${failed.steps.substring(0, 100)}..."
    `;
    document.getElementById("mcpSuggestion").innerHTML = suggestion;
    document.getElementById("mcpPanel").classList.remove("hidden");

    // Auto-isi deskripsi jika kosong
    if (!document.getElementById("issueDesc").value.trim()) {
      document.getElementById("issueDesc").value = `${failed.feature} gagal pada step: ${failed.steps}`;
    }
    if (!document.getElementById("issueTitle").value.trim()) {
      document.getElementById("issueTitle").value = `Bug pada ${failed.feature}`;
    }
  } else {
    document.getElementById("mcpSuggestion").innerText = "Tidak ditemukan test case dengan status Failed untuk disarankan.";
    document.getElementById("mcpPanel").classList.remove("hidden");
  }
}

// ✅ Jalankan setelah semua siap
document.addEventListener("DOMContentLoaded", () => {
  checkLogin(); // Panggil fungsi validasi login
  loadProjectPage(); // Memuat proyek dan merender tabel test case
});


function redirectToProject() {
  const select = document.getElementById("projectSelector");
  const selected = select.value;

  if (!selected) {
    displayMessageBox("Silakan pilih proyek terlebih dahulu.");
    return;
  }

  // Simpan project terakhir agar bisa fallback nanti
  localStorage.setItem("lastProject", selected);
  window.location.href = `kanban.html?name=${encodeURIComponent(selected)}`;
}
