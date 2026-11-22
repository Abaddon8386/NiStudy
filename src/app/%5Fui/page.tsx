import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiGallery } from "./gallery";

export const metadata: Metadata = { title: "Bộ thành phần UI", robots: { index: false, follow: false } };

/** Trang xem mẫu thành phần dùng chung; chỉ có khi chạy dev (production trả 404). */
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiGallery />;
}
