"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { Notice } from "@/ui/Notice";
import { PageHeader } from "@/ui/PageHeader";
import { Seal } from "@/ui/Seal";
import { Reveal } from "@/ui/motion/Reveal";
import { learnedGrammarIds, listGrammar, type GrammarListItem } from "@/lib/learning/grammar";

interface GrammarData {
  points: GrammarListItem[];
  learned: Set<string>;
}

type Level = "N5" | "N4";
const LEVELS: { level: Level; soon: boolean }[] = [
  { level: "N5", soon: false },
  { level: "N4", soon: true },
];

export function GrammarList() {
  const [data, setData] = useState<GrammarData | null>(null);
  const [failed, setFailed] = useState(false);
  const [level, setLevel] = useState<Level>("N5");

  function load() {
    setFailed(false);
    setData(null);
    Promise.all([
      listGrammar(),
      // Lỗi đọc trạng thái chỉ làm mất nhãn "Đã học", không chặn danh sách.
      learnedGrammarIds().catch(() => new Set<string>()),
    ])
      .then(([points, learned]) => setData({ points, learned }))
      .catch(() => setFailed(true));
  }
  useEffect(() => {
    // Tải nội dung khi vào trang.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const list = (data?.points ?? []).filter((p) => p.level === level);

  return (
    <main id="noi-dung" tabIndex={-1} className="flex flex-col px-4 pt-4 pb-8 lg:px-10 lg:pt-10">
      <PageHeader title="Ngữ pháp" mark="Ngữ pháp" meta="Từng điểm ngữ pháp: mẫu câu, ví dụ có furigana và bài luyện ngắn." />

      <div role="tablist" aria-label="Cấp độ" className="mt-5 flex gap-2 lg:max-w-[420px]">
        {LEVELS.map((l) => {
          const active = l.level === level;
          return (
            <button
              key={l.level}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setLevel(l.level)}
              className={`press min-h-11 flex-1 rounded-full border-2 border-ink px-4 text-base font-bold ${
                active ? "bg-ink text-paper" : "bg-paper text-ink hover:bg-sand"
              }`}
            >
              {l.level}
              {l.soon ? <span className="ml-1.5 text-[14px] font-medium">Sắp có</span> : null}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" aria-label={`Ngữ pháp ${level}`} className="mt-6">
        {failed ? (
          <div>
            <Notice tone="error">Chưa tải được danh sách ngữ pháp.</Notice>
            <Button className="mt-3" onClick={load}>
              Thử lại
            </Button>
          </div>
        ) : data === null ? (
          <p role="status" className="text-center text-base text-ink-2">
            Đang tải…
          </p>
        ) : list.length === 0 ? (
          level === "N4" ? (
            <EmptyState title="Ngữ pháp N4 sắp có" body="Bạn có thể học ngữ pháp N5 trước." />
          ) : (
            <EmptyState title="Bài ngữ pháp đang được soạn" body="Khi có bài đã duyệt, danh sách sẽ hiện ở đây." />
          )
        ) : (
          <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 lg:grid-cols-2">
            {list.map((p, i) => (
              <Reveal as="li" key={p.cardId} index={Math.min(i, 6)}>
                <Link
                  href={`/ngu-phap/${encodeURIComponent(p.pointId)}`}
                  className="press flex min-h-[88px] items-start gap-4 rounded-[22px] bg-sand p-4 hover:bg-hair lg:bg-paper lg:hover:bg-sand"
                >
                  <Seal char={String(p.sort)} size={36} rotate={i % 2 ? 4 : -4} />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span lang="ja" className="font-jp text-[22px] leading-[1.3] font-bold">
                        {p.title}
                      </span>
                      {data.learned.has(p.cardId) ? (
                        <span className="rounded-lg bg-marker px-2 py-0.5 text-[14px] font-bold">Đã học</span>
                      ) : null}
                    </span>
                    <span lang="ja" className="font-jp mt-1 block text-base text-ink-2 [overflow-wrap:anywhere]">
                      {p.pattern}
                    </span>
                    <span className="mt-1 block text-base">{p.meaning_vi}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
