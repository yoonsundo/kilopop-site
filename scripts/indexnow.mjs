// 배포 뒤 IndexNow로 Bing·네이버 등에 바뀐 주소를 알린다(구글은 참여하지 않는다).
// 쓰는 법: SITE_URL=https://운영주소 node scripts/indexnow.mjs   (배포된 사이트맵을 읽어 모든 주소를 보낸다)
import { readFileSync } from 'node:fs';

const c = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url), 'utf8'));
const envUrl = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
const site = (envUrl || c.url).replace(/\/$/, '');
const host = new URL(site).host;
const sitemap = await (await fetch(`${site}/sitemap.xml`)).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (!urlList.length) throw new Error('사이트맵에서 주소를 찾지 못했어요');
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: c.indexNowKey, keyLocation: `${site}/${c.indexNowKey}.txt`, urlList }),
});
console.log(`IndexNow ${res.status} ${res.statusText}: ${urlList.length}개 주소`);
if (!res.ok) process.exitCode = 1;
