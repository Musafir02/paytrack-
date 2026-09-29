---
name: Kinetic Enterprise
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#3f4f65'
  on-tertiary: '#ffffff'
  tertiary-container: '#57677e'
  on-tertiary-container: '#d6e6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
This design system is engineered for a high-fidelity payroll and financial management experience. The brand personality is rooted in **security, efficiency, and transparency**, moving away from the cold, industrial feel of legacy enterprise software toward a more "consumer-grade" professional aesthetic.

The visual style utilizes a **Modern Corporate** approach with a focus on precision and clarity. It leverages ample whitespace and a sophisticated layer-on-layer hierarchy to reduce cognitive load for users managing complex financial data. The emotional response should be one of total confidence—the interface should feel robust enough to handle high-stakes transactions while remaining accessible and welcoming to the everyday employee.

## Colors
The palette is built on a foundation of "Finance Blue" (#0052FF), a vibrant and confident primary color that signals technological sophistication and trust.

- **Primary:** Used for main actions, active states, and brand highlights.
- **Secondary (Deep Slate):** Used for primary text and navigation elements to provide high contrast and a grounded feel.
- **Tertiary (Muted Slate):** Used for secondary text, metadata, and decorative icons.
- **Neutral:** A systematic range of grays starting from a pure white (#FFFFFF) for interactive surfaces to a very light gray (#F8FAFC) for global backgrounds.
- **Semantic Colors:** Critical for financial status reporting. Success (green) indicates completed payments, Warning (amber) for pending approvals, and Error (red) for failed transactions or discrepancies.

## Typography
Inter is the exclusive typeface for this design system, chosen for its exceptional legibility and systematic design which is ideal for data-heavy interfaces.

The hierarchy distinguishes between **Display** styles for high-level summaries (like total pay or account balances) and **Body/Label** styles for administrative tasks. A specific **Numeric** configuration is used for financial figures to ensure clarity in payroll logs. Letter spacing is slightly tightened on larger headings to maintain a premium, high-fidelity look, while labels utilize a slight track-out and uppercase styling for distinct categorization.

## Layout & Spacing
This design system employs a strict **8px/4px linear grid system**. All layout decisions, padding, and margins must be increments of 8px, using 4px only for fine-tuning internal component spacing (like icon-to-text distances).

For mobile, the layout follows a fluid-column model with a **16px side margin** and **16px gutters**. On larger screens, the layout transitions to a 12-column fixed grid with a max-width of 1280px to maintain readability of data tables and dashboards. Whitespace is used aggressively to separate logical groups of information, ensuring the UI never feels cluttered despite the density of payroll data.

## Elevation & Depth
Depth is achieved through **Tonal Layering** combined with **Ambient Shadows**. This approach creates a clear mental model of the interface's Z-axis.

1.  **Level 0 (Background):** Neutral Background (#F8FAFC).
2.  **Level 1 (Cards/Surfaces):** Pure White (#FFFFFF) with a very soft, diffused shadow (0px 4px 20px rgba(15, 23, 42, 0.05)).
3.  **Level 2 (Modals/Popovers):** Pure White with a more pronounced shadow (0px 10px 32px rgba(15, 23, 42, 0.10)) to indicate focus.

Subtle 1px borders in a very light slate (#E2E8F0) are used on cards to maintain definition even when shadows are subtle.

## Shapes
The shape language is defined by **Rounded (Level 2)** geometry. This provides a soft, approachable feel that offsets the seriousness of financial data. 

Standard components like buttons and input fields utilize a **0.5rem (8px)** corner radius. Larger containers, such as dashboard cards and modals, use **1rem (16px)** to create a distinct containerized look. Circular/Pill shapes are reserved exclusively for status chips and notification badges to make them instantly recognizable as secondary informative elements.

## Components
- **Buttons:** Primary buttons use a solid Finance Blue fill with white text. Secondary buttons use a slate outline or a subtle ghost style. All buttons have a minimum height of 44px for touch targets.
- **Input Fields:** Use a white background with a 1px border (#E2E8F0). On focus, the border transitions to Finance Blue with a subtle 2px outer glow.
- **Chips/Status Badges:** Utilize a "Soft Color" treatment—a light tinted background (10% opacity of the status color) with high-contrast text of the same hue (e.g., Success has a light green background and dark green text).
- **Cards:** The primary container for payroll data. Cards should have 24px internal padding and utilize the Level 1 shadow profile.
- **Lists:** Data rows should be separated by 1px dividers or subtle background alternating. High-touch areas in lists must have a minimum vertical height of 56px.
- **Progress Indicators:** Linear progress bars for "Processing Payroll" should use a subtle gradient of Finance Blue to imply movement and system activity.