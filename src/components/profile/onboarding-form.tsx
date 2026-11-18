"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Notice, SubmitButton } from "@/components/auth/ui";
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
import { DateField, NumberField, RadioGroup } from "./fields";

function StepLabel({ n }: { n: number }) {
  return <p className="mt-8 text-sm font-bold text-ink-2">Bước {n} / 3</p>;
}

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
    <form onSubmit={onSubmit} noValidate>
      <StepLabel n={1} />
      <RadioGroup
        legend="Bạn muốn học cấp nào?"
        name="level"
        value={level}
        options={[
          { value: "N5", label: "N5" },
          { value: "N4", label: "N4" },
        ]}
        onChange={setLevel}
      />
      <StepLabel n={2} />
      <RadioGroup
        legend="Bạn đã biết kana chưa?"
        name="knows-kana"
        value={knowsKana ? "yes" : "no"}
        options={[
          { value: "no", label: "Chưa biết" },
          { value: "yes", label: "Đã biết" },
        ]}
        onChange={(v) => setKnowsKana(v === "yes")}
      />
      <StepLabel n={3} />
      <NumberField
        label="Thẻ mới mỗi ngày"
        value={newPerDay}
        onChange={setNewPerDay}
        error={errors.newPerDay}
        hint={`Từ 5 đến 30 thẻ. Giới hạn ôn: ${reviewLimit} lượt mỗi ngày, đổi trong Cài đặt.`}
      />
      <DateField label="Ngày thi (tùy chọn)" value={examDate} onChange={setExamDate} error={errors.examDate} />
      <SubmitButton pending={pending}>Bắt đầu học</SubmitButton>
      {saveError && <Notice kind="error">Chưa lưu được. Kiểm tra kết nối rồi thử lại. Dữ liệu bạn nhập vẫn còn.</Notice>}
    </form>
  );
}
