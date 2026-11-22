import type { SessionSummary } from "@/lib/domain/session";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { HeroBlock } from "@/ui/HeroBlock";
import { Notice } from "@/ui/Notice";
import { Seal } from "@/ui/Seal";
import { CountUp } from "@/ui/motion/CountUp";

const RATINGS = [
  [1, "Lại"],
  [2, "Khó"],
  [3, "Được"],
  [4, "Dễ"],
] as const;

/** Tổng kết phiên ôn (S-08): thành quả trước (XP phiên = số lượt), phân bố Lại/Khó/Được/Dễ nhỏ bên dưới. */
export function ReviewSummary({ summary, pending }: { summary: SessionSummary; pending: number }) {
  return (
    <main
      id="noi-dung"
      tabIndex={-1}
      className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center gap-5 bg-ground px-4 py-8 lg:max-w-[640px] lg:px-0"
    >
      <div className="flex flex-col items-center gap-3">
        <Seal char="学" size={112} rotate={-8} stamp />
        <h1 className="text-[40px] leading-[1.15] font-extrabold">Xong rồi.</h1>
      </div>

      <HeroBlock
        eyebrow="Phiên ôn hôm nay"
        bigNumber={
          <>
            +<CountUp value={summary.total} />
          </>
        }
        unit="XP"
        sub={`${summary.total} lượt ôn · ${summary.newCards} thẻ mới`}
      />

      <dl className="grid grid-cols-4 gap-2">
        {RATINGS.map(([r, label]) => (
          <Card key={r} tone="plain" className="rounded-[16px] border border-hair px-2 py-3 text-center">
            <dt className="text-[14px] leading-tight text-ink-2">{label}</dt>
            <dd className="text-[24px] leading-tight font-bold">{summary.byRating[r]}</dd>
          </Card>
        ))}
      </dl>

      <div data-testid="send-status">
        {pending === 0 ? (
          <Notice tone="success">Đã lưu hết.</Notice>
        ) : (
          <Notice tone="warn">{`Còn ${pending} lượt chưa gửi, sẽ thử lại.`}</Notice>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Button href="/" size="lg">
          Về trang chính
        </Button>
        <Button href="/trac-nghiem" size="lg" variant="secondary">
          Làm trắc nghiệm
        </Button>
      </div>
    </main>
  );
}
