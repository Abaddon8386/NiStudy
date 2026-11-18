-- Kiểm thủ công RLS/quyền của public.profiles. Chạy trong SQL editor của project nihongo-dev.
-- Toàn bộ nằm trong một transaction và ROLLBACK ở cuối: không để lại dữ liệu.
-- Kết quả: xem thông báo NOTICE "OK ..."; bất kỳ lỗi nào là EXCEPTION "FAIL ...".

begin;

-- 0. Tạo 2 user tối thiểu (chạy bằng vai trò hiện tại, thường là postgres) để trigger tạo profiles.
insert into auth.users (id, instance_id, aud, role, email)
values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-a@example.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rls-b@example.test');

do $$
begin
  if (select count(*) from public.profiles
      where user_id in ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000b2')) <> 2 then
    raise exception 'FAIL trigger: không tạo đủ 2 profiles';
  end if;
  raise notice 'OK trigger tạo profiles cho user mới';
end $$;

-- Từ đây giả lập user A (vai trò authenticated, JWT sub = A).
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', '00000000-0000-0000-0000-0000000000a1', 'role', 'authenticated')::text, true);

do $$
declare n int;
begin
  -- 1. Đọc được dòng của mình, không thấy dòng người khác.
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FAIL select: user A thấy % dòng (mong đợi 1)', n; end if;
  if not exists (select 1 from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1') then
    raise exception 'FAIL select: user A không thấy dòng của mình';
  end if;
  raise notice 'OK select chỉ thấy dòng của mình';

  -- 2. Update hợp lệ vào dòng của mình.
  update public.profiles set new_per_day = 12 where user_id = '00000000-0000-0000-0000-0000000000a1';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL update hợp lệ: % dòng', n; end if;
  raise notice 'OK update new_per_day=12 vào dòng của mình';

  -- 3. Update dòng người khác: 0 dòng bị ảnh hưởng (RLS lọc).
  update public.profiles set new_per_day = 12 where user_id = '00000000-0000-0000-0000-0000000000b2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL update dòng người khác: % dòng bị sửa', n; end if;
  raise notice 'OK update dòng người khác bị lọc (0 dòng)';

  -- 4. new_per_day = 3 bị check từ chối.
  begin
    update public.profiles set new_per_day = 3 where user_id = '00000000-0000-0000-0000-0000000000a1';
    raise exception 'FAIL check: new_per_day=3 lại được chấp nhận';
  exception when check_violation then
    raise notice 'OK new_per_day=3 bị check_violation từ chối';
  end;

  -- 5. Sửa user_id bị từ chối quyền (quyền theo cột).
  begin
    update public.profiles set user_id = '00000000-0000-0000-0000-0000000000b2'
      where user_id = '00000000-0000-0000-0000-0000000000a1';
    raise exception 'FAIL quyền cột: sửa user_id lại được';
  exception when insufficient_privilege then
    raise notice 'OK update user_id bị từ chối quyền';
  end;

  -- 6. Sửa created_at bị từ chối quyền.
  begin
    update public.profiles set created_at = now() where user_id = '00000000-0000-0000-0000-0000000000a1';
    raise exception 'FAIL quyền cột: sửa created_at lại được';
  exception when insufficient_privilege then
    raise notice 'OK update created_at bị từ chối quyền';
  end;

  -- 7. INSERT bị từ chối.
  begin
    insert into public.profiles (user_id) values ('00000000-0000-0000-0000-0000000000c3');
    raise exception 'FAIL insert: được chấp nhận';
  exception when insufficient_privilege then
    raise notice 'OK insert bị từ chối quyền';
  end;

  -- 8. DELETE bị từ chối.
  begin
    delete from public.profiles where user_id = '00000000-0000-0000-0000-0000000000a1';
    raise exception 'FAIL delete: được chấp nhận';
  exception when insufficient_privilege then
    raise notice 'OK delete bị từ chối quyền';
  end;

  -- 9. Không gọi được hàm trigger trực tiếp.
  begin
    perform public.handle_new_user();
    raise exception 'FAIL execute: gọi được handle_new_user()';
  exception when insufficient_privilege then
    raise notice 'OK không gọi được handle_new_user()';
  end;
end $$;

-- 10. anon không đọc được gì.
reset role;
set local role anon;
select set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);

do $$
begin
  begin
    perform 1 from public.profiles;
    raise exception 'FAIL anon: select được chấp nhận';
  exception when insufficient_privilege then
    raise notice 'OK anon bị từ chối select';
  end;
end $$;

reset role;
rollback;
