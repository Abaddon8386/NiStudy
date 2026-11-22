"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchProfile,
  localDateString,
  parseNumberInput,
  REVIEW_LIMIT_DEFAULT,
  updateProfile,
  validateSettings,
  type Level,
  type SettingsErrors,
} from "@/lib/profile/settings";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { Notice } from "@/ui/Notice";
import { Seal } from "@/ui/Seal";
import { TextField } from "@/ui/TextField";
import { Reveal } from "@/ui/motion/Reveal";
import { ChoiceCards } from "./choice-cards";

export function OnboardingForm() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [reviewLimit, setReviewLimit] = useState(REVIEW_LIMIT_DEFAULT);
  const [level, setLevel] = useState<Level>("N5");
  const [knowsKana, setKnowsKana] = useState(false);
  const [newPerDay, setNewPerDay] = useState("10");
  const [examDate, setExamDate] = useState("");
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((r) => {
      if (cancelled) return;
      if (r.ok && r.data.profile.onboardedAt) {
        router.replace("/");
        return;
      }
      if (r.ok) setReviewLimit(r.data.profile.reviewLimit);
      setChecked(true); // lỗi tải (offline): vẫn cho nhập, lỗi lưu sẽ báo sau
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setSaveError(false);
    const patch = {
      level,
      knowsKana,
      newPerDay: parseNumberInput(newPerDay),
      examDate: examDate.trim() === "" ? null : examDate.trim(),
    };
    const found = validateSettings(patch, localDateString());
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setPending(true);
    const r = await updateProfile({ ...patch, onboardedAt: new Date().toISOString() });
    if (r.ok) {
      router.replace("/");
      return;
    }
    setPending(false);
    setSaveError(true);
  }

  if (!checked) return <div aria-busy="true" className="mt-6 min-h-40" />;

  return (
    <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
      <Reveal index={0}>
        <Card tone="outlined">
          <ChoiceCards
            seal="一"
            legend="Bạn muốn học cấp nào?"
            name="level"
            value={level}
            onChange={setLevel}
            options={[
              { value: "N5", label: "N5", big: true, description: "Nền tảng: kana, từ và mẫu câu hằng ngày." },
              { value: "N4", label: "N4", big: true, description: "Nâng lên: hội thoại đơn giản, nhiều kanji hơn." },
            ]}
          />
        </Card>
      </Reveal>
      <Reveal index={1}>
        <Card tone="outlined">
          <ChoiceCards
            seal="二"
            legend="Bạn đã biết kana chưa?"
            name="knows-kana"
            value={knowsKana ? "yes" : "no"}
            onChange={(v) => setKnowsKana(v === "yes")}
            options={[
              {
                value: "no",
                label: "Chưa biết",
                glyph: "あ",
                description: "Bắt đầu với 46 hiragana cơ bản, rồi xen kanji và từ vựng.",
              },
              {
                value: "yes",
                label: "Đã biết",
                glyph: "ア",
                description: "Vào thẳng kanji và từ vựng, không có thẻ kana mới.",
              },
            ]}
          />
        </Card>
      </Reveal>
      <Reveal index={2}>
        <Card tone="outlined">
          <div className="flex items-center gap-3">
            <Seal char="三" size={36} />
            <h2 className="text-[20px] leading-[1.25] font-bold">Mục tiêu và ngày thi</h2>
          </div>
          <TextField
            className="mt-5"
            label="Thẻ mới mỗi ngày"
            inputMode="numeric"
            value={newPerDay}
            onChange={setNewPerDay}
            error={errors.newPerDay}
            hint={`Từ 5 đến 30 thẻ. Giới hạn ôn: ${reviewLimit} lượt mỗi ngày, đổi trong Cài đặt.`}
          />
          <TextField
            className="mt-5"
            label="Ngày thi (tùy chọn)"
            type="date"
            value={examDate}
            onChange={setExamDate}
            error={errors.examDate}
          />
        </Card>
      </Reveal>
      <Reveal index={3}>
        <Button type="submit" size="lg" loading={pending} className="w-full">
          Bắt đầu học
        </Button>
        {saveError && (
          <Notice tone="error" className="mt-4">
            Chưa lưu được. Kiểm tra kết nối rồi thử lại. Dữ liệu bạn nhập vẫn còn.
          </Notice>
        )}
      </Reveal>
    </form>
  );
}
