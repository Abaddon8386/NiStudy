# ADR-0006: Xóa tài khoản qua Route Handler dùng service role

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

FR-05: xóa tài khoản sau một bước xác nhận có nhập lại mật khẩu; xóa chạy phía máy chủ; xóa toàn bộ dữ liệu, không để trạng thái nửa chừng; thu hồi mọi phiên. Xóa một người dùng Supabase Auth cần khóa service role, khóa này không được lộ ra trình duyệt (NFR-13).

## Quyết định

`POST /api/account/delete` là Route Handler chạy trên Vercel:

1. Nhận mật khẩu trong body.
2. Lấy người dùng từ phiên cookie.
3. Xác minh lại mật khẩu bằng `signInWithPassword` với client anon. Giới hạn tần suất của Supabase Auth áp dụng.
4. Gọi `auth.admin.deleteUser(uid)` bằng service role.
5. Khóa ngoại `on delete cascade` từ `auth.users` xóa toàn bộ dữ liệu người dùng.
6. Trả kết quả; client xóa IndexedDB và Cache Storage rồi đăng xuất.

Khóa service role chỉ nằm trong biến môi trường máy chủ của Vercel (`SUPABASE_SERVICE_ROLE_KEY`), không có tiền tố `NEXT_PUBLIC_`.

## Hệ quả

- Xóa một lần và nguyên tử ở tầng CSDL; không có trạng thái xóa nửa chừng.
- Xác minh lại mật khẩu chặn trường hợp ai đó dùng máy đang đăng nhập để xóa.
- Refresh token bị thu hồi. JWT truy cập đã cấp còn hạn đến khi hết hạn (mặc định 1 giờ) nhưng không còn dữ liệu nào để đọc.
- Bản sao lưu của Supabase còn giữ dữ liệu đến khi hết hạn theo nhà cung cấp (NFR-17). Phải ghi rõ trong chính sách riêng tư.
- Nếu lỗi giữa chừng, handler trả lỗi và không báo "đã xóa" (UC-06 4a).
- Đây là nơi dùng service role duy nhất trên đường người dùng; cần theo dõi bằng CI quét gói build (NFR-13).

## Phương án đã cân nhắc

- **RPC `SECURITY DEFINER` xóa dòng trong `auth.users`:** cần cấp quyền vào schema `auth`, phức tạp và rủi ro hơn. Việc xóa người dùng thuộc API quản trị của Auth.
- **Chỉ xóa dữ liệu, giữ tài khoản:** không đáp ứng FR-05 (phải xóa cả email).
- **Edge Function:** thêm thành phần triển khai, trong khi Route Handler đã có sẵn trong app.
- **Không xác minh lại mật khẩu:** trái FR-05.
