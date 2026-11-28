-- Ngữ pháp (ADR-0009): thẻ kind = 'grammar', bảng grammar_details, card_payload và get_today_queue
-- biết thẻ ngữ pháp. Project tắt tự cấp quyền API nên cấp quyền rõ ràng.
-- Ghi vào grammar_details chỉ bằng service role (script data:import); client chỉ SELECT.

-- 1. cards.kind cho phép 'grammar'. Tên ràng buộc do Postgres tự đặt (cards_kind_check); tìm theo
--    định nghĩa để chắc chắn bỏ đúng ràng buộc cũ, rồi tạo lại có tên.
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.cards'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.cards drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.cards
  add constraint cards_kind_check check (kind in ('kana', 'vocab', 'kanji', 'grammar'));

-- 2. Chi tiết điểm ngữ pháp.
create table public.grammar_details (
  card_id text primary key references public.cards (id) on delete cascade,
  point_id text not null unique,
  level text not null check (level in ('N5', 'N4')),
  sort int not null,
  title text not null,
  pattern text not null,
  meaning_vi text not null,
  explanation jsonb not null default '[]'::jsonb check (jsonb_typeof(explanation) = 'array'),
  notes jsonb not null default '[]'::jsonb check (jsonb_typeof(notes) = 'array'),
  examples jsonb not null default '[]'::jsonb check (jsonb_typeof(examples) = 'array'),
  exercises jsonb not null default '[]'::jsonb check (jsonb_typeof(exercises) = 'array')
);

alter table public.grammar_details enable row level security;

create policy grammar_details_select_all on public.grammar_details
  for select to anon, authenticated using (true);

revoke all on public.grammar_details from anon, authenticated;
grant select on public.grammar_details to anon, authenticated;
grant select, insert, update, delete on public.grammar_details to service_role;

-- 3. card_payload: thêm nhánh ngữ pháp (giữ nguyên các nhánh kana, vocab, kanji).
create or replace function public.card_payload(p_card_id text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'card', jsonb_build_object('id', c.id, 'kind', c.kind, 'level', c.level),
    'details', case c.kind
      when 'kana' then (
        select to_jsonb(k) - 'card_id'::text from public.kana_details k where k.card_id = c.id)
      when 'vocab' then (
        select to_jsonb(v) - 'card_id'::text from public.vocab_details v where v.card_id = c.id)
      when 'grammar' then (
        select to_jsonb(g) - 'card_id'::text from public.grammar_details g where g.card_id = c.id)
      else (
        select (to_jsonb(k) - 'card_id'::text) || jsonb_build_object('examples', (
          select coalesce(jsonb_agg(e.item order by e.sort_order, e.id), '[]'::jsonb)
          from (
            select vc.id, vc.sort_order,
              jsonb_build_object('word', vd.word, 'reading', vd.reading, 'meaning_vi', vd.meaning_vi) as item
            from public.vocab_details vd
            join public.cards vc on vc.id = vd.card_id
            where vc.published and strpos(vd.word, k.kanji) > 0
            order by vc.sort_order, vc.id
            limit 3
          ) e))
        from public.kanji_details k where k.card_id = c.id)
    end)
  from public.cards c
  where c.id = p_card_id
$$;

revoke execute on function public.card_payload(text) from public, anon, authenticated;

-- 4. get_today_queue: thẻ mới thêm ngữ pháp (cùng điều kiện như kanji/vocab).
--    Mảng phẳng: kana, kanji, vocab, grammar; mỗi loại theo sort_order, tối đa new_per_day.
create or replace function public.get_today_queue(p_study_date date, p_day_end timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_prof public.profiles%rowtype;
  v_due jsonb;
  v_done int;
  v_new jsonb;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_study_date is null or p_day_end is null then
    raise exception 'p_study_date and p_day_end are required' using errcode = '22023';
  end if;

  select * into v_prof from public.profiles p where p.user_id = v_uid;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  select coalesce(jsonb_agg(x.item order by x.due, x.card_id), '[]'::jsonb)
    into v_due
    from (
      select cs.due, cs.card_id,
        public.card_payload(cs.card_id)
          || jsonb_build_object('state', to_jsonb(cs) - array['user_id', 'card_id']) as item
      from public.card_states cs
      where cs.user_id = v_uid and cs.due < p_day_end
      order by cs.due, cs.card_id
      limit v_prof.review_limit
    ) x;

  select count(*) into v_done
    from public.review_logs l
    where l.user_id = v_uid and l.study_date = p_study_date and l.is_new;

  select coalesce(jsonb_agg(y.payload order by y.ord, y.sort_order, y.id), '[]'::jsonb)
    into v_new
    from (
      select r.id, r.sort_order,
        case r.kind when 'kana' then 1 when 'kanji' then 2 when 'vocab' then 3 else 4 end as ord,
        public.card_payload(r.id) as payload
      from (
        select c.id, c.kind, c.sort_order,
          row_number() over (partition by c.kind order by c.sort_order, c.id) as rn
        from public.cards c
        where c.published
          and not exists (
            select 1 from public.card_states cs where cs.user_id = v_uid and cs.card_id = c.id)
          and (
            (c.kind = 'kana' and not v_prof.knows_kana)
            or (c.kind in ('kanji', 'vocab', 'grammar') and c.level = v_prof.level)
          )
      ) r
      where r.rn <= v_prof.new_per_day
    ) y;

  return jsonb_build_object('due', v_due, 'new_done_today', v_done, 'new_candidates', v_new);
end;
$$;

revoke execute on function public.get_today_queue(date, timestamptz) from public, anon;
grant execute on function public.get_today_queue(date, timestamptz) to authenticated;
