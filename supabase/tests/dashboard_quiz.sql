-- Kiểm thủ công RPC get_dashboard và submit_quiz.
-- Chạy trong SQL editor của project nihongo-dev SAU KHI áp migration 000001..000003 và 20261119000002.
-- Toàn bộ nằm trong một transaction và ROLLBACK ở cuối: không để lại dữ liệu.
-- Kết quả: xem thông báo NOTICE "OK ..."; bất kỳ lỗi nào là EXCEPTION "FAIL ...".
-- Các ca streak/XP chép từ tests/fixtures/streak-xp.json (today = 2026-11-19); sửa một nơi thì sửa cả hai.

begin;

-- 0. Seed (vai trò hiện tại, thường là postgres) ------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dash-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dash-b@example.test');

insert into public.cards (id, kind, level, sort_order, published) values
  ('vocab:1', 'vocab', 'N5', 1, true);

-- 51 thẻ phụ cho phép thử due_count không bị cắt bởi review_limit.
insert into public.cards (id, kind, level, sort_order, published)
select 'vocab:' || (2000 + i), 'vocab', 'N5', 2000 + i, false from generate_series(1, 51) as i;

-- 1. anon không gọi được hai RPC ------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
begin
  begin
    perform public.get_dashboard(date '2026-11-19', now());
    raise exception 'FAIL anon gọi được get_dashboard';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được get_dashboard';
  end;
  begin
    perform public.submit_quiz(gen_random_uuid(), (now() at time zone 'utc')::date, 5);
    raise exception 'FAIL anon gọi được submit_quiz';
  exception when insufficient_privilege then
    raise notice 'OK anon không gọi được submit_quiz';
  end;
end $$;

-- 2. authenticated nhưng không có sub: từ chối ---------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('role', 'authenticated')::text, true);

do $$
begin
  begin
    perform public.get_dashboard(date '2026-11-19', now());
    raise exception 'FAIL get_dashboard chạy khi auth.uid() null';
  exception when invalid_authorization_specification then
    raise notice 'OK get_dashboard từ chối khi auth.uid() null';
  end;
  begin
    perform public.submit_quiz(gen_random_uuid(), (now() at time zone 'utc')::date, 5);
    raise exception 'FAIL submit_quiz chạy khi auth.uid() null';
  exception when invalid_authorization_specification then
    raise notice 'OK submit_quiz từ chối khi auth.uid() null';
  end;
end $$;

-- 3. Các ca streak/XP từ fixture ---------------------------------------------------------------------
reset role;

