function saveSetup(e) {
    e.preventDefault(); // mencegah reload form
  
    const project = new URLSearchParams(window.location.search).get("project") || "default";
  
    const setup = {
      project,
      summary: document.getElementById("summary").value.trim(),
      details: document.getElementById("details").value.trim(),
      link: document.getElementById("link").value.trim(),
      importantLink: document.getElementById("importantLink").value.trim(),
      image: null
    };
  
    const imageInput = document.getElementById("projectImage");
    const file = imageInput?.files?.[0];
  
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        setup.image = e.target.result;
        localStorage.setItem(`projectSetup_${project}`, JSON.stringify(setup));
        alert("✅ Setup berhasil disimpan!");
      };
      reader.readAsDataURL(file);
    } else {
      localStorage.setItem(`projectSetup_${project}`, JSON.stringify(setup));
      alert("✅ Setup berhasil disimpan!");
    }
  }

  
  function loadSetup() {
    const project = new URLSearchParams(window.location.search).get("project") || "default";
    const data = JSON.parse(localStorage.getItem(`projectSetup_${project}`));
  
    if (!data) return;
  
    document.getElementById("projectName").value = data.project || "";
    document.getElementById("summary").value = data.summary || "";
    document.getElementById("details").value = data.details || "";
    document.getElementById("link").value = data.link || "";
    document.getElementById("importantLink").value = data.importantLink || "";
  
    if (data.image) {
      const preview = document.getElementById("imagePreview");
      preview.src = data.image;
      preview.classList.remove("hidden");
    }
  }

  
  function previewImage(input) {
    const file = input.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const preview = document.getElementById("imagePreview");
        preview.src = e.target.result;
        preview.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    }
  }
  