# UI Style Guide

Design foundation for the UI project with light and dark mode. Font family is Inter. This file is written for developers and AI code assistants: every value below is the same value used in the live style guide page, and the CSS in Section 14 can be copied straight into the project.

Contents: 1 Quick start, 2 Rules, 3 Naming, 4 Theme, 5 Color, 6 Typography, 7 Spacing and radius, 8 Button, 9 Form input, 10 Form controls, 11 Alert badge toast, 12 Shadow, 13 Layout and accessibility, 14 Source code, 15 AI assistant prompt.

## 1. Quick start

1. Add the Inter font to the head of the page.
2. Create three files from Section 14: tokens.css, components.css, utilities.css. Import them in this order.
3. Add the theme snippet from Section 4 to the head so the html element receives the class theme_light or theme_dark.
4. Build UI only with the tokens and classes in this document.

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="tokens.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="utilities.css">
```

## 2. Rules

1. Never hardcode hex values, sizes, spacing, radius, or shadows. Always use a CSS variable, for example var(--bg_brand_solid).
2. Use semantic tokens (text_, bg_, border_) inside components. Use palette tokens (color_brand_900) and base colors (color_white, color_black) only to define a new semantic token.
3. Light and dark mode switch automatically through the class theme_light or theme_dark on the html element. Semantic tokens change value, so never write separate dark mode styles.
4. All names use underscores. Classes follow the pattern component + variant + size, for example btn btn_primary btn_md.
5. State classes (is_hover, is_focus, is_error, is_success, is_disabled, is_loading) exist for documentation and validation. Real hover and focus use native pseudo classes automatically.
6. If a value is missing, add a token to tokens.css first, then reuse it. Do not invent one off values.

## 3. Naming

* **color_**. Meaning: Base color or palette color with shade; Example: --color_white --color_brand_900
* **text_ / bg_ / border_**. Meaning: Semantic color tokens; Example: --text_primary --bg_secondary --border_primary
* **type_**. Meaning: Typography size, line height, tracking; Example: --type_text_md_size
* **fw_**. Meaning: Font weight; Example: --fw_semibold
* **space_**. Meaning: Spacing scale; Example: --space_4
* **theme_**. Meaning: Theme class on the html element; Example: .theme_dark
* **radius_**. Meaning: Corner radius; Example: --radius_md
* **shadow_ / ring_**. Meaning: Elevation and focus ring; Example: --shadow_md --ring_brand
* **btn_ / field_ / input_**. Meaning: Component classes; Example: .btn_primary .input_icon
* **is_**. Meaning: State modifier; Example: .is_error .is_loading

## 4. Theme

Light is the default. Dark mode is applied by the class theme_dark on the html element. The snippet reads the saved choice, falls back to the system preference, and wires up a toggle button with id themeBtn.

```js
// 1. Put this in the head so the theme is set before the page paints
(function () {
  var t;
  try { t = localStorage.getItem("ds_theme"); } catch (e) {}
  if (!t) t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.classList.add("theme_" + t);
})();

