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
    '--remote-debugging-port=9228',
    'about:blank',
  ]);

  let targets;
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const res = await fetch('http://127.0.0.1:9228/json');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (_e) {}
  }
  const target = targets?.find((t) => t.type === 'page');
  if (!target) {
    p.kill();
    throw new Error('Could not connect to Chrome on 9228');
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const send = (method, params = {}) =>
    new Promise((resolve) => {
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
      `,
    });
  };

  const setViewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
  };

  try {
    await setViewport(1440, 960);
    await send('Page.navigate', { url: 'http://localhost:5173/live/monitor/grp-all?demo=online' });
    await new Promise((r) => setTimeout(r, 2500));
    await setTheme('dark');
    await new Promise((r) => setTimeout(r, 600));

    // 1. Monitor Wall Idle (Dark)
    const shotIdle = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_idle_1440.png'), Buffer.from(shotIdle.data, 'base64'));
    console.log('Saved live_monitor_dark_idle_1440.png');

    // 2. Click Start all
    const startRes = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start all'));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `,
    });
    console.log('Start all clicked:', startRes.result?.value);

    // Wait 3.5s for video playback to stabilize and frames to draw
    await new Promise((r) => setTimeout(r, 3500));

    // 3. Monitor Wall Streaming (Dark)
    const shotDarkStreaming = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_1440.png'), Buffer.from(shotDarkStreaming.data, 'base64'));
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_streaming_1440.png'), Buffer.from(shotDarkStreaming.data, 'base64'));
    console.log('Saved live_monitor_dark_1440.png & live_monitor_dark_streaming_1440.png');

    // 4. Monitor Wall Streaming (Light)
    await setTheme('light');
    await new Promise((r) => setTimeout(r, 800));
    const shotLightStreaming = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_light_1440.png'), Buffer.from(shotLightStreaming.data, 'base64'));
    console.log('Saved live_monitor_light_1440.png');

    // 5. Spotlight View (Dark)
    await setTheme('dark');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const spotlightBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Spotlight'));
          if (spotlightBtn) {
            spotlightBtn.click();
            return true;
          }
          return false;
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const shotSpotlight = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_spotlight_dark_1440.png'), Buffer.from(shotSpotlight.data, 'base64'));
    console.log('Saved live_monitor_spotlight_dark_1440.png');

    // 6. Exit spotlight and test Online filter
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Exit spotlight'));
          if (exitBtn) exitBtn.click();
          const onlineBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Online'));
          if (onlineBtn) onlineBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 1200));
    const shotOnline = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_filter_online_1440.png'), Buffer.from(shotOnline.data, 'base64'));
    console.log('Saved live_monitor_filter_online_1440.png');

    // Switch back to All filter
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const allBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All'));
          if (allBtn) allBtn.click();
        })()
      `,
    });
    await new Promise((r) => setTimeout(r, 600));

    // 7. Responsive Viewports
    await setViewport(1180, 840);
    await new Promise((r) => setTimeout(r, 600));
    const shot1180 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_1180.png'), Buffer.from(shot1180.data, 'base64'));
    console.log('Saved live_monitor_dark_1180.png');

    await setViewport(820, 840);
    await new Promise((r) => setTimeout(r, 600));
    const shot820 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_820.png'), Buffer.from(shot820.data, 'base64'));
    console.log('Saved live_monitor_dark_820.png');

    await setViewport(390, 844);
    await new Promise((r) => setTimeout(r, 600));
    const shot390 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, 'live_monitor_dark_390.png'), Buffer.from(shot390.data, 'base64'));
    console.log('Saved live_monitor_dark_390.png');

    console.log('Finished capturing all monitor wall screenshots.');
  } finally {
    ws.close();
    p.kill();
  }
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
