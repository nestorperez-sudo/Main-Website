# Week Builder

A single-file website that asks how you want to spend your time and builds a
realistic weekly schedule out of the answers.

Everything lives in `index.html` — markup, styles and script. Open that file in
a browser (or VS Code's integrated browser / Live Preview). There is no build
step, no dependencies and no network: answers are kept in `localStorage`.

## What it asks

1. **Your day** — wake / bed time, minimum gap between activities, and how much
   unplanned time you want left over each day.
2. **College & fixed blocks** — lectures, labs, a job, anything at a set time.
   These never move.
3. **Eating** — meals are pinned, so everything else works around them.
4. **Sport** — sessions per week and how long each one is.
5. **Hobbies** — hours per week you want to protect.
6. **New objectives** — a weekly time budget, a session length, and a priority.

## How the schedule is built

Fixed commitments and meals are placed first. Everything flexible is then split
into sessions and placed one at a time, first session of every activity before
any second session, so high-priority goals do not eat the whole week.

Each candidate slot is scored on:

- how well it lands in the preferred part of the day,
- keeping repeat sessions of one activity on different days,
- keeping the load even across the week,
- sitting flush against an existing block instead of splitting a free gap,
- leaving the requested unplanned time,
- not ending the day on a hard effort, and not training straight after a meal.

Anything that does not fit is reported instead of silently dropped, with what to
change to make it fit.

## After it builds

- Click any movable block to nudge it (buttons or arrow keys); clashes are refused.
- **Try another layout** re-runs the scheduler with a different tie-break seed.
- **Export to calendar (.ics)** produces weekly repeating events for any calendar app.
- **Print** gives a day-by-day agenda; the same view is what small screens get.
