# POPPIN — Monochromatic Design System & Craft Specification

<!-- redesign:design-system v1.0.0 -->
<!-- skills-applied: hallmark, impeccable, taste-skill, ui-ux-pro-max -->

## 1. Design Philosophy & Skill Integration

This design system establishes a **sophisticated monochromatic visual language** for POPPIN. It integrates the core methodologies of our four installed design skills:

1. **Hallmark (High-End Visual Design):** Focuses on fluid spatial rhythm, haptic depth, intentional whitespace, and cinematic micro-interactions without aesthetic fluff.
2. **Impeccable (Craft Floor):** Enforces strict accessibility standards (contrast ≥ 4.5:1), rejects nested cards and unnecessary kickers, mandates custom browser chrome (carets, scrollbars, text selection), and defines precise state handling.
3. **Taste-Skill (Anti-Slop):** Mandates equal left and right content edges, quiet chrome with richness reserved for real content and media, single-purpose screen views on landing, and zero fake decorative blobs.
4. **UI-UX-Pro-Max:** Provides systematic tokenization, accessible touch targets (min 44×44px), standard Lucide iconography rules, and responsive navigation hierarchy.

### The Monochromatic Rule
Color belongs exclusively to **user-generated content** (photographs, design portfolio renders, videos, code syntax highlights). The platform chrome is disciplined, calm, and strictly black, warm off-white, crisp white, charcoal, and subtle neutral grey.

---

## 2. Color Palette & Semantic Tokens

```
+---------------------------------------------------------------------------------------+
|  Warm Off-White Background (#FCFBF9)                                                  |
|  +---------------------------------------------------------------------------------+  |
|  |  Crisp White Surface (#FFFFFF)                                                  |  |
|  |  Border: Subtle Neutral Grey (#E4E4E7)                                          |  |
|  |                                                                                 |  |
|  |  Headings: Primary Near-Black (#09090B)                                         |  |
|  |  Body Text: Charcoal (#18181B / #27272A)                                        |  |
|  |  Muted Labels: Neutral Grey (#71717A)                                            |  |
|  |                                                                                 |  |
|  |  [ Action Button: #09090B with #FFFFFF text ]                                   |  |
|  +---------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------+
```

### Core Palette Values

| Token Name | Hex Value | CSS Variable / Tailwind | Usage Context |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#FCFBF9` | `--bg-canvas` / `bg-[#FCFBF9]` | App & landing page backdrop. Warm, natural paper tone. |
| **Surface Card** | `#FFFFFF` | `--bg-surface` / `bg-white` | Cards, sidebars, topbar, modal containers, inputs. |
| **Surface Raised** | `#F7F7F6` | `--bg-raised` / `bg-[#F7F7F6]` | Active item highlights, dropdown hovers, table headers. |
| **Border Subtle** | `#E4E4E7` | `--border-subtle` / `border-zinc-200` | Card borders, dividers, subtle separators. |
| **Border Strong** | `#D4D4D8` | `--border-strong` / `border-zinc-300` | Input borders, active card borders, hover dividers. |
| **Text Primary** | `#09090B` | `--text-primary` / `text-zinc-950` | Primary headings, brand wordmark, key numbers. |
| **Text Body** | `#18181B` | `--text-body` / `text-zinc-900` | Paragraph text, post body, comment text. |
| **Text Muted** | `#71717A` | `--text-muted` / `text-zinc-500` | Timestamps, handle labels (`@username`), metadata. |
| **Text Faint** | `#A1A1AA` | `--text-faint` / `text-zinc-400` | Placeholders, disabled states, inactive icons. |
| **Action Primary** | `#09090B` | `--action-primary` / `bg-zinc-950 text-white` | Primary CTA buttons, confirmation actions. |
| **Action Secondary**| `#FFFFFF` | `--action-secondary` / `bg-white border-zinc-200 text-zinc-900` | Secondary buttons, cancel actions. |
| **Destructive** | `#DC2626` | `--status-danger` / `text-red-600` | Account deletion, block, report (restrained use only). |
| **Online Status** | `#16A34A` | `--status-online` / `bg-emerald-600` | Real-time presence indicator pill/dot (10px). |

### Strict Bans
- **NO random colorful gradients:** No purple-to-blue gradient cards, buttons, or hero glows.
- **NO glowing orbs:** No radial mesh gradients or neon blurs.
- **NO colored shadows:** Shadows must be neutral black with low opacity (3% to 6%).

