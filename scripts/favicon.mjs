// favicon.ico 만들기. 32×32 PNG를 ICO 상자에 그대로 담는다(PNG를 품은 ICO는 모든 최신 브라우저가 읽는다).
// 쓰는 법: node scripts/favicon.mjs <32x32.png> public/favicon.ico
import { readFileSync, writeFileSync } from 'node:fs';
const [src, out] = process.argv.slice(2);
const png = readFileSync(src);
const head = Buffer.alloc(22);
head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
writeFileSync(out, Buffer.concat([head, png]));
console.log('saved', out, png.length + 22, 'bytes');