// 2. Switch theme from any button
function setTheme(t) {
  var r = document.documentElement;
  r.classList.remove("theme_light", "theme_dark");
  r.classList.add("theme_" + t);
  try { localStorage.setItem("ds_theme", t); } catch (e) {}
}
document.getElementById("themeBtn").addEventListener("click", function () {
  setTheme(document.documentElement.classList.contains("theme_dark") ? "light" : "dark");
});
```

## 5. Color

Base colors: White #FFFFFF (--color_white) and Black #000000 (--color_black).

### 5.1 Palettes

Every palette has 12 shades: 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950. The brand color #06013A is Brand 900.

* **Brand** (--color_brand_*): 25 #F8F8FF, 50 #F0EFFE, 100 #E1DFFC, 200 #C5C1F7, 300 #A39DEF, 400 #7B72E0, 500 #5547C9, 600 #3D2FA6, 700 #261C80, 800 #160F5C, 900 #06013A, 950 #030120
* **Neutral** (--color_neutral_*): 25 #FCFCFD, 50 #F9FAFB, 100 #F2F4F7, 200 #E4E7EC, 300 #D0D5DD, 400 #98A2B3, 500 #667085, 600 #475467, 700 #344054, 800 #1D2939, 900 #101828, 950 #0C111D
* **Success** (--color_success_*): 25 #F6FEF9, 50 #ECFDF3, 100 #D1FADF, 200 #A6F4C5, 300 #6CE9A6, 400 #32D583, 500 #12B76A, 600 #039855, 700 #027A48, 800 #05603A, 900 #054F31, 950 #053321
* **Info** (--color_info_*): 25 #F5FAFF, 50 #EFF8FF, 100 #D1E9FF, 200 #B2DDFF, 300 #84CAFF, 400 #53B1FD, 500 #2E90FA, 600 #1570EF, 700 #175CD3, 800 #1849A9, 900 #194185, 950 #102A56
* **Error** (--color_error_*): 25 #FFFBFA, 50 #FEF3F2, 100 #FEE4E2, 200 #FECDCA, 300 #FDA29B, 400 #F97066, 500 #F04438, 600 #D92D20, 700 #B42318, 800 #912018, 900 #7A271A, 950 #55160C
* **Warning** (--color_warning_*): 25 #FFFCF5, 50 #FFFAEB, 100 #FEF0C7, 200 #FEDF89, 300 #FEC84B, 400 #FDB022, 500 #F79009, 600 #DC6803, 700 #B54708, 800 #93370D, 900 #7A2E0D, 950 #4E1D09

### 5.2 Text color

Each token has a light value and a dark value.

* `--text_primary`: light #101828 (Neutral 900), dark #F9FAFB (Neutral 50). Headings and main content.
* `--text_secondary`: light #344054 (Neutral 700), dark #E4E7EC (Neutral 200). Labels and supporting text.
* `--text_tertiary`: light #475467 (Neutral 600), dark #D0D5DD (Neutral 300). Hints and descriptions.
* `--text_quaternary`: light #667085 (Neutral 500), dark #98A2B3 (Neutral 400). Captions and icons.
* `--text_placeholder`: light #667085 (Neutral 500), dark #98A2B3 (Neutral 400). Input placeholder.
* `--text_disabled`: light #98A2B3 (Neutral 400), dark #667085 (Neutral 500). Disabled elements.
* `--text_white`: light #FFFFFF (White), dark #FFFFFF (White). Text on solid brand or status surfaces.
* `--text_brand`: light #06013A (Brand 900), dark #A39DEF (Brand 300). Brand text and links.
* `--text_brand_secondary`: light #261C80 (Brand 700), dark #C5C1F7 (Brand 200). Text button and soft brand text.
* `--text_success`: light #027A48 (Success 700), dark #32D583 (Success 400). Success message.
* `--text_info`: light #175CD3 (Info 700), dark #53B1FD (Info 400). Information message.
* `--text_warning`: light #B54708 (Warning 700), dark #FDB022 (Warning 400). Warning message.
* `--text_error`: light #B42318 (Error 700), dark #F97066 (Error 400). Error message.

### 5.3 Background color

Each token has a light value and a dark value.

* `--bg_primary`: light #FFFFFF (White), dark #0C111D (Neutral 950). Page and input background.
* `--bg_secondary`: light #F9FAFB (Neutral 50), dark #101828 (Neutral 900). Section and subtle area.
* `--bg_tertiary`: light #F2F4F7 (Neutral 100), dark #1D2939 (Neutral 800). Hover, chip, flat button.
* `--bg_quaternary`: light #E4E7EC (Neutral 200), dark #344054 (Neutral 700). Pressed, skeleton.
* `--bg_elevated`: light #FFFFFF (White), dark #1D2939 (Neutral 800). Card, toast, popover surface.
* `--bg_disabled`: light #F2F4F7 (Neutral 100), dark #1D2939 (Neutral 800). Disabled elements.
* `--bg_brand_solid`: light #06013A (Brand 900), dark #3D2FA6 (Brand 600). Primary button, banner.
* `--bg_brand_solid_hover`: light #160F5C (Brand 800), dark #5547C9 (Brand 500). Primary button hover.
* `--bg_brand_primary`: light #F0EFFE (Brand 50), dark #160F5C (Brand 800). Secondary button, highlight.
* `--bg_brand_secondary`: light #E1DFFC (Brand 100), dark #261C80 (Brand 700). Secondary button hover.
* `--bg_success_primary`: light #ECFDF3 (Success 50), dark #053321 (Success 950). Success alert.
* `--bg_success_solid`: light #027A48 (Success 700), dark #027A48 (Success 700). Solid success badge.
* `--bg_info_primary`: light #EFF8FF (Info 50), dark #102A56 (Info 950). Info alert.
* `--bg_info_solid`: light #1570EF (Info 600), dark #1570EF (Info 600). Solid info badge.
* `--bg_warning_primary`: light #FFFAEB (Warning 50), dark #4E1D09 (Warning 950). Warning alert.
* `--bg_warning_solid`: light #B54708 (Warning 700), dark #B54708 (Warning 700). Solid warning badge.
* `--bg_error_primary`: light #FEF3F2 (Error 50), dark #55160C (Error 950). Error alert.
* `--bg_error_solid`: light #D92D20 (Error 600), dark #D92D20 (Error 600). Solid error badge.
* `--bg_overlay`: light #000000 (Black at 70%), dark #000000 (Black at 70%). Modal backdrop.

### 5.4 Border color

Each token has a light value and a dark value.

* `--border_primary`: light #D0D5DD (Neutral 300), dark #344054 (Neutral 700). Input, select, textarea, secondary gray button.
* `--border_secondary`: light #E4E7EC (Neutral 200), dark #1D2939 (Neutral 800). Card, table, divider.
* `--border_tertiary`: light #F2F4F7 (Neutral 100), dark #101828 (Neutral 900). Subtle divider.
* `--border_control`: light #667085 (Neutral 500), dark #667085 (Neutral 500). Checkbox, radio, toggle boundary, strong input option (3:1 minimum).
* `--border_control_hover`: light #475467 (Neutral 600), dark #98A2B3 (Neutral 400). Control hover.
* `--border_hover`: light #98A2B3 (Neutral 400), dark #667085 (Neutral 500). Input hover.
* `--border_disabled`: light #E4E7EC (Neutral 200), dark #1D2939 (Neutral 800). Disabled elements.
* `--border_brand`: light #7B72E0 (Brand 400), dark #7B72E0 (Brand 400). Input focus.
* `--border_brand_solid`: light #06013A (Brand 900), dark #5547C9 (Brand 500). Checked control outline.
* `--border_success`: light #6CE9A6 (Success 300), dark #027A48 (Success 700). Success alert.
* `--border_success_solid`: light #039855 (Success 600), dark #32D583 (Success 400). Success input boundary.
* `--border_info`: light #84CAFF (Info 300), dark #175CD3 (Info 700). Info alert.
* `--border_warning`: light #FEC84B (Warning 300), dark #B54708 (Warning 700). Warning alert.
* `--border_error`: light #FDA29B (Error 300), dark #B42318 (Error 700). Error alert.
* `--border_error_solid`: light #D92D20 (Error 600), dark #F97066 (Error 400). Error input boundary.

## 6. Typography

Font family Inter. Weight classes: fw_regular 400, fw_medium 500, fw_semibold 600, fw_bold 700. Display sizes use negative letter spacing.

### Heading

* `.h1`: 36px size, 44px line height, letter spacing negative 2%, default weight 600
* `.h2`: 30px size, 38px line height, letter spacing 0, default weight 600
* `.h3`: 24px size, 32px line height, letter spacing 0, default weight 600
* `.h4`: 20px size, 30px line height, letter spacing 0, default weight 600
* `.h5`: 18px size, 28px line height, letter spacing 0, default weight 600
* `.h6`: 16px size, 24px line height, letter spacing 0, default weight 600

### Display

* `.display_2xl`: 72px size, 90px line height, letter spacing negative 2%, default weight 600
* `.display_xl`: 60px size, 72px line height, letter spacing negative 2%, default weight 600
* `.display_lg`: 48px size, 60px line height, letter spacing negative 2%, default weight 600
* `.display_md`: 36px size, 44px line height, letter spacing negative 2%, default weight 600
* `.display_sm`: 30px size, 38px line height, letter spacing 0, default weight 600
* `.display_xs`: 24px size, 32px line height, letter spacing 0, default weight 600

### Body text

* `.text_xl`: 20px size, 30px line height, letter spacing 0, default weight 400
* `.text_lg`: 18px size, 28px line height, letter spacing 0, default weight 400
* `.text_md`: 16px size, 24px line height, letter spacing 0, default weight 400
* `.text_sm`: 14px size, 20px line height, letter spacing 0, default weight 400
* `.text_xs`: 12px size, 18px line height, letter spacing 0, default weight 400

## 7. Spacing and radius

Spacing uses a 4px base unit. Use spacing tokens for every margin, padding, and gap.

### Spacing scale

* **--space_0**. Value: 0px; Rem: 0rem; Usage: No gap
* **--space_1**. Value: 4px; Rem: 0.25rem; Usage: Tight gap inside badges and alerts
* **--space_2**. Value: 8px; Rem: 0.5rem; Usage: Icon to label gap, small stacks
* **--space_3**. Value: 12px; Rem: 0.75rem; Usage: Alert and toast inner gap, control to label
* **--space_4**. Value: 16px; Rem: 1rem; Usage: Default padding, card gap, mobile margin
* **--space_5**. Value: 20px; Rem: 1.25rem; Usage: Medium block gap
* **--space_6**. Value: 24px; Rem: 1.5rem; Usage: Tablet margin, grid gutter, section gap
* **--space_8**. Value: 32px; Rem: 2rem; Usage: Desktop margin, large gap
* **--space_10**. Value: 40px; Rem: 2.5rem; Usage: Large block gap
* **--space_12**. Value: 48px; Rem: 3rem; Usage: Section padding
* **--space_16**. Value: 64px; Rem: 4rem; Usage: Page section spacing

### Radius scale

* **--radius_xs**. Value: 4px; Usage: Text button, small elements
* **--radius_sm**. Value: 6px; Usage: Checkbox, icon action
* **--radius_md**. Value: 8px; Usage: Button S, M, L, input, select
* **--radius_lg**. Value: 10px; Usage: Button XL, alert, toast
* **--radius_xl**. Value: 12px; Usage: Card, table wrapper
* **--radius_2xl**. Value: 16px; Usage: Modal, large card
* **--radius_full**. Value: 9999px; Usage: Badge, toggle, avatar

## 8. Button

Seven variants, four sizes, five states (default, hover, focus, disabled, loading). Icon size is always 20px. Flat is a solid neutral button with no border and no shadow, for low emphasis actions.

### Sizes

* **S**. Class: .btn_sm; Height: 36px; Padding X: 14px; Font size: 14px; Line height: 20px; Icon: 20px; Gap: 6px; Radius: 8px
* **M**. Class: .btn_md; Height: 40px; Padding X: 16px; Font size: 14px; Line height: 20px; Icon: 20px; Gap: 8px; Radius: 8px
* **L**. Class: .btn_lg; Height: 44px; Padding X: 18px; Font size: 16px; Line height: 24px; Icon: 20px; Gap: 8px; Radius: 8px
* **XL**. Class: .btn_xl; Height: 48px; Padding X: 20px; Font size: 16px; Line height: 24px; Icon: 20px; Gap: 10px; Radius: 10px

### Color tokens per variant

* **Primary**. Background: bg_brand_solid; Text: text_white; Border: None; Hover: bg_brand_solid_hover; Focus ring: ring_brand; Disabled: bg_disabled text_disabled
* **Secondary**. Background: bg_brand_primary; Text: text_brand; Border: None; Hover: bg_brand_secondary; Focus ring: ring_brand; Disabled: bg_disabled text_disabled
* **Secondary gray**. Background: bg_primary; Text: text_secondary; Border: border_primary + shadow_xs; Hover: bg_secondary text_primary; Focus ring: ring_brand; Disabled: border_disabled text_disabled
* **Tertiary**. Background: Transparent; Text: text_brand; Border: None; Hover: bg_brand_primary; Focus ring: ring_brand; Disabled: text_disabled
* **Tertiary gray**. Background: Transparent; Text: text_tertiary; Border: None; Hover: bg_tertiary text_secondary; Focus ring: ring_brand; Disabled: text_disabled
* **Flat**. Background: bg_tertiary; Text: text_secondary; Border: None, no shadow; Hover: bg_quaternary text_primary; Focus ring: ring_brand; Disabled: bg_disabled text_disabled
* **Text button**. Background: Transparent, no padding; Text: text_brand_secondary; Border: None; Hover: text_brand + underline; Focus ring: ring_brand; Disabled: text_disabled

### Variants

btn_primary, btn_secondary, btn_secondary_gray, btn_tertiary, btn_tertiary_gray, btn_flat, btn_text.

### Markup

```html
<button class="btn btn_primary btn_md">Button</button>

<!-- Leading icon -->
<button class="btn btn_primary btn_md">[svg icon] Button</button>

<!-- Icon only -->
<button class="btn btn_secondary_gray btn_md btn_icon_only" aria-label="Add">[svg icon]</button>

