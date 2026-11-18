# Đặc tả yêu cầu phần mềm (SRS) — Nihongo MVP

Trạng thái: Đã review, chốt quyết định — 17/11/2026

Phiên bản: 0.2

Tài liệu này thuộc giai đoạn 1 (Yêu cầu và SRS) của `docs/00-plan.md`.

## 1. Giới thiệu

### 1.1 Mục đích tài liệu

Tài liệu này mô tả yêu cầu của bản MVP Nihongo. Nó dành cho người thiết kế, lập trình và kiểm thử. Trong dự án này cả ba vai trò do một người đảm nhiệm. Mỗi yêu cầu có mã để truy vết sang thiết kế, code và test.

### 1.2 Phạm vi sản phẩm

Nihongo là web học tiếng Nhật cho người Việt. Sản phẩm dạy kanji qua âm Hán Việt, ôn tập bằng thuật toán FSRS và bám lộ trình JLPT. MVP gồm JLPT N5–N4, giao diện chỉ tiếng Việt, miễn phí. Tóm tắt và lý do xem `docs/01-vision.md`.

### 1.3 Thuật ngữ

> Lưu ý: "SRS" trong tên tài liệu này là Software Requirements Specification (đặc tả yêu cầu phần mềm). Nó khác với "lặp lại ngắt quãng" (spaced repetition), là phương pháp ôn tập mà sản phẩm dùng. Để tránh nhầm, tài liệu này viết "lặp lại ngắt quãng" khi nói về phương pháp ôn.

| Thuật ngữ | Giải nghĩa |
|---|---|
| SRS (tài liệu đặc tả) | Software Requirements Specification: tài liệu này. |
| Lặp lại ngắt quãng (spaced repetition) | Phương pháp ôn một mục theo khoảng cách tăng dần, tính theo mức nhớ của người học. |
| FSRS | Free Spaced Repetition Scheduler: thuật toán lặp lại ngắt quãng. Sản phẩm dùng thư viện `ts-fsrs`. |
| Thẻ (card) | Một mục cần nhớ: một chữ kana, một từ vựng hoặc một kanji. Mỗi thẻ có trạng thái FSRS riêng cho từng người dùng. |
| Lượt ôn (review) | Một lần người học xem một thẻ và chấm mức nhớ. |
| Đến hạn (due) | Thẻ có thời điểm ôn kế tiếp nhỏ hơn hoặc bằng hiện tại. "Đến hạn hôm nay" (hàng đợi, dashboard) là thẻ có thời điểm ôn kế tiếp trước cuối ngày học hiện tại (4:00 sáng hôm sau). |
| Thẻ mới (new card) | Thẻ người học chưa học lần nào. |
| Ngày học | Một ngày tính từ 4:00 sáng đến 3:59 sáng hôm sau, theo giờ thiết bị người dùng. Lưu ở trường `study_date` của mỗi lượt ôn. |
| Phiên ôn (session) | Một lần ôn liên tục từ lúc bắt đầu đến lúc kết thúc hàng đợi hoặc thoát. Mỗi lượt ôn gắn `session_id` của phiên. |
| Dữ liệu cục bộ | Dữ liệu lưu trên thiết bị (phiên ôn đã tải, lượt ôn chưa gửi), luôn gắn `user_id`. |
| Chuỗi ngày (streak) | Số ngày học liên tiếp tính đến hiện tại. |
| XP | Điểm kinh nghiệm. Chỉ để người học thấy tiến bộ, không có bảng xếp hạng. |
| Hán Việt | Âm đọc tiếng Việt của chữ Hán. Ví dụ 学 đọc là "học". |
| on / kun | On'yomi (âm on) là âm đọc gốc Hán. Kun'yomi (âm kun) là âm đọc gốc Nhật. |
| PWA | Progressive Web App: web có thể cài lên thiết bị như một ứng dụng. |
| RLS | Row Level Security: cơ chế Postgres giới hạn dòng dữ liệu mà mỗi người dùng được đọc hoặc ghi. |
| Idempotent | Gửi cùng một yêu cầu nhiều lần cho cùng một kết quả, không tạo bản ghi trùng. |
| MoSCoW | Cách xếp ưu tiên. Tài liệu này dùng "Phải có" (Must) và "Nên có" (Should). |

### 1.4 Tài liệu tham chiếu

- `docs/00-plan.md`: kế hoạch dự án.
- `docs/01-vision.md`: tầm nhìn, persona, phạm vi MVP, quyết định giai đoạn 0.
- IEEE 830-1998: khuyến nghị thực hành đặc tả yêu cầu phần mềm.
- ISO/IEC/IEEE 29148:2018: quy trình kỹ nghệ yêu cầu.
- WCAG 2.1 (W3C): hướng dẫn khả năng truy cập nội dung web.
- `ts-fsrs`: thư viện TypeScript triển khai FSRS.

## 2. Mô tả tổng quan

### 2.1 Bối cảnh sản phẩm

Nihongo là ứng dụng web độc lập, có thể cài như PWA. Phần giao diện viết bằng Next.js. Phần đăng nhập và cơ sở dữ liệu dùng Supabase bản cloud. Sản phẩm không phụ thuộc hệ thống nào khác của người dùng. Thiết kế kỹ thuật chi tiết nằm ở `docs/04-architecture.md`.

### 2.2 Chức năng chính

- Tài khoản: đăng ký có xác nhận email, đăng nhập, quên mật khẩu, xóa tài khoản.
- Khởi đầu: chọn cấp N5 hoặc N4, cho biết đã biết kana chưa, đặt mục tiêu hằng ngày và ngày thi.
- Học và ôn kana (hiragana, katakana).
- Thẻ từ vựng N5–N4.
- Thẻ kanji N5–N4 kèm âm Hán Việt, nghĩa tiếng Việt, on/kun, từ ví dụ.
- Ôn tập theo FSRS với 4 mức chấm, hàng đợi hằng ngày có giới hạn.
- Trắc nghiệm ngắn, không ảnh hưởng lịch ôn.
- Dashboard: số thẻ đến hạn, chuỗi ngày, XP, đếm ngược ngày thi.
- PWA: cài được, báo rõ khi mất mạng, giữ kết quả ôn đang mở.
- Trang nguồn dữ liệu và giấy phép.

### 2.3 Nhóm người dùng

Ba persona nằm ở `docs/01-vision.md` mục 4. Chúng là giả định của tác giả, chưa qua khảo sát.

| Persona | Vai trò với sản phẩm |
|---|---|
| Minh, sinh viên ôn N3 | Chỉ được phục vụ một phần: dùng nội dung N5–N4 để ôn lại nền. Nội dung N3 có sau MVP. |
| Lan, nhân viên văn phòng nhắm N4 | Học phiên ngắn trên điện thoại, mạng đôi khi chập chờn. |
| Hùng, người mới học N5 | Bắt đầu từ kana, cần lộ trình từng bước bằng tiếng Việt. |

Chỉ có một loại tài khoản: người học. MVP không có vai trò quản trị trong giao diện.

### 2.4 Môi trường vận hành

- Chrome trên Android, Safari trên iOS, Chrome và Edge trên máy tính.
- Hỗ trợ 2 phiên bản gần nhất của mỗi trình duyệt.
- Chiều rộng màn hình từ 360px trở lên.
- Cần kết nối Internet để đăng nhập, tải bộ thẻ mới và đồng bộ. Xem mục "PWA và mất mạng" ở phần 3.

### 2.5 Ràng buộc

- Một người làm, 10–15 giờ mỗi tuần. Mốc MVP khoảng 9/3/2027.
- Dữ liệu dẫn xuất từ JMdict/KANJIDIC2 giữ CC BY-SA. Danh sách tanos giữ CC BY theo nguồn thứ cấp (chưa đọc được trang gốc). Câu ví dụ Tatoeba (CC BY) chỉ dùng nếu được đưa vào dữ liệu. Phải ghi nguồn.
- Không cài Docker, không chạy Supabase trên máy làm việc. Dùng Supabase bản cloud.
- Không chép đề JLPT thật. Câu hỏi trắc nghiệm tự soạn hoặc sinh từ dữ liệu thẻ.
- Công nghệ: Next.js, TypeScript, Tailwind, `ts-fsrs`, `pnpm`.

### 2.6 Giả định và phụ thuộc

- Supabase cloud sẵn sàng cho đăng nhập và lưu dữ liệu.
- `ts-fsrs` cho kết quả lên lịch đúng với 4 mức chấm.
- Nguồn dữ liệu đã kiểm chứng ở `docs/01-vision.md` mục 10: KANJIDIC2 có âm Hán Việt (thẻ `vietnam`), danh sách tanos làm danh sách theo cấp (giấy phép CC BY theo nguồn thứ cấp, chưa đọc được trang gốc).
- Nghĩa tiếng Việt của từ vựng và kanji do tác giả tự biên soạn vì JMdict không có.
- Độ phủ âm Hán Việt cho kanji N5–N4 chưa đo. Kanji thiếu sẽ được bổ sung tay và đánh dấu nguồn.
- Từ ví dụ của kanji lấy từ danh sách từ vựng N5–N4 của dự án có chứa kanji đó. Kanji không có từ nào thì hiển thị "Chưa có từ ví dụ". Câu ví dụ Tatoeba chỉ dùng nếu được đưa vào dữ liệu.

## 3. Yêu cầu chức năng

Cột "Nguồn" chỉ persona (Minh, Lan, Hùng) hoặc mục trong `docs/01-vision.md` (V1 là mục 1, V6b và V6d là điểm khác biệt (b) và (d) ở mục 6, V7 là mục 7, V8 là mục 8, V10 là mục 10). Mọi yêu cầu dưới đây dùng ngày học như định nghĩa ở mục 1.3.

