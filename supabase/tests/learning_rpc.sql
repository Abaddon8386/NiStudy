-- Kiểm thủ công quyền/RLS và RPC submit_reviews, get_today_queue.
-- Chạy trong SQL editor của project nihongo-dev SAU KHI áp migration 000002 và 000003.
-- Toàn bộ nằm trong một transaction và ROLLBACK ở cuối: không để lại dữ liệu.
-- Kết quả: xem thông báo NOTICE "OK ..."; bất kỳ lỗi nào là EXCEPTION "FAIL ...".

begin;

-- 0. Seed (vai trò hiện tại, thường là postgres) ------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rpc-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rpc-b@example.test'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rpc-c@example.test');

insert into public.cards (id, kind, level, sort_order, published) values
  ('kana:hira:a',  'kana',  null, 1, true),
  ('kana:hira:i',  'kana',  null, 2, true),
  ('kana:hira:u',  'kana',  null, 3, false),
  ('vocab:1',      'vocab', 'N5', 1, true),
  ('vocab:2',      'vocab', 'N5', 2, true),
  ('vocab:3',      'vocab', 'N5', 3, true),
  ('vocab:4',      'vocab', 'N5', 4, false),
  ('vocab:5',      'vocab', 'N4', 5, true),
  ('vocab:6',      'vocab', 'N5', 6, true),
  ('kanji:学',     'kanji', 'N5', 1, true),
  ('kanji:校',     'kanji', 'N5', 2, true),
  ('kanji:試',     'kanji', 'N4', 3, true);

insert into public.kana_details (card_id, script, kana, romaji, grp) values
  ('kana:hira:a', 'hira', 'あ', 'a', 'basic'),
  ('kana:hira:i', 'hira', 'い', 'i', 'basic'),
  ('kana:hira:u', 'hira', 'う', 'u', 'basic');

insert into public.vocab_details (card_id, jmdict_seq, word, reading, meaning_vi) values
  ('vocab:1', 1, '学生',   'がくせい',   'sinh viên'),
  ('vocab:2', 2, '学校',   'がっこう',   'trường học'),
  ('vocab:3', 3, '先生',   'せんせい',   'giáo viên'),
  ('vocab:4', 4, '水',     'みず',       'nước'),
  ('vocab:5', 5, '試験',   'しけん',     'kỳ thi'),
  ('vocab:6', 6, '本',     'ほん',       'sách');

insert into public.kanji_details (card_id, kanji, han_viet_main, han_viet_source, meaning_vi) values
  ('kanji:学', '学', 'HỌC', 'kanjidic2', 'học'),
  ('kanji:校', '校', 'HIỆU', 'kanjidic2', 'trường'),
  ('kanji:試', '試', 'THÍ', 'kanjidic2', 'thử');

-- Thẻ phụ cho phép thử giới hạn review_limit (không published, không chi tiết).
insert into public.cards (id, kind, level, sort_order, published)
select 'vocab:' || (2000 + i), 'vocab', 'N5', 2000 + i, false from generate_series(1, 51) as i;

-- User C: 51 thẻ đến hạn, thẻ i có due = now() - i giờ (i càng lớn càng quá hạn lâu).
insert into public.card_states (user_id, card_id, due, stability, difficulty, elapsed_days,
                                scheduled_days, learning_steps, reps, lapses, state, last_review)
select '00000000-0000-0000-0000-0000000000c3', 'vocab:' || (2000 + i), now() - make_interval(hours => i),
       1, 5, 0, 1, 0, 1, 0, 2, now() - make_interval(hours => i + 24)
from generate_series(1, 51) as i;
update public.profiles set review_limit = 50 where user_id = '00000000-0000-0000-0000-0000000000c3';

-- Hàm dựng một phần tử lô gửi lên (chỉ cho test; hoàn tác cùng transaction).
create function public.t_mk(p_id uuid, p_card text, p_rating int, p_at timestamptz,
                            p_date date, p_due timestamptz, p_reps int)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'review_id', p_id, 'card_id', p_card, 'rating', p_rating,
    'reviewed_at', p_at, 'study_date', p_date,
    'session_id', '99999999-9999-9999-9999-999999999999',
    'is_new', false,                                  -- phải bị bỏ qua
    'user_id', '00000000-0000-0000-0000-0000000000b2', -- phải bị bỏ qua
    'state_after', jsonb_build_object(
      'due', p_due, 'stability', 2.5, 'difficulty', 5.0, 'elapsed_days', 0,
      'scheduled_days', 1, 'learning_steps', 0, 'reps', p_reps, 'lapses', 0,
      'state', 2, 'last_review', p_at));
