// CSV tối giản: dấu ngoặc kép, CRLF/LF, BOM. Không thêm dependency.
import { readFileSync, writeFileSync } from 'node:fs';

export function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

/** Đọc CSV có dòng tiêu đề, trả mảng object. */
export function readCsvObjects(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  const head = rows.shift();
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

function quote(v) {
  const s = String(v ?? '');
  return /[",\n\r]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function writeCsv(path, header, objects) {
  const lines = [header.join(',')];
  for (const o of objects) lines.push(header.map((h) => quote(o[h])).join(','));
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
}
