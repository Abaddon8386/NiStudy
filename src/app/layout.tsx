import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Klee_One, Noto_Sans_JP } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { InstallPromptListener } from "@/components/install/install-prompt-listener";
import { MotionBoot } from "@/ui/motion/motion-boot";
import { NavProgress } from "@/ui/motion/NavProgress";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const notoJp = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  variable: "--font-noto-jp",
  display: "swap",
  preload: false,
});

const klee = Klee_One({
  weight: "600",
  variable: "--font-klee",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Nihongo", template: "%s | Nihongo" },
  description: "Học kanji qua âm Hán Việt, ôn tập theo FSRS, bám lộ trình JLPT N5–N4.",
  applicationName: "Nihongo",
};

export const viewport: Viewport = {
  themeColor: "#1b6e66",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${notoJp.variable} ${klee.variable}`}>
      <body>
        <a href="#noi-dung" className="skip-link">
          Bỏ qua tới nội dung chính
        </a>
        <MotionBoot />
        <NavProgress />
        <InstallPromptListener />
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV !== "production"}
          // Tắt reload khi có mạng lại (gây ngắt điều hướng/mất dữ liệu đang nhập) và
          // tự cache trang vừa điều hướng (ADR-0004: không cache trang theo người dùng).
          reloadOnOnline={false}
          cacheOnNavigation={false}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  );
}
