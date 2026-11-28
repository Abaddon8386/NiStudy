// Ngữ pháp: đọc data/vi/grammar/<level>/*.json, kiểm định dạng, dựng thẻ + chi tiết cho build/check.
// Không thêm dependency; hàm thuần ngoài loadGrammarFiles.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const BLANK = '＿＿';
const LEVELS = ['N5', 'N4'];
const STATUS = ['nhap', 'duyet'];
const KEYS = ['id', 'level', 'order', 'title', 'pattern', 'meaning_vi', 'explanation', 'notes', 'examples', 'exercises', 'trang_thai', 'nguoi_bien_soan'];

const nfc = (s) => s.normalize('NFC');
const str = (v) => typeof v === 'string' && v.trim() !== '';
const count = (s, sub) => s.split(sub).length - 1;

/** Chuẩn hóa NFC mọi chuỗi trong cấu trúc JSON (trả bản sao). */
export function nfcDeep(v) {
  if (typeof v === 'string') return nfc(v);
  if (Array.isArray(v)) return v.map(nfcDeep);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nfcDeep(x)]));
  return v;
}

/** Đọc mọi file `<dir>/<level>/*.json` (không đệ quy sâu hơn). Trả [{ file, dirLevel, data, error }]. */
export function loadGrammarFiles(dir) {
  const out = [];
  if (!dir || !existsSync(dir)) return out;
  for (const lv of readdirSync(dir).sort()) {
    const sub = join(dir, lv);
    if (!statSync(sub).isDirectory()) continue;
    for (const f of readdirSync(sub).filter((x) => x.endsWith('.json')).sort()) {
      const file = `${lv}/${f}`;
      try {
        const text = readFileSync(join(sub, f), 'utf8').replace(/^﻿/, '');
        out.push({ file, dirLevel: lv.toUpperCase(), data: JSON.parse(text) });
      } catch (e) {
        out.push({ file, dirLevel: lv.toUpperCase(), data: null, error: `JSON không đọc được: ${e.message}` });
      }
    }
  }
  return out;
}

/** ruby (có [...] ) bỏ phần [...] và khoảng trắng phải bằng ja bỏ khoảng trắng. */
export function rubyMatches(ja, ruby) {
  const strip = (s) => s.replace(/\[[^\]]*\]/g, '').replace(/\s+/g, '');
  return strip(ruby) === ja.replace(/\s+/g, '');
}

