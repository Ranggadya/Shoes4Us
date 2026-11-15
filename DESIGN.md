---
name: "Shoes4Us"
description: "Editorial monochrome retail footwear storefront and authentication system built on sharp zero-radius geometry, stark black-and-white contrast, and hairline structural framing."
colors:
  ink-black: "#000000"
  rail-obsidian: "#0a0a0a"
  charcoal-ink: "#171717"
  graphite-hover: "#262626"
  slate-label: "#404040"
  muted-caption: "#525252"
  placeholder-ash: "#737373"
  stone-ash: "#a3a3a3"
  input-border: "#d4d4d4"
  hairline-rule: "#e5e5e5"
  studio-surface: "#f5f5f5"
  paper-tint: "#fafafa"
  canvas-white: "#ffffff"
  promo-crimson: "#d91e2a"
  error-crimson: "#dc2626"
  error-deep: "#b91c1c"
  error-border: "#fca5a5"
  error-surface: "#fef2f2"
  error-ink: "#7f1d1d"
  discount-emerald: "#065f46"
typography:
  display:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    fontSize: "2.125rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    fontSize: "1.125rem"
    fontWeight: 800
    lineHeight: 1.55
    letterSpacing: "0.05em"
  title:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "0em"
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "0em"
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "40px"
  3xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink-black}"
    textColor: "{colors.canvas-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.graphite-hover}"
  button-primary-active:
    backgroundColor: "{colors.charcoal-ink}"
  button-secondary:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "46px"
  button-secondary-hover:
    backgroundColor: "{colors.paper-tint}"
  button-rail-ghost:
    backgroundColor: "{colors.rail-obsidian}"
    textColor: "{colors.canvas-white}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
    height: "44px"
  button-rail-ghost-hover:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink-black}"
  input-default:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.rail-obsidian}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
    height: "46px"
  input-disabled:
    backgroundColor: "{colors.studio-surface}"
    textColor: "{colors.placeholder-ash}"
  card-surface:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.charcoal-ink}"
    rounded: "{rounded.none}"
    padding: "20px"
  banner-context:
    backgroundColor: "{colors.paper-tint}"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 16px"
  alert-error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
  nav-auth-header:
    backgroundColor: "{colors.canvas-white}"
    textColor: "{colors.ink-black}"
    height: "64px"
    padding: "0 24px"
  rail-sidebar:
    backgroundColor: "{colors.rail-obsidian}"
    textColor: "{colors.canvas-white}"
    width: "440px"
    padding: "48px"
  password-strength-meter:
    backgroundColor: "{colors.paper-tint}"
    textColor: "{colors.charcoal-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px"
  toast-notification:
    backgroundColor: "{colors.rail-obsidian}"
    textColor: "{colors.canvas-white}"
    rounded: "{rounded.none}"
    padding: "10px 14px"
---

# Design System: Shoes4Us

## Overview

**Creative North Star: "The Architectural Monochrome Showroom"**

Shoes4Us translates physical sneaker flagship retail into a sharp, high-contrast digital showroom where studio product photography and transactional clarity sit inside crisp monochrome geometry. Every surface alternates between pure white canvases and deep obsidian framing, anchored by 1px hairline partitions rather than soft elevation cards or decorative color gradients.

The system maintains generous breathing room around footwear specimens, cart line items, and authentication forms while keeping operational controls dense, predictable, and unembellished. Uppercase tracked labels separate navigation, section headers, and retail commitments from natural Indonesian body copy, guiding shoppers smoothly from catalog discovery through guest-cart sync, authentication, and shipping checkout without visual noise.

Confirmed visual rejections include frosted glassmorphic overlays, soft pill-rounded card containers in core retail flows, decorative multi-hue gradients, and unverified social-proof claims.

