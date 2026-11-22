import type { CSSProperties } from "react";
import { bigKanjiSize, type BigKanjiVariant } from "./big-kanji-size";

/**
 * Chữ Nhật cỡ lớn. `kanji`: dùng Klee One (kanji); không thì Noto Sans JP (từ vựng, kana).
 * Cỡ co theo độ dài (big-kanji-size.ts), máy tính (≥1024px) lớn hơn 1,25 lần; chữ dài tự xuống dòng.
 */
export function BigKanji({
  text,
  variant = "front",
  kanji = false,
  className,
  testId,
}: {
  text: string;
  variant?: BigKanjiVariant;
  kanji?: boolean;
  className?: string;
  testId?: string;
}) {
  const style = { "--k": bigKanjiSize(text, variant) } as CSSProperties;
  return (
    <p
      lang="ja"
      data-testid={testId}
      style={style}
      className={`text-[length:calc(var(--k)*1px)] leading-none [overflow-wrap:anywhere] lg:text-[length:calc(var(--k)*1.25px)] ${
        kanji ? "font-kanji font-semibold" : "font-jp font-medium"
      } ${className ?? ""}`}
    >
      {text}
    </p>
  );
}
