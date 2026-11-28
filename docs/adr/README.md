# Quyết định kiến trúc (ADR)

ADR (Architecture Decision Record) ghi lại một quyết định kiến trúc: vì sao chọn, đã cân nhắc gì. Mỗi ADR ngắn, khoảng một trang. Bức tranh tổng thể ở [docs/04-architecture.md](../04-architecture.md).

## Mục lục

| Số | Quyết định | Trạng thái |
|---|---|---|
| [0001](0001-nextjs-supabase-cloud.md) | Next.js App Router + Supabase cloud, không backend riêng | Đã chấp nhận, 18/11/2026 |
| [0002](0002-fsrs-tinh-o-client.md) | FSRS tính ở client bằng `ts-fsrs`, máy chủ lưu trạng thái | Đã chấp nhận, 18/11/2026 |
| [0003](0003-ghi-du-lieu-hoc-qua-rpc.md) | Mọi ghi dữ liệu học đi qua RPC Postgres, idempotent | Đã chấp nhận, 18/11/2026 |
| [0004](0004-offline-outbox-serwist.md) | Offline: IndexedDB outbox + Serwist, không Background Sync | Đã chấp nhận, 18/11/2026 |
| [0005](0005-pipeline-du-lieu-giay-phep.md) | Pipeline dữ liệu nội dung và giấy phép | Đã chấp nhận, 18/11/2026 |
| [0006](0006-xoa-tai-khoan-route-handler.md) | Xóa tài khoản qua Route Handler dùng service role | Đã chấp nhận, 18/11/2026 |
| [0007](0007-hai-project-supabase.md) | Hai project Supabase (dev, prod), migration bằng CLI | Đã chấp nhận, 18/11/2026 |
| [0008](0008-am-thanh-va-giong-noi.md) | Âm thanh và giọng nói: `speechSynthesis` + MediaRecorder cục bộ | Đã chấp nhận, 19/11/2026 |
| [0009](0009-ngu-phap.md) | Ngữ pháp: nội dung tự soạn trong repo, lưu CSDL, một thẻ FSRS cho mỗi điểm | Đã chấp nhận, 28/11/2026 |

## Mẫu

Tên file: `NNNN-mo-ta-ngan.md`. Số tăng dần, không dùng lại. Khi đổi quyết định, viết ADR mới và ghi "Bị thay thế bởi ADR-xxxx" ở ADR cũ, không xóa ADR cũ.

```markdown
# ADR-NNNN: Tiêu đề quyết định

Trạng thái: Đã chấp nhận, ngày/tháng/năm

## Bối cảnh

Vấn đề cần giải quyết và ràng buộc liên quan (trỏ tới FR, NFR nếu có).

## Quyết định

Chọn gì, nói rõ ràng.

## Hệ quả

Được gì, mất gì, rủi ro, việc phải làm theo.

## Phương án đã cân nhắc

- Phương án A: vì sao không chọn.
- Phương án B: vì sao không chọn.
```