**Key Characteristics:**
- Zero-radius (`0px`) architectural geometry across buttons, inputs, product cards, alert banners, toast notifications, and split layout rails.
- Stark monochrome contrast pairing `#000000` and `#0a0a0a` authority surfaces against `#ffffff` and `#fafafa` paper canvases.
- Structural `1px` hairline rules (`#e5e5e5`, `#d4d4d4`, `#262626`, `#171717`) separating content zones at zero resting shadow.
- Uniform-stroke `lucide-react` iconography and tabular numeric alignment (`tabular-nums`) for prices, shoe sizes (US/EU), and countdowns.
- Deterministic `44px`–`48px` touch targets with explicit `2px` high-contrast focus rings across light and dark surfaces.

## Colors

The Shoes4Us palette is strictly monochrome at its core, reserving saturated crimson and emerald strictly for live retail discounts, destructive errors, and applied voucher savings.

### Primary
- **Ink Black** (`#000000`): Primary action fills, active focus rings, selected option borders, input carets, flash-promo bar backdrop, full-strength (`100%`) password meter bars, and high-contrast text selection fill.
- **Rail Obsidian** (`#0a0a0a`): Full-height desktop architectural authentication rail background, global `react-hot-toast` notification ground, primary page titles, met password checklist text, and browser theme color (`<meta name="theme-color">`).

### Secondary
- **Promo Crimson** (`#d91e2a`): Strictly limited to discounted sale pricing, `20% OFF` tags, brand links on product detail pages, and the flash-drop pulse indicator.
- **Error Crimson** (`#dc2626`): Invalid input borders, error focus rings, error toast hairline borders and icon accents, `SALE` navigation tab highlight, and out-of-stock overlays.
- **Error Deep** (`#b91c1c`): Destructive modal confirmation button fill and inline error alert icons/messages.
- **Error Border** (`#fca5a5`): Hairline frame around inline validation and API failure alert banners.
- **Error Surface** (`#fef2f2`): Soft tint fill behind inline validation alerts and `20% OFF` badges.
- **Error Ink** (`#7f1d1d`): High-contrast error message copy inside alert boxes.
- **Discount Emerald** (`#065f46`): Positive financial deduction lines for validated promo codes and shipping subsidies in cart and payment summaries.

### Neutral
- **Charcoal Ink** (`#171717`): Default root `--foreground`, primary storefront text, dialog borders, redirect context banner outline, and pressed CTA state.
- **Graphite Hover** (`#262626`): Primary button hover state, global toast notification hairline borders, strong (`75%`) password meter bars, dark-rail internal horizontal dividers, specimen frame border on dark backgrounds, and uppercase form field labels.
- **Slate Label** (`#404040`): Secondary textual links at rest, summary breakdown labels, password meter header label, and subtle divider copy.
- **Muted Caption** (`#525252`): Helper paragraphs, sub-headings, metadata captions, medium (`50%`) password meter bars, hovered custom scrollbar thumbs, and secondary ghost button borders inside the dark rail.
- **Placeholder Ash** (`#737373`): Input placeholder text, disabled field text, unmet password checklist icons, and divider labels (`atau`).
- **Stone Ash** (`#a3a3a3`): Custom root scrollbar thumb fill at rest and weak (`25%`) password strength bar segments.
- **Input Border** (`#d4d4d4`): Default `1px` border on form fields, secondary provider buttons, quantity steppers, and footer dividers inside the dark rail.
- **Hairline Rule** (`#e5e5e5`): Default `1px` structural stroke on product cards, sticky headers, section headers, password strength meter frames, unfilled meter bar tracks, and cart item dividers.
- **Studio Surface** (`#f5f5f5`): Neutral footwear specimen stage behind blended studio photography, disabled input backgrounds, and utility trigger fills.
- **Paper Tint** (`#fafafa`): Order summary sidebars, redirect context banners, password strength meter surface, root custom scrollbar track, and secondary button hover fill.
- **Canvas White** (`#ffffff`): Root `--background`, primary page surfaces, form input fills, and inverted foreground copy on black and obsidian surfaces.

