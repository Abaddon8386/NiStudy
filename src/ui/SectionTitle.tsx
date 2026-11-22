import type { ReactNode } from "react";

/** Tiêu đề mục: kẻ ink 2px phía trên, chữ 20px/700. */
export function SectionTitle({
  as: Tag = "h2",
  id,
  children,
}: {
  as?: "h2" | "h3";
  id?: string;
  children: ReactNode;
}) {
  return (
    <Tag id={id} className="border-t-2 border-ink pt-4 text-[20px] leading-[1.25] font-bold">
      {children}
    </Tag>
  );
}
