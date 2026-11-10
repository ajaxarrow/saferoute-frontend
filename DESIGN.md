---
name: SafeRoute
description: Weather-aware truck routing, drawn like enamel station signage and a transit line diagram.
colors:
  porcelain: "oklch(0.962 0.004 250)"
  enamel-white: "oklch(1 0 0)"
  midnight-ink: "oklch(0.235 0.065 262)"
  slate-ink: "oklch(0.43 0.04 262)"
  pale-tile: "oklch(0.935 0.008 255)"
  grout-line: "oklch(0.83 0.018 255)"
  field-edge: "oklch(0.5 0.06 262)"
  cobalt: "oklch(0.5 0.18 262)"
  signal-red: "oklch(0.52 0.21 27)"
  midnight-enamel: "oklch(0.215 0.06 262)"
  midnight-card: "oklch(0.265 0.07 262)"
  midnight-tile: "oklch(0.3 0.07 262)"
  night-porcelain: "oklch(0.965 0.005 250)"
  night-slate: "oklch(0.8 0.03 255)"
  night-cobalt: "oklch(0.74 0.13 255)"
  night-red: "oklch(0.72 0.17 25)"
  risk-low: "#188038"
  risk-moderate: "#fbbc04"
  risk-high: "#fa7b17"
  risk-severe: "#d93025"
  risk-no-travel: "#8430ce"
typography:
  headline:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
  title:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.25
  figure:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Public Sans Variable, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  segmented-option:
    backgroundColor: "{colors.porcelain}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.md}"
    height: "48px"
  segmented-option-selected:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.porcelain}"
  tab:
    textColor: "{colors.slate-ink}"
    height: "48px"
    typography: "{typography.title}"
  tab-selected:
    textColor: "{colors.midnight-ink}"
  route-card:
    backgroundColor: "{colors.enamel-white}"
    textColor: "{colors.midnight-ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
  verdict-plate:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.lg}"
    padding: "16px"
  roundel:
    backgroundColor: "{colors.midnight-ink}"
    textColor: "{colors.porcelain}"
    rounded: "{rounded.full}"
    size: "44px"
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.enamel-white}"
    rounded: "{rounded.lg}"
    height: "32px"
---

# Design System: SafeRoute

## Overview

**Creative North Star: "The Station Sign"**

SafeRoute reads like enamel signage in a transit station: a porcelain ground, midnight-blue ink, heavy rounded sans lettering, and a route drawn as a line diagram with stations and a terminal at each end. Light is porcelain with midnight ink; dark is midnight enamel with porcelain ink. The same hue (about 262) carries both, so the themes feel like one sign lit differently. One cobalt means "act here". Everything else is ink.

Density is calm and large: body text is 16px, targets are 48px, labels are bold, so a tired driver in glare can read it at a glance. Weight (700 and 800) does the hierarchy work instead of size jumps or colour.

Risk is the only place with loud colour, and it lives in flat inks that are never borrowed for chrome. Colour is never the sole signal: every level carries a label and an icon.

**Key Characteristics:**
- Two themes from one hue family; one cobalt action colour.
- Flat inks, no gradients, borders of 2px in ink instead of soft fills.
- Transit-diagram vocabulary: roundel, line, station, terminal, plate.
- Large, bold, tabular figures for times and miles.

## Colors

Midnight ink on porcelain, one cobalt, and five flat risk inks.

### Primary
- **Cobalt** (oklch(0.5 0.18 262); dark: Night Cobalt oklch(0.74 0.13 255)): the single action colour. Primary buttons, the "recommended" tag, focus ring, text selection tint (30% mix), input caret.

### Neutral
- **Porcelain** (oklch(0.962 0.004 250)): page and panel ground. Dark: **Midnight Enamel** (oklch(0.215 0.06 262)).
- **Enamel White** (oklch(1 0 0)): cards, popovers, station dots. Dark: **Midnight Card** (oklch(0.265 0.07 262)).
- **Midnight Ink** (oklch(0.235 0.065 262)): text, selected states, borders on selection, roundels, the verdict plate. Dark: **Night Porcelain** (oklch(0.965 0.005 250)).
- **Slate Ink** (oklch(0.43 0.04 262)): secondary text. Dark: **Night Slate** (oklch(0.8 0.03 255)).
- **Pale Tile** (oklch(0.935 0.008 255)): muted, secondary and hover fills. Dark: **Midnight Tile** (oklch(0.3 0.07 262)).
- **Grout Line** (oklch(0.83 0.018 255)): default borders and tab rule. Dark: white at 18%.
- **Field Edge** (oklch(0.5 0.06 262)): input and unselected-chip stroke (used at 60%). Dark: white at 50%.
- **Signal Red** (oklch(0.52 0.21 27); dark oklch(0.72 0.17 25)): destructive and invalid states only.

### Risk inks (lib/risk.ts, hex because MapLibre cannot read CSS variables)
- **Low** #188038 on white; **Moderate** #fbbc04 on #202124; **High** #fa7b17 on #202124; **Severe** #d93025 on white; **No Travel** #8430ce on white. Each also has a label and a lucide icon (CircleCheck, CircleAlert, TriangleAlert, OctagonAlert, Ban).

