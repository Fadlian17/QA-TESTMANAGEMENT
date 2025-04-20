let reqEditIndex = null;
let project = new URLSearchParams(window.location.search).get("name") || "default";

// Ambil data requirement dari localStorage
function getRequirements() {
  return JSON.parse(localStorage.getItem(`requirements_${project}`)) || [];
}

// Simpan data requirement
function saveRequirements(data) {
  localStorage.setItem(`requirements_${project}`, JSON.stringify(data));
}

// Tampilkan semua requirement ke dalam list
function loadRequirements() {
  console.log("🔄 Memuat requirement...");
  const list = document.getElementById("requirementList");
  if (!list) return;

  const data = getRequirements();
  list.innerHTML = "";

  data.forEach((req, i) => {
    const li = document.createElement("li");
    li.className = "bg-white p-4 rounded shadow flex justify-between items-start";

    li.innerHTML = `
      <div>
        <div class="text-indigo-600 font-bold">${req.id}</div>
        <div class="font-medium text-gray-800">${req.title}</div>
        <div class="text-sm text-gray-600">${req.desc}</div>
        <div class="text-sm text-gray-600 mt-1">🔁 Flow: ${req.flow || '-'}</div>
        <div class="text-sm text-gray-600">⚙️ Performance: ${req.performance || '-'}</div>
        <div class="text-sm text-gray-600">📱 Support: ${req.support || '-'}</div>
        <div class="text-sm text-gray-600">🛡️ Recovery: ${req.recovery || '-'}</div>
        ${req.diagram ? `<img src="${req.diagram}" class="mt-2 max-h-32 rounded border">` : ''}
      </div>
      <div class="flex gap-2">
        <button onclick="editRequirement(${i})" class="text-sm text-blue-600 hover:underline">Edit</button>
        <button onclick="deleteRequirement(${i})" class="text-sm text-red-600 hover:underline">Hapus</button>
      </div>
    `;
    list.appendChild(li);
  });
}

// Buka modal untuk tambah requirement
function openAddModal() {
  reqEditIndex = null;
  document.getElementById("modalTitle").textContent = "Tambah Requirement";

  document.getElementById("reqId").value = "";
  document.getElementById("reqTitle").value = "";
  document.getElementById("reqDesc").value = "";
  document.getElementById("reqFlow").value = "";
  document.getElementById("reqPerformance").value = "";
  document.getElementById("reqSupport").value = "";
  document.getElementById("reqRecovery").value = "";
  document.getElementById("reqDiagram").value = "";

  document.getElementById("requirementModal").classList.remove("hidden");
}

// Tutup modal
function closeModal() {
  document.getElementById("requirementModal").classList.add("hidden");
}

// Edit data requirement
function editRequirement(index) {
  const data = getRequirements()[index];
  reqEditIndex = index;

  document.getElementById("modalTitle").textContent = `Edit ${data.id}`;
  document.getElementById("reqId").value = data.id;
  document.getElementById("reqTitle").value = data.title;
  document.getElementById("reqDesc").value = data.desc;
  document.getElementById("reqFlow").value = data.flow || "";
  document.getElementById("reqPerformance").value = data.performance || "";
  document.getElementById("reqSupport").value = data.support || "";
  document.getElementById("reqRecovery").value = data.recovery || "";
  document.getElementById("reqDiagram").value = "";

  document.getElementById("requirementModal").classList.remove("hidden");
}

