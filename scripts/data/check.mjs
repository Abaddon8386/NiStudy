// Kiểm tra data/build/*.json. Dùng: node scripts/data/check.mjs [--dir <thư mục build>] [--include-drafts] [--grammar-dir <nguồn ngữ pháp>]
// Thoát với mã 1 nếu có lỗi. --include-drafts: kiểm bản build có bao gồm nghĩa nháp.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsvObjects } from './lib/csv.mjs';
import { BLANK, loadGrammarFiles, nfcDeep, rubyMatches, validateGrammarSet } from './lib/grammar.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dir = resolve(di >= 0 ? args[di + 1] : join(root, 'data', 'build'));
const gi = args.indexOf('--grammar-dir');
const grammarDir = resolve(gi >= 0 ? args[gi + 1] : join(root, 'data', 'vi', 'grammar'));
const includeDrafts = args.includes('--include-drafts');

const fails = [];
let passes = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passes++;
    console.log(`OK    ${name}`);
  } else {
    fails.push(name);
    console.log(`FAIL  ${name}${detail ? ': ' + detail : ''}`);
  }
}
const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const cards = load('cards.json');
const kana = load('kana_details.json');
const kanji = load('kanji_details.json');
const vocab = load('vocab_details.json');
const grammar = load('grammar_details.json');
const sources = load('data_sources.json');

const dups = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
const sample = (arr) => arr.slice(0, 5).join(', ');

// id
const ids = cards.map((c) => c.id);
check('cards: id không trùng', dups(ids).length === 0, sample(dups(ids)));
check('cards: sắp theo id', ids.every((x, i) => i === 0 || ids[i - 1] < x));
check('cards: kind/level hợp lệ', cards.every((c) =>
  ['kana', 'vocab', 'kanji', 'grammar'].includes(c.kind) &&
  (c.kind === 'kana' ? c.level === null : ['N5', 'N4'].includes(c.level)) &&
  Number.isInteger(c.sort_order) && typeof c.published === 'boolean'));
for (const kind of ['kana', 'vocab', 'kanji']) {
  const so = cards.filter((c) => c.kind === kind).map((c) => c.sort_order);
  check(`cards: sort_order của ${kind} không trùng`, dups(so).length === 0);
}

check('cards: sort_order của grammar không trùng trong cùng level', ['N5', 'N4'].every((lv) =>
  dups(cards.filter((c) => c.kind === 'grammar' && c.level === lv).map((c) => c.sort_order)).length === 0));

// kana
check('kana: 208 thẻ', kana.length === 208, String(kana.length));
for (const script of ['hira', 'kata']) {
  for (const [grp, n] of [['basic', 46], ['dakuten', 25], ['yoon', 33]]) {
    const c = kana.filter((k) => k.script === script && k.grp === grp).length;
    check(`kana: ${script}/${grp} = ${n}`, c === n, String(c));
  }
}
check('kana: id không trùng, dạng kana:<script>:<id>', dups(kana.map((k) => k.card_id)).length === 0 &&
  kana.every((k) => k.card_id.startsWith(`kana:${k.script}:`)));
check('kana: ぢ/づ có id di/du, romaji ji/zu', (() => {
  const g = (id) => kana.find((k) => k.card_id === id);
  return g('kana:hira:di')?.kana === 'ぢ' && g('kana:hira:di').romaji === 'ji' &&
    g('kana:hira:du')?.kana === 'づ' && g('kana:hira:du').romaji === 'zu' &&
    g('kana:kata:di')?.kana === 'ヂ' && g('kana:kata:du')?.kana === 'ヅ';
})());
check('kana: kana đúng bảng chữ (hira U+3041–309F, kata U+30A1–30FF)', kana.every((k) =>
  [...k.kana].every((ch) => {
    const cp = ch.codePointAt(0);
    return k.script === 'hira' ? cp >= 0x3041 && cp <= 0x309f : cp >= 0x30a1 && cp <= 0x30ff;
  })));
check('kana: không có ゐ/ゑ', !kana.some((k) => /[ゐゑヰヱ]/.test(k.kana)));
check('kana: toàn bộ published', cards.filter((c) => c.kind === 'kana').every((c) => c.published));

// kanji
check('kanji: 245 chữ (79 N5 + 166 N4)', kanji.length === 245 &&
  cards.filter((c) => c.kind === 'kanji' && c.level === 'N5').length === 79 &&
  cards.filter((c) => c.kind === 'kanji' && c.level === 'N4').length === 166,
  `${kanji.length}`);
