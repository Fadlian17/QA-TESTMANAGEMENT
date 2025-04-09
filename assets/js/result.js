let chartInstance = null;

let chartTimelineInstance = null;


function loadProjects() {
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  const select = document.getElementById("projectSelect");
  const urlParams = new URLSearchParams(window.location.search);
  const preselected = urlParams.get("project");

  select.innerHTML = '<option value="">-- Pilih Project --</option>';
  projects.forEach(p => {
    const option = document.createElement("option");
    option.value = p;
    option.textContent = p;
    if (p === preselected) option.selected = true;
    select.appendChild(option);
  });

  if (preselected) loadResultChart(preselected);
}

function getTestCases(project) {
  return JSON.parse(localStorage.getItem(`testCases_${project}`)) || [];
}

function getStatusCounts(testCases) {
  return testCases.reduce((acc, tc) => {
    const status = tc.status || "Not Started";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function loadResultChart(project = null) {
  const selectedProject = project || document.getElementById("projectSelect").value;
  if (!selectedProject) return;

  const testCases = getTestCases(selectedProject);
  if (testCases.length === 0) {
    alert("Belum ada test case pada project ini.");
    return;
  }

  const statusCounts = getStatusCounts(testCases);
  const labels = Object.keys(statusCounts);
  const data = Object.values(statusCounts);
  const ctx = document.getElementById("statusChart").getContext("2d");

  if (chartInstance instanceof Chart) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: 'Status Eksekusi',
        data,
        backgroundColor: ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#6b7280", "#a855f7"]
      }]
    }
  });

  // Jalankan AI suggestion Test Cases
  generateAISuggestions(testCases);
 // Jalankan AI Summary Result
  generateAISummary(testCases);

  //jalankan Execution Timeline

  renderExecutionTimeline(testCases);

  loadProjectSetup(project);


}

function generateAISuggestions(testCases) {
  const suggestions = [];
  const total = testCases.length;

  const notStarted = testCases.filter(tc => tc.status === "Not Started").length;
  const failed = testCases.filter(tc => tc.status === "Failed");
  const blocked = testCases.filter(tc => tc.status === "Blocked");
  const noRequirement = testCases.filter(tc => !tc.requirement || tc.requirement === "-");

  if (notStarted / total > 0.3) {
    suggestions.push("🔁 Lebih dari 30% test case belum dieksekusi. Segera prioritaskan eksekusi awal.");
  }
  if (failed.length > 0) {
    suggestions.push(`❌ Terdapat ${failed.length} test case yang gagal. Lakukan analisa kegagalan dan uji ulang.`);
  }
  if (blocked.length > 0) {
    suggestions.push(`🚧 ${blocked.length} test case dalam status Blocked. Koordinasikan dengan developer terkait hambatan.`);
  }
  if (noRequirement.length > 0) {
    suggestions.push(`📋 ${noRequirement.length} test case belum dikaitkan dengan requirement manapun.`);
  }
  if (suggestions.length === 0) {
    suggestions.push("✅ Semua test case telah ditangani dengan baik. Tidak ada saran tambahan saat ini.");
  }

  const list = document.getElementById("aiSuggestionsList");
  list.innerHTML = "";
  suggestions.forEach(msg => {
    const li = document.createElement("li");
    li.textContent = msg;
    list.appendChild(li);
  });
}


function generateAISummary(testCases) {
  const total = testCases.length;
  const passed = testCases.filter(tc => tc.status === "Passed").length;
  const failed = testCases.filter(tc => tc.status === "Failed").length;
  const notStarted = testCases.filter(tc => tc.status === "Not Started").length;
  const executed = total - notStarted;

  const executedPct = Math.round((executed / total) * 100);
  const passedPct = Math.round((passed / total) * 100);
  const failedPct = Math.round((failed / total) * 100);

  let summary = `Total terdapat ${total} test case. Sebanyak ${executed} (${executedPct}%) telah dieksekusi. `;
  summary += `${passed} test case (${passedPct}%) berhasil dan ${failed} (${failedPct}%) gagal. `;

  if (notStarted > 0) {
    summary += `Masih ada ${notStarted} test case (${100 - executedPct}%) yang belum dijalankan. `;
  }

  summary += `Perlu fokus pada area dengan kegagalan tinggi dan pastikan coverage menyeluruh terhadap requirement.`;

  document.getElementById("aiSummaryText").textContent = summary;
}


function exportChartImage() {
  const canvas = document.getElementById("statusChart");
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "chart-status.png";
  link.click();
}

function exportChartPDF() {
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert("Gagal memuat jsPDF. Pastikan skrip jsPDF dimuat dengan benar.");
    return;
  }
  const canvas = document.getElementById("statusChart");
  const imgData = canvas.toDataURL("image/png");

  const doc = new jsPDF();
  doc.text("Status Eksekusi Test Case", 10, 10);
  doc.addImage(imgData, 'PNG', 10, 20, 180, 100);
  doc.save("chart-status.pdf");
}


function renderExecutionTimeline(testCases) {
  const ctx = document.getElementById("executionTimeline").getContext("2d");

  if (chartTimelineInstance instanceof Chart) {
    chartTimelineInstance.destroy();
  }

  const executed = testCases
    .filter(tc => tc.executedAt)
    .map(tc => {
      const date = new Date(tc.executedAt).toISOString().slice(0, 10);
      return date;
    });

  const dateCounts = executed.reduce((acc, date) => {
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const dates = Object.keys(dateCounts).sort();
  const values = dates.map(d => dateCounts[d]);

  chartTimelineInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dates,
      datasets: [{
        label: "Jumlah Eksekusi per Hari",
        data: values,
        backgroundColor: "#3b82f6"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Tanggal" } },
        y: { title: { display: true, text: "Jumlah Test Case" }, beginAtZero: true }
      }
    }
  });
}




function sendTestReport() {
  const project = document.getElementById("projectSelect").value;
  const testCases = getTestCases(project);

  const payload = {
    project,
    total: testCases.length,
    result: getStatusCounts(testCases),
    sentAt: new Date().toISOString()
  };

  const webhookURL = "https://your-webhook-or-api-endpoint.com";

  fetch(webhookURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => {
      if (res.ok) alert("✅ Laporan berhasil dikirim!");
      else throw new Error("Gagal mengirim laporan");
    })
    .catch(err => {
      console.error(err);
      alert("❌ Gagal mengirim laporan.");
    });
}

document.addEventListener("DOMContentLoaded", loadProjects);
document.getElementById("projectSelect").addEventListener("change", loadResultChart);



function loadProjectSetup(project) {
  const container = document.getElementById("setupProjectInfo");
  if (!container) return;

  const setup = JSON.parse(localStorage.getItem(`projectSetup_${project}`)) || {};
  container.innerHTML = `
    <p><strong>📁 Project:</strong> ${project}</p>
    <p><strong>📝 Rangkuman:</strong> ${setup.summary || "-"}</p>
    <p><strong>📄 Detail Setup:</strong> ${setup.details || "-"}</p>
    ${setup.link ? `<p><strong>🔗 Link Tambahan:</strong> <a href="${setup.link}" target="_blank" class="text-blue-600 underline">${setup.link}</a></p>` : ""}
    ${setup.importantLink ? `<p><strong>📌 Link Penting:</strong> <a href="${setup.importantLink}" target="_blank" class="text-blue-600 underline">${setup.importantLink}</a></p>` : ""}
    ${setup.image ? `<img src="${setup.image}" class="mt-2 max-h-40 border rounded">` : ""}
  `;
}
