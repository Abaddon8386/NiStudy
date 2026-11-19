# Tầm nhìn sản phẩm Nihongo

Trạng thái: Đã chốt quyết định giai đoạn 0 — 17/11/2026; mở rộng định vị và phạm vi — 19/11/2026 (mục 10, quyết định 12–16). Một số dữ kiện còn cần kiểm chứng (mục 10).

Tài liệu này thuộc giai đoạn 0 (Định hướng) của `docs/00-plan.md`.

## 1. Tóm tắt

Nihongo là web học tiếng Nhật toàn diện cho người Việt ở trình độ N5–N4: thẻ SRS (kana, kanji, từ vựng), ngữ pháp và bốn kỹ năng nghe, đọc, nói, kaiwa. Sản phẩm dạy kanji qua âm Hán Việt, ôn tập bằng thuật toán lặp lại ngắt quãng FSRS và bám lộ trình JLPT. Từ 19/11/2026, định vị này thay cho "chỉ thẻ kana/kanji/từ vựng" (quyết định 13). MVP gồm lõi thẻ SRS ở N5–N4; ngữ pháp và bốn kỹ năng là các giai đoạn sau MVP (`docs/00-plan.md`, mục "Mở rộng phạm vi"); N3 làm sau cùng. Giao diện và lời giải thích hoàn toàn bằng tiếng Việt. Sản phẩm có cơ chế giữ động lực lành mạnh: chuỗi ngày, XP, đếm ngược ngày thi và mục tiêu hằng ngày nhỏ. Mục tiêu là ra bản MVP đầu tháng 3/2027.

## 2. Vấn đề

Người Việt học tiếng Nhật gặp bốn vấn đề chính.

- **Tài liệu viết cho người nói tiếng Anh.** Nhiều app và trang web giải thích bằng tiếng Anh. Người học phải dịch hai lần: Nhật → Anh → Việt.
- **Âm Hán Việt ít được tận dụng.** Tiếng Việt có nhiều từ gốc Hán. Ví dụ 学生 đọc là "học sinh" và nghĩa gần như giữ nguyên. Với 勉強, âm Hán Việt là "miễn cưỡng" nhưng nghĩa đã khác (học tập), nên cần giải thích thêm. Giả thuyết của dự án: âm Hán Việt giúp nhớ mặt chữ, nghĩa và nhóm từ Hán, nhưng chưa được dùng như một phương pháp học có hệ thống.
  > CẦN KIỂM CHỨNG: mức độ phổ biến của các công cụ Nhật–Việt có dạy kanji qua âm Hán Việt. Chưa nêu con số nào trong bản nháp này.
- **Công cụ SRS mạnh nhưng khó dùng.** Anki rất linh hoạt, nhưng người mới phải tự tìm bộ thẻ, cài add-on và chỉnh cấu hình. Anki không có sẵn lộ trình JLPT rõ ràng.
- **Người học dễ bỏ giữa chừng.** Học một mình, không thấy tiến bộ, ôn dồn thẻ sau vài ngày nghỉ là những lý do thường gặp khiến người học dừng.
  > CẦN KIỂM CHỨNG: các lý do bỏ học trên là giả định của tác giả. Cần xác nhận qua phỏng vấn ở giai đoạn 2.

## 3. Người dùng mục tiêu

### Trong phạm vi

- Người Việt đang học tiếng Nhật ở trình độ từ chưa biết kana đến N3.
- Người chuẩn bị thi JLPT N5, N4 hoặc N3.
- Người học tự học hoặc học bổ trợ ngoài lớp, dùng điện thoại là chính.
- Người muốn một lịch ôn rõ ràng, không muốn tự cấu hình công cụ.

### Ngoài phạm vi người dùng

- Người đã đạt N2 trở lên: nội dung MVP không phục vụ họ.
- Người không biết tiếng Việt: giao diện và giải thích chỉ có tiếng Việt, và giá trị âm Hán Việt không áp dụng.
- Người cần luyện giao tiếp hoặc phát âm chuyên sâu.
- Giáo viên và trung tâm cần công cụ quản lý lớp học.

