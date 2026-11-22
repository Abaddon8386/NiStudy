import type { Metadata } from "next";
import { OnboardingForm } from "@/components/profile/onboarding-form";
import { PageHeader } from "@/ui/PageHeader";

export const metadata: Metadata = { title: "Khởi đầu" };

export default function OnboardingPage() {
  return (
    <main
      id="noi-dung"
      tabIndex={-1}
      className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper px-4 py-8 lg:my-8 lg:min-h-0 lg:max-w-[600px] lg:rounded-[28px] lg:px-10 lg:py-10"
    >
      <PageHeader
        title="Khởi đầu"
        mark="Khởi đầu"
        meta="Chào mừng bạn đến Nihongo! Ba bước ngắn để thẻ học vừa sức bạn."
      />
      <OnboardingForm />
    </main>
  );
}