---

## 3. Typography System

The typography pairs **Plus Jakarta Sans** (clean, contemporary geometric grotesque) for functional UI with **Unbounded** (distinctive, wide geometric display font) for strategic brand moments and primary display headings.

### Font Family Mapping

| Role | Family Name | CSS Variable | Applied Elements |
| :--- | :--- | :--- | :--- |
| **Primary UI & Body** | Plus Jakarta Sans | `var(--font-jakarta), system-ui, sans-serif` | Body text, comments, inputs, buttons, sidebar items, descriptions. |
| **Display Headings** | Unbounded | `var(--font-unbounded), system-ui, sans-serif` | Brand logo "POPPIN.", hero headline on `/`, major page titles (`h1`). |

### Type Scale & Hierarchy

| Level | Font Family | Size | Line Height | Tracking | Weight | Target Use |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 1** | Unbounded | 48px – 56px | 1.1 | `-0.03em` | 700 Bold | Landing page main hero heading |
| **Display 2** | Unbounded | 32px – 36px | 1.15 | `-0.025em`| 700 Bold | Major page titles (Communities, Messages) |
| **Heading 1** | Plus Jakarta Sans | 24px – 28px | 1.25 | `-0.02em` | 700 Bold | Section headings, modal titles |
| **Heading 2** | Plus Jakarta Sans | 18px – 20px | 1.3 | `-0.015em`| 600 SemiBold| Post author name, community card title |
| **Body Large** | Plus Jakarta Sans | 16px | 1.55 | `0` | 400 / 500 | Hero description, lead post paragraph |
| **Body Default**| Plus Jakarta Sans | 14px | 1.5 | `0` | 400 Regular | Feed posts, comments, chat messages |
| **Caption / Label**| Plus Jakarta Sans | 12px – 13px| 1.4 | `0.01em` | 500 Medium | Timestamps, handle tags, badges, input hints |
| **Micro / Status**| Plus Jakarta Sans | 11px | 1.3 | `0.02em` | 600 SemiBold| Unread counter pill, badge labels |

### Typography Rules
1. **Never use Unbounded for continuous reading:** Unbounded is strictly for selected headings (≤ 15 words) and brand titles. Long paragraphs, chat text, or form labels must ALWAYS use Plus Jakarta Sans.
2. **Measure Constraint:** Body paragraphs must never exceed 65–75 characters per line (`max-w-prose` or `max-w-xl`) to preserve optimal legibility.
3. **No All-Caps Tracked Shouting:** Labels should use natural sentence case or capitalized words without aggressive letter spacing.

---

## 4. Iconography Standards

Iconography is standardized strictly on **Lucide React**.

### Strict Requirements
- **NO emojis as UI icons:** Never use emojis (e.g. `✨`, `🔥`, `🚀`, `👋`) as interface labels, button icons, or navigation bullets.
- **NO Unicode character improvisations:** Never use `▶`, `✓`, `✕`, `•` in place of standard SVG icons.
- **Single Icon Library:** Every icon in the application MUST be imported from `lucide-react`.

### Standardized Dimensions & Stroke Weights

| Size Token | Dimensions | Stroke Width | Context / Usage |
| :--- | :--- | :--- | :--- |
| **Icon Small** | `14px × 14px` | `1.75px` | Inline metadata, timestamps, verify checks, sub-labels |
| **Icon Standard** | `18px × 18px` | `1.85px` | Navigation sidebar links, input field prefixes, dropdown items |
| **Icon Medium** | `20px × 20px` | `1.75px` | Post action triggers (Like, Comment, Share), topbar buttons |
| **Icon Large** | `24px × 24px` | `1.75px` | Media upload prompts, empty state centerpieces, modal headers |

### Alignment Rule
All icons must be vertically centered with adjacent text using `inline-flex items-center gap-2` or `flex items-center gap-2.5`.

---

## 5. Spacing, Grid & Depth Tokens

The system uses a strict **4px/8px geometric scale**:

| Token | Size | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| `space-1` | 4px | `p-1`, `gap-1` | Micro padding, indicator offsets |
| `space-2` | 8px | `p-2`, `gap-2` | Button inner padding, icon-label gap |
| `space-3` | 12px | `p-3`, `gap-3` | Compact card padding, form input vertical padding |
| `space-4` | 16px | `p-4`, `gap-4` | Default card padding, chat bubble padding, list gaps |
| `space-5` | 20px | `p-5`, `gap-5` | Modal inner padding, section gutters |
| `space-6` | 24px | `p-6`, `gap-6` | Main layout card padding, container margins |
| `space-8` | 32px | `p-8`, `gap-8` | Section vertical rhythm, profile header spacing |
| `space-12`| 48px | `py-12`, `gap-12`| Major landing page section gutters |
| `space-16`| 64px | `py-16` | Hero section top/bottom padding |