$$;
grant execute on function public.t_mk(uuid, text, int, timestamptz, date, timestamptz, int) to authenticated;

-- 1. anon không gọi được RPC; đọc được nội dung, không ghi được -----------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
declare n int;
begin
  begin
    perform * from public.submit_reviews('[]'::jsonb);
    raise exception 'FAIL anon gọi được submit_reviews';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được submit_reviews';
  end;
  begin
    perform public.get_today_queue(current_date, now());
    raise exception 'FAIL anon gọi được get_today_queue';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được get_today_queue';
  end;
  begin
    perform public.card_payload('vocab:1');
    raise exception 'FAIL anon gọi được card_payload';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được card_payload';
  end;
  select count(*) into n from public.cards;
  if n < 12 then raise exception 'FAIL anon không đọc được cards (%)', n; end if;
  raise notice 'OK anon đọc được cards';
  begin
    insert into public.cards (id, kind, sort_order) values ('vocab:evil', 'vocab', 1);
    raise exception 'FAIL anon ghi được cards';
  exception when insufficient_privilege then
    raise notice 'OK anon không ghi được cards';
  end;
  begin
    perform 1 from public.card_states;
    raise exception 'FAIL anon đọc được card_states';
  exception when insufficient_privilege then
    raise notice 'OK anon không đọc được card_states';
  end;
end $$;

-- 2. authenticated nhưng không có sub: RPC từ chối ------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);

do $$
begin
  begin
    perform * from public.submit_reviews('[]'::jsonb);
    raise exception 'FAIL submit_reviews chạy khi auth.uid() null';
  exception when invalid_authorization_specification then
    raise notice 'OK submit_reviews từ chối khi auth.uid() null';
  end;
  begin
    perform public.get_today_queue(current_date, now());
    raise exception 'FAIL get_today_queue chạy khi auth.uid() null';
  exception when invalid_authorization_specification then
    raise notice 'OK get_today_queue từ chối khi auth.uid() null';
  end;
end $$;

-- 3. User A: submit_reviews -----------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare
  a constant uuid := '00000000-0000-0000-0000-0000000000a1';
  today constant date := (now() at time zone 'utc')::date;
  due1 constant timestamptz := now() + interval '1 hour';
  r1 constant uuid := '11111111-1111-1111-1111-111111111101';
  r2 constant uuid := '11111111-1111-1111-1111-111111111102';
  st text;
  n int;
  rec record;
  big jsonb;
