/*
 * Schedule page.
 *   GET    /api/events        calendar dots, weekly and daily agenda
 *   GET    /api/courses       course select in the form, event colours
 *   POST / PUT / DELETE /api/events   add, edit, delete an event
 * The Weekly / Daily switch itself is handled by main.js.
 */

const scheduleStatus = document.getElementById("schedule-status");
const monthTitle = document.getElementById("month-title");
const monthDays = document.getElementById("month-days");
const weeklyAgenda = document.getElementById("weekly-agenda");
const agendaDate = document.getElementById("agenda-date");
const dailyHeading = document.getElementById("daily-agenda-heading");
const dailyList = document.getElementById("daily-agenda-list");
const eventDialog = document.getElementById("event-form-dialog");
const eventForm = document.getElementById("event-form");
const eventFormTitle = document.getElementById("event-form-title");
const eventCourseSelect = document.getElementById("event-course");

let events = [];
let scheduleCourses = [];
let selectedDate = todayISO();  // day shown in the Daily view
let editingEventId = null;
let eventOpener = null;         // element to focus again when the form closes

const scheduleCourseFor = (id) => scheduleCourses.find((course) => course.id === id);

function eventsOn(date) {
    return events
        .filter((event) => event.date === date)
        .sort((first, second) => first.startTime.localeCompare(second.startTime));
}

/* ---------- Month calendar (current month) ---------- */

function renderMonth() {
    const today = todayISO();
    const firstDay = parseLocalDate(`${today.slice(0, 8)}01`);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // day 0 of next month = last day of this one
    const emptyCells = (firstDay.getDay() + 6) % 7;             // weeks start on Monday

    monthTitle.textContent = firstDay.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

    const cells = [];
    for (let i = 0; i < emptyCells; i++) {
        const empty = document.createElement("li");
        empty.className = "outside-month";
        cells.push(empty);
    }

    for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
        const date = toISODate(new Date(year, month, dayNumber));
        const cell = document.createElement("li");
        const button = document.createElement("button");

        if (eventsOn(date).length > 0) {
            cell.classList.add("has-event");
        }
        if (date === selectedDate) {
            cell.classList.add("selected-day");
        }
        button.type = "button";
        button.className = "month-day-button";
        button.textContent = String(dayNumber);
        button.setAttribute("aria-label", `${formatLongDate(date)}, ${eventsOn(date).length} events`);
        if (date === today) {
            button.setAttribute("aria-current", "date");
        }
        button.addEventListener("click", () => {
            selectedDate = date;
            renderMonth();
            renderDaily();
            document.querySelector("[data-schedule-view='daily']").click(); // switch to the Daily view
        });

        cell.append(button);
        cells.push(cell);
    }
    monthDays.replaceChildren(...cells);
}

/* ---------- Agenda items ---------- */

function createEventButton(label, ariaLabel, onClick, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `text-button ${extraClass}`.trim();
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
}

function createAgendaItem(event) {
    const item = document.createElement("li");
    const time = document.createElement("time");
    const details = document.createElement("div");
    const title = document.createElement("h4");
    const meta = document.createElement("p");
    const actions = document.createElement("div");

    item.className = "agenda-item with-actions";
    const course = scheduleCourseFor(event.courseId);
    if (course) {
        item.classList.add("has-color", colorClass(course.color));
    }

    time.dateTime = event.startTime;
    time.textContent = event.startTime;
    title.textContent = event.title;
    const parts = [capitalize(event.type)];
    if (event.endTime) {
        parts.push(`until ${event.endTime}`);
    }
    if (event.location) {
        parts.push(event.location);
    }
    meta.textContent = parts.join(" · ");
    details.append(title, meta);

    actions.className = "course-card-actions";
    actions.append(
        createEventButton("Edit", `Edit ${event.title}`, (clickEvent) => openEventForm(event, clickEvent.currentTarget)),
        createEventButton("Delete", `Delete ${event.title}`, () => deleteEvent(event), "danger")
    );

    item.append(time, details, actions);
    return item;
}

/* ---------- Weekly view: the next 7 days ---------- */

