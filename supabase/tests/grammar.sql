-- Kiểm thủ công ngữ pháp: quyền/RLS grammar_details, card_payload, get_today_queue, submit_reviews.
-- Chạy trong SQL editor của project nihongo-dev SAU KHI áp migration 20261128000001_grammar.sql
-- (và các migration trước nó). Toàn bộ nằm trong một transaction và ROLLBACK ở cuối.
-- Kết quả: xem thông báo NOTICE "OK ..."; bất kỳ lỗi nào là EXCEPTION "FAIL ...".
-- Thẻ thử dùng id "grammar:t-..." và sort_order âm để không lẫn với nội dung thật trên dev.

begin;

-- 0. Seed (vai trò hiện tại, thường là postgres) ------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000d4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gram-a@example.test'),
  ('00000000-0000-0000-0000-0000000000e5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gram-b@example.test');

insert into public.cards (id, kind, level, sort_order, published) values
  ('grammar:t-1', 'grammar', 'N5', -5, true),
  ('grammar:t-2', 'grammar', 'N5', -4, true),
  ('grammar:t-3', 'grammar', 'N5', -3, false),  -- chưa published
  ('grammar:t-4', 'grammar', 'N5', -2, true),   -- user A sẽ học
  ('grammar:t-5', 'grammar', 'N4', -5, true),   -- level N4
  ('vocab:t-v',   'vocab',   'N5', -1, true),
  ('kana:hira:t-a', 'kana', null, 9999, true);

insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi, explanation, notes, examples, exercises)
select c.id, substr(c.id, 9), c.level, c.sort_order, 'Tiêu đề ' || c.id, 'N は N です', 'N là N',
       '[{"heading":"Cách dùng","body":"Giải thích."}]'::jsonb, '["Ghi chú"]'::jsonb,
       '[{"ja":"私は学生です。","ruby":"私[わたし]は学生[がくせい]です。","vi":"Tôi là sinh viên."}]'::jsonb,
       '[{"type":"cloze","prompt_ja":"私＿＿学生です。","answer":"は","choices":["は","が","を","に"],"vi":"Tôi là sinh viên."}]'::jsonb
from public.cards c where c.kind = 'grammar';

insert into public.vocab_details (card_id, jmdict_seq, word, reading, meaning_vi)
values ('vocab:t-v', 900001, '本', 'ほん', 'sách');
insert into public.kana_details (card_id, script, kana, romaji, grp)
values ('kana:hira:t-a', 'hira', 'あ', 'a', 'basic');

-- Hồ sơ (do trigger tạo khi chèn auth.users): A = N5, B = N4; cả hai đã biết kana.
update public.profiles set level = 'N5', knows_kana = true, new_per_day = 5
  where user_id = '00000000-0000-0000-0000-0000000000d4';
update public.profiles set level = 'N4', knows_kana = true, new_per_day = 5
  where user_id = '00000000-0000-0000-0000-0000000000e5';

create function public.t_gmk(p_id uuid, p_card text, p_at timestamptz, p_date date, p_due timestamptz)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'review_id', p_id, 'card_id', p_card, 'rating', 3,
    'reviewed_at', p_at, 'study_date', p_date,
    'state_after', jsonb_build_object(
      'due', p_due, 'stability', 2.5, 'difficulty', 5.0, 'elapsed_days', 0,
      'scheduled_days', 1, 'learning_steps', 0, 'reps', 1, 'lapses', 0,
      'state', 2, 'last_review', p_at));
$$;
grant execute on function public.t_gmk(uuid, text, timestamptz, date, timestamptz) to authenticated;

-- 1. ràng buộc kind -------------------------------------------------------------------------------
do $$
begin
  begin
    insert into public.cards (id, kind, level, sort_order) values ('bogus:1', 'bogus', 'N5', 1);
    raise exception 'FAIL cards.kind nhận giá trị lạ';
  exception when check_violation then
    raise notice 'OK cards.kind từ chối giá trị lạ, chấp nhận grammar';
  end;
  begin
    insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi)
    values ('grammar:t-1', 'dup-card', 'N5', 1, 't', 'p', 'm');
    raise exception 'FAIL grammar_details nhận card_id trùng';
  exception when unique_violation then
    raise notice 'OK grammar_details từ chối card_id trùng';
  end;
  begin
    insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi)
    values ('grammar:t-2', 't-1', 'N5', 1, 't', 'p', 'm');
    raise exception 'FAIL grammar_details nhận point_id trùng';
  exception when unique_violation then
    raise notice 'OK grammar_details từ chối point_id trùng';
  end;
end $$;