do $$
declare
  v_a constant uuid := '00000000-0000-0000-0000-0000000000a1';
  v_today constant date := date '2026-11-19';
  v_cases constant jsonb := $json$[
    {"name": "trống",
     "review": [], "quiz": [], "bonus": [],
     "streak": 0, "total_days": 0, "xp_total": 0, "xp_today": 0},
    {"name": "chỉ hôm nay",
     "review": ["2026-11-19"], "quiz": [], "bonus": [],
     "streak": 1, "total_days": 1, "xp_total": 1, "xp_today": 1},
    {"name": "hôm qua có, hôm nay chưa",
     "review": ["2026-11-18", "2026-11-17", "2026-11-16"], "quiz": [], "bonus": [],
     "streak": 3, "total_days": 3, "xp_total": 3, "xp_today": 0},
    {"name": "gãy 1 ngày",
     "review": ["2026-11-19", "2026-11-18", "2026-11-16", "2026-11-15"], "quiz": [], "bonus": [],
     "streak": 2, "total_days": 4, "xp_total": 4, "xp_today": 1},
    {"name": "chuỗi dài 5",
     "review": ["2026-11-15", "2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19"], "quiz": [], "bonus": [],
     "streak": 5, "total_days": 5, "xp_total": 5, "xp_today": 1},
    {"name": "nhiều lượt cùng ngày",
     "review": ["2026-11-19", "2026-11-19", "2026-11-19", "2026-11-18", "2026-11-18"], "quiz": [], "bonus": [],
     "streak": 2, "total_days": 2, "xp_total": 5, "xp_today": 3},
    {"name": "có trắc nghiệm (không tính vào chuỗi)",
     "review": ["2026-11-19"],
     "quiz": [{"d": "2026-11-19", "c": 7}, {"d": "2026-11-18", "c": 3}], "bonus": [],
     "streak": 1, "total_days": 1, "xp_total": 11, "xp_today": 8},
    {"name": "có mốc thưởng",
     "review": ["2026-11-19", "2026-11-19", "2026-11-18"], "quiz": [], "bonus": ["2026-11-19", "2026-11-18"],
     "streak": 2, "total_days": 2, "xp_total": 13, "xp_today": 7},
    {"name": "hôm qua vắng thì chuỗi về 0",
     "review": ["2026-11-17", "2026-11-15", "2026-11-14"], "quiz": [], "bonus": [],
     "streak": 0, "total_days": 3, "xp_total": 3, "xp_today": 0},
    {"name": "chỉ trắc nghiệm, không có lượt ôn",
     "review": [], "quiz": [{"d": "2026-11-19", "c": 10}], "bonus": [],
     "streak": 0, "total_days": 0, "xp_total": 10, "xp_today": 10}
  ]$json$::jsonb;
  v_case jsonb;
  v_i int;
  v_d text;
  v_q jsonb;
  v_res jsonb;
  v_k text;
begin
  for v_case in select * from jsonb_array_elements(v_cases) loop
    -- dọn dữ liệu A giữa các ca (vai trò postgres)
    reset role;
    delete from public.review_logs where user_id = v_a;
    delete from public.quiz_attempts where user_id = v_a;
    delete from public.daily_bonus where user_id = v_a;

    v_i := 0;
    for v_d in select jsonb_array_elements_text(v_case -> 'review') loop
      v_i := v_i + 1;
      insert into public.review_logs
        (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
      values
        (v_a, ('00000000-0000-0000-0000-' || lpad(v_i::text, 12, '0'))::uuid, 'vocab:1', 3,
         ((v_d::date + time '12:00') at time zone 'utc') + make_interval(secs => v_i),
         v_d::date, null, false, '{}'::jsonb);
    end loop;

    v_i := 0;
    for v_q in select * from jsonb_array_elements(v_case -> 'quiz') loop
      v_i := v_i + 1;
      insert into public.quiz_attempts (user_id, quiz_id, study_date, correct)
      values (v_a, ('11111111-1111-1111-1111-' || lpad(v_i::text, 12, '0'))::uuid,
              (v_q ->> 'd')::date, (v_q ->> 'c')::smallint);
    end loop;

    for v_d in select jsonb_array_elements_text(v_case -> 'bonus') loop
      insert into public.daily_bonus (user_id, study_date) values (v_a, v_d::date);
    end loop;

    set local role authenticated;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_a, 'role', 'authenticated')::text, true);
    v_res := public.get_dashboard(v_today, (v_today + 1)::timestamptz);
    reset role;

    foreach v_k in array array['streak', 'total_days', 'xp_total', 'xp_today'] loop
      if (v_res ->> v_k)::int is distinct from (v_case ->> v_k)::int then
        raise exception 'FAIL ca "%": % = %, mong đợi %',
          v_case ->> 'name', v_k, v_res ->> v_k, v_case ->> v_k;
      end if;
    end loop;
    if (v_res ->> 'studied_today')::boolean
       is distinct from ((v_case -> 'review') ? '2026-11-19') then
      raise exception 'FAIL ca "%": studied_today = %', v_case ->> 'name', v_res ->> 'studied_today';
    end if;
    raise notice 'OK ca "%"', v_case ->> 'name';
  end loop;

  delete from public.review_logs where user_id = v_a;
  delete from public.quiz_attempts where user_id = v_a;
  delete from public.daily_bonus where user_id = v_a;
