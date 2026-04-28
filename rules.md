# Ibn Khaldoun University — Interface Design System

## Identity

**Product:** Digital Platform for Pedagogical Activities — Ibn Khaldoun University, Tiaret, Algeria.
**Users:** Teachers grading at 7am with coffee. Students checking projects between lectures. Administrators managing attendance across departments.
**Task:** Manage academic life — grades, projects, attendance, documents, messaging — efficiently and without friction.
**Feel:** Institutional calm. Not cold like a terminal, not warm like a notebook. The quiet confidence of a well-organized university office — structured, trustworthy, unhurried. Paper and ink, not plastic and neon.

---

## Domain

| Concept | Meaning |
|---------|---------|
| Parchment | The canvas — aged paper, not sterile white |
| Ink | Text that carries authority — dark, readable, hierarchical |
| Ledger | Structured data — grades, attendance, schedules |
| Seal | Brand mark — the institutional stamp of trust |
| Archive | Documents, history, records — the depth of the institution |

## Color World

Colors from a university's physical world: sandstone corridors, ink on paper, blue institutional crests, chalk dust, green courtyards, wooden lecture halls.

## Signature

**The Institutional Seal** — the `IK` monogram in a rounded-lg brand container. Appears in sidebar header, login card, and empty states. It grounds every screen to the university identity. No other product would have this exact mark in this exact context.

## Defaults Rejected

| Default | Replacement | Rationale |
|---------|-------------|-----------|
| Generic gray sidebar | Same `canvas` bg as content, separated by `border-edge` only | Sidebar is part of the app, not a separate world |
| Emoji icons in navigation | Inline SVG icons with consistent stroke weight (1.5px) | Emojis break visual consistency and can't be color-controlled |
| Pill-style role toggle | Segmented control with `surface-200` well and brand fill | Feels more institutional, less playful |

---

## Direction

**Personality:** Precision & Institutional Calm
**Foundation:** Cool-neutral (slate tinted, not pure gray)
**Depth:** Subtle shadows — `shadow-soft` for cards, `shadow-card` for elevated overlays. Borders for inline separation.

---

## Tokens

### Spacing

Base: **4px**
Scale: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`
Every spacing value must be a multiple of 4. No exceptions.

### Colors — Primitives

```
Canvas (base):         #f8f9fb      — the paper
Surface (card):        #ffffff      — elevated paper
Surface-200:           #f4f5f7      — recessed, inset, wells
Surface-300:           #edeef1      — deeper inset

Ink (primary):         #1a1d23      — body text, headings
Ink-secondary:         #4b5160      — labels, supporting text
Ink-tertiary:          #7c8294      — metadata, timestamps
Ink-muted:             #a9aeb8      — placeholders, disabled

Edge (default):        rgba(0,0,0,0.08)  — card borders, dividers
Edge-subtle:           rgba(0,0,0,0.05)  — section dividers
Edge-strong:           rgba(0,0,0,0.14)  — focus rings, emphasis

Brand:                 #1d4ed8      — primary actions, active states
Brand-light:           #dbeafe      — active nav bg, badges
Brand-dark:            #1e3a8a      — pressed states
Brand-hover:           #1e40af      — hover states

Success:               #16a34a
Warning:               #ca8a04
Danger:                #dc2626

