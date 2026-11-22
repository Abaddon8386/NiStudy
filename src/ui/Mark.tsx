import { markVariant } from "./mark-variant";

/** Vệt dạ quang sau một cụm chữ (decor, không đổi ngữ nghĩa). `solid`: nền vàng đặc, dùng trên khối teal. */
export function Mark({ children, solid = false }: { children: string; solid?: boolean }) {
  return (
    <span
      className="ui-mark"
      data-thin={!solid && markVariant(children) === "thin" ? "" : undefined}
      data-solid={solid ? "" : undefined}
    >
      {children}
    </span>
  );
}
