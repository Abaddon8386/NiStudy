import Link from "next/link";
import { ProfileSummary } from "@/components/profile/profile-summary";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col bg-paper">
      <section className="bg-teal px-6 py-10 text-white">
        <h1 className="text-[32px] leading-[1.15] font-extrabold">Nihongo</h1>
        <p className="mt-3 text-base">Đang dựng khung ứng dụng (giai đoạn 4).</p>
        <ProfileSummary />
      </section>
      <p className="px-6 pt-6 text-base">
        <Link className="inline-flex min-h-11 items-center font-medium underline underline-offset-4" href="/cai-dat">
          Cài đặt
        </Link>
      </p>
      <p className="px-6 pb-6 text-base text-ink-2">
        <a className="inline-flex min-h-11 items-center underline underline-offset-4" href="/nguon-du-lieu">
          Nguồn dữ liệu và giấy phép
        </a>
      </p>
    </main>
  );
}