check('kanji: id không trùng', dups(kanji.map((k) => k.card_id)).length === 0);
check('kanji: card_id = kanji:<chữ>', kanji.every((k) => k.card_id === `kanji:${k.kanji}`));
const hvBad = kanji.filter((k) => {
  if (k.han_viet_main === null) return false;
  const all = [k.han_viet_main, ...k.han_viet_other];
  return k.han_viet_other.includes(k.han_viet_main) || dups(all).length > 0;
});
check('kanji: han_viet_main không lặp trong han_viet_other', hvBad.length === 0, sample(hvBad.map((k) => k.kanji)));
check('kanji: có han_viet_main (kanjidic2)', kanji.every((k) => k.han_viet_main), sample(kanji.filter((k) => !k.han_viet_main).map((k) => k.kanji)));
const viKanji = new Map(readCsvObjects(join(root, 'data', 'vi', 'kanji.csv')).map((r) => [r.card_id, r]));
const multi = kanji.filter((k) => k.han_viet_other.length > 0);
const multiBad = multi.filter((k) => {
  const csv = viKanji.get(k.card_id)?.han_viet_main?.normalize('NFC').toLowerCase();
  return !csv || ![k.han_viet_main, ...k.han_viet_other].some((x) => x.toLowerCase() === csv) || k.han_viet_main.toLowerCase() !== csv;
});
check(`kanji: ${multi.length} chữ nhiều âm có main thuộc danh sách âm và khớp data/vi/kanji.csv`, multiBad.length === 0, sample(multiBad.map((k) => k.kanji)));
check('kanji: han_viet_source hợp lệ', kanji.every((k) => ['kanjidic2', 'manual'].includes(k.han_viet_source)));

// vocab
check('vocab: id không trùng, card_id = vocab:<seq>', dups(vocab.map((v) => v.card_id)).length === 0 &&
  vocab.every((v) => v.card_id === `vocab:${v.jmdict_seq}`));
check('vocab: có word và reading', vocab.every((v) => v.word && v.reading));
check('vocab: example/tatoeba null', vocab.every((v) => v.example_ja === null && v.example_vi === null && v.tatoeba_id === null));

// ngữ pháp (build)
check('grammar: card_id = grammar:<point_id>, không trùng, sắp theo card_id', grammar.every((g) => g.card_id === `grammar:${g.point_id}`) &&
  dups(grammar.map((g) => g.card_id)).length === 0 && grammar.every((g, i) => i === 0 || grammar[i - 1].card_id < g.card_id));
check('grammar: thẻ cùng level/sort_order với chi tiết', grammar.every((g) => {
  const c = cards.find((x) => x.id === g.card_id);
  return c && c.level === g.level && c.sort_order === g.sort;
}));
check('grammar: đủ trường chi tiết', grammar.every((g) => ['title', 'pattern', 'meaning_vi'].every((k) => typeof g[k] === 'string' && g[k].trim()) &&
  Array.isArray(g.explanation) && g.explanation.length > 0 && Array.isArray(g.notes) && Array.isArray(g.examples) && g.examples.length > 0 && Array.isArray(g.exercises)));
check('grammar: ví dụ có ruby khớp ja', grammar.every((g) => g.examples.every((x) => rubyMatches(x.ja, x.ruby))),
  sample(grammar.filter((g) => g.examples.some((x) => !rubyMatches(x.ja, x.ruby))).map((g) => g.point_id)));
check('grammar: bài tập cloze có đúng một chỗ trống, 4 lựa chọn khác nhau chứa đáp án', grammar.every((g) => g.exercises.every((x) =>
  x.type === 'cloze' && x.prompt_ja.split(BLANK).length === 2 && Array.isArray(x.choices) && x.choices.length === 4 &&
  new Set(x.choices).size === 4 && x.choices.includes(x.answer))),
  sample(grammar.filter((g) => g.exercises.some((x) => x.prompt_ja.split(BLANK).length !== 2 || new Set(x.choices).size !== 4 || !x.choices.includes(x.answer))).map((g) => g.point_id)));

// chi tiết <-> cards
for (const [kind, list] of [['kana', kana], ['kanji', kanji], ['vocab', vocab], ['grammar', grammar]]) {
  const cs = new Set(cards.filter((c) => c.kind === kind).map((c) => c.id));
  const ds = new Set(list.map((d) => d.card_id));
  check(`${kind}: chi tiết khớp cards 1-1`, cs.size === ds.size && [...ds].every((x) => cs.has(x)),
    `cards ${cs.size}, chi tiết ${ds.size}`);
}

