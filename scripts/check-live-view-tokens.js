import fs from 'node:fs';
import path from 'node:path';

export function scanLiveViewTokens(targetDir = path.resolve('src')) {
  const liveFiles = [
    path.join(targetDir, 'pages', 'LiveViewPage.tsx'),
  ];

  const liveComponentsDir = path.join(targetDir, 'components', 'live');
  if (fs.existsSync(liveComponentsDir)) {
    const componentFiles = fs.readdirSync(liveComponentsDir)
      .filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))
      .map((f) => path.join(liveComponentsDir, f));
    liveFiles.push(...componentFiles);
  }

  const rules = [
    {
      name: 'Forbidden Color Literal (#hex)',
      regex: /#[0-9a-fA-F]{3,8}\b/,
      ignore: /data:image\/svg\+xml/,
    },
    {
      name: 'Forbidden Arbitrary Color Class',
      regex: /\b(?:bg|text|border|ring|shadow)-\[[^\]]+\]/,
    },
    {
      name: 'Forbidden Glass / Blur Class',
      regex: /\bbackdrop-blur(?:-[a-z0-9]+)?\b/,
    },
    {
      name: 'Forbidden Inline Shadow Class',
      regex: /\bshadow-(?:sm|md|lg|xl|primary|emerald|red|amber|blue)\b|\bshadow-\[[^\]]+\]/,
    },
    {
      name: 'Forbidden Font Size Outside Scale (24, 14, 12 only)',
      regex: /\btext-(?:base|lg|xl|3xl|4xl|5xl|\[(?:9|10|11|13|15|16|18|20|28|32)px\])\b/,
    },
    {
      name: 'Forbidden ExternalLink Icon on in-app navigation',
      regex: /\bExternalLink\b/,
    },
    {
      name: 'Forbidden Invented Wording ("Standby", "Camera fleet")',
      regex: /\b(?:Standby|Camera fleet)\b/,
    },
  ];

  const violations = [];

  for (const file of liveFiles) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      if (lineText.trim().startsWith('//') || lineText.trim().startsWith('/*')) continue;

      for (const rule of rules) {
        if (rule.ignore && rule.ignore.test(lineText)) continue;
        const match = lineText.match(rule.regex);
        if (match) {
          violations.push({
            file: path.relative(process.cwd(), file),
            line: i + 1,
            pattern: rule.name,
            match: match[0],
            code: lineText.trim(),
          });
        }
      }
    }
  }

  return { violations, filesScanned: liveFiles.length };
}

if (process.argv[1] && process.argv[1].endsWith('check-live-view-tokens.js')) {
  const { violations, filesScanned } = scanLiveViewTokens();
  console.log(`Scanned ${filesScanned} Live View files.`);
  if (violations.length === 0) {
    console.log('✅ Token Guard Passed: 0 forbidden patterns found in Live View.');
    process.exit(0);
  } else {
    console.warn(`⚠️ Token Guard: ${violations.length} violations found:`);
    for (const v of violations) {
      console.warn(`  [${v.pattern}] ${v.file}:${v.line} -> "${v.match}" in: ${v.code}`);
    }
    if (process.argv.includes('--fail')) {
      process.exit(1);
    }
  }
}
