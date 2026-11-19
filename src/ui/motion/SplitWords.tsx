"use client";

import { createElement, Fragment, type CSSProperties } from "react";
import { splitWords } from "./split";
import { STAGGER_MAX } from "./tokens";
import { useInView } from "./use-in-view";

interface SplitWordsProps {
  text: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
}

/**
 * Mỗi TỪ trồi lên từ sau một mặt nạ (so le). Tách theo từ, không theo ký tự, để giữ dấu tiếng Việt;
 * mặt nạ có đệm trên/dưới (motion.css) nên không cắt dấu. Không dùng cho đoạn chữ Nhật dài.
 * Trình đọc màn hình nghe bản `sr-only`; các mảnh trực quan là `aria-hidden`.
 */
export function SplitWords({ text, as = "span", className }: SplitWordsProps) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const words = splitWords(text);
  return createElement(
    as,
    { className },
    <span key="sr" className="sr-only">
      {text}
    </span>,
    <span key="vis" ref={ref} aria-hidden="true" data-split="" className={inView ? "is-in" : undefined}>
      {words.map((w, i) => (
        <Fragment key={`${i}-${w}`}>
          {i > 0 ? " " : null}
          <span className="split-mask">
            <span className="split-word" style={{ "--i": Math.min(i, STAGGER_MAX - 1) } as CSSProperties}>
              {w}
            </span>
          </span>
        </Fragment>
      ))}
    </span>,
  );
}
