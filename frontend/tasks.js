const taskList = document.querySelector(".tasks-list-card:not(.completed-tasks) .task-list");
const taskForm = document.querySelector(".form-popup");

async function loadTasks() {
  const response = await fetch("/api/tasks");
  const tasks = await response.json();

  taskList.replaceChildren();   // clear the hard-coded rows

  tasks.forEach((task) => {
    const row = document.createElement("li");
    row.className = "task-row";
    row.innerHTML = `
      <input class="task-checkbox" type="checkbox" ${task.completed ? "checked" : ""}>
      <div class="task-details">
        <h3></h3>
        <p></p>
      </div>
      <time class="task-due" datetime="${task.dueDate}">${task.dueDate}</time>
    `;
    row.querySelector("h3").textContent = task.title;
    row.querySelector("p").textContent = task.course || "";

    row.querySelector(".task-checkbox").addEventListener("change", async (event) => {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: event.target.checked }),
      });
    });

    taskList.append(row);
  });
}

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();   // stops the page from reloading

  const data = Object.fromEntries(new FormData(taskForm));
  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  taskForm.reset();
  closePopup();
  loadTasks();   // refresh the list from the server
};

loadTasks();