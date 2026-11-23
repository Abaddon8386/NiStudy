"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DeleteAccount } from "@/components/account/delete-account";
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
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { Panel } from "@/ui/Panel";
import { SectionTitle } from "@/ui/SectionTitle";
import { Switch } from "@/ui/Switch";
import { SoundSettings } from "./sound-settings";
import { ChipRow, DateRow, NumberRow } from "./fields";
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
        <Notice tone="error">Chưa tải được cài đặt. Kiểm tra kết nối rồi thử lại.</Notice>
        <Button variant="secondary" className="mt-4" onClick={() => void load()}>
          Thử lại
        </Button>
      </div>
    );
  }
  if (!loaded) return <p className="mt-6 text-base text-ink-2">Đang tải…</p>;

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-10">
      <section aria-labelledby="learn-h" className="flex flex-col gap-4">
        <SectionTitle id="learn-h">Học tập</SectionTitle>
        <Panel rows>
          <ChipRow
            label="Cấp đang học"
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
          <div className="py-2">
            <Switch
              label="Đã biết kana"
              description="Bật thì sẽ không có thẻ kana mới."
              checked={knowsKana}
              onChange={(v) => {
                setKnowsKana(v);
                void save("knowsKana", { knowsKana: v });
              }}
            />
            <div className="mt-1">{statusFor("knowsKana")}</div>
          </div>
          <NumberRow
            label="Thẻ mới mỗi ngày"
            value={newPerDay}
            onChange={(v) => onTextChange("newPerDay", v)}
            onBlur={() => commit("newPerDay", newPerDay)}
            error={errors.newPerDay}
            hint="Từ 5 đến 30 thẻ."
            status={statusFor("newPerDay")}
          />
          <NumberRow
            label="Giới hạn ôn mỗi ngày"
            value={reviewLimit}
            onChange={(v) => onTextChange("reviewLimit", v)}
            onBlur={() => commit("reviewLimit", reviewLimit)}
            error={errors.reviewLimit}
            hint="Từ 50 đến 500 lượt."
            status={statusFor("reviewLimit")}
          />
          <DateRow
            label="Ngày thi (tùy chọn)"
            value={examDate}
            onChange={(v) => onTextChange("examDate", v)}
            onBlur={() => commit("examDate", examDate)}
            error={errors.examDate}
            status={statusFor("examDate")}
          >
            {examDate !== "" && (
              <Button
                variant="secondary"
                onClick={() => {
                  setExamDate("");
                  commit("examDate", "");
                }}
              >
                Xóa ngày thi
              </Button>
            )}
          </DateRow>
        </Panel>
      </section>

      <div className="flex flex-col gap-8">
        <section aria-labelledby="account-h" className="flex flex-col gap-4">
          <SectionTitle id="account-h">Tài khoản</SectionTitle>
          <Panel rows>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-4">
              <span className="text-base font-medium">Email</span>
              <span className="min-w-0 text-base break-all text-ink-2">{loaded.email}</span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
              <span className="text-base font-medium">Phiên đăng nhập</span>
              <SignOutButton />
            </div>
          </Panel>
        </section>

        <SoundSettings />

        <section aria-labelledby="app-h" className="flex flex-col gap-4">
          <SectionTitle id="app-h">Ứng dụng</SectionTitle>
          <Panel rows>
            <LinkRow href="/cai-app" label="Cài ứng dụng lên thiết bị" />
          </Panel>
        </section>

        <section aria-labelledby="info-h" className="flex flex-col gap-4">
          <SectionTitle id="info-h">Thông tin</SectionTitle>
          <Panel rows>
            <LinkRow href="/nguon-du-lieu" label="Nguồn dữ liệu" />
          </Panel>
        </section>

        <DeleteAccount />
      </div>
    </div>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="press flex min-h-14 items-center justify-between gap-3 text-base font-medium">
      {label}
      <span aria-hidden="true" className="text-[20px] leading-none">
        →
      </span>
    </Link>
  );
}
