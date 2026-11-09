/*
 * Task UI (frontend only).
 *
 * No data is persisted yet: new tasks are rendered into the page and are lost
 * on reload. When the backend exists, replace the marked spots with API calls
 * and render server data through createTaskRow().
 */

const taskForm = document.getElementById("task-form");
const upcomingTasksCard = document.querySelector(".tasks-list-card:not(.completed-tasks)");
const completedTasksCard = document.querySelector(".tasks-list-card.completed-tasks");

const courseMarkClasses = {
    physics: "physics-mark",
    calculus: "calculus-mark",
    economics: "economics-mark",
    data: "data-mark"
};

/* ---------- Helpers ---------- */

function parseLocalDate(isoDate) {
    const [year, month, day] = isoDate.split("-").map(Number);
    return new Date(year, month - 1, day);
}

function formatDueDate(isoDate) {
    const dueDate = parseLocalDate(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate.getTime() === today.getTime()) {
        return "Due today";
    }

    const weekday = dueDate.toLocaleDateString("en-GB", { weekday: "short" });
    const dayMonth = dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return `${weekday}, ${dayMonth}`;
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function updateTaskCount(card) {
    const count = card?.querySelector(".count");
    if (!count) {
        return;
    }
    const total = card.querySelectorAll(".task-list > .task-row").length;
    count.textContent = `${total} ${total === 1 ? "task" : "tasks"}`;
}

/* ---------- Rendering ---------- */

/**
 * Builds an upcoming-task row.
 * task: { title, course, courseName, type, dueDate: "YYYY-MM-DD", dueTime?: "HH:MM" }
 */
function createTaskRow(task) {
    const row = document.createElement("li");
    const checkbox = document.createElement("input");
    const mark = document.createElement("span");
    const details = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const separator = document.createElement("span");
    const due = document.createElement("time");

    row.className = "task-row";

    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", `Mark ${task.title} as complete`);

    mark.className = `task-course-mark ${courseMarkClasses[task.course] ?? ""}`.trim();
    mark.setAttribute("aria-hidden", "true");

    details.className = "task-details";
    title.textContent = task.title;
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "·";
    meta.append(`${task.courseName} `, separator, ` ${capitalize(task.type)}`);
    details.append(title, meta);

    due.className = "task-due";
    due.dateTime = task.dueTime ? `${task.dueDate}T${task.dueTime}` : task.dueDate;
    due.textContent = formatDueDate(task.dueDate);
    if (due.textContent === "Due today") {
        due.classList.add("task-due-today");
    }

    row.append(checkbox, mark, details, due);
    return row;
}

/* ---------- Add-task form ---------- */

if (taskForm) {
    const choiceGroups = taskForm.querySelectorAll("[data-choice-group]");

    const selectChoice = (group, value) => {
        const hiddenInput = taskForm.elements[group.dataset.choiceGroup];
        group.querySelectorAll("button[data-value]").forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.value === value));
        });
        hiddenInput.value = value;
    };

    // Remember each group's initial selection so Reset can restore it.
    const defaultChoices = new Map(
        Array.from(choiceGroups, (group) => [group, taskForm.elements[group.dataset.choiceGroup].value])
    );

    choiceGroups.forEach((group) => {
        group.addEventListener("click", (event) => {
            const button = event.target.closest("button[data-value]");
            if (button) {
                selectChoice(group, button.dataset.value);
            }
        });
    });

    taskForm.addEventListener("reset", () => {
        // Hidden inputs keep their value on reset, so restore them on the next tick.
        setTimeout(() => defaultChoices.forEach((value, group) => selectChoice(group, value)));
    });

    taskForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const formData = new FormData(taskForm);
        const courseSelect = taskForm.elements.course;
        const task = {
            title: formData.get("title").trim(),
            course: formData.get("course"),
            courseName: courseSelect.selectedOptions[0].textContent,
            type: formData.get("type"),
            priority: formData.get("priority"),
            dueDate: formData.get("dueDate"),
            dueTime: formData.get("dueTime") || null,
            reminder: formData.get("reminder"),
            description: formData.get("description").trim() || null
        };

        if (!task.title) {
            taskForm.elements.title.setCustomValidity("Please enter a title.");
            taskForm.reportValidity();
            taskForm.elements.title.setCustomValidity("");
            return;
        }

        // BACKEND: POST the task here and render the saved task returned by the server.
        const upcomingList = upcomingTasksCard?.querySelector(".task-list");
        if (upcomingList) {
            upcomingList.append(createTaskRow(task));
            updateTaskCount(upcomingTasksCard);
            document.getElementById("task-sort")?.dispatchEvent(new Event("change"));
        }

        taskForm.reset();
        closePopup();
    });
}

/* ---------- Completed tasks ---------- */

completedTasksCard?.addEventListener("click", (event) => {
    const removeButton = event.target.closest(".task-remove-button");
    if (!removeButton) {
        return;
    }
    // BACKEND: DELETE the task here before removing the row.
    removeButton.closest(".task-row").remove();
    updateTaskCount(completedTasksCard);
});
