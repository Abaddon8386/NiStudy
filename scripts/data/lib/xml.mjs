// Đọc KANJIDIC2 và JMdict bằng regex (định dạng ổn định, không cần thư viện XML).
import { readFileSync } from 'node:fs';

const nfc = (s) => s.normalize('NFC');

export function decode(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

const all = (re, s) => [...s.matchAll(re)].map((m) => m[1]);

/** KANJIDIC2 -> Map literal -> { vietnam[], on[], kun[], meanings[] } và database_version. */
export function parseKanjidic(path, wanted) {
  const xml = readFileSync(path, 'utf8');
  const version = /<database_version>(.*?)<\/database_version>/.exec(xml)?.[1] ?? null;
  const map = new Map();
  for (const m of xml.matchAll(/<character>([\s\S]*?)<\/character>/g)) {
    const b = m[1];
    const rawLit = decode(/<literal>(.*?)<\/literal>/.exec(b)[1]);
    const lit = nfc(rawLit);
    if (rawLit !== lit) continue; // chữ tương thích (vd. U+FA45) sẽ đè chữ chuẩn sau NFC
    if (wanted && !wanted.has(lit)) continue;
    const rd = (type) =>
      all(new RegExp(`<reading r_type="${type}">(.*?)</reading>`, 'g'), b).map((x) => nfc(decode(x)));
    // nghĩa mặc định (tiếng Anh) không có thuộc tính m_lang
    const meanings = all(/<meaning>(.*?)<\/meaning>/g, b).map((x) => decode(x));
    map.set(lit, { vietnam: rd('vietnam'), on: rd('ja_on'), kun: rd('ja_kun'), meanings });
  }
  return { version, map };
}

const PRI_GOOD = new Set(['ichi1', 'news1', 'spec1']);

/**
 * JMdict: chỉ giữ mục có keb thuộc wantedWords hoặc reb thuộc wantedReadings.
 * Trả { created, entries[] } với entry = { seq, kebs[{k, pri[]}], rebs[{r, pri[], nokanji, restr[]}], senses[{pos[], misc[], glosses[]}] }
 */
export function parseJmdict(path, wantedWords, wantedReadings) {
  const xml = readFileSync(path, 'utf8');
  const created = /<!-- JMdict created: ([^ ]+) -->/.exec(xml)?.[1] ?? null;
  const entries = [];
  let total = 0;
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    total++;
    const b = m[1];
    const kebs = [...b.matchAll(/<k_ele>([\s\S]*?)<\/k_ele>/g)].map((x) => ({
      k: nfc(decode(/<keb>(.*?)<\/keb>/.exec(x[1])[1])),
      pri: all(/<ke_pri>(.*?)<\/ke_pri>/g, x[1]),
    }));
    const rebs = [...b.matchAll(/<r_ele>([\s\S]*?)<\/r_ele>/g)].map((x) => ({
      r: nfc(decode(/<reb>(.*?)<\/reb>/.exec(x[1])[1])),
      pri: all(/<re_pri>(.*?)<\/re_pri>/g, x[1]),
      nokanji: x[1].includes('<re_nokanji/>'),
      restr: all(/<re_restr>(.*?)<\/re_restr>/g, x[1]).map((s) => nfc(decode(s))),
    }));
    if (!kebs.some((k) => wantedWords.has(k.k)) && !rebs.some((r) => wantedReadings.has(r.r))) continue;
    const senses = [...b.matchAll(/<sense>([\s\S]*?)<\/sense>/g)].map((x) => ({
      pos: all(/<pos>&?(.*?);?<\/pos>/g, x[1]),
      misc: all(/<misc>&?(.*?);?<\/misc>/g, x[1]),
      glosses: all(/<gloss[^>]*>(.*?)<\/gloss>/g, x[1]).map((g) => decode(g)),
    }));
    entries.push({ seq: Number(/<ent_seq>(\d+)<\/ent_seq>/.exec(b)[1]), kebs, rebs, senses });
  }
  return { created, total, entries };
}

export const priScore = (pris) => pris.filter((p) => PRI_GOOD.has(p)).length;
