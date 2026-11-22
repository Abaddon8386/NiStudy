import type { FsrsRating } from "@/lib/domain/fsrs";

const TONE: Record<FsrsRating, string> = {
  1: "border-bad bg-paper text-bad",
  2: "border-ink bg-paper text-ink",
  3: "border-teal bg-teal text-white",
  4: "border-ink bg-marker text-ink",
};

/**
 * Nút chấm thẻ (Lại/Khó/Được/Dễ). Nhãn 18px không bị cắt dấu, khoảng ôn kế tiếp dưới nhãn 14px,
 * số phím ở góc chỉ hiện khi có bàn phím (hover:hover và pointer:fine). Vùng bấm ≥72px.
 */
export function RatingButton({
  rating,
  label,
  interval,
  onClick,
}: {
  rating: FsrsRating;
  label: string;
  /** Khoảng ôn kế tiếp, ví dụ "10 phút"; null khi chưa tính được. */
  interval: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts={String(rating)}
      className={`press relative flex min-h-[76px] flex-col items-center justify-center rounded-[20px] border-2 px-1 pt-5 pb-2 ${TONE[rating]}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-1 left-2 hidden text-[14px] leading-none font-medium opacity-80 [@media(hover:hover)_and_(pointer:fine)]:block"
      >
        {rating}
      </span>
      <span className="text-[18px] leading-[1.3] font-bold">{label}</span>
      <span className="min-h-[18px] text-[14px] leading-[1.3]">
        {interval ? (
          <>
            <span className="sr-only">, sau </span>
            {interval}
          </>
        ) : null}
      </span>
    </button>
  );
}
