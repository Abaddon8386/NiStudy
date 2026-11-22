import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import kanjiDetails from "../../../../data/build/kanji_details.json";
import vocabDetails from "../../../../data/build/vocab_details.json";
import { buildHanVietData } from "@/components/landing/hanviet";
import { HanVietLookup } from "@/components/landing/hanviet-lookup";
import { LoopVideo } from "@/components/landing/loop-video";
import { Marquee, type MarqueeItem } from "@/components/landing/marquee";
import { HeroStage, ScrollRead, StoryStage } from "@/components/landing/scenes";
import { SessionCta } from "@/components/landing/session-cta";
import { SmoothScroll } from "@/components/landing/smooth-scroll";
import { LANDING_SCENES } from "@/components/media/japan-scenes";
import { SceneShow } from "@/components/media/scene-show";
import { Logo } from "@/ui/Logo";
import { Mark } from "@/ui/Mark";
import { Seal } from "@/ui/Seal";
import { CountUp } from "@/ui/motion/CountUp";
import { Reveal } from "@/ui/motion/Reveal";
import { SplitWords } from "@/ui/motion/SplitWords";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Nihongo: web học tiếng Nhật miễn phí cho người Việt, N5–N4. Kana, từ vựng, kanji qua âm Hán Việt, ôn theo lịch FSRS, học được cả khi mất mạng.",
};

// Dựng lúc build từ dữ liệu thật; chỉ âm Hán Việt + cách đọc (không có nghĩa nháp).
const hanViet = buildHanVietData(kanjiDetails, vocabDetails);

// Số liệu nội dung lấy từ data/build, không phải số người dùng.
const KANA = 208;
const VOCAB_N5 = vocabDetails.length;
const KANJI_N5 = 79;
const KANJI_N4 = kanjiDetails.length - KANJI_N5;

// Nghĩa do người viết trang soạn tay cho 10 từ phổ biến (không lấy từ nghĩa nháp).
const WORDS: MarqueeItem[] = [
  { ja: "学生", reading: "がくせい", vi: "học sinh" },
  { ja: "先生", reading: "せんせい", vi: "giáo viên" },
  { ja: "大学", reading: "だいがく", vi: "đại học" },
  { ja: "電車", reading: "でんしゃ", vi: "tàu điện" },
  { ja: "時間", reading: "じかん", vi: "thời gian" },
  { ja: "天気", reading: "てんき", vi: "thời tiết" },
  { ja: "新聞", reading: "しんぶん", vi: "báo" },
  { ja: "漢字", reading: "かんじ", vi: "chữ Hán" },
  { ja: "電話", reading: "でんわ", vi: "điện thoại" },
  { ja: "銀行", reading: "ぎんこう", vi: "ngân hàng" },
];

const ROWS = [
  {
    title: "Kana trước tiên",
    text: `Hiragana và katakana đủ ${KANA} chữ, gồm cả âm đục và âm ghép. Bạn mở 46 chữ hiragana cơ bản trước, rồi mới gặp kanji và từ vựng.`,
    img: { src: "/media/den-long-yasaka.webp", w: 1400, h: 933 },
    alt: "Những hàng đèn lồng giấy viết chữ treo trước một sảnh đền gỗ.",
    caption: "Đèn lồng giấy viết chữ ở đền Yasaka, Kyoto.",
    width: "400px",
    ratio: "4 / 5",
  },
  {
    title: "Từ vựng N5 có cách đọc",
    text: `${VOCAB_N5} từ theo danh sách JLPT N5, mỗi từ kèm cách đọc kana và nghĩa tiếng Việt.`,
    img: { src: "/media/bien-chi-duong-shinjuku.webp", w: 1200, h: 900 },
    alt: "Ngã tư phố với các biển chỉ đường xanh ghi tên đường bằng kanji.",
    caption: "Biển chỉ đường ở Shinjuku, Tokyo.",
    width: "560px",
    ratio: "3 / 2",
  },
  {
    title: "Kanji qua âm Hán Việt",
    text: (
      <>
        {KANJI_N5 + KANJI_N4} chữ N5–N4. Chữ nào cũng có âm Hán Việt viết hoa ngay dưới: <span lang="ja">学</span> là HỌC,{" "}
        <span lang="ja">校</span> là HIỆU.
      </>
    ),
    img: { src: "/media/but-long-kanji.webp", w: 1200, h: 800 },
    alt: "Bàn tay cầm bút lông viết một chữ kanji bằng mực đen trên giấy trắng.",
    caption: "Viết thư pháp kanji bằng bút lông.",
    width: "360px",
    ratio: "1 / 1",
  },
  {
    title: "Ôn đúng lúc, không ôn thừa",
    text: "Lịch ôn FSRS hẹn ngày gặp lại từng thẻ theo cách bạn chấm: Lại, Khó, Được, Dễ. Thẻ đã nhớ chắc thì gặp thưa dần, thẻ hay quên thì gặp sớm hơn.",
    img: { src: "/media/pho-yasaka-dori.webp", w: 960, h: 1200 },
    alt: "Con phố lát đá vắng người lúc sáng sớm, hai bên nhà gỗ, cuối phố là ngôi tháp năm tầng.",
    caption: "Phố Yasaka-dori lúc sáng sớm, Kyoto.",
    width: "420px",
    ratio: "4 / 5",
  },
] as const;

