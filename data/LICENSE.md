# Giấy phép dữ liệu

Giấy phép MIT của mã nguồn KHÔNG áp dụng cho thư mục `data/`.

## Nguồn

| Nguồn | Tác giả | Giấy phép | Phiên bản / ngày tải | Dùng cho |
|---|---|---|---|---|
| KANJIDIC2 | Electronic Dictionary Research and Development Group (EDRDG), https://www.edrdg.org/edrdg/licence.html | CC BY-SA 4.0 | database_version 2026-322, tải 18/11/2026 | Âm Hán Việt, âm on/kun, nghĩa tiếng Anh làm gốc dịch |
| JMdict_e (JMdict bản tiếng Anh) | Electronic Dictionary Research and Development Group (EDRDG), https://www.edrdg.org/jmdict/j_jmdict.html, tải từ http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz | CC BY-SA 4.0 | `JMdict created: 2026-11-18`, tải 18/11/2026 | Mã mục (`jmdict_seq`), cách đọc, nghĩa tiếng Anh làm gốc dịch |
| Danh sách kanji JLPT N5, N4 | Jonathan Waller, tanos.co.uk; lấy qua mirror https://github.com/Bluskyo/JLPT_Vocabulary commit d29a678 | CC BY (theo nguồn thứ cấp, chưa đọc được trang gốc) | tải 18/11/2026 | Cấp JLPT của kanji |
| Danh sách từ vựng JLPT N5, N4 | Jonathan Waller, tanos.co.uk; lấy qua mirror https://github.com/Bluskyo/JLPT_Vocabulary commit d29a678 (`data/vocab/parseNoCleanup/n5_vocab.csv`, `n4_vocab.csv`) | CC BY (theo nguồn thứ cấp, chưa đọc được trang gốc) | tải 18/11/2026 | Cấp JLPT và thứ tự của từ vựng |

## Dữ liệu dẫn xuất

- `data/build/*.json` do `scripts/data/build.mjs` sinh ra từ các nguồn trên và `data/vi/`.
- Bảng kana (`kana_details.json`) do dự án tự lập (chữ cái, romaji Hepburn), không lấy từ nguồn nào ở trên.

## Dữ liệu tự biên soạn

`data/vi/` gồm âm Hán Việt chính chọn trong các âm của KANJIDIC2, nghĩa tiếng Việt và ghi chú.

- Nghĩa tiếng Việt là bản dịch phái sinh từ nghĩa tiếng Anh trong JMdict và KANJIDIC2 (cả hai CC BY-SA 4.0), nên phần này phát hành theo CC BY-SA 4.0.
- Cột `trang_thai` cho biết mức duyệt: `nhap` là bản nháp soạn tự động, CHƯA được tác giả duyệt, chưa được hiển thị cho người học (thẻ `published = false`); `duyet` là đã được tác giả duyệt. Ngày 18/11/2026: toàn bộ nghĩa của 245 kanji và các từ vựng N5 đều là `nhap`; chỉ âm Hán Việt chính của 75 kanji nhiều âm do tác giả duyệt.

Bản tải gốc nằm ở ngoài repo và không được commit.
