// README 이미지 캡처용 최소 CDP 드라이버. headless Chrome을 띄워 JSON 계획대로 화면을 누르고 캡처한다.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [planPath, outDir] = process.argv.slice(2);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9333;
const profile = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'chrome-profile-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const mid = ++id; pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error('eval error: ' + JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result && r.result.value;
}
const DUMP = `(() => {
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const btns = [...document.querySelectorAll('button, [role=button], a')].filter(vis).map(b => (b.getAttribute('aria-label') || b.textContent || '').trim().replace(/\\s+/g,' ').slice(0,60));
  const inputs = [...document.querySelectorAll('input, textarea, select')].filter(vis).map(i => ({ type: i.type, name: i.name, id: i.id, ph: i.placeholder, aria: i.getAttribute('aria-label'), label: (i.labels && i.labels[0] ? i.labels[0].textContent.trim().slice(0,40) : '') }));
  const h = [...document.querySelectorAll('h1,h2,h3')].filter(vis).map(x => x.textContent.trim().slice(0,60));
  return { url: location.href, headings: h, buttons: btns, inputs };
})()`;
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); target = list.find(t => t.type === 'page'); } catch {}
  }
  if (!target) throw new Error('no chrome target');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Network.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' });
  for (const step of plan.steps) {
    if (step.goto) { await send('Page.navigate', { url: step.goto }); await sleep(step.wait || 2500); }
    if (step.eval) { const v = await evaluate(step.eval); if (step.print) console.log(step.label || 'eval', JSON.stringify(v)); await sleep(step.wait || 600); }
    if (step.dump) { console.log('DUMP', step.label || '', JSON.stringify(await evaluate(DUMP))); }
    if (step.saveEval) {
      const v = await evaluate(step.saveEval);
      if (typeof v === 'string' && v.startsWith('data:')) { const b64 = v.split(',')[1]; writeFileSync(join(outDir, step.file), Buffer.from(b64, 'base64')); console.log('saved', step.file, Math.round(b64.length*0.75/1024)+'KB'); }
      else console.log('saveEval-nodata', step.file, JSON.stringify(v).slice(0,300));
      await sleep(step.wait || 400);
    }
    if (step.shot) {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
      writeFileSync(join(outDir, step.shot), Buffer.from(r.data, 'base64')); console.log('saved', step.shot);
    }
  }
} catch (e) { console.error('ERROR', e.message); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} chrome.kill('SIGTERM'); }
