-- Bảng profiles (docs/04-architecture.md mục 5.3, 5.4).
-- Project Supabase tắt tự cấp quyền API cho bảng mới nên cấp quyền rõ ràng bên dưới.

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  level text not null default 'N5' check (level in ('N5', 'N4')),
  knows_kana boolean not null default false,
  new_per_day int not null default 10 check (new_per_day between 5 and 30),
  review_limit int not null default 100 check (review_limit between 50 and 500),
  exam_date date null,
  onboarded_at timestamptz null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Không INSERT/DELETE từ trình duyệt (INSERT do trigger). UPDATE theo cột:
-- không sửa được user_id, created_at.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (level, knows_kana, new_per_day, review_limit, exam_date, onboarded_at)
  on public.profiles to authenticated;

-- Tự tạo profile khi có người dùng mới.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