begin
  update public.profiles set new_per_day = 5 where user_id = a;

  -- Lượt mới hợp lệ -> accepted; is_new do máy chủ suy ra (client gửi is_new=false bị bỏ qua).
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(r1, 'vocab:1', 3, now() - interval '10 minutes', today, due1, 1))) s;
  if st is distinct from 'accepted' then raise exception 'FAIL lượt mới: status=%', st; end if;
  if not exists (select 1 from public.card_states where card_id = 'vocab:1' and reps = 1) then
    raise exception 'FAIL lượt mới: card_states không có/ sai';
  end if;
  if not (select is_new from public.review_logs where review_id = r1) then
    raise exception 'FAIL lượt mới: is_new phải true';
  end if;
  if (select user_id from public.review_logs where review_id = r1) <> a then
    raise exception 'FAIL user_id phải lấy từ auth.uid()';
  end if;
  raise notice 'OK lượt mới accepted, card_states có, is_new true, user_id từ phiên';

  -- Gửi lại cùng review_id -> duplicate, không thêm log.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(r1, 'vocab:1', 3, now() - interval '10 minutes', today, due1, 1))) s;
  select count(*) into n from public.review_logs where card_id = 'vocab:1';
  if st is distinct from 'duplicate' or n <> 1 then raise exception 'FAIL duplicate: status=% logs=%', st, n; end if;
  raise notice 'OK gửi lại cùng review_id -> duplicate, không thêm log';

  -- Lượt cũ hơn, review_id khác: ghi log nhưng không ghi đè card_states; is_new = false.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(r2, 'vocab:1', 1, now() - interval '1 hour', today, due1, 99))) s;
  select count(*) into n from public.review_logs where card_id = 'vocab:1';
  if st is distinct from 'accepted' or n <> 2 then raise exception 'FAIL lượt cũ: status=% logs=%', st, n; end if;
  if not exists (select 1 from public.card_states where card_id = 'vocab:1' and reps = 1) then
    raise exception 'FAIL lượt cũ hơn đã ghi đè card_states';
  end if;
  if (select is_new from public.review_logs where review_id = r2) then
    raise exception 'FAIL lượt cũ: is_new phải false (thẻ đã có state)';
  end if;
  raise notice 'OK lượt cũ hơn: log được ghi, card_states giữ nguyên';

  -- reviewed_at tương lai +10 phút -> rejected.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:6', 3, now() + interval '10 minutes', today, due1, 1))) s;
  if st is distinct from 'rejected' then raise exception 'FAIL tương lai: %', st; end if;
  raise notice 'OK reviewed_at +10 phút bị rejected';

  -- study_date lệch 3 ngày -> rejected.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:6', 3, now() - interval '1 minute', today + 3, due1, 1))) s;
  if st is distinct from 'rejected' then raise exception 'FAIL study_date lệch 3 ngày: %', st; end if;
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:6', 3, now() - interval '1 minute', today - 3, due1, 1))) s;
  if st is distinct from 'rejected' then raise exception 'FAIL study_date lệch -3 ngày: %', st; end if;
  raise notice 'OK study_date lệch 3 ngày bị rejected';

  -- Thẻ không tồn tại -> rejected.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:khong-co', 3, now() - interval '1 minute', today, due1, 1))) s;
  if st is distinct from 'rejected' then raise exception 'FAIL thẻ không tồn tại: %', st; end if;
  raise notice 'OK thẻ không tồn tại bị rejected';

  -- rating ngoài 1..4, rating không nguyên -> rejected.
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:6', 5, now() - interval '1 minute', today, due1, 1))) s;
  if st is distinct from 'rejected' then raise exception 'FAIL rating 5: %', st; end if;
  select s.status into st from public.submit_reviews(
    jsonb_build_array(public.t_mk(gen_random_uuid(), 'vocab:6', 3, now() - interval '1 minute', today, due1, 1)
      || '{"rating": 2.5}'::jsonb)) s;
  if st is distinct from 'rejected' then raise exception 'FAIL rating 2.5: %', st; end if;
  raise notice 'OK rating sai bị rejected';

  -- state_after thiếu khóa / sai kiểu / sai khoảng -> rejected.
  foreach st in array array[
    '{"stability": 1}',                                              -- thiếu gần hết khóa
    '{"due":"2030-01-01T00:00:00Z","stability":-1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":1,"lapses":0,"state":2,"last_review":null}',
    '{"due":"2030-01-01T00:00:00Z","stability":1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":1,"lapses":0,"state":4,"last_review":null}',
    '{"due":"2030-01-01T00:00:00Z","stability":1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":"1","lapses":0,"state":2,"last_review":null}',
    '{"due":"2030-01-01T00:00:00Z","stability":1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":1.5,"lapses":0,"state":2,"last_review":null}',
    '{"due":"khong-phai-ngay","stability":1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":1,"lapses":0,"state":2,"last_review":null}',
    '{"due":"infinity","stability":1,"difficulty":5,"elapsed_days":0,"scheduled_days":1,"learning_steps":0,"reps":1,"lapses":0,"state":2,"last_review":null}'
  ] loop
    select s.status into rec from public.submit_reviews(jsonb_build_array(
      public.t_mk(gen_random_uuid(), 'vocab:6', 3, now() - interval '1 minute', today, due1, 1)
        || jsonb_build_object('state_after', st::jsonb))) s;
    if rec.status is distinct from 'rejected' then raise exception 'FAIL state_after sai được chấp nhận: %', st; end if;
  end loop;
  raise notice 'OK state_after sai bị rejected';

  -- review_id không đọc được -> lỗi cả lô.
  begin
    perform * from public.submit_reviews('[{"card_id":"vocab:1"}]'::jsonb);
    raise exception 'FAIL thiếu review_id lại không lỗi';
  exception when invalid_parameter_value then
    raise notice 'OK thiếu review_id -> lỗi';
  end;
  begin
    perform * from public.submit_reviews('[{"review_id":"khong-phai-uuid"}]'::jsonb);
    raise exception 'FAIL review_id không phải uuid lại không lỗi';
  exception when invalid_parameter_value then
    raise notice 'OK review_id không phải uuid -> lỗi';
  end;

  -- Lô 201 -> lỗi; lô 200 chấp nhận được (toàn rejected vì thẻ không tồn tại cũng không lỗi).
  select jsonb_agg(public.t_mk(gen_random_uuid(), 'vocab:khong-co', 3, now(), today, due1, 1))
    into big from generate_series(1, 201);
  begin
    perform * from public.submit_reviews(big);
    raise exception 'FAIL lô 201 không lỗi';
  exception when invalid_parameter_value then
    raise notice 'OK lô 201 bị lỗi';
  end;
  select jsonb_agg(public.t_mk(gen_random_uuid(), 'vocab:khong-co', 3, now(), today, due1, 1))
    into big from generate_series(1, 200);
  select count(*) into n from public.submit_reviews(big);
  if n <> 200 then raise exception 'FAIL lô 200: % kết quả', n; end if;
  raise notice 'OK lô 200 xử lý được';

  -- Thứ tự trong lô: gửi lượt MUỚI hơn trước, CŨ hơn sau -> máy chủ xử lý theo reviewed_at tăng dần.
  -- vocab:2: lượt cũ (is_new) rồi lượt mới (không is_new); card_states theo lượt mới.
  perform * from public.submit_reviews(jsonb_build_array(
    public.t_mk('22222222-2222-2222-2222-222222222202', 'vocab:2', 4, now() - interval '5 minutes', today, due1, 2),
    public.t_mk('22222222-2222-2222-2222-222222222201', 'vocab:2', 3, now() - interval '20 minutes', today, due1, 1)));
  if not (select is_new from public.review_logs where review_id = '22222222-2222-2222-2222-222222222201')
     or (select is_new from public.review_logs where review_id = '22222222-2222-2222-2222-222222222202') then
    raise exception 'FAIL thứ tự lô: is_new phải true cho lượt cũ nhất, false cho lượt sau';
  end if;
  if not exists (select 1 from public.card_states where card_id = 'vocab:2' and reps = 2) then
    raise exception 'FAIL thứ tự lô: card_states phải theo lượt mới nhất';
  end if;
  raise notice 'OK lô xử lý theo reviewed_at tăng dần';

  -- daily_bonus: mới có 2 lượt is_new (vocab:1, vocab:2) < new_per_day = 5.
  select count(*) into n from public.daily_bonus where study_date = today;
  if n <> 0 then raise exception 'FAIL daily_bonus tạo sớm (% dòng)', n; end if;
  perform * from public.submit_reviews(jsonb_build_array(
    public.t_mk(gen_random_uuid(), 'vocab:3',  3, now() - interval '4 minutes', today, due1, 1),
    public.t_mk(gen_random_uuid(), 'kanji:学', 3, now() - interval '3 minutes', today, due1, 1)));
  select count(*) into n from public.daily_bonus where study_date = today;
  if n <> 0 then raise exception 'FAIL daily_bonus tạo ở lượt mới thứ 4 (% dòng)', n; end if;
  perform * from public.submit_reviews(jsonb_build_array(
    public.t_mk(gen_random_uuid(), 'kanji:校', 3, now() - interval '2 minutes', today, due1, 1)));
  select count(*) into n from public.daily_bonus where study_date = today;
  if n <> 1 then raise exception 'FAIL daily_bonus phải có 1 dòng sau 5 thẻ mới (% dòng)', n; end if;
  -- Thêm thẻ mới thứ 6 và gửi lại lượt cũ: vẫn chỉ 1 dòng.
  perform * from public.submit_reviews(jsonb_build_array(
    public.t_mk(gen_random_uuid(), 'kana:hira:a', 3, now() - interval '1 minute', today, due1, 1),
    public.t_mk(r1, 'vocab:1', 3, now() - interval '10 minutes', today, due1, 1)));
  select count(*) into n from public.daily_bonus where study_date = today;
  if n <> 1 then raise exception 'FAIL daily_bonus phải chỉ 1 lần (% dòng)', n; end if;
  raise notice 'OK daily_bonus tạo đúng khi đạt new_per_day và chỉ một lần';