### 3.1 Tài khoản

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-01 | Đăng ký | Hệ thống phải cho phép đăng ký bằng email và mật khẩu qua Supabase Auth. Mật khẩu tối thiểu 8 ký tự, không bắt buộc ký tự đặc biệt. Hệ thống phải gửi email xác nhận; liên kết xác nhận hết hạn sau 1 giờ. Tài khoản chưa xác nhận email không được vào các màn học. Đăng ký bằng email đã tồn tại phải nhận cùng thông báo như đăng ký mới ("kiểm tra hộp thư") và không tạo tài khoản thứ hai, để không tiết lộ email nào đã đăng ký. Hệ thống không cung cấp đăng nhập bằng mạng xã hội. | Phải có | V7, V10 |
| FR-02 | Đăng nhập | Hệ thống phải cho phép người dùng đã xác nhận email đăng nhập bằng email và mật khẩu. Sai thông tin thì hệ thống phải báo lỗi chung, không tiết lộ email có tồn tại hay không. Đăng nhập bằng tài khoản chưa xác nhận phải nhận cùng lỗi chung đó, kèm liên kết "Chưa nhận email xác nhận?". Gửi lại email xác nhận phải luôn hiện cùng một thông báo dù email có tồn tại hay không. Tần suất các thao tác này bị giới hạn theo NFR-24. | Phải có | V7 |
| FR-03 | Đăng xuất | Hệ thống phải cho phép đăng xuất. Sau khi đăng xuất, hệ thống phải không hiển thị dữ liệu cá nhân trên màn hình và phải xóa dữ liệu cục bộ của tài khoản theo FR-30 (kể cả cảnh báo khi còn lượt ôn chưa gửi). | Phải có | V7 |
| FR-04 | Quên mật khẩu | Hệ thống phải gửi email chứa liên kết đặt lại mật khẩu khi người dùng yêu cầu. Liên kết đặt lại hết hạn sau 1 giờ. Thông báo sau khi yêu cầu phải giống nhau dù email có tồn tại hay không. Hệ thống phải cho phép đặt mật khẩu mới qua liên kết đó. | Phải có | V7 |
| FR-05 | Xóa tài khoản | Hệ thống phải cho phép người dùng xóa tài khoản sau một bước xác nhận rõ ràng, trong đó người dùng phải nhập lại mật khẩu. Việc xóa phải chạy phía máy chủ (khóa service role chỉ ở máy chủ, theo NFR-13). Hệ thống phải xóa toàn bộ dữ liệu của người đó: email, trạng thái thẻ, log ôn, cài đặt, XP và chuỗi. Dữ liệu người dùng bị xóa theo ràng buộc khóa ngoại khi xóa bản ghi trong `auth.users`, để không có trạng thái nửa chừng. Hệ thống phải thu hồi mọi phiên đăng nhập trên mọi thiết bị và xóa dữ liệu cục bộ theo FR-30. | Phải có | V7, V10 |

### 3.2 Khởi đầu

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-06 | Chọn cấp và kana | Hệ thống phải cho người dùng mới chọn cấp bắt đầu (N5 hoặc N4) và trả lời "đã biết kana chưa". Hệ thống phải lưu lựa chọn và cho đổi lại trong cài đặt. Đổi cấp chỉ đổi nguồn thẻ mới: chọn N4 thì thẻ mới chỉ lấy từ N4, muốn học thẻ mới của N5 thì đổi cấp trong cài đặt. Thẻ đã học luôn tiếp tục đến hạn dù đang chọn cấp nào. Khi đã hết thẻ mới mọi loại (kana, từ vựng, kanji) của cấp đang chọn, hệ thống phải đề nghị chuyển cấp (N5 sang N4). Không có bài kiểm tra trình độ đầu vào. | Phải có | Hùng, V7, V10 |
| FR-07 | Đặt ngày thi | Hệ thống phải cho người dùng đặt hoặc xóa ngày thi JLPT. Ngày thi là tùy chọn. Hệ thống phải từ chối ngày trong quá khứ khi đặt mới; "quá khứ" tính theo ngày lịch trên thiết bị. | Nên có | Lan, V7 |
| FR-08 | Mục tiêu và giới hạn ôn | Hệ thống phải cho người dùng đặt mục tiêu hằng ngày là số thẻ mới mỗi ngày, từ 5 đến 30, mặc định 10. Hệ thống phải cho đặt giới hạn số lượt ôn mỗi ngày, từ 50 đến 500, mặc định 100. Giá trị ngoài khoảng cho phép phải bị từ chối kèm thông báo. Đổi giữa ngày có hiệu lực ngay; hạ mục tiêu xuống dưới số thẻ mới đã học trong ngày thì hệ thống chỉ ngừng đưa thêm thẻ mới. | Phải có | Minh, Lan |
| FR-09 | Ranh giới ngày học | Hệ thống phải tính ngày học bằng ranh giới 4:00 sáng theo giờ thiết bị người dùng. Mỗi lượt ôn phải lưu `reviewed_at` (UTC) và `study_date` (ngày học tính trên thiết bị lúc chấm). Lượt ôn lúc 02:00 phải được tính vào ngày học hôm trước. Đổi múi giờ hay giờ thiết bị không được tính lại dữ liệu quá khứ. | Phải có | Minh, V7 |

### 3.3 Kana

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-10 | Học bảng kana | Hệ thống phải hiển thị bảng hiragana và katakana, mỗi bộ gồm: 46 chữ cơ bản, 25 chữ âm đục và bán đục (dakuten, handakuten), 33 âm ghép (yōon). Mỗi chữ hoặc âm ghép là một thẻ. Mỗi chữ có cách đọc bằng chữ La-tinh. Người dùng chọn một chữ thì hệ thống phải hiển thị chữ đó và cách đọc. | Phải có | Hùng, V7 |
| FR-11 | Ôn kana theo FSRS | Hệ thống phải đưa kana vào lịch ôn FSRS như các thẻ khác. Người dùng đã chọn "đã biết kana" thì hệ thống không được tự đưa thẻ kana mới vào hàng đợi. | Phải có | Hùng, V7 |

### 3.4 Từ vựng

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-12 | Thẻ từ vựng | Hệ thống phải hiển thị thẻ từ vựng gồm: từ, cách đọc bằng kana, nghĩa tiếng Việt, và câu ví dụ nếu có dữ liệu (câu Tatoeba chỉ dùng nếu được đưa vào dữ liệu). Thẻ phải thuộc đúng cấp N5 hoặc N4 theo danh sách tanos. | Phải có | Lan, V7, V10 |
| FR-13 | Giới thiệu thẻ mới | Hệ thống phải đưa thẻ mới vào hôm nay theo mục tiêu hằng ngày ở FR-08. Hệ thống không được đưa quá số thẻ mới đã đặt trong một ngày học. Thẻ kana mới tính vào mục tiêu này. Thứ tự: nếu người học chưa biết kana thì học hết thẻ kana trước; sau đó xen kẽ 1 kanji : 2 từ vựng, mỗi loại theo thứ tự danh sách nguồn trong cấp. Khi một loại thẻ mới (kanji hoặc từ vựng) đã hết thì hệ thống lấy loại còn lại. Học thẻ mới là lượt ôn đầu tiên của thẻ: người học chấm 4 mức như thẻ khác, hệ thống khởi tạo trạng thái FSRS, ghi log và cộng +1 XP. Khi đạt mục tiêu, hệ thống phải thông báo đã xong mục tiêu thẻ mới. Ghi chú: bảng kana có 208 thẻ; với mục tiêu 10 thì khoảng 21 ngày, người học có thể nâng mục tiêu lên đến 30. | Phải có | Lan, Minh |

### 3.5 Kanji

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-14 | Thẻ kanji | Hệ thống phải hiển thị thẻ kanji gồm: chữ, âm Hán Việt, nghĩa tiếng Việt, âm on, âm kun và từ ví dụ. Từ ví dụ lấy từ danh sách từ vựng N5–N4 của dự án có chứa kanji đó; không có thì hiển thị "Chưa có từ ví dụ". Kanji có nhiều âm Hán Việt thì hiển thị một âm chính (mặc định là âm đầu tiên trong KANJIDIC2, sửa tay được khi biên soạn) và các âm còn lại ở dạng phụ. Kanji thiếu âm Hán Việt phải hiển thị chữ "Đang bổ sung" và được đánh dấu để bổ sung, không hiển thị trường trống. | Phải có | Hùng, V6b, V7 |

### 3.6 Ôn tập FSRS

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-15 | Lên lịch FSRS 4 mức | Hệ thống phải lên lịch ôn kế tiếp bằng `ts-fsrs` theo 4 mức chấm: Lại (Again), Khó (Hard), Được (Good), Dễ (Easy). Hệ thống phải lưu trạng thái FSRS mới của thẻ sau mỗi lần chấm. Lịch được tính ở thiết bị bằng `ts-fsrs` ngay khi chấm (đáp ứng NFR-03) và gửi kèm lượt ôn lên máy chủ. | Phải có | V1, V7 |
| FR-16 | Hàng đợi ôn hôm nay | Khi bắt đầu phiên, hệ thống phải tạo hàng đợi gồm các thẻ đến hạn trong ngày học hiện tại (tối đa bằng giới hạn lượt ôn ở FR-08) và thẻ mới theo mục tiêu (FR-13), rồi tải toàn bộ hàng đợi về thiết bị. Khi chọn thẻ đến hạn cho hàng đợi, thẻ quá hạn lâu nhất được chọn trước. Thẻ vượt giới hạn không bị mất và giữ nguyên thời điểm đến hạn (không đổi `due`). Giới hạn chỉ áp cho thẻ đến hạn; thẻ mới tính riêng theo FR-13. Trong một phiên, thẻ đến hạn hiển thị trước, thẻ mới sau. Hệ thống phải cho biết số thẻ còn lại trong hàng đợi. | Phải có | Minh, Lan |
| FR-17 | Ghi log ôn | Hệ thống phải ghi một bản ghi log cho mỗi lượt ôn: mã lượt ôn (`review_id`), thẻ, mức chấm, `reviewed_at` (UTC), `study_date`, `session_id`, trạng thái thẻ trước và sau. `session_id` dùng để đo thời gian một phiên (lượt cuối trừ lượt đầu trong phiên). Ràng buộc duy nhất là (`user_id`, `review_id`). Bản ghi chỉ thuộc về người dùng đó. | Phải có | V8, V10 |
| FR-18 | Màn hình phiên ôn | Hệ thống phải hiển thị mặt trước thẻ, cho người dùng lật xem mặt sau, rồi chọn một trong 4 mức chấm. Sau khi chấm, hệ thống phải chuyển ngay sang thẻ kế tiếp; thẻ chấm "Lại" có thể xuất hiện lại trong cùng phiên. Hết hàng đợi, hệ thống phải hiển thị màn hình tổng kết phiên. | Phải có | Lan |

