"use client";

import { createElement, type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { staggerDelay } from "./tokens";
import { useInView } from "./use-in-view";

export type RevealVariant = "up" | "fade" | "scale";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  /** Thẻ HTML render ra (mặc định div). */
  as?: "div" | "section" | "header" | "article" | "li" | "p" | "span" | "ul";
  variant?: RevealVariant;
  /** Độ trễ ms; nếu bỏ trống dùng `index` để so le. */
  delay?: number;
  /** Thứ tự trong nhóm so le (50ms mỗi bước, tối đa 6 bước). */
  index?: number;
  children?: ReactNode;
}

/**
 * Hiện dần khi cuộn tới. Trạng thái ẩn nằm trong motion.css và chỉ áp khi <html> có `motion-ready`.
 */
export function Reveal({
  as = "div",
  variant = "up",
  delay,
  index = 0,
  className,
  style,
  children,
  ...rest
}: RevealProps) {
  const [ref, inView] = useInView<HTMLElement>();
  const ms = delay ?? staggerDelay(index);
  const merged = { ...style, "--motion-delay": `${ms}ms` } as CSSProperties;
  return createElement(
    as,
    {
      ...rest,
      ref,
      "data-motion": variant,
      className: [className, inView ? "is-in" : ""].filter(Boolean).join(" "),
      style: merged,
    },
    children,
  );
}