### Named Rules
**The One Cobalt Rule.** Cobalt is the only chromatic non-risk colour. If it is not an action, a recommendation or focus, it is ink.
**The Risk Inks Stay Home Rule.** Risk colours appear only on risk (line segments, badges, map layers, bars). Never on buttons, headers or decoration.
**The Never-Colour-Alone Rule.** A risk level always ships with its label and icon.

## Typography

**Display, Body and Label Font:** Public Sans Variable (with system-ui, sans-serif). Headings alias the same family.

**Character:** One sturdy, civic grotesque, the face of signage. Bold and extra-bold carry hierarchy.

### Hierarchy
- **Headline** (800, 1.5rem, line-height 1): the SafeRoute wordmark, route durations.
- **Title** (700, 1.125rem to 1.25rem): route names, tab labels, verdict figures (1.25rem).
- **Body** (400 to 600, 1rem): the default and most-used size (41 uses); secondary text in Slate Ink.
- **Label** (700, 0.875rem): tags, small badges, verdict captions. Not uppercase, no tracking.
- **Figure** (800, tabular-nums via `.tabular`): times, miles, route numbers inside roundels (up to 1.875rem at the large roundel).

### Named Rules
**The Tabular Figures Rule.** Any number that changes or is compared uses `.tabular`.
**The 14px Floor Rule.** Nothing is set below 0.875rem in feature components. (The inherited shadcn button primitives go smaller; see Components.)

## Layout

Desktop (min-width 768px): a single 440px left panel (20px padding, scrolls) with the map filling the remaining width, full dynamic viewport height. Mobile: the map fills the screen and one non-modal bottom sheet snaps between peek, half (52% of viewport) and full (86%); the map stays usable behind it. Spacing follows the Tailwind 4px scale: 8 and 12px inside cards, 16 between groups, 24 between sections. Touch targets are 44px minimum; chips and tabs are 48px tall and the theme toggle is 48px square.

## Elevation & Depth

Flat. Depth comes from 2px ink borders, tone steps (porcelain ground, white card) and the solid midnight verdict plate. The one shadow is the desktop panel edge (`box-shadow: 2px 0 12px rgba(0,0,0,0.12)`), separating panel from map. Buttons nudge down 1px when pressed.

### Named Rules
**The Flat Enamel Rule.** No shadows on cards, chips or buttons; separate with a border or a tone step.

## Shapes

Soft-cornered signage. Base radius is 0.5rem (cards, route cards, plate, buttons); chips and badges use 0.4rem; roundels, stations, terminals, the truck marker and the line itself are full circles or pills. Borders are 2px, heavy enough to read in glare. The route line is a 12px-tall pill of flat risk-ink segments, with 10px station dots (2px ink ring, white fill), 20px terminals (3px ink ring; origin hollow, destination solid) and a 32px truck disc.

## Components

### Roundel
The route's bullet: a circle with a bold number, ink fill with porcelain text (inverse on the dark plate). Sizes 32, 44, 56px. Decorative (aria-hidden); the route name is always in text beside it.

### RouteLine
The signature component. A transit line whose segments are inked in each stretch's risk level, stations at weather checkpoints (thinned to at most 28), terminals at both ends, and an optional truck disc that slides with a 300ms ease-out (none under reduced motion). Exposes a full text alternative.

### Segmented
Single-choice chips with radio semantics. 48px minimum height, 2px border, bold 1rem. Selected: solid Midnight Ink with porcelain text. Unselected: Field Edge stroke at 60%, Pale Tile on hover. Focus ring 3px at ring/50.

### Tabs
Real tab semantics with arrow-key navigation. A 2px Grout Line rule beneath; selected tab gets a 4px Midnight Ink underline, unselected is Slate Ink with a faint Pale Tile hover. 48px tall, bold 1.125rem.

### Route card
Radio button card: White fill, 2px border (Grout Line; Midnight Ink when selected), 0.5rem radius, 12px padding. Name in bold title, duration in extra-bold 1.5rem tabular, hazard miles in semibold, tags as small bold chips ("recommended" in Cobalt, others 2px ink outline).

### Verdict plate
A solid Midnight Ink block with porcelain text (16px padding, 0.5rem radius) holding the recommendation and key figures; captions at 75% opacity.

### Risk badge
Risk ink fill with its on-colour text, bold, 0.4rem radius, icon plus label. Small (0.875rem) and medium (1rem) sizes.

### Buttons
The shadcn primitive: 0.5rem radius, Cobalt fill with white text (hover 80%), outline, secondary (Pale Tile), ghost, destructive (tinted Signal Red) and link variants; 1px press nudge, 3px ring focus. Its default height is 32px and small sizes drop to 24 to 28px, below the product's 44px target; feature code overrides with larger sizes.

## Do's and Don'ts

### Do:
- **Do** use Midnight Ink and Porcelain for structure, selection and emphasis; reserve Cobalt for the action.
- **Do** pair every risk colour with its label and icon, and take colours from `RISK` in lib/risk.ts.
- **Do** keep targets at 44px or more and figures tabular.
- **Do** respect reduced motion on any movement (`motion-reduce:transition-none`).
- **Do** build new lists and statuses from line, station, roundel and plate forms.

### Don't:
- **Don't** reuse risk inks for chrome, buttons or decoration.
- **Don't** add shadows to cards or chips; the panel edge is the only one.
- **Don't** look like Google Maps, a generic dark dashboard, or add decoration that costs usability (PRODUCT.md).
- **Don't** introduce a second action colour or a second typeface.
