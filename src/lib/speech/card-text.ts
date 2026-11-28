import { fillCloze, pickExercise } from "@/components/grammar/pick-exercise";
import type { GrammarCardDetails, KanaDetails, KanjiDetails, SessionCard, VocabDetails } from "@/lib/domain/queue";
import { rubyToReading } from "@/ui/ruby-parse";

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
    case "grammar": {
      // Câu hoàn chỉnh của bài tập đang hiện (cùng seed với mặt thẻ), không có thì ví dụ đầu.
      const g = d as GrammarCardDetails;
      const ex = pickExercise(card.card.id, card.state?.reps ?? 0, g.exercises ?? []);
      if (ex) return fillCloze(ex.prompt_ja, ex.answer);
      const e = g.examples?.[0];
      return e ? rubyToReading(e.ruby || e.ja) || null : null;
    }
    default:
      return (d as KanjiDetails).examples?.[0]?.reading || null;
  }
}