### 3.7 Trắc nghiệm

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-19 | Trắc nghiệm 4 lựa chọn | Hệ thống phải cho làm trắc nghiệm ngắn, mỗi câu có đúng 4 lựa chọn và đúng 1 đáp án. Dạng câu: từ → nghĩa và nghĩa → từ (thẻ từ vựng); kanji → âm Hán Việt (thẻ kanji). Kana không có trong trắc nghiệm MVP. Mỗi bài 10 câu; câu hỏi lấy từ thẻ đã học (có ít nhất một lượt ôn). Đáp án nhiễu lấy ngẫu nhiên từ toàn bộ bộ thẻ cùng loại, cùng cấp (kể cả thẻ chưa học), loại các lựa chọn có giá trị hiển thị trùng đáp án đúng (đồng âm, đồng nghĩa). Trắc nghiệm chỉ mở khi tạo được ít nhất 10 câu hợp lệ. Sau mỗi câu, hệ thống phải cho biết đúng hay sai và đáp án đúng. Trắc nghiệm cần mạng ở MVP; khi mất mạng, hệ thống báo theo FR-26 và không mở bài mới. | Phải có | V7 |
| FR-20 | Trắc nghiệm không ảnh hưởng FSRS | Hệ thống không được đổi trạng thái FSRS hay ghi log ôn của thẻ khi người dùng trả lời trắc nghiệm. Trắc nghiệm chỉ cộng XP theo FR-23. | Phải có | V7 |

### 3.8 Dashboard và động lực

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-21 | Dashboard | Hệ thống phải hiển thị trên trang chính: số thẻ đến hạn hôm nay, thời gian ôn ước tính (số thẻ trong hàng đợi × trung vị giây mỗi lượt ôn của người học trong 7 ngày, mặc định 20 giây khi chưa đủ dữ liệu, làm tròn lên theo phút), tiến độ thẻ mới so với mục tiêu, chuỗi ngày, tổng số ngày đã học, tổng XP và XP hôm nay, và đếm ngược ngày thi nếu có. Từ trang này người dùng phải vào được phiên ôn trong một thao tác bấm. | Phải có | Lan, V7 |
| FR-22 | Chuỗi ngày | Hệ thống phải tính một ngày học (theo `study_date`) là "có học" khi có ít nhất một lượt ôn; học thẻ mới cũng là một lượt ôn (xem FR-13). Hôm nay chưa học nhưng hôm qua có học thì chuỗi vẫn giữ nguyên. Chuỗi về 0 chỉ khi đã qua trọn một ngày học không có lượt ôn nào. Hệ thống phải hiển thị "tổng số ngày đã học" là con số chính, nổi bật hơn chuỗi, và không được trừ tổng này khi mất chuỗi. Hệ thống không gửi thông báo đẩy. | Phải có | Minh, V6d |
| FR-23 | Tính XP | Hệ thống phải cộng XP: +1 cho mỗi lượt ôn thẻ (gồm lượt đầu khi học thẻ mới), +1 cho mỗi câu trắc nghiệm đúng, +5 khi số thẻ mới đã học trong ngày học (theo `study_date`) đạt hoặc vượt mục tiêu hiện tại. Mốc +5 chỉ cộng tối đa một lần mỗi ngày học; hệ thống phải lưu mốc đã nhận. Hệ thống không có bảng xếp hạng. | Phải có | V6d, V7 |
| FR-24 | Đếm ngược ngày thi | Hệ thống phải hiển thị số ngày còn lại đến ngày thi nếu người dùng đã đặt. Ngày thi là hôm nay thì hệ thống phải hiển thị "Hôm nay thi". Chưa đặt thì hệ thống phải không hiển thị mục này. Quá ngày thi thì hệ thống phải mời đặt ngày mới hoặc xóa. | Nên có | Lan, V7 |

### 3.9 PWA và mất mạng

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-25 | Cài PWA | Hệ thống phải đáp ứng điều kiện cài đặt PWA: manifest hợp lệ, biểu tượng, chạy qua HTTPS, service worker. Người dùng phải cài được lên màn hình chính trên Chrome Android và Chrome/Edge máy tính. Trên Safari iOS, hệ thống phải hướng dẫn cách thêm vào màn hình chính. | Phải có | Lan, V7, V10 |
| FR-26 | Báo trạng thái mất mạng | Hệ thống phải phát hiện mất kết nối và hiển thị thông báo rõ ràng trên mọi màn hình cần mạng. Hệ thống coi là mất mạng khi trình duyệt báo offline hoặc một yêu cầu tới máy chủ không phản hồi trong 10 giây. Khi có mạng lại, hệ thống phải tự ẩn thông báo. | Phải có | Lan, V10 |
| FR-27 | Lưu cục bộ và gửi lại | Khi mất mạng giữa phiên ôn, hệ thống phải giữ phiên đang mở và lưu kết quả các lượt ôn trên thiết bị. Khi có mạng, hệ thống phải tự gửi lại, thử lại với khoảng chờ tăng dần. Mỗi lượt ôn phải có mã định danh duy nhất (`review_id`) do thiết bị tạo. Ràng buộc duy nhất là (`user_id`, `review_id`); gửi lặp cùng mã không được tạo bản ghi log trùng. Máy chủ phải lấy `user_id` từ phiên đăng nhập, không tin `user_id` trong dữ liệu gửi lên. Máy chủ phải từ chối lượt ôn có `reviewed_at` muộn hơn thời điểm máy chủ quá 5 phút, hoặc có thẻ không tồn tại, hoặc có `study_date` lệch quá 2 ngày so với ngày UTC của `reviewed_at`. Máy chủ tự xác định lượt nào là lượt đầu của thẻ (thẻ mới), không tin cờ do thiết bị gửi. MVP coi mỗi người dùng ôn trên một thiết bị tại một thời điểm; nếu cùng một thẻ có lượt ôn từ hai thiết bị thì log giữ cả hai, trạng thái thẻ lấy theo lượt có `reviewed_at` mới hơn. Lượt ôn offline gửi muộn vẫn tính theo `study_date` lúc chấm. | Phải có | Lan, V10 |
| FR-28 | Không tải thẻ mới khi offline | Khi mất mạng, hệ thống không được tải thẻ ngoài phiên đã tải. Hệ thống phải báo rõ lý do và cho người dùng tiếp tục ôn các thẻ trong phiên đã tải. Mở lại app khi vẫn offline thì hệ thống tiếp tục phiên đã lưu nếu cùng tài khoản và cùng ngày học. | Phải có | V10 |
| FR-30 | Dữ liệu cục bộ theo tài khoản | Hệ thống phải gắn `user_id` vào mọi bản ghi lưu trên thiết bị (phiên ôn, lượt ôn chưa gửi) và chỉ gửi khi `user_id` khớp phiên đăng nhập hiện tại. Đăng xuất khi còn lượt ôn chưa gửi: hệ thống phải cảnh báo; nếu có mạng thì gửi trước khi đăng xuất; nếu người dùng vẫn đăng xuất khi offline thì xóa dữ liệu cục bộ đó (chấp nhận mất lượt chưa gửi, ưu tiên riêng tư trên máy dùng chung). Đăng xuất và xóa tài khoản đều phải xóa toàn bộ dữ liệu cục bộ của tài khoản, gồm cache của service worker chứa dữ liệu cá nhân. | Phải có | Lan, V10 |

### 3.10 Nguồn dữ liệu

| Mã | Tên | Mô tả | Ưu tiên | Nguồn |
|---|---|---|---|---|
| FR-29 | Trang nguồn dữ liệu | Hệ thống phải có trang "Nguồn dữ liệu và giấy phép", mở được từ menu mà không cần đăng nhập. Trang chỉ liệt kê nguồn thực sự dùng: JMdict và KANJIDIC2 (EDRDG, CC BY-SA), danh sách từ vựng của Jonathan Waller tại tanos.co.uk (CC BY theo nguồn thứ cấp, chưa đọc được trang gốc), câu ví dụ Tatoeba (CC BY, chỉ khi được đưa vào dữ liệu), nghĩa tiếng Việt do dự án tự biên soạn, kèm ngày tải dữ liệu. Trang phải nêu rõ dữ liệu dẫn xuất từ JMdict/KANJIDIC2 theo CC BY-SA, tách khỏi giấy phép MIT của mã nguồn. | Phải có | V7, V10 |

Tổng cộng 30 yêu cầu chức năng.

## 4. Yêu cầu phi chức năng

Mỗi yêu cầu có tiêu chí đo được và cách kiểm.

