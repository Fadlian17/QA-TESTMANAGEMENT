function register() {
  const username = document.getElementById("regUsername").value.trim();
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  if (!username || !password || !role) return alert("Isi semua field!");

  const users = JSON.parse(localStorage.getItem("users")) || [];
  const existing = users.find(u => u.username === username);
  if (existing) return alert("Username sudah terdaftar!");

  users.push({ username, password, role });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registrasi berhasil! Silakan login.");
  window.location.href = "index.html";
}

  
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const found = users.find(u => u.username === username && u.password === password);
  if (!found) return alert("Login gagal!");

  localStorage.setItem("loggedIn", "true");
  localStorage.setItem("loggedUser", JSON.stringify(found));
  window.location.href = "dashboard.html";
}

  
function checkLogin() {
  if (!localStorage.getItem("loggedIn") || !localStorage.getItem("loggedUser")) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("loggedUser");
  window.location.href = "index.html";
}

function checkAccess(requiredRole) {
  const user = JSON.parse(localStorage.getItem("loggedUser"));
  if (!user || user.role !== requiredRole) {
    alert("🚫 Akses ditolak!");
    window.location.href = "dashboard.html";
  }
}



function addAuditLog(project, log) {
  const key = `auditLogs_${project}`;
  const logs = JSON.parse(localStorage.getItem(key)) || [];
  logs.push({ ...log, timestamp: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(logs));
}
