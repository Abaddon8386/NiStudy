-- Bảng học của người dùng và RPC (docs/04-architecture.md mục 5.3, 5.4, 6.2; ADR-0003).
-- Mọi ghi dữ liệu học đi qua RPC SECURITY DEFINER; client chỉ có SELECT.
-- Project Supabase tắt tự cấp quyền API cho bảng/hàm mới nên cấp quyền rõ ràng.

create table public.card_states (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null references public.cards (id),
  due timestamptz not null,
  stability double precision not null check (stability >= 0),
  difficulty double precision not null check (difficulty >= 0),
  elapsed_days int not null check (elapsed_days >= 0),
  scheduled_days int not null check (scheduled_days >= 0),
  learning_steps int not null check (learning_steps >= 0),
  reps int not null check (reps >= 0),
  lapses int not null check (lapses >= 0),
  state smallint not null check (state between 0 and 3),
  last_review timestamptz null,
  primary key (user_id, card_id)
);
create index card_states_user_due_idx on public.card_states (user_id, due);

create table public.review_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  review_id uuid not null,
  card_id text not null references public.cards (id),
  rating smallint not null check (rating between 1 and 4),
  reviewed_at timestamptz not null,
  study_date date not null,
  session_id uuid null,
  is_new boolean not null, -- máy chủ suy ra, không tin client
  state_before jsonb null,
  state_after jsonb not null,
  received_at timestamptz not null default now(),
  constraint review_logs_pkey primary key (user_id, review_id)
);
create index review_logs_user_study_date_idx on public.review_logs (user_id, study_date);

create table public.quiz_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_id uuid not null,
  study_date date not null,
  correct smallint not null check (correct between 0 and 10),
  finished_at timestamptz not null default now(),
  primary key (user_id, quiz_id)
);

create table public.daily_bonus (
  user_id uuid not null references auth.users (id) on delete cascade,
  study_date date not null,
  primary key (user_id, study_date)
);

alter table public.card_states enable row level security;
alter table public.review_logs enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.daily_bonus enable row level security;

create policy card_states_select_own on public.card_states
  for select to authenticated using (user_id = (select auth.uid()));
create policy review_logs_select_own on public.review_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy quiz_attempts_select_own on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));
create policy daily_bonus_select_own on public.daily_bonus
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.card_states, public.review_logs, public.quiz_attempts,
  public.daily_bonus from anon, authenticated;
grant select on public.card_states, public.review_logs, public.quiz_attempts,
  public.daily_bonus to authenticated;

-- ---------------------------------------------------------------------------
-- Hàm nội bộ (không cấp cho client; chỉ các RPC SECURITY DEFINER bên dưới gọi).
-- ---------------------------------------------------------------------------

