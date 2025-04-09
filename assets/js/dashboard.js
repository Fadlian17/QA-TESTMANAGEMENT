function loadProjects() {
  const list = document.getElementById("projectList");
  const projects = JSON.parse(localStorage.getItem("projects")) || [];
  list.innerHTML = "";

  projects.forEach((proj, idx) => {
    const li = document.createElement("li");

    // ⬇️ Tambahkan class animasi saat muncul
    li.className = "opacity-0 translate-y-4 transition-all duration-500 ease-out";

    li.innerHTML = `
      <div class="bg-white p-4 rounded shadow-md hover:shadow-lg transition hover:scale-[1.01] duration-300">
        <h3 class="text-lg font-semibold text-gray-800">${proj}</h3>
        <div class="mt-2 flex gap-2">
          <a href="project_setup.html?project=${proj}" class="text-orange-600 underline text-sm">Setup</a>
          <a href="project.html?name=${proj}" class="text-indigo-600 underline text-sm">Detail</a>
          <a href="result.html?project=${proj}" class="text-green-600 underline text-sm">Laporan</a>
          <a href="matrix.html?project=${proj}" class="text-purple-600 underline text-sm">Matriks</a>
        </div>
      </div>
    `;

    list.appendChild(li);

    // 🔁 Aktifkan animasi dengan sedikit delay
    setTimeout(() => {
      li.classList.remove("opacity-0", "translate-y-4");
      li.classList.add("opacity-100", "translate-y-0");
    }, 10 * (idx + 1)); // Staggered delay (efek urutan)
  });
}

function addProject() {
    const input = document.getElementById("projectName");
    const name = input.value.trim();
    if (!name) return alert("Nama project tidak boleh kosong.");

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    if (projects.includes(name)) return alert("Project sudah ada!");

    projects.push(name);
    localStorage.setItem("projects", JSON.stringify(projects));
    input.value = "";
    loadProjects();
}


function renderProjects() {
    let projectList = document.getElementById("projectList");
    let projects = JSON.parse(localStorage.getItem("projects")) || [];
    projectList.innerHTML = "";
  
    projects.forEach((proj) => {
      let li = document.createElement("li");
      li.innerHTML = `
        <div class="bg-white p-4 rounded shadow-md">
          <h3 class="text-lg font-semibold text-gray-800">${proj}</h3>
          <div class="mt-2 flex gap-2">
            <a href="project.html?name=${proj}" class="text-indigo-600 underline text-sm">Detail</a>
            <a href="result.html?project=${proj}" class="text-green-600 underline text-sm">Laporan</a>
            <a href="matrix.html?project=${proj}" class="text-purple-600 underline text-sm">Matriks</a>
          </div>
        </div>
      `;
      projectList.appendChild(li);
    });
  }
  