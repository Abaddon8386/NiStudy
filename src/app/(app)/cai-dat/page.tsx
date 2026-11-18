import type { Metadata } from "next";
import Link from "next/link";
import { SettingsForm } from "@/components/profile/settings-form";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper px-6 py-10">
      <Link className="inline-flex min-h-11 items-center text-base text-ink-2 underline underline-offset-4" href="/">
        Trang chính
      </Link>
      <h1 className="mt-2 text-[32px] leading-[1.15] font-extrabold">Cài đặt</h1>
      <SettingsForm />
    </main>
  );
}