/** Lỗi của một điểm ngữ pháp (mảng chuỗi, rỗng nếu hợp lệ). `dirLevel` có thể bỏ qua. */
export function validateGrammarPoint(p, dirLevel) {
  const e = [];
  if (!p || typeof p !== 'object' || Array.isArray(p)) return ['không phải đối tượng JSON'];
  for (const k of KEYS) if (!(k in p)) e.push(`thiếu khóa "${k}"`);
  if (e.length) return e;
  if (!(typeof p.id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(p.id))) e.push('id phải là chữ thường/số/gạch ngang');
  if (!LEVELS.includes(p.level)) e.push('level phải là N5 hoặc N4');
  else if (dirLevel && dirLevel !== p.level) e.push(`level ${p.level} không khớp thư mục ${dirLevel}`);
  if (!(Number.isInteger(p.order) && p.order > 0)) e.push('order phải là số nguyên dương');
  for (const k of ['title', 'pattern', 'meaning_vi', 'nguoi_bien_soan']) if (!str(p[k])) e.push(`${k} rỗng`);
  if (!STATUS.includes(p.trang_thai)) e.push('trang_thai phải là nhap hoặc duyet');

  if (!Array.isArray(p.explanation) || p.explanation.length === 0) e.push('explanation phải là mảng không rỗng');
  else
    p.explanation.forEach((x, i) => {
      if (!x || typeof x !== 'object' || !str(x.body)) e.push(`explanation[${i}].body rỗng`);
      else if ('heading' in x && !str(x.heading)) e.push(`explanation[${i}].heading rỗng`);
    });
  if (!Array.isArray(p.notes) || !p.notes.every(str)) e.push('notes phải là mảng chuỗi không rỗng');

  if (!Array.isArray(p.examples) || p.examples.length === 0) e.push('examples phải là mảng không rỗng');
  else
    p.examples.forEach((x, i) => {
      if (!x || !str(x.ja) || !str(x.ruby) || !str(x.vi)) e.push(`examples[${i}] thiếu ja/ruby/vi`);
      else if (!rubyMatches(x.ja, x.ruby)) e.push(`examples[${i}]: ruby bỏ [...] không khớp ja`);
    });

  if (!Array.isArray(p.exercises)) e.push('exercises phải là mảng');
  else
    p.exercises.forEach((x, i) => {
      const w = `exercises[${i}]`;
      if (!x || typeof x !== 'object') return e.push(`${w} không phải đối tượng`);
      if (x.type !== 'cloze') e.push(`${w}.type phải là "cloze"`);
      if (!str(x.prompt_ja) || count(x.prompt_ja, BLANK) !== 1) e.push(`${w}.prompt_ja phải có đúng một "${BLANK}"`);
      if (!str(x.answer)) e.push(`${w}.answer rỗng`);
      if (!str(x.vi)) e.push(`${w}.vi rỗng`);
      if (!Array.isArray(x.choices) || x.choices.length !== 4 || !x.choices.every(str)) e.push(`${w}.choices phải là 4 chuỗi không rỗng`);
      else {
        if (new Set(x.choices.map(nfc)).size !== 4) e.push(`${w}.choices có phần tử trùng`);
        if (str(x.answer) && !x.choices.map(nfc).includes(nfc(x.answer))) e.push(`${w}.answer không nằm trong choices`);
      }
    });
  return e;
}

/** Lỗi cả bộ: từng file + id duy nhất + order duy nhất mỗi level. Trả mảng "file: lỗi". */
export function validateGrammarSet(files) {
  const errs = [];
  const seenId = new Map();
  const seenOrder = new Map();
  for (const f of files) {
    if (f.error) {
      errs.push(`${f.file}: ${f.error}`);
      continue;
    }
    for (const m of validateGrammarPoint(f.data, f.dirLevel)) errs.push(`${f.file}: ${m}`);
    const { id, level, order } = f.data ?? {};
    if (typeof id === 'string') {
      if (seenId.has(id)) errs.push(`${f.file}: id "${id}" trùng với ${seenId.get(id)}`);
      else seenId.set(id, f.file);
    }
    if (Number.isInteger(order) && level) {
      const key = `${level}#${order}`;
      if (seenOrder.has(key)) errs.push(`${f.file}: order ${order} (${level}) trùng với ${seenOrder.get(key)}`);
      else seenOrder.set(key, f.file);
    }
  }
  return errs;
}

/** Từ các điểm hợp lệ dựng thẻ và chi tiết (đã NFC, sắp theo card_id). */
export function buildGrammar(files, includeDrafts) {
  const cards = [];
  const details = [];
  for (const f of files) {
    const p = nfcDeep(f.data);
    const card_id = `grammar:${p.id}`;
    const published = p.trang_thai === 'duyet' || (includeDrafts && p.trang_thai === 'nhap');
    cards.push({ id: card_id, kind: 'grammar', level: p.level, sort_order: p.order, published });
    details.push({
      card_id,
      point_id: p.id,
      level: p.level,
      sort: p.order,
      title: p.title,
      pattern: p.pattern,
      meaning_vi: p.meaning_vi,
      explanation: p.explanation,
      notes: p.notes,
      examples: p.examples,
      exercises: p.exercises,
    });
  }
  const byCard = (a, b) => (a.card_id < b.card_id ? -1 : a.card_id > b.card_id ? 1 : 0);
  return { cards, details: details.sort(byCard) };
}
