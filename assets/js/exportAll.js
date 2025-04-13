function exportAllInOneReport() {
    const project = new URLSearchParams(window.location.search).get("project");
    if (!project) return alert("Project tidak ditemukan.");
  
    const zip = new JSZip();
  
    // Load data dari localStorage
    const testCases = JSON.parse(localStorage.getItem(`testCases_${project}`)) || [];
    const requirements = JSON.parse(localStorage.getItem(`requirements_${project}`)) || [];
    const setup = JSON.parse(localStorage.getItem(`projectSetup_${project}`)) || {};
  
    // Tambahkan file JSON
    zip.file(`testCases_${project}.json`, JSON.stringify(testCases, null, 2));
    zip.file(`requirements_${project}.json`, JSON.stringify(requirements, null, 2));
    zip.file(`projectSetup_${project}.json`, JSON.stringify(setup, null, 2));
  
    // Tambahkan Matriks Coverage sebagai file TXT
    let matrixTxt = `Requirement\tScenario\tTest Case\tStatus\n`;
    testCases.forEach(tc => {
      matrixTxt += `${tc.requirement || "-"}\t${tc.scenario}\t${tc.id}\t${tc.status || "Not Started"}\n`;
    });
    zip.file(`coverage_matrix_${project}.txt`, matrixTxt);
  
    // Generate ZIP dan download
    zip.generateAsync({ type: "blob" }).then(blob => {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      saveAs(blob, `${project}_report_${timestamp}.zip`);
    });
  }
  