Control-bg:            #f1f2f5      — input backgrounds (inset)
Control-border:        #d1d5db      — input borders
Control-focus:         #93bbfd      — focus rings
```

### Typography

**Font:** Inter — clean, neutral, institutional authority.
**Scale:** 12 / 13 / 14 (base) / 16 / 18 / 20 / 24 / 32
**Weights:** 400 (body), 500 (labels, UI), 600 (subheadings), 700 (headings)
**Letter-spacing:** `-0.01em` for headings (tight), `0` for body, `0.025em` for uppercase labels

**Hierarchy rules:**
- Heading: `text-xl font-bold text-ink tracking-tight` (20px, 700, -0.01em)
- Subheading: `text-base font-semibold text-ink` (16px, 600)
- Body: `text-sm text-ink` (14px, 400)
- Label: `text-sm font-medium text-ink-secondary` (14px, 500)
- Caption: `text-xs text-ink-tertiary` (12px, 400)
- Muted: `text-xs text-ink-muted` (12px, 400)

### Border Radius

| Element | Radius | Class |
|---------|--------|-------|
| Inputs, buttons | 6px | `rounded-md` |
| Cards, panels | 8px | `rounded-lg` |
| Modals, large containers | 12px | `rounded-xl` |
| Avatars | full | `rounded-full` |
| Logo mark | 8px | `rounded-lg` |

### Shadows

```
shadow-soft:  0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)
shadow-card:  0 2px 8px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)
```

Cards use `shadow-card` + `border border-edge`.
Dropdowns use `shadow-card` + `border border-edge` at elevation level 2.
Modals use `shadow-card` at elevation level 3 + scrim overlay.

---

## Patterns

### Button Primary
- Height: 40px (`py-2.5`)
- Padding: `12px 16px` (`px-4`)
- Radius: 6px (`rounded-md`)
- Font: 14px, weight 500
- Background: `bg-brand`
- Hover: `hover:bg-brand-hover`
- Active: `active:bg-brand-dark`
- Focus: `focus:ring-2 focus:ring-brand/30 focus:ring-offset-2`
- Disabled: `opacity-50 cursor-not-allowed`
- Transition: `transition-all duration-150`

### Button Secondary
- Same dimensions as primary
- Background: `bg-surface border border-edge`
- Hover: `hover:bg-surface-200`
- Text: `text-ink-secondary`

### Button Ghost
- Same dimensions
- Background: transparent
- Hover: `hover:bg-surface-200`
- Text: `text-ink-secondary`

### Input
- Height: 40px (`py-2.5`)
- Padding: `10px 12px` (`px-3 py-2.5`)
- Background: `bg-control-bg` (inset, darker than surface)
- Border: `border border-control-border`
- Radius: 6px
- Font: 14px
- Placeholder: `text-ink-muted`
- Focus: `focus:ring-2 focus:ring-brand/30 focus:border-brand`

### Card
- Border: `border border-edge`
- Shadow: `shadow-card`
- Padding: 24px (`p-6`) for content cards, 32px (`p-8`) for auth cards
- Radius: 8px (`rounded-lg`)
- Background: `bg-surface`
- Max-width varies by context

### Sidebar Nav Item
- Padding: `8px 12px` (`px-3 py-2`)
- Radius: 6px (`rounded-md`)
- Font: 14px, weight 500
- Active: `bg-brand-light text-brand`
- Default: `text-ink-secondary`
- Hover: `hover:bg-surface-200 hover:text-ink`
- Icon: 20×20 (`w-5 h-5`), stroke 1.5px, same color as text
- Gap: 12px between icon and label

### Dropdown
- Background: `bg-surface` (level 2)
- Border: `border border-edge`
- Shadow: `shadow-card`
- Radius: 8px
- Item padding: `8px 16px` (`px-4 py-2`)
- Item font: 14px
- Item hover: `hover:bg-surface-200`

### Role Toggle (Segmented Control)
- Container: `bg-surface-200 rounded-md p-1`
- Segment: `px-3 py-1.5 rounded text-sm font-medium`
- Active segment: `bg-brand text-white shadow-sm`
- Inactive segment: `text-ink-secondary hover:text-ink`
- Transition: `transition-all duration-150`

### Error Banner
- Background: `bg-red-50`
- Border: `border border-red-200`
- Text: `text-danger text-sm`
- Icon: 16×16 danger icon, `shrink-0`
- Padding: `12px` (`px-3 py-2.5`)
- Radius: 6px

---

## Navigation — 11 Modules

| Module | Path | Icon | Student | Teacher |
|--------|------|------|---------|---------|
| Dashboard | `/dashboard` | grid-2x2 | ✓ | ✓ |
| Projects | `/projects` | folder | ✓ | ✓ |
| Grades | `/grades` | bar-chart | ✓ | ✓ |
| AI Assistant | `/ai` | sparkles | ✓ | ✓ |
| Documents | `/documents` | file-text | ✓ | ✓ |
| Calendar | `/calendar` | calendar | ✓ | ✓ |
| Attendance | `/attendance` | clipboard-check | ✗ | ✓ |
| Messages | `/messages` | message-square | ✓ | ✓ |
| Notifications | `/notifications` | bell | ✓ | ✓ |
| Settings | `/settings` | settings | ✓ | ✓ |
| Support | `/support` | life-buoy | ✓ | ✓ |

Modules marked ✗ for a role are hidden from that role's sidebar.

---

## Layout Shell

- Sidebar: `w-64` (256px), fixed left, same `bg-canvas` as content
- Topbar: `h-16` (64px), fixed top, same `bg-canvas`, `border-b border-edge`
- Content: fills remaining space, `overflow-y-auto`, padding `p-6` (desktop) / `p-4` (mobile)
- Sidebar + Topbar headers align at 64px height

### Mobile Behavior
- Sidebar: hidden off-screen (`-translate-x-full`), slides in on hamburger tap
- Scrim: `bg-black/30` overlay behind sidebar
- Hamburger: visible only below `lg` breakpoint

---

## Interaction States

Every interactive element must have:
- **Default** — resting state
- **Hover** — subtle bg shift or color change, 100ms transition
- **Active/Pressed** — slightly darker than hover
- **Focus** — `ring-2 ring-brand/30 ring-offset-2`, visible for keyboard nav
- **Disabled** — `opacity-50 cursor-not-allowed`

Data states:
- **Loading** — spinner + "Loading…" text, disabled controls
- **Empty** — illustration/icon + message + action
- **Error** — error banner with icon + message

---

## Animation

- Micro (hover, focus): `duration-150 ease-out`
- Transition (dropdown, sidebar): `duration-200 ease-out`
- No spring/bounce — institutional, not playful

---

## Avoid

- Emoji as icons — uncontrollable color, inconsistent rendering
- `bg-gray-50` or generic Tailwind grays — use token names (`canvas`, `surface-200`)
- Random hex values — everything maps to a primitive
- Thick borders — `border-edge` is rgba, not solid gray
- Dramatic shadows — `shadow-card` is the maximum
- Mixed depth — shadows + heavy borders on same element
- Different sidebar background — same as canvas
- Size-only typography hierarchy — always combine size + weight + tracking
- Decorative color — color must mean something (brand, semantic, or emphasis)
- Padding asymmetry — keep TLBR balanced unless content demands it

---

## Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| Inter font | Neutral, institutional, excellent readability at small sizes | 2026-02-19 |
| Cool-neutral foundation | University = structured, trustworthy, not warm/playful | 2026-02-19 |
| Subtle shadows + borders | Cards need gentle lift but not premium/luxury feel | 2026-02-19 |
| 4px spacing base | Dense enough for data tables, clean for forms | 2026-02-19 |
| Same canvas bg for sidebar | Sidebar is part of the app, not a separate world | 2026-02-19 |
| SVG icons over emoji | Color control, consistency, accessibility | 2026-02-19 |
| Role-filtered sidebar | Students don't need Attendance module | 2026-02-19 |
| Segmented control for role toggle | More institutional than pills, clearer active state | 2026-02-19 |
