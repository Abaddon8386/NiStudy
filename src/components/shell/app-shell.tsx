"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Trang chính" },
  { href: "/on-tap", label: "Ôn tập" },
  { href: "/trac-nghiem", label: "Trắc nghiệm" },
  { href: "/kana", label: "Bảng kana" },
  { href: "/cai-dat", label: "Cài đặt" },
] as const;

/** Chế độ tập trung (docs/03-design.md 3.4): không điều hướng chung, trang tự có nút thoát. */
const FOCUS_PATHS = ["/on-tap", "/trac-nghiem", "/khoi-dau"];

function isActive(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Khung của nhóm (app): từ 1024px là thanh bên trái 224px + tờ nội dung rộng tối đa 1100px;
 * dưới 1024px là cột 480px và thanh điều hướng đáy cố định (docs/03-design.md mục 3).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (FOCUS_PATHS.includes(pathname)) return <>{children}</>;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 flex-col px-4 py-6 lg:flex">
        <p className="flex items-center gap-3 px-2 text-[20px] font-extrabold text-teal">
          <span
            aria-hidden="true"
            lang="ja"
            className="flex size-9 items-center justify-center rounded-full bg-seal font-kanji text-[18px] font-semibold text-white"
          >
            日
          </span>
          Nihongo
        </p>
        <nav aria-label="Điều hướng chính" className="mt-8">
          <ul className="flex list-none flex-col gap-1 p-0">
            {NAV.map((n) => {
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
        <div className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:m-2 lg:min-h-[calc(100dvh-1rem)] lg:max-w-none lg:rounded-2xl lg:border lg:border-hair lg:pb-0">
          <div className="mx-auto w-full lg:max-w-[1100px]">{children}</div>
        </div>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-hair bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-[480px] list-none gap-1 p-1">
          {NAV.map((n) => {
            const active = isActive(n.href, pathname);
            return (
              <li key={n.href} className="min-w-0 flex-1">
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 items-center justify-center rounded-full px-1 text-center text-sm leading-tight ${
                    active ? "bg-ink font-bold text-paper" : "font-medium text-ink"
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