### 4.1 Hiệu năng

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-01 | Trang chính và màn hình phiên ôn tải nhanh. | LCP ≤ 2,5 giây trên 4G mô phỏng (Lighthouse). | Phải có |
| NFR-02 | Điểm hiệu năng tổng thể. | Lighthouse hiệu năng ≥ 90 trên các trang chính. | Phải có |
| NFR-03 | Chấm thẻ phản hồi tức thì. | Từ lúc bấm mức chấm đến lúc hiện thẻ kế tiếp ≤ 200 ms trên thiết bị thử (Chrome DevTools giả lập CPU chậm 4 lần), không chờ mạng. | Phải có |

### 4.2 Khả năng truy cập

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-04 | Tuân thủ WCAG 2.1 mức AA. | Không có lỗi mức AA khi kiểm bằng công cụ tự động và duyệt tay các trang: đăng ký, đăng nhập, khởi đầu, dashboard, phiên ôn, trắc nghiệm, cài đặt, nguồn dữ liệu. | Phải có |
| NFR-05 | Điểm khả năng truy cập. | Lighthouse khả năng truy cập ≥ 95. | Phải có |
| NFR-06 | Dùng được bằng bàn phím. | Mọi chức năng ở phần 3 thực hiện được chỉ bằng bàn phím. Thứ tự focus hợp lý, focus luôn nhìn thấy. Phiên ôn có phím tắt: phím cách (Space) lật thẻ; phím 1, 2, 3, 4 chọn Lại, Khó, Được, Dễ. | Phải có |
| NFR-07 | Cỡ chữ. | Chữ thân 16px. Chữ phụ tối thiểu 14px. | Phải có |
| NFR-08 | Vùng bấm. | Mọi phần tử bấm được có kích thước tối thiểu 44×44px. | Phải có |
| NFR-09 | Tương phản màu. | Chữ thường tỉ lệ tương phản ≥ 4,5:1; chữ lớn và thành phần giao diện ≥ 3:1. | Phải có |

### 4.3 Hiển thị tiếng Việt và tiếng Nhật

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-10 | Font hiển thị đúng. | Chữ tiếng Việt có dấu và kana, kanji hiển thị đúng, không ra ô vuông, trên cả bốn trình duyệt ở mục 2.4. Font phải hỗ trợ cả hai bộ chữ hoặc có font dự phòng. | Phải có |
| NFR-11 | Đánh dấu ngôn ngữ. | Đoạn tiếng Nhật có `lang="ja"`; trang có `lang="vi"`. Kiểm bằng kiểm tra HTML tự động. | Phải có |

### 4.4 Bảo mật

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-12 | RLS cho dữ liệu người dùng. | Mọi bảng dữ liệu người dùng bật RLS theo `user_id = auth.uid()`. Bảng người dùng được ghi trực tiếp (cài đặt) có chính sách cả `USING` và `WITH CHECK`, để không ghi được `user_id` của người khác. Bảng dữ liệu học (trạng thái thẻ, log ôn, kết quả trắc nghiệm, mốc XP) chỉ cho đọc; mọi ghi đi qua hàm máy chủ lấy `user_id` từ phiên đăng nhập. Test: người dùng A đọc hoặc ghi dữ liệu của người dùng B đều bị từ chối. Bảng từ điển chỉ đọc cho mọi người, không ai ghi được từ trình duyệt. | Phải có |
| NFR-13 | Không khóa bí mật ở trình duyệt. | Mã nguồn và gói gửi về trình duyệt không chứa khóa service role hay khóa bí mật khác. Kiểm bằng quét repo và gói build. | Phải có |
| NFR-14 | Quản lý mật khẩu. | Mật khẩu do Supabase Auth quản lý. Ứng dụng không lưu hay ghi log mật khẩu. | Phải có |
| NFR-24 | Giới hạn tần suất (rate limit). | Đăng ký, đăng nhập, gửi lại email xác nhận và quên mật khẩu đều có giới hạn tần suất, dùng giới hạn của Supabase Auth. Test: gửi liên tiếp vượt ngưỡng thì bị từ chối tạm thời kèm thông báo. | Phải có |

### 4.5 Quyền riêng tư

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-15 | Dữ liệu tối thiểu. | Dữ liệu người dùng chỉ gồm: email, trạng thái thẻ FSRS, log ôn (gồm mã lượt ôn, `study_date`, `session_id`), cài đặt (cấp, kana, ngày thi, mục tiêu, giới hạn ôn, thời điểm hoàn tất khởi đầu), số câu đúng của mỗi bài trắc nghiệm và mốc +5 XP đã nhận. XP, chuỗi và tổng ngày học được tính từ các dữ liệu trên. Log ôn có thể lưu kèm trạng thái thẻ trước/sau và thời điểm máy chủ nhận. Kiểm bằng rà soát lược đồ CSDL. | Phải có |
| NFR-16 | Thống kê truy cập. | Chỉ dùng cookie và lưu trữ cần thiết cho đăng nhập; không cookie theo dõi và không có dịch vụ quảng cáo. Kiểm bằng xem cookie, lưu trữ cục bộ và yêu cầu mạng của trang. | Phải có |
| NFR-17 | Xóa hết dữ liệu. | Sau khi xóa tài khoản, bản ghi trong `auth.users` và mọi bảng dữ liệu theo người dùng đó trả về 0 dòng, và dữ liệu cục bộ trên thiết bị đã bị xóa. Giới hạn: bản sao lưu của Supabase còn giữ dữ liệu đến khi bản sao lưu hết hạn theo chu kỳ của nhà cung cấp. | Phải có |
| NFR-25 | Giám sát lỗi không lộ dữ liệu cá nhân. | Sentry chỉ dùng để ghi lỗi; không gửi email, nội dung thẻ hay dữ liệu ôn; tắt ghi lại phiên (session replay). Kiểm bằng cấu hình Sentry và xem nội dung gửi đi. | Phải có |

### 4.6 Độ tin cậy

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-18 | Không mất kết quả ôn khi mất mạng. | Test E2E: tắt mạng giữa phiên, chấm N thẻ, bật mạng lại; cả N lượt ôn xuất hiện trong log trên máy chủ. | Phải có |
| NFR-19 | Gửi lại idempotent. | Ràng buộc duy nhất là (`user_id`, `review_id`); máy chủ lấy `user_id` từ phiên đăng nhập, không tin `user_id` trong dữ liệu gửi lên. Test: gửi cùng một lượt ôn hai lần trở lên thì máy chủ chỉ có một bản ghi log; gửi lượt ôn mang `user_id` của người khác thì không ghi được vào dữ liệu của người đó. | Phải có |

### 4.7 Tương thích

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-20 | Chạy trên môi trường ở mục 2.4. | Các luồng chính chạy đúng trên Chrome Android, Safari iOS, Chrome và Edge máy tính (2 phiên bản gần nhất), màn hình từ 360px, không cuộn ngang. | Phải có |

### 4.8 Khả năng bảo trì

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-21 | Unit test logic lõi. | Có test Vitest cho: lịch FSRS (4 mức), tính chuỗi ngày, tính XP, ranh giới 4:00. Test chạy trong CI cho mỗi lần push, mọi nhánh. | Phải có |
| NFR-22 | E2E luồng chính. | Có test Playwright (Chromium) cho: đăng ký/đăng nhập, chọn cấp, phiên ôn, trắc nghiệm, mất mạng rồi gửi lại, xóa tài khoản. | Phải có |

### 4.9 Giấy phép

| Mã | Yêu cầu | Tiêu chí đo | Ưu tiên |
|---|---|---|---|
| NFR-23 | Ghi nguồn dữ liệu. | Mỗi nguồn dữ liệu có giấy phép và mức kiểm chứng được ghi lại, và xuất hiện trên trang FR-29 với tên tác giả, giấy phép và ngày tải. Danh sách tanos ghi "CC BY theo nguồn thứ cấp, chưa đọc được trang gốc" (xem `docs/01-vision.md` mục 10). Không có dữ liệu không rõ giấy phép trong repo. | Phải có |

Tổng cộng 25 yêu cầu phi chức năng.

## 5. Use case

Tác nhân chung là "Người học". Mọi use case, trừ UC-01 và phần đăng nhập, giả định người học đã đăng nhập.

### UC-01 Bắt đầu sử dụng

- Tác nhân: Người học mới (ví dụ Hùng).
- Tiền điều kiện: có email dùng được; chưa có tài khoản.
- Luồng chính:
  1. Người học mở trang đăng ký, nhập email và mật khẩu.
  2. Hệ thống gửi email xác nhận.
  3. Người học bấm liên kết xác nhận trong email.
  4. Hệ thống đưa người học đến màn chọn cấp bắt đầu (N5 hoặc N4).
  5. Người học chọn cấp và trả lời "đã biết kana chưa".
  6. Người học xem hoặc giữ mặc định mục tiêu hằng ngày (10 thẻ mới) và giới hạn ôn (100), có thể đặt ngày thi.
  7. Hệ thống mở bài đầu tiên: bảng kana nếu chưa biết kana, ngược lại là thẻ từ vựng mới đầu tiên.
- Luồng thay thế và ngoại lệ:
  - 2a. Email đã đăng ký: hệ thống hiển thị cùng thông báo "kiểm tra hộp thư" như bước 2, không tạo tài khoản mới (FR-01).
  - 3a. Người học chưa xác nhận mà thử đăng nhập: hệ thống báo cùng lỗi chung như sai thông tin, kèm liên kết "Chưa nhận email xác nhận?" để gửi lại email. Thông báo sau khi gửi lại luôn giống nhau dù email có tồn tại hay không (FR-02).
  - 3b. Liên kết xác nhận hết hạn: hệ thống cho gửi lại.
  - 6a. Mục tiêu ngoài 5–30 hoặc giới hạn ôn ngoài 50–500: hệ thống báo lỗi và giữ giá trị cũ.
