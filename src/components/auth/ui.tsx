"use client";

import Link from "next/link";
import { useId, useState } from "react";

export const inputClass =
  "h-12 w-full rounded-[14px] border-2 border-ink bg-paper px-3 text-[18px] font-medium text-ink aria-[invalid=true]:border-bad";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main id="noi-dung" tabIndex={-1} className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="hidden flex-col justify-between bg-teal p-12 text-white lg:flex">
        <p className="text-[24px] font-extrabold">Nihongo</p>
        <div>
          <span
            aria-hidden="true"
            lang="ja"
            className="mb-8 flex size-32 items-center justify-center rounded-full border-[3px] border-seal-edge bg-seal font-kanji text-[64px] font-semibold"
          >
            日
          </span>
          <p className="max-w-[360px] text-[24px] leading-snug font-bold">
            Học kanji qua âm Hán Việt, ôn tập theo FSRS, bám lộ trình JLPT N5–N4.
          </p>
        </div>
      </div>
      <div className="lg:flex lg:items-center lg:justify-center lg:p-8">
        <div className="mx-auto flex min-h-dvh w-full max-w-[400px] flex-col justify-center px-6 py-10 lg:min-h-0 lg:max-w-[440px] lg:rounded-[28px] lg:border lg:border-hair lg:bg-paper lg:px-10 lg:py-12">
          <p className="text-[18px] font-extrabold text-teal lg:hidden">Nihongo</p>
          <h1 className="mt-2 mb-6 text-[32px] leading-[1.15] font-extrabold lg:mt-0">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  );
}

export function SourceLink() {
  return (
    <p className="mt-8">
      <Link className="inline-flex min-h-11 items-center text-base text-ink-2 underline underline-offset-4" href="/nguon-du-lieu">
        Nguồn dữ liệu
      </Link>
    </p>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link className="inline-flex min-h-11 items-center text-base font-medium underline underline-offset-4" href={href}>
      {children}
    </Link>
  );
}

/** Thông báo: lỗi dùng role="alert", thông tin trung tính dùng role="status". */
export function Notice({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mt-4 text-base ${kind === "error" ? "font-medium text-bad" : "rounded-[14px] bg-paper p-3 text-ink lg:bg-sand"}`}
    >
      {children}
    </p>
  );
}

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  type?: "email" | "password";
  hint?: string;
  error?: string;
};

export function Field({ label, name, value, onChange, autoComplete, type = "email", hint, error }: FieldProps) {
  const id = useId();
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";
  const describedBy = [error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="mt-5">
      <label htmlFor={id} className="block text-base font-bold">
        {label}
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id={id}
          name={name}
          type={isPassword && shown ? "text" : type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-pressed={shown}
            className="min-h-12 min-w-[72px] shrink-0 rounded-[14px] border-2 border-ink bg-paper px-3 text-base font-bold"
          >
            {shown ? "Ẩn" : "Hiện"}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-2">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} role="alert" className="mt-1 text-base font-medium text-bad">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  variant = "primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`mt-6 h-14 w-full rounded-full text-[18px] font-bold text-ink disabled:cursor-default disabled:opacity-60 ${
        variant === "primary" ? "bg-marker" : "border-2 border-ink bg-paper"
      }`}
    >
      {children}
    </button>
  );
}
