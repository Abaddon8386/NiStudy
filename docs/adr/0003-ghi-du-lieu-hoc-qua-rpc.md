# ADR-0003: Mọi ghi dữ liệu học đi qua RPC Postgres SECURITY DEFINER

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Dữ liệu học gồm `card_states`, `review_logs`, `quiz_attempts`, `daily_bonus`. Cần giữ các bất biến: một lượt ôn chỉ ghi một lần (NFR-19), `user_id` lấy từ phiên (FR-27), trạng thái thẻ theo lượt mới hơn, mốc +5 XP chỉ một lần mỗi ngày học (FR-23), từ chối lượt ôn bất hợp lý. XP, chuỗi và tổng ngày học phải khớp với log (NFR-15).

## Quyết định

- Ghi dữ liệu học chỉ qua RPC: `submit_reviews` và `submit_quiz`. Mỗi RPC chạy trong một transaction.
- RPC là `SECURITY DEFINER`, `set search_path = ''`, từ chối khi `auth.uid()` null, chỉ `grant execute` cho `authenticated`. `user_id` lấy từ `auth.uid()`, không nhận từ tham số.
- `revoke` INSERT/UPDATE/DELETE của `authenticated` trên bốn bảng này. Chỉ giữ SELECT theo `user_id = auth.uid()`.
- Idempotent theo (`user_id`, `review_id`) bằng `ON CONFLICT DO NOTHING`; `submit_quiz` idempotent theo (`user_id`, `quiz_id`).
- XP, chuỗi, tổng ngày học không lưu cột riêng. Tính khi đọc từ `review_logs`, `quiz_attempts`, `daily_bonus` (qua `get_dashboard`).

## Hệ quả

- Mọi bất biến nằm một chỗ, trong SQL, và test được bằng test tích hợp với hai tài khoản.
- Gửi lại nhiều lần an toàn, đúng nhu cầu outbox offline (ADR-0004).
- Không có số XP/chuỗi lưu sẵn để lệch với log. Đổi lại, mỗi lần đọc phải tính; với dữ liệu một người dùng MVP chi phí nhỏ. Có index (`user_id`, `study_date`).
- Phải viết và bảo trì SQL cẩn thận. RPC `SECURITY DEFINER` chạy với quyền chủ hàm nên mọi kiểm tra phải nằm trong hàm.

## Phương án đã cân nhắc

- **Ghi bảng trực tiếp với RLS:** RLS kiểm được `user_id` nhưng không giữ được bất biến nhiều bảng (ví dụ cập nhật `card_states` chỉ khi lượt mới hơn, tạo `daily_bonus` đúng lúc, kiểm tra lô). Client có thể ghi lệch giữa các bảng. Bỏ.
- **Supabase Edge Function:** làm được, nhưng thêm một thành phần để triển khai và theo dõi, trong khi RPC đã đủ và gần dữ liệu hơn. Bỏ.
- **Route Handler trên Vercel làm trung gian:** thêm một bước mạng và cần service role cho việc không cần quyền đó. Bỏ.