end $$;

-- 4. B không thấy số của A ----------------------------------------------------------------------------
reset role;
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, is_new, state_after)
values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-00000000f001', 'vocab:1', 3,
        timestamptz '2026-11-19 12:00:00+00', date '2026-11-19', true, '{}'::jsonb);
insert into public.quiz_attempts (user_id, quiz_id, study_date, correct)
values ('00000000-0000-0000-0000-0000000000a1', '11111111-1111-1111-1111-00000000f001', date '2026-11-19', 9);
insert into public.daily_bonus (user_id, study_date)
values ('00000000-0000-0000-0000-0000000000a1', date '2026-11-19');
insert into public.card_states (user_id, card_id, due, stability, difficulty, elapsed_days,
                                scheduled_days, learning_steps, reps, lapses, state, last_review)
values ('00000000-0000-0000-0000-0000000000a1', 'vocab:1', timestamptz '2026-11-19 00:00:00+00',
        1, 5, 0, 1, 0, 1, 0, 2, timestamptz '2026-11-18 00:00:00+00');

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000b2', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if (v ->> 'xp_total')::int <> 0 or (v ->> 'xp_today')::int <> 0
     or (v ->> 'streak')::int <> 0 or (v ->> 'total_days')::int <> 0
     or (v ->> 'due_count')::int <> 0 or (v ->> 'new_done_today')::int <> 0
     or (v ->> 'studied_today')::boolean then
    raise exception 'FAIL B thấy số của A: %', v;
  end if;
  raise notice 'OK B không thấy số của A';
end $$;

-- Đúng với A: 1 lượt + 9 câu + 5 thưởng = 15 XP, 1 thẻ đến hạn, 1 thẻ mới hôm nay.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);
do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if (v ->> 'xp_total')::int <> 15 or (v ->> 'due_count')::int <> 1
     or (v ->> 'new_done_today')::int <> 1 then
    raise exception 'FAIL số của A sai: %', v;
  end if;
  if v -> 'median_seconds_7d' <> 'null'::jsonb then
    raise exception 'FAIL median phải là null khi chưa đủ khoảng: %', v;
  end if;
  raise notice 'OK số của A đúng (xp 15, due 1, new_done 1, median null)';
end $$;

-- 5. median_seconds_7d ------------------------------------------------------------------------------
reset role;
delete from public.review_logs where user_id = '00000000-0000-0000-0000-0000000000a1';
delete from public.quiz_attempts where user_id = '00000000-0000-0000-0000-0000000000a1';
delete from public.daily_bonus where user_id = '00000000-0000-0000-0000-0000000000a1';

-- Session S, ngày 2026-11-19, mốc 12:00:00Z; 10 log đầu cho 9 khoảng: 10,10,10,10,10,20,20,20,20.
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
select '00000000-0000-0000-0000-0000000000a1',
       ('00000000-0000-0000-0000-' || lpad((100 + o.n)::text, 12, '0'))::uuid,
       'vocab:1', 3,
       timestamptz '2026-11-19 12:00:00+00' + make_interval(secs => o.off),
       date '2026-11-19', '22222222-2222-2222-2222-222222222222', false, '{}'::jsonb
from unnest(array[0, 10, 20, 30, 40, 50, 70, 90, 110, 130]) with ordinality as o(off, n);

-- Session khác: khoảng 400 giây (> 300, bị bỏ).
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000201', 'vocab:1', 3,
   timestamptz '2026-11-19 13:00:00+00', date '2026-11-19', '33333333-3333-3333-3333-333333333333', false, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000202', 'vocab:1', 3,
   timestamptz '2026-11-19 13:06:40+00', date '2026-11-19', '33333333-3333-3333-3333-333333333333', false, '{}'::jsonb);

