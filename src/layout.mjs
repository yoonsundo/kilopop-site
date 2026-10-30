// 모든 페이지가 함께 쓰는 머리(메타·구조화 데이터)와 메뉴·바닥글.

import { josa } from './josa.mjs';

export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// WebP를 먼저 주고 JPEG로 대신한다. 크기는 레이아웃이 밀리지 않게 늘 적는다.
// priority는 첫 화면에서 가장 큰 이미지(LCP)에만 준다.
export function pic(name, { w, h, alt, lazy = true, priority = false }) {
  return `<picture><source type="image/webp" srcset="/img/${name}.webp"><img src="/img/${name}.jpg" width="${w}" height="${h}" alt="${esc(alt)}"${lazy ? ' loading="lazy"' : ''}${priority ? ' fetchpriority="high"' : ''} decoding="async"></picture>`;
}

export function navBar(c) {
  return `<header class="bar micro">
    <a class="logo" href="/" aria-label="${esc(c.nameEn.toUpperCase())} ${esc(c.nameKo)} 홈">${esc(c.nameEn.toUpperCase())}</a>
    <nav aria-label="주요 메뉴"><a href="/guide/running-photo/">만드는 법</a><a href="/templates/">템플릿</a><a href="/#faq">자주 묻는 질문</a><a href="${esc(c.repoUrl)}" target="_blank" rel="noopener">GitHub</a></nav>
    <a class="join" href="${esc(c.appUrl)}">앱 열기 <span aria-hidden="true">›</span></a>
  </header>`;
}

export function footer(c) {
  return `<footer class="foot">
  <nav class="micro" aria-label="바닥글"><a href="/guide/running-photo/">러닝 인증샷 만드는 법</a><a href="/templates/">템플릿</a><a href="/#faq">자주 묻는 질문</a><a href="/privacy/">개인정보 처리방침</a><a href="${esc(c.repoUrl)}" target="_blank" rel="noopener">GitHub</a></nav>
  <p>나이키 런 클럽, 가민, 스트라바는 각 회사의 상표이며 ${esc(josa(c.nameKo, '과'))} 관련이 없어요. 예시 사진은 AI로 만든 이미지이고, 실제로는 내 사진이 들어가요.</p>
  <p class="micro">© ${new Date().getFullYear()} ${esc(c.nameKo)} · ${esc(c.nameEn.toUpperCase())}</p>
</footer>`;
}

export function page(c, a, p) {
  const url = `${c.url}${p.path}`;
  const og = `${c.url}/${p.ogImage || 'og.jpg'}`;
  const robots = p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const verify = [
    c.googleVerification && `<meta name="google-site-verification" content="${esc(c.googleVerification)}">`,
    c.naverVerification && `<meta name="naver-site-verification" content="${esc(c.naverVerification)}">`,
  ].filter(Boolean).join('\n');
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${robots}">
${p.noindex ? '' : `<link rel="canonical" href="${esc(url)}">`}
<meta name="theme-color" content="${esc(c.themeColor)}">
<meta name="color-scheme" content="dark">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="${esc(c.nameKo)}">
<meta property="og:locale" content="ko_KR">
<meta property="og:title" content="${esc(p.ogTitle || p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${esc(og)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${esc(og)}">
${verify}
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icons/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/fonts/anton-latin.woff2" as="font" type="font/woff2" crossorigin>
${p.preload || ''}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&amp;family=Inter:wght@500;600;700&amp;family=Noto+Sans+KR:wght@400;700;800&amp;display=swap">
<link rel="stylesheet" href="${a.css}">
<script src="${a.js}" defer></script>
${p.jsonld ? `<script type="application/ld+json">${JSON.stringify(p.jsonld).replace(/</g, '\\u003c')}</script>` : ''}
</head>
<body class="${p.bodyClass || ''}">
<a class="skip" href="#main">본문으로 건너뛰기</a>
${p.body}
${footer(c)}
</body>
</html>
`;
}