<!-- Loading -->
<button class="btn btn_primary btn_md is_loading" aria-busy="true"><span class="btn_spinner"></span>Loading</button>

<!-- Disabled -->
<button class="btn btn_primary btn_md" disabled>Button</button>

<!-- Variants: btn_primary, btn_secondary, btn_secondary_gray, btn_tertiary, btn_tertiary_gray, btn_flat, btn_text -->
<!-- Sizes: btn_sm, btn_md, btn_lg, btn_xl -->
```

## 9. Form input

Field types: Email, Full name, Phone number (country dropdown), Sale amount (currency prefix and dropdown), Card number, Users (multi select style), Website (https:// prefix), Website with copy icon on the right. States: default, hover, focused, filled, error, success, disabled, small size.

Inputs use the soft border token border_primary. Add the class input_strong for a high contrast (3:1) boundary when a project requires it.

### Specification

* **Height**. Value: M 44px, S 36px; Token or class: .input .input_sm
* **Padding X**. Value: 14px (S 12px)
* **Radius**. Value: 8px; Token or class: --radius_md
* **Background**. Value: Page background, disabled uses secondary; Token or class: --bg_primary --bg_secondary
* **Border**. Value: 1px Neutral 300 (soft), hover Neutral 400, focus Brand 400; Token or class: --border_primary --border_hover --border_brand
* **Strong border option**. Value: Add input_strong for a 3:1 boundary (Neutral 500); Token or class: .input_strong --border_control
* **Focus ring**. Value: 4px soft glow (Brand 100 light, Brand 800 dark), error uses Error 100 (Error 900 dark); Token or class: --ring_gray --ring_error
* **Input text**. Value: 16px, line height 24px (S 14px, 20px); Token or class: --text_primary
* **Placeholder**. Value: Same size as input text; Token or class: --text_placeholder
* **Label**. Value: 14px, line height 20px, Medium 500, gap 6px; Token or class: .field_label --text_secondary
* **Required mark**. Value: Asterisk after label; Token or class: .field_required --text_error
* **Hint**. Value: 14px, line height 20px, gap 6px; Token or class: .field_hint --text_tertiary
* **Icon**. Value: 20px, gap 8px from text; Token or class: .input_icon --text_quaternary
* **Addon (prefix, suffix, dropdown)**. Value: Inline text with optional divider; Token or class: .input_addon .input_addon_split
* **Action (copy)**. Value: Icon button inside the field, right side; Token or class: .input_action

### Markup

```html
<div class="field">
  <label class="field_label" for="email">Email <span class="field_required">*</span></label>
  <div class="input">                      <!-- add input_sm, is_error, is_success, is_disabled -->
    [svg icon class="input_icon"]
    <input class="input_field" id="email" type="email" placeholder="name@email.com">
  </div>
  <p class="field_hint">We will never share your email.</p>
</div>

<!-- Prefix and suffix -->
<div class="input">
  <span class="input_addon">$</span>
  <input class="input_field" placeholder="1,000.00">
  <span class="input_addon">USD [chevron svg]</span>
</div>

<!-- Website with split prefix and copy action -->
<div class="input">
  <span class="input_addon input_addon_split">https://</span>
  <input class="input_field" value="www.example.com">
  <button class="input_action" aria-label="Copy">[copy svg]</button>
</div>
```

## 10. Form controls

Select and textarea use the same soft border as the text input. Checkbox, radio, and toggle use the stronger control border (Neutral 500, 3:1 contrast) because small shapes need it to stay visible. Checkbox also supports an indeterminate state (set the indeterminate property in JavaScript).

```html
<label class="choice">
  <input type="checkbox" class="check">      <!-- radio: class="radio", toggle: class="toggle" role="switch" -->
  <span class="choice_body">
    <span class="choice_label">Remember me</span>
    <span class="choice_hint">Save my login details for 30 days.</span>
  </span>
</label>

<!-- Select -->
<div class="input">
  <select class="input_field">...</select>
  [chevron svg class="input_icon"]
</div>

<!-- Textarea -->
<div class="input input_textarea">
  <textarea class="input_field"></textarea>
</div>
```

## 11. Alert, badge, and toast

Alerts stay in the page flow, toasts appear temporarily above the page, badges label status in lists and tables. Alert and toast variants: success, info, warning, error. Badge styles: soft, soft with dot, solid. Use role alert for errors and role status for other messages.

```html
<div class="alert alert_success" role="status">     <!-- alert_info, alert_warning, alert_error (role="alert") -->
  [svg class="alert_icon"]
  <div class="alert_body">
    <div class="alert_title">Application submitted</div>
    <div>Your application was received.</div>
    <div class="alert_actions"><button class="alert_link">Dismiss</button></div>
  </div>
  <button class="alert_close" aria-label="Close">[x svg]</button>
</div>

<span class="badge badge_success">Approved</span>
<span class="badge badge_dot badge_warning">Pending</span>
<span class="badge badge_solid_error">Rejected</span>

<div class="toast toast_success" role="status">
  [svg class="toast_icon"]
  <div class="toast_body"><div class="toast_title">Changes saved</div><div>Your profile was updated.</div></div>
  <button class="toast_close" aria-label="Close">[x svg]</button>
