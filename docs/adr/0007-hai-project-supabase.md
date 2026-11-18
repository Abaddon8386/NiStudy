# ADR-0007: Hai project Supabase (dev, prod), migration bằng Supabase CLI

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Cần nơi phát triển và chạy test (gồm test ghi dữ liệu, E2E, tài khoản test) tách khỏi dữ liệu người dùng thật. Ràng buộc: không Docker, không chạy Supabase trên máy (ổ đĩa còn ít). Lược đồ CSDL (bảng, RLS, RPC, trigger) phải có lịch sử và tái lập được.

## Quyết định

- Hai project Supabase cloud: `nihongo-dev` (phát triển, test tích hợp, E2E, tài khoản test) và `nihongo-prod` (người dùng thật).
- Không Docker, không Supabase local.
- Lược đồ viết thành file SQL trong `supabase/migrations/` và commit vào git.
- Áp dụng bằng Supabase CLI: `supabase link` để trỏ tới project, `supabase db push` để chạy migration. Thứ tự: dev trước, kiểm thử, rồi prod.
- Biến môi trường tách theo môi trường: Vercel Production trỏ `nihongo-prod`; Preview/Development và CI trỏ `nihongo-dev`. Khóa lưu ở `.env.local` và biến môi trường của Vercel/GitHub Actions, không trong repo.

## Hệ quả

- Test ghi dữ liệu và xóa tài khoản không chạm dữ liệu thật.
- Lược đồ có lịch sử trong git, dựng lại được trên project mới.
- Không thử được CSDL khi offline hoàn toàn và không có sandbox riêng cho từng nhánh. Hai test chạy cùng lúc trên `nihongo-dev` có thể đụng nhau; test dùng tài khoản test riêng và dữ liệu có tiền tố để dọn.
- Phải cẩn thận không `db push` nhầm vào prod: kiểm tra project đang `link` trước khi chạy.
- Hai project gói miễn phí có giới hạn của nhà cung cấp; cần kiểm khi tới giai đoạn 7.

## Phương án đã cân nhắc

- **Một project dùng chung:** rủi ro làm hỏng hoặc lẫn dữ liệu thật khi test. Bỏ.
- **Supabase local bằng Docker:** loại theo ràng buộc ổ đĩa và quyết định không cài Docker.
- **Sửa lược đồ bằng giao diện web, không migration:** không tái lập được, không có lịch sử, dễ lệch giữa dev và prod.
