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

/** Giả speechSynthesis: `voices` giọng, speak ghi văn bản vào window.__spoken rồi báo kết thúc. */
async function fakeSpeech(page: Page, voices: { name: string; lang: string }[], autoSpeak = false) {
  await page.addInitScript(
    ({ voices, autoSpeak }) => {
      const w = window as unknown as { __spoken: string[]; __cancels: number };
      w.__spoken = [];
      w.__cancels = 0;
      const list = voices.map((v) => ({ ...v, localService: true, default: false, voiceURI: v.name }));
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
            setTimeout(() => u.onend?.(), 50);
          },
          cancel: () => {
            w.__cancels++;
          },
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      });
      if (autoSpeak) localStorage.setItem("nihongo:auto-speak", "1");
    },
    { voices, autoSpeak },
  );
}

const spoken = (page: Page) => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);

async function openReview(page: Page) {
  await mockLoggedInBackend(page);
  await page.route("**/rest/v1/rpc/get_today_queue", (route) => route.fulfill({ json: queue }));
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
    await expect(btn).toHaveAttribute("aria-pressed", "false"); // onend đã báo
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
});
