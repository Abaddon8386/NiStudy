import type { QuizCard } from "@/lib/domain/quiz";
import { studyDate } from "@/lib/domain/study-day";
import { createClient } from "@/lib/supabase/client";
import { deviceTimeZone } from "./api";

/** Quá hạn này coi là mất mạng (FR-26). */
export const QUIZ_LOAD_TIMEOUT_MS = 10_000;
const PAGE = 1000;

export type QuizData = { learned: QuizCard[]; pool: QuizCard[] };
export type QuizLoadResult = { ok: true; data: QuizData } | { ok: false };

interface CardRow {
  id: string;
  kind: string;
  level: string | null;
}
interface VocabRow {
  card_id: string;
  word: string | null;
  reading: string | null;
  meaning_vi: string | null;
}
interface KanjiRow {
  card_id: string;
  kanji: string | null;
  han_viet_main: string | null;
  meaning_vi: string | null;
}

/** Đọc hết một bảng theo trang (PostgREST mặc định tối đa 1000 hàng mỗi yêu cầu). */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error instanceof Error ? error : new Error("query-failed");
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

async function loadAll(): Promise<QuizData> {
  const db = createClient();
  const [states, cards, vocab, kanji] = await Promise.all([
    fetchAll<{ card_id: string }>((a, b) => db.from("card_states").select("card_id").order("card_id").range(a, b)),
    fetchAll<CardRow>((a, b) =>
      db.from("cards").select("id,kind,level").eq("published", true).in("kind", ["vocab", "kanji"]).order("id").range(a, b),
    ),
    fetchAll<VocabRow>((a, b) =>
      db.from("vocab_details").select("card_id,word,reading,meaning_vi").order("card_id").range(a, b),
    ),
    fetchAll<KanjiRow>((a, b) =>
      db.from("kanji_details").select("card_id,kanji,han_viet_main,meaning_vi").order("card_id").range(a, b),
    ),
  ]);
  const vById = new Map(vocab.map((r) => [r.card_id, r]));
  const kById = new Map(kanji.map((r) => [r.card_id, r]));
  const pool: QuizCard[] = [];
  for (const c of cards) {
    if (c.kind === "vocab") {
      const d = vById.get(c.id);
      pool.push({
        id: c.id,
        kind: "vocab",
        level: c.level,
        text: d?.word ?? null,
        reading: d?.reading ?? null,
        meaningVi: d?.meaning_vi ?? null,
        hanViet: null,
      });
    } else if (c.kind === "kanji") {
      const d = kById.get(c.id);
      pool.push({
        id: c.id,
        kind: "kanji",
        level: c.level,
        text: d?.kanji ?? null,
        reading: null,
        meaningVi: d?.meaning_vi ?? null,
        hanViet: d?.han_viet_main ?? null,
      });
    }
  }
  const learnedIds = new Set(states.map((s) => s.card_id));
  return { pool, learned: pool.filter((c) => learnedIds.has(c.id)) };
}

/** Tải dữ liệu trắc nghiệm; lỗi hoặc quá 10 giây là `ok: false` (coi như mất mạng, FR-26). */
export async function loadQuizData(): Promise<QuizLoadResult> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), QUIZ_LOAD_TIMEOUT_MS);
    });
    return { ok: true, data: await Promise.race([loadAll(), timeout]) };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

export type SubmitQuizStatus = "accepted" | "duplicate";

/** Gửi kết quả; idempotent theo (user, quizId). Ném lỗi khi thất bại để người dùng thử lại. */
export async function submitQuiz(quizId: string, correct: number, now: Date = new Date()): Promise<SubmitQuizStatus> {
  const { data, error } = await createClient().rpc("submit_quiz", {
    p_quiz_id: quizId,
    p_study_date: studyDate(now, deviceTimeZone()),
    p_correct: correct,
  });
  if (error) throw new Error(error.message);
  if (data !== "accepted" && data !== "duplicate") throw new Error("bad-response");
  return data;
}
