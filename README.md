# Nihongo

Web học tiếng Nhật cho người Việt: học kanji qua âm Hán Việt, ôn tập theo thuật toán FSRS, bám lộ trình JLPT từ N5 đến N3 và có cơ chế giữ động lực.

## Trạng thái

Đang ở giai đoạn 2 — thiết kế UX/UI. Đã có tầm nhìn, đặc tả yêu cầu và wireframe. Chưa có bản chạy thử.

Xem kế hoạch đầy đủ tại [docs/00-plan.md](docs/00-plan.md).

## Vì sao có dự án này

Các giả thuyết dự án muốn kiểm chứng:

- Người Việt có sẵn âm Hán Việt, có thể dùng làm cầu nối để nhớ kanji.
- Lịch ôn tập ngắt quãng (FSRS) giúp ôn đúng lúc, không phải tự cấu hình.
- Lộ trình bám JLPT N5 đến N3 giúp người học biết mình đang ở đâu.
- Cơ chế giữ động lực lành mạnh giúp người học không bỏ dở giữa chừng.

Chi tiết xem [docs/01-vision.md](docs/01-vision.md).

## Tính năng dự kiến cho MVP

Tất cả mục dưới đây đều là dự kiến, chưa có trong mã nguồn. MVP gồm cấp JLPT N5–N4; N3 làm sau.

- Đăng nhập, chọn cấp bắt đầu.
- Học và ôn kana.
- Thẻ từ vựng N5–N4 ôn theo FSRS, nghĩa tiếng Việt.
- Kanji N5–N4 kèm âm Hán Việt.
- Trắc nghiệm.
- Dashboard: chuỗi ngày, XP, đếm ngược ngày thi.
- Giao diện dùng tốt trên điện thoại, PWA cài được.
- Miễn phí, chỉ lưu dữ liệu cần cho việc học, xóa được tài khoản.

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

Bắt đầu 17/11/2026. Mục tiêu MVP: đầu tháng 3/2027 (khoảng 9/3).

| Giai đoạn | Nội dung | Mốc |
|---|---|---|
| 0 | Định hướng | Tuần 1, 17/11 |
| — | Việc nhẹ trong tuần thi JLPT | Tuần 2, 24/11–30/11 |
| 1 | Yêu cầu và SRS | Tuần 3–4, 1/12–14/12 |
| 2 | Thiết kế UX/UI trên Figma | Tuần 4–6, 8/12–28/12 |
| 3 | Kiến trúc kỹ thuật | Tuần 6–7, 22/12–4/1 |
| 4 | Dựng repo chuẩn | Tuần 7, 29/12 |
| 5 | Code MVP theo sprint | Tuần 8–14, 5/1–22/2 (có tuần nghỉ Tết) |
| 6 | Kiểm thử và chất lượng | Song song, chốt tuần 15 |
| 7 | Ra mắt và hồ sơ | Tuần 16, khoảng 9/3/2027 |

## Cách chạy

Sẽ bổ sung khi dựng khung Next.js.

## Tài liệu

- [docs/00-plan.md](docs/00-plan.md): kế hoạch dự án.
- [docs/01-vision.md](docs/01-vision.md): tầm nhìn, người dùng, phạm vi MVP.
- [docs/02-srs.md](docs/02-srs.md): đặc tả yêu cầu phần mềm (FR, NFR, use case, user story).
- [docs/03-design.md](docs/03-design.md): thiết kế UX/UI, design token. Wireframe trên [Google Stitch](https://stitch.google.com/projects/8460357221411495285) (bản cũ trên [Figma](https://www.figma.com/design/3HNM618F5H30e56BehGuqS)).
- [docs/04-architecture.md](docs/04-architecture.md): kiến trúc kỹ thuật.
- [docs/adr/](docs/adr/README.md): các quyết định kiến trúc.
- `docs/05-test-plan.md` (sắp có): kế hoạch kiểm thử.

## Đóng góp

Xem [CONTRIBUTING.md](CONTRIBUTING.md).

## Nguồn dữ liệu và giấy phép

- JMdict và KANJIDIC2 là của EDRDG, theo giấy phép CC BY-SA. Phải ghi nguồn khi dùng. Xem https://www.edrdg.org/edrdg/licence.html.
- Câu ví dụ lấy từ Tatoeba (https://tatoeba.org), giấy phép CC BY.
- Nghĩa tiếng Việt do dự án tự biên soạn.
- Câu hỏi luyện thi do dự án tự soạn. Không dùng đề JLPT thật.

Mã nguồn dùng giấy phép MIT, xem [LICENSE](LICENSE). Giấy phép MIT không áp dụng cho dữ liệu dẫn xuất từ JMdict/KANJIDIC2 (giữ CC BY-SA) và câu ví dụ Tatoeba (giữ CC BY).
