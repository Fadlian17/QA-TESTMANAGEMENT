// execution.js

let projectName = "";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  projectName = params.get("name");

  const selector = document.getElementById("projectSelector");
  populateProjectDropdown(selector);

  if (projectName) {
    selector.value = projectName;
    loadTestExecutionList();
  }
});

function populateProjectDropdown(selector) {
  // Ambil semua key di localStorage yang berupa testCases_{project}
  const keys = Object.keys(localStorage);
  const projectNames = keys
    .filter(key => key.startsWith("testCases_"))
    .map(key => key.replace("testCases_", ""));

  projectNames.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    selector.appendChild(option);
  });
}

function onProjectChange() {
  const selector = document.getElementById("projectSelector");
  projectName = selector.value;

  if (!projectName) {
    document.getElementById("testExecutionList").innerHTML = "";
    return;
  }

  loadTestExecutionList();
}


function getTestCases() {
  if (!projectName) return [];
  const data = localStorage.getItem(`testCases_${projectName}`);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Gagal memuat testCases:", e);
    return [];
  }
}


function loadTestExecutionList() {
  const container = document.getElementById("testExecutionList");
  const testCases = getTestCases();

  container.innerHTML = "";

  testCases.forEach(tc => {
    const div = document.createElement("div");
    div.className = "border p-4 rounded shadow bg-gray-50";

    div.innerHTML = `
      <div class="font-semibold text-lg mb-2">${tc.id} - ${tc.scenario}</div>
      <div class="text-sm mb-2">Fitur: ${tc.feature}</div>
      <div class="mb-2">
        <label class="block text-sm font-medium">Status:</label>
        <select class="statusDropdown mt-1 border p-1 rounded" data-id="${tc.id}">
          <option value="Not Started" ${tc.status === "Not Started" ? "selected" : ""}>Not Started</option>
          <option value="In Progress" ${tc.status === "In Progress" ? "selected" : ""}>In Progress</option>
          <option value="Passed" ${tc.status === "Passed" ? "selected" : ""}>Passed</option>
          <option value="Failed" ${tc.status === "Failed" ? "selected" : ""}>Failed</option>
          <option value="Blocked" ${tc.status === "Blocked" ? "selected" : ""}>Blocked</option>
          <option value="Retested" ${tc.status === "Retested" ? "selected" : ""}>Retested</option>
        </select>
      </div>
      <textarea placeholder="Catatan eksekusi..." class="noteInput w-full mt-2 border p-2 rounded text-sm" data-id="${tc.id}">${tc.notes || ""}</textarea>
    `;

    container.appendChild(div);
  });
}

function saveExecutionResults() {
  const testCases = getTestCases();

  document.querySelectorAll(".statusDropdown").forEach(select => {
    const id = select.dataset.id;
    const tc = testCases.find(t => t.id === id);
    if (tc) {
      tc.status = select.value;
    }
  });

  document.querySelectorAll(".noteInput").forEach(textarea => {
    const id = textarea.dataset.id;
    const tc = testCases.find(t => t.id === id);
    if (tc) {
      tc.notes = textarea.value;
    }
  });

  localStorage.setItem(`testCases_${projectName}`, JSON.stringify(testCases));
  alert("Hasil eksekusi disimpan!");
}
