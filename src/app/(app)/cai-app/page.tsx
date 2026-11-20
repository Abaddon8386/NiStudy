import type { Metadata } from "next";
import { InstallGuide } from "@/components/install/install-guide";

export const metadata: Metadata = { title: "Cài ứng dụng" };

export default function InstallPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="px-6 py-10 lg:px-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold lg:text-[40px]">Cài ứng dụng</h1>
      <p className="mt-4 max-w-[640px] text-base">
        Đặt Nihongo lên màn hình chính để mở nhanh, không cần gõ địa chỉ.
      </p>
      <InstallGuide />
    </main>
  );
}
