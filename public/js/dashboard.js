/*
 * Dashboard (index.html): a read-only summary. Creating and editing happens on
 * the Courses, Tasks, Schedule and Statistics pages (and in the Add-task popup).
 *   GET /api/users            name and weekly goal (no login yet: the first user)
 *   GET /api/courses          Your courses, course names and colours
 *   GET /api/tasks            Priority tasks, next deadline of each course
 *   GET /api/events           Today, Tomorrow, Today's schedule, Study reminder
 *   GET /api/study-sessions   Weekly statistics, Study reminder
 *   GET /api/grades           current grade of each course
 * Ticking a priority task calls completeTask() from tasks.js (PUT /api/tasks/:id).
 * Names start with "dash" because tasks.js is loaded on this page too.
 */

const dashStatus = document.getElementById("dash-status");
const DASH_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let dashData = null; // { user, courses, tasks, events, sessions, grades }

const dashCourseFor = (id) => dashData.courses.find((course) => course.id === id);

// Adds "has-color color-blue" (etc.) so CSS can use the course colour.
function dashAddCourseColor(element, courseId) {
    const course = dashCourseFor(courseId);
    if (course) {
        element.classList.add("has-color", colorClass(course.color));
    }
}

function dashShowEmpty(container, message) {
    const empty = document.createElement("p");
    empty.className = "dash-empty";
    empty.textContent = message;
    container.replaceChildren(empty);
}

function dashEventsOn(date) {
    return dashData.events
        .filter((event) => event.date === date)
        .sort((first, second) => first.startTime.localeCompare(second.startTime));
}

/* ---------- Today / Tomorrow cards and Today's schedule ---------- */

function createDashSlot(event, withCategory) {
    const slot = document.createElement("div");
    const time = document.createElement("p");
    const description = document.createElement("div");
    const title = document.createElement("h3");
    const place = document.createElement("p");

    slot.className = withCategory ? "card-slot-time schedule-item" : "card-slot-time";
    if (!withCategory) {
        dashAddCourseColor(slot, event.courseId);
    }
    time.className = withCategory ? "schedule-time" : "";
    time.textContent = event.startTime;
    description.className = "card-slot-description";
    title.textContent = event.title;
    place.textContent = event.location ?? capitalize(event.type);
    description.append(title, place);
    slot.append(time, description);

    if (withCategory) {
        const category = document.createElement("span");
        category.className = "schedule-category";
        category.textContent = capitalize(event.type);
        slot.append(category);
    }
    return slot;
}

function renderDashEvents() {
    const today = todayISO();
    const tomorrow = addDays(today, 1);

    document.getElementById("dash-today-date").textContent = formatShortDate(today);
    document.getElementById("dash-tomorrow-date").textContent = formatShortDate(tomorrow);

    const days = [
        ["dash-today-events", dashEventsOn(today), false, "Nothing planned."],
        ["dash-tomorrow-events", dashEventsOn(tomorrow), false, "Nothing planned."],
        ["dash-schedule-list", dashEventsOn(today), true, "No events today."]
    ];
    days.forEach(([id, events, withCategory, emptyMessage]) => {
        const container = document.getElementById(id);
        if (events.length === 0) {
            dashShowEmpty(container, emptyMessage);
        } else {
            container.replaceChildren(...events.map((event) => createDashSlot(event, withCategory)));
        }
    });
}

/* ---------- Study reminder: next exam ---------- */

