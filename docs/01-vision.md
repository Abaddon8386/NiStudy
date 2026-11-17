# Tầm nhìn sản phẩm Nihongo

Trạng thái: Bản nháp — 17/11/2026

Tài liệu này thuộc giai đoạn 0 (Định hướng) của `docs/00-plan.md`.

## 1. Tóm tắt

Nihongo là web học tiếng Nhật dành cho người Việt. Sản phẩm dạy kanji qua âm Hán Việt, ôn tập bằng thuật toán lặp lại ngắt quãng FSRS và bám lộ trình JLPT từ N5 đến N3. Giao diện và lời giải thích hoàn toàn bằng tiếng Việt. Sản phẩm có cơ chế giữ động lực lành mạnh: chuỗi ngày, XP, đếm ngược ngày thi và mục tiêu hằng ngày nhỏ. Mục tiêu là ra bản MVP đầu tháng 3/2027.

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

Nội dung xếp theo cấp N5, N4, N3. Mỗi thẻ được lên lịch ôn bằng FSRS. Người học không phải tự chọn bộ thẻ hay chỉnh cấu hình. Mỗi ngày họ biết cần ôn bao nhiêu thẻ.

### (d) Giữ động lực lành mạnh

Sản phẩm có chuỗi ngày, XP, đếm ngược ngày thi và mục tiêu hằng ngày nhỏ. Sản phẩm không dùng dark pattern: không phạt mất chuỗi gây áp lực, không gửi thông báo spam. Người học thấy tiến bộ mà không bị ép.

## 7. Phạm vi MVP

### Làm ngay

| Hạng mục | Lý do |
|---|---|
| Đăng nhập (Supabase Auth) | Cần để lưu tiến độ và lịch ôn theo từng người dùng. |
| Học và ôn kana | Người mới như Hùng cần bắt đầu từ kana. |
| Thẻ từ vựng N5–N3 ôn theo FSRS | Đây là lõi của sản phẩm: lịch ôn tự động theo cấp JLPT. |
| Kanji kèm âm Hán Việt, nghĩa tiếng Việt, ví dụ | Đây là điểm khác biệt chính so với đối thủ. |
| Trắc nghiệm ngắn | Giúp kiểm tra nhanh và đa dạng cách ôn. |
| Dashboard: chuỗi ngày, XP, đếm ngược ngày thi, số thẻ đến hạn | Cho người học thấy tiến bộ và việc cần làm hôm nay. |
| Giao diện tốt trên điện thoại, PWA cơ bản | Cả ba persona đều học trên điện thoại (giả định, cần kiểm chứng). |
| Ghi nguồn dữ liệu | Giấy phép CC BY-SA của JMdict và KANJIDIC, và CC BY của câu ví dụ Tatoeba, yêu cầu ghi nguồn. |

### Để sau

| Hạng mục | Lý do |
|---|---|
| Ngữ pháp | Cần thiết kế nội dung riêng, vượt quỹ thời gian MVP. |
| Luyện nghe | Cần dữ liệu âm thanh và giấy phép riêng. |
| Đề thi thử tự soạn | Tốn công soạn và không được chép đề JLPT thật. |
| Bộ thẻ cộng đồng | Cần kiểm duyệt nội dung và quản lý quyền. |
| Giao diện đa ngôn ngữ | MVP tập trung vào người Việt. |
| App native | PWA đủ cho MVP và tiết kiệm công sức. |
| Tính năng xã hội, bảng xếp hạng | Không cần để kiểm chứng giá trị cốt lõi, có thể tạo áp lực. |
| Tính năng AI | Tăng độ phức tạp và rủi ro, chưa cần thiết cho MVP. |

> CẦN QUYẾT: MVP có bài kiểm tra trình độ đầu vào không (xem mục 10, điểm 4).
> CẦN QUYẾT: MVP gồm kanji đến N3 hay chỉ đến N4 (xem mục 10, điểm 5).
> CẦN QUYẾT: PWA hoạt động offline đến mức nào (xem mục 10, điểm 6).

## 8. Chỉ số thành công

Các chỉ số dưới đây là đề xuất. Mọi mục tiêu số đều chưa quyết định.

| Chỉ số | Cách đo | Mục tiêu |
|---|---|---|
| Tỉ lệ người dùng beta quay lại sau 7 ngày | Số người có phiên học ở ngày 7–8 chia tổng số người đăng ký, từ thống kê truy cập | CẦN QUYẾT |
| Số thẻ ôn mỗi người mỗi ngày | Trung bình số lượt ôn từ bảng log ôn tập | CẦN QUYẾT |
| Thời gian một phiên ôn | Trung vị thời gian từ lúc mở phiên đến lúc kết thúc | CẦN QUYẾT |
| Tỉ lệ hoàn thành mục tiêu hằng ngày | Số ngày đạt mục tiêu chia số ngày có học | CẦN QUYẾT |
| Điểm Lighthouse (hiệu năng, khả năng truy cập, PWA) | Chạy Lighthouse trên các trang chính | CẦN QUYẾT |
| Số lỗi nghiêm trọng trên Sentry trong thời gian beta | Đếm trong Sentry | CẦN QUYẾT |

