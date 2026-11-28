/**
 * Dựng danh sách thẻ của một phiên ôn (FR-13, FR-16) từ kết quả RPC `get_today_queue`.
 * Hàm thuần: không đọc đồng hồ hay mạng.
 */

export type CardKind = "kana" | "vocab" | "kanji" | "grammar";

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

export interface GrammarExample {
  ja: string;
  ruby: string;
  vi: string;
}

export interface GrammarExercise {
  type: "cloze";
  prompt_ja: string;
  answer: string;
  choices: string[];
  vi: string;
}

/** Chi tiết thẻ ngữ pháp (cột của `grammar_details` trừ `card_id`). */
export interface GrammarCardDetails {
  point_id: string;
  level: "N5" | "N4";
  sort: number;
  title: string;
  pattern: string;
  meaning_vi: string;
  explanation: { heading?: string; body: string }[];
  notes: string[];
  examples: GrammarExample[];
  exercises: GrammarExercise[];
}

export type CardDetails = KanaDetails | VocabDetails | KanjiDetails | GrammarCardDetails;

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

/** JSON của `get_today_queue`. `new_candidates` là mảng phẳng đã sắp kana, kanji, vocab, grammar (mỗi loại theo sort_order). */
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

/** Còn hiragana nhóm cơ bản chưa học: ứng viên kana đầu tiên (đã theo sort_order) là hiragana `basic`. */
function hasBasicHiraganaLeft(kana: readonly NewCandidate[]): boolean {
  const d = kana[0]?.details as KanaDetails | null | undefined;
  return d?.script === "hira" && d.grp === "basic";
}

type Slot = "kana" | "kanji" | "vocab" | "grammar";

/**
 * Thẻ đến hạn trước (giữ thứ tự đầu vào), rồi thẻ mới: tối đa `newPerDay - newDoneToday` (FR-13).
 * - Chưa biết kana, còn hiragana cơ bản: thẻ mới chỉ là kana.
 * - Chưa biết kana, hết hiragana cơ bản: xen theo chu kỳ 1 kana, 1 kanji, 2 vocab, 1 grammar.
 * - Đã biết kana: bỏ kana, chu kỳ 1 kanji, 2 vocab, 1 grammar.
 * Loại nào hết thì bỏ qua trong chu kỳ. Thứ tự trong từng loại giữ nguyên như máy chủ trả (sort_order).
 */
export function buildSession(input: BuildSessionInput): SessionCard[] {
  const session: SessionCard[] = input.due.map((d) => ({ ...d, isNew: false }));

  let left = remainingNew(input.newPerDay, input.newDoneToday);
  const pools: Record<Slot, NewCandidate[]> = { kana: [], kanji: [], vocab: [], grammar: [] };
  for (const c of input.newCandidates) {
    if (c.card.kind === "kana") {
      if (!input.knowsKana) pools.kana.push(c);
    } else pools[c.card.kind].push(c);
  }

  const kanaOnly = !input.knowsKana && hasBasicHiraganaLeft(pools.kana);
  const cycle: Slot[] = kanaOnly
    ? ["kana"]
    : input.knowsKana
      ? ["kanji", "vocab", "vocab", "grammar"]
      : ["kana", "kanji", "vocab", "vocab", "grammar"];

  const next: Record<Slot, number> = { kana: 0, kanji: 0, vocab: 0, grammar: 0 };
  const pickedNew: NewCandidate[] = [];
  while (left > 0 && cycle.some((slot) => next[slot] < pools[slot].length)) {
    for (const slot of cycle) {
      if (left <= 0) break;
      if (next[slot] >= pools[slot].length) continue;
      pickedNew.push(pools[slot][next[slot]++]);
      left--;
    }
  }

  for (const c of pickedNew) session.push({ ...c, state: null, isNew: true });
  return session;
}