-- Ngoài cửa sổ 7 ngày (study_date 2026-11-12 < 2026-11-13): khoảng 5 giây phải bị bỏ.
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000301', 'vocab:1', 3,
   timestamptz '2026-11-12 12:00:00+00', date '2026-11-12', '44444444-4444-4444-4444-444444444444', false, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000302', 'vocab:1', 3,
   timestamptz '2026-11-12 12:00:05+00', date '2026-11-12', '44444444-4444-4444-4444-444444444444', false, '{}'::jsonb);

-- Log không có session: không tạo khoảng.
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000401', 'vocab:1', 3,
   timestamptz '2026-11-19 14:00:00+00', date '2026-11-19', null, false, '{}'::jsonb),
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000402', 'vocab:1', 3,
   timestamptz '2026-11-19 14:00:03+00', date '2026-11-19', null, false, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if v -> 'median_seconds_7d' <> 'null'::jsonb then
    raise exception 'FAIL median phải null với 9 khoảng hợp lệ: %', v ->> 'median_seconds_7d';
  end if;
  raise notice 'OK median null khi < 10 khoảng';
end $$;

reset role;
-- Thêm log thứ 11 của session S (offset 150) => 10 khoảng: 10x5, 20x5 => trung vị 15.
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000111', 'vocab:1', 3,
   timestamptz '2026-11-19 12:02:30+00', date '2026-11-19', '22222222-2222-2222-2222-222222222222', false, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if (v ->> 'median_seconds_7d')::numeric <> 15 then
    raise exception 'FAIL median phải là 15, nhận %', v ->> 'median_seconds_7d';
  end if;
  raise notice 'OK median = 15 với 10 khoảng hợp lệ';
end $$;

-- 6. due_count không bị cắt bởi review_limit, thẻ chưa đến hạn không tính --------------------------------
reset role;
delete from public.card_states where user_id = '00000000-0000-0000-0000-0000000000a1';
insert into public.card_states (user_id, card_id, due, stability, difficulty, elapsed_days,
                                scheduled_days, learning_steps, reps, lapses, state, last_review)
select '00000000-0000-0000-0000-0000000000a1', 'vocab:' || (2000 + i),
       timestamptz '2026-11-19 00:00:00+00' - make_interval(hours => i),
       1, 5, 0, 1, 0, 1, 0, 2, timestamptz '2026-11-10 00:00:00+00'
from generate_series(1, 51) as i;
-- 1 thẻ chưa đến hạn (sau p_day_end)
insert into public.card_states (user_id, card_id, due, stability, difficulty, elapsed_days,
                                scheduled_days, learning_steps, reps, lapses, state, last_review)
values ('00000000-0000-0000-0000-0000000000a1', 'vocab:1', timestamptz '2026-11-20 06:00:00+00',
        1, 5, 0, 1, 0, 1, 0, 2, timestamptz '2026-11-10 00:00:00+00');
update public.profiles set review_limit = 50, new_per_day = 7, exam_date = date '2026-12-06'
  where user_id = '00000000-0000-0000-0000-0000000000a1';

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if (v ->> 'due_count')::int <> 51 then
    raise exception 'FAIL due_count phải là 51 (không cắt theo review_limit), nhận %', v ->> 'due_count';
  end if;
  if (v ->> 'review_limit')::int <> 50 or (v ->> 'new_per_day')::int <> 7
     or v ->> 'exam_date' <> '2026-12-06' then
    raise exception 'FAIL trường hồ sơ trong dashboard sai: %', v;
  end if;
  raise notice 'OK due_count = 51 > review_limit 50; new_per_day, review_limit, exam_date đúng';
end $$;

-- 7. submit_quiz -------------------------------------------------------------------------------------
reset role;
delete from public.review_logs where user_id = '00000000-0000-0000-0000-0000000000a1';
delete from public.quiz_attempts where user_id = '00000000-0000-0000-0000-0000000000a1';
delete from public.card_states where user_id = '00000000-0000-0000-0000-0000000000a1';

