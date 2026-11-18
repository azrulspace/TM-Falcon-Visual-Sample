import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '/Users/uxazrul/.gemini/antigravity/brain/8147fae6-d6b2-4566-81fa-29ce71037743/screenshots/event_detail';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const VIEWPORTS = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1180', width: 1180, height: 820 },
  { name: '820', width: 820, height: 1180 },
  { name: '390', width: 390, height: 844 },
];

async function main() {
  const p = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9226',
    'about:blank'
  ]);

  let targets;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 600));
    try {
      const res = await fetch('http://127.0.0.1:9226/json');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (_e) {}
  }
  const target = targets?.find(t => t.type === 'page');
  if (!target) {
    p.kill();
    throw new Error('Could not connect to Chrome on 9226');
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  console.log('--- 1. AUDITING COMPUTED STYLES (EVT-0258) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: 'http://localhost:5173/events/EVT-0258' });
  await new Promise(r => setTimeout(r, 2000));

  // Dark theme audit
  const darkAudit = await send('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.className = 'theme_dark dark';
      document.documentElement.setAttribute('data-theme', 'dark');

      const elements = Array.from(document.querySelectorAll('main *'));
      const fontSizes = new Set();
      const fontFamilies = new Set();
      let lowContrastCount = 0;
      let smallHitTargets = 0;

      function getLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function parseRgb(colorStr) {
        const m = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
        return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
      }

      function getContrastRatio(fgStr, bgStr) {
        const fg = parseRgb(fgStr);
        const bg = parseRgb(bgStr);
        if (!fg || !bg) return 21;
        const l1 = getLuminance(...fg);
        const l2 = getLuminance(...bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }

      for (const el of elements) {
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;

        if (el.textContent && el.textContent.trim().length > 0 && el.children.length === 0) {
          fontSizes.add(cs.fontSize);
          const fam = cs.fontFamily.includes('JetBrains') || cs.fontFamily.includes('mono') ? 'JetBrains Mono' : 'Inter';
          fontFamilies.add(fam);

          // Contrast check against card or body background
          let parent = el.parentElement;
          let bg = 'rgb(15, 16, 17)';
          while (parent && parent !== document.body) {
            const pcs = window.getComputedStyle(parent);
            if (pcs.backgroundColor && pcs.backgroundColor !== 'rgba(0, 0, 0, 0)' && pcs.backgroundColor !== 'transparent') {
              bg = pcs.backgroundColor;
              break;
            }
            parent = parent.parentElement;
          }
          const ratio = getContrastRatio(cs.color, bg);
          if (ratio < 4.5 && parseFloat(cs.fontSize) < 18) {
            lowContrastCount++;
          }
        }

        if (['BUTTON', 'A', 'INPUT'].includes(el.tagName) || el.getAttribute('role') === 'button' || el.getAttribute('role') === 'tab') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && (rect.width < 31 || rect.height < 31)) {
            smallHitTargets++;
          }
        }
      }

      return {
        fontSizes: Array.from(fontSizes).sort((a,b) => parseFloat(a) - parseFloat(b)),
        fontFamilies: Array.from(fontFamilies),
        lowContrastCount,
        smallHitTargets
      };
    })()`,
    returnByValue: true
  });

  console.log('Dark Theme Audit Result:', JSON.stringify(darkAudit.result.value, null, 2));

  console.log('--- 2. CAPTURING RESPONSIVE SCREENSHOT SUITE ---');

  const capturePage = async (url, vp, theme, filename, stagingV1 = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 600,
    });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1500));

    await send('Runtime.evaluate', {
      expression: `
        if ('${theme}' === 'light') {
          document.documentElement.className = 'theme_light';
          document.documentElement.setAttribute('data-theme', 'light');
        } else {
          document.documentElement.className = 'theme_dark dark';
          document.documentElement.setAttribute('data-theme', 'dark');
        }
        if (${stagingV1}) {
          document.documentElement.classList.add('staging-v1-active');
        } else {
          document.documentElement.classList.remove('staging-v1-active');
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
    console.log(`Saved screenshot: ${filename} (${vp.width}x${vp.height}, ${theme}${stagingV1 ? ', Staging V1' : ''})`);
  };

  // EVT-0258 across viewports
  for (const vp of VIEWPORTS) {
    for (const theme of ['dark', 'light']) {
      await capturePage(
        'http://localhost:5173/events/EVT-0258',
        vp,
        theme,
        `evt0258_${theme}_${vp.name}.png`
      );
    }
  }

  // EVT-0445 (alternate event with parking lot detection) at 1440 dark and light
  await capturePage(
    'http://localhost:5173/events/EVT-0445',
    { name: '1440', width: 1440, height: 900 },
    'dark',
    'evt0445_dark_1440.png'
  );
  await capturePage(
    'http://localhost:5173/events/EVT-0445',
    { name: '1440', width: 1440, height: 900 },
    'light',
    'evt0445_light_1440.png'
  );

  // Staging V1 Dual-Palette Verification at 1440 dark
  console.log('--- 3. VERIFYING DUAL-PALETTE STAGING V1 ---');
  await capturePage(
    'http://localhost:5173/events/EVT-0258',
    { name: '1440', width: 1440, height: 900 },
    'dark',
    'evt0258_staging_v1_1440.png',
    true
  );

  ws.close();
  p.kill();
  console.log('All audits and screenshots completed successfully!');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
