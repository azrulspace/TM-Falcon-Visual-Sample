import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const outDir = '/Users/uxazrul/.gemini/antigravity/brain/8147fae6-d6b2-4566-81fa-29ce71037743/screenshots/live_view';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  const setTheme = async (theme) => {
    await send('Runtime.evaluate', {
      expression: `
        localStorage.setItem('ds_theme', '${theme}');
        if ('${theme}' === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.add('theme_dark');
          document.documentElement.classList.remove('theme_light');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.remove('theme_dark');
          document.documentElement.classList.add('theme_light');
          document.documentElement.setAttribute('data-theme', 'light');
        }
      `
    });
  };

  // 1. DEV-001 Online (Idle / Ready)
  for (const theme of ['dark', 'light']) {
    await send('Page.navigate', { url: 'http://localhost:5173/live/single/DEV-001?demo=online' });
    await new Promise(r => setTimeout(r, 1500));
    await setTheme(theme);
    await new Promise(r => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filename = `live_online_dev001_idle_${theme}_1440.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`Captured ${filename}`);
  }

  // 2. DEV-001 Online (Active Playing Stream)
  for (const theme of ['dark', 'light']) {
    await send('Page.navigate', { url: 'http://localhost:5173/live/single/DEV-001?demo=online&autostart=1' });
    await new Promise(r => setTimeout(r, 3200));
    await setTheme(theme);
    await new Promise(r => setTimeout(r, 1200));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filename = `live_online_dev001_streaming_${theme}_1440.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`Captured ${filename}`);
  }

  // 3. DEV-002 Offline (showing offline state card, last contact 28d ago)
  for (const theme of ['dark', 'light']) {
    await send('Page.navigate', { url: 'http://localhost:5173/live/single/DEV-002?demo=online' });
    await new Promise(r => setTimeout(r, 1500));
    await setTheme(theme);
    await new Promise(r => setTimeout(r, 600));

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filename = `live_offline_dev002_${theme}_1440.png`;
    fs.writeFileSync(path.join(outDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`Captured ${filename}`);
  }

  ws.close();
  p.kill();
  console.log('Finished capturing demo screenshots.');
}

capture().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