- Hậu điều kiện: tài khoản được xác nhận; cài đặt ban đầu đã lưu; người học đang ở bài đầu tiên.
- FR liên quan: FR-01, FR-02, FR-06, FR-07, FR-08, FR-10, FR-11, FR-12, FR-13.

### UC-02 Phiên ôn hằng ngày

- Tác nhân: Người học (ví dụ Lan).
- Tiền điều kiện: đã đăng nhập, đã hoàn tất UC-01.
- Luồng chính:
  1. Người học mở dashboard và thấy số thẻ đến hạn.
  2. Người học bấm bắt đầu ôn.
  3. Hệ thống tạo hàng đợi: thẻ đến hạn (tối đa theo giới hạn ôn) và thẻ mới theo mục tiêu, rồi tải toàn bộ hàng đợi về thiết bị.
  4. Hệ thống hiển thị mặt trước thẻ.
  5. Người học lật thẻ xem mặt sau.
  6. Người học chọn Lại, Khó, Được hoặc Dễ.
  7. Hệ thống lên lịch FSRS ngay trên thiết bị, lưu trạng thái thẻ, ghi log ôn (kèm `reviewed_at`, `study_date`, `session_id`), cộng XP.
  8. Hệ thống chuyển sang thẻ kế tiếp. Lặp bước 4–8 đến hết hàng đợi.
  9. Hệ thống cập nhật chuỗi ngày và hiển thị tổng kết phiên.
- Luồng thay thế và ngoại lệ:
  - 3a. Không có thẻ đến hạn và đã đạt mục tiêu thẻ mới: hệ thống báo hôm nay đã xong.
  - 3b. Thẻ đến hạn vượt giới hạn: phần vượt không bị mất và giữ nguyên thời điểm đến hạn; thẻ quá hạn lâu nhất được chọn trước.
  - 8a. Người học thoát giữa chừng: các lượt đã chấm vẫn được giữ; thẻ chưa chấm vẫn ở hàng đợi.
  - 8b. Mất mạng: chuyển sang UC-05.
  - 8c. Thẻ chấm "Lại": thẻ có thể xuất hiện lại trong cùng phiên.
  - 9a. Phiên kéo qua mốc 4:00: các lượt ôn tính theo `study_date` lúc chấm, kể cả lượt offline gửi muộn. Đổi múi giờ hay giờ thiết bị không tính lại dữ liệu quá khứ.
- Hậu điều kiện: log ôn, trạng thái thẻ, XP và chuỗi ngày được cập nhật.
- FR liên quan: FR-09, FR-12, FR-13, FR-15, FR-16, FR-17, FR-18, FR-21, FR-22, FR-23.

### UC-03 Học kanji mới

- Tác nhân: Người học (ví dụ Hùng).
- Tiền điều kiện: đã đăng nhập, còn thẻ kanji mới trong cấp đã chọn, chưa đạt mục tiêu thẻ mới hôm nay, đang có mạng.
- Luồng chính:
  1. Người học bắt đầu từ dashboard hoặc từ phiên ôn.
  2. Hệ thống giới thiệu một thẻ kanji mới: chữ, âm Hán Việt, nghĩa tiếng Việt, on/kun, từ ví dụ.
  3. Người học đọc, rồi chấm 4 mức như thẻ khác; đây là lượt ôn đầu tiên của thẻ.
  4. Hệ thống khởi tạo trạng thái FSRS cho thẻ, ghi log, tính vào mục tiêu thẻ mới và cộng +1 XP.
  5. Khi số thẻ mới đã học trong ngày đạt mục tiêu hiện tại, hệ thống cộng +5 XP tối đa một lần mỗi ngày học và báo đã xong mục tiêu.
- Luồng thay thế và ngoại lệ:
  - 2a. Kanji thiếu âm Hán Việt: hệ thống hiển thị "Đang bổ sung" và đánh dấu thiếu dữ liệu theo FR-14. Kanji không có từ ví dụ: hiển thị "Chưa có từ ví dụ".
  - 2b. Mất mạng: hệ thống không tải thẻ mới và báo rõ (FR-28).
  - 5a. Đã hết thẻ kanji mới trong cấp: hệ thống lấy thẻ từ vựng mới (FR-13). Hết thẻ mới mọi loại: hệ thống báo đã học hết nội dung hiện có và đề nghị chuyển cấp (FR-06).
- Hậu điều kiện: thẻ kanji mới có lịch ôn; tiến độ thẻ mới tăng.
- FR liên quan: FR-06, FR-13, FR-14, FR-15, FR-17, FR-18, FR-23, FR-28.

### UC-04 Làm trắc nghiệm

- Tác nhân: Người học.
- Tiền điều kiện: đã đăng nhập, tạo được ít nhất 10 câu hợp lệ từ các thẻ đã học.
- Luồng chính:
  1. Người học chọn làm trắc nghiệm.
  2. Hệ thống đưa câu hỏi dạng từ → nghĩa, nghĩa → từ (thẻ từ vựng) hoặc kanji → âm Hán Việt (thẻ kanji), kèm 4 lựa chọn; đáp án nhiễu lấy từ toàn bộ bộ thẻ cùng loại, cùng cấp và không trùng giá trị hiển thị với đáp án đúng.
  3. Người học chọn một đáp án.
  4. Hệ thống báo đúng hay sai và hiển thị đáp án đúng.
  5. Trả lời đúng thì hệ thống cộng +1 XP.
  6. Lặp bước 2–5 đến hết bài, rồi hiển thị kết quả.
- Luồng thay thế và ngoại lệ:
  - 1a. Tạo được ít hơn 10 câu hợp lệ: hệ thống báo và mời học thêm thẻ.
  - 3a. Người học thoát giữa chừng: các câu đã trả lời vẫn được tính XP.
- Hậu điều kiện: XP cập nhật. Trạng thái FSRS và log ôn không đổi.
- FR liên quan: FR-19, FR-20, FR-23.

### UC-05 Ôn khi mất mạng

- Tác nhân: Người học (ví dụ Lan trên xe buýt).
- Tiền điều kiện: đang ở giữa một phiên ôn (UC-02) và các thẻ của phiên đã tải về thiết bị.
- Luồng chính:
  1. Kết nối mạng mất.
  2. Hệ thống hiển thị thông báo mất mạng.
  3. Người học tiếp tục chấm các thẻ còn lại trong phiên đang mở.
  4. Hệ thống lưu từng lượt ôn trên thiết bị, mỗi lượt có mã định danh duy nhất.
  5. Mạng trở lại.
  6. Hệ thống tự gửi các lượt ôn đã lưu lên máy chủ và ẩn thông báo.
  7. Hệ thống xác nhận đã đồng bộ.
- Luồng thay thế và ngoại lệ:
  - 3a. Người học muốn học thẻ mới: hệ thống không tải thẻ mới và báo rõ lý do.
  - 6a. Gửi lại bị gián đoạn: hệ thống giữ dữ liệu cục bộ và thử lại khi có mạng. Gửi lặp không tạo bản ghi trùng.
  - 3b. Người học đóng ứng dụng khi chưa có mạng: dữ liệu cục bộ vẫn còn và được gửi ở lần mở sau khi có mạng.
  - 3c. Người học mở lại app khi vẫn offline: hệ thống tiếp tục phiên đã lưu nếu cùng tài khoản và cùng ngày học (FR-28).
  - 3d. Người học đăng xuất khi còn lượt chưa gửi và đang offline: hệ thống cảnh báo; nếu vẫn đăng xuất thì xóa dữ liệu cục bộ đó (FR-30).
  - 6b. Phiên đăng nhập hết hạn: hệ thống yêu cầu đăng nhập lại và giữ dữ liệu cục bộ gắn `user_id`; chỉ gửi sau khi đăng nhập lại đúng tài khoản đó (FR-30).
- Hậu điều kiện: mọi lượt ôn đã chấm xuất hiện đúng một lần trong log trên máy chủ (trừ lượt bị xóa theo 3d).
- FR liên quan: FR-26, FR-27, FR-28, FR-17, FR-30.

### UC-06 Xóa tài khoản

- Tác nhân: Người học.
- Tiền điều kiện: đã đăng nhập.
- Luồng chính:
  1. Người học mở cài đặt và chọn xóa tài khoản.
  2. Hệ thống nêu rõ dữ liệu sẽ bị xóa và việc này không hoàn tác được.
  3. Người học nhập lại mật khẩu và xác nhận.
  4. Hệ thống kiểm tra mật khẩu, rồi xóa phía máy chủ bản ghi `auth.users` (dữ liệu người dùng bị xóa theo khóa ngoại), thu hồi mọi phiên đăng nhập trên mọi thiết bị, xóa dữ liệu cục bộ (FR-30) và đăng xuất.
  5. Hệ thống hiển thị thông báo đã xóa.
- Luồng thay thế và ngoại lệ:
  - 3a. Người học hủy: không có gì bị xóa.
  - 3b. Mật khẩu nhập sai: hệ thống báo lỗi và không xóa gì.
  - 4a. Xóa lỗi giữa chừng: hệ thống báo lỗi, không báo "đã xóa", và cho thử lại.
- Hậu điều kiện: không còn dòng dữ liệu nào của người dùng trong CSDL; không đăng nhập lại được bằng tài khoản đó.
- FR liên quan: FR-05, FR-03, FR-30.

## 6. User story

Persona là giả định của tác giả (xem `docs/01-vision.md` mục 4). Ưu tiên theo MoSCoW.

### US-01 Đăng ký tài khoản

Là Hùng, người mới học N5, tôi muốn đăng ký bằng email và mật khẩu, để lưu tiến độ học của mình.

