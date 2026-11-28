import { Mark } from "@/ui/Mark";
import { Ruby } from "@/ui/Ruby";
import { splitCloze } from "./pick-exercise";

/**
 * Câu điền chỗ trống. Không có `fill`: chỗ trống là ô gạch chân nổi bật.
 * Có `fill`: điền đáp án và bôi vàng (mặt sau thẻ, kết quả bài tập).
 */
export function Cloze({
  prompt,
  fill,
  hideRuby = false,
  className,
}: {
  prompt: string;
  fill?: string;
  hideRuby?: boolean;
  className?: string;
}) {
  const parts = splitCloze(prompt);
  if (!parts) {
    return <Ruby text={prompt} hide={hideRuby} className={className} />;
  }
  return (
    <span lang="ja" className={`font-jp ${className ?? ""}`.trim()}>
      <Ruby text={parts.before} hide={hideRuby} />
      {fill !== undefined ? (
        <span className="mx-2 inline-block"><Mark solid>{fill}</Mark></span>
      ) : (
        <span className="mx-1 inline-block h-[1.1em] min-w-[3.2em] translate-y-[0.2em] rounded-md border-b-4 border-ink bg-marker/50 align-baseline">
          <span lang="vi" className="sr-only">
            chỗ trống
          </span>
        </span>
      )}
      <Ruby text={parts.after} hide={hideRuby} />
    </span>
  );
}
