// Pipeline dữ liệu nội dung: raw (ngoài repo) + data/vi -> data/build/*.json
// Dùng: pnpm data:build -- --raw <thư mục raw> [--include-drafts] [--levels N5[,N4]] [--out <dir>] [--report <dir>] (hoặc đặt NIHONGO_RAW)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readCsvObjects } from './lib/csv.mjs';
import { buildKana } from './lib/kana.mjs';
import { parseKanjidic, parseJmdict, priScore } from './lib/xml.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const rawDir = opt('--raw', process.env.NIHONGO_RAW);
if (!rawDir) {
  console.error('Thiếu --raw <thư mục raw> (hoặc biến môi trường NIHONGO_RAW)');
  process.exit(2);
}
const includeDrafts = args.includes('--include-drafts');
const vocabLevels = opt('--levels', 'N5').split(',').map((s) => s.trim());
const outDir = resolve(opt('--out', join(root, 'data', 'build')));
const reportDir = resolve(opt('--report', join(rawDir, '..', 'out')));
mkdirSync(outDir, { recursive: true });
mkdirSync(reportDir, { recursive: true });

const nfc = (s) => s.normalize('NFC');
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const readLines = (p) => readFileSync(p, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const isApproved = (row) => row?.trang_thai === 'duyet';
const isPublishable = (row, hasMeaning) =>
  !!row && hasMeaning && (isApproved(row) || (includeDrafts && row.trang_thai === 'nhap'));

const cards = [];

// ---------- Kana ----------
const kana = buildKana();
kana.forEach((k, i) => cards.push({ id: k.id, kind: 'kana', level: null, sort_order: i + 1, published: true }));
const kanaDetails = kana.map((k) => ({ card_id: k.id, script: k.script, kana: k.kana, romaji: k.romaji, grp: k.grp }));

// ---------- Kanji ----------
const kanjiOrder = [];
for (const level of ['N5', 'N4']) {
  for (const line of readLines(join(rawDir, 'tanos', `${level.toLowerCase()}_kanji.csv`)).slice(1)) {
    const k = nfc(line);
    if (!kanjiOrder.some((x) => x.k === k)) kanjiOrder.push({ k, level });
  }
}
const kd = parseKanjidic(join(rawDir, 'kanjidic2', 'kanjidic2.xml'), new Set(kanjiOrder.map((x) => x.k)));
const kanjiVi = new Map(readCsvObjects(join(root, 'data', 'vi', 'kanji.csv')).map((r) => [r.card_id, r]));
const kanjiDetails = [];
const kanjiErrors = [];
kanjiOrder.forEach(({ k, level }, i) => {
  const id = `kanji:${k}`;
  const d = kd.map.get(k);
  if (!d) {
    kanjiErrors.push(`${k}: không có trong KANJIDIC2`);
    return;
  }
  const vi = kanjiVi.get(id);
  const hv = d.vietnam;
  let main = null;
  if (hv.length === 1) main = hv[0];
  else if (hv.length > 1) {
    const want = nfc(vi?.han_viet_main ?? '').toLowerCase();
    main = want ? hv.find((x) => x.toLowerCase() === want) ?? null : null;
    if (want && !main) kanjiErrors.push(`${k}: han_viet_main "${vi.han_viet_main}" không thuộc ${hv.join(', ')}`);
  }
  const meaning = nfc(vi?.meaning_vi ?? '').trim();
  kanjiDetails.push({
    card_id: id,
    kanji: k,
    han_viet_main: main,
    han_viet_other: hv.filter((x) => x !== main),
    han_viet_source: 'kanjidic2',
    meaning_vi: meaning,
    on_readings: d.on,
    kun_readings: d.kun,
  });
  cards.push({
    id,
    kind: 'kanji',
    level,
    sort_order: i + 1,
    published: isPublishable(vi, meaning !== '') && main !== null,
  });
});

// ---------- Từ vựng ----------
const splitAlt = (s) => s.split(/[\/／、]|\s+/).map((x) => x.trim()).filter(Boolean);
// Cách viết thay thế: bỏ "・", bỏ "する" cuối (danh từ + する), vd. "さんぽする" -> "さんぽ".
const variants = (w) => [...new Set([w, w.replace(/・/g, ''), w.replace(/・?する$/, '')])].filter(Boolean);
// Sửa tay những dòng tanos ghi sai chữ: "wRaw|rRaw" -> [word, reading]
const TANOS_FIX = {
  '伯父/叔父|おじいさん': ['お祖父さん', 'おじいさん'],
  '伯父/叔父|おじさん': ['伯父さん', 'おじさん'],
  '誰|だれか': ['誰か', 'だれか'],
  'ゆっくりと|ゆっくりと': ['ゆっくり', 'ゆっくり'],
  'より、ほう|より、ほう': [['より', 'より'], ['方', 'ほう']], // nhiều cặp (word, reading)
};
// Chọn tay mục JMdict khi nhiều ứng viên cùng độ ưu tiên: "wRaw|rRaw" -> ent_seq
const TANOS_PICK = { 'はく|はく': 1607260, 'なる|なる': 1375610}; // はく=履く/穿く (mặc đồ phần dưới); なる=成る/為る (trở thành)

const tanosRows = []; // { level, wRaw, rRaw, pairs[[w, r]] }
for (const level of vocabLevels) {
  const rows = readFileSync(join(rawDir, 'tanos-vocab', `${level.toLowerCase()}_vocab_nocleanup.csv`), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter((l) => l.trim());
  for (const line of rows) {
    const i = line.indexOf(',');
    const wRaw = nfc(line.slice(0, i)), rRaw = nfc(line.slice(i + 1));
    const fix = TANOS_FIX[`${wRaw}|${rRaw}`];
    const multi = Array.isArray(fix?.[0]);
    const Wa = fix && !multi ? [fix[0]] : splitAlt(wRaw), Ra = fix && !multi ? [fix[1]] : splitAlt(rRaw);
    const pairs = [];
    if (multi) pairs.push(...fix);
    else if (Wa.length > 1 && Wa.length === Ra.length) {
      Wa.forEach((w, j) => {
        for (const vw of variants(w)) for (const vr of variants(Ra[j])) pairs.push([vw, vr]);
      });
    } else for (const w of Wa.flatMap(variants)) for (const r of Ra.flatMap(variants)) pairs.push([w, r]);
    tanosRows.push({ level, wRaw, rRaw, pairs });
  }
}
const wantedWords = new Set(tanosRows.flatMap((t) => t.pairs.map((p) => p[0])));
const wantedReadings = new Set(tanosRows.flatMap((t) => t.pairs.map((p) => p[1])));
const jm = parseJmdict(join(rawDir, 'jmdict', 'JMdict_e.xml'), wantedWords, wantedReadings);

// Ứng viên cho (word, reading): ưu tiên khớp chữ Hán, với từ viết kana thì ưu tiên mục không có chữ Hán, rồi mục "usually kana", cuối cùng mọi mục có cách đọc đó.
function candidates(w, r) {
  const out = [];
  for (const e of jm.entries) {
    const reb = e.rebs.find((x) => x.r === r);
    if (!reb) continue;
    const keb = e.kebs.find((x) => x.k === w);
    if (keb) {
      if (reb.nokanji) continue;
      if (reb.restr.length && !reb.restr.includes(w)) continue;
      out.push({ e, rank: 0, pri: [...keb.pri, ...reb.pri], word: w, reading: r });
    } else if (w === r) {
      if (e.kebs.length === 0) out.push({ e, rank: 0, pri: reb.pri, word: w, reading: r });
      else if (e.senses.some((s) => s.misc.includes('uk'))) out.push({ e, rank: 0, pri: reb.pri, word: w, reading: r });
      else out.push({ e, rank: 2, pri: [...reb.pri, ...e.kebs.flatMap((k) => k.pri)], word: w, reading: r });
    }
  }
  if (!out.length) return out;
  const best = Math.min(...out.map((c) => c.rank));
  return out.filter((c) => c.rank === best);
}

const viVocab = existsSync(join(root, 'data', 'vi', 'vocab.csv'))
  ? new Map(readCsvObjects(join(root, 'data', 'vi', 'vocab.csv')).map((r) => [r.card_id, r]))
  : new Map();
const chosen = new Map(); // seq -> { level, word, reading, status, entry }
const unmatched = [];
const ambiguous = [];
for (const t of tanosRows) {
  // gom ứng viên theo cặp (word, reading); mỗi cặp là một cách viết khác nhau trong dòng tanos
  const groups = new Map();
  for (const [w, r] of t.pairs) {
    const list = candidates(w, r);
    if (list.length) groups.set(`${w}|${r}`, list);
  }
  if (!groups.size) {
    unmatched.push({ level: t.level, word: t.wRaw, reading: t.rRaw });
    continue;
  }
  const rowSeqs = new Set();
  for (const list of groups.values()) {
    // một mục JMdict chỉ một thẻ (a/b cùng ra một mục thì gộp)
    const uniq = [...new Map(list.map((c) => [c.e.seq, c])).values()];
    if (uniq.some((c) => rowSeqs.has(c.e.seq))) continue;
    // Dòng tanos lặp lại một mục đã chọn: chỉ thêm mục khác nếu nó có độ ưu tiên (vd. あの), không thì bỏ qua.
    const repeat = uniq.some((c) => chosen.has(c.e.seq));
    const fresh = uniq.filter((c) => !chosen.has(c.e.seq) && (!repeat || priScore(c.pri) > 0));
    if (repeat && !fresh.length) continue;
    let pool = fresh.length ? fresh : uniq;
    const forced = TANOS_PICK[`${t.wRaw}|${t.rRaw}`];
    if (forced && pool.some((c) => c.e.seq === forced)) pool = pool.filter((c) => c.e.seq === forced);
    let pick, status;
    if (pool.length === 1) {
      pick = pool[0];
      status = 'unique';
    } else {
      const good = pool.filter((c) => priScore(c.pri) > 0);
      if (good.length === 1) {
        pick = good[0];
        status = 'pri';
      } else {
        pick = [...(good.length ? good : pool)].sort((a, b) => priScore(b.pri) - priScore(a.pri) || a.e.seq - b.e.seq)[0];
        status = 'ambiguous';
        ambiguous.push({
          level: t.level,
          word: pick.word,
          reading: pick.reading,
          chosen: pick.e.seq,
          candidates: pool.map((c) => ({ seq: c.e.seq, pri: c.pri, gloss: c.e.senses[0]?.glosses.slice(0, 3) })),
        });
      }
    }
    rowSeqs.add(pick.e.seq);
    if (!chosen.has(pick.e.seq)) {
      chosen.set(pick.e.seq, { level: t.level, word: pick.word, reading: pick.reading, status, entry: pick.e });
    }
  }
}

const vocabDetails = [];
const glossRows = [];
let vOrder = 0;
for (const [seq, c] of chosen) {
  vOrder++;
  const id = `vocab:${seq}`;
  const vi = viVocab.get(id);
  const meaning = nfc(vi?.meaning_vi ?? '').trim();
  vocabDetails.push({
    card_id: id,
    jmdict_seq: seq,
    word: c.word,
    reading: c.reading,
    meaning_vi: meaning,
    example_ja: null,
    example_vi: null,
    tatoeba_id: null,
  });
  cards.push({ id, kind: 'vocab', level: c.level, sort_order: vOrder, published: isPublishable(vi, meaning !== '') });
  glossRows.push(
    [
      id,
      c.level,
      c.word,
      c.reading,
      c.status,
      c.entry.senses.slice(0, 3).map((s) => `[${s.pos.join(',')}] ${s.glosses.join(', ')}`).join(' || '),
    ].join('\t'),
  );
}

// ---------- Ghi ----------
const byId = (a, b) => cmp(a.id, b.id);
const byCard = (a, b) => cmp(a.card_id, b.card_id);
const write = (name, data) => writeFileSync(join(outDir, name), JSON.stringify(data, null, 2) + '\n', 'utf8');
write('cards.json', cards.sort(byId));
write('kana_details.json', kanaDetails.sort(byCard));
write('kanji_details.json', kanjiDetails.sort(byCard));
write('vocab_details.json', vocabDetails.sort(byCard));
// Nguồn dữ liệu cho bảng data_sources (khớp data/LICENSE.md). downloaded_on: ngày tải bản gốc.
const TANOS = 'https://github.com/Bluskyo/JLPT_Vocabulary (commit d29a678, mirror của tanos.co.uk)';
write('data_sources.json', [
  { name: 'KANJIDIC2', author: 'Electronic Dictionary Research and Development Group (EDRDG)', license: 'CC BY-SA 4.0', url: 'https://www.edrdg.org/kanjidic/kanjd2index.html', downloaded_on: '2026-11-18', note: `database_version ${kd.version}; âm Hán Việt, âm on/kun, nghĩa tiếng Anh làm gốc dịch` },
  { name: 'JMdict_e', author: 'Electronic Dictionary Research and Development Group (EDRDG)', license: 'CC BY-SA 4.0', url: 'https://www.edrdg.org/jmdict/j_jmdict.html', downloaded_on: '2026-11-18', note: `JMdict created ${jm.created}; mã mục, cách đọc, nghĩa tiếng Anh làm gốc dịch` },
  { name: 'Danh sách kanji JLPT N5, N4 (tanos.co.uk)', author: 'Jonathan Waller', license: 'CC BY (theo nguồn thứ cấp)', url: TANOS, downloaded_on: '2026-11-18', note: 'Cấp JLPT của kanji; lấy qua mirror, chưa đọc được trang gốc' },
  { name: 'Danh sách từ vựng JLPT N5, N4 (tanos.co.uk)', author: 'Jonathan Waller', license: 'CC BY (theo nguồn thứ cấp)', url: TANOS, downloaded_on: '2026-11-18', note: 'Cấp JLPT và thứ tự của từ vựng; lấy qua mirror, chưa đọc được trang gốc' },
].sort((a, b) => cmp(a.name, b.name)));
const rep = (name, text) => writeFileSync(join(reportDir, name), text, 'utf8');
rep('vocab-glosses.tsv', 'card_id\tlevel\tword\treading\tstatus\tglosses\n' + glossRows.join('\n') + '\n');
rep('vocab-unmatched.json', JSON.stringify(unmatched, null, 2) + '\n');
rep('vocab-ambiguous.json', JSON.stringify(ambiguous, null, 2) + '\n');
if (kanjiErrors.length) rep('kanji-errors.txt', kanjiErrors.join('\n') + '\n');

// ---------- Tổng kết ----------
const count = (f) => cards.filter(f).length;
console.log(`Nguồn: KANJIDIC2 ${kd.version}; JMdict created ${jm.created} (${jm.total} mục); drafts=${includeDrafts}`);
for (const kind of ['kana', 'vocab', 'kanji']) {
  const lv = (l) => count((c) => c.kind === kind && c.level === l);
  console.log(
    `${kind}: ${count((c) => c.kind === kind)} thẻ (N5 ${lv('N5')}, N4 ${lv('N4')}, null ${lv(null)}), published ${count((c) => c.kind === kind && c.published)}`,
  );
}
console.log(`vocab: tanos ${tanosRows.length} dòng, không khớp ${unmatched.length}, mơ hồ ${ambiguous.length}`);
if (kanjiErrors.length) console.log('Lỗi kanji:', kanjiErrors.join('; '));
console.log(`Ghi vào ${outDir}; báo cáo ở ${reportDir}`);
if (kanjiErrors.length) process.exit(1);