## 4. Persona

> Ghi chú: ba persona dưới đây là giả định của tác giả, chưa dựa trên khảo sát. Cần kiểm chứng bằng phỏng vấn 3–5 người ở giai đoạn 2. Tên và chi tiết đều là hư cấu.

### Persona 1: Minh, sinh viên ôn N3

| Mục | Nội dung |
|---|---|
| Tuổi, bối cảnh | 21 tuổi, sinh viên năm 3 ngành ngôn ngữ Nhật. Muốn có N3 để xin thực tập. |
| Mục tiêu | Đạt N3 trong khoảng một năm. Nhớ được kanji và từ vựng lâu hơn một kỳ thi. |
| Khó khăn | Đã bỏ Anki hai lần. Thẻ dồn lại sau vài ngày nghỉ, thấy nản và xóa app. |
| Thiết bị | Laptop ở nhà, điện thoại trên đường đi học. Học theo đợt, không đều. |
| Câu nói minh họa (hư cấu) | "Mình bỏ Anki hai lần rồi. Nghỉ ba ngày là thẻ chất đống, nhìn thôi đã không muốn mở." |
| Nhu cầu với sản phẩm | Lịch ôn có giới hạn số thẻ mỗi ngày. Quay lại sau khi nghỉ không bị phạt. Thấy tiến bộ rõ ràng. Có lộ trình N3 để biết mình đang ở đâu. |

### Persona 2: Lan, nhân viên văn phòng

| Mục | Nội dung |
|---|---|
| Tuổi, bối cảnh | 28 tuổi, làm kế toán. Muốn chuyển sang công ty Nhật nên nhắm N4. |
| Mục tiêu | Đạt N4 để đủ điều kiện nộp hồ sơ. |
| Khó khăn | Chỉ có khoảng 15 phút mỗi ngày. Không có thời gian tự tìm tài liệu và cấu hình công cụ. |
| Thiết bị | Điện thoại là chính: giờ nghỉ trưa, trên xe buýt. Mạng đôi khi chập chờn. |
| Câu nói minh họa (hư cấu) | "Mình chỉ rảnh mười lăm phút buổi trưa. Cho mình biết hôm nay học gì là được." |
| Nhu cầu với sản phẩm | Một phiên ngắn, mở lên là học ngay. Giao diện dễ dùng bằng một tay. Chạy tốt trên điện thoại. Biết còn bao nhiêu ngày đến kỳ thi. |

### Persona 3: Hùng, người mới học N5

| Mục | Nội dung |
|---|---|
| Tuổi, bối cảnh | 19 tuổi, chuẩn bị du học hoặc đi làm ở Nhật. Mới bắt đầu, chưa biết kana. |
| Mục tiêu | Đọc được kana, nắm từ vựng cơ bản và đạt N5 trước khi đi. |
| Khó khăn | Không biết bắt đầu từ đâu. Tài liệu tiếng Anh gây khó. Dễ choáng khi gặp kanji. |
| Thiết bị | Điện thoại và máy tính ở nhà. Có thể học 30–60 phút mỗi ngày. |
| Câu nói minh họa (hư cấu) | "Mình chưa biết gì cả. Chỉ cần ai đó chỉ từng bước bằng tiếng Việt." |
| Nhu cầu với sản phẩm | Bắt đầu từ kana. Lộ trình từng bước. Giải thích bằng tiếng Việt. Dùng âm Hán Việt để làm quen kanji. |

> Ghi chú phạm vi: MVP chỉ có N5–N4, nên persona Minh (ôn N3) mới được phục vụ một phần (ôn lại nền N5–N4). Nội dung N3 có sau MVP.

## 5. Phân tích đối thủ

Bảng dưới chỉ ghi đặc điểm phổ biến của từng sản phẩm. Chưa so sánh giá hay số liệu.

