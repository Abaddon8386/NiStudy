import type { Metadata } from "next";
import Link from "next/link";
import sources from "../../../../data/build/data_sources.json";

export const metadata: Metadata = {
  title: "Nguồn dữ liệu",
  description: "Nguồn và giấy phép của dữ liệu từ vựng, kanji và câu ví dụ trong Nihongo.",
};

const BY_SA = "https://creativecommons.org/licenses/by-sa/4.0/";
const BY = "https://creativecommons.org/licenses/by/4.0/";

/** Giấy phép ghi trong data_sources.json -> liên kết tới văn bản giấy phép. */
function licenceLink(licence: string) {
  if (licence.startsWith("CC BY-SA")) return { href: BY_SA, label: "Văn bản giấy phép CC BY-SA 4.0" };
  if (licence.startsWith("CC BY")) return { href: BY, label: "Văn bản giấy phép CC BY" };
  return null;
}

/** "https://x (ghi chú)" -> { href, extra }. */
function splitUrl(url: string) {
  const m = url.match(/^(https?:\/\/\S+)\s*(.*)$/);
  return m ? { href: m[1], extra: m[2] } : { href: null, extra: url };
}

/** "2026-11-18" -> "18/11/2026". */
function viDate(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

const linkCls = "inline-flex min-h-11 items-center break-all text-base underline underline-offset-4";

export default function DataSourcesPage() {
  return (
    <main id="noi-dung" tabIndex={-1} className="mx-auto w-full max-w-[640px] bg-paper px-6 py-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold">Nguồn dữ liệu</h1>
      <p className="mt-4 text-base">
        Nihongo dùng dữ liệu mở của các dự án dưới đây. Cảm ơn những người đã tạo ra chúng.
      </p>

      <ul className="mt-8 space-y-6">
        {sources.map((s) => {
          const lic = licenceLink(s.license);
          const url = splitUrl(s.url);
          return (
            <li key={s.name} className="border-2 border-ink p-4">
              <h2 className="text-xl font-bold">{s.name}</h2>
              <p className="mt-1 text-[14px] text-ink-2">{s.author}</p>
              <p className="mt-2 text-base">
                Giấy phép: <strong>{s.license}</strong>
              </p>
              <p className="mt-2 text-base">Ngày tải: {viDate(s.downloaded_on)}</p>
              <p className="mt-2 text-base">{s.note}.</p>
              <div className="mt-1 flex flex-col">
                {lic ? (
                  <a className={linkCls} href={lic.href} rel="noopener noreferrer">
                    {lic.label}
                  </a>
                ) : null}
                {url.href ? (
                  <a className={linkCls} href={url.href} rel="noopener noreferrer">
                    Trang nguồn
                  </a>
                ) : null}
              </div>
              {url.extra ? <p className="text-[14px] text-ink-2">{url.extra}</p> : null}
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-xl font-bold">Dữ liệu tự biên soạn</h2>
      <p className="mt-2 text-base">
        Nghĩa tiếng Việt do dự án tự biên soạn, là bản dịch phái sinh từ nghĩa tiếng Anh của JMdict và
        KANJIDIC2, nên được phát hành theo{" "}
        <a className="underline underline-offset-4" href={BY_SA} rel="noopener noreferrer">
          CC BY-SA 4.0
        </a>
        . Âm Hán Việt chính được chọn trong các âm của KANJIDIC2.
      </p>

      <h2 className="mt-10 text-xl font-bold">Mã nguồn và dữ liệu tách giấy phép</h2>
      <p className="mt-2 text-base">
        Mã nguồn của Nihongo dùng giấy phép MIT. Giấy phép MIT không áp dụng cho thư mục dữ liệu{" "}
        <code>data/</code>: dữ liệu ở đó theo CC BY-SA 4.0, tách khỏi MIT. Câu ví dụ Tatoeba (CC BY) chưa
        được dùng; nếu thêm sau này sẽ ghi ở trang này.
      </p>

      <h2 className="mt-10 text-xl font-bold">Danh sách JLPT không chính thức</h2>
      <p className="mt-2 text-base">
        Danh sách từ vựng và kanji theo cấp N5, N4 lấy từ tanos.co.uk là danh sách không chính thức, không
        phải đề thi JLPT. Câu hỏi luyện thi do dự án tự soạn, không dùng đề JLPT thật.
      </p>

      <p className="mt-8 flex flex-col">
        <Link className="inline-flex min-h-11 items-center text-base underline underline-offset-4" href="/">
          Về trang chính
        </Link>
        <Link className="inline-flex min-h-11 items-center text-base underline underline-offset-4" href="/dang-nhap">
          Đăng nhập
        </Link>
      </p>
    </main>
  );
}
