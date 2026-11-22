import type { Metadata } from "next";
import { InstallGuide } from "@/components/install/install-guide";
import { PageHeader } from "@/ui/PageHeader";

export const metadata: Metadata = { title: "Cài ứng dụng" };

export default function InstallPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="px-4 pt-4 pb-10 lg:px-10 lg:pt-10">
      <PageHeader
        title="Cài ứng dụng"
        mark="ứng dụng"
        back={{ href: "/cai-dat", label: "Cài đặt" }}
        meta="Đặt Nihongo lên màn hình chính để mở nhanh, không cần gõ địa chỉ."
      />
      <InstallGuide />
    </main>
  );
}
