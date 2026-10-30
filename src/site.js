// 보조 동작만 둔다. 스크립트가 없어도 모든 글과 링크는 그대로 보인다.
document.documentElement.classList.add('js');

// 템플릿 카드: 하나만 컬러로 (핀의 '하나만 컬러' 구성)
// 모바일은 가로로 넘길 때 가운데에 가장 많이 걸친 카드, 데스크톱은 마우스를 올린 카드가 컬러가 된다.
const rail = document.querySelector('[data-rail]');
if (rail) {
  const cards = [...rail.querySelectorAll('.card')];
  const desk = matchMedia('(min-width: 960px)');
  const pickCard = c => cards.forEach(o => o.classList.toggle('on', o === c));
  cards.forEach(c => { c.addEventListener('mouseenter', () => pickCard(c)); c.addEventListener('focus', () => pickCard(c)); });
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => seen.set(e.target, e.intersectionRatio));
      if (desk.matches) return;
      let best = cards[0], max = -1;
      for (const c of cards) { const r = seen.get(c) || 0; if (r > max) { max = r; best = c; } }
      pickCard(best);
    }, { root: rail, threshold: [0, .25, .5, .75, 1] });
    cards.forEach(c => io.observe(c));
  }
}

// 경로 선: 화면에 들어오면 그린다
const stat = document.querySelector('.stat');
if (stat && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { stat.classList.add('seen'); io.disconnect(); } }, { threshold: .3 });
  io.observe(stat);
} else if (stat) stat.classList.add('seen');
