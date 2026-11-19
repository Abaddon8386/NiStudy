"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Script = "hira" | "kata";
type Group = "basic" | "dakuten" | "yoon";

interface KanaItem {
  id: string;
  script: Script;
  kana: string;
  romaji: string;
  grp: Group;
}

interface KanaRow {
  id: string;
  sort_order: number;
  kana_details: Omit<KanaItem, "id"> | Omit<KanaItem, "id">[] | null;
}

const TABS: { script: Script; label: string }[] = [
  { script: "hira", label: "Hiragana" },
  { script: "kata", label: "Katakana" },
];

const GROUPS: { grp: Group; label: string; cols: string }[] = [
  { grp: "basic", label: "Cơ bản", cols: "grid-cols-5 lg:grid-cols-10" },
  { grp: "dakuten", label: "Âm đục", cols: "grid-cols-5 lg:grid-cols-10" },
  { grp: "yoon", label: "Âm ghép", cols: "grid-cols-3 lg:grid-cols-6" },
];

/** FR-10: đọc bảng cards + kana_details (nội dung công khai, RLS cho phép SELECT). */
async function fetchKana(): Promise<KanaItem[]> {
  const { data, error } = await createClient()
    .from("cards")
    .select("id, sort_order, kana_details(script, kana, romaji, grp)")
    .eq("kind", "kana")
    .eq("published", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  const items: KanaItem[] = [];
  for (const row of (data ?? []) as unknown as KanaRow[]) {
    const d = Array.isArray(row.kana_details) ? row.kana_details[0] : row.kana_details;
    if (d) items.push({ id: row.id, ...d });
  }
  return items;
}

export function KanaBoard() {
  const [items, setItems] = useState<KanaItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [script, setScript] = useState<Script>("hira");
  const [selected, setSelected] = useState<string | null>(null);
  const tabRefs = useRef<Record<Script, HTMLButtonElement | null>>({ hira: null, kata: null });

  function load() {
    setFailed(false);
    setItems(null);
    fetchKana()
      .then(setItems)
      .catch(() => setFailed(true));
  }

  useEffect(() => {
    // Tải nội dung khi vào trang.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const inScript = useMemo(() => (items ?? []).filter((i) => i.script === script), [items, script]);
  const chosen = inScript.find((i) => i.id === selected) ?? null;

  function selectTab(next: Script) {
    setScript(next);
    setSelected(null);
    tabRefs.current[next]?.focus();
  }

  function onTabKey(e: React.KeyboardEvent) {
    const i = TABS.findIndex((t) => t.script === script);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next === null) return;
    e.preventDefault();
    selectTab(TABS[next].script);
  }

  return (
    <main id="noi-dung" tabIndex={-1} className="flex flex-col px-4 pt-6 pb-8 lg:px-10 lg:pt-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold lg:text-[40px]">Bảng kana</h1>

      <div role="tablist" aria-label="Bộ chữ" onKeyDown={onTabKey} className="mt-4 flex gap-2 lg:max-w-[420px]">
        {TABS.map((t) => {
          const active = t.script === script;
          return (
            <button
              key={t.script}
              ref={(el) => {
                tabRefs.current[t.script] = el;
              }}
              id={`tab-${t.script}`}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="kana-panel"
              tabIndex={active ? 0 : -1}
              onClick={() => selectTab(t.script)}
              className={`min-h-11 flex-1 rounded-full border-2 border-ink px-4 text-base font-bold ${
                active ? "bg-ink text-paper" : "bg-paper text-ink"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        id="kana-panel"
        role="tabpanel"
        aria-labelledby={`tab-${script}`}
        className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-10"
      >
        <div
          aria-live="polite"
          className="flex min-h-[140px] items-center justify-center gap-6 rounded-[28px] border-2 border-ink bg-sand p-4 lg:sticky lg:top-6 lg:order-2 lg:min-h-[260px] lg:flex-col lg:gap-4"
          data-testid="kana-detail"
        >
          {chosen ? (
            <div key={chosen.id} className="fade-in flex items-center justify-center gap-6 lg:flex-col lg:gap-4">
              <span lang="ja" className="font-jp text-[96px] leading-none font-medium">
                {chosen.kana}
              </span>
              <span className="text-[40px] leading-tight font-extrabold">
                <span className="sr-only">Đọc là </span>
                {chosen.romaji}
              </span>
            </div>
          ) : (
            <p className="text-center text-base text-ink-2">Chọn một chữ để xem cách đọc.</p>
          )}
        </div>

        <div className="lg:order-1">
        {failed ? (
          <div className="mt-6 text-center">
            <p role="alert" className="text-base">
              Chưa tải được bảng kana.
            </p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-base font-bold text-paper"
            >
              Thử lại
            </button>
          </div>
        ) : items === null ? (
          <p role="status" className="mt-6 text-center text-base text-ink-2">
            Đang tải…
          </p>
        ) : (
          GROUPS.map((g) => {
            const list = inScript.filter((i) => i.grp === g.grp);
            if (list.length === 0) return null;
            return (
              <section key={g.grp} className="mt-6" aria-labelledby={`grp-${g.grp}`}>
                <h2 id={`grp-${g.grp}`} className="mb-2 text-[20px] leading-snug font-bold">
                  {g.label} <span className="text-base font-normal text-ink-2">({list.length} chữ)</span>
                </h2>
                <ul className={`grid gap-2 ${g.cols}`}>
                  {list.map((i) => (
                    <li key={i.id}>
                      <button
                        type="button"
                        lang="ja"
                        aria-pressed={i.id === selected}
                        aria-label={`${i.kana}, ${i.romaji}`}
                        onClick={() => setSelected(i.id)}
                        className={`font-jp min-h-14 w-full rounded-[14px] border-2 border-ink text-[24px] font-medium transition-colors duration-150 ${
                          i.id === selected ? "bg-marker" : "bg-paper"
                        }`}
                      >
                        {i.kana}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })
        )}
        </div>
      </div>
    </main>
  );
}