Tiêu chí chấp nhận:
- Given tôi chưa có tài khoản, When tôi nhập email hợp lệ và mật khẩu hợp lệ rồi gửi, Then hệ thống gửi email xác nhận và báo tôi kiểm tra hộp thư.
- Given tôi chưa bấm liên kết xác nhận, When tôi thử đăng nhập, Then hệ thống báo cùng lỗi chung như sai thông tin và hiện liên kết "Chưa nhận email xác nhận?"; khi tôi bấm gửi lại, hệ thống luôn hiện cùng một thông báo dù email có tồn tại hay không.
- Given email đã được đăng ký, When tôi đăng ký lại với email đó, Then hệ thống hiển thị cùng thông báo "kiểm tra hộp thư" như đăng ký mới và không tạo tài khoản thứ hai.
- Given tôi nhập mật khẩu 7 ký tự, When tôi gửi, Then hệ thống từ chối và báo mật khẩu cần tối thiểu 8 ký tự.

FR liên quan: FR-01, FR-02. Ưu tiên: Phải có.

### US-02 Đăng nhập, đăng xuất và lấy lại mật khẩu

Là người học, tôi muốn đăng nhập, đăng xuất và đặt lại mật khẩu khi quên, để vào lại tài khoản mà không mất dữ liệu.

Tiêu chí chấp nhận:
- Given tôi đã xác nhận email, When tôi nhập đúng email và mật khẩu, Then tôi vào dashboard.
- Given tôi nhập sai mật khẩu, When tôi gửi, Then hệ thống báo lỗi chung, không nói rõ email có tồn tại hay không.
- Given tôi quên mật khẩu, When tôi yêu cầu đặt lại và bấm liên kết trong email còn hạn, Then tôi đặt được mật khẩu mới và đăng nhập được bằng mật khẩu đó.
- Given tôi đang đăng nhập, When tôi chọn đăng xuất, Then tôi quay về trang đăng nhập và không còn xem được dữ liệu cá nhân.
- Given tôi gửi liên tiếp yêu cầu đăng ký, đăng nhập, gửi lại email hoặc quên mật khẩu vượt ngưỡng, When tôi gửi tiếp, Then hệ thống từ chối tạm thời kèm thông báo (NFR-24).

FR liên quan: FR-02, FR-03, FR-04. Ưu tiên: Phải có.

### US-03 Chọn cấp bắt đầu

Là Hùng, tôi muốn chọn cấp bắt đầu và cho biết đã biết kana chưa, để được xếp vào đúng chỗ mà không phải làm bài kiểm tra.

Tiêu chí chấp nhận:
- Given tôi vừa xác nhận email, When tôi chọn N5 và "chưa biết kana", Then bài đầu tiên là bảng kana.
- Given tôi chọn N4 và "đã biết kana", When tôi bắt đầu, Then hệ thống không đưa thẻ kana vào hàng đợi.
- Given tôi đã chọn cấp, When tôi vào cài đặt đổi cấp, Then lựa chọn mới được lưu và hiện lại sau khi tải lại trang.

FR liên quan: FR-06, FR-11. Ưu tiên: Phải có.

### US-04 Học bảng kana

Là Hùng, tôi muốn xem bảng hiragana và katakana rồi ôn từng chữ theo lịch, để đọc được kana trước khi học từ vựng.

Tiêu chí chấp nhận:
- Given tôi mở bảng kana, When tôi chọn một chữ, Then hệ thống hiển thị chữ đó và cách đọc.
- Given tôi chưa biết kana, When tôi học chữ kana mới và chấm mức nhớ, Then thẻ kana đó có lịch ôn FSRS và xuất hiện lại khi đến hạn.

FR liên quan: FR-10, FR-11, FR-15. Ưu tiên: Phải có.

### US-05 Đặt mục tiêu hằng ngày

Là Lan, người chỉ có 15 phút mỗi ngày, tôi muốn đặt số thẻ mới mỗi ngày và giới hạn số lượt ôn, để mỗi ngày học vừa sức.

Tiêu chí chấp nhận:
- Given tôi mở cài đặt, When tôi đặt mục tiêu thẻ mới là 8, Then trong một ngày học hệ thống đưa tối đa 8 thẻ mới.
- Given tôi nhập mục tiêu 3 hoặc 40, When tôi lưu, Then hệ thống từ chối và báo khoảng cho phép là 5–30.
- Given tôi nhập giới hạn ôn 40 hoặc 600, When tôi lưu, Then hệ thống từ chối và báo khoảng cho phép là 50–500.
- Given tôi chưa đổi cài đặt, When tôi xem cài đặt, Then mục tiêu là 10 thẻ mới và giới hạn ôn là 100 lượt.
- Given hôm nay tôi đã học 8 thẻ mới, When tôi đổi mục tiêu từ 10 xuống 5 giữa ngày, Then thay đổi có hiệu lực ngay, hệ thống không đưa thêm thẻ mới và không xóa thẻ đã học.
- Given mục tiêu là 10, When số thẻ mới đã học trong ngày học đạt 10, Then tôi nhận +5 XP đúng một lần cho ngày học đó.

FR liên quan: FR-08, FR-13. Ưu tiên: Phải có.

### US-06 Phiên ôn ngắn

Là Lan, tôi muốn mở app là ôn được ngay các thẻ đến hạn và chấm bằng 4 mức, để xong trong giờ nghỉ trưa.

Tiêu chí chấp nhận:
- Given hôm nay có thẻ đến hạn, When tôi bấm bắt đầu ôn từ dashboard, Then thẻ đầu tiên hiện ra sau một thao tác bấm.
- Given tôi đang xem mặt sau một thẻ, When tôi chọn "Được", Then hệ thống ghi một log ôn, lưu lịch FSRS mới và hiện thẻ kế tiếp trong ≤ 200 ms.
- Given tôi chấm hết hàng đợi, When thẻ cuối được chấm, Then hệ thống hiển thị tổng kết phiên gồm số thẻ đã ôn.
- Given tôi dùng bàn phím, When tôi lật thẻ và chọn mức chấm bằng phím tắt, Then kết quả giống bấm chuột.

FR liên quan: FR-12, FR-15, FR-17, FR-18. Ưu tiên: Phải có.

### US-07 Quay lại sau khi nghỉ

Là Minh, người hay nghỉ vài ngày, tôi muốn thẻ dồn lại không đổ hết lên một ngày, để không nản khi quay lại.

Tiêu chí chấp nhận:
- Given giới hạn ôn là 100 và tôi có 250 thẻ đến hạn, When tôi mở phiên ôn, Then hàng đợi hôm nay có tối đa 100 thẻ.
- Given 150 thẻ vượt giới hạn, When ngày học kế tiếp bắt đầu, Then các thẻ đó vẫn đến hạn và có trong hàng đợi, không bị xóa.
- Given tôi nghỉ nhiều ngày, When tôi quay lại, Then hệ thống không hiển thị thông báo phạt hay trách móc.

FR liên quan: FR-16, FR-22. Ưu tiên: Phải có.

### US-08 Học kanji qua âm Hán Việt

Là Hùng, tôi muốn thấy âm Hán Việt, nghĩa tiếng Việt, on/kun và từ ví dụ của mỗi kanji, để nhớ mặt chữ qua từ tiếng Việt đã quen.

Tiêu chí chấp nhận:
- Given tôi mở thẻ kanji 学, When thẻ hiển thị, Then tôi thấy chữ, âm Hán Việt, nghĩa tiếng Việt, âm on, âm kun và từ ví dụ lấy từ danh sách từ vựng N5–N4 có chứa kanji đó.
- Given một kanji không có từ vựng N5–N4 nào chứa nó, When thẻ hiển thị, Then tôi thấy "Chưa có từ ví dụ".
- Given một kanji chưa có âm Hán Việt trong dữ liệu, When thẻ hiển thị, Then tôi thấy chữ "Đang bổ sung" thay vì trường trống.
- Given tôi chọn N5, When tôi học kanji mới, Then chỉ có kanji thuộc cấp N5 theo danh sách tanos.
- Given tôi đã học thẻ N5 rồi đổi sang N4, When đến hạn ôn, Then thẻ N5 đã học vẫn xuất hiện; chỉ thẻ mới lấy từ N4.

FR liên quan: FR-14, FR-13, FR-06. Ưu tiên: Phải có.

### US-09 Làm trắc nghiệm ngắn

Là Minh, tôi muốn làm trắc nghiệm 4 lựa chọn về nghĩa và âm Hán Việt, để kiểm tra nhanh mà không làm rối lịch ôn.

Tiêu chí chấp nhận:
- Given tôi đã học ít nhất 10 thẻ nhưng hệ thống tạo được dưới 10 câu hợp lệ, When tôi mở trắc nghiệm, Then hệ thống không mở bài và mời học thêm thẻ.
- Given tôi bắt đầu trắc nghiệm, When câu hỏi hiện ra, Then có đúng 4 lựa chọn, đúng 1 đáp án và không có hai lựa chọn trùng giá trị hiển thị.
- Given tôi trả lời đúng, When tôi chọn đáp án, Then hệ thống báo đúng và cộng 1 XP.
- Given tôi trả lời sai, When tôi chọn đáp án, Then hệ thống báo sai, hiển thị đáp án đúng và không cộng XP.
- Given tôi vừa làm xong một bài trắc nghiệm, When tôi kiểm tra lịch ôn của các thẻ liên quan, Then số bản ghi log ôn và trạng thái FSRS của các thẻ trước và sau bài trắc nghiệm giống hệt nhau.

FR liên quan: FR-19, FR-20, FR-23. Ưu tiên: Phải có.

### US-10 Xem dashboard

Là Lan, tôi muốn thấy ngay hôm nay cần ôn bao nhiêu thẻ và đã học được bao nhiêu, để biết còn việc gì.

