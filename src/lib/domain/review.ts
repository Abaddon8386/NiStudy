import { grade, newCardState, type CardState, type FsrsRating } from "./fsrs";
import { studyDate } from "./study-day";

/** Trạng thái thẻ dạng JSON gửi `submit_reviews`; tên khóa = tên cột `card_states`. */
export interface CardStateJson {
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

/** Một phần tử của `p_reviews` (docs/04-architecture.md mục 6.2). */
export interface ReviewPayload {
  review_id: string;
  card_id: string;
  rating: FsrsRating;
  reviewed_at: string;
  study_date: string;
  session_id: string;
  state_before: CardStateJson;
  state_after: CardStateJson;
}

export function cardStateToJson(s: CardState): CardStateJson {
  return {
    due: s.due.toISOString(),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? s.last_review.toISOString() : null,
  };
}

/** Đọc lại JSON của `card_states` (từ RPC hoặc IndexedDB) thành `CardState`. */
export function cardStateFromJson(j: CardStateJson): CardState {
  return {
    due: new Date(j.due),
    stability: j.stability,
    difficulty: j.difficulty,
    elapsed_days: j.elapsed_days,
    scheduled_days: j.scheduled_days,
    learning_steps: j.learning_steps,
    reps: j.reps,
    lapses: j.lapses,
    state: j.state,
    last_review: j.last_review ? new Date(j.last_review) : null,
  };
}

export interface BuildReviewInput {
  cardId: string;
  /** null với thẻ mới. */
  stateBefore: CardState | null;
  rating: FsrsRating;
  now: Date;
  sessionId: string;
  timeZone: string;
  /** Chỉ để test; mặc định `crypto.randomUUID()`. */
  reviewId?: string;
}

/**
 * Chấm một thẻ: trả payload cho `submit_reviews` và trạng thái mới để dùng ngay trên thiết bị.
 * `study_date` tính theo giờ thiết bị lúc chấm (FR-09).
 */
export async function buildReview(
  input: BuildReviewInput,
): Promise<{ payload: ReviewPayload; nextState: CardState }> {
  const before = input.stateBefore ?? newCardState(input.now);
  const { state: after } = await grade(before, input.rating, input.now);
  return {
    nextState: after,
    payload: {
      review_id: input.reviewId ?? crypto.randomUUID(),
      card_id: input.cardId,
      rating: input.rating,
      reviewed_at: input.now.toISOString(),
      study_date: studyDate(input.now, input.timeZone),
      session_id: input.sessionId,
      state_before: cardStateToJson(before),
      state_after: cardStateToJson(after),
    },
  };
}
