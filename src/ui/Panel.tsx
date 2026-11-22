import type { HTMLAttributes, ReactNode } from "react";

/**
 * Tấm nền sand bo 28px chứa các dòng cài đặt/thông tin. Trên máy tính nền trang là sand nên tấm chuyển sang trắng.
 * `rows`: các con trực tiếp là dòng, ngăn bởi đường hair (đệm dọc nhỏ, dòng tự đệm).
 */
export function Panel({
  rows = false,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { rows?: boolean; children?: ReactNode }) {
  return (
    <div
      {...rest}
      className={`rounded-[28px] bg-sand lg:bg-paper ${rows ? "divide-y divide-hair px-5 py-1" : "p-5"} ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}