| Sản phẩm | Loại sản phẩm | Điểm mạnh | Điểm yếu với người Việt | Bài học cho Nihongo |
|---|---|---|---|---|
| Anki | App flashcard SRS, tùy biến cao | Linh hoạt. Có nhiều bộ thẻ do cộng đồng chia sẻ. | Phải tự thiết lập và tìm bộ thẻ. Không có lộ trình JLPT sẵn. Cơ chế giữ động lực chủ yếu dựa vào add-on. | Giữ sức mạnh của SRS nhưng ẩn độ phức tạp. Cung cấp sẵn bộ thẻ theo cấp JLPT. |
| Duolingo | App học ngôn ngữ, gamification mạnh | Bài học ngắn. Chuỗi ngày và nhắc nhở giúp duy trì thói quen. | Không dạy kanji qua âm Hán Việt. Không bám lộ trình JLPT. Việc có khóa tiếng Nhật cho người nói tiếng Việt cần kiểm chứng. | Học cách tạo thói quen, nhưng tránh áp lực và dark pattern. |
| Mazii | Từ điển Nhật–Việt, có thêm công cụ học | Tra cứu bằng tiếng Việt. Theo hiểu biết của tác giả, có hiển thị âm Hán Việt cho kanji và có sổ tay/flashcard theo cấp JLPT. | Theo hiểu biết của tác giả, trọng tâm là tra cứu; mức độ ôn tập theo lịch SRS và lộ trình học có hệ thống cần kiểm chứng. | Đối thủ gần nhất với Nihongo. Phải kiểm chứng kỹ trước khi khẳng định điểm khác biệt. |
| WaniKani | Học kanji theo hệ cấp độ, có SRS | Thứ tự học rõ ràng. Dùng SRS cho kanji và từ vựng. | Giải thích bằng tiếng Anh. Không dựa trên âm Hán Việt. | Học thứ tự kanji có hệ thống, nhưng thay cầu nối tiếng Anh bằng âm Hán Việt. |
| Bunpro | Học ngữ pháp, có SRS | Tập trung ngữ pháp, có lịch ôn. | Giải thích bằng tiếng Anh. Ngữ pháp là phạm vi khác với MVP. | Ngữ pháp để sau MVP. Có thể tham khảo cách gắn SRS vào ngữ pháp. |

> CẦN KIỂM CHỨNG: giá, tính năng hiện tại và việc hỗ trợ tiếng Việt của từng đối thủ, ghi ngày kiểm tra.

### Khoảng trống

Các công cụ trên mạnh ở từng phần: SRS (Anki), thói quen (Duolingo), tra cứu tiếng Việt và Hán Việt (Mazii), kanji theo cấp độ (WaniKani), ngữ pháp (Bunpro). Giả thuyết của dự án: chưa có công cụ nào gộp chặt bốn điều sau cho người Việt: giao diện tiếng Việt, kanji học qua âm Hán Việt như một phương pháp ghi nhớ (không chỉ hiển thị khi tra), lộ trình JLPT với lịch ôn FSRS, và cơ chế giữ động lực lành mạnh. Đây là khoảng trống Nihongo nhắm tới.

> CẦN KIỂM CHỨNG: giả thuyết trên dựa trên hiểu biết hiện tại của tác giả. Cần dùng thử Mazii và các app Nhật–Việt khác, ghi ngày kiểm tra, trước khi dùng làm luận điểm trong case study.

## 6. Điểm khác biệt / giá trị cốt lõi

### (a) Dành cho người Việt

Giao diện, hướng dẫn và giải thích đều bằng tiếng Việt. Người học không phải qua tiếng Anh, nên bớt một rào cản khi mới bắt đầu.

### (b) Kanji qua âm Hán Việt

Mỗi kanji đi kèm âm Hán Việt, nghĩa tiếng Việt và ví dụ. Người học nối chữ mới với từ tiếng Việt đã quen, ví dụ 学 với "học". Giả thuyết là cách này giúp nhớ nghĩa và nhận ra nhóm từ Hán dễ hơn; cần kiểm chứng khi thử với người dùng.

### (c) Lộ trình JLPT N5→N3 với lịch ôn FSRS

