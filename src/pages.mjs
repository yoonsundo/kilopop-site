// 페이지 다섯 개. 첫 화면 구성은 승인된 시안 D(기준 핀: Drift Running Club)를 따른다.
import { faq, steps, templates, nots } from './content.mjs';
import { esc, pic, navBar } from './layout.mjs';
import { josa, particle } from './josa.mjs';
import { graph, siteNodes, appNode, pageNode, breadcrumb, faqNode } from './schema.mjs';

const arrow = '<span aria-hidden="true">›</span>';
const num = i => String(i + 1).padStart(2, '0');

export function pages(c) {
  // 글 원본의 {ko}, {ko:은} 같은 자리를 이름과 받침에 맞는 조사로 채운다
  const fill = s => s.replace(/\{ko:(\S)\}/g, (_, p) => josa(c.nameKo, p)).replaceAll('{ko}', c.nameKo).replaceAll('{en}', c.nameEn);
  const ko = esc(c.nameKo);
  const K = p => esc(josa(c.nameKo, p));
  const EN = esc(c.nameEn.toUpperCase());
  const app = esc(c.appUrl);
  const topbar = `<div class="topbar">${navBar(c)}</div>`;
  const n = templates.length;
  const crumbs = trail => `<nav class="crumbs micro" aria-label="현재 위치"><a href="/">홈</a>${trail.map(t => `<span aria-hidden="true">/</span><span aria-current="page">${esc(t)}</span>`).join('')}</nav>`;
  const cta = (label = '브라우저에서 바로 만들기') => `<a class="cta" href="${app}">${label} ${arrow}</a>`;

  /* 홈 */
  // 검색어 분담: 홈은 '러닝 인증샷 어플·만들기', 안내서는 '사진에 러닝 기록 넣기·러닝 스토리 꾸미기', 템플릿은 '러닝 기록 템플릿'
  const homeTitle = `러닝 인증샷 어플, 설치 없이 바로 만들기 | ${c.nameKo}`;
  const homeDesc = `설치·로그인 없이 브라우저에서 바로 쓰는 무료 러닝 인증샷 어플(웹앱) ${c.nameKo}. 거리와 시간을 넣고 사진을 고르면 인스타 스토리용 인증샷(1080×1920)을 만들어 줘요.`;
  const home = {
    path: '/', title: homeTitle, description: homeDesc, bodyClass: 'home', ogImage: 'og.jpg',
    images: [...templates.map(t => `tpl-${t.id}.jpg`), ...steps.map(s => `${s.img}.jpg`)],
    preload: `<link rel="preload" as="image" href="/img/hero-tall.webp" type="image/webp" media="(max-width: 699px)" fetchpriority="high">
<link rel="preload" as="image" href="/img/hero-wide.webp" type="image/webp" media="(min-width: 700px)" fetchpriority="high">`,
    jsonld: graph([
      ...siteNodes(c), appNode(c, { templates, steps }),
      pageNode(c, { path: '/', title: homeTitle, description: homeDesc, image: `${c.url}/img/tpl-d1.jpg`, extra: { about: { '@id': `${c.url}/#app` } } }),
      faqNode(c, faq, fill),
    ]),
    body: `${navBar(c)}
<main id="main">
<section class="hero" aria-labelledby="hero-h">
  <picture>
    <source media="(min-width: 700px)" type="image/webp" srcset="/img/hero-wide.webp">
    <source media="(min-width: 700px)" srcset="/img/hero-wide.jpg">
    <source type="image/webp" srcset="/img/hero-tall.webp">
    <img src="/img/hero-tall.jpg" width="828" height="1472" alt="" fetchpriority="high" decoding="async">
  </picture>
  <p class="based micro">Seoul<br>Made by a runner</p>
  <div class="display">
    <p class="big-wrap" aria-hidden="true"><span class="big l1">Your km,</span> <span class="big l2">on your</span> <span class="big l3">photo&nbsp;<span class="slash">/</span></span></p>
    <h1 class="ko" id="hero-h">러닝 인증샷, 사진 위에 기록 얹고 끝.</h1>
  </div>
  <a class="bracket micro" href="${app}"><span aria-hidden="true">[</span>인증샷 만들기<span aria-hidden="true">]</span></a>
  <div class="foot-row">
    <p class="lede"><strong>${ko}</strong>${particle(c.nameKo, '은')} 설치 없이 브라우저에서 바로 쓰는 무료 러닝 인증샷 어플(웹앱)이에요. 사진 위에 러닝 기록을 얹어 인스타 스토리용 인증샷(1080×1920)을 만들어요.</p>
    ${cta()}
    <div class="copy micro"><span>© ${new Date().getFullYear()} ${EN}</span><span>No install · No login</span></div>
  </div>
</section>

  <section class="panel about" aria-labelledby="about-h">
    <h2 class="lab micro" id="about-h">About · ${K('이')} 하는 일</h2>
    <p><span class="x" aria-hidden="true">✕</span>기록 앱 화면을 캡처하고, 자르고, 편집 앱에서 사진과 합치던 일을 한 화면으로 줄였어요. <span class="rest">거리와 시간만 넣으면 페이스는 알아서 계산해요. 사진과 템플릿을 고르면 인스타 스토리 크기 그대로 저장돼요. 사진은 폰 밖으로 나가지 않아요.</span></p>
  </section>

  <section class="panel stat" aria-label="기록 예시">
    <svg viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="route" pathLength="1" d="M70 40 C 120 120, 60 170, 150 210 S 300 170, 330 260 S 470 330, 520 250 S 640 120, 700 200 S 820 330, 880 300 S 940 380, 960 360"/>
      <circle cx="70" cy="40" r="5"/><circle cx="960" cy="360" r="5"/>
    </svg>
    <p class="num" data-t="10.02 KM" aria-hidden="true"></p>
    <p class="cap micro"><span>거리 10.02km, 시간 52:31을 넣으면</span><span>페이스 5'14"는 알아서 들어가요</span></p>
  </section>

  <section class="panel runs" id="templates" aria-labelledby="tpl-h">
    <div class="runs-head">
      <h2 id="tpl-h">인스타 스토리용<br>러닝 기록 템플릿 ${n}종&nbsp;<span class="slash">/</span></h2>
      <p>같은 기록으로 바로 바꿔 보고, 화면에서 본 그대로 저장해요. <a class="more" href="/templates/">러닝 기록 템플릿 자세히 보기 ${arrow}</a></p>
    </div>
    <div class="cards" data-rail>
${templates.map((t, i) => `      <a class="card${i === 0 ? ' on' : ''}" href="/templates/#${t.id}">
        ${pic(`tpl-${t.id}`, { w: 540, h: 960, alt: t.alt })}
        <small class="micro">${esc(t.code)}</small><b><em>${num(i)}.</em>${esc(t.name.split(' ')[0])}<span>${esc(t.name.split(' ').slice(1).join(' '))}</span></b>
      </a>`).join('\n')}
    </div>
  </section>

  <section class="panel how" id="how" aria-labelledby="how-h">
    <div>
      <h2 id="how-h">사진에 러닝 기록<br>넣는 네 단계&nbsp;<span class="slash">/</span></h2>
      <p class="answer">기록 입력, 사진 고르기, 템플릿 고르기, 저장. 네 단계면 끝나요. 거리와 시간만 넣으면 평균 페이스는 자동으로 계산돼요.</p>
      <a class="more" href="/guide/running-photo/">러닝 인증샷 만드는 법 자세히 보기 ${arrow}</a>
    </div>
    <ol class="steps">
${steps.map((s, i) => `      <li><span class="n" data-t="${num(i)}" aria-hidden="true"></span><div><h3>${esc(s.name)}</h3><p>${esc(s.short)}</p></div>${pic(s.img, { w: 240, h: 520, alt: s.alt })}</li>`).join('\n')}
    </ol>
  </section>

  <section class="panel nots" aria-labelledby="not-h">
    <h2 id="not-h">${K('이')}<br>하지 않는 것&nbsp;<span class="slash">/</span></h2>
    <ul>
${nots.map(([h, d]) => `      <li><b>${esc(h)}</b><span>${esc(d)}</span></li>`).join('\n')}
    </ul>
  </section>

  <section class="panel faq" id="faq" aria-labelledby="faq-h">
    <div><h2 id="faq-h">자주 묻는<br>질문&nbsp;<span class="slash">/</span></h2></div>
    <div class="qa">
${faq.map(f => `      <div><h3 class="q">${esc(fill(f.q))}</h3><p>${esc(fill(f.a))}</p></div>`).join('\n')}
    </div>
  </section>

  <section class="end" aria-labelledby="end-h">
    <div>
      <a class="bracket micro" href="${app}"><span aria-hidden="true">[</span>Join the run<span aria-hidden="true">]</span></a>
      <h2 id="end-h">오늘 달린 기록, 지금 한 장으로.</h2>
      <p>링크 하나면 크루원도 바로 써요. 설치할 것도, 가입할 것도 없어요.</p>
    </div>
    ${cta()}
    <p class="word" data-t="${EN}" aria-hidden="true"><span class="slash">/</span></p>
  </section>
</main>`,
  };

  /* 안내서 */
  const gPath = '/guide/running-photo/';
  const gTitle = `사진에 러닝 기록 넣기: 러닝 인증샷 만드는 법 | ${c.nameKo}`;
  const gDesc = '사진에 러닝 기록을 넣어 인스타 스토리용 인증샷을 만드는 법을 네 단계로 정리했어요. 글자·스티커로 러닝 스토리 꾸미기, 스토리에 올리기, 잘 안 될 때 해결법까지.';
  const gH1 = '러닝 인증샷 만드는 법';
  const gSub = '사진에 러닝 기록 넣고 인스타 스토리 꾸미기';
  const iso = d => `${d}T09:00:00+09:00`;
  const guide = {
    path: gPath, title: gTitle, ogTitle: `${gH1}: ${gSub}`, description: gDesc, ogType: 'article', bodyClass: 'sub', ogImage: 'og-guide.jpg',
    images: steps.map(s => `${s.img}-lg.jpg`),
    jsonld: graph([
      ...siteNodes(c), appNode(c, { templates, steps }),
      pageNode(c, { path: gPath, title: gTitle, description: gDesc, image: `${c.url}/img/screen-editor-lg.jpg`,
        extra: { breadcrumb: { '@id': `${c.url}${gPath}#breadcrumb` } } }),
      { '@type': 'Article', '@id': `${c.url}${gPath}#article`, headline: `${gH1}: ${gSub}`, description: gDesc,
        inLanguage: 'ko-KR', datePublished: iso('2026-10-30'), dateModified: iso(c.updated), mainEntityOfPage: { '@id': `${c.url}${gPath}#webpage` },
        image: steps.map(s => `${c.url}/img/${s.img}-lg.jpg`),
        author: { '@id': `${c.url}/#org` }, publisher: { '@id': `${c.url}/#org` }, about: { '@id': `${c.url}/#app` } },
      { '@type': 'HowTo', '@id': `${c.url}${gPath}#howto`, name: '사진에 러닝 기록 넣어 러닝 인증샷 만드는 법', description: '사진 위에 러닝 기록을 얹어 1080×1920 인스타 스토리용 인증샷을 만든다.',
        inLanguage: 'ko-KR', image: `${c.url}/img/screen-editor-lg.jpg`,
        supply: [{ '@type': 'HowToSupply', name: '러닝 기록(거리와 시간)' }, { '@type': 'HowToSupply', name: '사진 한 장' }],
        tool: [{ '@type': 'HowToTool', name: `${c.nameKo} 웹앱 (iPhone Safari 또는 Android Chrome)` }],
        step: steps.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, url: `${c.url}${gPath}#${s.id}`,
          text: s.body.join(' '), image: `${c.url}/img/${s.img}-lg.jpg` })) },
      breadcrumb(c, [{ name: '홈', path: '/' }, { name: gH1, path: gPath }]),
    ]),
    body: `${topbar}
<main id="main" class="page">
  ${crumbs([gH1])}
  <article>
    <header class="page-head">
      <p class="kick micro">Guide&nbsp;<span class="slash">/</span></p>
      <h1>${gH1} <span>${gSub}</span></h1>
      <p class="answer">기록 앱에서 거리와 시간을 확인하고, ${ko}에 두 숫자를 넣고, 사진과 템플릿을 고른 뒤 저장하면 끝이에요. 결과물은 인스타 스토리 크기인 1080×1920 JPEG라 그대로 올리면 돼요.</p>
      <p class="meta micro">고친 날 <time datetime="${c.updated}">${c.updated}</time> · ${K('을')} 만든 러너가 직접 쓰면서 정리했어요</p>
    </header>

    <nav class="toc" aria-labelledby="toc-h">
      <h2 id="toc-h" class="micro">차례</h2>
      <ol>
        <li><a href="#ready">준비물</a></li>
${steps.map((s, i) => `        <li><a href="#${s.id}">${i + 1}단계 · ${esc(s.name)}</a></li>`).join('\n')}
        <li><a href="#decorate">글자·스티커로 러닝 스토리 꾸미기</a></li>
        <li><a href="#story">인스타 스토리에 러닝 인증샷 올리기</a></li>
        <li><a href="#apps">기록 앱에서 거리와 시간 찾기</a></li>
        <li><a href="#trouble">잘 안 될 때</a></li>
      </ol>
    </nav>

    <section id="ready" class="block">
      <h2>준비물</h2>
      <ul class="dots">
        <li>오늘 달린 기록: 거리와 시간 두 숫자면 돼요. 평균 페이스는 자동으로 계산해요.</li>
        <li>사진 한 장: 없으면 샘플 사진으로 먼저 둘러봐도 돼요.</li>
        <li>아이폰 Safari 또는 안드로이드 Chrome: 따로 설치할 앱은 없어요. <a href="${app}">${ko} 열기</a></li>
      </ul>
    </section>

${steps.map((s, i) => `    <section id="${s.id}" class="block step">
      <h2><span class="n" data-t="${num(i)}" aria-hidden="true"></span>${i + 1}단계 · ${esc(s.name)}</h2>
      <div class="cols">
        <div>${s.body.map(p => `<p>${esc(p)}</p>`).join('')}</div>
        <figure>${pic(`${s.img}-lg`, { w: 585, h: 1266, alt: s.alt })}<figcaption class="micro">${i + 1}단계 화면</figcaption></figure>
      </div>
    </section>`).join('\n')}

    <section id="decorate" class="block">
      <h2>글자·스티커로 러닝 스토리 꾸미기</h2>
      <p>템플릿을 고른 뒤 '꾸미기'를 누르면 인증샷 위에 글자와 스티커를 더 얹을 수 있어요.</p>
      <ul class="dots">
        <li>글자: 하고 싶은 말을 써서 얹어요.</li>
        <li>기록 스티커: 거리·시간·페이스를 유리 질감 카드로 하나 더 붙여요.</li>
        <li>사진 스티커: 다른 사진을 하나 더 얹어요.</li>
        <li>한 손가락으로 옮기고, 두 손가락이나 모서리 손잡이로 키우고 돌려요. 0·90·180·270도 근처에서는 반듯하게 맞춰져요.</li>
        <li>실행 취소는 조작 한 번을 한 단계로, 50단계까지 돼요.</li>
      </ul>
    </section>

    <section id="story" class="block">
      <h2>인스타 스토리에 러닝 인증샷 올리기</h2>
      <p>인스타그램 앱에서 스토리를 만들고 갤러리에서 방금 저장한 인증샷을 고르면 돼요. 1080×1920(9:16)이라 확대하거나 자르지 않아도 화면이 꽉 차요.</p>
      <p>같은 사진으로 다른 템플릿을 하나 더 저장해 두면, 스토리를 두 장으로 이어 올릴 수도 있어요.</p>
    </section>

    <section id="apps" class="block">
      <h2>기록 앱(나이키 런 클럽·가민·스트라바)에서 거리와 시간 찾기</h2>
      <p>러닝 앱마다 화면은 달라도, 활동 하나를 열면 거리와 시간이 맨 위쪽에 나와요. 그 두 숫자만 옮기면 돼요.</p>
      <ul class="dots">
        <li>스트라바에는 '이동 시간'과 '경과 시간'이 따로 있어요. 신호 대기처럼 멈춘 시간을 빼고 싶다면 이동 시간을 넣어요.</li>
        <li>워치로 잰 기록은 폰 앱에 동기화된 뒤 확인하면 숫자가 같아요.</li>
        <li>기록 화면을 캡처해 두면 숫자를 옮길 때 편해요. 캡처를 읽어 자동으로 채우는 기능은 준비하고 있어요.</li>
      </ul>
    </section>

    <section id="trouble" class="block">
      <h2>잘 안 될 때</h2>
      <dl class="qa">
        <div><dt>카카오톡이나 인스타그램 안에서 열었더니 저장이 안 돼요</dt><dd>앱 안 브라우저는 저장과 공유를 막는 경우가 많아요. ${K('이')} 이를 알아채면 바깥 브라우저로 여는 방법과 링크 복사를 안내해요.</dd></div>
        <div><dt>안드로이드에서 사진이 열리지 않아요</dt><dd>아이폰에서 찍은 HEIC 사진은 안드로이드 Chrome과 삼성 인터넷이 열지 못해요. JPEG 사진을 골라 주세요. 화면에도 안내 문구가 나와요.</dd></div>
        <div><dt>저장을 눌러도 공유 시트가 뜨지 않아요</dt><dd>공유 시트를 쓸 수 없는 환경에서는 이미지를 길게 눌러 저장하라는 안내와 내려받기 링크가 나와요.</dd></div>
        <div><dt>저장한 글꼴이 화면과 달라요</dt><dd>처음 연 직후에 인터넷이 끊기면 글꼴을 받지 못해 기본 글꼴로 저장될 수 있어요. 저장 화면이 알려 주니, 연결된 뒤 다시 만들면 돼요.</dd></div>
      </dl>
    </section>

    <section class="block next" aria-labelledby="next-h">
      <h2 id="next-h">다음으로</h2>
      <p><a class="more" href="/templates/">러닝 기록 템플릿 ${n}종 보기 ${arrow}</a></p>
      ${cta('지금 인증샷 만들기')}
    </section>
  </article>
</main>`,
  };

  /* 템플릿 */
  const tPath = '/templates/';
  const tTitle = `러닝 기록 템플릿 ${n}종: 인스타 스토리 인증샷 | ${c.nameKo}`;
  const tDesc = `인스타 스토리(9:16)에 맞는 러닝 기록 템플릿 ${n}종을 앱이 실제로 저장한 결과물로 보여 드려요. 템플릿마다 들어가는 기록, 어울리는 사진, 특징을 정리했어요.`;
  const tH1 = `러닝 기록 템플릿 ${n}종`;
  const tpl = {
    path: tPath, title: tTitle, description: tDesc, bodyClass: 'sub', ogImage: 'og-templates.jpg',
    images: templates.map(t => `tpl-${t.id}-lg.jpg`),
    jsonld: graph([
      ...siteNodes(c), appNode(c, { templates, steps }),
      pageNode(c, { path: tPath, title: tH1, description: tDesc, type: 'CollectionPage', image: `${c.url}/img/tpl-d1-lg.jpg`,
        extra: { breadcrumb: { '@id': `${c.url}${tPath}#breadcrumb` }, mainEntity: { '@id': `${c.url}${tPath}#list` } } }),
      { '@type': 'ItemList', '@id': `${c.url}${tPath}#list`, name: tH1, numberOfItems: templates.length,
        itemListElement: templates.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: `${c.url}${tPath}#${t.id}`,
          item: { '@type': 'ImageObject', name: `${t.code} ${t.name}`, description: `${t.line}. ${t.note}`, contentUrl: `${c.url}/img/tpl-${t.id}-lg.jpg`,
            width: 720, height: 1280, encodingFormat: 'image/jpeg', creator: { '@id': `${c.url}/#org` }, caption: t.alt,
            // 배경 예시 사진이 AI 생성이라 합성물로 밝힌다(IPTC 디지털 출처 유형)
            digitalSourceType: 'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia' } })) },
      breadcrumb(c, [{ name: '홈', path: '/' }, { name: tH1, path: tPath }]),
    ]),
    body: `${topbar}
<main id="main" class="page">
  ${crumbs([tH1])}
  <header class="page-head">
    <p class="kick micro">Templates&nbsp;<span class="slash">/</span></p>
    <h1>${tH1} <span>빅 넘버 · 모닝 위젯 · 흑백 레드 · 네온 루트</span></h1>
    <p class="answer">${ko}의 러닝 기록 템플릿은 모두 인스타 스토리 크기인 1080×1920(9:16)으로 저장돼요. 같은 기록으로 바꿔 보며 고를 수 있고, 저장하면 화면에서 본 그대로 나와요. 아래 이미지는 앱이 실제로 저장한 결과물을 줄인 것이에요.</p>
  </header>
${templates.map((t, i) => `  <section id="${t.id}" class="tpl block">
    <figure>${pic(`tpl-${t.id}-lg`, { w: 720, h: 1280, alt: t.alt, lazy: i > 0, priority: i === 0 })}</figure>
    <div>
      <p class="kick micro">${esc(t.code)}&nbsp;<span class="slash">/</span></p>
      <h2>${esc(t.name)} 템플릿</h2>
      <p class="line">${esc(t.line)}</p>
      <dl>
        <div><dt>들어가는 기록</dt><dd>${esc(t.shows)}</dd></div>
        <div><dt>어울리는 사진</dt><dd>${esc(t.fits)}</dd></div>
        <div><dt>특징</dt><dd>${esc(t.note)}</dd></div>
      </dl>
    </div>
  </section>`).join('\n')}
  <section class="block" aria-labelledby="common-h">
    <h2 id="common-h">모든 템플릿에서 되는 것</h2>
    <ul class="dots">
      <li>기록 묶음을 끌어 옮기고 크기를 바꿀 수 있어요. 기록은 화면 밖으로 잘리지 않아요.</li>
      <li>고르기 어려우면 랜덤 버튼으로 템플릿을 바꿔 봐요.</li>
      <li>'꾸미기'에서 글자, 기록 스티커, 사진 스티커를 얹고 옮기고 돌릴 수 있어요.</li>
      <li>미리보기와 저장이 같은 그리기 방식을 써서, 본 그대로 저장돼요.</li>
    </ul>
    <p><a class="more" href="/guide/running-photo/">사진에 러닝 기록 넣는 법 보기 ${arrow}</a></p>
    ${cta('템플릿 골라 만들기')}
  </section>
</main>`,
  };

  /* 개인정보 처리방침 */
  const pPath = '/privacy/';
  const pTitle = `개인정보 처리방침 | ${c.nameKo}`;
  const pDesc = `${josa(c.nameKo, '은')} 회원가입이 없고 사진과 기록을 서버로 보내지 않아요. 이 사이트와 앱이 어떤 정보를 다루는지 정리했어요.`;
  const privacy = {
    path: pPath, title: pTitle, description: pDesc, bodyClass: 'sub',
    jsonld: graph([...siteNodes(c), pageNode(c, { path: pPath, title: pTitle, description: pDesc }), breadcrumb(c, [{ name: '홈', path: '/' }, { name: '개인정보 처리방침', path: pPath }])]),
    body: `${topbar}
<main id="main" class="page">
  ${crumbs(['개인정보 처리방침'])}
  <header class="page-head">
    <p class="kick micro">Privacy&nbsp;<span class="slash">/</span></p>
    <h1>개인정보 처리방침</h1>
    <p class="answer">${K('은')} 회원가입과 로그인이 없고, 사진과 기록을 받는 서버가 없어요. 아래는 이 소개 사이트와 ${ko} 웹앱이 다루는 정보를 빠짐없이 적은 것이에요.</p>
    <p class="meta micro">시행일 <time datetime="2026-10-30">2026-10-30</time></p>
  </header>
  <section class="block"><h2>1. 모으는 개인정보</h2><p>${K('이')} 직접 모으거나 저장하는 개인정보는 없어요. 이름, 이메일, 전화번호를 받지 않고 계정도 만들지 않아요.</p></section>
  <section class="block"><h2>2. 사진과 기록</h2><p>웹앱에서 고른 사진과 입력한 거리·시간은 이용자의 기기 브라우저 안에서만 처리돼요. 인증샷을 그리고 저장하는 일도 기기 안에서 끝나며, 사진과 기록을 서버로 보내지 않아요.</p></section>
  <section class="block"><h2>3. 쿠키와 분석 도구</h2><p>이 사이트는 쿠키, 광고, 방문 분석 도구를 쓰지 않아요.</p></section>
  <section class="block"><h2>4. 다른 회사를 거치는 정보</h2>
    <ul class="dots">
      <li>호스팅: 사이트와 웹앱은 Vercel에서 제공돼요. Vercel은 보안과 운영을 위해 접속 기록(IP 주소, 브라우저 정보, 요청 시각 등)을 처리할 수 있어요. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener">Vercel 개인정보 처리방침</a></li>
      <li>글꼴: 글꼴 파일을 Google Fonts에서 받아요. 이때 Google이 IP 주소 같은 접속 정보를 받을 수 있어요. <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google 개인정보처리방침</a></li>
    </ul>
  </section>
  <section class="block"><h2>5. 문의</h2><p>궁금한 점은 <a href="${esc(c.repoUrl)}/issues" target="_blank" rel="noopener">GitHub 이슈</a>로 남겨 주세요.</p></section>
  <section class="block"><h2>6. 바뀌는 경우</h2><p>방문 분석 도구를 붙이거나 다루는 정보가 달라지면 이 문서를 먼저 고치고 시행일을 바꿔요.</p></section>
</main>`,
  };

  /* 404 */
  const nf = {
    path: '/404.html', title: `페이지를 찾을 수 없어요 | ${c.nameKo}`, noindex: true, bodyClass: 'sub',
    description: `찾는 페이지가 없어요. ${c.nameKo} 홈이나 러닝 인증샷 만드는 법 안내서로 이동해 주세요.`,
    body: `${topbar}
<main id="main" class="page nf">
  <p class="num" data-t="404" aria-hidden="true"><span class="slash">/</span></p>
  <h1>페이지를 찾을 수 없어요</h1>
  <p class="answer">주소가 바뀌었거나 없는 페이지예요.</p>
  <p><a class="more" href="/">홈으로 ${arrow}</a> &nbsp; <a class="more" href="/guide/running-photo/">러닝 인증샷 만드는 법 ${arrow}</a></p>
</main>`,
  };

  return [home, guide, tpl, privacy, nf];
}
