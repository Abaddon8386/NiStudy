"use client";

import { useEffect, useState } from "react";
import { rubyToReading } from "@/ui/ruby-parse";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { Notice } from "@/ui/Notice";
import { Ruby } from "@/ui/Ruby";
import { SectionTitle } from "@/ui/SectionTitle";
import { SpeakButton } from "@/ui/SpeakButton";
import { Cloze } from "./cloze";
import type { GrammarExercise } from "@/lib/domain/queue";
import { getGrammar, listGrammar, type GrammarDetails, type GrammarListItem } from "@/lib/learning/grammar";
import { fillCloze, shuffleChoices } from "./pick-exercise";

const wrap = "flex flex-col px-4 pt-4 pb-8 lg:px-10 lg:pt-10";

/** Luyện tập tại chỗ: không vào FSRS, không gọi RPC. */
function Practice({ pointId, exercises }: { pointId: string; exercises: GrammarExercise[] }) {
  const [picked, setPicked] = useState<(string | null)[]>(() => exercises.map(() => null));
  const done = picked.every((p) => p !== null);
  const correct = picked.filter((p, i) => p === exercises[i].answer).length;

  return (
    <section aria-labelledby="g-practice" className="mt-10">
      <SectionTitle id="g-practice">Luyện tập</SectionTitle>
      <ol className="m-0 mt-4 flex list-none flex-col gap-4 p-0">
        {exercises.map((ex, i) => {
          const sel = picked[i];
          const right = sel === ex.answer;
          return (
            <li key={i}>
              <Card tone="sand" className="flex flex-col gap-3">
                <p className="text-[14px] font-bold text-ink-2">Câu {i + 1}</p>
                <p className="text-[22px] leading-[2] [overflow-wrap:anywhere]">
                  <Cloze prompt={ex.prompt_ja} fill={sel !== null && right ? ex.answer : undefined} />
                </p>
                <p className="text-base text-ink-2">{ex.vi}</p>
                <div role="group" aria-label={`Đáp án câu ${i + 1}`} className="grid grid-cols-2 gap-2">
                  {shuffleChoices(`${pointId}:${i}`, ex.choices).map((c) => {
                    const isSel = sel === c;
                    const isAns = c === ex.answer;
                    const state =
                      sel === null
                        ? "bg-paper hover:bg-hair"
                        : isAns
                          ? "bg-paper outline-4 outline-good"
                          : isSel
                            ? "bg-paper outline-4 outline-bad"
                            : "bg-paper opacity-60";
                    return (
                      <button
                        key={c}
                        type="button"
                        lang="ja"
                        disabled={sel !== null}
                        aria-pressed={isSel}
                        onClick={() => setPicked((p) => p.map((v, k) => (k === i ? c : v)))}
                        className={`press font-jp min-h-12 rounded-full border-2 border-ink px-3 text-[20px] font-medium ${state}`}
                      >
                        {sel !== null && isAns ? "✓ " : sel !== null && isSel ? "✕ " : ""}
                        {c}
                      </button>
                    );
                  })}
                </div>
                <div aria-live="polite">
                  {sel !== null ? (
                    right ? (
                      <p className="text-base font-bold text-good">✓ Đúng</p>
                    ) : (
                      <p className="text-base font-bold text-bad">
                        ✕ Sai. Đáp án:{" "}
                        <span lang="ja" className="font-jp">
                          {fillCloze(ex.prompt_ja, ex.answer)}
                        </span>
                      </p>
                    )
                  ) : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      <div aria-live="polite" className="mt-4">
        {done ? (
          <Card tone="hero" className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[24px] leading-[1.2] font-extrabold">
              Đúng {correct}/{exercises.length} câu
            </p>
            <Button variant="onHero" onClick={() => setPicked(exercises.map(() => null))}>
              Làm lại
            </Button>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function Body({ point, prev, next }: { point: GrammarDetails; prev: GrammarListItem | null; next: GrammarListItem | null }) {
  const [hideRuby, setHideRuby] = useState(false);
  return (
    <main id="noi-dung" tabIndex={-1} className={wrap}>
      <Button href="/ngu-phap" variant="ghost" className="-ml-4 mb-1 self-start">
        <span aria-hidden="true">←</span>
        Về danh sách
      </Button>
      <div className="mx-auto w-full lg:max-w-[760px]">
        <div className="rounded-[28px] bg-teal p-6 text-white lg:p-8">
          <p className="text-[14px] font-bold tracking-wide">
            {point.level} · Bài {point.sort}
          </p>
          <h1 lang="ja" className="font-jp mt-1 text-[32px] leading-[1.25] font-extrabold [overflow-wrap:anywhere] lg:text-[40px]">
            {point.title}
          </h1>
          <p
            lang="ja"
            className="font-kanji mt-3 inline-block rounded-2xl bg-white/15 px-4 py-2 text-[24px] leading-[1.4] font-semibold [overflow-wrap:anywhere]"
          >
            {point.pattern}
          </p>
          <p className="mt-3 text-[20px] leading-[1.35] font-semibold">{point.meaning_vi}</p>
        </div>

        {point.explanation.map((s, i) => (
          <section key={i} className="mt-8" aria-labelledby={`g-exp-${i}`}>
            <SectionTitle id={`g-exp-${i}`}>{s.heading ?? (i === 0 ? "Giải thích" : "Thêm")}</SectionTitle>
            <p className="mt-3 text-base leading-[1.6] whitespace-pre-line">{s.body}</p>
          </section>
        ))}

        {point.notes.length > 0 ? (
          <section className="mt-8" aria-labelledby="g-notes">
            <SectionTitle id="g-notes">Lưu ý</SectionTitle>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-[1.6]">
              {point.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {point.examples.length > 0 ? (
          <section className="mt-8" aria-labelledby="g-ex">
            <SectionTitle id="g-ex">Ví dụ</SectionTitle>
            <div className="mt-3">
              <Button variant="secondary" aria-pressed={!hideRuby} onClick={() => setHideRuby((v) => !v)}>
                Furigana: {hideRuby ? "Tắt" : "Bật"}
              </Button>
            </div>
            <ul className="m-0 mt-4 flex list-none flex-col gap-3 p-0">
              {point.examples.map((e, i) => (
                <li key={i}>
                  <Card tone="sand">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-[22px] leading-[2.1] [overflow-wrap:anywhere]">
                        <Ruby text={e.ruby || e.ja} hide={hideRuby} />
                      </p>
                      <SpeakButton text={rubyToReading(e.ruby || e.ja)} label={e.ja} />
                    </div>
                    <p className="mt-1 text-base text-ink-2">{e.vi}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {point.exercises.length > 0 ? <Practice key={point.pointId} pointId={point.pointId} exercises={point.exercises} /> : null}

        <nav aria-label="Chuyển bài" className="mt-10 flex flex-wrap items-center justify-between gap-3">
          {prev ? (
            <Button href={`/ngu-phap/${encodeURIComponent(prev.pointId)}`} variant="secondary">
              <span aria-hidden="true">←</span>
              Bài trước
            </Button>
          ) : (
            <span />
          )}
          <Button href="/ngu-phap" variant="ghost">
            Về danh sách
          </Button>
          {next ? (
            <Button href={`/ngu-phap/${encodeURIComponent(next.pointId)}`} variant="primary">
              Bài sau
              <span aria-hidden="true">→</span>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </main>
  );
}

interface Loaded {
  point: GrammarDetails | null;
  prev: GrammarListItem | null;
  next: GrammarListItem | null;
}

export function GrammarDetail({ pointId }: { pointId: string }) {
  const [data, setData] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState(false);

  function load() {
    setFailed(false);
    setData(null);
    getGrammar(pointId)
      .then(async (point) => {
        if (!point) return { point: null, prev: null, next: null };
        // Bài trước/sau trong cùng cấp độ; lỗi danh sách chỉ làm mất hai nút này.
        const list = (await listGrammar(point.level).catch(() => [])) as GrammarListItem[];
        const i = list.findIndex((p) => p.pointId === point.pointId);
        return { point, prev: list[i - 1] ?? null, next: i >= 0 ? (list[i + 1] ?? null) : null };
      })
      .then(setData)
      .catch(() => setFailed(true));
  }
  useEffect(() => {
    // Tải nội dung khi vào trang hoặc đổi bài.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointId]);

  if (failed) {
    return (
      <main id="noi-dung" tabIndex={-1} className={wrap}>
        <h1 className="sr-only">Bài ngữ pháp</h1>
        <Notice tone="error">Chưa tải được bài ngữ pháp.</Notice>
        <div className="mt-3 flex gap-3">
          <Button onClick={load}>Thử lại</Button>
          <Button href="/ngu-phap" variant="ghost">
            Về danh sách
          </Button>
        </div>
      </main>
    );
  }
  if (data === null) {
    return (
      <main id="noi-dung" tabIndex={-1} className={wrap} aria-busy="true">
        <h1 className="sr-only">Bài ngữ pháp</h1>
        <p role="status" className="text-center text-base text-ink-2">
          Đang tải…
        </p>
      </main>
    );
  }
  if (!data.point) {
    return (
      <main id="noi-dung" tabIndex={-1} className={wrap}>
        <h1 className="sr-only">Bài ngữ pháp</h1>
        <EmptyState
          title="Không tìm thấy bài này"
          body="Bài có thể chưa được duyệt hoặc đường dẫn không đúng."
          action={<Button href="/ngu-phap">Về danh sách</Button>}
        />
      </main>
    );
  }
  return <Body point={data.point} prev={data.prev} next={data.next} />;
}
