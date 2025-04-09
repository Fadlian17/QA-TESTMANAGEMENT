let projectName = "";
let editIndex = null;

function loadProjectPage() {
  const params = new URLSearchParams(window.location.search);
  projectName = params.get("name");
  console.log("Project:", projectName);

  if (!projectName) {
    alert("Project tidak ditemukan.");
    window.location.href = "dashboard.html";
    return;
  }

  document.getElementById("projectTitle").textContent = `Project: ${projectName}`;

  const resultBtn = document.getElementById("toResult");
  if (resultBtn && projectName) {
    resultBtn.href = `result.html?project=${encodeURIComponent(projectName)}`;
  }

  renderTable();

  populateRequirementFilter();

}


function getTestCases() {
  const data = localStorage.getItem(`testCases_${projectName}`);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Gagal parse testCases:", e);
    return [];
  }
}

function saveTestCases(data) {
  localStorage.setItem(`testCases_${projectName}`, JSON.stringify(data));
}

function openAddModal() {
  editIndex = null;
  resetModalFields();
  document.getElementById("modalTitle").innerText = "Tambah Test Case";
  document.getElementById("testCaseModal").classList.remove("hidden");
  toggleModalNavButtons();
  populateRequirementOptions();

  const draft = JSON.parse(localStorage.getItem("issueDraft")) || {};

  document.getElementById("modalTitle").textContent = "Tambah Issue";
  document.getElementById("issueTitle").value = draft.title || "";
  document.getElementById("issueDesc").value = draft.desc || "";
  document.getElementById("issueSeverity").value = draft.severity || "Low";
  document.getElementById("issueStatus").value = draft.status || "Open";
  document.getElementById("linkedTestCase").value = draft.linkedTestCase || "";

  document.getElementById("issueFile").value = "";
  document.getElementById("issueModal").classList.remove("hidden");

  // bersihkan setelah ditampilkan
  localStorage.removeItem("issueDraft");
}

function openEditModal(index) {
  const tc = getTestCases()[index];
  editIndex = index;

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
  populateRequirementOptions();

}

function toggleModalNavButtons() {
  const leftBtn = document.getElementById("navLeft");
  const rightBtn = document.getElementById("navRight");
  const testCases = getTestCases();

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
    return alert("Harap isi semua field utama.");
  }

  const testCases = getTestCases();

  if (editIndex === null) {
    const newId = `TC${testCases.length + 1}`;
    testCases.push({
      id: newId,
      scenario,
      feature,
      steps,
      expected,
      label,
      requirement,
      status: "Not Started",
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

  }

  saveTestCases(testCases);
  closeModal();
  renderTable();
}

function deleteTestCase(index) {
  if (confirm("Yakin ingin menghapus test case ini?")) {
    const testCases = getTestCases();
    testCases.splice(index, 1);
    saveTestCases(testCases);
    renderTable();
  }
}

function renderTable() {
  const testCases = getTestCases();
  const table = document.getElementById("testCaseTable");
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
  const testCases = getTestCases();
  if (editIndex === null) return;

  let newIndex = editIndex + direction;
  if (newIndex >= 0 && newIndex < testCases.length) {
    openEditModal(newIndex);
  }
}

document.addEventListener("DOMContentLoaded", loadProjectPage);


function updateStatus(index, value) {
  const testCases = getTestCases();
  testCases[index].status = value;
  saveTestCases(testCases);
  renderTable(); // optional kalau ingin refresh
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
  if (!select || !projectName) return;

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

  const data = JSON.parse(localStorage.getItem(`requirements_${projectName}`)) || [];
  select.innerHTML = `<option value="">-- Semua Requirement --</option>`;
  data.forEach(req => {
    const opt = document.createElement("option");
    opt.value = req.id;
    opt.textContent = req.id;
    select.appendChild(opt);
  });
}


function reportToIssue(index) {
  const tc = getTestCases()[index];
  const issueData = {
    title: `Bug dari Test Case ${tc.id}`,
    desc: `Fitur: ${tc.feature}\nSkenario: ${tc.scenario}\nLangkah: ${tc.steps}\nEkspektasi: ${tc.expected}\n\nStatus: ${tc.status}`,
    severity: "High",
    status: "Open",
    linkedTestCase: tc.id,
    fromProject: projectName,
    attachment: null
  };

  localStorage.setItem("issueDraft", JSON.stringify(issueData));
  window.location.href = `issue.html?name=${projectName}`;
}




