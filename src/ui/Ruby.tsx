import { parseRuby } from "./ruby-parse";

/**
 * Hiển thị chuỗi `漢字[かな]` thành <ruby>. `hide`: ẩn furigana (chỉ còn chữ gốc).
 * Ngoặc lỗi được hiện nguyên văn. Luôn lang="ja".
 */
export function Ruby({ text, hide = false, className }: { text: string; hide?: boolean; className?: string }) {
  return (
    <span lang="ja" className={`font-jp [&_rt]:text-[0.65em] ${className ?? ""}`.trim()}>
      {parseRuby(text).map((s, i) =>
        "text" in s ? (
          <span key={i}>{s.text}</span>
        ) : hide ? (
          <span key={i}>{s.base}</span>
        ) : (
          <ruby key={i}>
            {s.base}
            <rp>(</rp>
            <rt>{s.rt}</rt>
            <rp>)</rp>
          </ruby>
        ),
      )}
    </span>
  );
}
