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
    popup?.classList.add("open");
    popup?.querySelector("input:not([type='hidden']), select")?.focus();
}

function closePopup() {
    popup?.classList.remove("open");
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup?.classList.contains("open")) {
        closePopup();
        document.querySelector(".add-task-btn")?.focus();
    }
});

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
    // Dismissals are remembered per browser until the backend stores them per user.
    const notificationStorageKey = "study-flow-dismissed-notifications";
    const readDismissals = () => {
        try {
            const parsed = JSON.parse(localStorage.getItem(notificationStorageKey) ?? "[]");
            return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
        } catch {
            // Corrupt or blocked storage shouldn't break the rest of the page.
            return [];
        }
    };

    const dismissedNotifications = new Set(readDismissals());
    // BACKEND: replace this sample list with the user's notifications from the API.
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
                try {
                    localStorage.setItem(
                        notificationStorageKey,
                        JSON.stringify([...dismissedNotifications])
                    );
                } catch {
                    // Storage unavailable: the dismissal still applies for this page view.
                }
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

// Task sorting lives in tasks.js and the course dialogs in courses.js,
// because both now work on data loaded from the API.
