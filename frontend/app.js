const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("arrow-collapse");
const popup = document.getElementById("popup");

function toggleSidebar(button) {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", String(!isCollapsed));
    button.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
}

/* fix to responsivenns with sidebar*/

function expandSidebarOnSmallScreens() {
    if (window.innerWidth < 756 && sidebar.classList.contains("collapsed")) {
        sidebar.classList.remove("collapsed");
        sidebarToggle.setAttribute("aria-expanded", "true");
        sidebarToggle.setAttribute("aria-label", "Collapse sidebar");
    }
}

expandSidebarOnSmallScreens();
window.addEventListener("resize", expandSidebarOnSmallScreens);

/* Toggle pop up */
function openPopup() {
    popup.classList.add("open")
}

function closePopup() {
    popup.classList.remove("open")
}

const scheduleViewButtons = document.querySelectorAll("[data-schedule-view]");
const scheduleViews = document.querySelectorAll(".agenda-view");

scheduleViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const selectedView = button.dataset.scheduleView;

        scheduleViewButtons.forEach((viewButton) => {
            viewButton.setAttribute("aria-pressed", String(viewButton === button));
        });

        scheduleViews.forEach((view) => {
            view.hidden = view.id !== `${selectedView}-agenda`;
        });
    });
});

const notificationToggle = document.getElementById("notification-toggle");
const notificationControl = notificationToggle?.parentElement;

if (notificationToggle && notificationControl) {
    const notificationStorageKey = "study-flow-dismissed-notifications";
    const storedDismissals = localStorage.getItem(notificationStorageKey);
    const parsedDismissals = storedDismissals === null ? [] : JSON.parse(storedDismissals);

    if (!Array.isArray(parsedDismissals) || parsedDismissals.some((id) => typeof id !== "string")) {
        throw new Error("Saved notification dismissals are invalid.");
    }

    const dismissedNotifications = new Set(parsedDismissals);
    const notifications = [
        {
            id: "physics-lab-report",
            title: "Physics II lab report",
            message: "Assignment due today."
        },
        {
            id: "microeconomics-quiz",
            title: "Microeconomics quiz",
            message: "Quiz due Friday, 23 October."
        },
        {
            id: "calculus-problem-set",
            title: "Calculus II problem set",
            message: "Problem set due Monday, 26 October."
        }
    ];
    const notificationPanel = document.createElement("section");
    const notificationHeading = document.createElement("h2");
    const notificationList = document.createElement("ul");
    const notificationBadge = notificationToggle.querySelector(".red-circle-alert");

    notificationPanel.className = "notification-popover";
    notificationPanel.id = "notifications-panel";
    notificationPanel.setAttribute("aria-label", "Notifications");
    notificationPanel.hidden = true;
    notificationHeading.textContent = "Notifications";
    notificationList.className = "notification-list";
    notificationPanel.append(notificationHeading, notificationList);
    notificationControl.append(notificationPanel);

    const renderNotifications = () => {
        const unreadNotifications = notifications.filter(
            (notification) => !dismissedNotifications.has(notification.id)
        );
        notificationList.replaceChildren();

        unreadNotifications.forEach((notification) => {
            const item = document.createElement("li");
            const content = document.createElement("div");
            const title = document.createElement("strong");
            const message = document.createElement("p");
            const dismissButton = document.createElement("button");

            item.className = "notification-item";
            title.textContent = notification.title;
            message.textContent = notification.message;
            dismissButton.className = "notification-dismiss";
            dismissButton.type = "button";
            dismissButton.textContent = "×";
            dismissButton.setAttribute("aria-label", `Dismiss ${notification.title} notification`);
            dismissButton.addEventListener("click", () => {
                dismissedNotifications.add(notification.id);
                localStorage.setItem(
                    notificationStorageKey,
                    JSON.stringify([...dismissedNotifications])
                );
                renderNotifications();
                if (unreadNotifications.length === 1) {
                    notificationToggle.focus();
                } else {
                    notificationList.querySelector(".notification-dismiss")?.focus();
                }
            });

            content.append(title, message);
            item.append(content, dismissButton);
            notificationList.append(item);
        });

        if (unreadNotifications.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "notification-empty";
            emptyMessage.textContent = "You’re all caught up.";
            notificationList.append(emptyMessage);
        }

        notificationBadge.hidden = unreadNotifications.length === 0;
        notificationBadge.textContent = String(unreadNotifications.length);
        notificationToggle.setAttribute(
            "aria-label",
            `Notifications, ${unreadNotifications.length} unread`
        );
    };

    const setNotificationsOpen = (isOpen) => {
        notificationPanel.hidden = !isOpen;
        notificationToggle.setAttribute("aria-expanded", String(isOpen));
    };

    renderNotifications();
    notificationControl.addEventListener("mouseenter", () => setNotificationsOpen(true));
    notificationControl.addEventListener("mouseleave", () => {
        if (!notificationControl.matches(":focus-within")) {
            setNotificationsOpen(false);
        }
    });
    notificationControl.addEventListener("focusin", () => setNotificationsOpen(true));
    notificationControl.addEventListener("focusout", (event) => {
        if (!notificationControl.contains(event.relatedTarget) && !notificationControl.matches(":hover")) {
            setNotificationsOpen(false);
        }
    });
    notificationToggle.addEventListener("click", () => setNotificationsOpen(true));
    document.addEventListener("click", (event) => {
        if (!notificationControl.contains(event.target)) {
            setNotificationsOpen(false);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !notificationPanel.hidden) {
            setNotificationsOpen(false);
            notificationToggle.focus();
        }
    });
}