function renderDashExam() {
    const today = todayISO();
    const exam = dashData.events
        .filter((event) => event.type === "exam" && event.date >= today)
        .sort((first, second) => `${first.date}${first.startTime}`.localeCompare(`${second.date}${second.startTime}`))[0];

    const title = document.getElementById("dash-exam-title");
    const when = document.getElementById("dash-exam-date");
    const countdown = document.getElementById("dash-exam-countdown");
    const progressBlock = document.getElementById("dash-exam-progress-block");

    if (!exam) {
        title.textContent = "No exams coming up";
        when.textContent = "";
        countdown.textContent = "";
        progressBlock.hidden = true;
        return;
    }

    const daysLeft = Math.round((parseLocalDate(exam.date) - parseLocalDate(today)) / (24 * 60 * 60 * 1000));
    title.textContent = exam.title;
    when.textContent = `${parseLocalDate(exam.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} at ${exam.startTime}`;
    countdown.textContent = daysLeft === 0 ? "Exam today" : `Exam in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;

    // Study sessions of the exam's course planned up to the exam day.
    const sessions = dashData.sessions.filter((session) => session.courseId === exam.courseId && session.date <= exam.date);
    progressBlock.hidden = exam.courseId === null || sessions.length === 0;
    const done = sessions.filter((session) => session.done).length;
    document.getElementById("dash-exam-progress").style.width = `${sessions.length ? (done / sessions.length) * 100 : 0}%`;
    document.getElementById("dash-exam-sessions").textContent = `${done} out of ${sessions.length} study sessions done`;
}

/* ---------- Priority tasks ---------- */

function createDashPriorityTask(task) {
    const item = document.createElement("li");
    const checkbox = document.createElement("input");
    const content = document.createElement("div");
    const title = document.createElement("label");
    const course = document.createElement("p");
    const indicator = document.createElement("span");
    const due = document.createElement("p");
    const clock = document.createElement("i");
    const level = document.createElement("span");

    item.className = "priority-task";
    checkbox.className = "priority-checkbox";
    checkbox.type = "checkbox";
    checkbox.id = `priority-task-${task.id}`;
    checkbox.setAttribute("aria-label", `Mark ${task.title} complete`);
    checkbox.addEventListener("change", () => completeTask(task, checkbox)); // from tasks.js

    content.className = "priority-task-content";
    title.className = "priority-task-title";
    title.htmlFor = checkbox.id;
    title.textContent = task.title;

    course.className = "priority-course";
    indicator.className = "priority-indicator";
    indicator.setAttribute("aria-hidden", "true");
    dashAddCourseColor(indicator, task.courseId);
    course.append(indicator, dashCourseFor(task.courseId)?.name ?? "Unknown course");

    due.className = "priority-due";
    clock.className = "fa-regular fa-clock";
    clock.setAttribute("aria-hidden", "true");
    due.append(clock, describeTaskDue(task).text); // from tasks.js

    level.className = "priority-level priority-high";
    level.textContent = "High";

    content.append(title, course, due);
    item.append(checkbox, content, level);
    return item;
}

function renderDashPriority() {
    const tasks = dashData.tasks
        .filter((task) => task.priority === "high" && !task.completed)
        .sort((first, second) => first.dueDate.localeCompare(second.dueDate));

    const list = document.getElementById("dash-priority-list");
    document.getElementById("dash-priority-count").textContent = `${tasks.length} ${tasks.length === 1 ? "item" : "items"}`;
    if (tasks.length === 0) {
        dashShowEmpty(list, "No high-priority tasks.");
    } else {
        list.replaceChildren(...tasks.map(createDashPriorityTask));
    }
}

/* ---------- Weekly statistics ---------- */

function renderDashWeek() {
    const week = currentWeekDates();
    const today = todayISO();
    const minutesPerDay = week.map((date) =>
        dashData.sessions
            .filter((session) => session.done && session.date === date)
            .reduce((sum, session) => sum + session.minutes, 0)
    );
    const total = minutesPerDay.reduce((sum, minutes) => sum + minutes, 0);
    const goal = dashData.user?.weeklyGoal;

    document.getElementById("dash-week-hours").textContent = formatHours(total);
    document.getElementById("dash-week-goal").textContent = goal ? `studied of your ${goal}h goal` : "studied this week";
    document.getElementById("dash-week-progress").style.width = goal ? `${Math.min(100, (total / (goal * 60)) * 100)}%` : "0%";

    // Bar height: minutes of that day compared with the busiest day of the week.
    const busiest = Math.max(...minutesPerDay, 1);
    const bars = week.map((date, index) => {
        const bar = document.createElement("div");
        const label = document.createElement("span");
        bar.className = date === today ? "bar bar-active" : "bar";
        bar.style.setProperty("--value", Math.round((minutesPerDay[index] / busiest) * 100));
        bar.title = `${DASH_DAY_LABELS[index]}: ${formatHours(minutesPerDay[index])}`;
        label.textContent = DASH_DAY_LABELS[index];
        bar.append(label);
        return bar;
    });
    document.getElementById("dash-week-chart").replaceChildren(...bars);
}

/* ---------- Your courses ---------- */

function createDashCourse(course) {
    const card = document.createElement("article");
    const code = document.createElement("span");
    const name = document.createElement("h1");
    const progress = document.createElement("div");
    const fill = document.createElement("div");
    const grid = document.createElement("div");

    card.className = `card course has-color ${colorClass(course.color)}`;
    code.textContent = course.code;
    name.className = "card-title";
    name.textContent = course.name;

    const average = averageScore(dashData.grades.filter((grade) => grade.courseId === course.id));
    progress.className = "progress-bar";
    fill.className = "progress-fill";
    fill.style.width = `${average ?? 0}%`;
    progress.append(fill);

    const nextTask = dashData.tasks
        .filter((task) => task.courseId === course.id && !task.completed && task.dueDate >= todayISO())
        .sort((first, second) => first.dueDate.localeCompare(second.dueDate))[0];

    grid.className = "course-grid";
    [["Current Grade", average === null ? "—" : `${average}%`], ["Next deadline", nextTask ? formatShortDate(nextTask.dueDate) : "None"]]
        .forEach(([label, value]) => {
            const cell = document.createElement("div");
            const small = document.createElement("span");
            const big = document.createElement("h3");
            small.textContent = label;
            big.textContent = value;
            cell.append(small, big);
            grid.append(cell);
        });

    card.append(code, name, progress, grid);
    return card;
}

function renderDashCourses() {
    const container = document.getElementById("dash-courses");
    const active = dashData.courses.filter((course) => !course.archived);
    if (active.length === 0) {
        dashShowEmpty(container, "No active courses yet. Add one on the Courses page.");
    } else {
        container.replaceChildren(...active.map(createDashCourse));
    }
}

/* ---------- Loading ---------- */

async function loadDashboard() {
    setStatus(dashStatus, "loading", "Loading your dashboard…");
    try {
        const [users, courses, tasks, events, sessions, grades] = await Promise.all([
            apiRequest("GET", "/users"),
            apiRequest("GET", "/courses"),
            apiRequest("GET", "/tasks"),
            apiRequest("GET", "/events"),
            apiRequest("GET", "/study-sessions"),
            apiRequest("GET", "/grades")
        ]);
        dashData = { user: users[0] ?? null, courses, tasks, events, sessions, grades };
    } catch (error) {
        setStatus(dashStatus, "error", `Couldn't load your dashboard. ${error.message}`);
        return;
    }

    clearStatus(dashStatus);
    document.getElementById("dash-user-name").textContent = dashData.user ? dashData.user.name.split(" ")[0] : "there";
    renderDashEvents();
    renderDashExam();
    renderDashPriority();
    renderDashWeek();
    renderDashCourses();
}

// Reload after a task is added (popup) or ticked (priority list).
document.addEventListener("tasks:changed", loadDashboard);

loadDashboard();
