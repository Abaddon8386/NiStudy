import { DefaultScheduler } from "ts-fsrs";

/**
 * Bọc `ts-fsrs` (ADR-0002). Hàm thuần: giờ là tham số, không đọc đồng hồ hệ thống.
 * Kiểu `CardState` khớp các cột bảng `card_states` (docs/04-architecture.md mục 5).
 *
 * ts-fsrs 6.x đổi API: thẻ dùng tên camelCase (dueAt, lastReviewAt, learningStep,
 * scheduledDays), không còn `elapsed_days`, và bộ lên lịch mặc định là FSRS-7
 * (thêm `stabilityFast`). Ở đây dùng FSRS-6, vì cột `card_states` không có
 * `stability_fast`; xem báo cáo giai đoạn 4.
 */

export type FsrsRating = 1 | 2 | 3 | 4; // Lại, Khó, Được, Dễ

/** 0 = Mới, 1 = Đang học, 2 = Ôn tập, 3 = Học lại (như `ts-fsrs` State). */
export type FsrsStateCode = 0 | 1 | 2 | 3;

export interface CardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: FsrsStateCode;
  last_review: Date | null;
}

export interface ReviewLogEntry {
  rating: FsrsRating;
  state_before: FsrsStateCode;
  state_after: FsrsStateCode;
  reviewed_at: Date;
  elapsed_days: number;
  scheduled_days: number;
}

const MS_PER_DAY = 86_400_000;

let schedulerPromise: ReturnType<typeof DefaultScheduler<"FSRS-6">> | undefined;
function getScheduler() {
  schedulerPromise ??= DefaultScheduler({ version: "FSRS-6" });
  return schedulerPromise;
}

/** Thẻ chưa học: đến hạn ngay tại `now`. */
export function newCardState(now: Date): CardState {
  return {
    due: new Date(now.getTime()),
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    last_review: null,
  };
}

/** ts-fsrs gộp Đang học và Học lại thành trạng thái lịch "learning". */
function scheduleStatus(state: FsrsStateCode) {
  return (["new", "learning", "review", "learning"] as const)[state];
}

export async function grade(
  state: CardState,
  rating: FsrsRating,
  now: Date,
): Promise<{ state: CardState; log: ReviewLogEntry }> {
  const scheduler = await getScheduler();
  const elapsedDays =
    state.last_review === null
      ? 0
      : Math.max(0, Math.floor((now.getTime() - state.last_review.getTime()) / MS_PER_DAY));

  const result = scheduler.review({
    card: {
      stability: state.stability,
      difficulty: state.difficulty,
      state: state.state,
      scheduleStatus: scheduleStatus(state.state),
      dueAt: state.due,
      lastReviewAt: state.last_review,
      cardId: "card",
      reps: state.reps,
      lapses: state.lapses,
      scheduledDays: state.scheduled_days,
      learningStep: state.learning_steps,
    },
    now,
    grade: rating,
  });

  const c = result.card;
  return {
    state: {
      due: new Date(c.dueAt.getTime()),
      stability: c.stability,
      difficulty: c.difficulty,
      elapsed_days: elapsedDays,
      scheduled_days: c.scheduledDays,
      learning_steps: c.learningStep,
      reps: c.reps,
      lapses: c.lapses,
      state: c.state as FsrsStateCode,
      last_review: new Date(now.getTime()),
    },
    log: {
      rating,
      state_before: state.state,
      state_after: c.state as FsrsStateCode,
      reviewed_at: new Date(now.getTime()),
      elapsed_days: elapsedDays,
      scheduled_days: c.scheduledDays,
    },
  };
}
