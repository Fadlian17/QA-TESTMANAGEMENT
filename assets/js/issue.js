let editIndex = null;
const project = new URLSearchParams(window.location.search).get("name") || "default";


// ✅ Validasi login
function checkLogin() {
  const user = JSON.parse(localStorage.getItem("loggedUser"));
  console.log("🔒 Logged in user:", user?.username || null);
  if (!user) {
    alert("Silakan login terlebih dahulu.");
    window.location.href = "index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    document.getElementById("loggedUser").textContent = user?.username || "-";
    loadIssues();
  });
  
}


function logout() {
  localStorage.removeItem("loggedUser");
  localStorage.removeItem("loggedIn"); // jika kamu juga pakai ini
  window.location.href = "index.html";
}


function getIssues() {
  return JSON.parse(localStorage.getItem(`issues_${project}`)) || [];
}

function saveIssues(data) {
  localStorage.setItem(`issues_${project}`, JSON.stringify(data));
}

function loadIssues() {
  const list = document.getElementById("issueList");
  const issues = getIssues();
  const statusFilter = document.getElementById("filterStatus")?.value || "";
  const severityFilter = document.getElementById("filterSeverity")?.value || "";

  list.innerHTML = "";

  const filtered = issues.filter(issue =>
    (!statusFilter || issue.status === statusFilter) &&
    (!severityFilter || issue.severity === severityFilter)
  );

  if (filtered.length === 0) {
    list.innerHTML = `<p class="text-gray-500">Tidak ada issue yang cocok.</p>`;
    return;
  }

  filtered.forEach((issue, i) => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded shadow";
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-semibold text-gray-800">${issue.title}</h3>
          <p class="text-sm text-gray-600 mt-1">${issue.desc}</p>
          <p class="mt-2 text-sm">
            Severity: <span class="font-semibold">${issue.severity}</span> |
            Status: <span class="font-semibold">${issue.status}</span>
          </p>
          ${issue.linkedTestCase ? `<p class="text-sm text-blue-600 mt-1">🔗 Test Case: <a href="project.html?name=${project}#${issue.linkedTestCase}" class="underline">${issue.linkedTestCase}</a></p>` : ""}
          ${issue.attachment ? `<p class="mt-2"><img src="${issue.attachment}" class="max-h-32 border rounded"></p>` : ""}
        </div>
        <div class="flex gap-2 mt-2">
          <button onclick="editIssue(${i})" class="text-blue-600 text-sm hover:underline">Edit</button>
          <button onclick="deleteIssue(${i})" class="text-red-600 text-sm hover:underline">Hapus</button>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
}

function openAddModal() {
  editIndex = null;
  const draft = JSON.parse(localStorage.getItem("issueDraft")) || {};

  if (draft.fromProject && draft.fromProject !== project) {
    alert(`Issue ini berasal dari project: ${draft.fromProject}`);
  }

  document.getElementById("modalTitle").textContent = "Tambah Issue";
  document.getElementById("issueTitle").value = draft.title || "";
  document.getElementById("issueDesc").value = draft.desc || "";
  document.getElementById("issueSeverity").value = draft.severity || "Low";
  document.getElementById("issueStatus").value = draft.status || "Open";
  document.getElementById("linkedTestCase").value = draft.linkedTestCase || "";

  document.getElementById("issueFile").value = "";
  document.getElementById("issueModal").classList.remove("hidden");

  // bersihkan draft setelah digunakan
  localStorage.removeItem("issueDraft");
}


function closeModal() {
  document.getElementById("issueModal").classList.add("hidden");
}

function saveIssue() {
  const title = document.getElementById("issueTitle").value.trim();
  const desc = document.getElementById("issueDesc").value.trim();
  const severity = document.getElementById("issueSeverity").value;
  const status = document.getElementById("issueStatus").value;
  const linkedTestCase = document.getElementById("linkedTestCase").value.trim();
  const file = document.getElementById("issueFile").files[0];
  const attachment = file ? URL.createObjectURL(file) : null;

  if (!title || !desc) return alert("Judul dan deskripsi harus diisi!");

  const issues = getIssues();
  const newIssue = { title, desc, severity, status, linkedTestCase, attachment };

  if (editIndex === null) {
    issues.push(newIssue);
  } else {
    issues[editIndex] = newIssue;
  }

  saveIssues(issues);
  closeModal();
  loadIssues();
}

function editIssue(index) {
  const data = getIssues()[index];
  editIndex = index;
  document.getElementById("modalTitle").textContent = "Edit Issue";
  document.getElementById("issueTitle").value = data.title;
  document.getElementById("issueDesc").value = data.desc;
  document.getElementById("issueSeverity").value = data.severity;
  document.getElementById("issueStatus").value = data.status;
  document.getElementById("linkedTestCase").value = data.linkedTestCase || "";
  document.getElementById("issueModal").classList.remove("hidden");
}

function deleteIssue(index) {
  if (confirm("Yakin ingin menghapus issue ini?")) {
    const issues = getIssues();
    issues.splice(index, 1);
    saveIssues(issues);
    loadIssues();
  }
}

function showIssueSummary() {
  const issues = getIssues();
  const total = issues.length;
  const open = issues.filter(i => i.status === "Open").length;
  const high = issues.filter(i => i.severity === "High" || i.severity === "Critical").length;

  const div = document.getElementById("issueSummary");
  div.innerHTML = `
    📊 Total Issue: <strong>${total}</strong> | 
    🟡 Open: <strong>${open}</strong> | 
    🔥 High/Critical: <strong>${high}</strong>
  `;
}

// ✅ Jalankan setelah semua siap
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();
  loadIssues();
});



