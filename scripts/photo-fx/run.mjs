// 사진 가공 실행기. headless Chrome에서 fx.html을 열고 작업 목록대로 JPEG를 만든다.
// 쓰는 법: node scripts/photo-fx/run.mjs <jobs.json> (fx.html과 사진이 http://localhost:5310 아래에 있어야 한다)
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const jobs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9334 + (process.pid % 500);
const profile = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'chrome-profile-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: jobs.base + '/scripts/photo-fx/fx.html' });
  await sleep(800);
  for (const job of jobs.items) {
    const r = await send('Runtime.evaluate', { expression: `fx(${JSON.stringify({ ...job, src: jobs.base + '/' + job.src })})`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) { console.error('ERROR', job.out, JSON.stringify(r.exceptionDetails).slice(0, 300)); continue; }
    const b64 = r.result.value.split(',')[1];
    writeFileSync(job.out, Buffer.from(b64, 'base64'));
    console.log('saved', job.out, Math.round(b64.length * 0.75 / 1024) + 'KB');
  }
} catch (e) { console.error('ERROR', e.message); process.exitCode = 1; }
finally { try { ws && ws.close(); } catch {} chrome.kill('SIGTERM'); }
