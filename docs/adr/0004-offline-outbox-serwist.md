# ADR-0004: Offline bằng IndexedDB outbox và Serwist

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Người học (ví dụ Lan trên xe buýt) mất mạng giữa phiên. FR-26 đến FR-28 và FR-30 yêu cầu: báo mất mạng, giữ phiên và lượt ôn trên thiết bị, tự gửi lại, không trùng, không lẫn dữ liệu giữa tài khoản, xóa dữ liệu cá nhân khi đăng xuất. MVP không ôn offline hoàn toàn (`docs/02-srs.md` mục 8). Safari iOS không hỗ trợ Background Sync.

## Quyết định

- Vỏ ứng dụng (HTML/JS/CSS/font/biểu tượng) và trang công khai được precache bằng Serwist (`@serwist/turbopack`, vì Next.js 16 mặc định Turbopack và `@serwist/next` chỉ chạy với webpack; cập nhật 18/11/2026). Service worker phục vụ tại `/serwist/sw.js`, scope `/`.
- Service worker KHÔNG cache phản hồi API/Supabase hay dữ liệu cá nhân.
- Dữ liệu cá nhân (hàng đợi phiên, lượt ôn chưa gửi) chỉ nằm trong IndexedDB (qua `idb`), mỗi bản ghi gắn `user_id`.
- Lượt ôn ghi vào outbox trong IndexedDB. Outbox gửi lô qua `submit_reviews`, thành công thì xóa. Gửi lại với khoảng chờ tăng dần 1s, 2s, 4s… tối đa 60s.
- Kích hoạt gửi: sự kiện `online`, khi mở app, và bộ hẹn giờ. Không dùng Background Sync.
- Chỉ gửi bản ghi có `user_id` khớp phiên hiện tại.
- Đăng xuất và xóa tài khoản xóa IndexedDB; vẫn xóa Cache Storage cho chắc.

## Hệ quả

- Đăng xuất chỉ cần xóa IndexedDB là hết dữ liệu cá nhân trên máy. Dễ kiểm chứng (NFR-17, FR-30).
- Hoạt động giống nhau trên mọi trình duyệt ở mục 2.4 của SRS, gồm Safari iOS.
- Outbox chỉ gửi khi app đang mở (hoặc được mở lại). Đóng app khi chưa có mạng thì lượt ôn nằm lại, gửi ở lần mở sau (UC-05 3b).
- Lượt chưa gửi mà người dùng đăng xuất khi offline thì mất (chấp nhận, FR-30).
- Cần kiểm chứng `@serwist/next` với bundler của phiên bản Next.js sẽ dùng, và việc mở app offline khi phiên đăng nhập còn cục bộ (`docs/04-architecture.md` mục 17).

## Phương án đã cân nhắc

- **Background Sync API:** gửi được khi app đóng, nhưng Safari iOS không hỗ trợ nên không đủ cho mục tiêu tương thích (NFR-20).
- **Service worker cache cả phản hồi API:** có thể làm dữ liệu cá nhân nằm lại trong Cache Storage sau khi đăng xuất, khó kiểm soát. Bỏ.
- **Thư viện đồng bộ offline-first đầy đủ:** vượt phạm vi MVP, cần xử lý xung đột mà SRS đã đưa ra ngoài phạm vi.