-- 2. anon: đọc được, không ghi được ---------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
declare n int;
begin
  select count(*) into n from public.grammar_details where card_id like 'grammar:t-%';
  if n <> 5 then raise exception 'FAIL anon không đọc được grammar_details (% dòng)', n; end if;
  raise notice 'OK anon đọc được grammar_details';
  begin
    insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi)
    values ('grammar:t-1', 'evil', 'N5', 1, 't', 'p', 'm');
    raise exception 'FAIL anon ghi được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK anon không INSERT được grammar_details';
  end;
  begin
    update public.grammar_details set title = 'x';
    raise exception 'FAIL anon sửa được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK anon không UPDATE được grammar_details';
  end;
  begin
    delete from public.grammar_details;
    raise exception 'FAIL anon xóa được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK anon không DELETE được grammar_details';
  end;
  begin
    perform public.card_payload('grammar:t-1');
    raise exception 'FAIL anon gọi được card_payload';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được card_payload';
  end;
end $$;

-- 3. authenticated (A): đọc được, không ghi được --------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000d4', 'role', 'authenticated')::text, true);

do $$
declare n int;
begin
  select count(*) into n from public.grammar_details where card_id like 'grammar:t-%';
  if n <> 5 then raise exception 'FAIL authenticated không đọc được grammar_details (% dòng)', n; end if;
  raise notice 'OK authenticated đọc được grammar_details';
  begin
    insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi)
    values ('grammar:t-1', 'evil', 'N5', 1, 't', 'p', 'm');
    raise exception 'FAIL authenticated ghi được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK authenticated không INSERT được grammar_details';
  end;
  begin
    update public.grammar_details set title = 'x';
    raise exception 'FAIL authenticated sửa được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK authenticated không UPDATE được grammar_details';
  end;
  begin
    delete from public.grammar_details;
    raise exception 'FAIL authenticated xóa được grammar_details';
  exception when insufficient_privilege then
    raise notice 'OK authenticated không DELETE được grammar_details';
  end;
  begin
    perform public.card_payload('grammar:t-1');
    raise exception 'FAIL authenticated gọi được card_payload';
  exception when insufficient_privilege then
    raise notice 'OK authenticated không gọi được card_payload';
  end;
end $$;

-- 4. card_payload (vai trò hiện tại; hàm nội bộ) --------------------------------------------------
reset role;

do $$
declare p jsonb;
begin
  p := public.card_payload('grammar:t-1');
  if p -> 'card' ->> 'kind' <> 'grammar' or p -> 'card' ->> 'level' <> 'N5' then
    raise exception 'FAIL card_payload grammar: card=%', p -> 'card';
  end if;
  if p -> 'details' ->> 'point_id' <> 't-1' or p -> 'details' ->> 'pattern' <> 'N は N です'
     or p -> 'details' ? 'card_id'
     or jsonb_array_length(p -> 'details' -> 'examples') <> 1
     or jsonb_array_length(p -> 'details' -> 'exercises') <> 1
     or p -> 'details' -> 'explanation' -> 0 ->> 'heading' <> 'Cách dùng' then
    raise exception 'FAIL card_payload grammar: details=%', p -> 'details';
  end if;
  raise notice 'OK card_payload trả chi tiết ngữ pháp (không có card_id)';

  if public.card_payload('vocab:t-v') -> 'details' ->> 'word' <> '本'
     or public.card_payload('kana:hira:t-a') -> 'details' ->> 'kana' <> 'あ' then
    raise exception 'FAIL card_payload vocab/kana bị hỏng';
  end if;
  raise notice 'OK card_payload vocab và kana vẫn đúng';
end $$;

-- 5. User A (N5): get_today_queue và submit_reviews ----------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000d4', 'role', 'authenticated')::text, true);

do $$
declare
  today constant date := (now() at time zone 'utc')::date;
  q jsonb;
  g text[];
  all_ids text[];
  st text;
