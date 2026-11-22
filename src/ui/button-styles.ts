export type ButtonVariant = "primary" | "onHero" | "secondary" | "ghost" | "danger";
export type ButtonSize = "lg" | "md";

const BASE =
  "press relative inline-flex select-none items-center justify-center gap-2 rounded-full font-bold " +
  "aria-disabled:cursor-default disabled:cursor-default";

const SIZE: Record<ButtonSize, string> = {
  lg: "min-h-14 px-8 text-[18px] leading-[1.2]",
  md: "min-h-11 px-6 text-base leading-[1.2]",
};

// Disabled: chữ ink-2 trên nền hair (4,7:1); viền giữ nguyên để nút không biến mất.
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-paper hover:bg-ink/90 disabled:bg-hair disabled:text-ink-2 aria-disabled:bg-hair aria-disabled:text-ink-2",
  onHero:
    "bg-marker text-ink hover:bg-marker/90 focus-visible:outline-paper disabled:bg-track disabled:text-paper aria-disabled:bg-track aria-disabled:text-paper",
  secondary:
    "border-2 border-ink bg-paper text-ink hover:bg-sand disabled:border-ring disabled:bg-hair disabled:text-ink-2 aria-disabled:border-ring aria-disabled:bg-hair aria-disabled:text-ink-2",
  ghost: "bg-transparent px-4 font-medium text-ink hover:bg-hair disabled:text-ink-2 aria-disabled:text-ink-2",
  danger:
    "border-2 border-bad bg-paper text-bad hover:bg-sand disabled:border-ring disabled:text-ink-2 aria-disabled:border-ring aria-disabled:text-ink-2",
};

/** Chuỗi class của nút theo thứ bậc (docs/03-design.md 5.5). Hàm thuần để dùng cả ở server lẫn test. */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return [BASE, SIZE[size], VARIANT[variant], extra].filter(Boolean).join(" ");
}

/** Link nội bộ dùng next/link; địa chỉ ngoài (http, mailto) dùng thẻ <a>. */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") || href.startsWith("#");
}