</div>
```

## 12. Shadow

Light mode uses rgb 16, 24, 40. Dark mode uses black with higher opacity. Classes: shadow_xs, shadow_sm, shadow_md, shadow_lg, shadow_xl, shadow_2xl, shadow_3xl.

* **--shadow_xs**. X: 0; Y: 1; Blur: 2; Spread: 0; Color: Light: rgb 16, 24, 40 at 5%. Dark: black at 13%
* **--shadow_sm**. X: 0; Y: 1; Blur: 3; Spread: 0; Color: Light: rgb 16, 24, 40 at 10%. Dark: black at 25%
* ****. X: 0; Y: 1; Blur: 2; Spread: negative 1; Color: Light: rgb 16, 24, 40 at 10%. Dark: black at 25%
* **--shadow_md**. X: 0; Y: 4; Blur: 6; Spread: negative 1; Color: Light: rgb 16, 24, 40 at 10%. Dark: black at 25%
* ****. X: 0; Y: 2; Blur: 4; Spread: negative 2; Color: Light: rgb 16, 24, 40 at 6%. Dark: black at 15%
* **--shadow_lg**. X: 0; Y: 12; Blur: 16; Spread: negative 4; Color: Light: rgb 16, 24, 40 at 8%. Dark: black at 20%
* ****. X: 0; Y: 4; Blur: 6; Spread: negative 2; Color: Light: rgb 16, 24, 40 at 3%. Dark: black at 8%
* **--shadow_xl**. X: 0; Y: 20; Blur: 24; Spread: negative 4; Color: Light: rgb 16, 24, 40 at 8%. Dark: black at 20%
* ****. X: 0; Y: 8; Blur: 8; Spread: negative 4; Color: Light: rgb 16, 24, 40 at 3%. Dark: black at 8%
* **--shadow_2xl**. X: 0; Y: 24; Blur: 48; Spread: negative 12; Color: Light: rgb 16, 24, 40 at 18%. Dark: black at 45%
* **--shadow_3xl**. X: 0; Y: 32; Blur: 64; Spread: negative 12; Color: Light: rgb 16, 24, 40 at 14%. Dark: black at 35%
* **--ring_brand**. X: 0; Y: 0; Blur: 0; Spread: 2 then 4; Color: Page background 2px gap, then Brand 500 (Brand 300 in dark) 2px
* **--ring_gray**. X: 0; Y: 0; Blur: 0; Spread: 4; Color: Brand 100
* **--ring_error**. X: 0; Y: 0; Blur: 0; Spread: 4; Color: Error 100

## 13. Layout and accessibility

### Layout and grid

Mobile first. Media queries cannot read CSS variables, so breakpoint values are written as numbers. Utilities: container and layout_grid (4, 8, 12 columns).

* **0 to 639px**. Name: Mobile; Columns: 4; Page margin: 16px; Gutter: 16px; Container: Full width; Tokens: --space_4
* **640 to 1023px**. Name: Tablet; Columns: 8; Page margin: 24px; Gutter: 24px; Container: Full width; Tokens: --bp_sm --space_6
* **1024px and above**. Name: Desktop; Columns: 12; Page margin: 32px; Gutter: 24px; Container: Max 1200px; Tokens: --bp_lg --container_max
* **1280px and above**. Name: Wide; Columns: 12; Page margin: 32px; Gutter: 24px; Container: Max 1200px, centered; Tokens: --bp_xl

### Text contrast (minimum 4.5:1)

* **text_primary**. Background: bg_primary; Light: 17.75:1 (Pass AAA); Dark: 18.05:1 (Pass AAA); Used for: Body text
* **text_secondary**. Background: bg_primary; Light: 10.46:1 (Pass AAA); Dark: 15.21:1 (Pass AAA); Used for: Labels, secondary gray button
* **text_tertiary**. Background: bg_primary; Light: 7.69:1 (Pass AAA); Dark: 12.79:1 (Pass AAA); Used for: Hints and descriptions
* **text_placeholder**. Background: bg_primary; Light: 4.97:1 (Pass); Dark: 7.32:1 (Pass AAA); Used for: Input placeholder
* **text_quaternary**. Background: bg_primary; Light: 4.97:1 (Pass); Dark: 7.32:1 (Pass AAA); Used for: Captions
* **text_brand**. Background: bg_brand_primary; Light: 17.22:1 (Pass AAA); Dark: 6.86:1 (Pass); Used for: Secondary button
* **text_secondary**. Background: bg_tertiary; Light: 9.49:1 (Pass AAA); Dark: 11.86:1 (Pass AAA); Used for: Flat button
* **text_white**. Background: bg_brand_solid; Light: 19.57:1 (Pass AAA); Dark: 9.74:1 (Pass AAA); Used for: Primary button
* **text_white**. Background: bg_brand_solid_hover; Light: 16.71:1 (Pass AAA); Dark: 6.71:1 (Pass); Used for: Primary button hover
* **text_brand_secondary**. Background: bg_primary; Light: 13.46:1 (Pass AAA); Dark: 11.09:1 (Pass AAA); Used for: Text button
* **text_error**. Background: bg_primary; Light: 6.57:1 (Pass); Dark: 6.77:1 (Pass); Used for: Error hint
* **text_success**. Background: bg_primary; Light: 5.41:1 (Pass); Dark: 9.86:1 (Pass AAA); Used for: Success hint
* **text_primary**. Background: bg_elevated; Light: 17.75:1 (Pass AAA); Dark: 14.07:1 (Pass AAA); Used for: Card and toast title
* **text_success**. Background: bg_success_primary; Light: 5.13:1 (Pass); Dark: 7.31:1 (Pass AAA); Used for: Success alert
* **text_info**. Background: bg_info_primary; Light: 5.57:1 (Pass); Dark: 6.10:1 (Pass); Used for: Info alert
* **text_warning**. Background: bg_warning_primary; Light: 5.20:1 (Pass); Dark: 7.59:1 (Pass AAA); Used for: Warning alert
* **text_error**. Background: bg_error_primary; Light: 6.05:1 (Pass); Dark: 5.00:1 (Pass); Used for: Error alert
* **text_white**. Background: bg_success_solid; Light: 5.41:1 (Pass); Dark: 5.41:1 (Pass); Used for: Solid success badge
* **text_white**. Background: bg_info_solid; Light: 4.57:1 (Pass); Dark: 4.57:1 (Pass); Used for: Solid info badge
* **text_white**. Background: bg_warning_solid; Light: 5.43:1 (Pass); Dark: 5.43:1 (Pass); Used for: Solid warning badge
* **text_white**. Background: bg_error_solid; Light: 4.83:1 (Pass); Dark: 4.83:1 (Pass); Used for: Solid error badge
* **text_disabled**. Background: bg_disabled; Light: 2.34:1 (Exempt); Dark: 2.96:1 (Exempt); Used for: Disabled elements

### Non text contrast (minimum 3:1)

Note: the soft input border (border_primary) is below 3:1. Each field keeps a visible label so it stays identifiable. For stricter requirements use input_strong or switch the default to border_control.

* **border_control**. Light on bg_primary: 4.97:1 (Pass); Dark on bg_primary: 3.79:1 (Pass); Used for: Checkbox, radio, toggle boundary, strong input option
* **border_brand**. Light on bg_primary: 3.94:1 (Pass); Dark on bg_primary: 4.78:1 (Pass); Used for: Input focus border
* **border_error_solid**. Light on bg_primary: 4.83:1 (Pass); Dark on bg_primary: 6.77:1 (Pass); Used for: Error input boundary
* **border_success_solid**. Light on bg_primary: 3.73:1 (Pass); Dark on bg_primary: 9.86:1 (Pass); Used for: Success input boundary
* **text_error**. Light on bg_primary: 6.57:1 (Pass); Dark on bg_primary: 6.77:1 (Pass); Used for: Error icon
* **text_success**. Light on bg_primary: 5.41:1 (Pass); Dark on bg_primary: 9.86:1 (Pass); Used for: Success icon
* **Focus ring outer (Brand 500, Brand 300 in dark)**. Light on bg_primary: 6.71:1 (Pass); Dark on bg_primary: 7.75:1 (Pass); Used for: Focus ring
* **border_primary**. Light on bg_primary: 1.47:1 (Below 3:1); Dark on bg_primary: 1.80:1 (Below 3:1); Used for: Input, select, textarea boundary (soft style)
* **border_secondary**. Light on bg_primary: 1.24:1 (Decorative); Dark on bg_primary: 1.28:1 (Decorative); Used for: Dividers, cards, tables

### Developer checklist

1. Every input has a visible label connected with for and id. A placeholder is never a label.
2. Never rely on color alone. Errors need an icon and a text message, linked with aria describedby, and the input gets aria invalid.
3. Keep the focus ring visible on every interactive element. Do not remove outlines.
4. Touch targets: use btn_lg (44px) or taller on mobile. WCAG 2.2 AA allows 24px, but 44px is recommended for public services.
5. Use role="alert" for errors and role="status" for success and info messages.
6. Loading buttons set aria busy and keep their size so the layout does not shift.
7. Reduced motion is respected: transitions are removed and spinners slow down automatically.
8. Do not use the disabled state to hide a reason. Explain why an action is blocked with a visible message.
9. Test pages at 200% zoom and with keyboard only navigation.

### Do and Don't

1. Do use one primary action per area. Don't place two primary buttons side by side.
2. Do use a visible label for every field. Don't use a placeholder as the only label.
3. Do explain an error with color, icon, and text together. Don't rely on a red border only.
4. Do use tokens such as var(--text_primary). Don't hardcode values such as #101828.

## 14. Source code

Copy these files into the project. They are generated from the same tokens as this document.

### tokens.css

```css
:root{
  /* Base */
  --color_white:#FFFFFF;
  --color_black:#000000;

  /* Palette */
  --color_brand_25:#F8F8FF;
  --color_brand_50:#F0EFFE;
  --color_brand_100:#E1DFFC;
  --color_brand_200:#C5C1F7;
  --color_brand_300:#A39DEF;
  --color_brand_400:#7B72E0;
  --color_brand_500:#5547C9;
  --color_brand_600:#3D2FA6;
  --color_brand_700:#261C80;
  --color_brand_800:#160F5C;
  --color_brand_900:#06013A;
  --color_brand_950:#030120;
  --color_neutral_25:#FCFCFD;
  --color_neutral_50:#F9FAFB;
  --color_neutral_100:#F2F4F7;
  --color_neutral_200:#E4E7EC;
  --color_neutral_300:#D0D5DD;
  --color_neutral_400:#98A2B3;
  --color_neutral_500:#667085;
  --color_neutral_600:#475467;
  --color_neutral_700:#344054;
  --color_neutral_800:#1D2939;
  --color_neutral_900:#101828;
  --color_neutral_950:#0C111D;
  --color_success_25:#F6FEF9;
  --color_success_50:#ECFDF3;
  --color_success_100:#D1FADF;
  --color_success_200:#A6F4C5;
  --color_success_300:#6CE9A6;
  --color_success_400:#32D583;
  --color_success_500:#12B76A;
  --color_success_600:#039855;
  --color_success_700:#027A48;
  --color_success_800:#05603A;
  --color_success_900:#054F31;
  --color_success_950:#053321;
  --color_info_25:#F5FAFF;
  --color_info_50:#EFF8FF;
  --color_info_100:#D1E9FF;
  --color_info_200:#B2DDFF;
  --color_info_300:#84CAFF;
  --color_info_400:#53B1FD;
  --color_info_500:#2E90FA;
  --color_info_600:#1570EF;
  --color_info_700:#175CD3;
  --color_info_800:#1849A9;
  --color_info_900:#194185;
  --color_info_950:#102A56;
  --color_error_25:#FFFBFA;
  --color_error_50:#FEF3F2;
  --color_error_100:#FEE4E2;
  --color_error_200:#FECDCA;
  --color_error_300:#FDA29B;
  --color_error_400:#F97066;
  --color_error_500:#F04438;
  --color_error_600:#D92D20;
  --color_error_700:#B42318;
  --color_error_800:#912018;
  --color_error_900:#7A271A;
  --color_error_950:#55160C;
  --color_warning_25:#FFFCF5;
  --color_warning_50:#FFFAEB;
  --color_warning_100:#FEF0C7;
  --color_warning_200:#FEDF89;
  --color_warning_300:#FEC84B;
  --color_warning_400:#FDB022;
  --color_warning_500:#F79009;
  --color_warning_600:#DC6803;
  --color_warning_700:#B54708;
  --color_warning_800:#93370D;
  --color_warning_900:#7A2E0D;
  --color_warning_950:#4E1D09;

  /* Typography */
  --font_family:"Inter",system-ui,sans-serif;
  --fw_regular:400;
  --fw_medium:500;
  --fw_semibold:600;
  --fw_bold:700;
  --type_display_2xl_size:72px;
  --type_display_2xl_line:90px;
  --type_display_2xl_tracking:-0.02em;
  --type_display_xl_size:60px;
  --type_display_xl_line:72px;
  --type_display_xl_tracking:-0.02em;
  --type_display_lg_size:48px;
  --type_display_lg_line:60px;
  --type_display_lg_tracking:-0.02em;
  --type_display_md_size:36px;
  --type_display_md_line:44px;
  --type_display_md_tracking:-0.02em;
  --type_display_sm_size:30px;
  --type_display_sm_line:38px;
  --type_display_sm_tracking:0em;
  --type_display_xs_size:24px;
  --type_display_xs_line:32px;
  --type_display_xs_tracking:0em;
  --type_text_xl_size:20px;
  --type_text_xl_line:30px;
  --type_text_lg_size:18px;
  --type_text_lg_line:28px;
  --type_text_md_size:16px;
  --type_text_md_line:24px;
  --type_text_sm_size:14px;
  --type_text_sm_line:20px;
  --type_text_xs_size:12px;
  --type_text_xs_line:18px;

  /* Spacing */
  --space_0:0px;
  --space_1:4px;
  --space_2:8px;
  --space_3:12px;
  --space_4:16px;
  --space_5:20px;
  --space_6:24px;
  --space_8:32px;
  --space_10:40px;
  --space_12:48px;
  --space_16:64px;

  /* Radius */
  --radius_xs:4px;
  --radius_sm:6px;
  --radius_md:8px;
  --radius_lg:10px;
  --radius_xl:12px;
  --radius_2xl:16px;
  --radius_full:9999px;

  /* Layout */
  --bp_sm:640px;
  --bp_lg:1024px;
  --bp_xl:1280px;
  --container_max:1200px;
}

