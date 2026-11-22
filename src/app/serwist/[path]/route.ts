import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

// Phiên bản (revision) cho các trang tĩnh được precache: đổi mỗi lần build.
// "/" là vỏ ứng dụng (tĩnh, không chứa dữ liệu người dùng); khi "/" thành trang theo người dùng
// thì phải tách vỏ ra một route tĩnh riêng rồi precache route đó, không precache "/".
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID();

// Service worker (src/sw.ts) được build khi build Next.js và phục vụ tại /serwist/sw.js.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/nguon-du-lieu", revision },
    // Chỉ HTML trang giới thiệu (khách chưa đăng nhập mở "/" khi offline được đưa tới đây);
    // ảnh/clip trong /media không precache (ADR-0004).
    { url: "/gioi-thieu", revision },
    { url: "/khoi-dau", revision },
    { url: "/cai-dat", revision },
    { url: "/on-tap", revision }, // vỏ tĩnh của phiên ôn: mở lại offline để tiếp tục phiên đã lưu (FR-28)
    { url: "/cai-app", revision },
  ],
  // Mặc định Serwist precache mọi tệp trong public/: loại ảnh/clip trang giới thiệu (ADR-0004).
  globIgnores: ["**/node_modules/**/*", "public/media/**/*"],
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
});
