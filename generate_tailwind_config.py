import re

with open('src/styles/tokens.css', 'r') as f:
    content = f.read()

def convert_to_tailwind(prefix):
    matches = re.findall(rf'--{prefix}_([a-zA-Z0-9_]+)', content)
    unique_matches = sorted(list(set(matches)))
    return unique_matches

bg_tokens = convert_to_tailwind('bg')
text_tokens = convert_to_tailwind('text')
border_tokens = convert_to_tailwind('border')

bg_colors = []
for t in bg_tokens:
    name = t.replace('_', '-')
    bg_colors.append(f"        '{name}': 'var(--bg_{t})',")

text_colors = []
for t in text_tokens:
    name = t.replace('_', '-')
    text_colors.append(f"        '{name}': 'var(--text_{t})',")

border_colors = []
for t in border_tokens:
    name = t.replace('_', '-')
    border_colors.append(f"        '{name}': 'var(--border_{t})',")

config_template = f"""import type {{ Config }} from 'tailwindcss'

const config: Config = {{
  content: [
    "./index.html",
    "./src/**/*.{{js,ts,jsx,tsx}}",
  ],
  theme: {{
    extend: {{
      backgroundColor: {{
{chr(10).join(bg_colors)}
        card: 'var(--bg_elevated)',
        popover: 'var(--bg_elevated)',
        muted: 'var(--bg_tertiary)',
        accent: 'var(--bg_tertiary)',
        destructive: 'var(--bg_error_solid)',
      }},
      textColor: {{
{chr(10).join(text_colors)}
        foreground: 'var(--text_primary)',
        'muted-foreground': 'var(--text_tertiary)',
        'primary-foreground': 'var(--text_white)',
      }},
      borderColor: {{
{chr(10).join(border_colors)}
        DEFAULT: 'var(--border_secondary)',
        input: 'var(--border_primary)',
        border: 'var(--border_primary)',
      }},
      ringColor: {{
        brand: 'var(--border_brand)',
      }},
      borderRadius: {{
        lg: 'var(--radius_md)',
        md: 'calc(var(--radius_md) - 2px)',
        sm: 'calc(var(--radius_md) - 4px)',
      }},
    }},
  }},
  plugins: [],
}}
export default config
"""

with open('tailwind.config.ts', 'w') as f:
    f.write(config_template)