### Border Radius Tokens
- `rounded-sm`: 4px (Badges, micro pills)
- `rounded-md`: 8px (Form controls, buttons, dropdown menus)
- `rounded-lg`: 12px (Post cards, community cards, media wrappers)
- `rounded-xl`: 16px (Modals, large surface panels, sidebar active pill)
- `rounded-full`: 9999px (Avatars, status pills, floating action buttons)

### Depth & Elevation (Diffuse Ambient Shadows)
- **Flat Surface:** `border border-zinc-200 bg-white` (Default cards, sidebar).
- **Subtle Elevation (`shadow-sm`):** `0 1px 2px 0 rgba(0, 0, 0, 0.04)` (Hovered cards, buttons).
- **Medium Elevation (`shadow-md`):** `0 4px 12px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.02)` (Dropdowns, popovers).
- **High Elevation (`shadow-xl`):** `0 16px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 8px -2px rgba(0, 0, 0, 0.03)` (Modal dialogs, lightbox).

---

## 6. Core Component Conventions

### Buttons
- **Primary:** `bg-zinc-950 text-white hover:bg-zinc-800 active:scale-[0.98] transition-all font-medium rounded-lg px-4 py-2 text-sm`
- **Secondary:** `bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 active:scale-[0.98] transition-all font-medium rounded-lg px-4 py-2 text-sm`
- **Ghost:** `text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 rounded-lg p-2 transition-colors`
- **Disabled State:** `opacity-40 cursor-not-allowed pointer-events-none`
- **Loading State:** Replace or prefix with a 16px spinning Lucide `Loader2` icon and lock pointer events.

### Form Inputs
- **Base Input:** `w-full bg-white border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 focus:border-zinc-950 transition-all`
- **Error State:** `border-red-500 focus:ring-red-500/10 focus:border-red-500` accompanied by an inline message `<p className="text-xs text-red-600 mt-1 flex items-center gap-1">` with an `AlertCircle` icon.

### Cards & Containers
- Must have explicit border: `border border-zinc-200/90 rounded-lg bg-white overflow-hidden`.
- **Ban on Nested Cards:** A card must NEVER contain another visually bordered card with duplicate borders and shadows. Use subtle dividers (`divide-y divide-zinc-100`) or background tints (`bg-zinc-50`) instead.

### Custom Browser Surfaces
- **Selection:** `selection:bg-zinc-900 selection:text-white`
- **Caret:** `caret-zinc-900`
- **Scrollbars:** Subtle 6px neutral scrollbar:
  ```css
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 9999px; }
  ::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
  ```

---

## 7. Responsive Breakpoints & Shell Layout

| Breakpoint | Width | Shell Behavior |
| :--- | :--- | :--- |
| **Mobile (`< 768px`)** | `0 – 767px` | Collapsible hamburger drawer or bottom navigation bar (Home, Communities, Messages, Profile). Topbar holds logo, search trigger, and notification bell. |
| **Tablet (`md: 768px – 1023px`)** | `768 – 1023px` | Compact icon-and-label sidebar (64px icon rail or collapsible 200px drawer). |
| **Desktop (`lg: 1024px+`)** | `1024px+` | Persistent left sidebar (240px width), centered feed/content column (max 640px – 720px), optional right sidebar (community trends, suggested peers, max 320px). |

---

## 8. Anti-Patterns & Quality Ban Checklist

- [x] **No generic gradient text:** Titles must use solid `#09090B` or white.
- [x] **No zero-blur hard block drop shadows:** `box-shadow: 4px 4px 0px` is banned outside neobrutalism.
- [x] **No kicker/eyebrow badges above headings:** Delete redundant "NEW ✨" or "COMMUNITY" chips; let headings speak with typography.
- [x] **No inconsistent icon stroke widths:** All icons are standardized at 1.75–1.85.
- [x] **No oversized avatars:** Profile avatars follow standard sizes: 24px (micro), 32px (small), 40px (feed post), 48px (card lead), 80px–96px (profile header).

