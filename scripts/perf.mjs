// 모바일 성능과 접근성 측정. headless Chrome에 느린 4G·CPU 4배 감속을 걸고 LCP·CLS·전송량을 재고, axe-core로 접근성 위반을 찾는다.
// 쓰는 법: node scripts/perf.mjs [기준 주소=http://localhost:5311]  (dist를 먼저 띄워 둔다: npm run serve)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = (process.argv[2] || 'http://localhost:5311').replace(/\/$/, '');
const paths = ['/', '/guide/running-photo/', '/templates/', '/privacy/'];
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const AXE = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js';
const port = 9334 + (process.pid % 500);
const profile = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'chrome-profile-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, id = 0; const pending = new Map(); const listeners = [];
const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
const evaluate = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value; };
let failed = false;
try {
  let target;
  for (let i = 0; i < 40 && !target; i++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); } catch {} }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); } else if (m.method) listeners.forEach(l => l(m)); };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.setBypassCSP', { enabled: true }); // 운영 CSP가 axe-core 주입을 막지 않게
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__m={lcp:0,cls:0,lcpEl:''};
    new PerformanceObserver(l=>{for(const e of l.getEntries()){__m.lcp=e.startTime;__m.lcpEl=(e.element&&(e.element.tagName+'.'+(e.element.className||'')))||e.url||''}}).observe({type:'largest-contentful-paint',buffered:true});
    __m.shifts=[];
    new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!e.hadRecentInput){__m.cls+=e.value;__m.shifts.push(Math.round(e.startTime)+'ms '+e.value.toFixed(3)+' '+(e.sources||[]).map(s=>s.node?(s.node.nodeName+'.'+(s.node.className||'')):'?').join(','))}}}).observe({type:'layout-shift',buffered:true});` });
  let bytes = 0; listeners.push(m => { if (m.method === 'Network.loadingFinished') bytes += m.params.encodedDataLength; });
  console.log('기기: 390×844 모바일, 느린 4G(지연 150ms, 1.6Mbps), CPU 4배 감속, 캐시 없음');
  for (const p of paths) {
    bytes = 0;
    await send('Page.navigate', { url: base + p });
    await sleep(9000);
    const m = await evaluate(`(()=>{const f=performance.getEntriesByName('first-contentful-paint')[0];return {...__m,fcp:f?f.startTime:0}})()`);
    await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await evaluate(`new Promise((res,rej)=>{const s=document.createElement('script');s.src='${AXE}';s.onload=res;s.onerror=rej;document.head.appendChild(s)})`);
    const axe = await evaluate(`axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,target:v.nodes.slice(0,3).map(n=>n.target.join(' '))})))`);
    await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const ok = m.lcp <= 2500 && m.cls <= 0.1;
    if (!ok || axe.some(v => v.impact === 'serious' || v.impact === 'critical')) failed = true;
    console.log(`\n${p}\n  FCP ${Math.round(m.fcp)}ms · LCP ${Math.round(m.lcp)}ms (${m.lcpEl}) · CLS ${m.cls.toFixed(3)} · 전송 ${Math.round(bytes / 1024)}KB ${ok ? '통과' : '기준 미달'}`);
    if (m.cls > 0.05) console.log('  흔들림: ' + m.shifts.join(' / '));
    console.log(axe.length ? axe.map(v => `  접근성 [${v.impact}] ${v.id} ×${v.n}: ${v.help} → ${v.target.join(' | ')}`).join('\n') : '  접근성 위반 없음');
  }
} catch (e) { console.error('ERROR', e.message); failed = true; }
finally { try { ws && ws.close(); } catch {} chrome.kill('SIGTERM'); }
process.exitCode = failed ? 1 : 0;