-- Kiểm và chuẩn hóa một trạng thái thẻ FSRS dạng JSON (khóa = tên cột card_states).
-- Trả về đối tượng chỉ gồm đúng 10 khóa, hoặc null nếu thiếu khóa/sai kiểu/sai khoảng.
create function public.normalize_card_state(p jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  k text;
  v numeric;
  v_due timestamptz;
  v_last timestamptz;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    return null;
  end if;

  foreach k in array array['stability', 'difficulty'] loop
    if jsonb_typeof(p -> k) is distinct from 'number' then return null; end if;
    v := (p ->> k)::numeric;
    if v < 0 or v > 1000000000 then return null; end if;
  end loop;

  foreach k in array array['elapsed_days', 'scheduled_days', 'learning_steps', 'reps', 'lapses'] loop
    if jsonb_typeof(p -> k) is distinct from 'number' then return null; end if;
    v := (p ->> k)::numeric;
    if v < 0 or v > 2147483647 or v <> trunc(v) then return null; end if;
  end loop;

  if jsonb_typeof(p -> 'state') is distinct from 'number' then return null; end if;
  v := (p ->> 'state')::numeric;
  if v not in (0, 1, 2, 3) then return null; end if;

  if jsonb_typeof(p -> 'due') is distinct from 'string' then return null; end if;
  v_due := (p ->> 'due')::timestamptz;
  if not isfinite(v_due) then return null; end if;

  if coalesce(jsonb_typeof(p -> 'last_review'), 'null') <> 'null' then
    if jsonb_typeof(p -> 'last_review') <> 'string' then return null; end if;
    v_last := (p ->> 'last_review')::timestamptz;
    if not isfinite(v_last) then return null; end if;
  end if;

  return jsonb_build_object(
    'due', v_due,
    'stability', (p ->> 'stability')::double precision,
    'difficulty', (p ->> 'difficulty')::double precision,
    'elapsed_days', (p ->> 'elapsed_days')::numeric::int,
    'scheduled_days', (p ->> 'scheduled_days')::numeric::int,
    'learning_steps', (p ->> 'learning_steps')::numeric::int,
    'reps', (p ->> 'reps')::numeric::int,
    'lapses', (p ->> 'lapses')::numeric::int,
    'state', (p ->> 'state')::numeric::int,
    'last_review', v_last
  );
exception
  when data_exception then
    return null;
end;
$$;

-- Nội dung một thẻ cho get_today_queue: {card, details}. Kanji có thêm details.examples
-- (tối đa 3 từ published có chứa chữ đó).
create function public.card_payload(p_card_id text)
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

revoke execute on function public.normalize_card_state(jsonb) from public, anon, authenticated;
revoke execute on function public.card_payload(text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- submit_reviews (mục 6.2)
-- ---------------------------------------------------------------------------
-- Kết quả trả theo thứ tự xử lý (reviewed_at tăng dần), không theo thứ tự đầu vào;
-- client đối chiếu theo review_id.
create function public.submit_reviews(p_reviews jsonb)
returns table (review_id uuid, status text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_uid uuid := (select auth.uid());
  v_n int;
  v_ids uuid[] := '{}';
  v_keys timestamptz[] := '{}';
  v_order int[];
  v_i int;
  v_item jsonb;
  v_rid uuid;
  v_ok boolean;
  v_card text;
  v_rating numeric;
  v_at timestamptz;
  v_date date;
  v_session uuid;
  v_before jsonb;
  v_after jsonb;
  v_is_new boolean;
  v_inserted int;
  v_dates date[] := '{}';
  v_d date;
  v_npd int;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_reviews is null or jsonb_typeof(p_reviews) <> 'array' then
    raise exception 'p_reviews must be a json array' using errcode = '22023';
  end if;
  v_n := jsonb_array_length(p_reviews);
  if v_n > 200 then
    raise exception 'too many reviews in one batch (max 200)' using errcode = '22023';
  end if;
  if v_n = 0 then
    return;
  end if;

  -- Tuần tự hóa các lô của cùng một người dùng (is_new và upsert phụ thuộc thứ tự).
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text, 0));

  -- Lượt 1: đọc review_id (không đọc được là lỗi client: raise) và khóa sắp xếp reviewed_at.
  for v_i in 1..v_n loop
    v_item := p_reviews -> (v_i - 1);
    if jsonb_typeof(v_item) is distinct from 'object'
       or jsonb_typeof(v_item -> 'review_id') is distinct from 'string' then
      raise exception 'review at index % has no readable review_id', v_i - 1 using errcode = '22023';
    end if;
    begin
      v_rid := (v_item ->> 'review_id')::uuid;
    exception
      when invalid_text_representation then
        raise exception 'review at index % has an invalid review_id', v_i - 1 using errcode = '22023';
    end;
    v_ids[v_i] := v_rid;

    begin
      if jsonb_typeof(v_item -> 'reviewed_at') = 'string' then
        v_at := (v_item ->> 'reviewed_at')::timestamptz;
        if not isfinite(v_at) then v_at := null; end if;
      else
        v_at := null;
      end if;
    exception
      when data_exception then
        v_at := null;
    end;
    v_keys[v_i] := v_at; -- lượt không đọc được reviewed_at sẽ bị rejected ở lượt 2
  end loop;

  select array_agg(t.i order by t.k nulls first, t.i)
    into v_order
    from unnest(v_keys) with ordinality as t(k, i);

  -- Lượt 2: xử lý theo reviewed_at tăng dần.
  foreach v_i in array v_order loop
    v_item := p_reviews -> (v_i - 1);
    v_rid := v_ids[v_i];
    v_ok := true;
    v_card := null;
    v_before := null;
    v_after := null;
    v_session := null;

    begin
      -- card_id
      if jsonb_typeof(v_item -> 'card_id') is distinct from 'string' then
        v_ok := false;
      else
        v_card := v_item ->> 'card_id';
      end if;

      -- rating nguyên 1..4
      if v_ok then
        if jsonb_typeof(v_item -> 'rating') is distinct from 'number' then
          v_ok := false;
        else
          v_rating := (v_item ->> 'rating')::numeric;
          if v_rating not in (1, 2, 3, 4) then v_ok := false; end if;
        end if;
      end if;

      -- reviewed_at hợp lệ và không ở tương lai quá 5 phút
      if v_ok then
        if jsonb_typeof(v_item -> 'reviewed_at') is distinct from 'string' then
          v_ok := false;
        else
          v_at := (v_item ->> 'reviewed_at')::timestamptz;
          if not isfinite(v_at) or v_at > now() + interval '5 minutes' then v_ok := false; end if;
        end if;
      end if;

      -- study_date lệch tối đa 2 ngày so với ngày UTC của reviewed_at
      if v_ok then
        if jsonb_typeof(v_item -> 'study_date') is distinct from 'string' then
          v_ok := false;
        else
          v_date := (v_item ->> 'study_date')::date;
          if not isfinite(v_date)
             or abs(v_date - (v_at at time zone 'utc')::date) > 2 then
            v_ok := false;
          end if;
        end if;
      end if;

      -- session_id: bỏ trống được; nếu có thì phải là uuid
      if v_ok and coalesce(jsonb_typeof(v_item -> 'session_id'), 'null') <> 'null' then
        if jsonb_typeof(v_item -> 'session_id') <> 'string' then
          v_ok := false;
        else
          v_session := (v_item ->> 'session_id')::uuid;
        end if;
      end if;

      -- state_after bắt buộc; state_before tùy chọn (không hợp lệ thì bỏ)
      if v_ok then
        v_after := public.normalize_card_state(v_item -> 'state_after');
        if v_after is null then v_ok := false; end if;
        v_before := public.normalize_card_state(v_item -> 'state_before');
      end if;
    exception
      when data_exception then
        v_ok := false;
    end;

    if v_ok and not exists (select 1 from public.cards c where c.id = v_card) then
      v_ok := false;
    end if;

    if not v_ok then
      review_id := v_rid;
      status := 'rejected';
      return next;
      continue;
    end if;

    -- is_new do máy chủ suy ra, tính trước khi ghi card_states.
    v_is_new := not exists (
      select 1 from public.card_states cs where cs.user_id = v_uid and cs.card_id = v_card);

    insert into public.review_logs
      (user_id, review_id, card_id, rating, reviewed_at, study_date, session_id,
       is_new, state_before, state_after)
    values
      (v_uid, v_rid, v_card, v_rating::smallint, v_at, v_date, v_session,
       v_is_new, v_before, v_after || jsonb_build_object('last_review', v_at))
    on conflict on constraint review_logs_pkey do nothing;
    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
      review_id := v_rid;
      status := 'duplicate';
      return next;
      continue;
    end if;

    -- Lượt mới hơn thắng (FR-27): chỉ ghi đè khi reviewed_at mới hơn last_review hiện có.
    insert into public.card_states as cs
      (user_id, card_id, due, stability, difficulty, elapsed_days, scheduled_days,
       learning_steps, reps, lapses, state, last_review)
    values
      (v_uid, v_card,
       (v_after ->> 'due')::timestamptz,
       (v_after ->> 'stability')::double precision,
       (v_after ->> 'difficulty')::double precision,
       (v_after ->> 'elapsed_days')::int,
       (v_after ->> 'scheduled_days')::int,
       (v_after ->> 'learning_steps')::int,
       (v_after ->> 'reps')::int,
       (v_after ->> 'lapses')::int,
       (v_after ->> 'state')::smallint,
       v_at)
    on conflict (user_id, card_id) do update set
      due = excluded.due,
      stability = excluded.stability,
      difficulty = excluded.difficulty,
      elapsed_days = excluded.elapsed_days,
      scheduled_days = excluded.scheduled_days,
      learning_steps = excluded.learning_steps,
      reps = excluded.reps,
      lapses = excluded.lapses,
      state = excluded.state,
      last_review = excluded.last_review
    where cs.last_review is null or excluded.last_review > cs.last_review;

    v_dates := array_append(v_dates, v_date);
    review_id := v_rid;
    status := 'accepted';
    return next;
  end loop;

  -- Mốc +5 XP (FR-23): mỗi study_date bị ảnh hưởng đạt new_per_day lượt mới.
  select p.new_per_day into v_npd from public.profiles p where p.user_id = v_uid;
  if v_npd is not null then
    for v_d in select distinct u.d from unnest(v_dates) as u(d) loop
      if (select count(*) from public.review_logs l
           where l.user_id = v_uid and l.study_date = v_d and l.is_new) >= v_npd then
        insert into public.daily_bonus (user_id, study_date)
        values (v_uid, v_d)
        on conflict do nothing;
      end if;
    end loop;
  end if;

  return;
end;
$$;

revoke execute on function public.submit_reviews(jsonb) from public, anon;
grant execute on function public.submit_reviews(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- get_today_queue (mục 6.2)
-- ---------------------------------------------------------------------------
-- Trả {due: [{card, details, state}], new_done_today: int, new_candidates: [{card, details}]}.
-- new_candidates là mảng phẳng: kana, rồi kanji, rồi vocab, mỗi loại theo sort_order,
-- tối đa new_per_day mỗi loại. Việc xen kẽ và cắt số còn lại làm ở client (queue.ts).
create function public.get_today_queue(p_study_date date, p_day_end timestamptz)
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
        case r.kind when 'kana' then 1 when 'kanji' then 2 else 3 end as ord,
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
            or (c.kind in ('kanji', 'vocab') and c.level = v_prof.level)
          )
      ) r
      where r.rn <= v_prof.new_per_day
    ) y;

  return jsonb_build_object('due', v_due, 'new_done_today', v_done, 'new_candidates', v_new);
end;
$$;

revoke execute on function public.get_today_queue(date, timestamptz) from public, anon;
grant execute on function public.get_today_queue(date, timestamptz) to authenticated;
