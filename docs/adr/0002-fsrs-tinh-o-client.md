# ADR-0002: FSRS tính ở client bằng ts-fsrs, máy chủ lưu trạng thái

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Người học chấm thẻ liên tục, có thể mất mạng giữa phiên. NFR-03 yêu cầu từ lúc chấm đến lúc hiện thẻ kế tiếp ≤ 200 ms, không chờ mạng. FR-15 yêu cầu lịch FSRS tính ở thiết bị.

## Quyết định

- Client tính trạng thái FSRS mới bằng `ts-fsrs` (tham số mặc định) ngay khi chấm, qua `src/lib/domain/fsrs.ts`.
- Ghim phiên bản `ts-fsrs` chính xác, không dùng khoảng phiên bản.
- Client gửi trạng thái trước và sau kèm lượt ôn. Máy chủ lưu `state_after` vào `card_states` và tin trạng thái client gửi (không tính lại).
- Khi cùng thẻ có lượt từ hai thiết bị, trạng thái thẻ theo lượt có `reviewed_at` mới hơn (FR-27).

## Hệ quả

- Chấm thẻ phản hồi tức thì, chạy được khi offline.
- Logic FSRS chỉ có một bản (TypeScript), test bằng Vitest (NFR-21).
- Người dùng sửa được lịch của chính mình. Chấp nhận: không ảnh hưởng người khác, không có bảng xếp hạng.
- Đổi phiên bản `ts-fsrs` có thể đổi kết quả lên lịch. Mỗi lần nâng cấp là một thay đổi có chủ ý, kèm test.
- Máy chủ không phát hiện được trạng thái vô lý ngoài các kiểm tra cơ bản.

## Phương án đã cân nhắc

- **Tính FSRS trên máy chủ (RPC hoặc Route Handler):** cần mạng cho mỗi lần chấm, không đạt NFR-03 và không chạy được khi offline. Cũng cần bản FSRS thứ hai bằng SQL hoặc chạy TypeScript trên máy chủ.
- **Tính ở cả hai nơi và đối chiếu:** thêm độ phức tạp, không cần vì không có bảng xếp hạng.
