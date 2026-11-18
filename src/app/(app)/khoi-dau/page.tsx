import type { Metadata } from "next";
import { OnboardingForm } from "@/components/profile/onboarding-form";

export const metadata: Metadata = { title: "Khởi đầu" };

export default function OnboardingPage() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-paper px-6 py-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold">Khởi đầu</h1>
      <OnboardingForm />
    </main>
  );
}