/* Light theme (default) */
:root,
:root.theme_light{
  color-scheme:light;

  /* Text */
  --text_primary:var(--color_neutral_900);
  --text_secondary:var(--color_neutral_700);
  --text_tertiary:var(--color_neutral_600);
  --text_quaternary:var(--color_neutral_500);
  --text_placeholder:var(--color_neutral_500);
  --text_disabled:var(--color_neutral_400);
  --text_white:var(--color_white);
  --text_brand:var(--color_brand_900);
  --text_brand_secondary:var(--color_brand_700);
  --text_success:var(--color_success_700);
  --text_info:var(--color_info_700);
  --text_warning:var(--color_warning_700);
  --text_error:var(--color_error_700);

  /* Background */
  --bg_primary:var(--color_white);
  --bg_secondary:var(--color_neutral_50);
  --bg_tertiary:var(--color_neutral_100);
  --bg_quaternary:var(--color_neutral_200);
  --bg_elevated:var(--color_white);
  --bg_disabled:var(--color_neutral_100);
  --bg_brand_solid:var(--color_brand_900);
  --bg_brand_solid_hover:var(--color_brand_800);
  --bg_brand_primary:var(--color_brand_50);
  --bg_brand_secondary:var(--color_brand_100);
  --bg_success_primary:var(--color_success_50);
  --bg_success_solid:var(--color_success_700);
  --bg_info_primary:var(--color_info_50);
  --bg_info_solid:var(--color_info_600);
  --bg_warning_primary:var(--color_warning_50);
  --bg_warning_solid:var(--color_warning_700);
  --bg_error_primary:var(--color_error_50);
  --bg_error_solid:var(--color_error_600);
  --bg_overlay:rgba(0,0,0,0.7);

  /* Border */
  --border_primary:var(--color_neutral_300);
  --border_secondary:var(--color_neutral_200);
  --border_tertiary:var(--color_neutral_100);
  --border_control:var(--color_neutral_500);
  --border_control_hover:var(--color_neutral_600);
  --border_hover:var(--color_neutral_400);
  --border_disabled:var(--color_neutral_200);
  --border_brand:var(--color_brand_400);
  --border_brand_solid:var(--color_brand_900);
  --border_success:var(--color_success_300);
  --border_success_solid:var(--color_success_600);
  --border_info:var(--color_info_300);
  --border_warning:var(--color_warning_300);
  --border_error:var(--color_error_300);
  --border_error_solid:var(--color_error_600);

  /* Shadow */
  --shadow_xs:0px 1px 2px 0px rgba(16,24,40,0.05);
  --shadow_sm:0px 1px 3px 0px rgba(16,24,40,0.1), 0px 1px 2px -1px rgba(16,24,40,0.1);
  --shadow_md:0px 4px 6px -1px rgba(16,24,40,0.1), 0px 2px 4px -2px rgba(16,24,40,0.06);
  --shadow_lg:0px 12px 16px -4px rgba(16,24,40,0.08), 0px 4px 6px -2px rgba(16,24,40,0.03);
  --shadow_xl:0px 20px 24px -4px rgba(16,24,40,0.08), 0px 8px 8px -4px rgba(16,24,40,0.03);
  --shadow_2xl:0px 24px 48px -12px rgba(16,24,40,0.18);
  --shadow_3xl:0px 32px 64px -12px rgba(16,24,40,0.14);

  /* Focus ring */
  --ring_brand:0 0 0 2px var(--bg_primary),0 0 0 4px var(--color_brand_500);
  --ring_gray:0 0 0 4px var(--color_brand_100);
  --ring_error:0 0 0 4px var(--color_error_100);
}

