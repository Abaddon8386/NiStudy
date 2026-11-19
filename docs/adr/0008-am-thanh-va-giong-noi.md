# ADR-0008: Âm thanh và giọng nói bằng `speechSynthesis` và MediaRecorder cục bộ

Trạng thái: Đã chấp nhận, 19/11/2026

## Bối cảnh

Tác giả muốn app học được nghe và nói, không chỉ thẻ kana/kanji (`docs/01-vision.md` mục 10, quyết định 13, 15). Cần: phát âm tiếng Nhật trên thẻ và câu ví dụ (giai đoạn C), nghe hội thoại (F), shadowing (G). Ràng buộc: app miễn phí, một người làm, không thêm khoản chi phí, không gửi dữ liệu người học ra ngoài (NFR-15 về dữ liệu lưu; `docs/02-srs.md` mục 4.5). Yêu cầu dự kiến: `docs/02-srs.md` mục 10.

## Quyết định

- Phát âm tiếng Nhật bằng Web Speech API `speechSynthesis`, dùng giọng `ja-JP` có sẵn của hệ điều hành. Chạy hoàn toàn trên thiết bị.
- Nếu thiết bị không có giọng `ja-JP`, ẩn nút phát âm và báo rõ cho người học.
- Shadowing (giai đoạn G): người học nghe mẫu bằng TTS, ghi âm bằng MediaRecorder, nghe lại. Bản ghi chỉ lưu cục bộ trên thiết bị, không tải lên máy chủ. Hệ thống chỉ xin quyền micro khi người học bấm ghi.
- Chưa làm: nhận dạng giọng nói và hội thoại với AI. Cần quyết định riêng (xem dưới).

## Hệ quả

- Miễn phí, không có dữ liệu âm thanh hay văn bản phát âm đi qua máy chủ của dự án; không cần lưu trữ file audio.
- Chất lượng và giọng đọc phụ thuộc hệ điều hành và trình duyệt. Hai người học có thể nghe hai giọng khác nhau; chất lượng có thể không đều, nhất là với ngữ điệu (pitch accent). Chưa có số liệu.
- Safari/iOS khác biệt: API có thể hạn chế hơn (ví dụ cần thao tác bấm của người dùng mới phát, danh sách giọng nạp chậm). Chưa kiểm chứng trên máy thật.
- Cần kiểm giọng `ja-JP` có sẵn trên Windows, Android, iOS; ghi vào `docs/04-architecture.md` mục 17.
- MediaRecorder cần quyền micro và HTTPS. Định dạng ghi (webm/mp4) khác nhau giữa trình duyệt. Người học từ chối quyền thì tính năng ghi âm bị tắt, phần nghe mẫu vẫn dùng được.
- Bản ghi cục bộ là dữ liệu người dùng trên thiết bị: đăng xuất và xóa tài khoản phải xóa luôn, nhất quán với `docs/02-srs.md` mục 9 điểm 8. Nếu lưu trong IndexedDB cần tính dung lượng.
- Cần dự phòng khi `speechSynthesis` không có: toàn bộ bài học phải dùng được không cần âm thanh, nút phát âm chỉ là bổ sung.

## Phương án đã cân nhắc

- **File audio thu sẵn (người thật):** chất lượng tốt nhất nhưng cần nguồn có giấy phép phù hợp hoặc tự thu, và dung lượng lưu trữ/phân phối. Vượt sức một người và ổ đĩa hạn chế. Hoãn; có thể xem lại cho một phần nội dung quan trọng.
- **TTS phía máy chủ (dịch vụ đám mây):** giọng ổn định hơn giữa các thiết bị nhưng phát sinh chi phí, cần khóa phía máy chủ và gửi văn bản ra ngoài. Hoãn đến khi có quyết định về chi phí.
- **Nhận dạng giọng nói của trình duyệt (Web Speech API `SpeechRecognition`):** cho phép chấm phát âm. Theo quyết định ngày 19/11/2026, Chrome gửi âm thanh lên Google để nhận dạng, trái với nguyên tắc không gửi dữ liệu; chất lượng với tiếng Nhật của người học chưa kiểm chứng. Hoãn, cần quyết định riêng về quyền riêng tư.
- **Hội thoại với AI:** hấp dẫn cho kaiwa nhưng cần API trả phí, khóa phía máy chủ, kiểm soát chi phí và nội dung. Hoãn, cần quyết định riêng về chi phí và quyền riêng tư.
