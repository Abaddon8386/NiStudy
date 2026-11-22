import { createElement, type HTMLAttributes, type ReactNode } from "react";

export type CardTone = "outlined" | "sand" | "hero" | "plain";

const TONE: Record<CardTone, string> = {
  outlined: "rounded-[28px] border-2 border-ink bg-paper p-5",
  // Trên máy tính nền khu nội dung cũng là sand nên khối chuyển sang trắng để vẫn nhìn ra.
  sand: "rounded-[22px] bg-sand p-4 lg:bg-paper",
  hero: "rounded-[28px] bg-teal p-6 text-white",
  plain: "bg-paper",
};

/** Khối nội dung: outlined (viền ink 2px, bo 28) | sand (nền sand, bo 22, không viền) | hero (teal, chữ trắng) | plain. */
export function Card({
  tone = "outlined",
  as = "div",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & { tone?: CardTone; as?: "div" | "section" | "article" | "li"; children?: ReactNode }) {
  return createElement(as, { ...rest, className: `${TONE[tone]} ${className ?? ""}`.trim() }, children);
}
