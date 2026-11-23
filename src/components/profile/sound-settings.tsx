"use client";

import { SectionTitle } from "@/ui/SectionTitle";
import { Notice } from "@/ui/Notice";
import { Panel } from "@/ui/Panel";
import { Switch } from "@/ui/Switch";
import { Button } from "@/ui/Button";
import { speak, useAutoSpeak, useJapaneseVoice } from "@/lib/speech";

/** Mục "Âm thanh" của Cài đặt (FR-C2): trạng thái giọng, nghe thử, tự phát khi lật thẻ. Tùy chọn chỉ lưu trên thiết bị. */
export function SoundSettings() {
  const { status, voice } = useJapaneseVoice();
  const [autoSpeak, setAutoSpeak] = useAutoSpeak();
  const ready = status === "ready";

  return (
    <section aria-labelledby="sound-h" className="flex flex-col gap-4">
      <SectionTitle id="sound-h">Âm thanh</SectionTitle>
      <Panel rows>
        <div className="py-4" data-testid="voice-status">
          {status === "checking" ? (
            <p role="status" className="text-base text-ink-2">
              Đang kiểm tra giọng tiếng Nhật…
            </p>
          ) : ready ? (
            <p role="status" className="text-base">
              Đang dùng giọng <span className="font-bold">{voice?.name}</span>
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <Notice tone="warn">
                {status === "unsupported"
                  ? "Trình duyệt này chưa hỗ trợ phát âm. Thiết bị chưa có giọng tiếng Nhật."
                  : "Thiết bị chưa có giọng tiếng Nhật."}{" "}
                Mọi bài học vẫn dùng được, không cần âm thanh.
              </Notice>
              <details className="text-base">
                <summary className="min-h-11 cursor-pointer py-2 font-medium">Cách cài giọng tiếng Nhật</summary>
                <ul className="mt-1 list-disc space-y-2 pl-5 text-[14px] leading-[1.5] text-ink-2">
                  <li>
                    Windows: Cài đặt, Thời gian và ngôn ngữ, Ngôn ngữ và khu vực, thêm tiếng Nhật rồi chọn tải gói giọng nói.
                  </li>
                  <li>
                    Android: Cài đặt, Quản lý chung, Ngôn ngữ, Chuyển văn bản thành giọng nói, tải dữ liệu giọng tiếng Nhật.
                  </li>
                  <li>
                    iPhone và iPad: Cài đặt, Trợ năng, Nội dung được đọc, Giọng nói, Tiếng Nhật, tải một giọng.
                  </li>
                </ul>
                <p className="mt-2 text-[14px] leading-[1.5] text-ink-2">Sau khi cài, mở lại trình duyệt rồi quay lại trang này.</p>
              </details>
            </div>
          )}
        </div>
        <div className="py-3">
          <Button variant="secondary" disabled={!ready} onClick={() => speak("こんにちは", voice)}>
            Nghe thử
          </Button>
        </div>
        <div className="py-2">
          <Switch
            label="Tự phát âm khi lật thẻ"
            description={
              ready
                ? "Phát cách đọc ngay khi bạn lật thẻ. Chỉ lưu trên thiết bị này."
                : "Cần giọng tiếng Nhật trên thiết bị."
            }
            checked={ready && autoSpeak}
            disabled={!ready}
            onChange={setAutoSpeak}
          />
        </div>
      </Panel>
    </section>
  );
}
