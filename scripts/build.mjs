// 정적 빌드. 외부 패키지 없이 dist/에 페이지, 사이트맵, robots.txt, llms.txt, IndexNow 키를 만든다.
// 주소는 SITE_URL > Vercel 운영 주소(VERCEL_PROJECT_PRODUCTION_URL) > site.config.json의 url 순으로 정한다.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { page } from '../src/layout.mjs';
import { pages } from '../src/pages.mjs';
import { templates } from '../src/content.mjs';
import { josa } from '../src/josa.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const config = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const envUrl = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
const c = { ...config, url: (envUrl || config.url).replace(/\/$/, '') };

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'assets'), { recursive: true });
cpSync(join(root, 'public'), dist, { recursive: true });

// CSS·JS는 내용 해시를 붙여 오래 캐시해도 바뀐 판이 바로 나가게 한다
const asset = (src, ext) => {
  const body = readFileSync(join(root, 'src', src), 'utf8');
  const name = `site.${createHash('sha256').update(body).digest('hex').slice(0, 10)}.${ext}`;
  writeFileSync(join(dist, 'assets', name), body);
  return `/assets/${name}`;
};
const a = { css: asset('site.css', 'css'), js: asset('site.js', 'js') };

const list = pages(c);
for (const p of list) {
  const out = p.path.endsWith('.html') ? join(dist, p.path) : join(dist, p.path, 'index.html');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page(c, a, p));
}

// 사이트맵: 페이지마다 그 페이지에 보이는 이미지 주소도 넣는다(네이버·구글 이미지 검색). 구글이 더는 쓰지 않는 image:title은 넣지 않는다.
const indexable = list.filter(p => !p.noindex);
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${indexable.map(p => `  <url>
    <loc>${c.url}${p.path}</loc>
    <lastmod>${c.updated}</lastmod>
${(p.images || []).map(f => `    <image:image><image:loc>${c.url}/img/${f}</image:loc></image:image>`).join('\n')}
  </url>`).join('\n')}
</urlset>
`);

// robots.txt: 검색엔진과 AI 검색은 모두 허용. 학습용 수집은 설정(allowAiTraining)으로 정한다.
// 이름을 적은 수집기는 * 그룹을 무시하므로(RFC 9309) 그룹마다 같은 규칙만 둔다. 404는 페이지의 noindex로 막는다.
const search = ['Googlebot', 'Yeti', 'Daumoa', 'Bingbot', 'Applebot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'Perplexity-User', 'Claude-SearchBot', 'Claude-User', 'DuckAssistBot'];
const training = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'meta-externalagent'];
const allowTraining = c.allowAiTraining !== false;
writeFileSync(join(dist, 'robots.txt'), `# ${c.nameKo} 소개 사이트
User-agent: *
Allow: /

# 검색엔진과 AI 검색·답변 서비스
${search.map(b => `User-agent: ${b}`).join('\n')}
Allow: /

# AI 학습용 수집 (${allowTraining ? '허용' : '차단'})
${training.map(b => `User-agent: ${b}`).join('\n')}
${allowTraining ? 'Allow: /' : 'Disallow: /'}

Sitemap: ${c.url}/sitemap.xml
`);

// llms.txt: 구글은 쓰지 않는다고 밝혔지만 다른 AI 서비스가 읽을 수 있어 둔다
writeFileSync(join(dist, 'llms.txt'), `# ${c.nameKo} (${c.nameEn})

> ${josa(c.nameKo, '은')} 사진 위에 러닝 기록을 얹어 인스타그램 스토리용 인증샷(1080×1920, 9:16 JPEG)을 만드는 무료 모바일 웹앱이다. 설치와 로그인이 없고, 사진과 기록을 서버로 보내지 않는다.

## 핵심 사실

- 쓰는 법: 거리와 시간 입력(평균 페이스 자동 계산) → 사진 고르기 → 템플릿 고르기 → '저장하기' → 저장 화면의 '사진 앱에 저장'(공유 시트에서 '이미지 저장')
- 템플릿 ${templates.length}종: ${templates.map(t => `${t.name}(${t.line})`).join(', ')}
- 브라우저: iPhone Safari에서 저장까지 확인했다. Android Chrome에서도 열리지만 실기기 저장 확인은 아직 하지 않았다. 홈 화면에 추가해 앱처럼 쓰고, 한 번 연 뒤에는 오프라인에서도 열린다
- 가격: 무료. 회원가입·결제 없음
- 개인정보: 사진과 기록은 기기 브라우저 안에서만 처리
- 기록 입력은 어떤 러닝 앱(나이키 런 클럽, 가민, 스트라바 등)의 숫자든 직접 넣는다. 캡처 자동 인식은 준비 중
- 만든 사람: 인증샷 하나에 앱 서너 개를 거치던 러너가 자신과 러닝 크루가 쓰려고 만들었다

## 페이지

- [${c.nameKo} 소개](${c.url}/): 무엇을 하는 웹앱인지, 자주 묻는 질문
- [러닝 인증샷 만드는 법](${c.url}/guide/running-photo/): 네 단계 안내, 인스타 스토리에 올리기, 잘 안 될 때
- [러닝 인증샷 템플릿 4종](${c.url}/templates/): 템플릿별 들어가는 기록과 어울리는 사진
- [개인정보 처리방침](${c.url}/privacy/)
- [웹앱 열기](${c.appUrl})
- [소스 코드](${c.repoUrl})
`);

writeFileSync(join(dist, `${c.indexNowKey}.txt`), c.indexNowKey);
console.log(`빌드 완료: ${list.length}쪽 → dist/ (주소 ${c.url})`);
