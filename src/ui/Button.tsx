import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClasses, isInternalHref, type ButtonSize, type ButtonVariant } from "./button-styles";

interface CommonProps {
  /** primary (ink) | onHero (vàng, chỉ trên khối teal) | secondary (viền ink) | ghost (chỉ chữ) | danger (viền đỏ). */
  variant?: ButtonVariant;
  /** lg 56px (hành động chính) | md 44px. */
  size?: ButtonSize;
  /** Đang xử lý: giữ nguyên kích thước, vô hiệu hóa, `aria-busy`. Chỉ áp cho <button>. */
  loading?: boolean;
  /** Gợi ý phím tắt; chỉ hiện trên thiết bị có chuột (hover:hover và pointer:fine). */
  kbd?: string;
  children: ReactNode;
  className?: string;
}

type ButtonOnly = CommonProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type LinkOnly = CommonProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & { href: string };

export type ButtonProps = ButtonOnly | LinkOnly;

/**
 * Nút/liên kết có hình nút. Có `href` thì render next/link (nội bộ) hoặc <a> (ngoài), không thì <button>.
 * Vùng bấm ≥44px; phản hồi nhấn scale(.97) 100ms (tắt khi reduced-motion).
 */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", kbd, children, className } = props;
  const classes = buttonClasses(variant, size, className);
  const hint = kbd ? (
    <kbd
      aria-hidden="true"
      className="hidden rounded-md bg-paper/20 px-1.5 text-[14px] font-medium [@media(hover:hover)_and_(pointer:fine)]:inline-flex"
    >
      {kbd}
    </kbd>
  ) : null;

  if (props.href !== undefined) {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { variant: _v, size: _s, loading: _l, kbd: _k, children: _c, className: _cn, href, ...rest } = props;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    const body = (
      <>
        {children}
        {hint}
      </>
    );
    return isInternalHref(href) ? (
      <Link href={href} className={classes} {...rest}>
        {body}
      </Link>
    ) : (
      <a href={href} className={classes} {...rest}>
        {body}
      </a>
    );
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { variant: _v, size: _s, loading = false, kbd: _k, children: _c, className: _cn, disabled, type = "button", ...rest } = props;
  /* eslint-enable @typescript-eslint/no-unused-vars */
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      <span className={`inline-flex items-center justify-center gap-2 ${loading ? "opacity-0" : ""}`}>
        {children}
        {hint}
      </span>
      {loading && (
        <span aria-hidden="true" className="ui-dots absolute inset-0 flex items-center justify-center">
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  );
}
