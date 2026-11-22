-- Kiểm thủ công khóa study_days_35 và level của get_dashboard.
-- Chạy trong SQL editor của project nihongo-dev SAU KHI áp migration 20261122000001_dashboard_study_days.sql.
-- Toàn bộ nằm trong một transaction và ROLLBACK ở cuối: không để lại dữ liệu.
-- Kết quả: xem thông báo NOTICE "OK ..."; bất kỳ lỗi nào là EXCEPTION "FAIL ...".

begin;

-- 0. Seed (vai trò hiện tại, thường là postgres) ------------------------------------------------
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'days-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'days-b@example.test'),
  ('00000000-0000-0000-0000-0000000000c5', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'days-c@example.test');

insert into public.cards (id, kind, level, sort_order, published) values
  ('vocab:test-study-days', 'vocab', 'N5', 999001, false);

update public.profiles set level = 'N4' where user_id = '00000000-0000-0000-0000-0000000000a3';

-- A (hôm nay = 2026-11-19, cửa sổ [2026-10-16, 2026-11-19]):
--   2026-11-19 hai lượt (chỉ tính một ngày), 2026-11-10, 2026-10-16 (biên trong),
--   2026-10-15 (biên ngoài), 2026-11-20 (sau hôm nay, ngoài).
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
select '00000000-0000-0000-0000-0000000000a3',
       ('00000000-0000-0000-0000-' || lpad((500 + o.n)::text, 12, '0'))::uuid,
       'vocab:test-study-days', 3,
       (o.d + time '12:00') at time zone 'utc' + make_interval(secs => o.n),
       o.d, null, false, '{}'::jsonb
from unnest(array[date '2026-11-19', date '2026-11-19', date '2026-11-10',
                  date '2026-10-16', date '2026-10-15', date '2026-11-20'])
     with ordinality as o(d, n);

-- Trắc nghiệm của A ngày 2026-11-12 không phải ngày học.
insert into public.quiz_attempts (user_id, quiz_id, study_date, correct)
values ('00000000-0000-0000-0000-0000000000a3', '66666666-6666-6666-6666-666666666601', date '2026-11-12', 7);

-- B học ngày 2026-11-18.
insert into public.review_logs
  (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id, is_new, state_after)
values ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-000000000601', 'vocab:test-study-days', 3,
        timestamptz '2026-11-18 12:00:00+00', date '2026-11-18', null, false, '{}'::jsonb);

-- 1. anon không gọi được -----------------------------------------------------------------------------
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
end $$;

-- 2. A: đúng ngày, tăng dần, ngoài cửa sổ không tính, không lẫn B, có level ----------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a3', 'role', 'authenticated')::text, true);

do $$
declare
  v jsonb;
  v_k text;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if v -> 'study_days_35' is distinct from '["2026-10-16", "2026-11-10", "2026-11-19"]'::jsonb then
    raise exception 'FAIL study_days_35 của A sai: %', v -> 'study_days_35';
  end if;
  raise notice 'OK study_days_35 của A đúng, tăng dần, bỏ biên ngoài và ngày sau hôm nay';
  if v ->> 'level' is distinct from 'N4' then
    raise exception 'FAIL level của A sai: %', v ->> 'level';
  end if;
  raise notice 'OK level = N4';
  foreach v_k in array array['due_count', 'new_done_today', 'new_per_day', 'review_limit', 'streak',
    'total_days', 'xp_total', 'xp_today', 'median_seconds_7d', 'exam_date', 'studied_today'] loop
    if not v ? v_k then
      raise exception 'FAIL thiếu khóa cũ %', v_k;
    end if;
  end loop;
  -- Khóa cũ vẫn đúng: 5 ngày khác nhau (kể cả ngoài cửa sổ), hôm nay đã học.
  if (v ->> 'total_days')::int <> 5 or not (v ->> 'studied_today')::boolean then
    raise exception 'FAIL khóa cũ sai: %', v;
  end if;
  raise notice 'OK đủ khóa cũ, total_days = 5, studied_today = true';
end $$;

-- 3. B chỉ thấy ngày của B --------------------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000b4', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if v -> 'study_days_35' is distinct from '["2026-11-18"]'::jsonb then
    raise exception 'FAIL study_days_35 của B sai: %', v -> 'study_days_35';
  end if;
  if v ->> 'level' is distinct from 'N5' then
    raise exception 'FAIL level mặc định của B sai: %', v ->> 'level';
  end if;
  raise notice 'OK B chỉ thấy ngày của B; level mặc định N5';
end $$;

-- 4. C chưa học: mảng rỗng (không null) -------------------------------------------------------------
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000c5', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-19', timestamptz '2026-11-20 00:00:00+00');
  if v -> 'study_days_35' is distinct from '[]'::jsonb then
    raise exception 'FAIL study_days_35 của C phải là []: %', v -> 'study_days_35';
  end if;
  raise notice 'OK chưa học thì study_days_35 = []';
end $$;

-- 5. Cửa sổ trượt theo p_study_date: hôm nay = 2026-11-20 thì 2026-10-16 ra ngoài, 2026-11-20 vào trong.
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a3', 'role', 'authenticated')::text, true);

do $$
declare v jsonb;
begin
  v := public.get_dashboard(date '2026-11-20', timestamptz '2026-11-21 00:00:00+00');
  if v -> 'study_days_35' is distinct from '["2026-11-10", "2026-11-19", "2026-11-20"]'::jsonb then
    raise exception 'FAIL cửa sổ trượt sai: %', v -> 'study_days_35';
  end if;
  raise notice 'OK cửa sổ trượt theo p_study_date';
end $$;

reset role;
rollback;
