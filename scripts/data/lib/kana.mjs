// Bảng kana: 46 cơ bản + 25 dakuten/handakuten + 33 yōon, mỗi bộ. Romaji Hepburn.
// [hiragana, romaji hiển thị, hậu tố id]. Chỉ ぢ và づ có id khác romaji.
const basic = [
  ['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o'],
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'n'],
];
const dakuten = [
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['ぢ', 'ji', 'di'], ['づ', 'zu', 'du'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
];
const yoonRows = [
  ['き', 'ky'], ['し', 'sh'], ['ち', 'ch'], ['に', 'ny'], ['ひ', 'hy'], ['み', 'my'],
  ['り', 'ry'], ['ぎ', 'gy'], ['じ', 'j'], ['び', 'by'], ['ぴ', 'py'],
];
const small = [['ゃ', 'a'], ['ゅ', 'u'], ['ょ', 'o']];
const yoon = yoonRows.flatMap(([k, r]) =>
  small.map(([s, v]) => {
    // sha/shu/sho, cha/chu/cho, ja/ju/jo: không có y thừa
    const rom = r + v;
    return [k + s, rom];
  }),
);

const toKata = (s) => [...s].map((c) => String.fromCodePoint(c.codePointAt(0) + 0x60)).join('');

/** Trả mảng { id, script, kana, romaji, grp } theo thứ tự bảng chuẩn, hiragana trước katakana. */
export function buildKana() {
  const out = [];
  for (const script of ['hira', 'kata']) {
    for (const [grp, list] of [['basic', basic], ['dakuten', dakuten], ['yoon', yoon]]) {
      for (const [h, romaji, idSuffix] of list) {
        out.push({
          id: `kana:${script}:${idSuffix ?? romaji}`,
          script,
          kana: script === 'hira' ? h : toKata(h),
          romaji,
          grp,
        });
      }
    }
  }
  return out;
}