### Named Rules
**The Monochrome Authority Rule.** Storefront chrome, navigation, authentication stages, and checkout containers stay strictly within `#000000`–`#ffffff` neutrals; brand personality comes from contrast and geometry, never decorative hue.

**The Crimson Restraint Rule.** Red (`#d91e2a` / `#dc2626` / `#b91c1c`) appears only for active retail markdowns, `SALE` navigation, destructive confirmations, and field/form validation errors—never on standard CTAs or neutral badges.

## Typography

**Display Font:** Native OS Sans Stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`)
**Body Font:** Native OS Sans Stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`)

**Character:** A utilitarian, high-contrast sans-serif hierarchy that creates editorial authority through stark weight jumps (`400` vs `700`/`800`), compressed negative tracking on heavy headlines, and wide uppercase tracking on compact labels and controls.

### Hierarchy
- **Display** (`800`, `30px`–`34px` / `1.875rem`–`2.125rem`, line-height `1.15`–`1.25`, letter-spacing `-0.025em`): Main page titles (`Masuk ke Shoes4Us`, `Buat Akun Shoes4Us`, `KERANJANG ANDA`) and desktop rail anchor headline.
- **Headline** (`800`, `18px`–`20px` / `1.125rem`–`1.25rem`, line-height `1.4`–`1.55`, letter-spacing `0.05em` uppercase or `-0.025em` wordmark): Section dividers (`Informasi Pembeli`, `Ringkasan Pesanan`) and the uppercase `Shoes4Us` wordmark.
- **Title** (`600`, `15px`–`16px` / `0.9375rem`–`1rem`, line-height `1.375`, letter-spacing `0em`): Product card titles, cart item names, and secondary action labels.
- **Body** (`400`, `14px` / `0.875rem`, line-height `1.625`, letter-spacing `0em`): Supporting instructions, validation alerts, store guarantees, and summary breakdown rows; constrained around `440px` (~55–65ch) on form stages.
- **Label** (`700`, `11px`–`12px` / `0.6875rem`–`0.75rem`, line-height `1.333`, letter-spacing `0.08em`–`0.12em` uppercase): Form field labels, CTA buttons, password strength header (`Kekuatan Password` at `11px`), top-rail metadata, and navigation links.

### Named Rules
**The Uppercase Control Rule.** Interactive button text, form field labels, and utility navigation links render at `12px` bold uppercase with `0.08em`–`0.1em` tracking, keeping controls crisp and scannable above `14px` sentence-case body text.

**The Tabular Retail Metric Rule.** All IDR prices, item counts, shoe size selectors (US/EU), and flash-sale timers enforce `tabular-nums` so columns and steppers stay aligned without horizontal jitter.

## Layout

Shoes4Us pairs centered editorial containers with asymmetric two-column operational splits. Global storefront pages anchor inside `1280px` headers and category bands, narrowing to `1152px` in cart review and `1024px` in shipping/payment checkout so two-column form-and-summary layouts stay compact (`32px` column gap).

On desktop (`1024px` and `1280px+`), both the `/login` and `/register` split authentication pages hide the top `AuthNavbar` and divide the viewport (`100vh` minimum height) into a fixed `420px` (`1024px+`) to `440px` (`1280px+`) `#0a0a0a` `AuthEditorialRail` flush against a fluid `#ffffff` stage (`40px`–`48px` rail padding, `440px` max-width centered form container). Below `1024px`, the `64px` sticky `AuthNavbar` anchors at the top while the stage sets a `calc(100vh - 65px)` minimum height and collapses cleanly into a single vertical column with compact inline retail assurance at the bottom. Spacing steps follow a strict `8px` / `12px` / `16px` / `24px` / `32px` / `40px` / `48px` progression, and interactive controls observe a `44px`–`48px` minimum hit-target height.

At the document root (`frontend/src/index.css`), Shoes4Us fixes `color-scheme: light` with `--background: #ffffff` and `--foreground: #171717`, paired with thin `8px` square browser scrollbars (`#a3a3a3` thumb on `#fafafa` track, `#525252` on hover). Global `react-hot-toast` notifications (`frontend/src/App.tsx`) anchor `bottom-right` with a `16px` bottom and right viewport offset so transient feedback clears sticky top navigation bars without layout shift.

