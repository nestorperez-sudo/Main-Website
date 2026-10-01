const sidebar = document.getElementById("sidebar");

function toggleSidebar(button) {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    button.setAttribute("aria-expanded", String(!isCollapsed));
    button.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
}