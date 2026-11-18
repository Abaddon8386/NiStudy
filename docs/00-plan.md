# Kế hoạch dự án Nihongo

Web học tiếng Nhật cho người Việt: học kanji qua âm Hán Việt, ôn tập theo thuật toán lặp lại ngắt quãng (FSRS), bám lộ trình JLPT và có cơ chế giữ động lực.

- Bắt đầu: 17/11/2026
- Giả định: một người làm, 10–15 giờ mỗi tuần, khoảng 16 tuần ra MVP (đã cộng 1 tuần nghỉ Tết, khoảng 6/2/2027, và 1 tuần lùi vì kỳ thi JLPT).
- Mục tiêu MVP: đầu tháng 3/2027 (khoảng 9/3). Phạm vi MVP: JLPT N5–N4.
- Tài liệu này là bản gốc của kế hoạch. Đổi kế hoạch thì sửa file này bằng một commit riêng.
- Ngày tháng trong các giai đoạn là mốc muộn nhất, không phải lịch cố định. Xong giai đoạn nào thì chuyển ngay sang giai đoạn sau.

## Quyết định định hướng (17/11/2026)

- Vị trí nhắm tới: **fullstack**. Đầu tư sâu vào schema Postgres, Row Level Security, luồng dữ liệu JMdict/KANJIDIC và logic FSRS, bên cạnh giao diện.
- Đã biết: HTML/CSS/JavaScript, SQL/Postgres/Supabase. Chưa biết React, TypeScript, Next.js: dành thời gian học ở giai đoạn 3–4, trước sprint 1.
- Thời gian: 10–15 giờ mỗi tuần, đúng giả định ở trên.
- Thi JLPT N4/N5 ngày 6/12/2026: tuần 24/11–6/12 giảm tải dự án, ôn bằng bản demo HTML đã có. Giai đoạn 1–4 lùi một tuần; mốc MVP giữ nhờ thu hẹp phạm vi còn N5–N4.
- Các quyết định sản phẩm khác (nguồn dữ liệu, PWA, dữ liệu người dùng, chỉ số, giấy phép): xem `docs/01-vision.md` mục 10.

## Việc nhẹ trong tuần thi (24/11–6/12)

- Kiểm chứng đối thủ, nhất là Mazii; ghi ngày kiểm tra vào `docs/01-vision.md`.
- Đọc tài liệu định dạng JMdict/KANJIDIC2.
- Đã xong 17/11: xác nhận âm Hán Việt trong KANJIDIC2 và giấy phép danh sách tanos (xem `docs/01-vision.md` mục 10).

## Giai đoạn 0: Định hướng (tuần 1, 17/11)

- Tầm nhìn: vấn đề, người dùng mục tiêu, giá trị cốt lõi.
- 2–3 persona. Ví dụ: sinh viên ôn N3 đang mất động lực; người đi làm mỗi ngày chỉ có 15 phút.
- Phân tích đối thủ: Anki, Duolingo, Mazii, WaniKani, Bunpro (mạnh gì, yếu gì, mình khác ở đâu).
- Điểm khác biệt: dành cho người Việt, kanji qua âm Hán Việt, bám JLPT, cơ chế giữ động lực.
- Phạm vi MVP: làm ngay và để sau.

Sản phẩm: `docs/01-vision.md`

## Giai đoạn 1: Yêu cầu và SRS (tuần 3–4, 1/12–14/12; tuần 1/12–6/12 làm nhẹ)

- SRS theo khung IEEE 830 / ISO 29148: mục đích, phạm vi, thuật ngữ.
- Yêu cầu chức năng mã `FR-01`, `FR-02`… Ví dụ: "FR-05: Hệ thống lên lịch ôn thẻ theo FSRS".
- Yêu cầu phi chức năng: tải trang dưới 2 giây, bảo mật, WCAG AA, dùng tốt trên điện thoại.
- Use case, ràng buộc, giả định.
- User story kèm tiêu chí chấp nhận: "Là người học N4, tôi muốn… để…".
- Backlog trên GitHub Projects: mỗi story một issue, có nhãn và milestone.

Sản phẩm: `docs/02-srs.md`, GitHub Project board.

## Giai đoạn 2: Thiết kế UX/UI trên Figma (tuần 4–6, 8/12–28/12)

- User flow: đăng ký → chọn cấp bắt đầu (N5/N4, đã biết kana chưa) → bài đầu tiên → ôn tập hằng ngày.
- Wireframe đen trắng cho màn hình chính.
- Design system: màu, font hỗ trợ cả tiếng Việt lẫn tiếng Nhật, khoảng cách, component.
- Thiết kế hoàn chỉnh và prototype bấm thử, bản điện thoại và máy tính.
- Cho 3–5 người dùng thử prototype, ghi vấn đề rồi sửa.