## Elevation & Depth

Surfaces in Shoes4Us are flat by default (`0px` blur, no resting drop shadows). Hierarchy comes from alternating tonal planes (`#0a0a0a`, `#fafafa`, `#f5f5f5`, `#ffffff`) and crisp `1px` hairline borders. Global `react-hot-toast` notifications likewise enforce zero drop shadow (`box-shadow: none`), separating over white retail pages solely via `#0a0a0a` obsidian fill and a `1px` `#262626` (or `#dc2626` error) frame. Drop shadows appear strictly to separate transient or pinned overlay layers that float above scrolled page content.

### Shadow Vocabulary
- **Sticky Header Shadow** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Applied to the main storefront sticky `Navbar`.
- **Mega-Menu Sheet** (`box-shadow: 0 18px 30px rgba(15, 23, 42, 0.06)`): Soft downward edge beneath full-width desktop category mega-menus.
- **Mobile Sticky Action Bar** (`box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06)`): Subtle upward lift separating the fixed mobile checkout bar from scrolled cart items.
- **Modal & Alert Dialogs** (`box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)` to `0 25px 50px -12px rgb(0 0 0 / 0.25)`): Reserved exclusively for centered modal overlays (`PaymentPage` simulation dialog, `CartPage` clear-cart alertdialog) paired with `1px` `#171717` frames.
- **Floating Support Trigger** (`box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18)`): Anchors the persistent WhatsApp support trigger above storefront content.

### Named Rules
**The Flat-By-Default Rule.** Resting cards, form stages, specimen boxes, and summary panels never carry drop shadows; depth on static layouts is communicated solely by surface contrast and `1px` borders.

**The Hairline Partition Rule.** Adjacent cards, cart rows, rail sections, and specimen captions are divided by `1px` lines (`#e5e5e5` on white, `#262626` on obsidian) rather than floating card gaps with shadows.

## Shapes

The system enforces sharp `0px` corners across all modern retail surfaces, inputs, action buttons, alert banners, password strength segments, global toast notifications, specimen frames, and modal containers. Focus indicators match the crisp architectural language using `2px` solid rings (`#000000` on white surfaces, `#ffffff` inside `#0a0a0a` dark rails, `#dc2626` on invalid inputs) with `1px`–`2px` offsets (`inset` on embedded input icon buttons). Browser chrome matches this square surface grammar via `color-scheme: light`, `#000000` / `#ffffff` text `::selection` highlights, and thin `8px` square scrollbars (`scrollbar-width: thin`).

Studio footwear photography is framed inside sharp rectangular cells: square `1:1` full-bleed borders on catalog cards (`ProductCard`) and a framed `#f5f5f5` studio specimen cell (`1px` `#262626` outer frame) inside the shared desktop `AuthEditorialRail`, supporting both `contain` with multiply blending (`mix-blend-mode: multiply`, e.g., `/NB 1000 WHITE.webp` on `/login`) and full-bleed `cover` studio framing (e.g., `/sepatu8.jpeg` on `/register`), paired with deterministic image fallback chains (`/sepatu1.jpeg`, `/NB 1000 WHITE.webp`, `/logo.jpg`).

## Components

