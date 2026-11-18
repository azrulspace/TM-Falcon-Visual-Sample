import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '/Users/uxazrul/.gemini/antigravity/brain/8147fae6-d6b2-4566-81fa-29ce71037743/screenshots/live_view';
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

async function capture() {
  const p = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9225',
    'about:blank'
  ]);

  let targets;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 600));
    try {
      const res = await fetch('http://127.0.0.1:9225/json');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (_e) {}
  }
  const target = targets?.find(t => t.type === 'page');
  if (!target) {
    p.kill();
    throw new Error('Could not connect to Chrome on 9225');
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === curId) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await send('Page.enable');
  await send('DOM.enable');

  const modes = [
    { url: 'http://localhost:5173/live/single/DEV-001', prefix: 'live_single' },
    { url: 'http://localhost:5173/live/single/DEV-004', prefix: 'live_offline_dev004' },
    { url: 'http://localhost:5173/live/monitor', prefix: 'live_monitor' },
  ];

  for (const vp of VIEWPORTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 600,
    });

    for (const theme of ['dark', 'light']) {
      for (const m of modes) {
        // Only capture key ones across viewports to keep runtime fast
        if (m.prefix === 'live_offline_dev004' && vp.name !== '1920') continue;
        if (m.prefix === 'live_monitor' && !['1920', '1180', '390'].includes(vp.name)) continue;

        await send('Page.navigate', { url: m.url });
        await new Promise(r => setTimeout(r, 1200));

        // Set theme
        await send('Runtime.evaluate', {
          expression: `
            if ('${theme}' === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.add('theme_dark');
              document.documentElement.classList.remove('theme_light');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.remove('theme_dark');
              document.documentElement.classList.add('theme_light');
            }
          `
        });
        await new Promise(r => setTimeout(r, 600));

        const shot = await send('Page.captureScreenshot', { format: 'png' });
        const filename = `${m.prefix}_${theme}_${vp.name}.png`;
        const filePath = path.join(outDir, filename);
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log(`Captured ${filename} (${vp.width}x${vp.height})`);
      }
    }
  }

  ws.close();
  p.kill();
  console.log('Finished capturing screenshots.');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
