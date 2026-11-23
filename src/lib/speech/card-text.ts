import type { KanaDetails, KanjiDetails, SessionCard, VocabDetails } from "@/lib/domain/queue";

/**
 * Văn bản cho TTS khi lật thẻ: luôn là kana/cách đọc để TTS không đọc sai kanji.
 * Kanji đơn không phát; lấy cách đọc của từ ví dụ đầu tiên. Không có gì để phát thì trả null.
 */
export function speechTextForCard(card: SessionCard): string | null {
  const d = card.details;
  if (!d) return null;
  switch (card.card.kind) {
    case "kana":
      return (d as KanaDetails).kana || null;
    case "vocab": {
      const v = d as VocabDetails;
      return v.reading || v.word || null;
    }
    default:
      return (d as KanjiDetails).examples?.[0]?.reading || null;
  }
}