> CẦN QUYẾT: giá trị mục tiêu cho từng chỉ số (xem mục 10, điểm 9). Với 10–20 người beta, số liệu chỉ mang tính tham khảo, không có ý nghĩa thống kê.

## 9. Ràng buộc và rủi ro

### Ràng buộc

- **Nhân lực:** một người làm, 10–15 giờ mỗi tuần.
- **Kỹ năng:** tác giả đã biết HTML/CSS/JS và SQL/Postgres/Supabase, nhưng chưa biết React, TypeScript, Next.js. Phải học trong lúc làm.
- **Lịch cá nhân:** tác giả thi JLPT N4/N5 ngày 6/12/2026, nên tuần 24/11–6/12 giảm tải.
- **Máy làm việc:** ổ đĩa còn ít, không cài Docker, dùng Supabase bản cloud, dùng `pnpm`.
- **Giấy phép dữ liệu:** JMdict và KANJIDIC dùng CC BY-SA, câu ví dụ Tatoeba dùng CC BY; đều phải ghi nguồn. Không chép đề JLPT thật.
- **Mốc thời gian:** MVP đầu tháng 3/2027, đã tính một tuần nghỉ Tết.

### Rủi ro

| Rủi ro | Ảnh hưởng | Cách giảm |
|---|---|---|
| Học React/TypeScript/Next.js chậm hơn dự kiến | Trễ sprint 1–2 | Làm bản nhỏ trước, dùng tài liệu chính thức. Đề xuất: ưu tiên cắt phạm vi trước khi dời mốc. |
| Tuần thi JLPT 24/11–6/12 giảm tải | Trễ SRS và thiết kế | Xếp việc nhẹ vào tuần này; xem điểm CẦN QUYẾT số 8. |
| Dữ liệu âm Hán Việt thiếu hoặc sai | Mất điểm khác biệt chính | Kiểm tra độ phủ sớm; chuẩn bị nguồn bổ sung. |
| Không có danh sách JLPT chính thức | Nội dung theo cấp có thể lệch | Chọn danh sách không chính thức, ghi rõ nguồn và giới hạn. |
| Vi phạm giấy phép dữ liệu | Rủi ro pháp lý, mất uy tín | Ghi nguồn trong sản phẩm; kiểm tra giấy phép từng nguồn. |
| Gamification gây áp lực | Người dùng bỏ app | Không phạt mất chuỗi; thử với người dùng thật. |
| Phạm vi phình to | Không kịp MVP | Giữ bảng "Để sau"; mọi thêm mới phải thay một mục khác. |
| Hết dung lượng ổ đĩa | Không build được | Dùng `pnpm`, tối đa 2 bản checkout có `node_modules`, chừa ít nhất 5 GB. |
| Ít người beta | Số liệu khó dùng | Phỏng vấn định tính, coi số liệu là tham khảo. |

## 10. Điểm CẦN QUYẾT

1. **Tên sản phẩm chính thức.** Hiện tạm dùng "Nihongo".
2. **Nguồn âm Hán Việt cho kanji.** KANJIDIC2 có trường đọc tiếng Việt, nhưng độ phủ và độ chính xác cần kiểm tra. Cần quyết định có dùng nguồn bổ sung không, và giấy phép của nguồn đó.
3. **Nguồn danh sách từ vựng và kanji theo cấp JLPT.** JLPT không công bố danh sách chính thức kể từ kỳ thi mới năm 2010. Phải chọn một danh sách không chính thức và kiểm tra giấy phép.
4. **Bài kiểm tra trình độ đầu vào.** MVP có làm không? Luồng ở giai đoạn 2 có nhắc đến.
5. **Phạm vi kanji của MVP.** Đến N3 hay chỉ đến N4, với quỹ 10–15 giờ mỗi tuần và việc phải học React/TypeScript.
6. **PWA offline đến mức nào.** Chỉ cài đặt được, hay ôn được khi không có mạng.
7. **Mô hình kinh doanh và dữ liệu người dùng.** Miễn phí hoàn toàn hay có kế hoạch thu phí. Lưu những dữ liệu người dùng nào.
8. **Lịch và tuần thi JLPT.** Tuần 24/11–6/12 giảm tải trùng giai đoạn 1 (SRS) và đầu giai đoạn 2 (thiết kế). Chọn: dời giai đoạn 1–2 khoảng một tuần và dời mốc MVP theo, hay giữ mốc MVP đầu tháng 3/2027 và cắt phạm vi.
9. **Mục tiêu số cho chỉ số thành công** ở mục 8.
10. **Giấy phép mã nguồn của repo** (`LICENSE`).