end $$;

-- 4. User A: không ghi trực tiếp được các bảng học -----------------------------------------------
do $$
declare a constant uuid := '00000000-0000-0000-0000-0000000000a1';
begin
  begin
    insert into public.card_states (user_id, card_id, due, stability, difficulty, elapsed_days,
      scheduled_days, learning_steps, reps, lapses, state)
    values (a, 'vocab:5', now(), 1, 1, 0, 0, 0, 0, 0, 0);
    raise exception 'FAIL insert card_states';
  exception when insufficient_privilege then raise notice 'OK không insert được card_states'; end;
  begin
    update public.card_states set reps = 100 where user_id = a;
    raise exception 'FAIL update card_states';
  exception when insufficient_privilege then raise notice 'OK không update được card_states'; end;
  begin
    delete from public.card_states where user_id = a;
    raise exception 'FAIL delete card_states';
  exception when insufficient_privilege then raise notice 'OK không delete được card_states'; end;

  begin
    insert into public.review_logs (user_id, review_id, card_id, rating, reviewed_at, study_date, is_new, state_after)
    values (a, gen_random_uuid(), 'vocab:5', 3, now(), current_date, true, '{}');
    raise exception 'FAIL insert review_logs';
  exception when insufficient_privilege then raise notice 'OK không insert được review_logs'; end;
  begin
    update public.review_logs set rating = 1 where user_id = a;
    raise exception 'FAIL update review_logs';
  exception when insufficient_privilege then raise notice 'OK không update được review_logs'; end;
  begin
    delete from public.review_logs where user_id = a;
    raise exception 'FAIL delete review_logs';
  exception when insufficient_privilege then raise notice 'OK không delete được review_logs'; end;

  begin
    insert into public.daily_bonus (user_id, study_date) values (a, current_date + 10);
    raise exception 'FAIL insert daily_bonus';
  exception when insufficient_privilege then raise notice 'OK không insert được daily_bonus'; end;
  begin
    delete from public.daily_bonus where user_id = a;
    raise exception 'FAIL delete daily_bonus';
  exception when insufficient_privilege then raise notice 'OK không delete được daily_bonus'; end;
  begin
    update public.daily_bonus set study_date = current_date where user_id = a;
    raise exception 'FAIL update daily_bonus';
  exception when insufficient_privilege then raise notice 'OK không update được daily_bonus'; end;

  begin
    insert into public.quiz_attempts (user_id, quiz_id, study_date, correct)
    values (a, gen_random_uuid(), current_date, 3);
    raise exception 'FAIL insert quiz_attempts';
  exception when insufficient_privilege then raise notice 'OK không insert được quiz_attempts'; end;

  begin
    update public.cards set published = false where id = 'vocab:1';
    raise exception 'FAIL update cards';
  exception when insufficient_privilege then raise notice 'OK không update được cards'; end;