const taskSortSelect = document.getElementById("task-sort");
const upcomingTaskList = document.querySelector(".tasks-list-card:not(.completed-tasks) .task-list");

if (taskSortSelect && upcomingTaskList) {
    taskSortSelect.addEventListener("change", () => {
        const taskRows = Array.from(upcomingTaskList.children).filter((row) =>
            row.matches(".task-row")
        );
        const sortBy = taskSortSelect.value;

        taskRows.sort((firstTask, secondTask) => {
            if (sortBy === "subject-asc") {
                const firstSubject = firstTask.querySelector(".task-details p").textContent.split("·")[0].trim();
                const secondSubject = secondTask.querySelector(".task-details p").textContent.split("·")[0].trim();
                return firstSubject.localeCompare(secondSubject, undefined, { sensitivity: "base" });
            }

            const firstDueDate = Date.parse(firstTask.querySelector(".task-due").dateTime);
            const secondDueDate = Date.parse(secondTask.querySelector(".task-due").dateTime);
            return sortBy === "due-desc"
                ? secondDueDate - firstDueDate
                : firstDueDate - secondDueDate;
        });

        taskRows.forEach((row) => upcomingTaskList.append(row));
    });
}

const courseDetailDialog = document.getElementById("course-detail-dialog");

if (courseDetailDialog) {
    const courseDetailCode = document.getElementById("course-detail-code");
    const courseDetailTitle = document.getElementById("course-detail-title");
    const courseDetailInstructor = document.getElementById("course-detail-instructor");
    const courseDetailMeeting = document.getElementById("course-detail-meeting");
    const courseDetailSummary = document.getElementById("course-detail-summary");
    const courseDetailAssignments = document.getElementById("course-detail-assignments");
    const courseDetailClose = courseDetailDialog.querySelector(".course-detail-close");
    let activeCourseCard = null;

    const openCourseDetails = (courseCard) => {
        activeCourseCard = courseCard;
        courseDetailCode.textContent = courseCard.querySelector(".course-code").textContent;
        courseDetailTitle.textContent = courseCard.querySelector("h2").textContent;
        courseDetailInstructor.textContent = courseCard.querySelector(".course-instructor").textContent;
        courseDetailMeeting.textContent = courseCard.querySelector(".course-meeting").textContent.trim();
        courseDetailSummary.replaceChildren(courseCard.querySelector(".course-details").cloneNode(true));
        courseDetailAssignments.replaceChildren(
            ...Array.from(courseCard.querySelectorAll(".course-assignment-source li")).map((assignment) =>
                assignment.cloneNode(true)
            )
        );
        courseDetailDialog.showModal();
    };

    document.querySelectorAll(".course-card[role='button']").forEach((courseCard) => {
        courseCard.addEventListener("click", () => openCourseDetails(courseCard));
        courseCard.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCourseDetails(courseCard);
            }
        });
    });

    courseDetailClose.addEventListener("click", () => courseDetailDialog.close());
    courseDetailDialog.addEventListener("click", (event) => {
        if (event.target === courseDetailDialog) {
            courseDetailDialog.close();
        }
    });
    courseDetailDialog.addEventListener("close", () => activeCourseCard?.focus());
}