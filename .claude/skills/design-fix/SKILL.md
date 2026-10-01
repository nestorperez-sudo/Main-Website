---
name: design-fix
description: Edits the site's HTML/CSS directly to fix design, proportion, sizing, spacing, alignment and color problems in a specific part of the page (a section, card, popup, sidebar, form, a selected block of code, or a described area), making it match the rest of the website's visual language. Use this whenever the user says something looks off, ugly, too big/small, misaligned, cramped, inconsistent, the wrong color, not responsive, or "doesn't match the rest of the site", or asks to restyle/adapt/polish/harmonize a component, even if they don't say "design".
---

# design-fix

Fix visual problems in one part of the site so it looks like it belongs. The site is small, plain HTML + CSS (no framework, no build step), so the work is: learn the existing visual vocabulary, then edit the target to speak it. Edit files directly; don't just propose changes.

The failure mode to avoid is "fixing" a component in isolation: inventing new hex codes, new spacing numbers, a new radius. That makes it look fine on its own and foreign on the page. Reuse what the site already defines.

## 1. Learn the site's style (always, before editing)

Run the scanner from the project root:

```
python .claude/skills/design-fix/scripts/style_scan.py
```

It prints, per CSS file: the `:root` tokens, every hardcoded color (flagging ones that duplicate or nearly match a token), and frequency-ranked font sizes, spacing values (padding/margin/gap), radii, borders, shadows, transitions and breakpoints. Frequency is the signal: the most-used value *is* the site's scale. It also flags typos, duplicate declarations, and tokens whose values differ between files.

Then read `references/site-style.md` for the conventions the scanner can't see (what each color is *for*, how cards/buttons/inputs/popups are built), and skim the target's neighbors in the CSS and HTML: how do sibling cards, buttons and headings look?

If Python isn't available, read the CSS files directly and gather the same things by hand.

## 2. Pin down the target

Resolve what the user means into concrete selectors plus HTML, in this order of preference: an IDE selection or file:line range; a class/id name; a description ("the add-task popup") which you map to markup by grepping. Read the target's HTML and *all* CSS rules that touch it, including media queries and overrides lower in the file, any inline `style=`, and JS that toggles classes (`app.js`). Many bugs here come from a later rule overriding an earlier one, a duplicated property, or a typo, and you only see that by reading everything that applies.

If the user gave a screenshot or only a vague complaint, look at the rendered result when possible (the `run` skill can open the page) rather than guessing from code.

## 3. Diagnose against the site, not against taste

Compare the target to its closest siblings and list concrete deviations. Check each dimension:

- **Color**: hardcoded hex/rgba that should be a `var(--token)`; a token used for the wrong role (e.g. `--gold` is an accent for borders, icons and highlights, not a large fill). Check text/background contrast (WCAG AA, 4.5:1 for body text).
- **Type**: font-size/weight outside the site's scale; font-family not inherited (form controls don't inherit it by default).
- **Spacing**: padding/gap/margin off the site's rhythm, or inconsistent between sibling elements.
- **Proportion and sizing**: fixed px widths/heights where siblings use `fr`, `%`, `clamp()` or `fit-content`; icon/box sizes that differ from sibling equivalents; an element too dominant or too weak next to its neighbors.
- **Shape and depth**: border-radius, borders and shadows that differ from sibling cards. Match the neighbors, including *not* rounding if the dashboard doesn't.
- **Layout and alignment**: flex/grid misuse, edges that don't line up with siblings, overflow, stacking.
- **Responsiveness**: behavior at the site's existing breakpoints (the scanner lists them). Reuse those; add a new one only if the component truly breaks between them.
- **States**: hover, focus, active, disabled exist where siblings have them, with the same treatment.
- **Latent bugs** in the same rules (misspelled properties, overridden or duplicate declarations). Fix them if they affect the look; mention them otherwise.

## 4. Edit

- Prefer changing the existing rule over stacking overrides. Put new rules next to the component's related ones, under its existing section comment (`/* POP UP */`, etc.).
- Use existing tokens and the most common existing values. If a genuinely new value is needed (a color shade, a spacing step), say so and add it as a token in `:root` of every stylesheet that shares the palette, rather than scattering literals.
- Keep scope tight: change only the target and what must change with it. Don't restyle neighbors, rename classes, or restructure HTML unless the problem can't be solved otherwise. If the real cause is a shared rule (`button`, `.card`), tell the user a fix there affects other places, and prefer a scoped selector unless they want a global change.
- Match the file's formatting: 4-space indent, one declaration per line, existing comment style, rem vs px as used nearby.
- Leave git alone; the user commits.

## 5. Verify and report

Re-read the edited rules to confirm nothing is overridden or misspelled. If you can render the page, check the widest layout and each existing breakpoint. Then report briefly:

- what was wrong (2-5 concrete bullets, e.g. "popup used `#fff` and `border-radius: 25px`; cards use `var(--white)` and square corners"),
- what you changed (file and selectors),
- anything you noticed but left alone, and any new token you introduced.

## Cross-file note

`style.css` and `login.css` both redeclare the `:root` palette. When the scanner shows a token with different values across files, use the value of the file you're editing and flag the mismatch to the user as something to reconcile; don't silently pick one.
