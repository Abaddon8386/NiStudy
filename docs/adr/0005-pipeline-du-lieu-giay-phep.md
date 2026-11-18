# ADR-0005: Pipeline dữ liệu nội dung và giấy phép

Trạng thái: Đã chấp nhận, 18/11/2026

## Bối cảnh

Nội dung thẻ lấy từ KANJIDIC2 và JMdict (EDRDG, CC BY-SA) và danh sách tanos.co.uk (CC BY theo nguồn thứ cấp, chưa đọc được trang gốc). JMdict không có tiếng Việt nên nghĩa tiếng Việt tự biên soạn. Mã nguồn dùng MIT. Phải ghi nguồn (FR-29, NFR-23) và không để dữ liệu không rõ giấy phép trong repo. Xem `docs/01-vision.md` mục 10.

## Quyết định

- Bản tải gốc để trong `data/raw/`, ignore, không commit.
- Script TypeScript trong `scripts/data/` lọc N5–N4, ghép nghĩa tiếng Việt từ `data/vi/vocab.csv` và `data/vi/kanji.csv`, rồi xuất `data/build/*.json`.
- Dữ liệu dẫn xuất (`data/build/`, `data/vi/`) được commit, theo CC BY-SA. `data/LICENSE.md` ghi nguồn, giấy phép, ngày tải. Giấy phép này tách khỏi MIT của mã nguồn.
- Script import upsert vào Supabase bằng service role, chạy tay trên máy của chủ dự án.
- Thẻ chưa có nghĩa tiếng Việt thì `published = false`, chưa vào hàng đợi thẻ mới. Nghĩa biên soạn dần theo sprint.
- Nguồn hiển thị ở trang FR-29 lấy từ bảng `data_sources`.

## Hệ quả

- Kết quả dữ liệu tái lập được và xem được trong diff của git.
- Nghĩa tự biên soạn nằm trong repo, có người biên soạn và ghi chú, dễ sửa.
- Repo có hai giấy phép (MIT cho code, CC BY-SA cho dữ liệu dẫn xuất). Phải ghi rõ trong README và `data/LICENSE.md`.
- Nhập dữ liệu là việc chạy tay. Quên chạy thì CSDL cũ hơn repo; cần ghi vào quy trình ra mắt.
- Độ phủ âm Hán Việt của KANJIDIC2 cho N5–N4 chưa đo; kanji thiếu bổ sung tay với `han_viet_source = 'manual'`.

## Phương án đã cân nhắc

- **Commit bản gốc JMdict/KANJIDIC2:** file lớn, tốn ổ đĩa và không cần vì tải lại được.
- **Tải và lọc lúc chạy (trên Vercel hoặc khi build):** chậm, phụ thuộc mạng và nguồn ngoài, khó kiểm giấy phép.
- **Lấy nghĩa tiếng Việt từ ứng dụng hoặc trang khác:** giấy phép không rõ, bị loại ở quyết định giai đoạn 0.
