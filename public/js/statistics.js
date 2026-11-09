/*
 * Statistics page.
 *   GET /api/users            weekly goal (no login yet: the first user)
 *   GET /api/courses          names and colours
 *   GET /api/tasks            "Tasks completed" figure
 *   GET /api/study-sessions   the study-time figures and charts, and the sessions list
 *   POST / PUT / DELETE /api/study-sessions   add, edit, delete a session
 * The charts are recalculated from the sessions after every change.
 * Study streak, grade trend, insights and the activity heatmap are static for now.
 */

const statisticsStatus = document.getElementById("statistics-status");
const sessionList = document.getElementById("session-list");
const sessionsStatus = document.getElementById("sessions-status");
const sessionForm = document.getElementById("session-form");
const sessionFormTitle = document.getElementById("session-form-title");
const sessionCancelEdit = document.getElementById("session-cancel-edit");
const STAT_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

let statUser = null;
let statCourses = [];
let statTasks = [];
let sessions = [];
let editingSessionId = null;

const statCourseFor = (id) => statCourses.find((course) => course.id === id);

// Sessions marked as done during the current week (Monday to Sunday).
function doneThisWeek() {
    const week = currentWeekDates();
    return sessions.filter((session) => session.done && week.includes(session.date));
}

// Writes "9 <span>hours</span>" into a KPI value.
function setKpi(id, value, unit) {
    const small = document.createElement("span");
    small.textContent = unit;
    document.getElementById(id).replaceChildren(`${value} `, small);
}

/* ---------- Figures at the top ---------- */

function renderKpis() {
    const weekSessions = doneThisWeek();
    const minutes = weekSessions.reduce((sum, session) => sum + session.minutes, 0);
    const goal = statUser?.weeklyGoal;

    setKpi("kpi-hours", Math.round(minutes / 6) / 10, "hours");
    document.getElementById("kpi-hours-note").textContent = goal ? `Your goal is ${goal} hours` : "";

    const completed = statTasks.filter((task) => task.completed).length;
    setKpi("kpi-tasks", completed, `of ${statTasks.length}`);
    document.getElementById("kpi-tasks-note").textContent = statTasks.length
        ? `${Math.round((completed / statTasks.length) * 100)}% of your tasks are done`
        : "No tasks yet";

    const average = weekSessions.length ? Math.round(minutes / weekSessions.length) : 0;
    setKpi("kpi-focus", average, "min");
    document.getElementById("kpi-focus-note").textContent = `${weekSessions.length} sessions done this week`;
}

/* ---------- Study time per day (bars stacked by course) ---------- */

function renderDailyChart() {
    const week = currentWeekDates();
    const today = todayISO();
    const weekSessions = doneThisWeek();
    const minutesOn = (date) => weekSessions.filter((s) => s.date === date).reduce((sum, s) => sum + s.minutes, 0);

    // Goal bar
    const total = weekSessions.reduce((sum, session) => sum + session.minutes, 0);
    const goal = statUser?.weeklyGoal ?? 0;
    const goalLabel = document.getElementById("goal-label");
    const goalUnit = document.createElement("span");
    goalUnit.textContent = `/ ${goal} h`;
    goalLabel.replaceChildren(`${Math.round(total / 6) / 10} `, goalUnit);
    const percent = goal ? Math.min(100, (total / (goal * 60)) * 100) : 0;
    document.getElementById("goal-progress-fill").style.width = `${percent}%`;
    document.getElementById("goal-progress").setAttribute("aria-label", `${Math.round(percent)} percent of your weekly goal`);

    // A full bar is 4 hours, or the busiest day if that is more.
    const scale = Math.max(240, ...week.map(minutesOn));

    const columns = week.map((date, index) => {
        const column = document.createElement("div");
        const value = document.createElement("span");
        const track = document.createElement("div");
        const label = document.createElement("span");
        const dayMinutes = minutesOn(date);

        column.className = date === today ? "study-chart-column is-today" : "study-chart-column";
        value.className = "study-chart-value";
        value.textContent = formatHours(dayMinutes);
        track.className = "study-chart-track";
        label.className = "study-chart-day";
        label.textContent = STAT_DAY_LABELS[index];

        if (dayMinutes > 0) {
            const stack = document.createElement("div");
            stack.className = "study-chart-stack";
            stack.style.height = `${(dayMinutes / scale) * 100}%`;
            // One coloured piece per session; its size is its share of the day.
            weekSessions.filter((session) => session.date === date).forEach((session) => {
                const piece = document.createElement("span");
                const course = statCourseFor(session.courseId);
                piece.className = course ? colorClass(course.color) : "";
                piece.style.flexGrow = session.minutes;
                stack.append(piece);
            });
            track.append(stack);
        }

        column.append(value, track, label);
        return column;
    });

    const chart = document.getElementById("study-chart");
    chart.replaceChildren(...columns);
    chart.setAttribute("aria-label", `Study hours by day: ${week.map((date, i) => `${STAT_DAY_LABELS[i]} ${formatHours(minutesOn(date))}`).join(", ")}`);
}

