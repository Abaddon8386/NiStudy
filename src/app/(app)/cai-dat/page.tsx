import type { Metadata } from "next";
import { SettingsForm } from "@/components/profile/settings-form";
import { Button } from "@/ui/Button";
import { PageHeader } from "@/ui/PageHeader";

export const metadata: Metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="px-4 pt-4 pb-10 lg:px-10 lg:pt-10">
      <div className="lg:hidden">
        <Button href="/" variant="ghost" className="-ml-4 mb-1">
          <span aria-hidden="true">←</span>
          Trang chính
        </Button>
      </div>
      <PageHeader title="Cài đặt" mark="Cài đặt" />
      <SettingsForm />
    </main>
  );
}
