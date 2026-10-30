// 이름 뒤 조사를 받침에 맞춰 고른다(킬로팝은 / 런포토는). 한글로 끝나지 않으면 받침 없는 쪽을 쓴다.
const PAIRS = { 은: ['은', '는'], 는: ['은', '는'], 이: ['이', '가'], 가: ['이', '가'], 을: ['을', '를'], 를: ['을', '를'], 과: ['과', '와'], 와: ['과', '와'] };

export function particle(word, p) {
  const pair = PAIRS[p];
  if (!pair) return p;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return pair[1];
  return (code - 0xac00) % 28 ? pair[0] : pair[1];
}

export const josa = (word, p) => word + particle(word, p);
