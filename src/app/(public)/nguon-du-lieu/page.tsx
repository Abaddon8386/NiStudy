import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import sources from "../../../../data/build/data_sources.json";
import media from "../../../../public/media/credits.json";
import { Button } from "@/ui/Button";
import { Logo } from "@/ui/Logo";
import { PageHeader } from "@/ui/PageHeader";
import { SectionTitle } from "@/ui/SectionTitle";

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
const cardCls = "rounded-[28px] bg-sand p-5 lg:bg-paper";
const chipCls =
  "inline-flex min-h-8 items-center rounded-[14px] border-2 border-ink bg-paper px-3 text-[14px] leading-[1.3] font-bold lg:bg-sand";

/** Ảnh thu nhỏ: ảnh dùng chính file, video dùng ảnh poster cùng tên. */
function thumbOf(m: { file: string; kind: string }) {
  return m.kind === "video" ? m.file.replace(/\.\w+$/, "-poster.webp") : m.file;
}

export default function DataSourcesPage() {
  return (
    <div className="min-h-dvh bg-paper lg:bg-ground">
      <header className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-3 px-4 py-3 lg:px-0 lg:pt-6">
        <Link href="/gioi-thieu" className="inline-flex min-h-11 items-center rounded-full">
          <Logo />
        </Link>
        <Button href="/" variant="secondary">
          Về trang chính
        </Button>
      </header>
      <main id="noi-dung" tabIndex={-1} className="mx-auto w-full max-w-[760px] px-4 pt-6 pb-12 lg:px-0">
        <PageHeader
          title="Nguồn dữ liệu"
          mark="dữ liệu"
          meta="Nihongo dùng dữ liệu mở của các dự án dưới đây. Cảm ơn những người đã tạo ra chúng."
        />

        <ul className="mt-8 flex flex-col gap-4">
          {sources.map((s) => {
            const lic = licenceLink(s.license);
            const url = splitUrl(s.url);
            return (
              <li key={s.name} className={cardCls}>
                <h2 className="text-[20px] leading-[1.25] font-bold">{s.name}</h2>
                <p className="mt-1 text-[14px] leading-[1.4] text-ink-2">{s.author}</p>
                <p className="mt-3 text-base">
                  Giấy phép: <span className={chipCls}>{s.license}</span>
                </p>
                <p className="mt-3 text-base">Ngày tải: {viDate(s.downloaded_on)}</p>
                <p className="mt-2 text-base">{s.note}.</p>
                <div className="mt-2 flex flex-col">
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
                {url.extra ? <p className="text-[14px] leading-[1.4] text-ink-2">{url.extra}</p> : null}
              </li>
            );
          })}
        </ul>

        <section aria-labelledby="hinh-anh-video" className="mt-12">
          <SectionTitle id="hinh-anh-video">Hình ảnh và video</SectionTitle>
          <p className="mt-3 text-base">
            Ảnh và clip ở trang giới thiệu và nền các màn đăng nhập, đăng ký lấy từ các bộ sưu tập mở (Pexels License
            không bắt buộc ghi công, nhưng chúng tôi vẫn ghi). Chúng cho thấy chữ Nhật và cảnh Nhật Bản ngoài đời,
            không phải ảnh của ứng dụng hay người dùng.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {media.map((m) => (
              <li key={m.file} className={`${cardCls} flex flex-col gap-4 min-[480px]:flex-row`}>
                <Image
                  src={thumbOf(m)}
                  alt=""
                  width={320}
                  height={180}
                  loading="lazy"
                  unoptimized
                  className="h-36 w-full shrink-0 rounded-[18px] object-cover min-[480px]:size-[88px]"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base leading-[1.3] font-bold">{m.caption}</h3>
                  <p className="mt-1 text-[14px] leading-[1.4] text-ink-2">
                    {m.kind === "video" ? "Video" : "Ảnh"}: “{m.title}”, {m.creator}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.4]">
                    Giấy phép: <span className={chipCls}>{m.license}</span>
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.4] text-ink-2">Thay đổi: {m.changes}</p>
                  <div className="mt-1 flex flex-col">
                    <a className={linkCls} href={m.license_url} rel="noopener noreferrer">
                      Văn bản giấy phép {m.license}
                    </a>
                    <a className={linkCls} href={m.source_url} rel="noopener noreferrer">
                      Trang nguồn ({m.via})
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-8">
          <section>
            <SectionTitle>Dữ liệu tự biên soạn</SectionTitle>
            <p className="mt-3 text-base">
              Nghĩa tiếng Việt do dự án tự biên soạn, là bản dịch phái sinh từ nghĩa tiếng Anh của JMdict và KANJIDIC2, nên
              được phát hành theo{" "}
              <a className="underline underline-offset-4" href={BY_SA} rel="noopener noreferrer">
                CC BY-SA 4.0
              </a>
              . Âm Hán Việt chính được chọn trong các âm của KANJIDIC2.
            </p>
          </section>
          <section>
            <SectionTitle>Mã nguồn và dữ liệu tách giấy phép</SectionTitle>
            <p className="mt-3 text-base">
              Mã nguồn của Nihongo dùng giấy phép MIT. Giấy phép MIT không áp dụng cho thư mục dữ liệu <code>data/</code>: dữ
              liệu ở đó theo CC BY-SA 4.0, tách khỏi MIT. Câu ví dụ Tatoeba (CC BY) chưa được dùng; nếu thêm sau này sẽ ghi ở
              trang này.
            </p>
          </section>
          <section>
            <SectionTitle>Danh sách JLPT không chính thức</SectionTitle>
            <p className="mt-3 text-base">
              Danh sách từ vựng và kanji theo cấp N5, N4 lấy từ tanos.co.uk là danh sách không chính thức, không phải đề thi
              JLPT. Câu hỏi luyện thi do dự án tự soạn, không dùng đề JLPT thật.
            </p>
          </section>
        </div>

        <p className="mt-10">
          <Button href="/dang-nhap" variant="ghost" className="-ml-4">
            Đăng nhập
          </Button>
        </p>
      </main>
    </div>
  );
}
