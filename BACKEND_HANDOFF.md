# Study Flow — Backend Handoff

Read this document at the start of the next Claude session before making backend changes.

## Product overview

Study Flow is a student study-planning website. Its purpose is to help a student organize courses, assignments, classes, study sessions, and exams in one place, then review study habits and progress. The interface aims to feel clear and approachable, with a concise dashboard and simple task and schedule views.

The current project is a static frontend prototype. It demonstrates the intended pages and layout, but it does not yet store user data or communicate with a server.

## Current frontend

Frontend files are in `frontened/`:

- `index.html` — Dashboard, with a day overview, priorities, course summaries, study progress, and an Add task popup.
- `tasks.html` — Upcoming and completed tasks, with task completion checkboxes, completed-task remove controls, and an Add task popup.
- `schedule.html` — Monthly calendar with a weekly/daily agenda view switch.
- `courses.html` — Course list, course details, and add/archive course areas.
- `statistics.html` — Study time, time by course, grade trends, insights, and activity visualizations.
- `settings.html` — Profile, study goals, notification preferences, account actions, and delete-account area.
- `login.html` — Login screen mockup.
- `app.js` — Shared sidebar and popup interactions, plus the Schedule weekly/daily view switch.
- `style.css` — Shared and page-specific styles.
- `login.css` — Login-specific styles.

The repository root contains `package.json`; it currently has no backend dependencies or useful test command. The existing README contains no project documentation beyond a caution heading.

## Current behavior and limitations

- Page content and metrics are hard-coded sample data, including the sample courses and October 2026 schedule. There is no API, database, server-side rendering, or browser persistence.
- The login screen is not authentication: its Sign In button simply navigates to the dashboard.
- The task checkboxes can be toggled in the browser, but the state is not saved. The completed-task remove controls, task/course forms, settings save/export/delete controls, and most other actions are presentation-only.
- The Schedule Daily/Weekly switch and shared sidebar/popup controls are frontend-only interactions.
- Treat existing page content as a product/UI reference, not as authoritative or real user data.

## Backend work to begin

First inspect the current repository and discuss the backend requirements with the user before selecting a framework, database, hosting approach, or authentication provider. No backend stack or deployment target has been chosen.

Use the existing screens to identify the data and operations the backend may need to support:

- User accounts, profile, preferences, and settings.
- Courses, including their schedule and archive state.
- Tasks/assignments, including due dates, optional times/reminders, priority, course association, and completion state.
- Scheduled classes, study sessions, and assessments/events.
- Study-time records, grades, and the source data needed to calculate statistics and insights.
- Notification preferences and any notification behavior the user wants.

Before implementing, clarify the expected first backend milestone and decisions that affect the design, especially account/auth requirements, data privacy and ownership, persistence/database choice, deployment target, and whether the initial goal is to connect the current UI or build/test the API first. Keep the current frontend structure and visual behavior intact unless the user asks to change it.

## Suggested first-session approach

1. Inspect the repository and confirm the frontend is still the static prototype described above.
2. Ask the user what backend stack or hosting constraints they have, and which end-to-end use case should be implemented first.
3. Agree on the initial API/data model and authentication scope before adding dependencies or infrastructure.
4. Implement a small, testable vertical slice (for example, persisted courses or tasks), then connect only the relevant UI.
5. Add focused tests and document how to run the backend locally.