Tiêu chí chấp nhận:
- Given tôi đăng nhập, When dashboard tải xong, Then tôi thấy số thẻ đến hạn, tiến độ thẻ mới so với mục tiêu, chuỗi ngày, tổng số ngày đã học và XP.
- Given tôi vừa chấm một thẻ, When tôi quay về dashboard, Then các số liệu phản ánh lượt ôn đó mà không cần tải lại tay.
- Given tôi đã đạt mục tiêu thẻ mới hôm nay, When tôi xem XP, Then tôi thấy đã nhận +5 XP một lần cho ngày đó.

FR liên quan: FR-21, FR-23. Ưu tiên: Phải có.

### US-11 Chuỗi ngày không gây áp lực

Là Minh, tôi muốn xem chuỗi ngày kèm tổng số ngày đã học, để không thấy mất hết khi lỡ một ngày.

Tiêu chí chấp nhận:
- Given tôi có chuỗi 5 ngày, When tôi hoàn thành ít nhất một lượt ôn (học thẻ mới cũng là một lượt ôn) trong ngày học hôm nay, Then hôm nay tính là ngày có học và chuỗi tăng lên.
- Given tôi có chuỗi 5 ngày, hôm qua có học và hôm nay chưa học, When tôi mở app, Then chuỗi vẫn là 5.
- Given tôi đã qua trọn một ngày học không có lượt ôn nào, When tôi mở app, Then chuỗi về 0 và tổng số ngày đã học không giảm.
- Given tôi xem dashboard, When số liệu hiển thị, Then "tổng số ngày đã học" là con số chính, nổi bật hơn chuỗi.
- Given tôi ôn lúc 02:00 sáng theo giờ thiết bị, When hệ thống tính ngày, Then lượt ôn đó tính cho ngày học hôm trước (`study_date`).
- Given tôi đổi múi giờ thiết bị, When hệ thống tính chuỗi, Then các lượt ôn quá khứ giữ nguyên `study_date` đã lưu.
- Given tôi không học, When ngày học trôi qua, Then hệ thống không gửi thông báo đẩy.

FR liên quan: FR-09, FR-22. Ưu tiên: Phải có.

### US-12 Đếm ngược ngày thi

Là Lan, tôi muốn đặt ngày thi và thấy số ngày còn lại, để biết mình còn bao nhiêu thời gian.

Tiêu chí chấp nhận:
- Given tôi đặt ngày thi là 30 ngày sau, When tôi mở dashboard, Then tôi thấy "còn 30 ngày".
- Given tôi chưa đặt ngày thi, When tôi mở dashboard, Then mục đếm ngược không hiển thị.
- Given ngày thi là hôm nay, When tôi mở dashboard, Then tôi thấy "Hôm nay thi".
- Given đã qua ngày thi, When tôi mở dashboard, Then hệ thống mời tôi đặt ngày mới hoặc xóa ngày thi.
- Given tôi nhập ngày trong quá khứ (theo ngày lịch trên thiết bị) khi đặt mới, When tôi lưu, Then hệ thống từ chối và báo lỗi.

FR liên quan: FR-07, FR-24. Ưu tiên: Nên có.

### US-13 Cài app lên điện thoại

Là Lan, tôi muốn cài Nihongo lên màn hình chính, để mở học nhanh như một app.

Tiêu chí chấp nhận:
- Given tôi dùng Chrome trên Android, When tôi truy cập trang qua HTTPS, Then trình duyệt cho phép cài đặt và app mở ở chế độ độc lập sau khi cài.
- Given tôi dùng Safari trên iOS, When tôi mở hướng dẫn cài, Then tôi thấy các bước thêm vào màn hình chính.
- Given Lighthouse chạy kiểm tra PWA trên trang chính, When báo cáo xong, Then mục cài được (installable) đạt.

FR liên quan: FR-25. Ưu tiên: Phải có.

### US-14 Ôn khi mạng chập chờn

Là Lan, tôi muốn ôn tiếp khi mạng đứt giữa chừng và kết quả không bị mất, để học trên xe buýt không lo.

Tiêu chí chấp nhận:
- Given tôi đang ôn và mạng mất, When mất kết nối, Then hệ thống hiển thị thông báo mất mạng và tôi vẫn chấm được các thẻ còn lại của phiên.
- Given tôi đã chấm 5 thẻ khi không có mạng, When mạng trở lại, Then cả 5 lượt ôn được gửi lên và xuất hiện trong log đúng 5 bản ghi.
- Given gửi lại bị lặp do mạng chập chờn, When cùng một lượt ôn được gửi hai lần, Then chỉ có một bản ghi log.
- Given tôi đang offline, When tôi muốn học thẻ mới, Then hệ thống báo cần mạng và không tải thẻ ngoài phiên đã tải.
- Given tôi đóng app khi còn lượt chưa gửi rồi mở lại khi vẫn offline, When tôi đăng nhập cùng tài khoản trong cùng ngày học, Then tôi tiếp tục được phiên đã lưu.
- Given còn lượt chưa gửi của tài khoản A, When tôi đăng nhập tài khoản B, Then lượt của A không bị gửi vào tài khoản B.
- Given tôi đang offline và còn lượt chưa gửi, When tôi chọn đăng xuất, Then hệ thống cảnh báo sẽ mất các lượt đó; nếu tôi vẫn đăng xuất thì dữ liệu cục bộ của tài khoản bị xóa.

FR liên quan: FR-26, FR-27, FR-28, FR-30. Ưu tiên: Phải có.

### US-15 Xóa tài khoản và dữ liệu

Là người học, tôi muốn xóa tài khoản cùng toàn bộ dữ liệu, để làm chủ dữ liệu của mình.

Tiêu chí chấp nhận:
- Given tôi đang đăng nhập, When tôi chọn xóa tài khoản, Then hệ thống nêu rõ dữ liệu sẽ mất và yêu cầu tôi nhập lại mật khẩu để xác nhận trước khi xóa.
- Given tôi nhập sai mật khẩu ở bước xác nhận, When tôi gửi, Then hệ thống báo lỗi và không xóa gì.
- Given tôi xác nhận xóa, When quá trình hoàn tất, Then không còn dòng dữ liệu nào của tôi trong `auth.users` và các bảng người dùng, dữ liệu cục bộ trên thiết bị bị xóa, mọi phiên đăng nhập trên thiết bị khác bị thu hồi và tôi không đăng nhập lại được.
- Given tôi hủy ở bước xác nhận, When tôi quay lại, Then dữ liệu của tôi còn nguyên.

FR liên quan: FR-05, FR-03, FR-30. Ưu tiên: Phải có.

### US-16 Xem nguồn dữ liệu

Là người học quan tâm đến bản quyền, tôi muốn xem dữ liệu từ đâu ra và theo giấy phép nào, để tin tưởng nội dung.

Tiêu chí chấp nhận:
- Given tôi chưa đăng nhập, When tôi mở trang "Nguồn dữ liệu và giấy phép" từ menu, Then trang hiển thị được.
- Given tôi đọc trang, When tôi xem danh sách nguồn, Then tôi thấy các nguồn thực sự được dùng (JMdict, KANJIDIC2, danh sách của Jonathan Waller tại tanos.co.uk, và Tatoeba nếu có đưa vào dữ liệu), kèm giấy phép và ngày tải.
- Given tôi đọc dòng của danh sách tanos, When tôi xem giấy phép, Then tôi thấy "CC BY theo nguồn thứ cấp, chưa đọc được trang gốc".
- Given tôi đọc trang, When tôi xem phần giấy phép, Then tôi thấy dữ liệu dẫn xuất từ JMdict/KANJIDIC2 theo CC BY-SA, tách khỏi giấy phép MIT của mã nguồn.

FR liên quan: FR-29. Ưu tiên: Phải có.

Tổng cộng 16 user story.

## 7. Ma trận truy vết

Bảng này nối mỗi yêu cầu chức năng với user story và use case. Dấu "—" nghĩa là chưa có.

| FR | US | UC |
|---|---|---|
| FR-01 | US-01 | UC-01 |
| FR-02 | US-01, US-02 | UC-01 |
| FR-03 | US-02, US-15 | UC-06 |
| FR-04 | US-02 | — |
| FR-05 | US-15 | UC-06 |
| FR-06 | US-03, US-08 | UC-01, UC-03 |
| FR-07 | US-12 | UC-01 |
| FR-08 | US-05 | UC-01 |
| FR-09 | US-11 | UC-02 |
| FR-10 | US-04 | UC-01 |
| FR-11 | US-03, US-04 | UC-01 |
| FR-12 | US-06 | UC-01, UC-02 |
| FR-13 | US-05, US-08 | UC-01, UC-02, UC-03 |
| FR-14 | US-08 | UC-03 |
| FR-15 | US-04, US-06 | UC-02, UC-03 |
| FR-16 | US-06, US-07 | UC-02 |
| FR-17 | US-06 | UC-02, UC-03, UC-05 |
| FR-18 | US-06 | UC-02, UC-03 |
| FR-19 | US-09 | UC-04 |
| FR-20 | US-09 | UC-04 |
| FR-21 | US-10 | UC-02 |
| FR-22 | US-07, US-11 | UC-02 |
| FR-23 | US-09, US-10 | UC-02, UC-03, UC-04 |
| FR-24 | US-12 | — |
| FR-25 | US-13 | — |
| FR-26 | US-14 | UC-05 |
| FR-27 | US-14 | UC-05 |
| FR-28 | US-14 | UC-03, UC-05 |
| FR-29 | US-16 | — |
| FR-30 | US-14, US-15 | UC-05, UC-06 |

Ghi chú: FR-04, FR-24, FR-25 và FR-29 chưa có use case riêng vì luồng đủ đơn giản, được bao bởi user story và tiêu chí chấp nhận. FR-04 có thể thêm thành luồng thay thế của UC-01 khi thiết kế chi tiết.

