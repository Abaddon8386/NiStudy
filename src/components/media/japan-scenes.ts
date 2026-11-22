import type { Scene } from "./scene-show";
import type { BackdropScene } from "./auth-backdrop";

/**
 * Cảnh văn hóa Nhật Bản. Nguồn và giấy phép của từng tệp: public/media/credits.json
 * (hiện ở /nguon-du-lieu).
 */

/**
 * Nền toàn trang của các màn đăng nhập/đăng ký. Cảnh đầu là tranh vẽ bằng code (không tải ảnh,
 * hiện ngay; cũng là khung tĩnh khi reduced-motion/máy yếu/không JS và là nền duy nhất trên màn hẹp).
 * Các clip chỉ nạp trên máy tính ≥1024px, sau khi trang tải xong, khi gần đến lượt.
 */
export const AUTH_BACKDROP: BackdropScene[] = [
  { kind: "art", ja: "富士山", name: "Minh họa", vi: "Núi Phú Sĩ lúc hoàng hôn" },
  {
    kind: "video",
    poster: "/media/phu-si-ben-ho-poster.webp",
    mp4: "/media/phu-si-ben-ho.mp4",
    webm: "/media/phu-si-ben-ho.webm",
    ja: "富士山",
    name: "Fujisan",
    vi: "Núi Phú Sĩ bên hồ",
  },
  {
    kind: "video",
    poster: "/media/chochin-dem-poster.webp",
    mp4: "/media/chochin-dem.mp4",
    webm: "/media/chochin-dem.webm",
    ja: "提灯",
    name: "Chōchin",
    vi: "Đèn lồng giấy viết chữ ban đêm",
  },
  {
    kind: "video",
    poster: "/media/torii-miyajima-poster.webp",
    mp4: "/media/torii-miyajima.mp4",
    webm: "/media/torii-miyajima.webm",
    ja: "厳島神社",
    name: "Itsukushima",
    vi: "Cổng torii trên mặt nước, Miyajima",
  },
];

const KAWAGUCHIKO: Scene = {
  kind: "image",
  src: "/media/canh-fuji-kawaguchiko.webp",
  width: 1920,
  height: 1280,
  ja: "河口湖",
  name: "Kawaguchiko",
  vi: "Núi Phú Sĩ mùa anh đào bên hồ Kawaguchi",
};

/** Hero trang giới thiệu: chỉ ảnh (nhẹ), cảnh đầu là biển ga có kanji + kana. */
export const LANDING_SCENES: Scene[] = [
  {
    kind: "image",
    src: "/media/ga-omorimachi.webp",
    width: 1200,
    height: 675,
    ja: "大森町駅",
    name: "Ōmorimachi",
    vi: "Biển tên ga ở Tokyo: kanji, hiragana và chữ La-tinh",
  },
  KAWAGUCHIKO,
  {
    kind: "image",
    src: "/media/canh-den-long-gion.webp",
    width: 1920,
    height: 1280,
    ja: "祇園祭",
    name: "Gion Matsuri",
    vi: "Đèn lồng lễ hội Gion, Kyoto",
  },
  {
    kind: "image",
    src: "/media/canh-kodaiji-dem-thu.webp",
    width: 1600,
    height: 1067,
    ja: "高台寺",
    name: "Kōdai-ji",
    vi: "Lá phong thắp đèn đêm thu, Kyoto",
  },
  {
    kind: "image",
    src: "/media/canh-fuji-shinkansen.webp",
    width: 1920,
    height: 1280,
    ja: "新幹線",
    name: "Shinkansen",
    vi: "Tàu cao tốc chạy dưới chân núi Phú Sĩ",
  },
];
