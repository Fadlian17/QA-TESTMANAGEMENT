let projectName = "";

function loadProjectList() {
  const select = document.getElementById("projectMatrix");
  const projects = JSON.parse(localStorage.getItem("projects")) || [];

  select.innerHTML = '<option value="">-- Pilih Project --</option>';
  projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });

  const params = new URLSearchParams(window.location.search);
  const selected = params.get("project");
  if (selected && projects.includes(selected)) {
    select.value = selected;
    projectName = selected;
    loadMatrix();
  }
}

function onProjectSelect() {
  const select = document.getElementById("projectMatrix");
  const selected = select.value;
  if (!selected) return;

  projectName = selected;
  history.replaceState(null, "", `?project=${selected}`);
  loadMatrix();
}

function loadMatrix() {
  const table = document.querySelector("#matrixTable tbody");
  const loader = document.getElementById("loading");
  const noData = document.getElementById("noData");
  const select = document.getElementById("projectMatrix");

  table.innerHTML = "";
  loader.classList.remove("hidden");
  noData.classList.add("hidden");

  const selected = select.value;
  if (!selected) {
    loader.classList.add("hidden");
    return;
  }

  projectName = selected;
  const testCases = JSON.parse(localStorage.getItem(`testCases_${selected}`)) || [];

  if (testCases.length === 0) {
    loader.classList.add("hidden");
    noData.classList.remove("hidden");
    return;
  }

  testCases.forEach(tc => {
    const row = document.createElement("tr");

    // Highlight warna
    let bgColor = "";
    if (tc.status === "Failed") bgColor = "bg-red-100";
    else if (tc.status === "Not Started") bgColor = "bg-yellow-100";
    else if (tc.status === "Passed") bgColor = "bg-green-100";
    else if (tc.status === "Blocked") bgColor = "bg-orange-100";

    row.innerHTML = `
      <td class="border p-2 ${bgColor}">${tc.requirement || "-"}</td>
      <td class="border p-2 ${bgColor}">${tc.scenario || "-"}</td>
      <td class="border p-2 ${bgColor}">${tc.id}</td>
      <td class="border p-2 font-semibold ${bgColor}">${tc.status || "Not Started"}</td>
    `;

    row.onclick = () => {
      window.location.href = `project.html?name=${projectName}#${tc.id}`;
    };

    row.classList.add("cursor-pointer", "hover:bg-gray-100");
    table.appendChild(row);
  });

  loader.classList.add("hidden");
  renderCoverageProgress(testCases);
}

function renderCoverageProgress(testCases) {
  const total = testCases.length;
  const passed = testCases.filter(tc => tc.status === "Passed").length;
  const failed = testCases.filter(tc => tc.status === "Failed").length;
  const executed = testCases.filter(tc => tc.status && tc.status !== "Not Started").length;

  const percent = total > 0 ? Math.round((executed / total) * 100) : 0;
  document.getElementById("coverageProgress").innerHTML = `
    🔍 <strong>${executed} / ${total}</strong> test case telah dieksekusi (${percent}%).
    ✅ Passed: <strong>${passed}</strong>, ❌ Failed: <strong>${failed}</strong>
  `;
}

async function exportMatrixPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const table = document.getElementById("matrixTable");
  if (!table) return alert("Tabel tidak ditemukan");

  doc.text("📊 Matriks Coverage - Project: " + (projectName || "Tidak diketahui"), 10, 10);

  await doc.autoTable({
    html: "#matrixTable",
    startY: 20,
    styles: {
      fontSize: 8,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: [255, 255, 255],
    }
  });

  doc.save(`matrix-${projectName}.pdf`);
}

document.addEventListener("DOMContentLoaded", () => {
  loadProjectList();
  document.getElementById("projectMatrix").addEventListener("change", onProjectSelect);
});
