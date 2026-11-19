/**
 * Dựng danh sách thẻ của một phiên ôn (FR-13, FR-16) từ kết quả RPC `get_today_queue`.
 * Hàm thuần: không đọc đồng hồ hay mạng.
 */

export type CardKind = "kana" | "vocab" | "kanji";

export interface QueueCard {
  id: string;
  kind: CardKind;
  level: "N5" | "N4" | null;
}

export interface KanaDetails {
  script: "hira" | "kata";
  kana: string;
  romaji: string;
  grp: "basic" | "dakuten" | "yoon";
}

export interface VocabDetails {
  jmdict_seq: number;
  word: string;
  reading: string;
  meaning_vi: string | null;
  example_ja: string | null;
  example_vi: string | null;
  tatoeba_id: number | null;
}

export interface KanjiExample {
  word: string;
  reading: string;
  meaning_vi: string | null;
}

export interface KanjiDetails {
  kanji: string;
  han_viet_main: string | null;
  han_viet_other: string[];
  han_viet_source: "kanjidic2" | "manual" | null;
  meaning_vi: string | null;
  on_readings: string[];
  kun_readings: string[];
  examples: KanjiExample[];
}

export type CardDetails = KanaDetails | VocabDetails | KanjiDetails;

/** Một dòng `card_states` dạng JSON do RPC trả (không có user_id, card_id). */
export interface CardStateRow {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;
  last_review: string | null;
}

export interface NewCandidate {
  card: QueueCard;
  details: CardDetails | null;
}

export interface DueItem extends NewCandidate {
  state: CardStateRow;
}

/** JSON của `get_today_queue`. `new_candidates` là mảng phẳng đã sắp kana, kanji, vocab (mỗi loại theo sort_order). */
export interface TodayQueue {
  due: DueItem[];
  new_done_today: number;
  new_candidates: NewCandidate[];
}

export interface SessionCard extends NewCandidate {
  /** null với thẻ mới: client dùng `newCardState`. */
  state: CardStateRow | null;
  isNew: boolean;
}

export interface BuildSessionInput {
  due: readonly DueItem[];
  newCandidates: readonly NewCandidate[];
  newDoneToday: number;
  newPerDay: number;
  knowsKana: boolean;
}

/** Số thẻ mới còn được học hôm nay. */
export function remainingNew(newPerDay: number, newDoneToday: number): number {
  return Math.max(0, Math.floor(newPerDay) - Math.floor(newDoneToday));
}

/**
 * Thẻ đến hạn trước (giữ thứ tự đầu vào), rồi thẻ mới: tối đa `newPerDay - newDoneToday`.
 * Chưa biết kana thì kana trước; sau đó xen 1 kanji : 2 vocab, loại nào hết thì lấy loại còn lại.
 * Thứ tự trong từng loại giữ nguyên như máy chủ trả (đã theo sort_order).
 */
export function buildSession(input: BuildSessionInput): SessionCard[] {
  const session: SessionCard[] = input.due.map((d) => ({ ...d, isNew: false }));

  let left = remainingNew(input.newPerDay, input.newDoneToday);
  const kana: NewCandidate[] = [];
  const kanji: NewCandidate[] = [];
  const vocab: NewCandidate[] = [];
  for (const c of input.newCandidates) {
    if (c.card.kind === "kana") {
      if (!input.knowsKana) kana.push(c);
    } else if (c.card.kind === "kanji") kanji.push(c);
    else vocab.push(c);
  }

  const pickedNew: NewCandidate[] = [];
  for (const c of kana) {
    if (left <= 0) break;
    pickedNew.push(c);
    left--;
  }

  let k = 0;
  let v = 0;
  while (left > 0 && (k < kanji.length || v < vocab.length)) {
    // Mẫu một vòng: kanji, vocab, vocab.
    for (const slot of ["kanji", "vocab", "vocab"] as const) {
      if (left <= 0) break;
      const takeKanji = slot === "kanji" ? k < kanji.length : v >= vocab.length && k < kanji.length;
      if (takeKanji) {
        pickedNew.push(kanji[k++]);
        left--;
      } else if (v < vocab.length) {
        pickedNew.push(vocab[v++]);
        left--;
      }
    }
  }

  for (const c of pickedNew) session.push({ ...c, state: null, isNew: true });
  return session;
}
