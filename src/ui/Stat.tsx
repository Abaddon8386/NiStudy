import type { ReactNode } from "react";

/** Một số liệu: số lớn 40px/800, nhãn 14px ink-2. Đặt trong Card sand. */
export function Stat({ label, value, unit, sub }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode }) {
  return (
    <div className="tabular-nums">
      <p className="text-[14px] leading-[1.3] text-ink-2">{label}</p>
      <p className="text-[40px] leading-[1.15] font-extrabold">
        {value}
        {unit && <small className="ml-1 text-base font-normal">{unit}</small>}
      </p>
      {sub && <p className="text-[14px] leading-[1.3] text-ink-2">{sub}</p>}
    </div>
  );
}
