# Nihongo: quy tắc làm việc

Đầu mỗi phiên đọc `docs/00-plan.md` và mục "Đang làm" cuối file này. Trả lời bằng tiếng Việt.

## Đội agent

Phiên chính (Opus) là bộ não. Nó không tự viết phần lớn code hay tài liệu, mà làm những việc cần suy nghĩ:
- chia kế hoạch thành việc nhỏ, mỗi việc có mục tiêu, file liên quan, tiêu chí xong và kiểm thử;
- chọn công nhân và model cho từng việc, giao việc, đọc lại kết quả;
- tự quyết thiết kế, kiến trúc, dữ liệu người dùng, bảo mật/RLS, thuật toán FSRS và review thay đổi rủi ro cao;
- tổng hợp, cập nhật "Đang làm", báo người dùng.

Công nhân nằm trong `.claude/agents/`:

| Agent | Model | Việc |
|---|---|---|
| `docs-writer` | Sonnet | Vision, SRS, user story, ADR, README theo dàn ý được giao |
| `implementer` | Sonnet | Code một việc đã rõ yêu cầu, kèm test |
| `tester` | Sonnet | Viết và chạy test, báo lỗi có bằng chứng |
| `reviewer` | Sonnet | Review đúng sai, bảo mật, accessibility; chỉ đọc |
| `data-worker` | Haiku | Việc máy móc: chuyển định dạng, lọc dữ liệu JMdict/KANJIDIC, liệt kê, tóm tắt ngắn |

Cách giao việc:
- Việc nhỏ, cần kết quả ngay trong lượt: gọi subagent (công cụ Agent) với tên agent.
- Việc dài, tự đứng được, cần tách khỏi `main`: mở phiên riêng, mỗi phiên một nhánh và một worktree.
- Lời giao việc phải đủ để công nhân làm mà không cần đọc lại cả cuộc trò chuyện: mục tiêu, file, ràng buộc, tiêu chí xong, lệnh kiểm thử.
- Hai công nhân không sửa cùng file cùng lúc.
- Kết quả công nhân là báo cáo, chưa phải bằng chứng: bộ não đọc diff và chạy kiểm tra trước khi báo xong.

## Git

- Dự án cá nhân: commit và push thẳng lên `main`, không cần PR (quyết định 17/11/2026). Nhánh `feature/<so-issue>-<mo-ta>`, `fix/...`, `docs/...` chỉ dùng cho việc dài hoặc thử nghiệm; xong thì đưa vào `main` bằng fast-forward.
- Commit theo Conventional Commits.
- Không đưa tên AI, model hay công cụ AI vào tên nhánh, tác giả, co-author hay nội dung commit/PR.
- Chỉ commit/push khi người dùng cho phép.
- Worktree đặt tại `C:/Users/hai/.local/share/project-worktrees/nihongo/<nhanh>`; tối đa 2 worktree có `node_modules` cùng lúc vì ổ đĩa còn ít.

## Kỹ thuật

- Next.js + TypeScript + Tailwind, Supabase bản cloud, `ts-fsrs`, Vitest, Playwright (chỉ Chromium), `pnpm`.
- Không cài Docker hay Supabase chạy trên máy.
- Không lưu khóa, mật khẩu vào repo; dùng `.env.local` (đã ignore).
- JMdict/KANJIDIC là CC BY-SA, phải ghi nguồn. Không chép đề JLPT thật.
- Giao diện: body 16px, chữ phụ tối thiểu 14px, vùng bấm 44px, hiển thị đúng tiếng Việt và tiếng Nhật.

## Đang làm

