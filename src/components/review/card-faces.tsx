import Link from "next/link";
import type { Ref } from "react";
import { Cloze } from "@/components/grammar/cloze";
import { fillCloze, pickExercise } from "@/components/grammar/pick-exercise";
import type { GrammarCardDetails as GrammarPoint, GrammarExercise } from "@/lib/domain/queue";
import type { KanaDetails, KanjiDetails, SessionCard, VocabDetails } from "@/lib/domain/queue";
import { buttonClasses } from "@/ui/button-styles";
import { BigKanji } from "@/ui/BigKanji";
import { Mark } from "@/ui/Mark";
import { rubyToReading } from "@/ui/ruby-parse";
import { Ruby } from "@/ui/Ruby";
import { SpeakButton } from "@/ui/SpeakButton";

// Thẻ ngữ pháp (ADR-0009).
export function isGrammarCard(card: SessionCard): boolean {
  return card.card.kind === "grammar";
}

function grammarOf(card: SessionCard): GrammarPoint | null {
  if (!isGrammarCard(card) || !card.details) return null;
  const g = card.details as unknown as GrammarPoint;
  return {
    ...g,
    examples: g.examples ?? [],
    exercises: g.exercises ?? [],
    notes: g.notes ?? [],
    explanation: g.explanation ?? [],
  };
}

/** Câu bài tập của lượt ôn này: seed theo card_id và số lần ôn nên không đổi khi lật thẻ. */
export function exerciseFor(card: SessionCard, g: GrammarPoint): GrammarExercise | null {
  return pickExercise(card.card.id, card.state?.reps ?? 0, g.exercises);
}

export function mainText(card: SessionCard): string {
  const d = card.details;
  if (!d) return "?";
  if (isGrammarCard(card)) return (d as unknown as GrammarPoint).title;
  switch (card.card.kind) {
    case "kana":
      return (d as KanaDetails).kana;
    case "kanji":
      return (d as KanjiDetails).kanji;
    default:
      return (d as VocabDetails).word;
  }
}

function Big({ card, variant }: { card: SessionCard; variant: "front" | "back" }) {
  return <BigKanji text={mainText(card)} variant={variant} kanji={card.card.kind === "kanji"} />;
}

/** Mặt trước: chữ lớn giữa thẻ, nút "Lật thẻ" nằm ở đáy thẻ. */
export function CardFront({
  card,
  flipRef,
  onFlip,
}: {
  card: SessionCard;
  flipRef: Ref<HTMLButtonElement>;
  onFlip: () => void;
}) {
  const g = grammarOf(card);
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="flex w-full flex-1 items-center justify-center py-8">
        {g ? <GrammarPrompt card={card} g={g} /> : <Big card={card} variant="front" />}
      </div>
      <button ref={flipRef} type="button" onClick={onFlip} className={buttonClasses("primary", "lg", "w-full")}>
        Lật thẻ
        <kbd
          aria-hidden="true"
          className="hidden rounded-md bg-paper/20 px-1.5 font-sans text-[14px] font-medium [@media(hover:hover)_and_(pointer:fine)]:inline-flex"
        >
          Space
        </kbd>
      </button>
    </div>
  );
}

const exampleBox = "w-full rounded-2xl bg-sand p-4 text-left";

const patternChip =
  "font-kanji rounded-xl bg-teal px-3 py-1.5 text-[20px] leading-[1.4] font-semibold text-white [overflow-wrap:anywhere]";