const STEPS = [
  { verb: "Mở", text: "Trang chính nói ngay hôm nay có bao nhiêu thẻ đến hạn và mất chừng mấy phút." },
  { verb: "Lật", text: "Nhìn chữ, tự nhớ, rồi lật thẻ: âm Hán Việt, cách đọc và nghĩa hiện ra." },
  { verb: "Chấm", text: "Chấm Lại, Khó, Được hoặc Dễ. FSRS dựa vào đó hẹn ngày gặp lại thẻ." },
  {
    verb: "Đóng dấu",
    text: (
      <>
        Xong lượt ôn, dấu triện <span lang="ja">学</span> đóng lên ngày hôm nay. Ngày học cộng dồn; nghỉ vài hôm cũng
        không bị trách.
      </>
    ),
  },
] as const;

function StepUi({ index }: { index: number }) {
  if (index === 0)
    return (
      <div className="lp-ui" data-ui="" aria-hidden="true">
        <p className="text-[14px] text-ink-2">Hôm nay</p>
        <p className="mt-2 text-[26px] leading-[1.15] font-extrabold">
          Có <Mark>12 thẻ</Mark> đến hạn, khoảng 4 phút.
        </p>
        <span className="mt-5 flex min-h-14 items-center justify-center rounded-full bg-ink text-[18px] font-bold text-paper">
          Bắt đầu ôn
        </span>
      </div>
    );
  if (index === 1)
    return (
      <div className="lp-ui lp-flip" data-ui="" aria-hidden="true">
        <div className="lp-flip-inner">
          <div className="lp-flip-face">
            <span lang="ja" className="font-kanji text-[120px] leading-none font-semibold">
              学
            </span>
            <span className="text-[14px] text-ink-2">Thẻ kanji</span>
          </div>
          <div className="lp-flip-face lp-flip-back">
            <span lang="ja" className="font-kanji text-[88px] leading-none font-semibold">
              学
            </span>
            <span className="text-[36px] font-extrabold">
              <Mark>HỌC</Mark>
            </span>
            <span className="text-[18px]">học, môn học</span>
            <span lang="ja" className="font-jp text-[16px] text-ink-2">
              ガク · まな.ぶ
            </span>
          </div>
        </div>
      </div>
    );
  if (index === 2)
    return (
      <div className="lp-ui" data-ui="" aria-hidden="true">
        <p className="text-center">
          <span lang="ja" className="font-kanji text-[72px] leading-none font-semibold">
            学
          </span>
        </p>
        <p className="mt-1 text-center text-[24px] font-extrabold">HỌC</p>
        <div className="lp-rate mt-5">
          <span>Lại</span>
          <span>Khó</span>
          <span className="is-good">Được</span>
          <span className="is-easy">Dễ</span>
        </div>
      </div>
    );
  const done = [true, true, false, true, true, true];
  const angles = [-8, 6, 0, -4, 9, -6, -10];
  return (
    <div className="lp-ui" data-ui="" aria-hidden="true">
      <p className="text-[26px] leading-[1.15] font-extrabold">Hôm nay đã xong.</p>
      <p className="mt-1 text-base text-ink-2">Ngày mai có 9 thẻ.</p>
      <div className="lp-days mt-5">
        {done.map((d, i) =>
          d ? <Seal key={i} char="学" size={36} rotate={angles[i]} /> : <span key={i} className="lp-day-empty" />,
        )}
        <Seal char="学" size={36} rotate={angles[6]} className="lp-today" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="lp">
      <SmoothScroll />
      <header className="lp-nav">
        <Link href="/gioi-thieu" className="inline-flex min-h-11 items-center">
          <Logo />
        </Link>
        <nav aria-label="Trang giới thiệu" className="lp-nav-links">
          <a className="lp-nav-link" href="#mang-hoc">
            Các mảng học
          </a>
          <a className="lp-nav-link" href="#han-viet">
            Hán Việt
          </a>
          <a className="lp-nav-link" href="#mot-ngay">
            Một ngày học
          </a>
        </nav>
        <SessionCta size="md" showSecondary={false} primaryLabel="Đăng ký" />
      </header>

      <main id="noi-dung" tabIndex={-1}>
        <HeroStage className="lp-hero" frames={5}>
          <div className="lp-hero-stage">
            <h1 id="lp-title" className="lp-hero-title">
              <span className="lp-hero-a">Học tiếng Nhật</span>{" "}
              <span className="lp-hero-b">trọn vẹn.</span>
            </h1>
            <div className="lp-reel" role="region" aria-label="Ví dụ chữ Nhật trong Nihongo" tabIndex={0}>
              <ul className="lp-reel-track">
                <li className="lp-frame">
                  <SceneShow
                    scenes={LANDING_SCENES}
                    sizes="(min-width: 1024px) 42vw, 92vw"
                    className="absolute inset-0"
                  />
                </li>
                <li className="lp-frame bg-paper" data-ui="">
                  <div className="lp-card">
                    <span lang="ja" className="lp-card-big font-jp font-medium">
                      あ
                    </span>
                    <span className="lp-card-key">a</span>
                    <span className="lp-card-note">Hiragana</span>
                  </div>
                </li>
                <li className="lp-frame bg-marker" data-ui="">
                  <div className="lp-card">
                    <span lang="ja" className="lp-card-big font-jp font-medium">
                      学生
                    </span>
                    <span lang="ja" className="font-jp text-[18px]">
                      がくせい
                    </span>
                    <span className="lp-card-key">học sinh</span>
                  </div>
                </li>
                <li className="lp-frame bg-teal text-paper" data-ui="">
                  <div className="lp-card">
                    <span lang="ja" className="lp-card-big font-kanji font-semibold">
                      学
                    </span>
                    <span className="lp-card-key">
                      <span className="rounded-md bg-marker px-2 text-ink">HỌC</span>
                    </span>
                    <span lang="ja" className="font-jp text-[16px]">
                      ガク · まな.ぶ
                    </span>
                  </div>
                </li>
                <li className="lp-frame bg-paper" data-ui="">
                  <div className="lp-card">
                    <span lang="ja" className="font-jp text-[clamp(32px,3.4vw,52px)] leading-[1.2] font-medium">
                      はじめまして。
                    </span>
                    <span className="text-[20px] font-bold">Rất vui được gặp bạn.</span>
                    <span className="lp-card-note">Hội thoại: sắp có</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="lp-hero-foot">
              <p className="lp-lead">
                Kana, từ vựng, kanji qua âm Hán Việt, rồi tới nghe, ngữ pháp và hội thoại. Cho người Việt luyện JLPT
                N5–N4: miễn phí, ôn đúng lúc, học được cả khi mất mạng.
              </p>
              <SessionCta className="mt-6" />
            </div>
          </div>
        </HeroStage>

        <Marquee items={WORDS} label="Một số từ vựng N5 và nghĩa" />

        <section id="mang-hoc" className="lp-section lp-wrap" aria-labelledby="mang-hoc-title">
          <h2 id="mang-hoc-title" className="lp-h2 lp-features-title">
            <SplitWords text="Đủ các mảng, một chỗ học." />
          </h2>
          <ul className="lp-rows">
            {ROWS.map((r) => (
              <li key={r.title} className="lp-row">
                <Reveal className="lp-row-text">
                  <h3 className="lp-h3">{r.title}</h3>
                  <p>{r.text}</p>
                </Reveal>
                <Reveal index={1} className="lp-fig" style={{ "--w": r.width } as CSSProperties}>
                  <figure>
                    <Image
                      src={r.img.src}
                      width={r.img.w}
                      height={r.img.h}
                      sizes={`(min-width: 1024px) ${r.width}, 90vw`}
                      alt={r.alt}
                      style={{ aspectRatio: r.ratio }}
                    />
                    <figcaption>{r.caption}</figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
            <li className="lp-row">
              <Reveal className="lp-row-text">
                <h3 className="lp-h3">Học cả khi mất sóng</h3>
                <p>
                  Trên tàu điện ngầm vẫn ôn được: lượt chấm lưu trên máy và tự gửi khi có mạng lại. Cài Nihongo lên màn
                  hình chính như một ứng dụng.
                </p>
              </Reveal>
              <Reveal index={1} className="lp-fig" style={{ "--w": "600px" } as CSSProperties}>
                <figure>
                  <LoopVideo
                    src="/media/tau-tozai-waseda.mp4"
                    poster="/media/tau-tozai-waseda-poster.webp"
                    width={854}
                    height={480}
                    className="aspect-video overflow-hidden rounded-[4px]"
                  />
                  <figcaption>Tàu tuyến Tōzai vào ga Waseda, Tokyo.</figcaption>
                </figure>
              </Reveal>
            </li>
          </ul>
        </section>

        <section id="han-viet" className="lp-section lp-show" aria-labelledby="han-viet-title">
          <div className="lp-wrap">
            <div className="lp-stack" aria-hidden="true">
              <span className="lp-stack-soft">
                <span lang="ja" className="lp-stack-ja font-kanji">
                  学生
                </span>
                HỌC SINH
              </span>
              <span>
                <span lang="ja" className="lp-stack-ja font-kanji">
                  大学
                </span>
                ĐẠI HỌC
              </span>
            </div>
          </div>
          <div className="lp-wrap lp-show-body">
            <div>
              <Reveal>
                <h2 id="han-viet-title" className="lp-h2">
                  Âm Hán Việt là lối tắt.
                </h2>
              </Reveal>
              <ScrollRead text="Tiếng Việt và tiếng Nhật cùng mượn chữ Hán. Biết HỌC SINH là bạn đã đi nửa đường tới 学生." />
              <p className="mt-6 max-w-[40ch] text-[18px]">
                Âm Hán Việt lấy từ từ điển KANJIDIC2; với chữ nhiều âm, âm chính do tác giả chọn tay.
              </p>
              <Reveal index={1} className="mt-10">
                <HanVietLookup data={hanViet} />
              </Reveal>
            </div>
            <Reveal variant="scale" className="lp-show-side lp-fig">
              <figure>
                <Image
                  className="lp-object"
                  src="/media/torii-fushimi-inari.webp"
                  width={1400}
                  height={933}
                  sizes="(min-width: 1024px) 40vw, 85vw"
                  alt="Đường hầm cổng torii đỏ, trên mỗi cột khắc chữ kanji đen."
                />
                <figcaption>Cổng torii khắc chữ ở đền Fushimi Inari, Kyoto.</figcaption>
              </figure>
            </Reveal>
          </div>
        </section>

        <StoryStage className="lp-story" steps={STEPS.length} labelledBy="mot-ngay-title">
          <div id="mot-ngay" className="lp-wrap">
            <div className="lp-story-head">
              <h2 id="mot-ngay-title" className="lp-h2">
                Một ngày học, bốn nhịp.
              </h2>
              <p>Mỗi ngày chỉ cần vài phút. Đây là một lượt ôn từ lúc mở app tới lúc đóng dấu.</p>
            </div>
            <div className="lp-story-track" data-story-track="">
              <div className="lp-story-stage">
                <ol className="lp-steps">
                  {STEPS.map((s, i) => (
                    <li key={s.verb} className="lp-step" style={{ "--i": i } as CSSProperties}>
                      <div className="lp-step-text">
                        <h3 className="lp-verb">{s.verb}</h3>
                        <p>{s.text}</p>
                      </div>
                      <StepUi index={i} />
                    </li>
                  ))}
                </ol>
                <div className="lp-progress" aria-hidden="true">
                  <span />
                </div>
              </div>
            </div>
          </div>
        </StoryStage>

        <section className="lp-section lp-wrap" aria-labelledby="noi-dung-title">
          <Reveal>
            <h2 id="noi-dung-title" className="lp-list-title">
              Đã có hôm nay,
              <br />
              và đang làm tiếp.
            </h2>
          </Reveal>
          <div className="lp-list-body">
            <Reveal index={1} className="lp-list-photo lp-fig">
              <figure>
                <Image
                  src="/media/torii-itsukushima.webp"
                  width={1400}
                  height={933}
                  sizes="(min-width: 1024px) 22vw, 60vw"
                  alt="Cổng torii đỏ đứng trên mặt nước, phía sau là núi và thành phố."
                  style={{ aspectRatio: "4 / 5" }}
                />
                <figcaption>Cổng torii đền Itsukushima, Miyajima.</figcaption>
              </figure>
            </Reveal>
            <div className="lp-table-wrap">
              <table className="lp-table">
                <caption>Nội dung học</caption>
                <tbody>
                  <tr>
                    <th scope="rowgroup" rowSpan={5}>
                      Đã có
                    </th>
                    <td>Hiragana và katakana</td>
                    <td>
                      <CountUp value={KANA} /> chữ
                    </td>
                  </tr>
                  <tr>
                    <td>Từ vựng N5</td>
                    <td>
                      <CountUp value={VOCAB_N5} /> từ
                    </td>
                  </tr>
                  <tr>
                    <td>Kanji N5 kèm âm Hán Việt</td>
                    <td>
                      <CountUp value={KANJI_N5} /> chữ
                    </td>
                  </tr>
                  <tr>
                    <td>Kanji N4 kèm âm Hán Việt</td>
                    <td>
                      <CountUp value={KANJI_N4} /> chữ
                    </td>
                  </tr>
                  <tr>
                    <td>Trắc nghiệm</td>
                    <td>10 câu mỗi lượt</td>
                  </tr>
                </tbody>
                <tbody>
                  <tr>
                    <th scope="rowgroup" rowSpan={4}>
                      Sắp có
                    </th>
                    <td>Phát âm và luyện nghe</td>
                    <td className="lp-soon">Sắp có</td>
                  </tr>
                  <tr>
                    <td>Ngữ pháp N5–N4</td>
                    <td className="lp-soon">Sắp có</td>
                  </tr>
                  <tr>
                    <td>Luyện đọc</td>
                    <td className="lp-soon">Sắp có</td>
                  </tr>
                  <tr>
                    <td>Luyện nói, hội thoại</td>
                    <td className="lp-soon">Sắp có</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <figure className="lp-rest">
          <Image
            src="/media/tranh-pho-kyoto.webp"
            width={1600}
            height={780}
            sizes="100vw"
            alt="Tranh bình phong cổ vẽ phố phường Kyoto với mái nhà, mây vàng và người đi đường."
          />
          <figcaption>“Cảnh phố Kyoto”, tranh bình phong Nhật Bản cuối thế kỷ 17 (The Met).</figcaption>
        </figure>

        <section className="lp-cta" aria-labelledby="cta-title">
          <h2 id="cta-title" className="lp-cta-q">
            <span>Chữ đầu tiên</span> <span>học hôm nay?</span>
          </h2>
          <div className="lp-cta-mid">
            <SessionCta primary="onHero" secondary="secondary" className="justify-center" />
            <p>Miễn phí. Chỉ cần email và mật khẩu.</p>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-[44ch] text-[16px]">
            <Logo tone="light" />
            <p className="mt-3">Web học tiếng Nhật cho người Việt, N5–N4. Mã nguồn MIT, dữ liệu CC BY-SA.</p>
          </div>
          <a href="#noi-dung" className="inline-flex min-h-11 items-center">
            Lên đầu trang
          </a>
        </div>
        <p className="lp-foot-word" aria-hidden="true" lang="ja">
          日本語
        </p>
        <div className="lp-foot-meta">
          <p className="flex flex-wrap gap-x-4">
            <Link href="/nguon-du-lieu" className="inline-flex min-h-11 items-center">
              Nguồn dữ liệu
            </Link>
            <Link href="/dang-ky" className="inline-flex min-h-11 items-center">
              Đăng ký
            </Link>
            <Link href="/dang-nhap" className="inline-flex min-h-11 items-center">
              Đăng nhập
            </Link>
          </p>
          <p>
            Ảnh và video: Wikimedia Commons, The Metropolitan Museum of Art (CC0, CC BY, CC BY-SA). Tác giả từng ảnh ở
            trang Nguồn dữ liệu.
          </p>
          <p>2026</p>
        </div>
      </footer>
    </div>
  );
}
