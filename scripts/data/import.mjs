// Import một thư mục build vào Supabase bằng service role (chạy tay trên máy chủ dự án).
// Chạy: node scripts/data/import.mjs [--dir data/build] [--dry-run]   (pnpm data:import -- --dry-run)
// Cần NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong môi trường hoặc .env.local.
// Không xóa dòng cũ của bảng nội dung; data_sources được thay toàn bộ. Không bao giờ in giá trị khóa.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dir = resolve(di >= 0 ? args[di + 1] : join(root, 'data', 'build'));
const dryRun = args.includes('--dry-run');
const BATCH = 500;

function loadEnvFile() {
  const p = join(root, '.env.local');
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

const load = (f) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const cards = load('cards.json');
const tables = [
  ['cards', cards, 'id'],
  ['kana_details', load('kana_details.json'), 'card_id'],
  ['vocab_details', load('vocab_details.json'), 'card_id'],
  ['kanji_details', load('kanji_details.json'), 'card_id'],
];
const sources = load('data_sources.json');

if (dryRun) {
  console.log(`[dry-run] thư mục ${dir}`);
  for (const [name, rows] of tables) console.log(`${name}: ${rows.length} dòng (${Math.ceil(rows.length / BATCH)} lô)`);
  console.log(`data_sources: ${sources.length} dòng (thay toàn bộ)`);
  console.log(`cards published: ${cards.filter((c) => c.published).length}/${cards.length}`);
  process.exit(0);
}

loadEnvFile();
const missing = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  process.exit(2);
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let failed = false;
const fail = (what, error) => {
  failed = true;
  console.error(`LỖI ${what}: ${error?.message ?? error}`);
};

for (const [name, rows, pk] of tables) {
  let done = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from(name).upsert(rows.slice(i, i + BATCH), { onConflict: pk });
    if (error) {
      fail(`upsert ${name} (lô từ dòng ${i})`, error);
      break;
    }
    done += Math.min(BATCH, rows.length - i);
  }
  console.log(`${name}: upsert ${done}/${rows.length} dòng`);
  if (failed) break; // không import bảng chi tiết nếu cards lỗi
}

if (!failed) {
  // cảnh báo thẻ trên máy chủ không còn trong build (không xóa)
  const inBuild = new Set(cards.map((c) => c.id));
  const stale = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('cards').select('id').order('id').range(from, from + 999);
    if (error) {
      fail('đọc cards trên máy chủ', error);
      break;
    }
    for (const r of data) if (!inBuild.has(r.id)) stale.push(r.id);
    if (data.length < 1000) break;
  }
  if (stale.length) console.warn(`CẢNH BÁO: ${stale.length} thẻ trên máy chủ không còn trong build (không xóa), ví dụ: ${stale.slice(0, 5).join(', ')}`);

  const del = await supabase.from('data_sources').delete().gte('id', 0);
  if (del.error) fail('xóa data_sources', del.error);
  else {
    const ins = await supabase.from('data_sources').insert(sources);
    if (ins.error) fail('chèn data_sources', ins.error);
    else console.log(`data_sources: thay toàn bộ, ${sources.length} dòng`);
  }
}
console.log(failed ? 'THẤT BẠI' : 'HOÀN TẤT');
process.exit(failed ? 1 : 0);
