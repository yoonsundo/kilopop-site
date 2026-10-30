// 공유 미리보기 이미지(1200×630)를 페이지마다 만든다. 이름을 바꾸면 다시 실행한다. macOS의 Chrome과 sips를 쓴다.
// 쓰는 법: node scripts/og.mjs
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = fileURLToPath(new URL('..', import.meta.url));
const c = JSON.parse(readFileSync(join(root, 'site.config.json'), 'utf8'));
const dir = mkdtempSync(join(process.env.SCRATCH || tmpdir(), 'og-'));
const shots = [
  { out: 'og.jpg', l1: 'Your km,', l2: 'on your', l3: 'photo', line: '러닝 인증샷, 사진 위에 기록 얹고 끝' },
  { out: 'og-guide.jpg', l1: 'Four', l2: 'steps to', l3: 'story', line: '러닝 인증샷 만드는 법 · 사진에 러닝 기록 넣기' },
  { out: 'og-templates.jpg', l1: 'Four', l2: 'templates', l3: '9:16', line: '러닝 기록 템플릿 4종 · 인스타 스토리용' },
];
const tpl = readFileSync(join(root, 'src/og.html'), 'utf8');
for (const s of shots) {
  const html = tpl.replace('{{hero}}', `file://${join(root, 'public/img/hero-wide.jpg')}`)
    .replace('{{EN}}', c.nameEn.toUpperCase()).replace('{{ko}}', c.nameKo)
    .replace('{{l1}}', s.l1).replace('{{l2}}', s.l2).replace('{{l3}}', s.l3).replace('{{line}}', s.line);
  const file = join(dir, s.out.replace('.jpg', '.html'));
  writeFileSync(file, html);
  const png = file.replace('.html', '.png');
  execFileSync('node', [join(root, 'scripts/capture/fullpage.mjs'), `file://${file}`, png, '1200', '0', '630'], { stdio: 'inherit' });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', png, '--out', join(root, 'public', s.out)], { stdio: 'ignore' });
  console.log('saved public/' + s.out);
}