end $$;

-- 5. User A: get_today_queue ----------------------------------------------------------------------
do $$
declare
  today constant date := (now() at time zone 'utc')::date;
  q jsonb;
  ids text[];
  prev timestamptz;
  el jsonb;
  ex jsonb;
begin
  q := public.get_today_queue(today, now() + interval '1 day');

  -- 6 thẻ đã học (vocab:1,2,3, kanji:学,校, kana:hira:a), đều due = now()+1h < day_end.
  if jsonb_array_length(q -> 'due') <> 6 then
    raise exception 'FAIL due: % phần tử (mong đợi 6)', jsonb_array_length(q -> 'due');
  end if;
  if (q ->> 'new_done_today')::int <> 6 then
    raise exception 'FAIL new_done_today = % (mong đợi 6)', q ->> 'new_done_today';
  end if;
  raise notice 'OK due và new_done_today';

  -- Chi tiết kanji kèm examples (từ published chứa chữ đó).
  select e into el from jsonb_array_elements(q -> 'due') e where e -> 'card' ->> 'id' = 'kanji:学';
  ex := el -> 'details' -> 'examples';
  if el -> 'details' ->> 'han_viet_main' <> 'HỌC' then raise exception 'FAIL chi tiết kanji'; end if;
  if jsonb_array_length(ex) <> 2 or ex -> 0 ->> 'word' <> '学生' or ex -> 1 ->> 'word' <> '学校' then
    raise exception 'FAIL examples của kanji:学 = %', ex;
  end if;
  if el -> 'state' ->> 'user_id' is not null or (el -> 'state' ->> 'reps') is null then
    raise exception 'FAIL state của due: %', el -> 'state';
  end if;
  raise notice 'OK details kanji có examples; state không lộ user_id';

  -- new_candidates khi chưa biết kana: kana:hira:i (kana:hira:a đã học, :u chưa published) + vocab:6.
  select array_agg(e -> 'card' ->> 'id' order by ord) into ids
    from jsonb_array_elements(q -> 'new_candidates') with ordinality as t(e, ord);
  if ids is distinct from array['kana:hira:i', 'vocab:6'] then
    raise exception 'FAIL new_candidates (chưa biết kana) = %', ids;
  end if;
  raise notice 'OK new_candidates: đúng level, bỏ unpublished và thẻ đã học';

  -- Biết kana: không còn kana.
  update public.profiles set knows_kana = true where user_id = '00000000-0000-0000-0000-0000000000a1';
  q := public.get_today_queue(today, now() + interval '1 day');
  select array_agg(e -> 'card' ->> 'id') into ids from jsonb_array_elements(q -> 'new_candidates') e;
  if ids is distinct from array['vocab:6'] then
    raise exception 'FAIL new_candidates (biết kana) = %', ids;
  end if;
  raise notice 'OK knows_kana = true: không có kana';

  -- Đổi sang N4: chỉ thẻ N4 (vocab:5, kanji:試), kanji trước vocab.
  update public.profiles set level = 'N4' where user_id = '00000000-0000-0000-0000-0000000000a1';
  q := public.get_today_queue(today, now() + interval '1 day');
  select array_agg(e -> 'card' ->> 'id' order by ord) into ids
    from jsonb_array_elements(q -> 'new_candidates') with ordinality as t(e, ord);
  if ids is distinct from array['kanji:試', 'vocab:5'] then
    raise exception 'FAIL new_candidates (N4) = %', ids;
  end if;
  raise notice 'OK new_candidates theo level N4';

  -- Ngày khác: new_done_today = 0; day_end sớm: không có thẻ đến hạn.
  q := public.get_today_queue(today + 1, now());
  if (q ->> 'new_done_today')::int <> 0 or jsonb_array_length(q -> 'due') <> 0 then
    raise exception 'FAIL ngày khác / day_end sớm: %', q -> 'due';
  end if;
  raise notice 'OK new_done_today theo p_study_date, due theo p_day_end';