Nội dung xếp theo cấp N5, N4, N3; MVP gồm N5 và N4. Mỗi thẻ được lên lịch ôn bằng FSRS. Người học không phải tự chọn bộ thẻ hay chỉnh cấu hình. Mỗi ngày họ biết cần ôn bao nhiêu thẻ.

### (d) Giữ động lực lành mạnh

Sản phẩm có chuỗi ngày, XP, đếm ngược ngày thi và mục tiêu hằng ngày nhỏ. Sản phẩm không dùng dark pattern: không phạt mất chuỗi gây áp lực, không gửi thông báo spam. Người học thấy tiến bộ mà không bị ép.

## 7. Phạm vi MVP

### Làm ngay

| Hạng mục | Lý do |
|---|---|
| Đăng nhập (Supabase Auth) | Cần để lưu tiến độ và lịch ôn theo từng người dùng. |
| Chọn cấp bắt đầu (N5/N4) và hỏi "đã biết kana chưa" | Thay cho bài kiểm tra trình độ: rẻ, đủ để xếp người học vào đúng chỗ. |
| Học và ôn kana | Người mới như Hùng cần bắt đầu từ kana. |
| Thẻ từ vựng N5–N4 ôn theo FSRS | Đây là lõi của sản phẩm: lịch ôn tự động theo cấp JLPT. |
| Kanji N5–N4 kèm âm Hán Việt, nghĩa tiếng Việt, ví dụ | Đây là điểm khác biệt chính so với đối thủ. |
| Trắc nghiệm ngắn | Giúp kiểm tra nhanh và đa dạng cách ôn. |
| Dashboard: chuỗi ngày, XP, đếm ngược ngày thi, số thẻ đến hạn | Cho người học thấy tiến bộ và việc cần làm hôm nay. |
| Giao diện tốt trên điện thoại, PWA cài được; mất mạng thì báo rõ và giữ thẻ đang ôn dở | Cả ba persona đều học trên điện thoại (giả định, cần kiểm chứng). |
| Xóa tài khoản và dữ liệu | Người dùng làm chủ dữ liệu của mình. |
| Ghi nguồn dữ liệu | Giấy phép CC BY-SA của JMdict và KANJIDIC, và CC BY của câu ví dụ Tatoeba, yêu cầu ghi nguồn. |

### Để sau

| Hạng mục | Lý do |
|---|---|
| Ngữ pháp | Cần thiết kế nội dung riêng, vượt quỹ thời gian MVP. Đã đưa vào lộ trình giai đoạn D sau MVP (quyết định 13). |
| Luyện nghe | Phát âm bằng TTS của trình duyệt (giai đoạn C) có thể vào MVP nếu kịp; nghe hội thoại là giai đoạn F sau MVP (quyết định 13, 14). Không dùng file âm thanh thu sẵn ở giai đoạn này. |
| Đọc, nói/kaiwa | Giai đoạn E và G sau MVP (quyết định 13, 15). |
| Đề thi thử tự soạn | Tốn công soạn và không được chép đề JLPT thật. |
| Bộ thẻ cộng đồng | Cần kiểm duyệt nội dung và quản lý quyền. |
| Giao diện đa ngôn ngữ | MVP tập trung vào người Việt. |
| App native | PWA đủ cho MVP và tiết kiệm công sức. |
| Tính năng xã hội, bảng xếp hạng | Không cần để kiểm chứng giá trị cốt lõi, có thể tạo áp lực. |
| Tính năng AI | Tăng độ phức tạp và rủi ro, chưa cần thiết cho MVP. Hội thoại AI là hướng tương lai, cần quyết định riêng về chi phí và quyền riêng tư (quyết định 15). |
| Từ vựng và kanji N3 | Nghĩa tiếng Việt phải tự biên soạn; thêm N3 làm khối biên soạn tăng nhiều lần. Code dùng chung, sau này chỉ thêm dữ liệu. |
| Bài kiểm tra trình độ đầu vào | Màn chọn cấp bắt đầu đủ cho MVP. |
| Ôn offline hoàn toàn | Cần đồng bộ trạng thái FSRS và xử lý xung đột. |
| Thu phí, quảng cáo | Sản phẩm miễn phí. |

