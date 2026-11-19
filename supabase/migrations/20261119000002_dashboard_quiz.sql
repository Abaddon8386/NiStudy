-- RPC get_dashboard và submit_quiz (docs/04-architecture.md mục 5.5, 6.2; FR-19..FR-24).
-- Project Supabase tắt tự cấp quyền API cho hàm mới nên cấp quyền rõ ràng.
-- Quy tắc streak/XP phải khớp src/lib/domain/streak.ts, xp.ts (fixture tests/fixtures/streak-xp.json).

-- ---------------------------------------------------------------------------
-- get_dashboard
-- ---------------------------------------------------------------------------
create function public.get_dashboard(p_study_date date, p_day_end timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_prof public.profiles%rowtype;
  v_due int;
  v_new_done int;
  v_total_days int;
  v_anchor date;
  v_streak int;
  v_studied_today boolean;
  v_xp_total bigint;
  v_xp_today bigint;
  v_median double precision;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_study_date is null or p_day_end is null or not isfinite(p_study_date) then
    raise exception 'p_study_date and p_day_end are required' using errcode = '22023';
  end if;

  select * into v_prof from public.profiles p where p.user_id = v_uid;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  select count(*) into v_due
    from public.card_states cs
    where cs.user_id = v_uid and cs.due < p_day_end;

  select count(distinct l.study_date) into v_total_days
    from public.review_logs l
    where l.user_id = v_uid;

  select count(*) into v_new_done
    from public.review_logs l
    where l.user_id = v_uid and l.study_date = p_study_date and l.is_new;

  select exists (
    select 1 from public.review_logs l
    where l.user_id = v_uid and l.study_date = p_study_date
  ) into v_studied_today;

  -- Chuỗi (FR-22): mốc là hôm nay nếu đã học, nếu không thì hôm qua nếu hôm qua có học.
  if v_studied_today then
    v_anchor := p_study_date;
  elsif exists (
    select 1 from public.review_logs l
    where l.user_id = v_uid and l.study_date = p_study_date - 1
  ) then
    v_anchor := p_study_date - 1;
  end if;

  if v_anchor is null then
    v_streak := 0;
  else
    -- Các ngày khác nhau <= mốc, từ mới đến cũ; ngày thứ n (từ 1) liên tiếp khi mốc - ngày = n - 1.
    select count(*) into v_streak
      from (
        select d.study_date,
          row_number() over (order by d.study_date desc) as rn
        from (
          select distinct l.study_date
          from public.review_logs l
          where l.user_id = v_uid and l.study_date <= v_anchor
        ) d
      ) r
      where v_anchor - r.study_date = r.rn - 1;
  end if;

  -- XP (FR-23)
  select
    (select count(*) from public.review_logs l where l.user_id = v_uid)
    + (select coalesce(sum(q.correct), 0) from public.quiz_attempts q where q.user_id = v_uid)
    + 5 * (select count(*) from public.daily_bonus b where b.user_id = v_uid),
    (select count(*) from public.review_logs l
       where l.user_id = v_uid and l.study_date = p_study_date)
    + (select coalesce(sum(q.correct), 0) from public.quiz_attempts q
         where q.user_id = v_uid and q.study_date = p_study_date)
    + 5 * (select count(*) from public.daily_bonus b
             where b.user_id = v_uid and b.study_date = p_study_date)
  into v_xp_total, v_xp_today;

  -- Trung vị giây giữa hai lượt liên tiếp cùng session trong 7 ngày học gần nhất;
  -- bỏ khoảng > 300 giây; ít hơn 10 khoảng hợp lệ thì null.
  select case when count(*) >= 10
              then percentile_cont(0.5) within group (order by g.secs) end
    into v_median
    from (
      select extract(epoch from (w.reviewed_at - w.prev_at))::double precision as secs
      from (
        select l.reviewed_at,
          lag(l.reviewed_at) over (
            partition by l.session_id order by l.reviewed_at, l.review_id) as prev_at
        from public.review_logs l
        where l.user_id = v_uid
          and l.session_id is not null
          and l.study_date between p_study_date - 6 and p_study_date
      ) w
      where w.prev_at is not null
    ) g
    where g.secs <= 300;

  return jsonb_build_object(
    'due_count', v_due,
    'new_done_today', v_new_done,
    'new_per_day', v_prof.new_per_day,
    'review_limit', v_prof.review_limit,
    'streak', v_streak,
    'total_days', v_total_days,
    'xp_total', v_xp_total,
    'xp_today', v_xp_today,
    'median_seconds_7d', v_median,
    'exam_date', v_prof.exam_date,
    'studied_today', v_studied_today
  );
end;
$$;

revoke execute on function public.get_dashboard(date, timestamptz) from public, anon;
grant execute on function public.get_dashboard(date, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- submit_quiz
-- ---------------------------------------------------------------------------
-- Idempotent theo (user_id, quiz_id). Không chạm card_states/review_logs (FR-20).
create function public.submit_quiz(p_quiz_id uuid, p_study_date date, p_correct int)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_inserted int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_quiz_id is null or p_study_date is null or p_correct is null then
    raise exception 'p_quiz_id, p_study_date and p_correct are required' using errcode = '22023';
  end if;
  if p_correct < 0 or p_correct > 10 then
    raise exception 'p_correct must be between 0 and 10' using errcode = '22023';
  end if;
  if not isfinite(p_study_date)
     or abs(p_study_date - (now() at time zone 'utc')::date) > 2 then
    raise exception 'p_study_date is too far from today' using errcode = '22023';
  end if;

  insert into public.quiz_attempts (user_id, quiz_id, study_date, correct)
  values (v_uid, p_quiz_id, p_study_date, p_correct::smallint)
  on conflict (user_id, quiz_id) do nothing;
  get diagnostics v_inserted = row_count;

  return case when v_inserted = 1 then 'accepted' else 'duplicate' end;
end;
$$;

revoke execute on function public.submit_quiz(uuid, date, int) from public, anon;
grant execute on function public.submit_quiz(uuid, date, int) to authenticated;