end $$;

-- 6. User B: không thấy dữ liệu của A ------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000b2', 'role', 'authenticated')::text, true);

do $$
declare q jsonb;
begin
  if (select count(*) from public.review_logs) <> 0
     or (select count(*) from public.card_states) <> 0
     or (select count(*) from public.daily_bonus) <> 0 then
    raise exception 'FAIL user B thấy dữ liệu của A';
  end if;
  q := public.get_today_queue((now() at time zone 'utc')::date, now() + interval '1 day');
  if jsonb_array_length(q -> 'due') <> 0 or (q ->> 'new_done_today')::int <> 0 then
    raise exception 'FAIL get_today_queue của B lẫn dữ liệu của A';
  end if;
  raise notice 'OK user B không thấy log/card_states/daily_bonus của A';
end $$;

-- 7. User C: giới hạn review_limit, quá hạn lâu nhất trước ---------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000c3', 'role', 'authenticated')::text, true);

do $$
declare
  q jsonb;
  due jsonb;
begin
  q := public.get_today_queue((now() at time zone 'utc')::date, now() + interval '1 day');
  due := q -> 'due';
  if jsonb_array_length(due) <> 50 then
    raise exception 'FAIL review_limit: % phần tử (mong đợi 50)', jsonb_array_length(due);
  end if;
  if due -> 0 -> 'card' ->> 'id' <> 'vocab:2051' then
    raise exception 'FAIL thứ tự: phần tử đầu = % (mong đợi vocab:2051, quá hạn lâu nhất)', due -> 0 -> 'card' ->> 'id';
  end if;
  if exists (select 1 from jsonb_array_elements(due) e where e -> 'card' ->> 'id' = 'vocab:2001') then
    raise exception 'FAIL thẻ quá hạn ít nhất (vocab:2001) lại nằm trong 50 thẻ đầu';
  end if;
  raise notice 'OK get_today_queue cắt 50 thẻ, quá hạn lâu nhất trước';
end $$;

reset role;
rollback;