## 8. Chỉ số thành công

Với 10–20 người beta, các mục tiêu dưới đây chỉ là ngưỡng tham khảo, không có ý nghĩa thống kê.

| Chỉ số | Cách đo | Mục tiêu |
|---|---|---|
| Tỉ lệ người dùng beta quay lại sau 7 ngày | Số người có phiên học ở ngày 7–8 chia tổng số người đăng ký, từ log ôn tập | ≥ 40% |
| Số thẻ ôn mỗi người mỗi ngày | Trung vị số lượt ôn từ bảng log ôn tập | ≥ 20 thẻ |
| Thời gian một phiên ôn | Trung vị thời gian từ lúc mở phiên đến lúc kết thúc | ≤ 10 phút |
| Tỉ lệ hoàn thành mục tiêu hằng ngày | Số ngày đạt mục tiêu chia số ngày có học | Theo dõi, chưa đặt ngưỡng |
| Điểm Lighthouse | Chạy Lighthouse trên các trang chính | Hiệu năng ≥ 90, khả năng truy cập ≥ 95, PWA cài được |
| Lỗi nghiêm trọng trên Sentry trong thời gian beta | Đếm trong Sentry | 0 lỗi nghiêm trọng còn mở khi kết thúc beta |

## 9. Ràng buộc và rủi ro

### Ràng buộc

- **Nhân lực:** một người làm, 10–15 giờ mỗi tuần.
- **Kỹ năng:** tác giả đã biết HTML/CSS/JS và SQL/Postgres/Supabase, nhưng chưa biết React, TypeScript, Next.js. Phải học trong lúc làm.
- **Lịch cá nhân:** tác giả thi JLPT N4/N5 ngày 6/12/2026, nên tuần 24/11–6/12 giảm tải.
- **Máy làm việc:** ổ đĩa còn ít, không cài Docker, dùng Supabase bản cloud, dùng `pnpm`.
- **Giấy phép dữ liệu:** JMdict và KANJIDIC dùng CC BY-SA, câu ví dụ Tatoeba dùng CC BY; đều phải ghi nguồn. Không chép đề JLPT thật.
- **Mốc thời gian:** MVP đầu tháng 3/2027 (khoảng 9/3), đã tính một tuần nghỉ Tết và lùi một tuần vì kỳ thi JLPT.
- **Dữ liệu tiếng Việt:** JMdict không có nghĩa tiếng Việt. Nghĩa tiếng Việt của từ vựng và kanji phải tự biên soạn.

### Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Biên soạn nghĩa tiếng Việt tốn nhiều công hơn dự kiến | Trễ sprint, dữ liệu sai nghĩa | MVP chỉ N5–N4; biên soạn dần theo sprint; mỗi mục ghi nguồn tham khảo; soát ngẫu nhiên. |
| Học React/TypeScript/Next.js chậm hơn dự kiến | Trễ sprint 1–2 | Làm bản nhỏ trước, dùng tài liệu chính thức. Ưu tiên cắt phạm vi trước khi dời mốc. |
| Tuần thi JLPT 24/11–6/12 giảm tải | Trễ SRS và thiết kế | Chỉ làm việc nhẹ; giai đoạn 1–4 lùi một tuần. |
| Dữ liệu âm Hán Việt thiếu hoặc sai | Mất điểm khác biệt chính | Kiểm tra độ phủ sớm; chuẩn bị nguồn bổ sung. |
| Không có danh sách JLPT chính thức | Nội dung theo cấp có thể lệch | Chọn danh sách không chính thức, ghi rõ nguồn và giới hạn. |
| Vi phạm giấy phép dữ liệu | Rủi ro pháp lý, mất uy tín | Ghi nguồn trong sản phẩm; kiểm tra giấy phép từng nguồn. |
| Gamification gây áp lực | Người dùng bỏ app | Không phạt mất chuỗi; thử với người dùng thật. |
| Phạm vi phình to | Không kịp MVP | Giữ bảng "Để sau"; mọi thêm mới phải thay một mục khác. |
| Hết dung lượng ổ đĩa | Không build được | Dùng `pnpm`, tối đa 2 bản checkout có `node_modules`, chừa ít nhất 5 GB. |
| Ít người beta | Số liệu khó dùng | Phỏng vấn định tính, coi số liệu là tham khảo. |

