import type { CardStateJson } from "./review";
import type { SessionCard } from "./queue";
import type { FsrsRating } from "./fsrs";

/** Một lượt chấm đã xong trong phiên (để tổng kết). */
export interface SessionResult {
  cardId: string;
  rating: FsrsRating;
  /** Lượt ôn đầu tiên của thẻ mới (không tính bản "Lại" xếp lại cuối phiên). */
  isNew: boolean;
}

export interface SessionState {
  cards: SessionCard[];
  /** Vị trí thẻ đang hiện; bằng `cards.length` khi hết phiên. */
  index: number;
  /** Thẻ đã được xếp lại một lần sau khi chấm "Lại" (FR-18). */
  requeued: string[];
  results: SessionResult[];
}

export function startSession(cards: SessionCard[]): SessionState {
  return { cards, index: 0, requeued: [], results: [] };
}

export function currentCard(s: SessionState): SessionCard | null {
  return s.cards[s.index] ?? null;
}

export function isFinished(s: SessionState): boolean {
  return s.index >= s.cards.length;
}

/**
 * Ghi kết quả thẻ hiện tại rồi sang thẻ kế. Chấm "Lại" lần đầu của một thẻ thì đưa thẻ đó
 * (kèm trạng thái FSRS mới) xuống cuối phiên đúng một lần; lần "Lại" thứ hai không xếp nữa.
 * Hàm thuần: không đổi `s`.
 */
export function advance(s: SessionState, rating: FsrsRating, nextState: CardStateJson): SessionState {
  const card = currentCard(s);
  if (!card) return s;
  const results = [...s.results, { cardId: card.card.id, rating, isNew: card.isNew }];
  let cards = s.cards;
  let requeued = s.requeued;
  if (rating === 1 && !requeued.includes(card.card.id)) {
    cards = [...cards, { ...card, state: nextState, isNew: false }];
    requeued = [...requeued, card.card.id];
  }
  return { cards, index: s.index + 1, requeued, results };
}

export interface SessionSummary {
  total: number;
  newCards: number;
  byRating: Record<FsrsRating, number>;
}

export function summarize(results: readonly SessionResult[]): SessionSummary {
  const byRating: Record<FsrsRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let newCards = 0;
  for (const r of results) {
    byRating[r.rating]++;
    if (r.isNew) newCards++;
  }
  return { total: results.length, newCards, byRating };
}
