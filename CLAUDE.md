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
- Cần làm: tạo nhãn `user-story`, `task` trên GitHub (template issue dùng hai nhãn này).
- Tiếp theo: chốt các điểm CẦN QUYẾT trong `docs/01-vision.md` mục 10 (ưu tiên: lịch tuần thi JLPT, nguồn Hán Việt, danh sách JLPT, phạm vi kanji, LICENSE), kiểm chứng đối thủ (nhất là Mazii), rồi giai đoạn 1 (`docs/02-srs.md`).
