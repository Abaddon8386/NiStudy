import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nguồn dữ liệu",
  description: "Nguồn và giấy phép của dữ liệu từ vựng, kanji và câu ví dụ trong Nihongo.",
};

const sources = [
  {
    name: "KANJIDIC2",
    owner: "Electronic Dictionary Research and Development Group (EDRDG)",
    licence: "CC BY-SA 4.0",
    use: "Âm Hán Việt, âm on/kun của kanji.",
    href: "https://www.edrdg.org/edrdg/licence.html",
  },
  {
    name: "JMdict",
    owner: "Electronic Dictionary Research and Development Group (EDRDG)",
    licence: "CC BY-SA 4.0",
    use: "Từ điển Nhật-Anh làm nguồn từ vựng. JMdict không có nghĩa tiếng Việt.",
    href: "https://www.edrdg.org/edrdg/licence.html",
  },
  {
    name: "Danh sách từ vựng và kanji JLPT N5, N4",
    owner: "Jonathan Waller, tanos.co.uk",
    licence: "CC BY (theo nguồn thứ cấp, chưa đọc được trang gốc)",
    use: "Cấp JLPT của từ và kanji. Lấy qua bản sao trên GitHub.",
    href: "https://github.com/Bluskyo/JLPT_Vocabulary",
  },
  {
    name: "Tatoeba",
    owner: "Cộng đồng Tatoeba",
    licence: "CC BY",
    use: "Câu ví dụ. Chưa dùng.",
    href: "https://tatoeba.org",
  },
];

export default function DataSourcesPage() {
  return (
    <main className="mx-auto w-full max-w-[640px] bg-paper px-6 py-10">
      <h1 className="text-[32px] leading-[1.15] font-extrabold">Nguồn dữ liệu</h1>
      <p className="mt-4 text-base">
        Nihongo dùng dữ liệu mở của các dự án dưới đây. Cảm ơn những người đã tạo ra chúng.
      </p>

      <ul className="mt-8 space-y-6">
        {sources.map((s) => (
          <li key={s.name} className="border-2 border-ink p-4">
            <h2 className="text-xl font-bold">{s.name}</h2>
            <p className="mt-1 text-[14px] text-ink-2">{s.owner}</p>
            <p className="mt-2 text-base">{s.use}</p>
            <p className="mt-2 text-base">
              Giấy phép: <strong>{s.licence}</strong>
            </p>
            <a
              className="mt-2 inline-flex min-h-11 items-center break-all text-base underline underline-offset-4"
              href={s.href}
              rel="noopener noreferrer"
            >
              Trang nguồn
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-bold">Dữ liệu tự biên soạn</h2>
      <p className="mt-2 text-base">
        Nghĩa tiếng Việt do dự án tự biên soạn. Âm Hán Việt chính được chọn trong các âm của KANJIDIC2;
        vì dẫn xuất từ KANJIDIC2 nên phần này phát hành theo CC BY-SA 4.0.
      </p>

      <h2 className="mt-10 text-xl font-bold">Mã nguồn và dữ liệu tách giấy phép</h2>
      <p className="mt-2 text-base">
        Mã nguồn của Nihongo dùng giấy phép MIT. Giấy phép MIT không áp dụng cho thư mục dữ liệu: dữ liệu
        dẫn xuất từ JMdict/KANJIDIC2 giữ CC BY-SA, dữ liệu từ Tatoeba (nếu dùng sau này) giữ CC BY. Câu
        hỏi luyện thi do dự án tự soạn, không dùng đề JLPT thật.
      </p>

      <p className="mt-8">
        <Link className="inline-flex min-h-11 items-center text-base underline underline-offset-4" href="/">
          Về trang chính
        </Link>
      </p>
    </main>
  );
}
