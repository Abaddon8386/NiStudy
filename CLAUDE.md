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
- 17/11/2026: tạo file Figma "Nihongo — Wireframe MVP" (key `3HNM618F5H30e56BehGuqS`, mục nháp, gói Starter; ghế View vẫn ghi được qua MCP). Có biến màu, component nút/nút chấm, 5 khung điện thoại: S-06, S-07 (thường, mất mạng), S-10, S-12.
- Tiếp theo: dựng các màn còn lại (S-01..S-05, S-08, S-09, S-11, S-13, S-14) và bản máy tính S-06 nếu cần; thử prototype với 3–5 người (người dùng tự tìm người thử); sau đó giai đoạn 3 (`docs/04-architecture.md`). Người dùng tự dùng thử Mazii.