// data_sources
check('data_sources: 4 nguồn đủ trường, ngày hợp lệ', sources.length === 4 && sources.every((s) =>
  ['name', 'author', 'license', 'url', 'downloaded_on', 'note'].every((k) => typeof s[k] === 'string' && s[k]) &&
  /^\d{4}-\d{2}-\d{2}$/.test(s.downloaded_on)));

// NFC
const nonNfc = [];
(function walk(v, path) {
  if (typeof v === 'string') {
    if (v !== v.normalize('NFC')) nonNfc.push(`${path}: ${v}`);
  } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
})([cards, kana, kanji, vocab, grammar, sources], '');
check('mọi chuỗi là NFC', nonNfc.length === 0, sample(nonNfc));

// published <-> trang_thai
const viVocab = new Map(readCsvObjects(join(root, 'data', 'vi', 'vocab.csv')).map((r) => [r.card_id, r]));
const byId = new Map(cards.map((c) => [c.id, c]));
function expectedPublished(row, hasMeaning, hasMain) {
  if (!row || !hasMeaning || !hasMain) return false;
  return row.trang_thai === 'duyet' || (includeDrafts && row.trang_thai === 'nhap');
}
const kPub = kanji.filter((k) => byId.get(k.card_id).published !== expectedPublished(viKanji.get(k.card_id), k.meaning_vi !== '', !!k.han_viet_main));
check(`kanji: published nhất quán với trang_thai (${includeDrafts ? 'có' : 'không'} nháp)`, kPub.length === 0, sample(kPub.map((k) => k.kanji)));
const vPub = vocab.filter((v) => byId.get(v.card_id).published !== expectedPublished(viVocab.get(v.card_id), v.meaning_vi !== '', true));
check(`vocab: published nhất quán với trang_thai (${includeDrafts ? 'có' : 'không'} nháp)`, vPub.length === 0, sample(vPub.map((v) => v.card_id)));
check('trang_thai chỉ là duyet hoặc nhap', [...viKanji.values(), ...viVocab.values()].every((r) => ['duyet', 'nhap'].includes(r.trang_thai)));
check('kanji.csv đủ 245 dòng, vocab.csv khớp vocab_details', viKanji.size === 245 &&
  vocab.every((v) => viVocab.has(v.card_id)) && viVocab.size === vocab.length,
  `kanji.csv ${viKanji.size}, vocab.csv ${viVocab.size}, vocab ${vocab.length}`);
check('meaning_vi trong build khớp CSV', kanji.every((k) => k.meaning_vi === (viKanji.get(k.card_id)?.meaning_vi ?? '').normalize('NFC').trim()) &&
  vocab.every((v) => v.meaning_vi === (viVocab.get(v.card_id)?.meaning_vi ?? '').normalize('NFC').trim()));

// ngữ pháp (nguồn) <-> build
const gFiles = loadGrammarFiles(grammarDir);
const gErrors = validateGrammarSet(gFiles);
check(`grammar nguồn (${gFiles.length} file): định dạng hợp lệ`, gErrors.length === 0, sample(gErrors));
if (gErrors.length === 0) {
  const src = gFiles.map((f) => nfcDeep(f.data));
  const gById = new Map(grammar.map((g) => [g.point_id, g]));
  check('grammar: build khớp nguồn 1-1', src.length === grammar.length && src.every((p) => gById.has(p.id)),
    `nguồn ${src.length}, build ${grammar.length}`);
  const gPub = src.filter((p) => cards.find((c) => c.id === `grammar:${p.id}`)?.published !==
    (p.trang_thai === 'duyet' || (includeDrafts && p.trang_thai === 'nhap')));
  check(`grammar: published nhất quán với trang_thai (${includeDrafts ? 'có' : 'không'} nháp)`, gPub.length === 0, sample(gPub.map((p) => p.id)));
  check('grammar: nội dung build khớp nguồn', src.every((p) => {
    const g = gById.get(p.id);
    return g && JSON.stringify([g.level, g.sort, g.title, g.pattern, g.meaning_vi, g.explanation, g.notes, g.examples, g.exercises]) ===
      JSON.stringify([p.level, p.order, p.title, p.pattern, p.meaning_vi, p.explanation, p.notes, p.examples, p.exercises]);
  }));
}

console.log(`\n${fails.length ? 'FAIL' : 'OK'}: ${passes} đạt, ${fails.length} lỗi`);
process.exit(fails.length ? 1 : 0);
