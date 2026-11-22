import type { ReactNode } from "react";
import { Card } from "./Card";

/**
 * Khối teal làm điểm nhấn: `eyebrow` (dòng nhỏ trên), `bigNumber` cỡ 96px (nhận node để dùng CountUp),
 * `unit` cạnh số, `sub` dòng phụ, `children` là vùng hành động (nút onHero).
 */
export function HeroBlock({
  eyebrow,
  bigNumber,
  unit,
  sub,
  children,
}: {
  eyebrow?: ReactNode;
  bigNumber: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Card tone="hero">
      {eyebrow && <p className="mb-2 text-base font-medium">{eyebrow}</p>}
      <div className="flex items-center gap-4">
        <div className="text-[96px] leading-[0.95] font-extrabold tracking-[-2px] tabular-nums">{bigNumber}</div>
        {unit && <div className="text-[20px] leading-[1.25]">{unit}</div>}
      </div>
      {sub && <p className="mt-2 text-base">{sub}</p>}
      {children && <div className="mt-5">{children}</div>}
    </Card>
  );
}