// Simpan requirement baru atau hasil edit
function saveRequirement() {
  const id = document.getElementById("reqId").value.trim();
  const title = document.getElementById("reqTitle").value.trim();
  const desc = document.getElementById("reqDesc").value.trim();
  const flow = document.getElementById("reqFlow").value.trim();
  const performance = document.getElementById("reqPerformance").value.trim();
  const support = document.getElementById("reqSupport").value.trim();
  const recovery = document.getElementById("reqRecovery").value.trim();
  const diagramInput = document.getElementById("reqDiagram");
  const diagram = diagramInput.files[0] ? URL.createObjectURL(diagramInput.files[0]) : null;

  if (!id || !title) {
    alert("ID dan Judul harus diisi.");
    return;
  }

  const data = getRequirements();

  if (reqEditIndex === null) {
    // Validasi ID unik
    if (data.find(r => r.id === id)) {
      alert("ID sudah digunakan, gunakan ID lain.");
      return;
    }
    data.push({ id, title, desc, flow, diagram, performance, support, recovery });
  } else {
    data[reqEditIndex] = { id, title, desc, flow, diagram, performance, support, recovery };
  }

  saveRequirements(data);
  closeModal();
  loadRequirements();
}

// Hapus requirement
function deleteRequirement(index) {
  if (confirm("Hapus requirement ini?")) {
    const data = getRequirements();
    data.splice(index, 1);
    saveRequirements(data);
    loadRequirements();
  }
}

// Export semua requirement ke PDF
function exportRequirementPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const data = getRequirements();

  doc.text(`📋 Requirement List - Project: ${project}`, 10, 10);
  let y = 20;

  data.forEach((r, idx) => {
    doc.setFontSize(10);
    doc.text(`${idx + 1}. [${r.id}] ${r.title}`, 10, y); y += 6;
    doc.setFontSize(9);
    doc.text(`Deskripsi: ${r.desc}`, 12, y); y += 5;
    if (r.flow)       { doc.text(`Flow: ${r.flow}`, 12, y); y += 5; }
    if (r.performance){ doc.text(`Performance: ${r.performance}`, 12, y); y += 5; }
    if (r.support)    { doc.text(`Support: ${r.support}`, 12, y); y += 5; }
    if (r.recovery)   { doc.text(`Recovery: ${r.recovery}`, 12, y); y += 5; }
    y += 4;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.save(`requirement_${project}.pdf`);
}

// Validasi login jika belum ada
if (typeof checkLogin === "undefined") {
  function checkLogin() {
    const user = localStorage.getItem("loggedInUser");
    if (!user) {
      alert("Silakan login terlebih dahulu.");
      window.location.href = "index.html";
    }
  }

  function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
  }
}

// Jalankan saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();
  loadRequirements();

  const nameDisplay = document.getElementById("projectNameDisplay");
  if (nameDisplay) {
    nameDisplay.textContent = `📁 Project: ${project}`;
  }
});


function generateContextAssistant() {
  const data = JSON.parse(localStorage.getItem(`requirements_${project}`)) || [];

  if (!data.length) {
    document.getElementById("contextAssistantPanel").innerHTML = `<p class="text-gray-500">Tidak ada data requirement untuk dianalisis.</p>`;
    return;
  }

  const suggestions = [];

  const emptyFlow = data.filter(r => !r.flow?.trim()).length;
  const noDiagram = data.filter(r => !r.diagram).length;
  const perfMissing = data.filter(r => !r.performance?.trim()).length;
  const weakRecovery = data.filter(r => r.recovery?.toLowerCase().includes("tidak tahu") || !r.recovery?.trim()).length;

  if (emptyFlow > 0) suggestions.push(`📉 <strong>${emptyFlow}</strong> requirement belum memiliki user flow.`);
  if (noDiagram > 0) suggestions.push(`🖼️ <strong>${noDiagram}</strong> requirement belum dilengkapi diagram visual.`);
  if (perfMissing > 0) suggestions.push(`⚙️ <strong>${perfMissing}</strong> requirement belum memiliki performance requirement.`);
  if (weakRecovery > 0) suggestions.push(`🛡️ Beberapa requirement memiliki rencana recovery yang kurang jelas.`);

  if (suggestions.length === 0) {
    suggestions.push("✅ Semua requirement sudah cukup lengkap. Tidak ada rekomendasi tambahan saat ini.");
  }

  const listHtml = `<ul class="list-disc pl-5 space-y-2">${suggestions.map(s => `<li>${s}</li>`).join("")}</ul>`;
  document.getElementById("contextAssistantPanel").innerHTML = listHtml;
}
