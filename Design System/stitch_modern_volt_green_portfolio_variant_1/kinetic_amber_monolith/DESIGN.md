# Design System Specification: Kinetic Monolith (Neon Orange Edition)

## 1. Overview & Creative North Star: "The Kinetic Monolith"
The Creative North Star for this design system is **The Kinetic Monolith**. Imagine a high-end fashion editorial or a brutalist architectural gallery: heavy, intentional, and undeniably premium. We move away from the "app-like" feel of generic SaaS products toward a digital experience that feels curated and tectonic.

The "Kinetic" aspect is driven by high-contrast typography and intentional asymmetry. The "Monolith" is represented by deep, layered blacks (`#0e0e0e`) and the striking, singular use of Neon Orange (`#FF801A`). We do not use orange to decorate; we use it to command attention. This system thrives on "Breathing Room"—using large swaths of empty space to make the content feel more expensive.

---

## 2. Colors & Tonal Architecture
The palette is rooted in absolute depth, utilizing a monochromatic dark base punctuated by a high-energy "Neon Orange" kinetic pulse.

### The Primary Kinetic Pulse
*   **Primary (Action/Energy):** `#ff9247` (Dark Mode) / `#FF6B00` (Light Mode)
*   **Primary Container (Subtle Energy):** `#fb7d16`
*   **On-Primary (High Contrast):** `#4f2200` (Used for text on orange surfaces)

### The "No-Line" Rule
Traditional UI relies on 1px borders to separate ideas. This system prohibits them. **You are forbidden from using solid borders for sectioning.** Boundaries must be defined through:
1.  **Background Shifts:** Place a `surface_container_low` section against a `surface` background.
2.  **Tonal Transitions:** Use the `surface_variant` to define header areas without a hard line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers.
*   **Base Layer:** `surface` (`#0e0e0e`)
*   **Nesting Level 1:** `surface_container_low` (`#131313`)
*   **Nesting Level 2 (Floating/Active):** `surface_container_highest` (`#262626`)
*   **The "Glass" Rule:** For floating navigation or modals, use `surface_container` with a 70% opacity and a `24px` backdrop-blur to create a "frosted obsidian" effect.

---

## 3. Typography: Editorial Authority
We use **Inter** not as a standard UI font, but as a Swiss-style editorial face. 

*   **Display (The Statement):** `display-lg` (3.5rem) should be used with tight letter-spacing (-0.02em) and leading. It is the "Hero" of the page.
*   **Headline (The Hook):** `headline-lg` (2rem) provides structural hierarchy. Use it to break long scrolls.
*   **Body (The Content):** `body-lg` (1rem) for long-form reading. Ensure a generous line-height (1.6) to maintain the "Editorial" feel.
*   **Label (The Utility):** `label-sm` (0.6875rem) should always be Uppercase with +0.05em tracking when used for metadata or category tags.

---

## 4. Elevation & Depth: Tonal Layering
Depth in this system is "Natural," not "Artificial." We avoid heavy drop shadows in favor of light-source simulation.

*   **The Layering Principle:** To lift a card, do not add a shadow. Instead, shift its color from `surface_container_low` to `surface_container_high`.
*   **Ambient Shadows:** If a floating element (like a dropdown) requires a shadow, use a large blur (32px+) at 6% opacity using a tinted shadow: `rgba(255, 146, 71, 0.06)`. This mimics light reflecting off the Neon Orange pulse.
*   **The Ghost Border:** If accessibility requires a stroke (e.g., in a complex form), use `outline_variant` at 15% opacity. It should feel like a suggestion of a border, not a fence.

---

## 5. Components & Primitives

### Buttons: The Kinetic Trigger
*   **Primary:** Solid `primary` (`#ff9247`) with `on_primary` text. Use `xl` (0.75rem) roundedness. No border.
*   **Secondary:** `surface_container_highest` background with `on_surface` text.
*   **Tertiary:** Transparent background, `primary` text, no underline. Shift to `surface_variant` on hover.

### Cards & Lists: The Monolith Stack
*   **Rule:** No dividers. Separate list items using `spacing.4` (1.4rem) of vertical white space or by alternating background shades between `surface_container_low` and `surface_container`.
*   **Interaction:** On hover, a card should subtly shift from `surface_container` to `surface_bright`.

### Input Fields: The Minimalist Frame
*   **Style:** Bottom-border only (the "Ghost Border" at 20% opacity). When focused, the border transitions to a 2px `primary` Neon Orange.
*   **Error State:** Use `error` (`#ff7351`) text and a subtle `error_container` glow.

### Signature Component: The "Kinetic Scroller"
*   In horizontal scrolls, the active item should use a `tertiary_fixed` background, while inactive items remain `surface_container_low`. Use the `spacing.10` (3.5rem) token for oversized padding to emphasize the luxury of space.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. Align a headline to the far left and the body text to a center-right column.
*   **Do** use the Neon Orange sparingly. If everything is orange, nothing is "Kinetic."
*   **Do** lean into the `surface_container` tiers to create depth.

### Don’t
*   **Don’t** use 100% white text on an orange button; use the specified `on_primary` (`#4f2200`) for premium legibility.
*   **Don’t** use standard "Grey" for shadows. Use the tinted ambient shadow rule.
*   **Don’t** add borders to containers. If you feel the need for a border, your background color contrast isn't strong enough. Adjust the `surface` tier instead.
*   **Don’t** crowd the interface. If a screen feels "busy," double the spacing using the `spacing.16` or `20` tokens.