/* ---------- Time by course (ring chart + list) ---------- */

function minutesByCourse() {
    const totals = new Map(); // courseId -> minutes
    doneThisWeek().forEach((session) => {
        totals.set(session.courseId, (totals.get(session.courseId) ?? 0) + session.minutes);
    });
    return [...totals.entries()]
        .map(([courseId, minutes]) => ({ course: statCourseFor(courseId), minutes }))
        .filter((entry) => entry.course)
        .sort((first, second) => second.minutes - first.minutes);
}

function createLegendItem(course, valueText) {
    const item = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = `legend-dot ${colorClass(course.color)}`;
    item.append(dot);
    if (valueText === undefined) {
        item.append(course.name);
    } else {
        const name = document.createElement("span");
        const value = document.createElement("strong");
        name.textContent = course.name;
        value.textContent = valueText;
        item.append(name, value);
    }
    return item;
}

function renderCourseTime() {
    const entries = minutesByCourse();
    const total = entries.reduce((sum, entry) => sum + entry.minutes, 0);

    document.getElementById("course-time-total").textContent = `${formatHours(total)} total`;
    document.getElementById("course-time-center").textContent = formatHours(total);
    document.getElementById("course-time-list").replaceChildren(
        ...entries.map((entry) => createLegendItem(entry.course, formatHours(entry.minutes)))
    );
    document.getElementById("study-legend").replaceChildren(...entries.map((entry) => createLegendItem(entry.course)));

    // Ring chart: each course gets a slice of a conic-gradient, e.g.
    // conic-gradient(var(--blue) 0% 40%, var(--red) 40% 70%, ...)
    const ring = document.getElementById("course-time-chart");
    if (total === 0) {
        ring.style.background = "var(--gray-soft)";
    } else {
        let start = 0;
        const slices = entries.map((entry) => {
            const end = start + (entry.minutes / total) * 100;
            const slice = `var(--${entry.course.color}) ${start}% ${end}%`;
            start = end;
            return slice;
        });
        ring.style.background = `conic-gradient(${slices.join(", ")})`;
    }
    ring.setAttribute("aria-label", `Study time by course: ${entries.map((e) => `${e.course.name} ${formatHours(e.minutes)}`).join(", ") || "none"}`);
}

/* ---------- Study sessions list ---------- */

function createSessionButton(label, ariaLabel, onClick, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `text-button ${extraClass}`.trim();
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
}

function createSessionItem(session) {
    const item = document.createElement("li");
    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    const value = document.createElement("span");
    const actions = document.createElement("div");
    const courseName = statCourseFor(session.courseId)?.name ?? "Unknown course";

    item.className = "entry-item";
    title.textContent = courseName;
    meta.textContent = [formatLongDate(session.date), session.done ? "Done" : "Planned", session.notes]
        .filter(Boolean)
        .join(" · ");
    info.append(title, meta);

    value.className = "entry-value";
    value.textContent = `${session.minutes} min`;

    actions.className = "course-card-actions";
    actions.append(
        createSessionButton("Edit", `Edit ${courseName} session on ${formatLongDate(session.date)}`, () => startSessionEdit(session)),
        createSessionButton("Delete", `Delete ${courseName} session on ${formatLongDate(session.date)}`, () => deleteSession(session), "danger")
    );

    item.append(info, value, actions);
    return item;
}

