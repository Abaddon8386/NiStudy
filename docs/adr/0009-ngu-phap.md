# ADR-0009: Ngữ pháp: nội dung tự soạn trong repo, lưu CSDL, một thẻ FSRS cho mỗi điểm

Trạng thái: Đã chấp nhận, 28/11/2026

## Bối cảnh

Giai đoạn D (`docs/00-plan.md`) thêm ngữ pháp N5 rồi N4: bài giải thích tiếng Việt, mẫu câu, ví dụ, bài tập, và đưa vào lịch ôn FSRS (FR-31..FR-35 trong `docs/02-srs.md`). Điểm mở số 12 của `docs/04-architecture.md` mục 17 hỏi: nội dung nằm trong CSDL hay file tĩnh, và ghi trạng thái nháp/đã duyệt thế nào.

Ràng buộc:
- FSRS cần dòng `cards` vì `card_states` có khóa ngoại tới `cards` (ADR-0002, ADR-0003).
- Bản nháp phải hiện trên dev nhưng không lên prod, như từ vựng và kanji (ADR-0005).
- Không chép giáo trình có bản quyền (Minna no Nihongo...) hay đề JLPT thật.

## Quyết định

**Nguồn nội dung.** Mỗi điểm ngữ pháp là một file JSON tự soạn tại `data/vi/grammar/<level>/<NN>-<slug>.json`. Giấy phép CC BY-SA 4.0 như phần `data/` khác (`data/LICENSE.md`). Ví dụ và bài tập tự soạn, chỉ dùng từ vựng trong danh sách N5 (N4 ở đợt sau). Trường `trang_thai` là `nhap` hoặc `duyet`; bản nháp chỉ bật trên dev, giống từ vựng và kanji.

**Định dạng file:**

```json
{
  "id": "...", "level": "N5", "order": 1,
  "title": "...", "pattern": "...", "meaning_vi": "...",
  "explanation": [{ "heading": "...", "body": "..." }],
  "notes": ["..."],
  "examples": [{ "ja": "...", "ruby": "...", "vi": "..." }],
  "exercises": [{ "type": "cloze", "prompt_ja": "...＿＿...", "answer": "...", "choices": ["", "", "", ""], "vi": "..." }],
  "trang_thai": "nhap",
  "nguoi_bien_soan": "..."
}
```

- `heading` trong `explanation` là tùy chọn.
- `ruby` dùng cú pháp `漢字[かな]` để hiện furigana.
- `prompt_ja` có `＿＿` đánh dấu chỗ trống; `choices` có đúng 4 mục, gồm `answer`.

**Lưu trữ lúc chạy.** Pipeline `scripts/data/` build ra `data/build/grammar_details.json` và thêm vào `cards.json` loại thẻ mới `kind = 'grammar'`, `card_id = grammar:<id>`. Import vào bảng `grammar_details`:

| Cột | Ghi chú |
|---|---|
| `card_id` | PK, FK tới `cards` |
| `point_id` | unique |
| `level`, `sort` | |
| `title`, `pattern`, `meaning_vi` | |
| `explanation`, `notes`, `examples`, `exercises` | jsonb |

RLS: `SELECT` cho `anon` và `authenticated`; chỉ `service_role` ghi. Chọn CSDL thay vì trang tĩnh vì thẻ FSRS cần dòng `cards`, và dev phải hiện được bản nháp như từ vựng.

**Đơn vị ôn.** MỘT thẻ FSRS cho mỗi điểm ngữ pháp, không phải mỗi câu bài tập. Mỗi lần ôn hiển thị một câu điền chỗ trống chọn ngẫu nhiên từ kho bài tập của điểm đó, để tránh học thuộc một câu. Người học tự chấm 4 mức như thẻ khác (không gõ đáp án). Thẻ mới lần đầu hiện bài học ngắn (mẫu câu, nghĩa, một ví dụ) trước câu bài tập.

**Thứ tự thẻ mới (sửa FR-13).** Sau 46 hiragana cơ bản, lặp vòng 1 kana : 1 kanji : 2 từ vựng : 1 ngữ pháp. Đã biết kana: 1 kanji : 2 từ vựng : 1 ngữ pháp. Loại nào hết thì bỏ qua. Ngữ pháp lấy theo `level` của người học và `sort`.

**Bài học.**
- `/ngu-phap`: danh sách theo cấp, trạng thái đã học/chưa học lấy từ `card_states`.
- `/ngu-phap/[id]`: giải thích, mẫu câu, ví dụ có furigana và nút phát âm (ADR-0008), phần luyện tập chọn đáp án.
- Luyện tập trong trang bài học KHÔNG vào FSRS và không cộng XP ở lượt này.
- Trang đọc từ CSDL lúc chạy nên cần mạng ở bản này.

## Hệ quả

- Thêm 1 bảng (`grammar_details`), mở rộng `cards.kind`, `card_payload` và `get_today_queue` thêm loại `grammar`; `queue.ts` đổi vòng xen kẽ.
- Nội dung là khối soạn lớn nhất của dự án và chờ tác giả duyệt; prod chỉ hiện nội dung `duyet`.
- Bài học (`/ngu-phap`) cần mạng ở bản này.
- Mỗi thẻ ngữ pháp chỉ có một trạng thái FSRS, nên kho bài tập mỗi điểm càng nhiều càng ít lặp.

- Mỗi điểm phải có tối thiểu 4 câu bài tập; `scripts/data/check.mjs` kiểm và báo lỗi nếu thiếu.
- Không đặt ngưỡng số điểm ngữ pháp trước khi lên prod. Mỗi điểm được bật trên prod riêng lẻ khi tác giả duyệt (`published` theo từng thẻ). Danh sách `/ngu-phap` chỉ hiện điểm đã duyệt.
- Bài tập gõ đáp án để sau.

## Phương án đã cân nhắc

- Trang tĩnh build từ repo: không hiện được bản nháp trên dev và không có dòng `cards` cho FSRS.
- Mỗi câu bài tập một thẻ FSRS: khối lượng ôn phình ra và người học dễ học thuộc từng câu.
- Bài tập gõ đáp án: khó trên điện thoại, chấm đáp án qua IME phức tạp; để sau.