## 10. Quyết định đã chốt (17/11/2026)

1. **Tên sản phẩm.** Giữ "Nihongo" làm tên tạm. Chốt tên chính thức trước khi ra mắt (giai đoạn 7).
2. **Nguồn âm Hán Việt.** Lấy trường đọc tiếng Việt của KANJIDIC2 làm nguồn chính. Giai đoạn 3 đo độ phủ trên danh sách kanji N5–N4. Kanji thiếu thì tự bổ sung bằng tay và đánh dấu nguồn. Không lấy dữ liệu từ ứng dụng hay trang web có giấy phép không rõ.
3. **Danh sách theo cấp JLPT.** JLPT không công bố danh sách chính thức kể từ kỳ thi mới năm 2010. Dùng danh sách của tanos.co.uk (Jonathan Waller). Không dùng trường JLPT của KANJIDIC2 vì trường này theo 4 cấp cũ trước 2010.
4. **Kiểm tra trình độ đầu vào.** Không làm trong MVP. Thay bằng màn chọn cấp bắt đầu (N5/N4) và câu hỏi "đã biết kana chưa".
5. **Phạm vi MVP.** Từ vựng và kanji chỉ đến N4. N3 làm sau MVP.
6. **PWA.** Cài được; mất mạng thì báo rõ và giữ thẻ đang ôn dở. Chưa ôn offline hoàn toàn.
7. **Mô hình và dữ liệu người dùng.** Miễn phí, không quảng cáo. Chỉ lưu email đăng nhập, trạng thái thẻ FSRS, lịch sử ôn, ngày thi và mục tiêu hằng ngày. Có chức năng xóa tài khoản. Thống kê truy cập không dùng cookie theo dõi.
8. **Lịch.** Tuần 24/11–6/12 chỉ làm việc nhẹ (kiểm chứng đối thủ, đọc tài liệu dữ liệu). Giai đoạn 1–4 lùi một tuần. Mốc MVP giữ đầu tháng 3/2027 (khoảng 9/3) nhờ cắt N3.
9. **Mục tiêu chỉ số.** Như bảng ở mục 8.
10. **Giấy phép.** Code dùng MIT. Dữ liệu dẫn xuất từ JMdict/KANJIDIC2 giữ CC BY-SA; câu ví dụ Tatoeba giữ CC BY.
11. **Repo public.** Chuyển repo sang public trước khi đưa vào hồ sơ, để nhà tuyển dụng xem được.

### Quyết định bổ sung (19/11/2026)

Sau khi tác giả chạy thử app và yêu cầu app đa dạng hơn ("đặt vào vai người dùng"). Không xóa quyết định cũ; quyết định nào bị thay thì ghi rõ.

