// dist/ 검사. 검색 노출에 필요한 구조가 실제 빌드 결과에 들어 있는지 확인한다.
// 쓰는 법: node scripts/check.mjs  (실패하면 항목을 모두 출력하고 종료 코드 1)
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { josa } from '../src/josa.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../site.config.json', import.meta.url)));
const fails = [];
const fail = (file, msg) => fails.push(`${file}: ${msg}`);

for (const [w, p, want] of [['킬로팝', '은', '킬로팝은'], ['런포토', '은', '런포토는'], ['킬로팝', '이', '킬로팝이'], ['런포토', '과', '런포토와'], ['Kilopop', '을', 'Kilopop를']]) {
  if (josa(w, p) !== want) fail('src/josa.mjs', `${w}+${p} → ${josa(w, p)} (기대 ${want})`);
}

if (!existsSync(DIST)) { console.error('dist/ 없음. 먼저 node scripts/build.mjs'); process.exit(1); }

const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(DIST);
const htmlFiles = files.filter(f => f.endsWith('.html'));
const pageOf = f => '/' + relative(DIST, f).replace(/index\.html$/, '');
const text = s => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
const meta = (html, key) => { const m = new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)"`).exec(html); return m ? m[1] : null; };
const idsOf = html => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
const pages = new Map(htmlFiles.map(f => [pageOf(f), readFileSync(f, 'utf8')]));
const isNoindex = html => /<meta name="robots" content="noindex/.test(html);
const base = (() => { const h = pages.get('/') || ''; return ((/<link rel="canonical" href="([^"]+)"/.exec(h) || [])[1] || '').replace(/\/$/, ''); })();
const seenTitle = new Map(), seenDesc = new Map();

for (const [path, html] of pages) {
  const f = path;
  const is404 = path === '/404.html';
  if (!/<html lang="ko">/.test(html)) fail(f, 'html lang="ko" 없음');
  if (/\{\{\s*\w+\s*\}\}|\{(ko|en)\}/.test(html)) fail(f, '채워지지 않은 {{자리}}가 남음');
  const h1 = html.match(/<h1[\s>]/g) || [];
  if (h1.length !== 1) fail(f, `h1이 ${h1.length}개`);
  const h1Html = (/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html) || [])[1] || '';
  if (/aria-hidden/.test(h1Html)) fail(f, 'h1 안에 숨긴 장식 글이 있음(검색엔진은 그대로 읽음)');
  if (/[^\s>]<span/.test(h1Html)) fail(f, 'h1 안 span 앞에 띄어쓰기가 없어 낱말이 붙어 읽힘');
  // 운영 CSP(vercel.json)는 인라인 스타일·스크립트를 막는다. 로컬에서는 보이지만 운영에서만 깨지는 것을 미리 잡는다.
  if (/\sstyle="/.test(html)) fail(f, '인라인 style 속성이 있음(운영 CSP에서 무시됨)');
  if (/\son[a-z]+="/.test(html)) fail(f, '인라인 이벤트 처리기가 있음(운영 CSP에서 막힘)');
  if (/<style[\s>]/.test(html)) fail(f, '<style> 태그가 있음(운영 CSP에서 무시됨)');
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>/g)) if (!/type="application\/ld\+json"/.test(m[1])) fail(f, '인라인 스크립트가 있음(운영 CSP에서 막힘)');
  const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
  if (!title) fail(f, 'title 없음');
  else if ([...title].length > 60 || [...title].length < 10) fail(f, `title 길이 ${[...title].length}자`);
  const desc = meta(html, 'description');
  if (!desc) fail(f, 'meta description 없음');
  else if ([...desc].length < 40 || [...desc].length > 160) fail(f, `description 길이 ${[...desc].length}자`);
  if (!/<meta name="viewport"/.test(html)) fail(f, 'viewport 없음');
  if (title && !isNoindex(html)) { if (seenTitle.has(title)) fail(f, `제목이 ${seenTitle.get(title)}과 같음`); seenTitle.set(title, f); }
  if (desc && !isNoindex(html)) { if (seenDesc.has(desc)) fail(f, `설명이 ${seenDesc.get(desc)}과 같음`); seenDesc.set(desc, f); }

  if (is404) {
    if (!isNoindex(html)) fail(f, '404에 noindex 없음');
  } else if (!isNoindex(html)) {
    const canon = (/<link rel="canonical" href="([^"]+)"/.exec(html) || [])[1];
    if (!canon) fail(f, 'canonical 없음');
    else if (!base.startsWith('https://') || canon !== base + path) fail(f, `canonical이 이상함: ${canon}`);
    if (canon && meta(html, 'og:url') !== canon) fail(f, 'og:url이 canonical과 다름');
    for (const k of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale', 'og:site_name', 'twitter:card']) {
      if (!meta(html, k)) fail(f, `${k} 없음`);
    }
    const ogImg = meta(html, 'og:image');
    if (ogImg && !ogImg.startsWith('https://')) fail(f, 'og:image가 절대 주소가 아님');
    else if (ogImg && !existsSync(join(DIST, new URL(ogImg).pathname))) fail(f, `og:image 파일 없음: ${ogImg}`);

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
    if (!blocks.length) fail(f, '구조화 데이터 없음');
    const types = new Set();
    for (const b of blocks) {
      let data;
      try { data = JSON.parse(b); } catch (e) { fail(f, 'JSON-LD 파싱 실패: ' + e.message); continue; }
      if (data['@context'] !== 'https://schema.org') fail(f, 'JSON-LD @context가 https://schema.org가 아님');
      for (const node of data['@graph'] || [data]) [].concat(node['@type']).forEach(t => types.add(t));
      if (/aggregateRating|reviewCount/.test(b)) fail(f, '근거 없는 평점 표시가 들어 있음');
      if (path === '/') {
        const faq = (data['@graph'] || []).find(n => [].concat(n['@type']).includes('FAQPage'));
        if (faq) {
          const visible = [...html.matchAll(/<h3 class="q"[^>]*>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g)].map(m => [text(m[1]), text(m[2])]);
          const marked = faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]);
          if (visible.length !== marked.length || visible.some(([q, a], i) => q !== marked[i][0] || a !== marked[i][1])) fail(f, 'FAQ 구조화 데이터와 화면 질문·답이 다름');
        }
      }
    }
    if (!types.has('BreadcrumbList') && path !== '/') fail(f, 'BreadcrumbList 없음');
    if (path === '/') for (const t of ['WebSite', 'Organization', 'WebApplication', 'FAQPage', 'WebPage']) if (!types.has(t)) fail(f, `${t} 없음`);
    if (path === '/guide/running-photo/') for (const t of ['HowTo', 'Article']) if (!types.has(t)) fail(f, `${t} 없음`);
    if (path === '/templates/') for (const t of ['CollectionPage', 'ItemList']) if (!types.has(t)) fail(f, `${t} 없음`);
  }

  for (const m of html.matchAll(/<img\s[^>]*>/g)) {
    const tag = m[0];
    if (attr(tag, 'alt') === null) fail(f, `alt 없는 이미지: ${tag.slice(0, 80)}`);
    if (!/^\d+$/.test(attr(tag, 'width') || '') || !/^\d+$/.test(attr(tag, 'height') || '')) fail(f, `width/height가 숫자가 아닌 이미지: ${tag.slice(0, 80)}`);
    const src = attr(tag, 'src');
    if (src && src.startsWith('/') && !existsSync(join(DIST, src))) fail(f, `이미지 파일 없음: ${src}`);
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) { const u = part.trim().split(/\s+/)[0]; if (u.startsWith('/') && !existsSync(join(DIST, u))) fail(f, `srcset 파일 없음: ${u}`); }
  }
  for (const m of html.matchAll(/<link [^>]*href="(\/[^"]+)"/g)) if (!existsSync(join(DIST, m[1]))) fail(f, `link 파일 없음: ${m[1]}`);
  for (const m of html.matchAll(/<script [^>]*src="(\/[^"]+)"/g)) if (!existsSync(join(DIST, m[1]))) fail(f, `script 파일 없음: ${m[1]}`);

  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith('#')) { if (href.length > 1 && !idsOf(html).has(href.slice(1))) fail(f, `페이지 안 링크 대상 없음: ${href}`); continue; }
    if (!href.startsWith('/')) continue;
    const [p, hash] = href.split('#');
    const target = pages.get(p);
    if (!target) { if (!existsSync(join(DIST, p))) fail(f, `내부 링크 대상 없음: ${href}`); continue; }
    if (hash && !idsOf(target).has(hash)) fail(f, `내부 링크 앵커 없음: ${href}`);
  }
  for (const m of html.matchAll(/<a\s[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(m[0])) fail(f, '새 창 링크에 rel=noopener 없음');
}

const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (!robots) fail('robots.txt', '없음');
else {
  if (!robots.includes(`Sitemap: ${base}/sitemap.xml`)) fail('robots.txt', 'Sitemap 줄 없음');
  // 그룹은 빈 줄로 끝난다. 모든 수집기(*) 그룹과 검색엔진 그룹만 보고, 학습용 수집기 그룹의 차단은 허용한다.
  const groups = robots.split(/\n\s*\n/).map(g => ({ agents: [...g.matchAll(/^User-agent:\s*(\S+)/gim)].map(m => m[1]), body: g }));
  for (const g of groups.filter(g => g.agents.some(a => ['*', 'Googlebot', 'Yeti', 'Bingbot'].includes(a)))) {
    if (/^Disallow:\s*\/\s*$/m.test(g.body)) fail('robots.txt', `전체 차단이 들어 있음: ${g.agents.join(', ')}`);
  }
  for (const bot of ['Yeti', 'Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot']) if (!robots.includes(bot)) fail('robots.txt', `${bot} 언급 없음`);
}
const sitemap = existsSync(join(DIST, 'sitemap.xml')) ? readFileSync(join(DIST, 'sitemap.xml'), 'utf8') : '';
if (!sitemap) fail('sitemap.xml', '없음');
else {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  for (const [p, h] of pages) {
    if (!isNoindex(h) && !locs.includes(base + p)) fail('sitemap.xml', `${p} 빠짐`);
    if (isNoindex(h) && locs.includes(base + p)) fail('sitemap.xml', `noindex인 ${p}가 들어 있음`);
  }
  if (!/<image:image>/.test(sitemap)) fail('sitemap.xml', '이미지 항목이 하나도 없음');
  if ((sitemap.match(/<url>/g) || []).length !== (sitemap.match(/<lastmod>/g) || []).length) fail('sitemap.xml', 'lastmod 빠진 항목이 있음');
  if (!sitemap.includes('xmlns:image=')) fail('sitemap.xml', '이미지 정보 없음');
}
if (!existsSync(join(DIST, 'llms.txt'))) fail('llms.txt', '없음');
if (!existsSync(join(DIST, `${config.indexNowKey}.txt`))) fail('IndexNow', '키 파일 없음');
else if (readFileSync(join(DIST, `${config.indexNowKey}.txt`), 'utf8').trim() !== config.indexNowKey) fail('IndexNow', '키 파일 내용이 키와 다름');
for (const f of ['og.jpg', 'favicon.ico', 'icons/apple-touch-icon.png']) if (!existsSync(join(DIST, f))) fail(f, '없음');

if (fails.length) { console.error(`검사 실패 ${fails.length}건\n- ` + fails.join('\n- ')); process.exit(1); }
console.log(`검사 통과: 페이지 ${pages.size}개, 파일 ${files.length}개`);