begin
  q := public.get_today_queue(today, now() + interval '1 day');
  select array_agg(e -> 'card' ->> 'id' order by o) into all_ids
    from jsonb_array_elements(q -> 'new_candidates') with ordinality as t(e, o);
  select array_agg(x order by o) into g
    from unnest(all_ids) with ordinality as t(x, o) where x like 'grammar:t-%';
  if g is distinct from array['grammar:t-1', 'grammar:t-2', 'grammar:t-4'] then
    raise exception 'FAIL ứng viên ngữ pháp N5: % (mong đợi t-1, t-2, t-4)', g;
  end if;
  raise notice 'OK new_candidates có ngữ pháp đúng level, bỏ unpublished, theo sort_order';

  if array_position(all_ids, 'vocab:t-v') > array_position(all_ids, 'grammar:t-1') then
    raise exception 'FAIL thứ tự loại: vocab phải đứng trước grammar (%)', all_ids;
  end if;
  raise notice 'OK thứ tự loại: ... vocab rồi grammar';

  if (q -> 'new_candidates' -> (array_position(all_ids, 'grammar:t-1') - 1)) -> 'details' ->> 'point_id' <> 't-1' then
    raise exception 'FAIL ứng viên ngữ pháp thiếu details';
  end if;

  -- Nộp một lượt ôn cho thẻ ngữ pháp.
  select s.status into st from public.submit_reviews(jsonb_build_array(
    public.t_gmk('22222222-2222-2222-2222-222222222201', 'grammar:t-4',
                 now() - interval '5 minutes', today, now() + interval '1 hour'))) s;
  if st is distinct from 'accepted' then raise exception 'FAIL submit_reviews grammar: %', st; end if;
  if not (select is_new from public.review_logs where review_id = '22222222-2222-2222-2222-222222222201') then
    raise exception 'FAIL submit_reviews grammar: is_new phải true';
  end if;
  if not exists (select 1 from public.card_states where card_id = 'grammar:t-4') then
    raise exception 'FAIL submit_reviews grammar: thiếu card_states';
  end if;
  raise notice 'OK submit_reviews nhận thẻ ngữ pháp';

  q := public.get_today_queue(today, now() + interval '1 day');
  select array_agg(e -> 'card' ->> 'id' order by o) into g
    from jsonb_array_elements(q -> 'new_candidates') with ordinality as t(e, o)
    where e -> 'card' ->> 'id' like 'grammar:t-%';
  if g is distinct from array['grammar:t-1', 'grammar:t-2'] then
    raise exception 'FAIL sau khi học t-4: ứng viên = % (mong đợi t-1, t-2)', g;
  end if;
  -- due = +1 giờ < p_day_end (+1 ngày): thẻ vừa học nằm trong due của hôm nay.
  if not exists (select 1 from jsonb_array_elements(q -> 'due') e where e -> 'card' ->> 'id' = 'grammar:t-4'
                 and e -> 'details' ->> 'point_id' = 't-4') then
    raise exception 'FAIL thẻ ngữ pháp đã học phải nằm trong due kèm details';
  end if;
  raise notice 'OK thẻ ngữ pháp đã học không còn là ứng viên mới và vào due kèm details';
end $$;

-- 6. User B (N4): chỉ thấy ngữ pháp N4 ------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000e5', 'role', 'authenticated')::text, true);

do $$
declare
  g text[];
begin
  select array_agg(e -> 'card' ->> 'id' order by o) into g
    from jsonb_array_elements(
      public.get_today_queue((now() at time zone 'utc')::date, now() + interval '1 day') -> 'new_candidates')
      with ordinality as t(e, o)
    where e -> 'card' ->> 'id' like 'grammar:t-%';
  if g is distinct from array['grammar:t-5'] then
    raise exception 'FAIL ứng viên ngữ pháp N4: % (mong đợi t-5)', g;
  end if;
  raise notice 'OK user N4 chỉ thấy ngữ pháp N4';
end $$;

-- 7. Giới hạn new_per_day áp cho riêng ngữ pháp ---------------------------------------------------
reset role;
insert into public.cards (id, kind, level, sort_order, published)
select 'grammar:t-x' || i, 'grammar', 'N5', -100 - i, true from generate_series(1, 7) as i;
insert into public.grammar_details (card_id, point_id, level, sort, title, pattern, meaning_vi)
select 'grammar:t-x' || i, 't-x' || i, 'N5', -100 - i, 't', 'p', 'm' from generate_series(1, 7) as i;

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000d4', 'role', 'authenticated')::text, true);

do $$
declare
  n int;
  first_id text;
begin
  select count(*) into n
    from jsonb_array_elements(
      public.get_today_queue((now() at time zone 'utc')::date, now() + interval '1 day') -> 'new_candidates') e
    where e -> 'card' ->> 'kind' = 'grammar';
  if n <> 5 then raise exception 'FAIL new_per_day=5: % ứng viên ngữ pháp (mong đợi 5)', n; end if;
  select e -> 'card' ->> 'id' into first_id
    from jsonb_array_elements(
      public.get_today_queue((now() at time zone 'utc')::date, now() + interval '1 day') -> 'new_candidates') e
    where e -> 'card' ->> 'kind' = 'grammar' limit 1;
  if first_id <> 'grammar:t-x7' then raise exception 'FAIL thứ tự sort_order: đầu = %', first_id; end if;
  raise notice 'OK ứng viên ngữ pháp bị giới hạn bởi new_per_day, theo sort_order';
end $$;

reset role;
rollback;