function runMCPAssistant() {
  const project = new URLSearchParams(window.location.search).get("name") || "default";
  const testCases = JSON.parse(localStorage.getItem(`testCases_${project}`)) || [];

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

function submitComment() {
  const comment = document.getElementById("commentInput").value.trim();
  if (!comment) return;

  // Mendapatkan project dari URL, ini sudah ada di bagian atas issue.js
  // const project = new URLSearchParams(window.location.search).get("name") || "default";

  addAuditLog(project, { // Menggunakan variabel 'project' yang sudah ada di issue.js
    type: "issue_comment", // Tipe log baru untuk komentar isu
    id: "unknown_issue_id", // Perlu perbaiki ini agar ID isu saat ini
    action: "comment",
    by: localStorage.getItem("loggedUser")?.username || "unknown",
    note: comment
  });

  document.getElementById("commentInput").value = "";
  renderComments(); // Refresh daftar komentar
}

function renderComments() {
  // Mendapatkan project dari URL, ini sudah ada di bagian atas issue.js
  // const project = new URLSearchParams(window.location.search).get("name") || "default";

  // Perlu mekanisme untuk mendapatkan ID Issue yang sedang aktif jika komentar per issue.
  // Untuk saat ini, kita bisa merender semua komentar terkait proyek atau perluas data log.
  const comments = JSON.parse(localStorage.getItem(`auditLogs_${project}`)) || []; // Menggunakan variabel 'project'

  // Filter komentar yang hanya relevan dengan isu saat ini (jika Anda melacak isu ID di log)
  // Atau jika ini adalah komentar umum untuk proyek/halaman isu:
  const relatedComments = comments.filter(l => l.type === "issue_comment"); // Filter berdasarkan tipe baru

  const list = document.getElementById("commentList");
  list.innerHTML = ""; // Bersihkan daftar lama

  if (relatedComments.length === 0) {
    list.innerHTML = `<li class="text-gray-500">Belum ada komentar.</li>`;
    return;
  }

  relatedComments.forEach(log => {
    const li = document.createElement("li");
    li.className = "p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600";
    li.innerHTML = `
      <p>🕒 ${new Date(log.timestamp).toLocaleString()} - <strong>${log.by}</strong>:</p>
      <p>${log.note}</p>
    `;
    list.appendChild(li);
  });
}

// Panggil renderComments saat halaman dimuat atau setiap kali isu dimuat/diubah
document.addEventListener("DOMContentLoaded", () => {
    // Pastikan ini dipanggil SETELAH 'project' variabel di issue.js terisi
    // atau panggil renderComments() di dalam loadIssues() setelah memuat data isu
    renderComments();
});