function renderSessions() {
    const sorted = [...sessions].sort((first, second) => second.date.localeCompare(first.date)); // newest first
    sessionList.replaceChildren(...sorted.map(createSessionItem));
    document.getElementById("sessions-count").textContent = `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}`;
    if (sessions.length === 0) {
        setStatus(sessionsStatus, "empty", "No study sessions yet. Log your first one below.");
    } else {
        clearStatus(sessionsStatus);
    }
}

function renderStatistics() {
    renderKpis();
    renderDailyChart();
    renderCourseTime();
    renderSessions();
}

/* ---------- Session form: add and edit ---------- */

function fillSessionCourseOptions(selectedId = null) {
    const select = sessionForm.elements.courseId;
    const choices = statCourses.filter((course) => !course.archived || course.id === selectedId);
    if (choices.length === 0) {
        select.replaceChildren(new Option("Add a course first", ""));
        return;
    }
    select.replaceChildren(...choices.map((course) => new Option(course.name, course.id)));
    if (selectedId !== null) {
        select.value = String(selectedId);
    }
}

function resetSessionForm() {
    editingSessionId = null;
    sessionForm.reset();
    clearFormErrors(sessionForm);
    fillSessionCourseOptions();
    sessionForm.elements.date.value = todayISO();
    sessionFormTitle.textContent = "Log a study session";
    sessionCancelEdit.hidden = true;
}

function startSessionEdit(session) {
    resetSessionForm();
    editingSessionId = session.id;
    sessionFormTitle.textContent = "Edit study session";
    sessionCancelEdit.hidden = false;
    fillSessionCourseOptions(session.courseId);
    const fields = sessionForm.elements;
    fields.date.value = session.date;
    fields.minutes.value = session.minutes;
    fields.notes.value = session.notes ?? "";
    fields.done.checked = session.done;
    sessionForm.scrollIntoView({ block: "center" });
    fields.courseId.focus();
}

sessionCancelEdit.addEventListener("click", resetSessionForm);

sessionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFormErrors(sessionForm);

    const clientErrors = checkForm(sessionForm);
    if (clientErrors.length > 0) {
        showFieldErrors(sessionForm, clientErrors);
        return;
    }

    const fields = sessionForm.elements;
    const session = {
        courseId: Number(fields.courseId.value),
        date: fields.date.value,
        minutes: Number(fields.minutes.value),
        done: fields.done.checked,
        notes: fields.notes.value || null
    };

    const submitButton = sessionForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        if (editingSessionId === null) {
            sessions.push(await apiRequest("POST", "/study-sessions", session));
        } else {
            const saved = await apiRequest("PUT", `/study-sessions/${editingSessionId}`, session);
            sessions = sessions.map((item) => (item.id === saved.id ? saved : item));
        }
        resetSessionForm();
        renderStatistics(); // the charts update too
    } catch (error) {
        showSaveError(sessionForm, error);
    } finally {
        submitButton.disabled = false;
    }
});

async function deleteSession(session) {
    if (!confirm(`Delete this ${session.minutes}-minute session?`)) {
        return;
    }
    try {
        await apiRequest("DELETE", `/study-sessions/${session.id}`);
        sessions = sessions.filter((item) => item.id !== session.id);
        if (editingSessionId === session.id) {
            resetSessionForm();
        }
        renderStatistics();
    } catch (error) {
        setStatus(sessionsStatus, "error", `Couldn't delete the session. ${error.message}`);
    }
}

/* ---------- Loading ---------- */

async function loadStatistics() {
    setStatus(statisticsStatus, "loading", "Loading your statistics…");
    setStatus(sessionsStatus, "loading", "Loading study sessions…");
    try {
        const [users, courses, tasks, loadedSessions] = await Promise.all([
            apiRequest("GET", "/users"),
            apiRequest("GET", "/courses"),
            apiRequest("GET", "/tasks"),
            apiRequest("GET", "/study-sessions")
        ]);
        statUser = users[0] ?? null;
        statCourses = courses;
        statTasks = tasks;
        sessions = loadedSessions;
    } catch (error) {
        setStatus(statisticsStatus, "error", `Couldn't load your statistics. ${error.message}`);
        clearStatus(sessionsStatus);
        return;
    }
    clearStatus(statisticsStatus);
    resetSessionForm();
    renderStatistics();
}

loadStatistics();
