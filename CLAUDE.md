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
- Việc dài, tự đứng được, ra một nhánh/PR riêng: mở phiên riêng, mỗi phiên một nhánh và một worktree.
- Lời giao việc phải đủ để công nhân làm mà không cần đọc lại cả cuộc trò chuyện: mục tiêu, file, ràng buộc, tiêu chí xong, lệnh kiểm thử.
- Hai công nhân không sửa cùng file cùng lúc.
- Kết quả công nhân là báo cáo, chưa phải bằng chứng: bộ não đọc diff và chạy kiểm tra trước khi báo xong.

## Git

- `main` chỉ nhận PR. Nhánh: `feature/<so-issue>-<mo-ta>`, `fix/...`, `docs/...`.
- Commit theo Conventional Commits.
- Không đưa tên AI, model hay công cụ AI vào tên nhánh, tác giả, co-author hay nội dung commit/PR.
- Chỉ commit/push/tạo PR/merge khi người dùng cho phép.
- Worktree đặt tại `C:/Users/hai/.local/share/project-worktrees/nihongo/<nhanh>`; tối đa 2 worktree có `node_modules` cùng lúc vì ổ đĩa còn ít.

## Kỹ thuật

- Next.js + TypeScript + Tailwind, Supabase bản cloud, `ts-fsrs`, Vitest, Playwright (chỉ Chromium), `pnpm`.
- Không cài Docker hay Supabase chạy trên máy.
- Không lưu khóa, mật khẩu vào repo; dùng `.env.local` (đã ignore).
- JMdict/KANJIDIC là CC BY-SA, phải ghi nguồn. Không chép đề JLPT thật.
- Giao diện: body 16px, chữ phụ tối thiểu 14px, vùng bấm 44px, hiển thị đúng tiếng Việt và tiếng Nhật.

## Đang làm

- 17/11/2026: tạo repo private `Abaddon8386/nihongo`, chưa có commit. Có `docs/00-plan.md`, file này và `.claude/agents/`.
- Tiếp theo: commit khung ban đầu, rồi giai đoạn 0 (`docs/01-vision.md`).
