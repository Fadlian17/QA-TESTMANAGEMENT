function createListItem(content) {
    const li = document.createElement("li");
    li.textContent = content;
    li.className =
      "bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600";
    li.draggable = true;
    li.ondragstart = (e) => {
      e.dataTransfer.setData("text/plain", content);
      e.dataTransfer.setData("elementId", li.id);
    };
    return li;
  }
  
  function addBacklog() {
    const input = document.getElementById("backlogInput");
    if (input.value.trim()) {
      const item = createListItem(input.value.trim());
      document.getElementById("backlog").appendChild(item);
      input.value = "";
    }
  }
  
  function addSprintTask() {
    const input = document.getElementById("sprintInput");
    if (input.value.trim()) {
      const item = createListItem(input.value.trim());
      document.getElementById("sprintTasks").appendChild(item);
      input.value = "";
    }
  }
  
  function setupDragAndDrop() {
    const columns = ["todo", "inProgress", "done"];
    columns.forEach((id) => {
      const column = document.getElementById(id);
      column.ondragover = (e) => e.preventDefault();
      column.ondrop = (e) => {
        e.preventDefault();
        const text = e.dataTransfer.getData("text/plain");
        const item = createListItem(text);
        column.appendChild(item);
      };
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    setupDragAndDrop();
  });
  