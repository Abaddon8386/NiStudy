import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { loginViaForm, mockLoggedInBackend } from "./helpers";

interface Queue {
  due: unknown[];
  new_done_today: number;
  new_candidates: unknown[];
}
const sample = JSON.parse(readFileSync("tests/fixtures/queue-sample.json", "utf8")) as Queue;
// Thẻ đầu tiên của phiên là từ vựng 学生 (がくせい).
const queue: Queue = { ...sample, new_candidates: [] };

interface FakeOptions {
  /** Không gọi onend sau khi speak: lượt phát kéo dài đến khi test tự kết thúc. */
  hold?: boolean;
  /** Danh sách giọng rỗng lúc đầu; test gọi window.__showVoices() để giọng xuất hiện và bắn voiceschanged. */
  lateVoices?: boolean;
}

/** Giả speechSynthesis: `voices` giọng, speak ghi văn bản vào window.__spoken rồi báo kết thúc (trừ khi `hold`). */
async function fakeSpeech(page: Page, voices: { name: string; lang: string }[], autoSpeak = false, opts: FakeOptions = {}) {
  await page.addInitScript(
    ({ voices, autoSpeak, opts }) => {
      const w = window as unknown as { __spoken: string[]; __cancels: number };
      w.__spoken = [];
      w.__cancels = 0;
      const all = voices.map((v) => ({ ...v, localService: true, default: false, voiceURI: v.name }));
      let list = opts.lateVoices ? [] : all;
      const listeners: Record<string, Set<() => void>> = {};
      (w as unknown as { __showVoices: () => void }).__showVoices = () => {
        list = all;
        listeners["voiceschanged"]?.forEach((cb) => cb());
      };
      // Utterance giả: Utterance thật từ chối `voice` không phải SpeechSynthesisVoice thật.
      class FakeUtterance {
        text: string;
        lang = "";
        rate = 1;
        voice: unknown = null;
        onend?: () => void;
        onerror?: () => void;
        constructor(text: string) {
          this.text = text;
        }
      }
      Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: FakeUtterance });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          getVoices: () => list,
          speak: (u: { text: string; lang: string; onend?: () => void }) => {
            w.__spoken.push(`${u.lang}|${u.text}`);
            if (!opts.hold) setTimeout(() => u.onend?.(), 50);
          },
          cancel: () => {
            w.__cancels++;
          },
          addEventListener: (type: string, cb: () => void) => {
            (listeners[type] ??= new Set()).add(cb);
          },
          removeEventListener: (type: string, cb: () => void) => {
            listeners[type]?.delete(cb);
          },
        },
      });
      if (autoSpeak) localStorage.setItem("nihongo:auto-speak", "1");
    },
    { voices, autoSpeak, opts },
  );
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

async function openReview(page: Page, q: Queue = queue) {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => route.fulfill({ json: q }));
  await loginViaForm(page);
  await page.getByRole("link", { name: "Bắt đầu ôn" }).click();
  await expect(page).toHaveURL(/\/on-tap$/);
  await expect(page.getByRole("button", { name: /Lật thẻ/ })).toBeVisible();
}

