"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/ui/Logo";

/** Thanh bên máy tính (≥1024px): đủ 5 mục, nhãn dài. */
const SIDE_NAV = [
  { href: "/", label: "Trang chính" },
  { href: "/on-tap", label: "Ôn tập" },
  { href: "/trac-nghiem", label: "Trắc nghiệm" },
  { href: "/kana", label: "Bảng kana" },
  { href: "/cai-dat", label: "Cài đặt" },
] as const;

/** Thanh đáy điện thoại: 4 mục, nhãn ngắn một dòng. "Cài đặt" nằm ở header. */
const BOTTOM_NAV = [
  { href: "/", label: "Hôm nay" },
  { href: "/on-tap", label: "Ôn tập" },
  { href: "/trac-nghiem", label: "Kiểm tra" },
  { href: "/kana", label: "Kana" },
] as const;

/** Chế độ tập trung (docs/03-design.md 3.4): không điều hướng chung, trang tự có nút thoát. */
const FOCUS_PATHS = ["/on-tap", "/trac-nghiem", "/khoi-dau"];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Khung của nhóm (app): từ 1024px là thanh bên trái 224px, nội dung trên nền ground (không có panel trắng lồng);
 * dưới 1024px là cột 480px trắng, header (logo + Cài đặt) và thanh điều hướng đáy cố định (docs/03-design.md mục 3).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (FOCUS_PATHS.includes(pathname)) return <>{children}</>;
  const settingsActive = isActive("/cai-dat", pathname);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col px-4 py-6 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="Điều hướng chính" className="mt-8">
          <ul className="flex list-none flex-col gap-1 p-0">
            {SIDE_NAV.map((n) => {
              const active = isActive(n.href, pathname);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center rounded-full px-4 text-base ${
                      active ? "bg-ink font-bold text-paper" : "font-medium text-ink hover:bg-hair"
                    }`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="lg:pl-56">
        <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:max-w-none lg:bg-ground lg:pb-0">
          <header className="flex h-14 items-center justify-between px-4 min-[480px]:px-5 lg:hidden">
            <Logo />
            <Link
              href="/cai-dat"
              aria-current={settingsActive ? "page" : undefined}
              className={`-mr-2 inline-flex min-h-11 items-center rounded-full px-4 text-base ${
                settingsActive ? "bg-ink font-bold text-paper" : "font-medium text-ink hover:bg-hair"
              }`}
            >
              Cài đặt
            </Link>
          </header>
          <div className="mx-auto w-full lg:max-w-[1100px]">{children}</div>
        </div>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-hair bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-[480px] list-none gap-1 p-1">
          {BOTTOM_NAV.map((n) => {
            const active = isActive(n.href, pathname);
            return (
              <li key={n.href} className="min-w-0 flex-1">
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center justify-center rounded-full px-1 text-center text-[14px] leading-[1.2] whitespace-nowrap ${
                    active ? "bg-ink font-bold text-paper" : "font-medium text-ink hover:bg-hair"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
