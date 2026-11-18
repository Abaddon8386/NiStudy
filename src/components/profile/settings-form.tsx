"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Notice } from "@/components/auth/ui";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  fetchProfile,
  localDateString,
  parseNumberInput,
  updateProfile,
  validateSettings,
  type Level,
  type ProfileSettings,
  type SettingsErrors,
  type SettingsPatch,
} from "@/lib/profile/settings";
import { DateField, NumberField, RadioGroup } from "./fields";
import { SaveStatus, type SaveState } from "./save-status";

type Field = "level" | "knowsKana" | "newPerDay" | "reviewLimit" | "examDate";
const DEBOUNCE_MS = 600;
const EMPTY_STATUS: Record<Field, SaveState> = {
  level: "idle",
  knowsKana: "idle",
  newPerDay: "idle",
  reviewLimit: "idle",
  examDate: "idle",
};

export function SettingsForm() {
  const [loaded, setLoaded] = useState<{ email: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [level, setLevel] = useState<Level>("N5");
  const [knowsKana, setKnowsKana] = useState(false);
  const [newPerDay, setNewPerDay] = useState("10");
  const [reviewLimit, setReviewLimit] = useState("100");
  const [examDate, setExamDate] = useState("");
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [status, setStatus] = useState(EMPTY_STATUS);

  const saved = useRef<ProfileSettings | null>(null);
  const timers = useRef<Partial<Record<Field, ReturnType<typeof setTimeout>>>>({});
  const retries = useRef<Partial<Record<Field, () => void>>>({});

  const load = useCallback(async () => {
    setLoadError(false);
    const r = await fetchProfile();
    if (!r.ok) {
      setLoadError(true);
      return;
    }
    const p = r.data.profile;
    saved.current = p;
    setLevel(p.level);
    setKnowsKana(p.knowsKana);
    setNewPerDay(String(p.newPerDay));
    setReviewLimit(String(p.reviewLimit));
    setExamDate(p.examDate ?? "");
    setLoaded({ email: r.data.email });
  }, []);

  useEffect(() => {
    const t = timers.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- tải dữ liệu ban đầu
    void load();
    return () => Object.values(t).forEach((id) => clearTimeout(id));
  }, [load]);

  const setFieldStatus = (f: Field, s: SaveState) => setStatus((prev) => ({ ...prev, [f]: s }));

  async function save(field: Field, patch: SettingsPatch) {
    setFieldStatus(field, "saving");
    retries.current[field] = () => void save(field, patch);
    const r = await updateProfile(patch);
    if (r.ok) {
      if (saved.current) saved.current = { ...saved.current, ...patch };
      setFieldStatus(field, "saved");
    } else {
      setFieldStatus(field, "failed");
    }
  }

  /** Kiểm rồi lưu một trường chữ/số; giá trị không hợp lệ chỉ hiện lỗi, không gửi. */
  function commit(field: "newPerDay" | "reviewLimit" | "examDate", text: string) {
    clearTimeout(timers.current[field]);
    const patch: SettingsPatch =
      field === "examDate"
        ? { examDate: text.trim() === "" ? null : text.trim() }
        : { [field]: parseNumberInput(text) };
    const found = validateSettings(patch, localDateString());
    setErrors((prev) => ({ ...prev, [field]: found[field] }));
    if (found[field]) {
      setFieldStatus(field, "idle");
      return;
    }
    if (saved.current && saved.current[field] === (patch as Record<string, unknown>)[field]) return;
    void save(field, patch);
  }

  function onTextChange(field: "newPerDay" | "reviewLimit" | "examDate", text: string) {
    ({ newPerDay: setNewPerDay, reviewLimit: setReviewLimit, examDate: setExamDate })[field](text);
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => commit(field, text), DEBOUNCE_MS);
  }

  const statusFor = (f: Field) => <SaveStatus state={status[f]} onRetry={() => retries.current[f]?.()} />;

  if (loadError) {
    return (
      <div className="mt-6">
        <Notice kind="error">Chưa tải được cài đặt. Kiểm tra kết nối rồi thử lại.</Notice>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 min-h-11 rounded-full border-2 border-ink bg-paper px-6 text-base font-bold"
        >
          Thử lại
        </button>
      </div>
    );
  }
  if (!loaded) return <p className="mt-6 text-base text-ink-2">Đang tải…</p>;

  return (
    <>
      <section aria-labelledby="learn-h" className="mt-8">
        <h2 id="learn-h" className="text-[24px] font-extrabold">
          Học tập
        </h2>
        <RadioGroup
          legend="Cấp đang học"
          name="level"
          value={level}
          options={[
            { value: "N5", label: "N5" },
            { value: "N4", label: "N4" },
          ]}
          hint="Đổi cấp chỉ đổi nguồn thẻ mới. Thẻ đã học vẫn đến hạn ôn."
          onChange={(v) => {
            setLevel(v);
            void save("level", { level: v });
          }}
          status={statusFor("level")}
        />
        <RadioGroup
          legend="Bạn đã biết kana chưa?"
          name="knows-kana"
          value={knowsKana ? "yes" : "no"}
          options={[
            { value: "no", label: "Chưa biết" },
            { value: "yes", label: "Đã biết" },
          ]}
          onChange={(v) => {
            setKnowsKana(v === "yes");
            void save("knowsKana", { knowsKana: v === "yes" });
          }}
          status={statusFor("knowsKana")}
        />
        <NumberField
          label="Thẻ mới mỗi ngày"
          value={newPerDay}
          onChange={(v) => onTextChange("newPerDay", v)}
          onBlur={() => commit("newPerDay", newPerDay)}
          error={errors.newPerDay}
          hint="Từ 5 đến 30 thẻ."
          status={statusFor("newPerDay")}
        />
        <NumberField
          label="Giới hạn ôn mỗi ngày"
          value={reviewLimit}
          onChange={(v) => onTextChange("reviewLimit", v)}
          onBlur={() => commit("reviewLimit", reviewLimit)}
          error={errors.reviewLimit}
          hint="Từ 50 đến 500 lượt."
          status={statusFor("reviewLimit")}
        />
        <DateField
          label="Ngày thi (tùy chọn)"
          value={examDate}
          onChange={(v) => onTextChange("examDate", v)}
          onBlur={() => commit("examDate", examDate)}
          error={errors.examDate}
          status={statusFor("examDate")}
        >
          {examDate !== "" && (
            <button
              type="button"
              onClick={() => {
                setExamDate("");
                commit("examDate", "");
              }}
              className="mt-2 min-h-11 rounded-full border-2 border-ink bg-paper px-5 text-base font-bold"
            >
              Xóa ngày thi
            </button>
          )}
        </DateField>
      </section>

      <section aria-labelledby="account-h" className="mt-10">
        <h2 id="account-h" className="text-[24px] font-extrabold">
          Tài khoản
        </h2>
        <p className="mt-3 text-base">
          <span className="font-bold">Email: </span>
          <span className="break-all">{loaded.email}</span>
        </p>
        <SignOutButton />
      </section>

      <p className="mt-8">
        <Link className="inline-flex min-h-11 items-center text-base text-ink-2 underline underline-offset-4" href="/nguon-du-lieu">
          Nguồn dữ liệu
        </Link>
      </p>
    </>
  );
}
