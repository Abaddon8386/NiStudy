"use client";

import { useState, useSyncExternalStore } from "react";
import {
  getInstallState,
  getServerInstallState,
  isIos,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from "./install-store";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";

const noopSubscribe = () => () => {};

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 flex list-none flex-col gap-3 p-0 text-base">
      {items.map((s, i) => (
        <li key={s} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-[14px] leading-none font-bold text-paper"
          >
            {i + 1}
          </span>
          <span className="min-w-0">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function Guide({ title, items }: { title: string; items: string[] }) {
  return (
    <details className="group rounded-[22px] bg-sand p-4 lg:bg-paper">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-base font-bold [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="relative size-5 shrink-0">
          <i className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-ink" />
          <i className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-ink transition-transform duration-150 group-open:rotate-90" />
        </span>
      </summary>
      <Steps items={items} />
    </details>
  );
}

export function InstallGuide() {
  const store = useSyncExternalStore(subscribeInstall, getInstallState, getServerInstallState);
  // Giá trị phụ thuộc trình duyệt: máy chủ trả "unknown" để không lệch khi hydrate.
  const env = useSyncExternalStore(
    noopSubscribe,
    () => (isStandalone() ? "standalone" : isIos() ? "ios" : "other"),
    () => "unknown",
  );
  const [message, setMessage] = useState("");

  async function onInstall() {
    const outcome = await promptInstall();
    setMessage(
      outcome === "accepted"
        ? "Đã cài. Mở Nihongo từ màn hình chính hoặc danh sách ứng dụng."
        : outcome === "dismissed"
          ? "Bạn đã bỏ qua hộp thoại cài. Có thể thử lại bất cứ lúc nào."
          : "Trình duyệt chưa cho phép cài lúc này. Hãy xem hướng dẫn bên dưới.",
    );
  }

  const standalone = env === "standalone" || store.installed;

  return (
    <div className="mt-8 max-w-[640px]">
      <Card tone="outlined" role="status" aria-live="polite">
        {env === "unknown" ? (
          <p className="text-base">Đang kiểm tra trình duyệt của bạn…</p>
        ) : standalone ? (
          <p className="text-base font-bold">
            {env === "standalone" ? "Bạn đang dùng Nihongo dạng ứng dụng." : "Đã cài xong Nihongo."}
          </p>
        ) : store.deferred ? (
          <>
            <p className="text-base">Trình duyệt này cho phép cài Nihongo lên máy, mở như một ứng dụng.</p>
            <Button className="mt-4" onClick={onInstall}>
              Cài ứng dụng
            </Button>
          </>
        ) : env === "ios" ? (
          <>
            <p className="text-base font-bold">Cài trên iPhone/iPad (Safari)</p>
            <Steps
              items={[
                "Mở trang này bằng Safari (các trình duyệt khác trên iOS thường không có mục cài).",
                "Bấm nút Chia sẻ (hình vuông có mũi tên hướng lên) ở thanh dưới hoặc thanh trên.",
                "Kéo xuống và chọn \"Thêm vào Màn hình chính\".",
                "Bấm \"Thêm\" ở góc trên bên phải.",
              ]}
            />
            <p className="mt-3 text-base">
              Trên iPhone, nên cài ứng dụng ra màn hình chính: Safari có thể xóa dữ liệu lưu tạm của trang web sau
              khoảng 7 ngày không mở.
            </p>
          </>
        ) : (
          <p className="text-base">
            Trình duyệt này chưa hỗ trợ cài trực tiếp (ví dụ Firefox trên máy tính). Hãy mở Nihongo bằng
            Chrome hoặc Edge để cài; trên iPhone/iPad dùng Safari.
          </p>
        )}
        {message ? <p className="mt-3 text-base">{message}</p> : null}
      </Card>

      <h2 className="mt-10 border-t-2 border-ink pt-4 text-[20px] leading-[1.25] font-bold">Hướng dẫn theo thiết bị</h2>
      <div className="mt-4 flex flex-col gap-3">
        <Guide
          title="Chrome trên Android"
          items={[
            "Mở Nihongo bằng Chrome, đăng nhập như bình thường.",
            "Bấm nút \"Cài ứng dụng\" ở trên, hoặc mở menu ba chấm của Chrome.",
            "Chọn \"Cài đặt ứng dụng\" (hoặc \"Thêm vào màn hình chính\"), rồi bấm \"Cài đặt\".",
          ]}
        />
        <Guide
          title="Safari trên iPhone/iPad"
          items={[
            "Mở Nihongo bằng Safari (bắt buộc dùng Safari).",
            "Bấm nút Chia sẻ (hình vuông có mũi tên hướng lên).",
            "Chọn \"Thêm vào Màn hình chính\", rồi bấm \"Thêm\".",
          ]}
        />
        <Guide
          title="Chrome hoặc Edge trên máy tính"
          items={[
            "Mở Nihongo bằng Chrome hoặc Edge.",
            "Bấm nút \"Cài ứng dụng\" ở trên, hoặc biểu tượng cài ở cuối thanh địa chỉ.",
            "Xác nhận \"Cài đặt\". Nihongo mở trong cửa sổ riêng.",
          ]}
        />
      </div>
      <p className="mt-6 text-[14px] leading-[1.4] text-ink-2">
        Ứng dụng đã cài vẫn cần đăng nhập, và chỉ ôn offline được phần thẻ đã tải về.
      </p>
    </div>
  );
}