set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_quiz constant uuid := '55555555-5555-5555-5555-555555555555';
  r text;
  n int;
  v_xp int;
begin
  r := public.submit_quiz(v_quiz, v_today, 8);
  if r <> 'accepted' then raise exception 'FAIL submit_quiz lần 1 trả %', r; end if;
  raise notice 'OK submit_quiz accepted';

  -- gửi lại cùng quiz_id với số khác: duplicate, giữ nguyên số đầu
  r := public.submit_quiz(v_quiz, v_today, 2);
  if r <> 'duplicate' then raise exception 'FAIL submit_quiz lần 2 trả %', r; end if;
  select count(*), coalesce(sum(correct), 0) into n, v_xp from public.quiz_attempts;
  if n <> 1 or v_xp <> 8 then raise exception 'FAIL quiz_attempts sau duplicate: n=%, correct=%', n, v_xp; end if;
  raise notice 'OK submit_quiz duplicate giữ nguyên bản đầu';

  begin
    perform public.submit_quiz(gen_random_uuid(), v_today, 11);
    raise exception 'FAIL p_correct = 11 được chấp nhận';
  exception when invalid_parameter_value then
    raise notice 'OK p_correct = 11 bị từ chối';
  end;
  begin
    perform public.submit_quiz(gen_random_uuid(), v_today, -1);
    raise exception 'FAIL p_correct = -1 được chấp nhận';
  exception when invalid_parameter_value then
    raise notice 'OK p_correct = -1 bị từ chối';
  end;
  begin
    perform public.submit_quiz(gen_random_uuid(), v_today + 3, 5);
    raise exception 'FAIL study_date lệch +3 ngày được chấp nhận';
  exception when invalid_parameter_value then
    raise notice 'OK study_date lệch +3 ngày bị từ chối';
  end;
  begin
    perform public.submit_quiz(gen_random_uuid(), v_today - 3, 5);
    raise exception 'FAIL study_date lệch -3 ngày được chấp nhận';
  exception when invalid_parameter_value then
    raise notice 'OK study_date lệch -3 ngày bị từ chối';
  end;
  begin
    perform public.submit_quiz(null, v_today, 5);
    raise exception 'FAIL quiz_id null được chấp nhận';
  exception when invalid_parameter_value then
    raise notice 'OK tham số null bị từ chối';
  end;
  -- biên: lệch đúng 2 ngày được nhận
  r := public.submit_quiz(gen_random_uuid(), v_today - 2, 0);
  if r <> 'accepted' then raise exception 'FAIL study_date lệch -2 ngày trả %', r; end if;
  raise notice 'OK study_date lệch 2 ngày được nhận';

  -- không tạo log ôn, không chạm card_states (FR-20)
  select count(*) into n from public.review_logs;
  if n <> 0 then raise exception 'FAIL submit_quiz tạo % log ôn', n; end if;
  select count(*) into n from public.card_states;
  if n <> 0 then raise exception 'FAIL submit_quiz tạo % trạng thái thẻ', n; end if;
  raise notice 'OK submit_quiz không tạo log ôn / trạng thái thẻ';
end $$;

-- B không thấy bài trắc nghiệm của A và tự gửi cùng quiz_id vẫn là bản của B (khóa theo user_id).
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000b2', 'role', 'authenticated')::text, true);
do $$
declare n int; r text;
begin
  select count(*) into n from public.quiz_attempts;
  if n <> 0 then raise exception 'FAIL B thấy % bài trắc nghiệm của A', n; end if;
  r := public.submit_quiz('55555555-5555-5555-5555-555555555555',
                          (now() at time zone 'utc')::date, 4);
  if r <> 'accepted' then raise exception 'FAIL B gửi cùng quiz_id trả %', r; end if;
  raise notice 'OK quiz_id tính theo từng người dùng';
end $$;

reset role;
rollback;