const axe = async (page: Page) => {
  await page.waitForTimeout(700);
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" | ")}`)).toEqual([]);
};

const JA = [{ name: "Kyoko giả", lang: "ja-JP" }];

test.describe("phát âm tiếng Nhật (FR-C1, FR-C2)", () => {
  test("mặt sau thẻ từ vựng có nút phát đúng cách đọc; không tự phát khi tùy chọn tắt", async ({ page }) => {
    await fakeSpeech(page, JA);
    await openReview(page);
    expect(await spoken(page)).toEqual([]);
    await page.keyboard.press("Space");
    await expect(page.getByText("がくせい").first()).toBeVisible();
    const btn = page.getByRole("button", { name: "Phát âm: がくせい" });
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(await spoken(page)).toEqual([]);
    await btn.click();
    expect(await spoken(page)).toEqual(["ja-JP|がくせい"]);
    await expect(btn).toHaveAttribute("data-playing", "false"); // onend đã báo
    await expect(btn).not.toHaveAttribute("aria-pressed", /.*/); // không phải nút bật tắt
    await axe(page);
  });

  test("bật tự phát thì lật thẻ phát ngay", async ({ page }) => {
    await fakeSpeech(page, JA, true);
    await openReview(page);
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: "Phát âm: がくせい" })).toBeVisible();
    expect(await spoken(page)).toEqual(["ja-JP|がくせい"]);
  });

  test("không có giọng: ẩn nút phát âm, Cài đặt báo chưa có giọng và khóa công tắc", async ({ page }) => {
    await fakeSpeech(page, [{ name: "English", lang: "en-US" }], true);
    await openReview(page);
    await page.keyboard.press("Space");
    await expect(page.getByRole("button", { name: /^Được/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Phát âm/ })).toHaveCount(0);
    expect(await spoken(page)).toEqual([]);

    await page.goto("/cai-dat");
    await expect(page.getByText("Thiết bị chưa có giọng tiếng Nhật.")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Mọi bài học vẫn dùng được, không cần âm thanh.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nghe thử" })).toBeDisabled();
    await expect(page.getByRole("switch", { name: "Tự phát âm khi lật thẻ" })).toBeDisabled();
    await axe(page);
  });

  test("Cài đặt: có giọng thì nghe thử phát こんにちは và công tắc lưu trên thiết bị", async ({ page }) => {
    await fakeSpeech(page, JA);
    await mockLoggedInBackend(page);
    await loginViaForm(page);
    await page.goto("/cai-dat");
    await expect(page.getByText("Kyoko giả")).toBeVisible();
    await page.getByRole("button", { name: "Nghe thử" }).click();
    expect(await spoken(page)).toEqual(["ja-JP|こんにちは"]);
    const sw = page.getByRole("switch", { name: "Tự phát âm khi lật thẻ" });
    await expect(sw).toBeEnabled();
    await expect(sw).not.toBeChecked();
    await sw.check({ force: true });
    expect(await page.evaluate(() => localStorage.getItem("nihongo:auto-speak"))).toBe("1");
    await axe(page);
  });

  test("đang phát: data-playing bật; bấm nút thứ hai thì nút thứ nhất tắt và lượt cũ bị hủy", async ({ page }) => {
    await fakeSpeech(page, JA, false, { hold: true });
    // Thẻ đầu có câu ví dụ để mặt sau có hai nút phát.
    const [first, ...rest] = queue.due as { details: Record<string, unknown> }[];
    const withExample: Queue = {
      ...queue,
      due: [{ ...first, details: { ...first.details, example_ja: "学生です。", example_vi: "Tôi là sinh viên." } }, ...rest],
    };
    await openReview(page, withExample);
    await page.keyboard.press("Space");
    await expect(page.getByText("がくせい").first()).toBeVisible();
    const reading = page.getByRole("button", { name: "Phát âm: がくせい" });
    const buttons = page.getByRole("button", { name: /^Phát âm/ });
    await expect(buttons).toHaveCount(2); // cách đọc và câu ví dụ
    const other = buttons.nth(1);
    await expect(reading).toHaveAttribute("data-playing", "false");
    const cancels = () => page.evaluate(() => (window as unknown as { __cancels: number }).__cancels);
    const before = await cancels();

    await reading.click();
    await expect(reading).toHaveAttribute("data-playing", "true");
    await other.click();
    await expect(other).toHaveAttribute("data-playing", "true");
    await expect(reading).toHaveAttribute("data-playing", "false");
    expect(await cancels()).toBe(before + 2);

    // Bấm lại cùng nút khi đang phát: phát lại, nút vẫn ở trạng thái đang phát.
    await other.click();
    await expect(other).toHaveAttribute("data-playing", "true");
    expect(await spoken(page)).toHaveLength(3);
  });

  test("giọng xuất hiện muộn (voiceschanged sau khi render): nút hiện ra", async ({ page }) => {
    await fakeSpeech(page, JA, false, { lateVoices: true });
    await openReview(page);
    await page.keyboard.press("Space");
    await expect(page.getByText("がくせい").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Phát âm/ })).toHaveCount(0);
    await page.evaluate(() => (window as unknown as { __showVoices: () => void }).__showVoices());
    await expect(page.getByRole("button", { name: "Phát âm: がくせい" })).toBeVisible();
  });

  test("bảng kana: nút phát đọc đúng chữ đang chọn, nằm ngoài vùng aria-live", async ({ page }) => {
    await fakeSpeech(page, JA);
    await mockLoggedInBackend(page);
    const rows = [
      ["あ", "a", 1],
      ["か", "ka", 2],
    ].map(([kana, romaji, sort_order]) => ({
      id: `kana:hira:${kana}`,
      sort_order,
      kana_details: { script: "hira", kana, romaji, grp: "basic" },
    }));
    await page.route("**/rest/v1/cards**", (route) => route.fulfill({ json: rows }));
    await loginViaForm(page);
    await page.goto("/kana");
    await page.getByRole("button", { name: "か, ka" }).click();
    const speakBtn = page.getByTestId("kana-detail").getByRole("button", { name: "Phát âm: か" });
    await expect(speakBtn).toBeVisible();
    await expect(page.locator('[aria-live="polite"]').getByRole("button")).toHaveCount(0);
    await speakBtn.click();
    expect(await spoken(page)).toEqual(["ja-JP|か"]);
    await page.getByRole("button", { name: "あ, a" }).click();
    await page.getByTestId("kana-detail").getByRole("button", { name: "Phát âm: あ" }).click();
    expect(await spoken(page)).toEqual(["ja-JP|か", "ja-JP|あ"]);
  });

  test("tự phát bật: giữ phím Space (nhấn lặp) chỉ phát một lần", async ({ page }) => {
    await fakeSpeech(page, JA, true);
    await openReview(page);
    await page.keyboard.down("Space");
    for (let i = 0; i < 4; i++) await page.keyboard.down("Space"); // keydown lặp khi giữ phím
    await page.keyboard.up("Space");
    await expect(page.getByRole("button", { name: "Phát âm: がくせい" })).toBeVisible();
    await page.waitForTimeout(300);
    expect(await spoken(page)).toEqual(["ja-JP|がくせい"]);
  });
});
