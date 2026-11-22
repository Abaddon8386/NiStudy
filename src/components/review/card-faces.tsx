import type { Ref } from "react";
import type { KanaDetails, KanjiDetails, SessionCard, VocabDetails } from "@/lib/domain/queue";
import { buttonClasses } from "@/ui/button-styles";
import { BigKanji } from "@/ui/BigKanji";
import { Mark } from "@/ui/Mark";

export function mainText(card: SessionCard): string {
  const d = card.details;
  if (!d) return "?";
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
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="flex flex-1 items-center justify-center py-8">
        <Big card={card} variant="front" />
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

export function CardBack({ card }: { card: SessionCard }) {
  const d = card.details;
  if (!d) return <div className="m-auto text-center">Không có dữ liệu cho thẻ này.</div>;

  if (card.card.kind === "kana") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
        <Big card={card} variant="back" />
        <p className="text-[56px] leading-[1.2] font-extrabold">
          <Mark>{(d as KanaDetails).romaji}</Mark>
        </p>
      </div>
    );
  }

  if (card.card.kind === "vocab") {
    const v = d as VocabDetails;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <Big card={card} variant="back" />
        <p lang="ja" className="font-jp text-[28px] leading-[1.25] font-bold [overflow-wrap:anywhere]">
          {v.reading}
        </p>
        <p className="text-[22px] leading-[1.3] font-semibold">{v.meaning_vi ?? "Đang bổ sung"}</p>
        {v.example_ja ? (
          <div className={`${exampleBox} mt-2`}>
            <p lang="ja" className="font-jp text-[20px] leading-snug">
              {v.example_ja}
            </p>
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
              <li key={e.word} className="text-base">
                <span lang="ja" className="font-jp text-[22px] font-medium">
                  {e.word}
                </span>{" "}
                <span lang="ja" className="font-jp text-ink-2">
                  {e.reading}
                </span>
                {e.meaning_vi ? <span> · {e.meaning_vi}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