/** Mặt trước thẻ ngữ pháp: thẻ mới có bài học ngắn rồi câu điền; thẻ đã học chỉ có câu điền và nghĩa Việt làm gợi ý. */
function GrammarPrompt({ card, g }: { card: SessionCard; g: GrammarPoint }) {
  const ex = exerciseFor(card, g);
  const example = g.examples[0];
  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {card.isNew ? (
        <div className="flex w-full flex-col items-center gap-2" data-testid="grammar-lesson">
          <p lang="ja" className="font-jp text-[28px] leading-[1.25] font-extrabold [overflow-wrap:anywhere]">
            {g.title}
          </p>
          <p lang="ja" className={patternChip}>
            {g.pattern}
          </p>
          <p className="text-[18px] leading-[1.35] font-semibold">{g.meaning_vi}</p>
          {example ? (
            <div className={exampleBox}>
              <p className="text-[20px] leading-[2.1]">
                <Ruby text={example.ruby || example.ja} />
              </p>
              <p className="text-base text-ink-2">{example.vi}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {ex ? (
        <div className="flex w-full flex-col items-center gap-2" data-testid="grammar-cloze">
          <p className="text-[14px] font-bold text-ink-2">{card.isNew ? "Thử điền vào chỗ trống" : "Điền vào chỗ trống"}</p>
          <p className="text-[26px] leading-[2] [overflow-wrap:anywhere]">
            <Cloze prompt={ex.prompt_ja} />
          </p>
          <p className="text-base text-ink-2">Gợi ý: {ex.vi}</p>
        </div>
      ) : !card.isNew ? (
        <div className="flex flex-col items-center gap-2">
          <p lang="ja" className="font-jp text-[28px] leading-[1.25] font-extrabold">
            {g.title}
          </p>
          <p className="text-base text-ink-2">Bạn còn nhớ mẫu câu này không?</p>
        </div>
      ) : null}
    </div>
  );
}

/** Mặt sau thẻ ngữ pháp: câu hoàn chỉnh (đáp án được bôi vàng), mẫu câu, nghĩa và liên kết tới bài. */
function GrammarBack({ card, g }: { card: SessionCard; g: GrammarPoint }) {
  const ex = exerciseFor(card, g);
  const example = g.examples[0];
  const spoken = ex ? fillCloze(ex.prompt_ja, ex.answer) : example ? rubyToReading(example.ruby || example.ja) : null;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      {ex ? (
        <div className="flex items-center justify-center gap-3">
          <p className="text-[26px] leading-[2] [overflow-wrap:anywhere]" data-testid="grammar-answer">
            <Cloze prompt={ex.prompt_ja} fill={ex.answer} />
          </p>
          {spoken ? <SpeakButton text={spoken} /> : null}
        </div>
      ) : example ? (
        <div className="flex items-center justify-center gap-3">
          <p className="text-[24px] leading-[2.1]">
            <Ruby text={example.ruby || example.ja} />
          </p>
          {spoken ? <SpeakButton text={spoken} label={example.ja} /> : null}
        </div>
      ) : null}
      {ex ? <p className="text-base text-ink-2">{ex.vi}</p> : null}
      <p lang="ja" className={patternChip}>
        {g.pattern}
      </p>
      <p className="text-[20px] leading-[1.3] font-semibold">{g.meaning_vi}</p>
      <Link
        href={`/ngu-phap/${encodeURIComponent(g.point_id)}`}
        className="inline-flex min-h-11 items-center text-base font-bold underline underline-offset-4"
      >
        Xem bài
      </Link>
    </div>
  );
}

export function CardBack({ card }: { card: SessionCard }) {
  const d = card.details;
  if (!d) return <div className="m-auto text-center">Không có dữ liệu cho thẻ này.</div>;

  const g = grammarOf(card);
  if (g) return <GrammarBack card={card} g={g} />;

  if (card.card.kind === "kana") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Big card={card} variant="back" />
        <p className="text-[56px] leading-[1.2] font-extrabold">
          <Mark>{(d as KanaDetails).romaji}</Mark>
        </p>
        <SpeakButton text={(d as KanaDetails).kana} />
      </div>
    );
  }

  if (card.card.kind === "vocab") {
    const v = d as VocabDetails;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Big card={card} variant="back" />
        <div className="flex items-center justify-center gap-3">
          <p lang="ja" className="font-jp text-[28px] leading-[1.25] font-bold [overflow-wrap:anywhere]">
            {v.reading}
          </p>
          <SpeakButton text={v.reading || v.word} label={v.reading || v.word} />
        </div>
        <p className="text-[22px] leading-[1.3] font-semibold">{v.meaning_vi ?? "Đang bổ sung"}</p>
        {v.example_ja ? (
          <div className={`${exampleBox} mt-2`}>
            <div className="flex items-start justify-between gap-3">
              <p lang="ja" className="font-jp min-w-0 text-[20px] leading-snug">
                {v.example_ja}
              </p>
              <SpeakButton text={v.example_ja} />
            </div>
            {v.example_vi ? <p className="mt-1 text-base text-ink-2">{v.example_vi}</p> : null}
          </div>
        ) : null}
      </div>
    );
  }

  const k = d as KanjiDetails;
  const main = k.han_viet_main ? k.han_viet_main.toLocaleUpperCase("vi") : null;
  const others = (k.han_viet_other ?? []).map((o) => o.toLocaleUpperCase("vi"));
  const examples = k.examples ?? [];
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <Big card={card} variant="back" />
      {main ? (
        <p className="text-[40px] leading-[1.3] font-extrabold">
          <Mark>{main}</Mark>
        </p>
      ) : (
        <p className="text-[20px] leading-tight font-bold text-ink-2">Đang bổ sung</p>
      )}
      {others.length > 0 ? <p className="text-[14px] text-ink-2">Âm khác: {others.join(", ")}</p> : null}
      <p className="text-[22px] leading-[1.3] font-semibold">{k.meaning_vi ?? "Đang bổ sung"}</p>
      <p className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
        <span>
          <span className="text-[14px] font-bold tracking-wide text-ink-2">ON </span>
          <span lang="ja" className="font-jp text-[20px]">
            {k.on_readings.length ? k.on_readings.join("、") : "—"}
          </span>
        </span>
        <span>
          <span className="text-[14px] font-bold tracking-wide text-ink-2">KUN </span>
          <span lang="ja" className="font-jp text-[20px]">
            {k.kun_readings.length ? k.kun_readings.join("、") : "—"}
          </span>
        </span>
      </p>
      <div className={`${exampleBox} mt-1`}>
        {examples.length === 0 ? (
          <p className="text-base text-ink-2">Chưa có từ ví dụ</p>
        ) : (
          <ul className="space-y-1">
            {examples.map((e) => (
              <li key={e.word} className="flex items-center justify-between gap-3 text-base">
                <span className="min-w-0">
                  <span lang="ja" className="font-jp text-[22px] font-medium">
                    {e.word}
                  </span>{" "}
                  <span lang="ja" className="font-jp text-ink-2">
                    {e.reading}
                  </span>
                  {e.meaning_vi ? <span> · {e.meaning_vi}</span> : null}
                </span>
                {e.reading ? <SpeakButton text={e.reading} /> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
