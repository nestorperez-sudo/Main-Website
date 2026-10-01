# Study Flow: visual conventions

Observed from `style.css` / `login.css`. Treat the scanner output as the source of truth for numbers; this file captures intent. Update it when the design intentionally changes.

## Identity
A calm, editorial study planner: deep navy, warm cream, a restrained gold accent. Flat and rectilinear on the dashboard (square corners, hairline borders, soft diffuse shadows). The login page is the one place with large rounded corners (25px), as a framed card.

## Palette roles (declared in `:root`)
| Token | Role |
|---|---|
| `--navy` `#112b46` | Dark surfaces (sidebar, primary buttons, feature card), outline-button borders |
| `--cream` `#f7f5ef` | Page background; text on navy; input backgrounds |
| `--white` | Cards, popups, search bar |
| `--gold` `#c7a35a` | Accent only: active-nav left border, focus ring, icon tint, popup top border, logo badge. Never a big fill |
| `--text` `#172b3d` | Body text |
| `--gray` `#71808c` | Secondary/helper text |
| `--line` `#e5e8e7` | Hairlines, card header dividers, text on navy |
| `--red` / `--blue` / `--green` | Status/category colors, used sparingly (alert dot, task types) |

Hover/active tint on navy: `rgba(162, 162, 162, 0.1)`. Shadows are navy-tinted: `rgba(17, 43, 70, .04-.25)`.

## Type
Poppins. Base `12px/1.5` on body. Small meta text 10px / .6rem; titles `1.2rem` weight 600; page headline ~2.8rem; logo 1rem/600.

## Components
- **Card**: white, 15px padding, flex column, two-layer navy-tinted shadow, header with bottom hairline.
- **Button**: navy fill, cream text, no border, `8px 17px`, lifts 1px with shadow on hover. Secondary = transparent with 1px navy border (`.reset-btn`).
- **Inputs**: cream fill, 1px `--line` border, 10px padding, Poppins.
- **Popup**: white, 3px gold top border, 30px padding, deep navy shadow, centered.
- **Sidebar**: 250px navy, collapses to 76px; becomes a fixed bottom bar at 756px and below.

## Layout and responsiveness
Dashboard is CSS grid: `.page` = `auto 1fr`; card rows use `1fr 1fr 1fr` / `1.7fr 1fr` with 10px gaps; `main` padding 25px. Breakpoints in use: 856px, 756px, 462px (reuse these). Prefer `clamp()`, `fr` and `%` over fixed widths.

## Known inconsistencies (mention, don't silently "fix")
- `--green` is `#84b9a0` in `style.css` but `#6a927f` in `login.css`.
