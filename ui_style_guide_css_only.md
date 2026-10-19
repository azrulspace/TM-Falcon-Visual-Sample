# UI Style Guide: CSS Only

Compact version of the style guide for code generation. Create the files below exactly as written. Do not edit the values. Light and dark mode are controlled by the class theme_light or theme_dark on the html element. All names use underscores.

## Rules

1. Never hardcode hex values, font sizes, spacing, radius, or shadows. Use CSS variables written as var(name) with the standard double dash prefix.
2. Use semantic tokens (text_, bg_, border_) in components. Semantic tokens switch automatically between light and dark.
3. Buttons: class btn, one variant, one size. Variants: btn_primary, btn_secondary, btn_secondary_gray, btn_tertiary, btn_tertiary_gray, btn_flat, btn_text. Sizes: btn_sm, btn_md, btn_lg, btn_xl. Icon only: add btn_icon_only. Loading: add is_loading and a span with class btn_spinner.
4. Fields: div.field containing label.field_label, div.input (children: svg.input_icon, input.input_field or select.input_field, span.input_addon, button.input_action) and p.field_hint. States: is_error, is_success, is_disabled. Sizes: input_sm. Textarea: input_textarea. Strong border option: input_strong.
5. Controls: label.choice containing input.check, input.radio, or input.toggle and span.choice_body with span.choice_label and span.choice_hint.
6. Feedback: div.alert with alert_success, alert_info, alert_warning, or alert_error (children alert_icon, alert_body, alert_title, alert_actions, alert_close). Badges: badge with badge_neutral, badge_brand, badge_success, badge_info, badge_warning, badge_error, add badge_dot for a dot, or badge_solid_success and similar for solid. Toasts: toast with toast_success, toast_info, toast_warning, or toast_error (children toast_icon, toast_body, toast_title, toast_close).
7. Typography classes: display_2xl to display_xs, h1 to h6, text_xl to text_xs, fw_regular, fw_medium, fw_semibold, fw_bold. Shadow classes: shadow_xs to shadow_3xl. Layout: container, layout_grid (4, 8, 12 columns).
8. Spacing tokens: space_0 to space_16 (4px base). Radius tokens: radius_xs, radius_sm, radius_md, radius_lg, radius_xl, radius_2xl, radius_full.

## index.html head

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<script>
(function () {
  var t;
  try { t = localStorage.getItem("ds_theme"); } catch (e) {}
  if (!t) t = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.classList.add("theme_" + t);
})();

</script>
```

## Theme switch (used by the header button)

```js
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

## src/styles/tokens.css

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
  --color_neutral_dark_25:#F7F7F8;
  --color_neutral_dark_50:#EEEFF1;
  --color_neutral_dark_100:#E3E4E8;
  --color_neutral_dark_200:#CDCED5;
  --color_neutral_dark_300:#B7B8C3;
  --color_neutral_dark_400:#9B9CAB;
  --color_neutral_dark_500:#74768B;
  --color_neutral_dark_600:#58596A;
  --color_neutral_dark_700:#41424E;
  --color_neutral_dark_800:#33343D;
  --color_neutral_dark_900:#27282F;
  --color_neutral_dark_950:#1E1F24;
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
  --text_primary:var(--color_neutral_dark_100);
  --text_secondary:var(--color_neutral_dark_200);
  --text_tertiary:var(--color_neutral_dark_300);
  --text_quaternary:var(--color_neutral_dark_400);
  --text_placeholder:var(--color_neutral_dark_400);
  --text_disabled:var(--color_neutral_dark_600);
  --text_white:var(--color_white);
  --text_brand:var(--color_brand_300);
  --text_brand_secondary:var(--color_brand_200);
  --text_success:var(--color_success_400);
  --text_info:var(--color_info_400);
  --text_warning:var(--color_warning_400);
  --text_error:var(--color_error_400);

  /* Background */
  --bg_primary:var(--color_neutral_dark_950);
  --bg_secondary:var(--color_neutral_dark_900);
  --bg_tertiary:var(--color_neutral_dark_800);
  --bg_quaternary:var(--color_neutral_dark_700);
  --bg_elevated:var(--color_neutral_dark_800);
  --bg_disabled:var(--color_neutral_dark_800);
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
  --border_primary:var(--color_neutral_dark_700);
  --border_secondary:var(--color_neutral_dark_800);
  --border_tertiary:var(--color_neutral_dark_900);
  --border_control:var(--color_neutral_dark_500);
  --border_control_hover:var(--color_neutral_dark_400);
  --border_hover:var(--color_neutral_dark_500);
  --border_disabled:var(--color_neutral_dark_800);
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

## src/styles/app_tokens.css

```css
:root,
:root.theme_light {
  /* Sidebar and auth panel */
  --bg_sidebar: var(--color_brand_900);
  --bg_sidebar_hover: var(--color_brand_800);
  --bg_sidebar_active: var(--color_brand_700);
  --text_sidebar: var(--color_brand_100);
  --text_sidebar_muted: var(--color_brand_300);
  --text_sidebar_active: var(--color_white);
  --border_sidebar: var(--color_brand_800);
  --bg_auth_panel: var(--color_brand_900);
  --bg_auth_glow: var(--color_brand_700);

  /* Status accents */
  --border_warning_solid: var(--color_warning_600);
  --bg_neutral_solid: var(--color_neutral_600);

  /* Illustrated map */
  --bg_map: var(--color_neutral_100);
  --map_block: var(--color_neutral_50);
  --map_road: var(--color_white);
  --map_label: var(--color_neutral_500);
  --map_route: var(--color_brand_700);

  /* Misc */
  --tracking_wide: 0.06em;
}

:root.theme_dark {
  --bg_sidebar: var(--color_brand_900);
  --bg_sidebar_hover: var(--color_brand_800);
  --bg_sidebar_active: var(--color_brand_700);
  --text_sidebar: var(--color_brand_100);
  --text_sidebar_muted: var(--color_brand_300);
  --text_sidebar_active: var(--color_white);
  --border_sidebar: var(--color_brand_800);
  --bg_auth_panel: var(--color_brand_900);
  --bg_auth_glow: var(--color_brand_700);

  --border_warning_solid: var(--color_warning_400);
  --bg_neutral_solid: var(--color_neutral_dark_500);

  --bg_map: var(--color_neutral_dark_900);
  --map_block: var(--color_neutral_dark_950);
  --map_road: var(--color_neutral_dark_800);
  --map_label: var(--color_neutral_dark_400);
  --map_route: var(--color_brand_300);
}
```

## src/styles/components.css

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
.check:hover,.radio:hover,.check.is_hover,.radio.is_hover{border-color:var(--border_brand_solid);background:var(--bg_brand_primary)}
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

## src/styles/utilities.css

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