function renderWeekly() {
    const start = todayISO();
    const days = [0, 1, 2, 3, 4, 5, 6].map((offset) => addDays(start, offset));
    agendaDate.textContent = `${formatShortDate(days[0])} – ${formatShortDate(days[6])}`;

    const dayBlocks = days.map((date) => {
        const block = document.createElement("div");
        const heading = document.createElement("h3");
        const weekday = document.createElement("span");
        const shortDate = document.createElement("time");
        const dayEvents = eventsOn(date);

        block.className = dayEvents.length ? "weekly-day" : "weekly-day weekly-day-empty";
        heading.className = "weekly-day-heading";
        weekday.textContent = parseLocalDate(date).toLocaleDateString("en-GB", { weekday: "long" });
        shortDate.dateTime = date;
        shortDate.textContent = parseLocalDate(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        heading.append(weekday, shortDate);
        block.append(heading);

        if (dayEvents.length) {
            const list = document.createElement("ol");
            list.className = "agenda-list";
            list.append(...dayEvents.map(createAgendaItem));
            block.append(list);
        } else {
            const empty = document.createElement("p");
            empty.textContent = "No events planned.";
            block.append(empty);
        }
        return block;
    });
    weeklyAgenda.replaceChildren(...dayBlocks);
}

/* ---------- Daily view: the selected day ---------- */

function renderDaily() {
    dailyHeading.textContent = parseLocalDate(selectedDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    const dayEvents = eventsOn(selectedDate);
    if (dayEvents.length) {
        dailyList.replaceChildren(...dayEvents.map(createAgendaItem));
    } else {
        const empty = document.createElement("li");
        empty.className = "agenda-empty";
        empty.textContent = "No events planned.";
        dailyList.replaceChildren(empty);
    }
}

function renderSchedule() {
    renderMonth();
    renderWeekly();
    renderDaily();
}

/* ---------- Loading ---------- */

function fillEventCourseOptions(selectedId = null) {
    const choices = scheduleCourses.filter((course) => !course.archived || course.id === selectedId);
    eventCourseSelect.replaceChildren(
        new Option("No course", ""),
        ...choices.map((course) => new Option(course.name, course.id))
    );
    eventCourseSelect.value = selectedId === null ? "" : String(selectedId);
}

async function loadSchedule() {
    setStatus(scheduleStatus, "loading", "Loading your schedule…");
    try {
        [events, scheduleCourses] = await Promise.all([apiRequest("GET", "/events"), apiRequest("GET", "/courses")]);
    } catch (error) {
        setStatus(scheduleStatus, "error", `Couldn't load your schedule. ${error.message}`);
        return;
    }
    if (events.length === 0) {
        setStatus(scheduleStatus, "empty", "No events yet. Add your first one with Add event.");
    } else {
        clearStatus(scheduleStatus);
    }
    renderSchedule();
}

/* ---------- Add / edit an event ---------- */

function openEventForm(event, opener) {
    editingEventId = event ? event.id : null;
    eventOpener = opener;
    eventForm.reset();
    clearFormErrors(eventForm);
    eventFormTitle.textContent = event ? `Edit ${event.title}` : "Add an event";
    fillEventCourseOptions(event ? event.courseId : null);

    const fields = eventForm.elements;
    if (event) {
        fields.title.value = event.title;
        fields.type.value = event.type;
        fields.date.value = event.date;
        fields.startTime.value = event.startTime;
        fields.endTime.value = event.endTime ?? "";
        fields.location.value = event.location ?? "";
    } else {
        fields.date.value = selectedDate;
    }
    eventDialog.showModal();
}

document.getElementById("add-event-button").addEventListener("click", (clickEvent) => openEventForm(null, clickEvent.currentTarget));

eventDialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => eventDialog.close());
});
eventDialog.addEventListener("click", (clickEvent) => {
    if (clickEvent.target === eventDialog) {
        eventDialog.close(); // click on the dark backdrop
    }
});
eventDialog.addEventListener("close", () => eventOpener?.focus());

eventForm.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    clearFormErrors(eventForm);

    const clientErrors = checkForm(eventForm);
    if (clientErrors.length > 0) {
        showFieldErrors(eventForm, clientErrors);
        return;
    }

    const fields = eventForm.elements;
    const event = {
        title: fields.title.value,
        type: fields.type.value,
        date: fields.date.value,
        startTime: fields.startTime.value,
        endTime: fields.endTime.value || null,
        location: fields.location.value || null,
        courseId: fields.courseId.value ? Number(fields.courseId.value) : null
    };

    const submitButton = eventForm.querySelector("[type='submit']");
    submitButton.disabled = true;
    try {
        if (editingEventId === null) {
            const created = await apiRequest("POST", "/events", event);
            events.push(created);
        } else {
            const saved = await apiRequest("PUT", `/events/${editingEventId}`, event);
            events = events.map((item) => (item.id === saved.id ? saved : item));
        }
        eventDialog.close();
        clearStatus(scheduleStatus);
        renderSchedule();
    } catch (error) {
        showSaveError(eventForm, error);
    } finally {
        submitButton.disabled = false;
    }
});

/* ---------- Delete ---------- */

async function deleteEvent(event) {
    if (!confirm(`Delete "${event.title}"?`)) {
        return;
    }
    try {
        await apiRequest("DELETE", `/events/${event.id}`);
        events = events.filter((item) => item.id !== event.id);
        renderSchedule();
    } catch (error) {
        setStatus(scheduleStatus, "error", `Couldn't delete "${event.title}". ${error.message}`);
    }
}

loadSchedule();