/* Dark theme */
:root.theme_dark{
  color-scheme:dark;

  /* Text */
  --text_primary:var(--color_neutral_50);
  --text_secondary:var(--color_neutral_200);
  --text_tertiary:var(--color_neutral_300);
  --text_quaternary:var(--color_neutral_400);
  --text_placeholder:var(--color_neutral_400);
  --text_disabled:var(--color_neutral_500);
  --text_white:var(--color_white);
  --text_brand:var(--color_brand_300);
  --text_brand_secondary:var(--color_brand_200);
  --text_success:var(--color_success_400);
  --text_info:var(--color_info_400);
  --text_warning:var(--color_warning_400);
  --text_error:var(--color_error_400);

  /* Background */
  --bg_primary:var(--color_neutral_950);
  --bg_secondary:var(--color_neutral_900);
  --bg_tertiary:var(--color_neutral_800);
  --bg_quaternary:var(--color_neutral_700);
  --bg_elevated:var(--color_neutral_800);
  --bg_disabled:var(--color_neutral_800);
  --bg_brand_solid:var(--color_brand_600);
  --bg_brand_solid_hover:var(--color_brand_500);
  --bg_brand_primary:var(--color_brand_800);
  --bg_brand_secondary:var(--color_brand_700);
  --bg_success_primary:var(--color_success_950);
  --bg_success_solid:var(--color_success_700);
  --bg_info_primary:var(--color_info_950);
  --bg_info_solid:var(--color_info_600);
  --bg_warning_primary:var(--color_warning_950);
  --bg_warning_solid:var(--color_warning_700);
  --bg_error_primary:var(--color_error_950);
  --bg_error_solid:var(--color_error_600);
  --bg_overlay:rgba(0,0,0,0.7);

  /* Border */
  --border_primary:var(--color_neutral_700);
  --border_secondary:var(--color_neutral_800);
  --border_tertiary:var(--color_neutral_900);
  --border_control:var(--color_neutral_500);
  --border_control_hover:var(--color_neutral_400);
  --border_hover:var(--color_neutral_500);
  --border_disabled:var(--color_neutral_800);
  --border_brand:var(--color_brand_400);
  --border_brand_solid:var(--color_brand_500);
  --border_success:var(--color_success_700);
  --border_success_solid:var(--color_success_400);
  --border_info:var(--color_info_700);
  --border_warning:var(--color_warning_700);
  --border_error:var(--color_error_700);
  --border_error_solid:var(--color_error_400);

  /* Shadow */
  --shadow_xs:0px 1px 2px 0px rgba(0,0,0,0.125);
  --shadow_sm:0px 1px 3px 0px rgba(0,0,0,0.25), 0px 1px 2px -1px rgba(0,0,0,0.25);
  --shadow_md:0px 4px 6px -1px rgba(0,0,0,0.25), 0px 2px 4px -2px rgba(0,0,0,0.15);
  --shadow_lg:0px 12px 16px -4px rgba(0,0,0,0.2), 0px 4px 6px -2px rgba(0,0,0,0.075);
  --shadow_xl:0px 20px 24px -4px rgba(0,0,0,0.2), 0px 8px 8px -4px rgba(0,0,0,0.075);
  --shadow_2xl:0px 24px 48px -12px rgba(0,0,0,0.44999999999999996);
  --shadow_3xl:0px 32px 64px -12px rgba(0,0,0,0.35000000000000003);

  /* Focus ring */
  --ring_brand:0 0 0 2px var(--bg_primary),0 0 0 4px var(--color_brand_300);
  --ring_gray:0 0 0 4px var(--color_brand_800);
  --ring_error:0 0 0 4px var(--color_error_900);
}
```

### components.css

```css
/* Button */
.btn,.btn_md{--btn_h:40px;--btn_px:16px;--btn_fs:14px;--btn_lh:20px;--btn_gap:8px;--btn_radius:var(--radius_md)}
.btn_sm{--btn_h:36px;--btn_px:14px;--btn_gap:6px}
.btn_lg{--btn_h:44px;--btn_px:18px;--btn_fs:16px;--btn_lh:24px}
.btn_xl{--btn_h:48px;--btn_px:20px;--btn_fs:16px;--btn_lh:24px;--btn_gap:10px;--btn_radius:var(--radius_lg)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:var(--btn_gap);height:var(--btn_h);padding:0 var(--btn_px);font-family:var(--font_family);font-size:var(--btn_fs);line-height:var(--btn_lh);font-weight:var(--fw_semibold);border:1px solid transparent;border-radius:var(--btn_radius);cursor:pointer;white-space:nowrap;transition:background .15s,box-shadow .15s,color .15s}
.btn svg{width:20px;height:20px;flex:none}
.btn_icon_only{padding:0;width:var(--btn_h)}
.btn_primary{background:var(--bg_brand_solid);color:var(--text_white)}
.btn_primary:hover,.btn_primary.is_hover{background:var(--bg_brand_solid_hover)}
.btn_secondary{background:var(--bg_brand_primary);color:var(--text_brand)}
.btn_secondary:hover,.btn_secondary.is_hover{background:var(--bg_brand_secondary)}
.btn_secondary_gray{background:var(--bg_primary);color:var(--text_secondary);border-color:var(--border_primary);box-shadow:var(--shadow_xs)}
.btn_secondary_gray:hover,.btn_secondary_gray.is_hover{background:var(--bg_secondary);color:var(--text_primary)}
.btn_tertiary{background:transparent;color:var(--text_brand)}
.btn_tertiary:hover,.btn_tertiary.is_hover{background:var(--bg_brand_primary)}
.btn_tertiary_gray{background:transparent;color:var(--text_tertiary)}
.btn_tertiary_gray:hover,.btn_tertiary_gray.is_hover{background:var(--bg_tertiary);color:var(--text_secondary)}
.btn_flat{background:var(--bg_tertiary);color:var(--text_secondary)}
.btn_flat:hover,.btn_flat.is_hover{background:var(--bg_quaternary);color:var(--text_primary)}
.btn_text{background:transparent;color:var(--text_brand_secondary);padding:0;height:auto;border-radius:4px}
.btn_text:hover,.btn_text.is_hover{color:var(--text_brand);text-decoration:underline}
.btn:focus-visible,.btn.is_focus{outline:none;box-shadow:var(--ring_brand)}
.btn_secondary_gray:focus-visible,.btn_secondary_gray.is_focus{box-shadow:var(--shadow_xs),var(--ring_brand)}
.btn:disabled,.btn.is_disabled{cursor:not-allowed;box-shadow:none;text-decoration:none;background:var(--bg_disabled);color:var(--text_disabled)}
.btn_secondary_gray:disabled{background:var(--bg_primary);border-color:var(--border_disabled)}
.btn_tertiary:disabled,.btn_tertiary_gray:disabled,.btn_text:disabled{background:transparent}
.btn.is_loading{pointer-events:none}
.btn_spinner{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:btn_spin .8s linear infinite}
@keyframes btn_spin{to{transform:rotate(360deg)}}

/* Form field */
.field{display:flex;flex-direction:column;gap:6px;font-family:var(--font_family)}
.field_label{font-size:14px;line-height:20px;font-weight:var(--fw_medium);color:var(--text_secondary)}
.field_required{color:var(--text_error)}
.field_hint{margin:0;font-size:14px;line-height:20px;color:var(--text_tertiary)}
.field_hint.is_error{color:var(--text_error)}
.field_hint.is_success{color:var(--text_success)}
.input{display:flex;align-items:center;gap:8px;height:44px;padding:0 14px;background:var(--bg_primary);--input_border:var(--border_primary);--input_border_hover:var(--border_hover);border:1px solid var(--input_border);border-radius:var(--radius_md);box-shadow:var(--shadow_xs);color:var(--text_primary)}
.input_sm{height:36px;padding:0 12px}
.input_strong{--input_border:var(--border_control);--input_border_hover:var(--border_control_hover)}
.input_field{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:0;font-family:inherit;font-size:16px;line-height:24px;color:var(--text_primary)}
.input_sm .input_field{font-size:14px;line-height:20px}
.input_field::placeholder{color:var(--text_placeholder)}
.input_icon{width:20px;height:20px;flex:none;color:var(--text_quaternary)}
.input_addon{display:flex;align-items:center;gap:4px;align-self:stretch;color:var(--text_tertiary);font-size:16px;line-height:24px;white-space:nowrap}
.input_addon_split{padding-right:12px;border-right:1px solid var(--border_primary)}
.input_action{display:flex;border:0;background:transparent;padding:4px;margin-right:-4px;border-radius:6px;color:var(--text_quaternary);cursor:pointer}
.input_action:hover{background:var(--bg_secondary);color:var(--text_secondary)}
.input:hover,.input.is_hover{border-color:var(--input_border_hover)}
.input:focus-within,.input.is_focus{border-color:var(--border_brand);box-shadow:var(--shadow_xs),var(--ring_gray)}
.input.is_error{border-color:var(--border_error_solid)}
.input.is_error:focus-within,.input.is_error.is_focus{box-shadow:var(--shadow_xs),var(--ring_error)}
.input.is_error .input_icon_status{color:var(--text_error)}
.input.is_success{border-color:var(--border_success_solid)}
.input.is_success .input_icon_status{color:var(--text_success)}
.input.is_disabled{background:var(--bg_secondary);border-color:var(--border_disabled);box-shadow:none}
.input.is_disabled .input_field,.input.is_disabled .input_icon{color:var(--text_disabled)}

/* Select and textarea */
select.input_field{appearance:none;cursor:pointer}
.input_textarea{height:auto;align-items:flex-start;padding:12px 14px}
.input_textarea .input_field{min-height:80px;resize:vertical}

/* Checkbox, radio, toggle */
.choice{display:flex;align-items:flex-start;gap:var(--space_3);cursor:pointer;font-family:var(--font_family)}
.choice_body{display:flex;flex-direction:column}
.choice_label{font-size:16px;line-height:24px;font-weight:var(--fw_medium);color:var(--text_secondary)}
.choice_hint{font-size:14px;line-height:20px;color:var(--text_tertiary)}
.check,.radio{appearance:none;margin:2px 0 0;width:20px;height:20px;flex:none;display:inline-grid;place-content:center;background:var(--bg_primary);border:1px solid var(--border_control);cursor:pointer}
.check{border-radius:var(--radius_sm)}
.radio{border-radius:var(--radius_full)}
.check:hover,.radio:hover,.check.is_hover,.radio.is_hover{border-color:var(--border_control_hover)}
.check:checked,.radio:checked,.check:indeterminate{background:var(--bg_brand_solid);border-color:var(--border_brand_solid)}
.check:checked::after{content:"";width:5px;height:10px;margin-top:-2px;border:solid var(--text_white);border-width:0 2px 2px 0;transform:rotate(45deg)}
.check:indeterminate::after{content:"";width:10px;height:2px;background:var(--text_white)}
.radio:checked::after{content:"";width:8px;height:8px;border-radius:var(--radius_full);background:var(--text_white)}
.toggle{appearance:none;margin:0;position:relative;width:44px;height:24px;flex:none;border-radius:var(--radius_full);background:var(--border_control);cursor:pointer;transition:background .15s}
.toggle::after{content:"";position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:var(--radius_full);background:var(--color_white);box-shadow:var(--shadow_sm);transition:transform .15s}
.toggle:hover,.toggle.is_hover{background:var(--border_control_hover)}
.toggle:checked{background:var(--bg_brand_solid)}
.toggle:checked:hover,.toggle:checked.is_hover{background:var(--bg_brand_solid_hover)}
.toggle:checked::after{transform:translateX(20px)}
.check:focus-visible,.radio:focus-visible,.toggle:focus-visible,.check.is_focus,.radio.is_focus,.toggle.is_focus{outline:none;box-shadow:var(--ring_brand)}
.check.is_error,.radio.is_error{border-color:var(--border_error_solid)}
.check:disabled,.radio:disabled,.toggle:disabled{opacity:.4;cursor:not-allowed}

