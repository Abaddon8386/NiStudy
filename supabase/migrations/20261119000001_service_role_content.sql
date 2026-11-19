-- Project tắt tự cấp quyền API cho bảng mới, nên service_role (script import dữ liệu,
-- chạy trên máy chủ dự án) cũng phải được cấp rõ. Chỉ bảng nội dung; bảng học vẫn
-- chỉ ghi qua RPC (ADR-0003).
grant select, insert, update, delete on public.cards, public.kana_details,
  public.vocab_details, public.kanji_details, public.data_sources to service_role;