### Buttons
Decisive, zero-radius rectangular controls engineered for unambiguous click targets (`44px`–`48px` minimum height).
- **Shape:** Sharp rectangular corners (`0px` radius).
- **Primary:** Solid `#000000` fill, `#ffffff` `12px` bold uppercase text (`0.08em`–`0.1em` tracking), `48px` height (`12px 20px` padding on full-width login/register submit CTAs; `44px` minimum on inline page CTAs).
- **Hover / Focus:** Transitions smoothly (`150ms` cubic-bezier) to `#262626` on hover and `#171717` on press; disabled states reduce opacity to `50%`–`60%` with `not-allowed` cursor. Focus displays a `2px` `#000000` ring with `2px` offset.
- **Secondary / Ghost:** White secondary provider/navigation buttons (`AuthGoogleButton`, `AuthNavbar`) use `#ffffff` fill, `1px` `#d4d4d4` border, `#171717` text, hovering to `#fafafa` and `#000000` border. On `#0a0a0a` dark rails, exit actions use `#0a0a0a` fill, `1px` `#525252` border, `#ffffff` text, inverting cleanly to `#ffffff` fill / `#000000` text on hover. Destructive confirmation buttons use `#b91c1c` fill with `#ffffff` text.

### Cards / Containers
Structured, flat rectangular enclosures anchored by `1px` hairline strokes.
- **Corner Style:** Zero radius (`0px`).
- **Background:** `#ffffff` for catalog cards and cart lists; `#fafafa` for order summary sidebars, shared `AuthRedirectBanner` context notices, and `PasswordStrengthMeter` panels; `#0a0a0a` for the desktop `AuthEditorialRail`; `#f5f5f5` for embedded sneaker specimen frames.
- **Shadow Strategy:** `0px` resting shadow across all inline cards and banners; modal dialogs elevate with `#171717` `1px` frames plus modal shadow.
- **Border:** `1px` `#e5e5e5` on product cards, password strength panels, and cart lists; `1px` `#171717` on active context banners and dialogs; `1px` `#262626` on dark-rail dividers and specimen frames.
- **Internal Padding:** `12px` (`PasswordStrengthMeter`), `14px` (`ProductCard` metadata), `16px`–`20px` (`CartPage` rows, `PaymentPage` summary), `40px`–`48px` (`AuthEditorialRail` desktop rail on `/login` and `/register`).

### Inputs / Fields
High-legibility rectangular form controls with explicit invalid-state feedback.
- **Style:** `1px` `#d4d4d4` border, `#ffffff` background, `0px` radius, `46px` minimum height, `10px 14px` padding (`48px` right padding when paired with an embedded `44px` password visibility toggle), `#000000` caret, and `#737373` placeholders (`getAuthInputClass`).
- **Focus:** Transitions border to `#000000` alongside a `2px` `#000000` ring with `1px` offset.
- **Error / Disabled:** Validation errors shift border to `#dc2626` (`#b91c1c` on focus) with a `2px` `#dc2626` focus ring and pair with either per-field inline `role="alert"` captions (`12px` medium `#b91c1c` with `14px` `#dc2626` `AlertCircle` icon) or an inline `#fef2f2` / `1px` `#fca5a5` form-level `role="alert"` banner; disabled inputs during submission render `#f5f5f5` fill with `#737373` text.

### Navigation
Dual-tier navigation pairing a dense full-catalog storefront header with a focused authentication bar.
- **Style & Typography:** Storefront `Navbar` uses a `#ffffff` sticky bar with `44px` logo (`Shoes4Us` `20px` extrabold uppercase), global search, `15px` extrabold uppercase category triggers with `3px` `#000000` active underline, and full-width mega-menus divided by `1px` `#e5e5e5` vertical rules. `AuthNavbar` simplifies to a flat `64px` `#ffffff` bar bordered by `1px` `#e5e5e5` with logo and a `44px` `Kembali ke Toko` button; on desktop (`1024px+`), both `/login` and `/register` split routes hide `AuthNavbar` so the `#0a0a0a` `AuthEditorialRail` starts flush at the viewport top, while `AuthNavbar` remains sticky below `1024px` on those split routes and at all widths on sibling authentication routes (`/forgot-password`, `/reset-password`).

