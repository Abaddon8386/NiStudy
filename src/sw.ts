/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { CacheFirst, ExpirationPlugin, Serwist, StaleWhileRevalidate } from "serwist";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const sameOrigin = ({ url }: { url: URL }) => url.origin === self.location.origin;

// ADR-0004: chỉ precache vỏ ứng dụng + cache tài nguyên tĩnh cùng origin.
// KHÔNG cache phản hồi Supabase/API hay dữ liệu cá nhân: mọi origin khác và /api/, /auth/ đi thẳng mạng.
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url, sameOrigin: same }) => same && url.pathname.startsWith("/_next/static/"),
    handler: new CacheFirst({
      cacheName: "next-static",
      plugins: [new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
  {
    matcher: (ctx) =>
      sameOrigin(ctx) &&
      !ctx.url.pathname.startsWith("/api/") &&
      !ctx.url.pathname.startsWith("/auth/") &&
      /\.(?:woff2?|svg|png|ico|webp)$/i.test(ctx.url.pathname),
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

serwist.addEventListeners();
