/*
 * Tasks: the Add/Edit task popup (Dashboard and Tasks page) and the task
 * lists on the Tasks page.
 *   GET  /api/courses      options of the Course select, course names and colours
 *   GET  /api/tasks        Upcoming and Completed lists
 *   POST /api/tasks        Add task
 *   PUT  /api/tasks/:id    Edit task, tick a task as done
 *   DELETE /api/tasks/:id  Delete task
 *
 * Names here start with "task" because the Dashboard loads this file next to
 * its own script, and top-level names are shared between classic scripts.
 */

const taskForm = document.getElementById("task-form");
const taskPopupTitle = document.getElementById("task-popup-title");
const taskCourseSelect = document.getElementById("task-course");

// Only on tasks.html; null on the Dashboard.
const taskUpcomingList = document.getElementById("upcoming-list");
const taskCompletedList = document.getElementById("completed-list");
const taskUpcomingStatus = document.getElementById("upcoming-status");
const taskCompletedStatus = document.getElementById("completed-status");
const taskUpcomingCount = document.getElementById("upcoming-count");
const taskCompletedCount = document.getElementById("completed-count");
const taskSortSelect = document.getElementById("task-sort");

let taskList = [];       // every task from the API
let taskCourses = [];    // every course from the API (archived ones too, for names)
let editingTask = null;  // the task open in the popup, or null when adding

const taskCourseFor = (id) => taskCourses.find((course) => course.id === id);

// Lets other scripts (the Dashboard) refresh when a task changes.
const notifyTasksChanged = () => document.dispatchEvent(new CustomEvent("tasks:changed"));

/* ---------- Course select ---------- */

async function loadTaskCourses() {
    try {
        taskCourses = await apiRequest("GET", "/courses");
        fillTaskCourseOptions();
    } catch {
        const option = new Option("Couldn't load courses", "");
        taskCourseSelect.replaceChildren(option);
    }
}

// Active courses only, plus the task's own course when editing a task of an archived course.
function fillTaskCourseOptions(selectedId = null) {
    const choices = taskCourses
        .filter((course) => !course.archived || course.id === selectedId)
        .sort((first, second) => first.name.localeCompare(second.name));

    if (choices.length === 0) {
        taskCourseSelect.replaceChildren(new Option("Add a course first", ""));
        return;
    }
    taskCourseSelect.replaceChildren(...choices.map((course) => new Option(course.name, course.id)));
    if (selectedId !== null) {
        taskCourseSelect.value = String(selectedId);
    }
}

/* ---------- Popup: choice buttons (Type, Priority) ---------- */

const taskChoiceGroups = taskForm ? taskForm.querySelectorAll("[data-choice-group]") : [];

function selectTaskChoice(group, value) {
    const hiddenInput = taskForm.elements[group.dataset.choiceGroup];
    group.querySelectorAll("button[data-value]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.value === value));
    });
    hiddenInput.value = value;
}

// Remember each group's first selection so Reset can restore it.
const taskDefaultChoices = new Map(
    Array.from(taskChoiceGroups, (group) => [group, taskForm.elements[group.dataset.choiceGroup].value])
);

taskChoiceGroups.forEach((group) => {
    group.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-value]");
        if (button) {
            selectTaskChoice(group, button.dataset.value);
        }
    });
});

/* ---------- Popup: add mode and edit mode ---------- */

function setTaskAddMode() {
    editingTask = null;
    taskPopupTitle.textContent = "Add a task";
    taskForm.querySelector("[type='submit']").textContent = "Submit";
    fillTaskCourseOptions();
    clearFormErrors(taskForm);
}

function openTaskEditor(task) {
    editingTask = task;
    clearFormErrors(taskForm);
    taskPopupTitle.textContent = "Edit task";
    taskForm.querySelector("[type='submit']").textContent = "Save changes";

    const fields = taskForm.elements;
    taskChoiceGroups.forEach((group) => selectTaskChoice(group, task[group.dataset.choiceGroup]));
    fillTaskCourseOptions(task.courseId);
    fields.title.value = task.title;
    fields.dueDate.value = task.dueDate;
    fields.dueTime.value = task.dueTime ?? "";
    fields.reminder.value = task.reminder;
    fields.description.value = task.description ?? "";
    openPopup();
}

// The header's "Add task" button always opens the popup in add mode.
document.querySelector(".add-task-btn")?.addEventListener("click", setTaskAddMode);