- 17/11/2026: đã trả lời câu hỏi mở (fullstack; biết HTML/CSS/JS + SQL/Supabase, chưa biết React/TS/Next; 10–15 giờ/tuần; thi JLPT N4/N5 ngày 6/12), ghi vào `docs/00-plan.md`.
- 17/11/2026: đã đưa lên `main` bản nháp `docs/01-vision.md`, README, CONTRIBUTING, `.gitignore`, template issue/PR. Bỏ quy trình PR, push thẳng `main`.
- 17/11/2026: đã tạo nhãn `user-story`, `task` trên GitHub cho template issue.
- 17/11/2026: đã chốt 11 quyết định giai đoạn 0 (`docs/01-vision.md` mục 10): MVP chỉ N5–N4, nghĩa tiếng Việt tự biên soạn (JMdict không có tiếng Việt), Hán Việt từ KANJIDIC2, danh sách JLPT từ tanos.co.uk, giai đoạn 1–4 lùi một tuần (MVP khoảng 9/3/2027), LICENSE MIT; repo chuyển public ở giai đoạn 7.
- 17/11/2026: đã xác nhận KANJIDIC2 có âm Hán Việt (`r_type="vietnam"`) và danh sách tanos là CC BY (qua repo mirror; tên miền gốc không truy cập được). Ngày trong plan là mốc muộn nhất: xong giai đoạn nào thì chuyển ngay sang giai đoạn sau.
- 17/11/2026: viết và review `docs/02-srs.md` v0.2: 30 FR, 25 NFR, 6 UC, 16 US, ma trận truy vết; mục 9 ghi 22 quyết định chi tiết (dữ liệu cục bộ gắn user_id, chống trùng theo (user_id, review_id), `study_date` tính lúc chấm, FSRS tính ở thiết bị, xóa tài khoản phía máy chủ).
- 17/11/2026: tạo backlog GitHub: issue #2–#17 ứng với US-01..US-16 (nhãn `user-story`), milestone Sprint 1 (US-01, 02, 03, 05), Sprint 2 (US-04, 06, 07, 08), Sprint 3 (US-09..16). Tiêu chí chấp nhận nằm ở `docs/02-srs.md`, issue chỉ trỏ về. Giai đoạn 1 xong.
- 17/11/2026: viết `docs/03-design.md`: hướng "editorial-greeting" (skill design-taste-frontend, sheet lưu ngoài repo tại `C:/Users/hai/.local/share/design-taste/nihongo`), 14 màn S-01..S-14, token màu đã đo tương phản (viền điều khiển #8c8c88), font Be Vietnam Pro + Noto Serif (lời chào) + Noto Sans JP + Klee One (kanji), nhận diện: kanji lớn + Hán Việt viết HOA, dải ngày học. SRS FR-21 bổ sung thời gian ước tính và XP hôm nay.
- 17/11/2026: tạo file Figma "Nihongo — Wireframe MVP" (key `3HNM618F5H30e56BehGuqS`, mục nháp, gói Starter; ghế View vẫn ghi được qua MCP). Có biến màu, component nút/nút chấm, 5 khung điện thoại: S-06, S-07 (thường, mất mạng), S-10, S-12; trang "Wireframe máy tính" có 4 khung 1440px: S-06, S-07, S-10, S-12.
- 17/11/2026: dựng thêm trên trang điện thoại S-01..S-05, S-08, S-09; sửa dữ liệu mẫu S-06 (cả hai bản) cho khớp S-08. Hết lượt gọi Figma MCP của gói Starter giữa chừng: S-11, S-13, S-14 chưa dựng; nhãn "Thẻ đã ôn" ở S-08 có thể chưa đổi thành "Thẻ đến hạn đã ôn" (lệnh bị chặn, chưa xác minh). Khi dựng S-14: kiểm tra phiên bản CC BY-SA của EDRDG trước khi ghi số phiên bản.
- 17/11/2026: chuyển thiết kế chính sang Google Stitch, project `8460357221411495285` (tài khoản Google thứ hai trong trình duyệt, `/u/1/`). Đủ 14 màn điện thoại + 4 màn máy tính; đã soát và sửa phần lớn (xem `docs/03-design.md` dòng 5). Stitch tự đổi design system sang "Atelier Crisp" (chữ 11–13px): mọi lệnh sinh phải ghi rõ cỡ chữ ≥ 14px và chữ phụ #636361. Kết quả Stitch quá lớn: lưu file rồi tóm tắt bằng script trong scratchpad.
- 18/11/2026: người dùng thấy v1 chán, nhiều chữ giải thích nhỏ; chốt hướng v2 sống động (khối màu đậm, vệt dạ quang, dấu triện, chuyển động có chủ đích; xem `docs/03-design.md`). Stitch sinh mẫu v2 bị trắng; chuyển sang prototype HTML do implementer dựng: artifact riêng tư https://claude.ai/artifact/KtKAptQvmsrvRqVz3g9taj, bản lưu `C:/Users/hai/.local/share/nihongo-prototype/v2/index.html`. Đã đọc mã, sửa nhãn; tương tác chưa bấm thử trên trình duyệt (trình duyệt trong app chưa đăng nhập claude.ai). Người dùng nhắc: bộ não phải giao việc sinh/sửa hàng loạt cho công nhân, chỉ tự quyết và soát.
- 18/11/2026: người dùng duyệt v2. docs-writer viết lại mục 5 token theo prototype (thêm 5.6 Chuyển động); implementer thêm màn trắc nghiệm (10 câu N5, đã soát dữ liệu) và cài đặt (tự lưu, kiểm lỗi, hộp xóa tài khoản trong trang) vào prototype, kiểm bằng Chrome headless ở 375/1440px, ảnh tại `C:/Users/hai/.local/share/nihongo-prototype/v2/shots/`. Artifact bản 3. Chưa thử Safari iOS, trình đọc màn hình, reduced-motion trên trình duyệt; trắc nghiệm chưa có trạng thái "chưa mở"; ngày thi ở trang chính chưa nối với cài đặt.
- 18/11/2026: giai đoạn 3: viết `docs/04-architecture.md` + ADR 0001–0007 (Next.js + Supabase cloud, FSRS ở client, mọi ghi dữ liệu học qua RPC SECURITY DEFINER idempotent, XP/chuỗi tính khi đọc, outbox IndexedDB + Serwist không cache dữ liệu cá nhân, xóa tài khoản qua Route Handler service role, 2 project Supabase dev/prod). Máy chủ suy `is_new`; trắc nghiệm cần mạng ở MVP; SRS đã chỉnh NFR-12, NFR-15, FR-19, FR-27, mục 1.3. Còn kiểm chứng ở giai đoạn 4: mở app offline với phiên đăng nhập, Serwist với bundler Next.js, đăng ký email trùng, tên trường ts-fsrs. 
- 18/11/2026: đo độ phủ Hán Việt KANJIDIC2 (v2026-322) trên danh sách tanos (mirror Bluskyo/JLPT_Vocabulary @d29a678): N5 79/79, N4 166/166; 75 chữ nhiều âm, xếp theo bảng chữ cái nên âm chính chọn tay; cần chuẩn hóa NFC. File thô, script, CSV ngoài repo tại `C:/Users/hai/.local/share/nihongo-data/`. Giai đoạn 3 xong.
- 18/11/2026: người dùng duyệt âm chính cho 75 kanji nhiều âm theo gợi ý; lưu `data/vi/kanji.csv` (meaning_vi còn trống), thêm `data/LICENSE.md` (CC BY-SA, tách MIT).
- 18/11/2026: giai đoạn 4: khung Next.js 16.4.5 (Turbopack) + React 19.3 + TS 6 + Tailwind 4, pnpm 12.17.0 qua `corepack pnpm@12.17.0` (không cài toàn cục), ts-fsrs 6.0.0 dùng FSRS-6, `@serwist/turbopack` (sw tại `/serwist/sw.js`), `src/proxy.ts` (middleware đổi tên ở Next 16), CI GitHub Actions (lint, typecheck, unit, build, quét service role, e2e Chromium). Lint/typecheck/17 unit/build/quét đều đạt khi bộ não chạy lại; e2e 7 pass theo implementer. Chưa chạy CI trên GitHub.
- 18/11/2026: tạo project Supabase `nihongo-dev` (org Nihongo Free, Singapore, mã gdbmirfdxqkatquommdv; tắt tự cấp quyền API, bật tự RLS; mật khẩu tối thiểu 8, Redirect URL `http://localhost:3000/**`). `.env.local` có URL + khóa publishable. Mẫu email chưa sửa được khi chưa có SMTP riêng nên `/auth/confirm` xử lý cả `code` (PKCE) lẫn `token_hash`. Sửa offline: precache vỏ `/`, tắt `reloadOnOnline`/`cacheOnNavigation`.
- 18/11/2026: sprint 1 code xong: auth (S-01..S-04, `/auth/confirm`), guard phía client (không redirect ở proxy vì vỏ precache), Khởi đầu, Cài đặt tự lưu; migration `profiles` đã áp lên dev qua SQL editor, `supabase/tests/profiles_rls.sql` đạt. E2E dùng phản hồi Supabase giả; chưa thử email thật. Phần US-03/US-05 phụ thuộc hàng đợi/RPC để sprint 2.
- Tiếp theo: người dùng thử đăng ký thật bằng email tài khoản Supabase; SMTP riêng (Resend) để đo email trùng và mẫu email tiếng Việt; sprint 2 (US-04, 06, 07, 08); thử prototype với 3–5 người.
