// 구조화 데이터(JSON-LD). 화면에 보이는 내용만 넣고, 평점처럼 근거 없는 값은 넣지 않는다.

export function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}

export function siteNodes(c) {
  return [
    { '@type': 'Organization', '@id': `${c.url}/#org`, name: c.nameKo, alternateName: [c.nameEn, c.nameEn.toUpperCase()],
      url: `${c.url}/`, logo: { '@type': 'ImageObject', url: `${c.url}/icons/icon-512.png`, width: 512, height: 512 },
      sameAs: [c.repoUrl] },
    { '@type': 'WebSite', '@id': `${c.url}/#website`, url: `${c.url}/`, name: c.nameKo, alternateName: c.nameEn,
      inLanguage: 'ko-KR', publisher: { '@id': `${c.url}/#org` } },
  ];
}

export function appNode(c, { templates, steps }) {
  return {
    '@type': 'WebApplication', '@id': `${c.url}/#app`, name: c.nameKo, alternateName: c.nameEn, url: c.appUrl,
    description: `사진 위에 러닝 기록을 얹어 인스타그램 스토리용 인증샷(1080×1920)을 만드는 무료 웹앱`,
    applicationCategory: 'MultimediaApplication', applicationSubCategory: '러닝 인증샷',
    operatingSystem: '웹 브라우저', browserRequirements: 'iPhone Safari에서 저장까지 확인함. Android Chrome은 실기기 확인 전',
    inLanguage: 'ko-KR', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
    featureList: [
      '거리와 시간을 넣으면 평균 페이스 자동 계산',
      `템플릿 ${templates.length}종: ${templates.map(t => t.name).join(', ')}`,
      '1080×1920(9:16) JPEG 저장, 공유 시트로 사진 앱에 저장',
      '회원가입·로그인 없음, 사진을 서버로 보내지 않음',
      '홈 화면에 추가해 앱처럼 사용, 한 번 연 뒤 오프라인 사용',
    ],
    screenshot: steps.map(s => `${c.url}/img/${s.img}-lg.jpg`),
    publisher: { '@id': `${c.url}/#org` },
  };
}

export function pageNode(c, { path, title, description, type = 'WebPage', image, extra = {} }) {
  return {
    '@type': type, '@id': `${c.url}${path}#webpage`, url: `${c.url}${path}`, name: title, description,
    isPartOf: { '@id': `${c.url}/#website` }, inLanguage: 'ko-KR', dateModified: c.updated,
    ...(image ? { primaryImageOfPage: { '@type': 'ImageObject', url: image } } : {}),
    ...extra,
  };
}

export function breadcrumb(c, trail) {
  return {
    '@type': 'BreadcrumbList', '@id': `${c.url}${trail.at(-1).path}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: `${c.url}${t.path}` })),
  };
}

export function faqNode(c, faq, fill) {
  return {
    '@type': 'FAQPage', '@id': `${c.url}/#faq`, url: `${c.url}/`, inLanguage: 'ko-KR',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: fill(f.q), acceptedAnswer: { '@type': 'Answer', text: fill(f.a) } })),
  };
}
