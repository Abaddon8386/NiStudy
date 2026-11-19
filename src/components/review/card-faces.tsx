import type { KanaDetails, KanjiDetails, SessionCard, VocabDetails } from "@/lib/domain/queue";

/** Cỡ chữ lớn theo loại và độ dài (docs/03-design.md mục 5.2), co lại để không tràn ngang 375px. */
function frontSize(card: SessionCard): number {
  const len = [...mainText(card)].length;
  if (card.card.kind === "kanji") return 160;
  if (card.card.kind === "kana") return len > 1 ? 96 : 160;
  return len <= 2 ? 96 : len <= 4 ? 64 : 44;
}

function backSize(card: SessionCard): number {
  const len = [...mainText(card)].length;
  if (card.card.kind === "kana") return len > 1 ? 64 : 88;
  if (card.card.kind === "kanji") return 88;
  return len <= 2 ? 72 : len <= 4 ? 56 : 40;
}

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

function BigText({ card, size }: { card: SessionCard; size: number }) {
  const kanji = card.card.kind === "kanji";
  return (
    <p
      lang="ja"
      className={`leading-none [overflow-wrap:anywhere] ${kanji ? "font-kanji font-semibold" : "font-jp font-medium"}`}
      style={{ fontSize: size }}
    >
      {mainText(card)}
    </p>
  );
}

export function CardFront({ card }: { card: SessionCard }) {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <BigText card={card} size={frontSize(card)} />
    </div>
  );
}

export function CardBack({ card }: { card: SessionCard }) {
  const d = card.details;
  const size = backSize(card);
  if (!d) return <div className="text-center">Không có dữ liệu cho thẻ này.</div>;

  if (card.card.kind === "kana") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <BigText card={card} size={size} />
        <p className="text-[40px] leading-tight font-extrabold">
          <span className="hl">{(d as KanaDetails).romaji}</span>
        </p>
      </div>
    );
  }

  if (card.card.kind === "vocab") {
    const v = d as VocabDetails;
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <BigText card={card} size={size} />
        <p lang="ja" className="font-jp text-[40px] leading-tight font-extrabold [overflow-wrap:anywhere]">
          <span className="hl">{v.reading}</span>
        </p>
        <p className="text-[20px] leading-snug font-medium">{v.meaning_vi ?? "Đang bổ sung"}</p>
        {v.example_ja ? (
          <div className="w-full rounded-2xl bg-sand p-4 text-left">
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
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      <BigText card={card} size={size} />
      {main ? (
        <p className="text-[40px] leading-tight font-extrabold">
          <span className="hl">{main}</span>
        </p>
      ) : (
        <p className="text-[20px] leading-tight font-bold text-ink-2">Đang bổ sung</p>
      )}
      {others.length > 0 ? <p className="text-sm text-ink-2">Âm khác: {others.join(", ")}</p> : null}
      <p className="text-[20px] leading-snug font-medium">{k.meaning_vi ?? "Đang bổ sung"}</p>
      <p className="text-base">
        <span className="text-ink-2">On </span>
        <span lang="ja" className="font-jp">
          {k.on_readings.length ? k.on_readings.join("、") : "—"}
        </span>
        <span className="text-ink-2"> · Kun </span>
        <span lang="ja" className="font-jp">
          {k.kun_readings.length ? k.kun_readings.join("、") : "—"}
        </span>
      </p>
      <div className="w-full rounded-2xl bg-sand p-4 text-left">
        {examples.length === 0 ? (
          <p className="text-base text-ink-2">Chưa có từ ví dụ</p>
        ) : (
          <ul className="space-y-1">
            {examples.map((e) => (
              <li key={e.word} className="text-base">
                <span lang="ja" className="font-jp text-[20px]">
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