taskForm?.addEventListener("reset", () => {
    // Hidden inputs keep their value on reset, so restore them on the next tick.
    setTimeout(() => {
        taskDefaultChoices.forEach((value, group) => selectTaskChoice(group, value));
        setTaskAddMode();
    });
});

/* ---------- Popup: submit ---------- */

taskForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(taskForm);

    // Client-side check first, using the same limits as the API.
    const clientErrors = checkForm(taskForm);
    if (clientErrors.length > 0) {
        showFieldErrors(taskForm, clientErrors);
        return;
    }

    const fields = taskForm.elements;
    const task = {
        title: fields.title.value,
        courseId: Number(fields.courseId.value),
        type: fields.type.value,
        priority: fields.priority.value,
        dueDate: fields.dueDate.value,
        dueTime: fields.dueTime.value || null,
        reminder: fields.reminder.value,
        description: fields.description.value || null,
        completed: editingTask ? editingTask.completed : false
    };

    const submitButton = taskForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        const saved = editingTask
            ? await apiRequest("PUT", `/tasks/${editingTask.id}`, task)
            : await apiRequest("POST", "/tasks", task);

        replaceTaskInList(saved);
        taskForm.reset();
        closePopup();
        notifyTasksChanged();
    } catch (error) {
        showSaveError(taskForm, error);
    } finally {
        submitButton.disabled = false;
    }
});

/* ---------- Tasks page: lists ---------- */

function replaceTaskInList(saved) {
    const index = taskList.findIndex((task) => task.id === saved.id);
    if (index === -1) {
        taskList.push(saved);
    } else {
        taskList[index] = saved;
    }
    renderTaskLists();
}

const taskDueKey = (task) => `${task.dueDate}T${task.dueTime ?? "23:59"}`;

function sortUpcomingTasks(tasks) {
    const sortBy = taskSortSelect?.value ?? "due-asc";
    return tasks.sort((first, second) => {
        if (sortBy === "subject-asc") {
            const firstName = taskCourseFor(first.courseId)?.name ?? "";
            const secondName = taskCourseFor(second.courseId)?.name ?? "";
            return firstName.localeCompare(secondName, undefined, { sensitivity: "base" });
        }
        const order = taskDueKey(first).localeCompare(taskDueKey(second));
        return sortBy === "due-desc" ? -order : order;
    });
}

// { text: "Due today", urgent: true } etc.
function describeTaskDue(task) {
    const today = todayISO();
    const time = task.dueTime ? `, ${task.dueTime}` : "";
    if (task.dueDate === today) {
        return { text: `Due today${time}`, urgent: true };
    }
    if (task.dueDate < today && !task.completed) {
        return { text: `Overdue · ${formatShortDate(task.dueDate)}`, urgent: true };
    }
    return { text: `${formatShortDate(task.dueDate)}${time}`, urgent: false };
}

function createTaskDetails(task) {
    const details = document.createElement("div");
    const title = document.createElement("h3");
    const meta = document.createElement("p");
    const separator = document.createElement("span");
    details.className = "task-details";
    title.textContent = task.title;
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "·";
    meta.append(`${taskCourseFor(task.courseId)?.name ?? "Unknown course"} `, separator, ` ${capitalize(task.type)}`);
    details.append(title, meta);
    return details;
}

function createTaskIconButton(className, iconClass, text, ariaLabel, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", ariaLabel);
    if (iconClass) {
        const icon = document.createElement("i");
        icon.className = iconClass;
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);
    } else {
        button.textContent = text;
    }
    button.addEventListener("click", onClick);
    return button;
}

function createTaskRowEnd(task, showDue) {
    const end = document.createElement("div");
    end.className = "task-row-end";

    if (showDue) {
        const due = document.createElement("time");
        const { text, urgent } = describeTaskDue(task);
        due.className = urgent ? "task-due task-due-today" : "task-due";
        due.dateTime = task.dueTime ? `${task.dueDate}T${task.dueTime}` : task.dueDate;
        due.textContent = text;
        end.append(due);
    }

    end.append(
        createTaskIconButton("task-icon-button", "fa-solid fa-pen", "", `Edit ${task.title}`, () => openTaskEditor(task)),
        createTaskIconButton("task-remove-button", null, "×", `Delete ${task.title}`, () => deleteTask(task))
    );
    return end;
}

