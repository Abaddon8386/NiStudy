import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

// Phiên bản (revision) cho trang công khai được precache: đổi mỗi lần build.
const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? randomUUID();

// Service worker (src/sw.ts) được build khi build Next.js và phục vụ tại /serwist/sw.js.
export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/nguon-du-lieu", revision }],
  swSrc: "src/sw.ts",
  useNativeEsbuild: true,
});
