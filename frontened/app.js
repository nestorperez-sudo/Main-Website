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