### Password Strength Meter
Monochrome progressive-disclosure strength indicator (`PasswordStrengthMeter`, `frontend/src/components/PasswordStrengthMeter.tsx`) paired cleanly with mandatory minimum-length validation hints.
- **Container & Activation:** Remains hidden when the password field is empty; on input, renders a `0px` panel (`1px` `#e5e5e5` border, `#fafafa` background, `12px` padding, `aria-live="polite"`).
- **4-Segment Strength Bar:** Top row pairs an `11px` bold uppercase (`0.08em` tracking, `#404040`) `Kekuatan Password` label with a right-aligned `tabular-nums` rating (`Lemah`, `Sedang`, `Kuat`, `Sangat Kuat`). Beneath it, a 4-column `6px`-tall (`4px` gap) `role="progressbar"` track defaults unfilled cells to `#e5e5e5` and steps active segments across `#a3a3a3` (`25%`), `#525252` (`50%`), `#262626` (`75%`), and `#000000` (`100%`) with `200ms` color transitions.
- **Checklist & Mandatory Hint Separation:** Optional 2-column checklist (`8+ karakter`, `Huruf besar & kecil`, `Minimal 1 angka`, `Simbol (!@#$)` — shown on `/register` beneath `Rekomendasi keamanan tambahan (opsional)` and hidden via `showRequirements={false}` on `/profile`) marks satisfied items with `14px` `lucide-react` `Check` (`#000000`) and `#0a0a0a` semibold text, and unmet items with `14px` `lucide-react` `Minus` (`#737373`) and `#525252` text. On `/register`, the mandatory `Wajib minimal 6 karakter.` hint (`aria-describedby`) sits separately beneath the input so optional hardening suggestions never conflict with the 6-character minimum rule.

### Notifications / Toasts
Global zero-radius transient feedback layer configured via `react-hot-toast` in `frontend/src/App.tsx`.
- **Placement & Surface:** Pinned `bottom-right` (`16px` bottom and right offsets to clear sticky navigation bars) inside a `0px` container (`260px` max-width, `10px 14px` padding, `box-shadow: none`) with `#0a0a0a` fill, `#ffffff` `13px` weight-`500` copy, and `1px` `#262626` border (`3000ms` default duration).
- **Semantic Variants:** Success toasts (`3000ms`) use inverted monochrome icon tokens (`#ffffff` primary, `#0a0a0a` secondary); error toasts (`4000ms`) retain the `#0a0a0a` ground with a `1px` `#dc2626` border and `#dc2626` / `#ffffff` icon tokens; informational actions (such as honest Google OAuth unavailability notices in `AuthGoogleButton`) pass a crisp `16px` `#ffffff` `lucide-react` `Info` icon.

## Do's and Don'ts

### Do:
- **Do** enforce `0px` square corners and `1px` hairline borders (`#e5e5e5`, `#d4d4d4`, `#262626`) across new storefront, cart, checkout, and authentication UI.
- **Do** meet `44px`–`48px` minimum heights and `2px` high-contrast `:focus-visible` outlines (`#000000` on light, `#ffffff` on dark) on every interactive button, link, and input.
- **Do** apply `tabular-nums` on all prices, quantities, US/EU shoe sizes, and countdown displays, and use real footwear studio imagery from `frontend/public/` with safe `onError` fallbacks.
- **Do** honor product honesty constraints from `PRODUCT.md`: sanitize `?redirect=` targets to internal routes, forward `?redirect=` symmetrically between `/login` and `/register`, and keep unimplemented third-party logins (Google OAuth) clearly communicative without fabricating active auth flows or customer metrics.

### Don't:
- **Don't** introduce soft `8px`–`24px` rounded corners, frosted-glass cards, drop-shadowed resting cards, or multi-hue gradients on editorial monochrome surfaces.
- **Don't** add decorative eyebrows, kickers, or badge clutter above main task headings on focused authentication or checkout screens.
- **Don't** use `#d91e2a` / `#dc2626` crimson for primary CTAs, focus rings on valid fields, or general decorative accents; reserve red strictly for sales, `SALE` links, destructive confirmation, and error states.
- **Don't** replace crisp `lucide-react` uniform-stroke SVGs with raw Unicode glyph icons or unverified external asset URLs.
