import { spawn } from 'node:child_process';

async function runAudit() {
  const p = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--remote-debugging-port=9224',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  let res, targets;
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 600));
    try {
      res = await fetch('http://127.0.0.1:9224/json');
      targets = await res.json();
      if (targets && targets.length > 0) break;
    } catch (_e) {}
  }
  let target = targets?.find(t => t.type === 'page');
  if (!target) {
    p.kill();
    throw new Error('Could not connect to Chrome debugging port 9224');
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise(r => { ws.onopen = r; });
  await send('Page.enable');
  await send('Runtime.enable');

  async function auditTheme(theme) {
    await send('Page.navigate', { url: 'http://localhost:5173/live/single/DEV-001' });
    await new Promise(r => setTimeout(r, 2000));

    if (theme === 'light') {
      await send('Runtime.evaluate', {
        expression: `
          document.documentElement.className = 'theme_light';
          document.documentElement.setAttribute('data-theme', 'light');
        `
      });
      await new Promise(r => setTimeout(r, 1000));
    } else {
      await send('Runtime.evaluate', {
        expression: `
          document.documentElement.className = 'theme_dark dark';
          document.documentElement.setAttribute('data-theme', 'dark');
        `
      });
      await new Promise(r => setTimeout(r, 1000));
    }

    const evalResult = await send('Runtime.evaluate', {
      expression: `(() => {
        const elements = Array.from(document.querySelectorAll('main *'));
        const stats = {
          borderColors: new Set(),
          bgColors: new Set(),
          textColors: new Set(),
          boxShadows: new Set(),
          backdropFilters: new Set(),
          borderRadii: new Set(),
          fontFamilies: new Set(),
          fontSizes: new Set(),
          fontWeights: new Set(),
        };

        for (const el of elements) {
          const cs = window.getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;

          if (cs.borderWidth !== '0px' && cs.borderStyle !== 'none') {
            stats.borderColors.add(cs.borderColor);
          }
          if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') {
            stats.bgColors.add(cs.backgroundColor);
          }
          if (cs.color) stats.textColors.add(cs.color);
          if (cs.boxShadow && cs.boxShadow !== 'none') stats.boxShadows.add(cs.boxShadow);
          if (cs.backdropFilter && cs.backdropFilter !== 'none') stats.backdropFilters.add(cs.backdropFilter);
          if (cs.borderRadius && cs.borderRadius !== '0px') stats.borderRadii.add(cs.borderRadius);
          if (cs.fontFamily) stats.fontFamilies.add(cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim());
          if (cs.fontSize) stats.fontSizes.add(cs.fontSize);
          if (cs.fontWeight) stats.fontWeights.add(cs.fontWeight);
        }

        return {
          borderColors: Array.from(stats.borderColors),
          bgColors: Array.from(stats.bgColors),
          textColors: Array.from(stats.textColors),
          boxShadows: Array.from(stats.boxShadows),
          backdropFilters: Array.from(stats.backdropFilters),
          borderRadii: Array.from(stats.borderRadii),
          fontFamilies: Array.from(stats.fontFamilies),
          fontSizes: Array.from(stats.fontSizes),
          fontWeights: Array.from(stats.fontWeights),
        };
      })()`,
      returnByValue: true
    });

    return evalResult.result.value;
  }

  console.log('Auditing Dark Theme computed styles...');
  const darkStats = await auditTheme('dark');

  console.log('Auditing Light Theme computed styles...');
  const lightStats = await auditTheme('light');

  console.log('\n--- COMPUTED STYLE AUDIT RESULTS ---');
  console.log('Dark Theme:');
  console.log('  Border Colors:', darkStats.borderColors.length, darkStats.borderColors);
  console.log('  Box Shadows:', darkStats.boxShadows.length, darkStats.boxShadows);
  console.log('  Backdrop Filters:', darkStats.backdropFilters.length, darkStats.backdropFilters);
  console.log('  Border Radii:', darkStats.borderRadii.length, darkStats.borderRadii);
  console.log('  Font Sizes:', darkStats.fontSizes.length, darkStats.fontSizes);
  console.log('  Font Families:', darkStats.fontFamilies.length, darkStats.fontFamilies);

  console.log('\nLight Theme:');
  console.log('  Border Colors:', lightStats.borderColors.length, lightStats.borderColors);
  console.log('  Box Shadows:', lightStats.boxShadows.length, lightStats.boxShadows);
  console.log('  Backdrop Filters:', lightStats.backdropFilters.length, lightStats.backdropFilters);
  console.log('  Border Radii:', lightStats.borderRadii.length, lightStats.borderRadii);
  console.log('  Font Sizes:', lightStats.fontSizes.length, lightStats.fontSizes);
  console.log('  Font Families:', lightStats.fontFamilies.length, lightStats.fontFamilies);

  ws.close();
  p.kill();

  return { darkStats, lightStats };
}

runAudit().catch(console.error);