function createUpcomingRow(task) {
    const row = document.createElement("li");
    const checkbox = document.createElement("input");
    const mark = document.createElement("span");
    const course = taskCourseFor(task.courseId);

    row.className = "task-row";
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.setAttribute("aria-label", `Mark ${task.title} as complete`);
    checkbox.addEventListener("change", () => completeTask(task, checkbox));

    mark.className = `task-course-mark ${course ? colorClass(course.color) : ""}`.trim();
    mark.setAttribute("aria-hidden", "true");

    row.append(checkbox, mark, createTaskDetails(task), createTaskRowEnd(task, true));
    return row;
}

function createCompletedRow(task) {
    const row = document.createElement("li");
    const checkIcon = document.createElement("span");
    const check = document.createElement("i");
    row.className = "task-row";
    checkIcon.className = "task-complete-icon";
    checkIcon.setAttribute("aria-hidden", "true");
    check.className = "fa-solid fa-check";
    checkIcon.append(check);

    row.append(checkIcon, createTaskDetails(task), createTaskRowEnd(task, false));
    return row;
}

function renderTaskLists() {
    if (!taskUpcomingList) {
        return; // Dashboard: no lists on this page
    }

    const upcoming = sortUpcomingTasks(taskList.filter((task) => !task.completed));
    const completed = taskList
        .filter((task) => task.completed)
        .sort((first, second) => taskDueKey(second).localeCompare(taskDueKey(first)));

    taskUpcomingList.replaceChildren(...upcoming.map(createUpcomingRow));
    taskCompletedList.replaceChildren(...completed.map(createCompletedRow));

    const plural = (count) => `${count} ${count === 1 ? "task" : "tasks"}`;
    taskUpcomingCount.textContent = plural(upcoming.length);
    taskCompletedCount.textContent = plural(completed.length);

    if (upcoming.length === 0) {
        setStatus(taskUpcomingStatus, "empty", "Nothing coming up. Add a task with the Add task button.");
    } else {
        clearStatus(taskUpcomingStatus);
    }
    if (completed.length === 0) {
        setStatus(taskCompletedStatus, "empty", "No completed tasks yet.");
    } else {
        clearStatus(taskCompletedStatus);
    }
}

async function loadTasks() {
    setStatus(taskUpcomingStatus, "loading", "Loading tasks…");
    setStatus(taskCompletedStatus, "loading", "Loading tasks…");
    try {
        taskList = await apiRequest("GET", "/tasks");
        renderTaskLists();
    } catch (error) {
        taskUpcomingList.replaceChildren();
        taskCompletedList.replaceChildren();
        taskUpcomingCount.textContent = "";
        taskCompletedCount.textContent = "";
        setStatus(taskUpcomingStatus, "error", `Couldn't load your tasks. ${error.message}`);
        clearStatus(taskCompletedStatus);
    }
}

taskSortSelect?.addEventListener("change", renderTaskLists);

/* ---------- Tick and delete ---------- */

async function completeTask(task, checkbox) {
    checkbox.disabled = true;
    try {
        // PUT replaces the whole task, so send every field with completed: true.
        const saved = await apiRequest("PUT", `/tasks/${task.id}`, { ...task, completed: true });
        replaceTaskInList(saved); // re-renders: the task moves to Completed
        notifyTasksChanged();
    } catch (error) {
        checkbox.checked = false;
        checkbox.disabled = false;
        setStatus(taskUpcomingStatus, "error", `Couldn't update "${task.title}". ${error.message}`);
    }
}

async function deleteTask(task) {
    if (!confirm(`Delete "${task.title}"?`)) {
        return;
    }
    try {
        await apiRequest("DELETE", `/tasks/${task.id}`);
        taskList = taskList.filter((item) => item.id !== task.id);
        renderTaskLists();
        notifyTasksChanged();
    } catch (error) {
        const status = task.completed ? taskCompletedStatus : taskUpcomingStatus;
        setStatus(status, "error", `Couldn't delete "${task.title}". ${error.message}`);
    }
}

/* ---------- Start ---------- */

async function initTasks() {
    if (!taskForm) {
        return;
    }
    if (taskUpcomingList) {
        setStatus(taskUpcomingStatus, "loading", "Loading tasks…");
    }
    await loadTaskCourses(); // course names are needed to draw the rows
    if (taskUpcomingList) {
        await loadTasks();
    }
}

initTasks();
