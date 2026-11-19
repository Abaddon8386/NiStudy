-- Bảng nội dung chỉ đọc (docs/04-architecture.md mục 5.2).
-- Project Supabase tắt tự cấp quyền API cho bảng mới nên cấp quyền rõ ràng bên dưới.
-- Không ai ghi được từ trình duyệt: script dữ liệu ghi bằng service role (bỏ qua RLS).

create table public.cards (
  id text primary key,
  kind text not null check (kind in ('kana', 'vocab', 'kanji')),
  level text null check (level in ('N5', 'N4')), -- kana để null
  sort_order int not null,
  published boolean not null default false
);

create index cards_kind_level_sort_idx
  on public.cards (kind, level, sort_order)
  where published;

create table public.kana_details (
  card_id text primary key references public.cards (id) on delete cascade,
  script text not null check (script in ('hira', 'kata')),
  kana text not null,
  romaji text not null,
  grp text not null check (grp in ('basic', 'dakuten', 'yoon'))
);

create table public.vocab_details (
  card_id text primary key references public.cards (id) on delete cascade,
  jmdict_seq int not null,
  word text not null,
  reading text not null,
  meaning_vi text null, -- thẻ chưa đủ nghĩa thì published = false
  example_ja text null,
  example_vi text null,
  tatoeba_id int null
);

create table public.kanji_details (
  card_id text primary key references public.cards (id) on delete cascade,
  kanji text not null,
  han_viet_main text null, -- null: giao diện hiện "Đang bổ sung" (FR-14)
  han_viet_other text[] not null default '{}',
  han_viet_source text null check (han_viet_source in ('kanjidic2', 'manual')),
  meaning_vi text null,
  on_readings text[] not null default '{}',
  kun_readings text[] not null default '{}'
);

create table public.data_sources (
  id int generated always as identity primary key,
  name text not null,
  author text null,
  license text not null,
  url text null,
  downloaded_on date null,
  note text null
);

alter table public.cards enable row level security;
alter table public.kana_details enable row level security;
alter table public.vocab_details enable row level security;
alter table public.kanji_details enable row level security;
alter table public.data_sources enable row level security;

create policy cards_select_all on public.cards
  for select to anon, authenticated using (true);
create policy kana_details_select_all on public.kana_details
  for select to anon, authenticated using (true);
create policy vocab_details_select_all on public.vocab_details
  for select to anon, authenticated using (true);
create policy kanji_details_select_all on public.kanji_details
  for select to anon, authenticated using (true);
create policy data_sources_select_all on public.data_sources
  for select to anon, authenticated using (true);

revoke all on public.cards, public.kana_details, public.vocab_details,
  public.kanji_details, public.data_sources from anon, authenticated;
grant select on public.cards, public.kana_details, public.vocab_details,
  public.kanji_details, public.data_sources to anon, authenticated;