Sản phẩm: link Figma trong README, `docs/03-design.md`.

## Giai đoạn 3: Kiến trúc kỹ thuật (tuần 6–7, 22/12–4/1)

| Phần | Công nghệ |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind |
| Backend / CSDL | Supabase bản cloud (Postgres, đăng nhập, Row Level Security) |
| Thuật toán ôn tập | FSRS qua thư viện `ts-fsrs` |
| Dữ liệu | JMdict (từ điển), KANJIDIC2 (kanji), Tatoeba (câu ví dụ) |
| Test | Vitest (unit), Playwright (E2E, chỉ Chromium) |
| Deploy | Vercel, Sentry |

Sản phẩm: `docs/04-architecture.md` (sơ đồ hệ thống, ERD, API), `docs/adr/` (quyết định kiến trúc).

Dữ liệu: đã đo độ phủ âm Hán Việt của KANJIDIC2 cho kanji N5–N4 ngày 18/11/2026: 245/245 chữ có âm (xem `docs/04-architecture.md` mục 11); âm chính chọn tay. JMdict không có nghĩa tiếng Việt, nên lên kế hoạch biên soạn nghĩa tiếng Việt theo sprint.

Bản quyền: JMdict và KANJIDIC dùng CC BY-SA, Tatoeba dùng CC BY, phải ghi nguồn. Không chép đề JLPT thật; câu hỏi luyện thi tự soạn.

## Giai đoạn 4: Dựng repo chuẩn (tuần 7, 29/12)

- README: giới thiệu, ảnh chụp, link demo, cách chạy, công nghệ, lộ trình.
- Nhánh: dự án cá nhân, commit và push thẳng lên `main`; nhánh `feature/...`, `fix/...`, `docs/...` chỉ cho việc dài hoặc thử nghiệm.
- Commit theo Conventional Commits, ví dụ `feat: add flashcard review`.
- Template issue và PR, `CONTRIBUTING.md`, `LICENSE`.
- GitHub Actions: lint, kiểm tra kiểu, test, build cho mỗi lần push lên `main`.

## Giai đoạn 5: Code MVP theo sprint (tuần 8–14, 5/1–22/2, có tuần nghỉ Tết)

| Sprint | Nội dung |
|---|---|
| 1 | Đăng nhập, khung giao diện, design system bằng code, chọn cấp bắt đầu, nhập từ vựng N5–N4 kèm nghĩa tiếng Việt |
| 2 | Kana, thẻ từ vựng ôn theo FSRS, kanji N5–N4 kèm âm Hán Việt |
| 3 | Trắc nghiệm, dashboard (chuỗi ngày, XP, đếm ngược ngày thi), giao diện điện thoại, PWA cài được, xóa tài khoản |

Cuối mỗi sprint: release note, tag phiên bản (`v0.1`, `v0.2`…), vài dòng tự đánh giá.

## Giai đoạn 6: Kiểm thử và chất lượng (song song, chốt tuần 15)

- Unit test cho logic quan trọng: lịch ôn FSRS, tính chuỗi ngày học.
- E2E cho luồng chính.
- Lighthouse và kiểm tra khả năng truy cập.

Sản phẩm: `docs/05-test-plan.md`

## Giai đoạn 7: Ra mắt và hồ sơ (tuần 16, khoảng 9/3/2027)

- Chốt tên sản phẩm; chuyển repo sang public.
- Deploy Vercel, tên miền, Sentry, thống kê truy cập không dùng cookie theo dõi.
- 10–20 người dùng beta, góp ý chuyển thành issue.
- Case study: vấn đề → nghiên cứu → thiết kế → kỹ thuật → kết quả → bài học.

## Sau MVP

Từ vựng và kanji N3, ôn offline hoàn toàn, ngữ pháp, luyện nghe, đề thi thử tự soạn, bộ thẻ cộng đồng, giao diện đa ngôn ngữ.

## Ràng buộc máy làm việc (laptop)

- Ổ C còn khoảng 14 GB trống. Không cài Docker, không chạy Supabase trên máy; dùng Supabase cloud.
- Dùng `pnpm` để dùng chung gói giữa các nhánh; tối đa 2 bản checkout có `node_modules` cùng lúc.
- Luôn chừa ít nhất 5 GB trống.

## Nhà tuyển dụng sẽ nhìn

Link demo chạy được, README rõ ràng, lịch sử commit rõ ràng gắn với issue, CI xanh có test, tài liệu SRS, ADR và link Figma.
