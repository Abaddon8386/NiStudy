# Đóng góp cho Nihongo

Tài liệu này mô tả cách làm việc trong repo. Dự án đang ở giai đoạn 0, CI sẽ có sau.

## 1. Quy trình

Đây là dự án cá nhân, một người làm. Commit và push thẳng lên `main`, không bắt buộc PR.

1. Mỗi việc tính năng hoặc sửa lỗi bắt đầu từ một issue. Việc tài liệu nhỏ có thể không cần issue.
2. Commit lên `main`. Commit liên quan issue thì ghi `Closes #<số>` hoặc `Refs #<số>` trong phần thân commit.
3. Việc dài hoặc thử nghiệm thì làm trên nhánh riêng, xong đưa vào `main` bằng fast-forward.
4. Trước khi push: tự đọc lại diff, chạy kiểm tra liên quan.

## 2. Đặt tên nhánh

- `feature/<so-issue>-<mo-ta>`
- `fix/<so-issue>-<mo-ta>`
- `docs/<mo-ta>`

Dùng kebab-case, không dấu. Ví dụ: `feature/12-flashcard-review`.

## 3. Commit

Theo [Conventional Commits](https://www.conventionalcommits.org/). Dạng: `type(scope): description`. Scope là tùy chọn. Phần mô tả viết tiếng Anh, chữ thường, thể mệnh lệnh.

| Type | Nghĩa |
|---|---|
| `feat` | Thêm tính năng |
| `fix` | Sửa lỗi |
| `docs` | Chỉ đổi tài liệu |
| `style` | Định dạng, không đổi hành vi |
| `refactor` | Sửa cấu trúc mã, không đổi hành vi |
| `test` | Thêm hoặc sửa test |
| `chore` | Việc lặt vặt, không ảnh hưởng mã chạy |
| `ci` | Đổi cấu hình CI |
| `build` | Đổi hệ thống build hoặc phụ thuộc |
| `perf` | Cải thiện hiệu năng |

Ví dụ: `feat(review): schedule cards with FSRS`.

Thay đổi phá vỡ tương thích thì thêm `!` sau type hoặc scope, ví dụ `feat(api)!: rename review endpoint`.

Mỗi commit một ý.

## 4. Pull request (không bắt buộc)

Chỉ dùng khi muốn tách một thay đổi lớn để tự soát lại.

- Một PR một mục tiêu, nhỏ.
- Điền template PR.
- Mô tả kiểm thử thật đã chạy.
- Đổi giao diện thì đính kèm ảnh chụp điện thoại và máy tính.
- Tự đọc lại diff trước khi yêu cầu review.

## 5. Môi trường

- Dùng `pnpm`.
- Khóa và mật khẩu chỉ để trong `.env.local` (đã ignore). Không commit.
- Supabase dùng bản cloud.
- Lệnh cài, chạy, test: sẽ bổ sung khi dựng khung Next.js và CI.

## 6. Tiêu chuẩn giao diện

- Chữ thân 16px. Chữ phụ tối thiểu 14px.
- Vùng bấm tối thiểu 44×44px.
- Hiển thị đúng tiếng Việt và tiếng Nhật.
- Mục tiêu WCAG 2.1 AA.
- Kiểm tra trên điện thoại.

## 7. Kiểm thử

- Logic quan trọng (lịch ôn FSRS, chuỗi ngày) phải có unit test bằng Vitest.
- Luồng chính có E2E bằng Playwright (Chromium).

## 8. Dữ liệu và bản quyền

- Thêm dữ liệu từ JMdict, KANJIDIC hoặc Tatoeba phải giữ ghi nguồn.
- Không thêm dữ liệu không rõ giấy phép.
- Không chép đề JLPT thật.

## 9. Báo lỗi và đề xuất

Dùng template issue: User story, Báo lỗi, Việc kỹ thuật / tài liệu.