/* Alert */
.alert{display:flex;align-items:flex-start;gap:var(--space_3);padding:var(--space_4);border:1px solid;border-radius:var(--radius_lg);font-family:var(--font_family);font-size:14px;line-height:20px;color:var(--text_secondary)}
.alert_icon{width:20px;height:20px;flex:none}
.alert_body{flex:1;display:flex;flex-direction:column;gap:var(--space_1)}
.alert_title{font-weight:var(--fw_semibold)}
.alert_actions{display:flex;gap:var(--space_4);margin-top:var(--space_2)}
.alert_link{border:0;background:none;padding:0;font:inherit;font-weight:var(--fw_semibold);color:inherit;text-decoration:underline;cursor:pointer}
.alert_close,.toast_close{display:flex;border:0;background:transparent;padding:2px;margin:-2px;border-radius:var(--radius_sm);color:var(--text_quaternary);cursor:pointer}
.alert_close svg,.toast_close svg{width:20px;height:20px}
.alert_close:focus-visible,.toast_close:focus-visible{outline:none;box-shadow:var(--ring_brand)}
.alert_success{background:var(--bg_success_primary);border-color:var(--border_success)}
.alert_success .alert_title,.alert_success .alert_icon{color:var(--text_success)}
.alert_info{background:var(--bg_info_primary);border-color:var(--border_info)}
.alert_info .alert_title,.alert_info .alert_icon{color:var(--text_info)}
.alert_warning{background:var(--bg_warning_primary);border-color:var(--border_warning)}
.alert_warning .alert_title,.alert_warning .alert_icon{color:var(--text_warning)}
.alert_error{background:var(--bg_error_primary);border-color:var(--border_error)}
.alert_error .alert_title,.alert_error .alert_icon{color:var(--text_error)}

/* Badge */
.badge{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:var(--radius_full);font-family:var(--font_family);font-size:12px;line-height:18px;font-weight:var(--fw_medium);white-space:nowrap}
.badge_dot::before{content:"";width:6px;height:6px;border-radius:var(--radius_full);background:currentColor}
.badge_neutral{background:var(--bg_tertiary);color:var(--text_secondary)}
.badge_brand{background:var(--bg_brand_primary);color:var(--text_brand)}
.badge_success{background:var(--bg_success_primary);color:var(--text_success)}
.badge_info{background:var(--bg_info_primary);color:var(--text_info)}
.badge_warning{background:var(--bg_warning_primary);color:var(--text_warning)}
.badge_error{background:var(--bg_error_primary);color:var(--text_error)}
.badge_solid_brand{background:var(--bg_brand_solid);color:var(--text_white)}
.badge_solid_success{background:var(--bg_success_solid);color:var(--text_white)}
.badge_solid_info{background:var(--bg_info_solid);color:var(--text_white)}
.badge_solid_warning{background:var(--bg_warning_solid);color:var(--text_white)}
.badge_solid_error{background:var(--bg_error_solid);color:var(--text_white)}

/* Toast */
.toast{display:flex;align-items:flex-start;gap:var(--space_3);width:360px;max-width:100%;padding:var(--space_4);background:var(--bg_elevated);border:1px solid var(--border_secondary);border-radius:var(--radius_lg);box-shadow:var(--shadow_lg);font-family:var(--font_family);font-size:14px;line-height:20px;color:var(--text_tertiary)}
.toast_icon{width:20px;height:20px;flex:none}
.toast_body{flex:1;display:flex;flex-direction:column;gap:var(--space_1)}
.toast_title{font-weight:var(--fw_semibold);color:var(--text_primary)}
.toast_success .toast_icon{color:var(--text_success)}
.toast_info .toast_icon{color:var(--text_info)}
.toast_warning .toast_icon{color:var(--text_warning)}
.toast_error .toast_icon{color:var(--text_error)}

