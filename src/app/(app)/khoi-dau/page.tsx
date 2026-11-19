import type { Metadata } from "next";
import { OnboardingForm } from "@/components/profile/onboarding-form";

export const metadata: Metadata = { title: "Khởi đầu" };

export default function OnboardingPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper px-6 py-10 lg:my-8 lg:min-h-0 lg:max-w-[560px] lg:rounded-[28px] lg:border lg:border-hair lg:px-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold">Khởi đầu</h1>
      <OnboardingForm />
    </main>
  );
}
