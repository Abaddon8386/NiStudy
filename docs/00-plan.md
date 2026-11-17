# Kế hoạch dự án Nihongo

Web học tiếng Nhật cho người Việt: học kanji qua âm Hán Việt, ôn tập theo thuật toán lặp lại ngắt quãng (FSRS), bám lộ trình JLPT và có cơ chế giữ động lực.

- Bắt đầu: 17/11/2026
- Giả định: một người làm, 10–15 giờ mỗi tuần, khoảng 15 tuần ra MVP (đã cộng 1 tuần nghỉ Tết, khoảng 6/2/2027).
- Mục tiêu MVP: đầu tháng 3/2027.
- Tài liệu này là bản gốc của kế hoạch. Đổi kế hoạch thì sửa file này bằng một commit riêng.

## Quyết định định hướng (17/11/2026)

- Vị trí nhắm tới: **fullstack**. Đầu tư sâu vào schema Postgres, Row Level Security, luồng dữ liệu JMdict/KANJIDIC và logic FSRS, bên cạnh giao diện.
- Đã biết: HTML/CSS/JavaScript, SQL/Postgres/Supabase. Chưa biết React, TypeScript, Next.js: dành thời gian học ở giai đoạn 3–4, trước sprint 1.
- Thời gian: 10–15 giờ mỗi tuần, đúng giả định ở trên.
- Thi JLPT N4/N5 ngày 6/12/2026: tuần 24/11–6/12 giảm tải dự án, ôn bằng bản demo HTML đã có. Dời lịch giai đoạn 1–2 hay giữ mốc MVP và cắt phạm vi: CẦN QUYẾT, xem `docs/01-vision.md` mục 10.

## Giai đoạn 0: Định hướng (tuần 1, 17/11)

- Tầm nhìn: vấn đề, người dùng mục tiêu, giá trị cốt lõi.
- 2–3 persona. Ví dụ: sinh viên ôn N3 đang mất động lực; người đi làm mỗi ngày chỉ có 15 phút.
- Phân tích đối thủ: Anki, Duolingo, Mazii, WaniKani, Bunpro (mạnh gì, yếu gì, mình khác ở đâu).
- Điểm khác biệt: dành cho người Việt, kanji qua âm Hán Việt, bám JLPT, cơ chế giữ động lực.
- Phạm vi MVP: làm ngay và để sau.

Sản phẩm: `docs/01-vision.md`

## Giai đoạn 1: Yêu cầu và SRS (tuần 2–3, 24/11–7/12)

- SRS theo khung IEEE 830 / ISO 29148: mục đích, phạm vi, thuật ngữ.
- Yêu cầu chức năng mã `FR-01`, `FR-02`… Ví dụ: "FR-05: Hệ thống lên lịch ôn thẻ theo FSRS".
- Yêu cầu phi chức năng: tải trang dưới 2 giây, bảo mật, WCAG AA, dùng tốt trên điện thoại.
- Use case, ràng buộc, giả định.
- User story kèm tiêu chí chấp nhận: "Là người học N4, tôi muốn… để…".
- Backlog trên GitHub Projects: mỗi story một issue, có nhãn và milestone.

Sản phẩm: `docs/02-srs.md`, GitHub Project board.

## Giai đoạn 2: Thiết kế UX/UI trên Figma (tuần 3–5, 1/12–21/12)

- User flow: đăng ký → kiểm tra trình độ → bài đầu tiên → ôn tập hằng ngày.
- Wireframe đen trắng cho màn hình chính.
- Design system: màu, font hỗ trợ cả tiếng Việt lẫn tiếng Nhật, khoảng cách, component.
- Thiết kế hoàn chỉnh và prototype bấm thử, bản điện thoại và máy tính.
- Cho 3–5 người dùng thử prototype, ghi vấn đề rồi sửa.

Sản phẩm: link Figma trong README, `docs/03-design.md`.

## Giai đoạn 3: Kiến trúc kỹ thuật (tuần 5–6, 15/12–28/12)

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend / CSDL | Supabase bản cloud (Postgres, đăng nhập, Row Level Security) |
| Thuật toán ôn tập | FSRS qua thư viện `ts-fsrs` |
| Dữ liệu | JMdict (từ điển), KANJIDIC2 (kanji), Tatoeba (câu ví dụ) |
| Test | Vitest (unit), Playwright (E2E, chỉ Chromium) |
| Deploy | Vercel, Sentry |

Sản phẩm: `docs/04-architecture.md` (sơ đồ hệ thống, ERD, API), `docs/adr/` (quyết định kiến trúc).

Bản quyền: JMdict và KANJIDIC dùng CC BY-SA, phải ghi nguồn. Không chép đề JLPT thật; câu hỏi luyện thi tự soạn.

## Giai đoạn 4: Dựng repo chuẩn (tuần 6, 22/12)

- README: giới thiệu, ảnh chụp, link demo, cách chạy, công nghệ, lộ trình.
- Nhánh: dự án cá nhân, commit và push thẳng lên `main`; nhánh `feature/...`, `fix/...`, `docs/...` chỉ cho việc dài hoặc thử nghiệm.
- Commit theo Conventional Commits, ví dụ `feat: add flashcard review`.
- Template issue và PR, `CONTRIBUTING.md`, `LICENSE`.
- GitHub Actions: lint, kiểm tra kiểu, test, build cho mỗi lần push lên `main`.

## Giai đoạn 5: Code MVP theo sprint (tuần 7–13, 29/12–15/2, có tuần nghỉ Tết)

| Sprint | Nội dung |
|---|---|
| 1 | Đăng nhập, khung giao diện, design system bằng code, nhập từ vựng N5–N3 |
| 2 | Kana, thẻ từ vựng ôn theo FSRS, kanji kèm âm Hán Việt |
| 3 | Trắc nghiệm, dashboard (chuỗi ngày, XP, đếm ngược ngày thi), giao diện điện thoại, PWA |

Cuối mỗi sprint: release note, tag phiên bản (`v0.1`, `v0.2`…), vài dòng tự đánh giá.

## Giai đoạn 6: Kiểm thử và chất lượng (song song, chốt tuần 14)

- Unit test cho logic quan trọng: lịch ôn FSRS, tính chuỗi ngày học.
- E2E cho luồng chính.
- Lighthouse và kiểm tra khả năng truy cập.

Sản phẩm: `docs/05-test-plan.md`

## Giai đoạn 7: Ra mắt và hồ sơ (tuần 15, đầu 3/2027)

- Deploy Vercel, tên miền, Sentry, thống kê truy cập.
- 10–20 người dùng beta, góp ý chuyển thành issue.
- Case study: vấn đề → nghiên cứu → thiết kế → kỹ thuật → kết quả → bài học.

## Sau MVP

Ngữ pháp, luyện nghe, đề thi thử tự soạn, bộ thẻ cộng đồng, giao diện đa ngôn ngữ.

## Ràng buộc máy làm việc (laptop)

- Ổ C còn khoảng 14 GB trống. Không cài Docker, không chạy Supabase trên máy; dùng Supabase cloud.
- Dùng `pnpm` để dùng chung gói giữa các nhánh; tối đa 2 bản checkout có `node_modules` cùng lúc.
- Luôn chừa ít nhất 5 GB trống.

## Nhà tuyển dụng sẽ nhìn

Link demo chạy được, README rõ ràng, lịch sử commit rõ ràng gắn với issue, CI xanh có test, tài liệu SRS, ADR và link Figma.
