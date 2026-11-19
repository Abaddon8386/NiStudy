/**
 * Trắc nghiệm (FR-19, FR-20): dựng câu hỏi từ thẻ đã học và đáp án nhiễu từ bộ thẻ cùng loại, cùng cấp.
 * Hàm thuần: dữ liệu và bộ sinh số ngẫu nhiên là tham số, không gọi mạng.
 */

export const QUIZ_LENGTH = 10;
const OPTION_COUNT = 4;

export type QuizKind = "vocab" | "kanji";
export type QuestionType = "vocab-meaning" | "vocab-word" | "kanji-hanviet";

/** Thẻ vocab/kanji đã ghép chi tiết; giá trị thiếu là null. */
export interface QuizCard {
  id: string;
  kind: QuizKind;
  level: string | null;
  /** vocab: `word`; kanji: chữ kanji. */
  text: string | null;
  /** vocab: cách đọc. */
  reading: string | null;
  /** vocab: `meaning_vi`. */
  meaningVi: string | null;
  /** kanji: `han_viet_main`. */
  hanViet: string | null;
}

export interface QuizQuestion {
  cardId: string;
  type: QuestionType;
  /** Chữ hiển thị làm đề (kanji, từ, hoặc nghĩa). */
  prompt: string;
  /** Cách đọc nhỏ dưới đề (chỉ dạng từ → nghĩa). */
  promptReading: string | null;
  promptIsJapanese: boolean;
  optionsAreJapanese: boolean;
  options: string[];
  correctIndex: number;
}

export type BuildQuizResult =
  | { ok: true; questions: QuizQuestion[] }
  | { ok: false; reason: "not-enough"; available: number };

export type Rng = () => number;

const clean = (s: string | null | undefined) => (s ?? "").normalize("NFC").trim();
const key = (s: string) => s.toLowerCase();

function shuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Giá trị hiển thị làm lựa chọn của thẻ theo dạng câu; null nếu thiếu. */
function optionValue(card: QuizCard, type: QuestionType): string | null {
  const v =
    type === "vocab-meaning" ? card.meaningVi : type === "vocab-word" ? card.text : card.hanViet?.toUpperCase();
  const c = clean(v);
  return c === "" ? null : c;
}

function promptValue(card: QuizCard, type: QuestionType): string | null {
  const c = clean(type === "vocab-word" ? card.meaningVi : card.text);
  return c === "" ? null : c;
}

function typesFor(card: QuizCard): QuestionType[] {
  return card.kind === "vocab" ? ["vocab-meaning", "vocab-word"] : ["kanji-hanviet"];
}

function buildQuestion(card: QuizCard, pool: readonly QuizCard[], rng: Rng): QuizQuestion | null {
  for (const type of shuffle(typesFor(card), rng)) {
    const correct = optionValue(card, type);
    const prompt = promptValue(card, type);
    if (correct === null || prompt === null) continue;

    const seen = new Set([key(correct)]);
    const distractors: string[] = [];
    const candidates = pool.filter((p) => p.id !== card.id && p.kind === card.kind && p.level === card.level);
    for (const c of shuffle(candidates, rng)) {
      const v = optionValue(c, type);
      if (v === null || seen.has(key(v))) continue;
      seen.add(key(v));
      distractors.push(v);
      if (distractors.length === OPTION_COUNT - 1) break;
    }
    if (distractors.length < OPTION_COUNT - 1) continue;

    const options = shuffle([correct, ...distractors], rng);
    return {
      cardId: card.id,
      type,
      prompt,
      promptReading: type === "vocab-meaning" && clean(card.reading) !== "" ? clean(card.reading) : null,
      promptIsJapanese: type !== "vocab-word",
      optionsAreJapanese: type === "vocab-word",
      options,
      correctIndex: options.indexOf(correct),
    };
  }
  return null;
}

/**
 * Dựng bài `QUIZ_LENGTH` câu từ thẻ đã học, mỗi thẻ tối đa một câu.
 * Không đủ câu hợp lệ thì trả số câu hiện tạo được (FR-19).
 */
export function buildQuiz(learned: readonly QuizCard[], pool: readonly QuizCard[], rng: Rng): BuildQuizResult {
  const questions: QuizQuestion[] = [];
  const done = new Set<string>();
  for (const card of shuffle(learned, rng)) {
    if (done.has(card.id)) continue;
    done.add(card.id);
    const q = buildQuestion(card, pool, rng);
    if (q) questions.push(q);
    if (questions.length === QUIZ_LENGTH) return { ok: true, questions };
  }
  return { ok: false, reason: "not-enough", available: questions.length };
}

export interface QuizScore {
  correct: number;
  total: number;
  /** Câu sai theo thứ tự làm bài, kèm lựa chọn của người dùng (null nếu bỏ trống). */
  wrong: { question: QuizQuestion; chosen: number | null }[];
}

/** `answers[i]` là chỉ số lựa chọn của câu i (null: chưa trả lời, tính là sai). */
export function scoreQuiz(questions: readonly QuizQuestion[], answers: readonly (number | null)[]): QuizScore {
  const wrong: QuizScore["wrong"] = [];
  let correct = 0;
  questions.forEach((q, i) => {
    const a = answers[i] ?? null;
    if (a === q.correctIndex) correct++;
    else wrong.push({ question: q, chosen: a });
  });
  return { correct, total: questions.length, wrong };
}
