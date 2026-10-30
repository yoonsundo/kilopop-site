// 시안 전체 화면 캡처. headless Chrome으로 페이지 전체 길이를 PNG로 찍는다.
// 쓰는 법: node scripts/capture/fullpage.mjs <url> <out.png> <width> [mobile:1|0] [최대 높이]
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [url, out, width = '390', mobileArg = '1', maxH = '0'] = process.argv.slice(2);
const mobile = mobileArg === '1';
const w = Number(width);
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9334 + (process.pid % 500);
const profile = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'chrome-profile-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--window-size=${w},900`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params }));
});
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {}
  }
  if (!target) throw new Error('no chrome target');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  const h = mobile ? 844 : 900;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Page.navigate', { url });
  await sleep(2500);
  // 지연 로딩 이미지를 모두 불러오도록 끝까지 내렸다가 올린다
  await send('Runtime.evaluate', { expression: `(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);await document.fonts.ready;})()`, awaitPromise: true });
  // 긴 화면을 한 번에 찍으면 sticky 머리글이 중간에 찍히므로 캡처할 때만 제자리에 둔다
  await send('Runtime.evaluate', { expression: `document.querySelectorAll('*').forEach(e=>{if(getComputedStyle(e).position==='sticky')e.style.position='relative'})` });
  await sleep(800);
  const { result } = await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true });
  const height = Number(maxH) > 0 ? Math.min(Number(maxH), result.value) : result.value;
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height, scale: 1 } });
  writeFileSync(out, Buffer.from(r.data, 'base64'));
  console.log('saved', out, w + 'x' + height);
} catch (e) { console.error('ERROR', e.message); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} chrome.kill('SIGTERM'); }