## 8. Ngoài phạm vi MVP

Lấy từ `docs/01-vision.md` mục 7, phần "Để sau".

- Ngữ pháp.
- Luyện nghe.
- Đề thi thử tự soạn.
- Bộ thẻ cộng đồng.
- Giao diện đa ngôn ngữ.
- App native (PWA đủ cho MVP).
- Tính năng xã hội, bảng xếp hạng.
- Tính năng AI.
- Từ vựng và kanji N3.
- Bài kiểm tra trình độ đầu vào.
- Ôn offline hoàn toàn (đồng bộ trạng thái FSRS, xử lý xung đột).
- Thu phí, quảng cáo.

Ngoài ra, theo quyết định ở mục 2 của tài liệu này: không đăng nhập bằng mạng xã hội và không thông báo đẩy trong MVP.

## 9. Quyết định chi tiết (17/11/2026)

Các điểm mở khi viết bản nháp đã được chốt và đưa vào yêu cầu tương ứng:

1. **Chọn N4:** thẻ mới chỉ lấy từ N4, không lên lịch N5. Học hết N5 thì đề nghị chuyển N4 (FR-06).
2. **Thứ tự thẻ mới:** kana trước nếu chưa biết; sau đó xen kẽ 1 kanji : 2 từ vựng theo thứ tự danh sách nguồn (FR-13).
3. **Giới hạn và thứ tự trong phiên:** giới hạn 100 chỉ áp cho thẻ đến hạn; thẻ kana mới tính vào mục tiêu thẻ mới; thẻ đến hạn hiển thị trước thẻ mới (FR-13, FR-16).
4. **Bảng kana:** mỗi bộ gồm 46 chữ cơ bản, 25 âm đục và bán đục, 33 âm ghép; mỗi mục là một thẻ (FR-10).
5. **Nhiều âm Hán Việt:** một âm chính (mặc định âm đầu trong KANJIDIC2, sửa tay được), các âm khác hiển thị phụ (FR-14).
6. **Trắc nghiệm:** 10 câu mỗi bài, từ thẻ đã học, đáp án nhiễu cùng loại cùng cấp; mở khi tạo được ít nhất 10 câu hợp lệ (FR-19).
7. **Mật khẩu và liên kết:** mật khẩu tối thiểu 8 ký tự; liên kết xác nhận và đặt lại hết hạn sau 1 giờ; thông báo không tiết lộ email đã đăng ký (FR-01, FR-04).

8. **Dữ liệu cục bộ theo tài khoản:** mọi bản ghi trên thiết bị gắn `user_id`, chỉ gửi khi khớp phiên hiện tại. Đăng xuất khi còn lượt chưa gửi thì cảnh báo, có mạng thì gửi trước, offline mà vẫn đăng xuất thì xóa (chấp nhận mất, ưu tiên riêng tư máy dùng chung). Đăng xuất và xóa tài khoản xóa hết dữ liệu cục bộ, gồm cache service worker (FR-30, FR-03, FR-05).
9. **Chống trùng an toàn:** ràng buộc duy nhất (`user_id`, `review_id`); máy chủ lấy `user_id` từ phiên đăng nhập; từ chối `reviewed_at` muộn hơn máy chủ quá 5 phút hoặc thẻ không tồn tại (FR-27, FR-17, NFR-19).
10. **Thời gian và ngày học:** mỗi lượt ôn lưu `reviewed_at` (UTC) và `study_date` (tính trên thiết bị lúc chấm, mốc 4:00). Chuỗi ngày, số thẻ mới trong ngày và mốc +5 XP theo `study_date`; đổi múi giờ không tính lại quá khứ; lượt offline gửi muộn vẫn theo `study_date` lúc chấm (FR-09, FR-17, FR-22, FR-23).
11. **Chuỗi ngày:** hôm qua có học thì chuỗi giữ nguyên dù hôm nay chưa học; về 0 chỉ khi qua trọn một ngày học không có lượt ôn. Tổng số ngày đã học là con số chính, nổi bật hơn chuỗi. Điều kiện "có học" là có ít nhất một lượt ôn (FR-22, US-11).
12. **Đổi cấp:** thẻ đã học luôn đến hạn dù chọn cấp nào; đổi cấp chỉ đổi nguồn thẻ mới. Hết một loại thẻ mới thì lấy loại còn lại. Đề nghị chuyển cấp khi hết thẻ mới mọi loại (FR-06, FR-13).
13. **Mục tiêu và giới hạn:** thẻ mới 5–30 (mặc định 10), giới hạn ôn 50–500 (mặc định 100). Đổi giữa ngày có hiệu lực ngay; hạ mục tiêu dưới số đã học chỉ ngừng đưa thêm thẻ mới. +5 XP khi số thẻ mới trong ngày ≥ mục tiêu hiện tại, tối đa một lần mỗi ngày học, lưu mốc đã nhận. Bảng kana 208 thẻ, khoảng 21 ngày ở mục tiêu 10 (FR-08, FR-13, US-05).
14. **Trắc nghiệm:** từ → nghĩa, nghĩa → từ (từ vựng); kanji → âm Hán Việt (kanji); không có kana. Câu hỏi từ thẻ đã học; đáp án nhiễu từ toàn bộ bộ thẻ cùng loại, cùng cấp (kể cả chưa học), loại giá trị hiển thị trùng. Mở khi tạo được ít nhất 10 câu hợp lệ. Trắc nghiệm không đổi số log ôn và trạng thái FSRS (FR-19, US-09, UC-04).
15. **Phiên ôn và mất mạng:** đầu phiên tải toàn bộ hàng đợi về thiết bị; lịch FSRS tính ở thiết bị bằng `ts-fsrs` khi chấm; thẻ "Lại" có thể quay lại trong phiên. MVP coi một người ôn trên một thiết bị tại một thời điểm; nếu có hai thiết bị thì log giữ cả hai, trạng thái thẻ theo `reviewed_at` mới hơn. Mở lại offline thì tiếp tục phiên đã lưu nếu cùng tài khoản và cùng ngày học. Thẻ vượt giới hạn giữ nguyên `due`, thẻ quá hạn lâu nhất chọn trước (FR-15, FR-16, FR-18, FR-27, FR-28, UC-05).
16. **Email và đăng nhập:** tài khoản chưa xác nhận nhận cùng lỗi chung như sai thông tin, kèm liên kết "Chưa nhận email xác nhận?"; gửi lại luôn cùng một thông báo. Có giới hạn tần suất cho đăng ký, đăng nhập, gửi lại email, quên mật khẩu theo Supabase Auth (FR-02, NFR-24).
17. **Xóa tài khoản:** nhập lại mật khẩu để xác nhận; xóa chạy phía máy chủ (service role chỉ ở máy chủ); dữ liệu xóa theo khóa ngoại khi xóa `auth.users`; thu hồi mọi phiên. Giới hạn: bản sao lưu của Supabase còn giữ dữ liệu đến khi hết hạn theo chu kỳ của nhà cung cấp (FR-05, UC-06, NFR-17).
18. **Phát hiện mất mạng:** mất mạng khi trình duyệt báo offline hoặc một yêu cầu không phản hồi trong 10 giây; gửi lại tự động với khoảng chờ tăng dần (FR-26, FR-27).
19. **Giám sát và chỉ số:** mỗi lượt ôn gắn `session_id` để đo thời gian phiên (lượt cuối trừ lượt đầu). Sentry chỉ ghi lỗi, không gửi email, nội dung thẻ, dữ liệu ôn; tắt session replay. Chỉ dùng cookie và lưu trữ cần cho đăng nhập (FR-17, NFR-15, NFR-16, NFR-25).
20. **Thẻ mới:** học thẻ mới là lượt ôn đầu tiên: chấm 4 mức, khởi tạo trạng thái FSRS, ghi log, +1 XP (FR-13, FR-15, FR-23, UC-03).
21. **Dữ liệu nội dung:** từ ví dụ của kanji lấy từ danh sách từ vựng N5–N4 của dự án; không có thì hiển thị "Chưa có từ ví dụ". Câu Tatoeba chỉ dùng nếu đưa vào dữ liệu; FR-29 chỉ liệt kê nguồn thực sự dùng và nêu dữ liệu JMdict/KANJIDIC2 theo CC BY-SA, tách khỏi MIT của mã nguồn. Danh sách tanos ghi "CC BY theo nguồn thứ cấp, chưa đọc được trang gốc" (FR-12, FR-14, FR-29, NFR-23, mục 2.6).
22. **Chi tiết khác:** ngày thi là hôm nay hiển thị "Hôm nay thi", "quá khứ" tính theo ngày lịch trên thiết bị (FR-07, FR-24, US-12); kanji thiếu âm Hán Việt hiển thị "Đang bổ sung" (FR-14); "thiết bị thử" của NFR-03 là Chrome DevTools giả lập CPU chậm 4 lần; phím tắt phiên ôn là Space và 1, 2, 3, 4 (NFR-06); danh sách trang duyệt tay cho WCAG (NFR-04); RLS có `USING` và `WITH CHECK` cho bảng ghi trực tiếp (NFR-12); test chạy trong CI cho mỗi lần push mọi nhánh (NFR-21).

23. **Đối chiếu kiến trúc (18/11/2026):** "đến hạn hôm nay" tính đến cuối ngày học (mục 1.3); RLS bảng dữ liệu học chỉ đọc, ghi qua hàm máy chủ (NFR-12); máy chủ kiểm `study_date` và tự suy thẻ mới (FR-27); trắc nghiệm cần mạng ở MVP (FR-19); NFR-15 kể rõ dữ liệu trắc nghiệm. Xem `docs/04-architecture.md`.

Không còn điểm CẦN QUYẾT.
