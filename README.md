# Nihongo

Web học tiếng Nhật cho người Việt: học kanji qua âm Hán Việt, ôn tập theo thuật toán FSRS, bám lộ trình JLPT từ N5 đến N3 và có cơ chế giữ động lực.

## Trạng thái

Đang ở giai đoạn 0 — định hướng. Chưa có bản chạy thử.

Xem kế hoạch đầy đủ tại [docs/00-plan.md](docs/00-plan.md).

## Vì sao có dự án này

Các giả thuyết dự án muốn kiểm chứng:

- Người Việt có sẵn âm Hán Việt, có thể dùng làm cầu nối để nhớ kanji.
- Lịch ôn tập ngắt quãng (FSRS) giúp ôn đúng lúc, không phải tự cấu hình.
- Lộ trình bám JLPT N5 đến N3 giúp người học biết mình đang ở đâu.
- Cơ chế giữ động lực lành mạnh giúp người học không bỏ dở giữa chừng.

Chi tiết xem [docs/01-vision.md](docs/01-vision.md).

## Tính năng dự kiến cho MVP

Tất cả mục dưới đây đều là dự kiến, chưa có trong mã nguồn.

- Đăng nhập.
- Học và ôn kana.
- Thẻ từ vựng N5–N3 ôn theo FSRS.
- Kanji kèm âm Hán Việt.
- Trắc nghiệm.
- Dashboard: chuỗi ngày, XP, đếm ngược ngày thi.
- Giao diện dùng tốt trên điện thoại, có PWA.

## Công nghệ dự kiến

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend / CSDL | Supabase bản cloud (Postgres, đăng nhập, Row Level Security) |
| Thuật toán ôn tập | FSRS qua thư viện `ts-fsrs` |
| Dữ liệu | JMdict (từ điển), KANJIDIC2 (kanji), Tatoeba (câu ví dụ) |
| Test | Vitest (unit), Playwright (E2E, chỉ Chromium) |
| Deploy | Vercel, Sentry |

Công cụ quản lý gói: `pnpm`.

## Lộ trình

Bắt đầu 17/11/2026. Mục tiêu MVP: đầu tháng 3/2027.

| Giai đoạn | Nội dung | Mốc |
|---|---|---|
| 0 | Định hướng | Tuần 1, 17/11 |
| 1 | Yêu cầu và SRS | Tuần 2–3, 24/11–7/12 |
| 2 | Thiết kế UX/UI trên Figma | Tuần 3–5, 1/12–21/12 |
| 3 | Kiến trúc kỹ thuật | Tuần 5–6, 15/12–28/12 |
| 4 | Dựng repo chuẩn | Tuần 6, 22/12 |
| 5 | Code MVP theo sprint | Tuần 7–13, 29/12–15/2 (có tuần nghỉ Tết) |
| 6 | Kiểm thử và chất lượng | Song song, chốt tuần 14 |
| 7 | Ra mắt và hồ sơ | Tuần 15, đầu 3/2027 |

Tuần 24/11–6/12 giảm tải vì tác giả thi JLPT; lịch giai đoạn 1–2 có thể điều chỉnh.

## Cách chạy

Sẽ bổ sung khi dựng khung Next.js.

## Tài liệu

- [docs/00-plan.md](docs/00-plan.md): kế hoạch dự án.
- [docs/01-vision.md](docs/01-vision.md): tầm nhìn, người dùng, phạm vi MVP.
- `docs/02-srs.md` (sắp có): đặc tả yêu cầu phần mềm.
- `docs/03-design.md` (sắp có): thiết kế UX/UI.
- `docs/04-architecture.md` (sắp có): kiến trúc kỹ thuật.
- `docs/adr/` (sắp có): các quyết định kiến trúc.
- `docs/05-test-plan.md` (sắp có): kế hoạch kiểm thử.

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md).

## Nguồn dữ liệu và giấy phép

- JMdict và KANJIDIC2 là của EDRDG, theo giấy phép CC BY-SA. Phải ghi nguồn khi dùng. Xem https://www.edrdg.org/edrdg/licence.html.
- Câu ví dụ lấy từ Tatoeba (https://tatoeba.org), giấy phép CC BY.
- Câu hỏi luyện thi do dự án tự soạn. Không dùng đề JLPT thật.

Giấy phép mã nguồn:

> CẦN QUYẾT: chọn giấy phép mã nguồn (LICENSE).
