/** XP (FR-23): +1 mỗi lượt ôn, +1 mỗi câu trắc nghiệm đúng, +5 mỗi mốc thưởng ngày. */

export const BONUS_XP = 5;

export type XpInput = {
  reviewDates: readonly string[];
  quizzes: readonly { studyDate: string; correct: number }[];
  bonusDates: readonly string[];
};

export function computeXp(input: XpInput, today: string): { total: number; today: number } {
  const sum = (onlyToday: boolean) => {
    const keep = (d: string) => !onlyToday || d === today;
    return (
      input.reviewDates.filter(keep).length +
      input.quizzes.filter((q) => keep(q.studyDate)).reduce((a, q) => a + q.correct, 0) +
      BONUS_XP * input.bonusDates.filter(keep).length
    );
  };
  return { total: sum(false), today: sum(true) };
}
