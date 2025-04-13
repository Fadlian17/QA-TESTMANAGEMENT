function runAILinter() {
    const projectName = new URLSearchParams(window.location.search).get("name");
    const testCases = JSON.parse(localStorage.getItem(`testCases_${projectName}`)) || [];
  
    const suggestions = [];
  
    testCases.forEach((tc, idx) => {
      if (!tc.expected || tc.expected.trim().length < 5) {
        suggestions.push(`🧪 Test Case ${tc.id} tidak memiliki expected result yang jelas.`);
      }
  
      if (tc.steps && tc.steps.split("\n").length < 2) {
        suggestions.push(`📉 Test Case ${tc.id} hanya memiliki 1 langkah. Tambahkan langkah detail.`);
      }
  
      if (tc.steps && !tc.steps.includes("Given") && !tc.steps.includes("When")) {
        suggestions.push(`⚠️ Test Case ${tc.id} tidak menggunakan format Gherkin.`);
      }
  
      if (tc.feature?.toLowerCase() === "login" && tc.label === "Regression") {
        suggestions.push(`🔁 Test Case ${tc.id} untuk fitur login sudah ada. Periksa kemungkinan duplikasi.`);
      }
  
      if (!tc.requirement || tc.requirement === "-") {
        suggestions.push(`📋 Test Case ${tc.id} belum dikaitkan dengan requirement.`);
      }
    });
  
    const panel = document.getElementById("linterPanel");
    panel.innerHTML = "";
    if (suggestions.length === 0) {
      panel.innerHTML = "<p class='text-green-700'>✅ Tidak ditemukan masalah pada test case.</p>";
    } else {
      suggestions.forEach(s => {
        const p = document.createElement("p");
        p.className = "text-sm text-gray-800 mb-1";
        p.textContent = s;
        panel.appendChild(p);
      });
    }
  }
  