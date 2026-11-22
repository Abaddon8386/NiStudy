import { Seal } from "./Seal";

/** Logo thống nhất: dấu triện đỏ chữ 日 + chữ "Nihongo". `tone="light"` dùng trên nền teal. */
export function Logo({ tone = "dark", stamp = false }: { tone?: "dark" | "light"; stamp?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${tone === "light" ? "text-white" : "text-ink"}`}>
      <Seal char="日" size={36} stamp={stamp} />
      <span className="text-[20px] leading-[1.2] font-extrabold">Nihongo</span>
    </span>
  );
}