@media (prefers-reduced-motion:reduce){.btn,.toggle,.toggle::after{transition:none}.btn_spinner{animation-duration:2s}}
```

### utilities.css

```css
html{font-family:var(--font_family)}
.fw_regular{font-weight:var(--fw_regular)}
.fw_medium{font-weight:var(--fw_medium)}
.fw_semibold{font-weight:var(--fw_semibold)}
.fw_bold{font-weight:var(--fw_bold)}
.display_2xl{font-size:var(--type_display_2xl_size);line-height:var(--type_display_2xl_line);letter-spacing:var(--type_display_2xl_tracking);font-weight:var(--fw_semibold)}
.display_xl{font-size:var(--type_display_xl_size);line-height:var(--type_display_xl_line);letter-spacing:var(--type_display_xl_tracking);font-weight:var(--fw_semibold)}
.display_lg{font-size:var(--type_display_lg_size);line-height:var(--type_display_lg_line);letter-spacing:var(--type_display_lg_tracking);font-weight:var(--fw_semibold)}
.display_md{font-size:var(--type_display_md_size);line-height:var(--type_display_md_line);letter-spacing:var(--type_display_md_tracking);font-weight:var(--fw_semibold)}
.display_sm{font-size:var(--type_display_sm_size);line-height:var(--type_display_sm_line);letter-spacing:var(--type_display_sm_tracking);font-weight:var(--fw_semibold)}
.display_xs{font-size:var(--type_display_xs_size);line-height:var(--type_display_xs_line);letter-spacing:var(--type_display_xs_tracking);font-weight:var(--fw_semibold)}
.text_xl{font-size:var(--type_text_xl_size);line-height:var(--type_text_xl_line);font-weight:var(--fw_regular)}
.text_lg{font-size:var(--type_text_lg_size);line-height:var(--type_text_lg_line);font-weight:var(--fw_regular)}
.text_md{font-size:var(--type_text_md_size);line-height:var(--type_text_md_line);font-weight:var(--fw_regular)}
.text_sm{font-size:var(--type_text_sm_size);line-height:var(--type_text_sm_line);font-weight:var(--fw_regular)}
.text_xs{font-size:var(--type_text_xs_size);line-height:var(--type_text_xs_line);font-weight:var(--fw_regular)}
.h1{font-size:var(--type_display_md_size);line-height:var(--type_display_md_line);letter-spacing:var(--type_display_md_tracking);font-weight:var(--fw_semibold)}
.h2{font-size:var(--type_display_sm_size);line-height:var(--type_display_sm_line);letter-spacing:var(--type_display_sm_tracking);font-weight:var(--fw_semibold)}
.h3{font-size:var(--type_display_xs_size);line-height:var(--type_display_xs_line);letter-spacing:var(--type_display_xs_tracking);font-weight:var(--fw_semibold)}
.h4{font-size:var(--type_text_xl_size);line-height:var(--type_text_xl_line);font-weight:var(--fw_semibold)}
.h5{font-size:var(--type_text_lg_size);line-height:var(--type_text_lg_line);font-weight:var(--fw_semibold)}
.h6{font-size:var(--type_text_md_size);line-height:var(--type_text_md_line);font-weight:var(--fw_semibold)}
.shadow_xs{box-shadow:var(--shadow_xs)}
.shadow_sm{box-shadow:var(--shadow_sm)}
.shadow_md{box-shadow:var(--shadow_md)}
.shadow_lg{box-shadow:var(--shadow_lg)}
.shadow_xl{box-shadow:var(--shadow_xl)}
.shadow_2xl{box-shadow:var(--shadow_2xl)}
.shadow_3xl{box-shadow:var(--shadow_3xl)}
.container{width:100%;max-width:var(--container_max);margin:0 auto;padding:0 var(--space_4)}
.layout_grid{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space_4)}
@media (min-width:640px){.container{padding:0 var(--space_6)}.layout_grid{grid-template-columns:repeat(8,1fr);gap:var(--space_6)}}
@media (min-width:1024px){.container{padding:0 var(--space_8)}.layout_grid{grid-template-columns:repeat(12,1fr)}}
```

### tokens.json

```json
{
  "base": {
    "white": "#FFFFFF",
    "black": "#000000"
  },
  "palette": {
    "brand": {
      "25": "#F8F8FF",
      "50": "#F0EFFE",
      "100": "#E1DFFC",
      "200": "#C5C1F7",
      "300": "#A39DEF",
      "400": "#7B72E0",
      "500": "#5547C9",
      "600": "#3D2FA6",
      "700": "#261C80",
      "800": "#160F5C",
      "900": "#06013A",
      "950": "#030120"
    },
    "neutral": {
      "25": "#FCFCFD",
      "50": "#F9FAFB",
      "100": "#F2F4F7",
      "200": "#E4E7EC",
      "300": "#D0D5DD",
      "400": "#98A2B3",
      "500": "#667085",
      "600": "#475467",
      "700": "#344054",
      "800": "#1D2939",
      "900": "#101828",
      "950": "#0C111D"
    },
    "success": {
      "25": "#F6FEF9",
      "50": "#ECFDF3",
      "100": "#D1FADF",
      "200": "#A6F4C5",
      "300": "#6CE9A6",
      "400": "#32D583",
      "500": "#12B76A",
      "600": "#039855",
      "700": "#027A48",
      "800": "#05603A",
      "900": "#054F31",
      "950": "#053321"
    },
    "info": {
      "25": "#F5FAFF",
      "50": "#EFF8FF",
      "100": "#D1E9FF",
      "200": "#B2DDFF",
      "300": "#84CAFF",
      "400": "#53B1FD",
      "500": "#2E90FA",
      "600": "#1570EF",
      "700": "#175CD3",
      "800": "#1849A9",
      "900": "#194185",
      "950": "#102A56"
    },
    "error": {
      "25": "#FFFBFA",
      "50": "#FEF3F2",
      "100": "#FEE4E2",
      "200": "#FECDCA",
      "300": "#FDA29B",
      "400": "#F97066",
      "500": "#F04438",
      "600": "#D92D20",
      "700": "#B42318",
      "800": "#912018",
      "900": "#7A271A",
      "950": "#55160C"
    },
    "warning": {
      "25": "#FFFCF5",
      "50": "#FFFAEB",
      "100": "#FEF0C7",
      "200": "#FEDF89",
      "300": "#FEC84B",
      "400": "#FDB022",
      "500": "#F79009",
      "600": "#DC6803",
      "700": "#B54708",
      "800": "#93370D",
      "900": "#7A2E0D",
      "950": "#4E1D09"
    }
  },
  "semantic": {
    "light": {
      "text_primary": "#101828",
      "text_secondary": "#344054",
      "text_tertiary": "#475467",
      "text_quaternary": "#667085",
      "text_placeholder": "#667085",
      "text_disabled": "#98A2B3",
      "text_white": "#FFFFFF",
      "text_brand": "#06013A",
      "text_brand_secondary": "#261C80",
      "text_success": "#027A48",
      "text_info": "#175CD3",
      "text_warning": "#B54708",
      "text_error": "#B42318",
      "bg_primary": "#FFFFFF",
      "bg_secondary": "#F9FAFB",
      "bg_tertiary": "#F2F4F7",
      "bg_quaternary": "#E4E7EC",
      "bg_elevated": "#FFFFFF",
      "bg_disabled": "#F2F4F7",
      "bg_brand_solid": "#06013A",
      "bg_brand_solid_hover": "#160F5C",
      "bg_brand_primary": "#F0EFFE",
      "bg_brand_secondary": "#E1DFFC",
      "bg_success_primary": "#ECFDF3",
      "bg_success_solid": "#027A48",
      "bg_info_primary": "#EFF8FF",
      "bg_info_solid": "#1570EF",
      "bg_warning_primary": "#FFFAEB",
      "bg_warning_solid": "#B54708",
      "bg_error_primary": "#FEF3F2",
      "bg_error_solid": "#D92D20",
      "bg_overlay": "#000000",
      "border_primary": "#D0D5DD",
      "border_secondary": "#E4E7EC",
      "border_tertiary": "#F2F4F7",
      "border_control": "#667085",
      "border_control_hover": "#475467",
      "border_hover": "#98A2B3",
      "border_disabled": "#E4E7EC",
      "border_brand": "#7B72E0",
      "border_brand_solid": "#06013A",
      "border_success": "#6CE9A6",
      "border_success_solid": "#039855",
      "border_info": "#84CAFF",
      "border_warning": "#FEC84B",
      "border_error": "#FDA29B",
      "border_error_solid": "#D92D20"
    },
    "dark": {
      "text_primary": "#F9FAFB",
      "text_secondary": "#E4E7EC",
      "text_tertiary": "#D0D5DD",
      "text_quaternary": "#98A2B3",
      "text_placeholder": "#98A2B3",
      "text_disabled": "#667085",
      "text_white": "#FFFFFF",
      "text_brand": "#A39DEF",
      "text_brand_secondary": "#C5C1F7",
      "text_success": "#32D583",
      "text_info": "#53B1FD",
      "text_warning": "#FDB022",
      "text_error": "#F97066",
      "bg_primary": "#0C111D",
      "bg_secondary": "#101828",
      "bg_tertiary": "#1D2939",
      "bg_quaternary": "#344054",
      "bg_elevated": "#1D2939",
      "bg_disabled": "#1D2939",
      "bg_brand_solid": "#3D2FA6",
      "bg_brand_solid_hover": "#5547C9",
      "bg_brand_primary": "#160F5C",
      "bg_brand_secondary": "#261C80",
      "bg_success_primary": "#053321",
      "bg_success_solid": "#027A48",
      "bg_info_primary": "#102A56",
      "bg_info_solid": "#1570EF",
      "bg_warning_primary": "#4E1D09",
      "bg_warning_solid": "#B54708",
      "bg_error_primary": "#55160C",
      "bg_error_solid": "#D92D20",
      "bg_overlay": "#000000",
      "border_primary": "#344054",
      "border_secondary": "#1D2939",
      "border_tertiary": "#101828",
      "border_control": "#667085",
      "border_control_hover": "#98A2B3",
      "border_hover": "#667085",
      "border_disabled": "#1D2939",
      "border_brand": "#7B72E0",
      "border_brand_solid": "#5547C9",
      "border_success": "#027A48",
      "border_success_solid": "#32D583",
      "border_info": "#175CD3",
      "border_warning": "#B54708",
      "border_error": "#B42318",
      "border_error_solid": "#F97066"
    }
  },
  "spacing": {
    "space_0": "0px",
    "space_1": "4px",
    "space_2": "8px",
    "space_3": "12px",
    "space_4": "16px",
    "space_5": "20px",
    "space_6": "24px",
    "space_8": "32px",
    "space_10": "40px",
    "space_12": "48px",
    "space_16": "64px"
  },
  "radius": {
    "radius_xs": "4px",
    "radius_sm": "6px",
    "radius_md": "8px",
    "radius_lg": "10px",
    "radius_xl": "12px",
    "radius_2xl": "16px",
    "radius_full": "9999px"
  }
}
```

## 15. AI assistant prompt

Paste this at the start of a session together with the three CSS files.

```
You are implementing UI from an existing design system with light and dark themes.

Rules:
1. Load tokens.css, components.css, and utilities.css before writing any UI. Add the theme snippet to the head so the html element gets the class theme_light or theme_dark.
2. Never hardcode hex values, font sizes, spacing, radius, or shadows. Use CSS variables only, for example var(--bg_brand_solid).
3. Use semantic tokens (text_, bg_, border_) in components. They switch automatically between light and dark, so never write separate dark mode styles. Use palette tokens (color_brand_900) or base colors (color_white, color_black) only when defining a new semantic token.
4. Buttons: class btn + variant + size. Variants: btn_primary, btn_secondary, btn_secondary_gray, btn_tertiary, btn_tertiary_gray, btn_flat, btn_text. Sizes: btn_sm, btn_md, btn_lg, btn_xl.
5. Inputs: wrap in .field with .field_label, .input (contains .input_icon, .input_field, .input_addon, .input_action) and .field_hint. Add input_strong to .input when a high contrast border is required.
6. States use is_error, is_success, is_disabled. Native hover and focus are already styled.
7. Controls: .check, .radio, .toggle inside .choice. Select and textarea use .input_field. Feedback: .alert_success, .alert_info, .alert_warning, .alert_error, .badge_*, .toast_*.
8. Use space_ tokens for every margin, padding, and gap, and radius_ tokens for corners.
9. Layout: .container and .layout_grid (4, 8, 12 columns). Keep focus rings visible and pair every error color with an icon and text.
10. All names use underscores.
11. If a value does not exist, add a token to tokens.css first, then use it. Do not invent one off values.
```
