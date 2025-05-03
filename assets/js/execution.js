const project = new URLSearchParams(window.location.search).get("name") || "default";

function getTestCases() {
  return JSON.parse(localStorage.getItem(`testCases_${project}`)) || [];
}

function getExecutionResults() {
  return JSON.parse(localStorage.getItem(`execution_${project}`)) || {};
}

function renderTestExecution() {
  const list = document.getElementById("testExecutionList");
  const testCases = getTestCases();
  const results = getExecutionResults();

  list.innerHTML = "";

  testCases.forEach((tc, index) => {
    const status = results[tc.id] || "";

    const div = document.createElement("div");
    div.className = "border p-4 rounded";

    div.innerHTML = `
      <p class="font-semibold">${tc.id}: ${tc.scenario}</p>
      <div class="mt-2 space-x-3">
        <label><input type="radio" name="status_${index}" value="Passed" ${status === "Passed" ? "checked" : ""}> ✅ Passed</label>
        <label><input type="radio" name="status_${index}" value="Failed" ${status === "Failed" ? "checked" : ""}> ❌ Failed</label>
        <label><input type="radio" name="status_${index}" value="Blocked" ${status === "Blocked" ? "checked" : ""}> 🚫 Blocked</label>
      </div>
    `;

    list.appendChild(div);
  });
}

function saveExecutionResults() {
  const testCases = getTestCases();
  const results = {};

  testCases.forEach((tc, index) => {
    const radios = document.getElementsByName(`status_${index}`);
    for (const r of radios) {
      if (r.checked) {
        results[tc.id] = r.value;
        break;
      }
    }
  });

  localStorage.setItem(`execution_${project}`, JSON.stringify(results));
  alert("✅ Hasil eksekusi berhasil disimpan!");
}

document.addEventListener("DOMContentLoaded", renderTestExecution);
