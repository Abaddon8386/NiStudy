import type { Metadata } from "next";
import { SettingsForm } from "@/components/profile/settings-form";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="px-6 py-10 lg:px-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold lg:text-[40px]">Cài đặt</h1>
      <SettingsForm />
    </main>
  );
}
