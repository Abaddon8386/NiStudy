"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { PageHeader } from "@/ui/PageHeader";
import { SpeakButton } from "@/ui/SpeakButton";
import { SectionTitle } from "@/ui/SectionTitle";

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

/**
 * Bố cục bảng theo hàng vần (hiragana; katakana suy ra bằng cách cộng 0x60). `null` là ô trống đúng vị trí
 * (ya/yu/yo, wa/wo). Ô được đặt theo ký tự nên các cặp trùng romaji (じ/ぢ, ず/づ) không lẫn.
 */
const HIRA_LAYOUT: Record<Group, (string | null)[][]> = {
  basic: [
    [..."あいうえお"],
    [..."かきくけこ"],
    [..."さしすせそ"],
    [..."たちつてと"],
    [..."なにぬねの"],
    [..."はひふへほ"],
    [..."まみむめも"],
    ["や", null, "ゆ", null, "よ"],
    [..."らりるれろ"],
    ["わ", null, null, null, "を"],
    ["ん", null, null, null, null],
  ],
  dakuten: [[..."がぎぐげご"], [..."ざじずぜぞ"], [..."だぢづでど"], [..."ばびぶべぼ"], [..."ぱぴぷぺぽ"]],
  yoon: [
    ["きゃ", "きゅ", "きょ"],
    ["しゃ", "しゅ", "しょ"],
    ["ちゃ", "ちゅ", "ちょ"],
    ["にゃ", "にゅ", "にょ"],
    ["ひゃ", "ひゅ", "ひょ"],
    ["みゃ", "みゅ", "みょ"],
    ["りゃ", "りゅ", "りょ"],
    ["ぎゃ", "ぎゅ", "ぎょ"],
    ["じゃ", "じゅ", "じょ"],
    ["びゃ", "びゅ", "びょ"],
    ["ぴゃ", "ぴゅ", "ぴょ"],
  ],
};

function toKata(c: string): string {
  return [...c].map((ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60)).join("");
}

/** Chia các chữ của một nhóm thành hàng ô theo bố cục; hàng không có chữ nào bị bỏ; chữ lạ xếp thêm cuối. */
function layoutRows(grp: Group, script: Script, list: KanaItem[]): (KanaItem | null)[][] {
  const byKana = new Map(list.map((i) => [i.kana, i]));
  const used = new Set<string>();
  const rows: (KanaItem | null)[][] = [];
  for (const row of HIRA_LAYOUT[grp]) {
    const cells = row.map((c) => {
      if (c === null) return null;
      const item = byKana.get(script === "kata" ? toKata(c) : c) ?? null;
      if (item) used.add(item.kana);
      return item;
    });
    if (cells.some(Boolean)) rows.push(cells);
  }
  const cols = HIRA_LAYOUT[grp][0].length;
  const extra = list.filter((i) => !used.has(i.kana));
  for (let k = 0; k < extra.length; k += cols) rows.push(extra.slice(k, k + cols));
  return rows;
}

const GROUPS: { grp: Group; label: string; cols: 5 | 3 }[] = [
  { grp: "basic", label: "Cơ bản", cols: 5 },
  { grp: "dakuten", label: "Âm đục", cols: 5 },
  { grp: "yoon", label: "Âm ghép", cols: 3 },
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
    <main id="noi-dung" tabIndex={-1} className="flex flex-col px-4 pt-4 pb-8 lg:px-10 lg:pt-10">
      <PageHeader title="Bảng kana" mark="kana" meta="Chọn một chữ để xem cách đọc." />

      <div role="tablist" aria-label="Bộ chữ" onKeyDown={onTabKey} className="mt-5 flex gap-2 lg:max-w-[420px]">
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
              className={`press min-h-11 flex-1 rounded-full border-2 border-ink px-4 text-base font-bold ${
                active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-sand"
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
        className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10"
      >
        <div
          className="sticky top-2 z-10 flex min-h-[148px] items-center justify-center rounded-[28px] bg-teal p-4 text-white lg:top-6 lg:order-2 lg:min-h-[320px] lg:p-6"
          data-testid="kana-detail"
        >
          <div className="flex items-center justify-center gap-5 lg:flex-col lg:gap-6">
            {/* Vùng aria-live chỉ chứa chữ và romaji; nút phát nằm ngoài để không bị đọc thêm mỗi lần chọn. */}
            <div aria-live="polite" className="flex items-baseline justify-center gap-5 lg:flex-col lg:items-center lg:gap-6">
              {chosen ? (
                <div key={chosen.id} className="fade-in flex items-baseline justify-center gap-5 lg:flex-col lg:items-center lg:gap-6">
                  <span lang="ja" className="font-kanji text-[88px] leading-none font-semibold lg:text-[160px]">
                    {chosen.kana}
                  </span>
                  <span className="text-[40px] leading-none font-extrabold text-marker">
                    <span className="sr-only">Đọc là </span>
                    {chosen.romaji}
                  </span>
                </div>
              ) : (
                <p className="text-center text-base">Chọn một chữ để xem cách đọc.</p>
              )}
            </div>
            {chosen ? <SpeakButton key={chosen.id} text={chosen.kana} className="border-paper focus-visible:outline-paper" /> : null}
          </div>
        </div>

        <div className="lg:order-1">
          {failed ? (
            <div className="mt-6">
              <Notice tone="error">Chưa tải được bảng kana.</Notice>
              <Button className="mt-3" onClick={load}>
                Thử lại
              </Button>
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
                <section key={g.grp} className="mt-8 first:mt-6" aria-labelledby={`grp-${g.grp}`}>
                  <SectionTitle id={`grp-${g.grp}`}>
                    {g.label} <span className="text-base font-normal text-ink-2">({list.length} chữ)</span>
                  </SectionTitle>
                  <div className={`mt-4 grid gap-2 lg:gap-3 ${g.cols === 5 ? "grid-cols-5" : "grid-cols-3 lg:max-w-[60%]"}`}>
                    {layoutRows(g.grp, script, list).flatMap((row, r) =>
                      row.map((cell, c) =>
                        cell ? (
                          <button
                            key={cell.id}
                            type="button"
                            lang="ja"
                            aria-pressed={cell.id === selected}
                            aria-label={`${cell.kana}, ${cell.romaji}`}
                            onClick={() => setSelected(cell.id)}
                            className={`press font-kanji min-h-16 w-full rounded-[18px] text-[32px] leading-none font-semibold transition-colors duration-150 lg:min-h-20 ${
                              cell.id === selected
                                ? "bg-marker outline-2 outline-ink"
                                : "bg-sand hover:bg-hair lg:bg-paper lg:hover:bg-hair"
                            }`}
                          >
                            {cell.kana}
                          </button>
                        ) : (
                          <span key={`gap-${r}-${c}`} aria-hidden="true" />
                        ),
                      ),
                    )}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
