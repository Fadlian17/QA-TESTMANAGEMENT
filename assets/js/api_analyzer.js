let apiSet = new Set();
let parsedAPIs = [];

function parseLog() {
  const fileInput = document.getElementById("logFileInput");
  const file = fileInput.files[0];
  if (!file) return alert("Pilih file log terlebih dahulu.");

  const reader = new FileReader();
  reader.onload = function (e) {
    const lines = e.target.result.split("\n");
    apiSet.clear();
    parsedAPIs = [];

    lines.forEach(line => {
      const match = line.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\S+)/i);
      if (match) {
        const method = match[1].toUpperCase();
        const endpoint = match[2];
        const key = `${method} ${endpoint}`;

        if (!apiSet.has(key)) {
          apiSet.add(key);
          parsedAPIs.push({ method, endpoint });
        }
      }
    });

    renderAPIList();
  };

  reader.readAsText(file);
}

function renderAPIList() {
  const list = document.getElementById("apiList");
  list.innerHTML = "";

  parsedAPIs.forEach(api => {
    const li = document.createElement("li");
    li.className = "bg-white px-3 py-2 rounded shadow";
    li.textContent = `${api.method} ${api.endpoint}`;
    list.appendChild(li);
  });
}

function exportToJSON() {
  const blob = new Blob([JSON.stringify(parsedAPIs, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "parsed_apis.json";
  link.click();
}
