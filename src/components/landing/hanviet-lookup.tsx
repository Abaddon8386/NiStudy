"use client";

import { useId, useMemo, useState } from "react";
import { lookup, type HanVietData } from "./hanviet";

const SUGGESTIONS = ["học sinh", "đại học", "thời gian", "ngoại quốc", "nhân"];

/**
 * Thứ sống của trang: gõ một âm/từ Hán Việt đã biết -> thấy chữ Nhật, cách đọc và âm HOA.
 * Dữ liệu tĩnh (truyền từ server lúc build), không gọi mạng. Không JS: hiện sẵn kết quả của `initial`.
 */
export function HanVietLookup({ data, initial = "học" }: { data: HanVietData; initial?: string }) {
  const [q, setQ] = useState(initial);
  const hits = useMemo(() => lookup(data, q), [data, q]);
  const id = useId();
  const statusId = `${id}-status`;
  const trimmed = q.trim();

  return (
    <div className="lp-lookup" data-ui="">
      <form role="search" onSubmit={(e) => e.preventDefault()} aria-describedby={statusId}>
        <label htmlFor={`${id}-q`} className="block text-[18px] font-bold">
          Gõ một từ Hán Việt bạn biết
        </label>
        <input
          id={`${id}-q`}
          className="lp-lookup-input mt-3"
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Gợi ý" role="group">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="lp-chip press" aria-pressed={q === s} onClick={() => setQ(s)}>
            {s}
          </button>
        ))}
      </div>
      <p id={statusId} role="status" className="mt-4 text-[14px] text-ink-2">
        {!trimmed
          ? "Gõ ví dụ: học, sinh, thời gian."
          : hits.length
            ? `${hits.length} chữ và từ khớp với “${trimmed}”.`
            : `Chưa có chữ nào khớp với “${trimmed}” trong kanji N5–N4. Thử một âm khác.`}
      </p>
      <ul className="lp-lookup-hits mt-3">
        {hits.map((h) => (
          <li key={h.ja} className="lp-hit">
            <span lang="ja" className={h.kind === "kanji" ? "lp-hit-ja font-kanji" : "lp-hit-ja font-jp"}>
              {h.ja}
            </span>
            <span className="lp-hit-hv">{h.hv.toLocaleUpperCase("vi")}</span>
            <span lang="ja" className="lp-hit-reading font-jp">
              {h.reading}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