12. **Làm lâu dài.** Ưu tiên làm đúng và chắc. Kỳ thi JLPT ngày 6/12/2026 của tác giả không phải mốc của app. (Bổ sung cho quyết định 8: mốc MVP 9/3/2027 vẫn giữ, xem quyết định 16.)
13. **Định vị và phạm vi mở rộng.** App học toàn diện N5–N4 cho người Việt: thẻ SRS + ngữ pháp + bốn kỹ năng (nghe, đọc, nói, kaiwa). Phạm vi cấp vẫn N5–N4 (quyết định 5 còn hiệu lực về cấp). Thứ tự giai đoạn: A sửa ngay (giao diện máy tính, thứ tự thẻ mới, thông báo lỗi liên kết xác nhận); B hoàn tất lõi MVP; C âm thanh; D ngữ pháp N5 rồi N4; E đọc; F nghe hội thoại; G nói/kaiwa bản miễn phí. Chi tiết và ước lượng: `docs/00-plan.md`. Quyết định này thay mục "Để sau" cho ngữ pháp, luyện nghe: các mục đó thành giai đoạn D, C/F sau MVP, không còn là "chưa quyết".
14. **Thứ tự thẻ mới.** Giai đoạn đầu chỉ hiragana cơ bản. Sau đó xen kẽ 1 kana : 1 kanji : 2 từ vựng. Người đã biết kana thì 1 kanji : 2 từ vựng. Thay thứ tự "học hết kana trước rồi xen kẽ 1 kanji : 2 từ vựng" ở `docs/02-srs.md` mục 9 điểm 2 (sửa FR-13).
15. **Âm thanh và giọng nói bản miễn phí.** Phát âm bằng Web Speech API `speechSynthesis` (giọng `ja-JP` của hệ điều hành); shadowing bằng MediaRecorder, ghi âm lưu cục bộ, không tải lên. Miễn phí, không gửi dữ liệu ra ngoài. Nhận dạng giọng nói (Chrome gửi âm thanh lên Google) và hội thoại AI (API trả phí, khóa phía máy chủ) là phương án tương lai, cần quyết định riêng về chi phí và quyền riêng tư; chưa làm. Chi tiết: `docs/adr/0008-am-thanh-va-giong-noi.md`. Quyết định này thay dòng "Tính năng AI" ở mục "Để sau" chỉ ở chỗ: bản miễn phí không dùng AI, và AI vẫn là phương án tương lai.
16. **Mốc.** Mốc MVP 9/3/2027 giữ cho giai đoạn A + B (+ C nếu kịp). D–G sau MVP, ước lượng thô theo 10–15 giờ/tuần của tác giả (`docs/00-plan.md`). Nội dung ngữ pháp, bài đọc, kịch bản nghe tự soạn nháp và tác giả duyệt; không chép đề JLPT.
17. **Thẻ "nghe → chọn nghĩa" không vào FSRS.** Đây là dạng luyện tập như trắc nghiệm (FR-19/FR-20): chỉ cộng XP theo số câu đúng, không đổi `card_states`, không ghi `review_logs`. Lý do: tránh nhân đôi khối lượng ôn. (Chốt 19/11/2026, cho giai đoạn C.)

### Kết quả kiểm chứng nguồn dữ liệu (17/11/2026)

- **KANJIDIC2 có âm Hán Việt.** File dữ liệu hiện hành có thẻ `<reading r_type="vietnam">`, ví dụ 毎 → "Mỗi", 敬 → "Kính" (thấy trong các bản trích KANJIDIC2 trên GitHub). Tài liệu DTD cũ trên trang EDRDG chưa liệt kê giá trị này. Chữ đầu viết hoa, cần chuẩn hóa khi nhập.
- **Trường `<jlpt>` của KANJIDIC2 theo 4 cấp cũ.** DTD ghi rõ: cấp JLPT cũ, giá trị 1 đến 4. Xác nhận quyết định 3: không dùng trường này.
- **Danh sách tanos.co.uk dùng CC BY của Jonathan Waller.** Hai repo dùng lại dữ liệu ghi cùng một nội dung: GitHub `Bluskyo/JLPT_Vocabulary` có JSON/CSV, giấy phép repo MIT; và `oysteikt/tanos-japanese-word-books`. Ngày 17/11/2026 không truy cập được tên miền tanos.co.uk để đọc giấy phép gốc. Cách làm: dùng bản JSON/CSV từ repo trên, ghi nguồn "Jonathan Waller, tanos.co.uk, CC BY" và ghi ngày tải.

### Còn cần kiểm chứng

- Độ phủ âm Hán Việt trong KANJIDIC2 cho kanji N5–N4: đã đo 18/11/2026, 245/245 chữ (N5 79, N4 166) có âm; âm chính phải chọn tay vì KANJIDIC2 xếp âm theo bảng chữ cái.
- Kanji có nhiều âm Hán Việt: chọn âm nào hiển thị đầu tiên.
- Tính năng hiện tại của Mazii và các app Nhật–Việt khác (mục 5): người dùng dùng thử.
