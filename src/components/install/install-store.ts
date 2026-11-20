/**
 * Kho nhỏ giữ sự kiện `beforeinstallprompt` ở mức module: sự kiện có thể bắn trước khi người dùng
 * vào trang /cai-app, nên listener được đăng ký ngay khi module được nạp (phía trình duyệt);
 * `InstallPromptListener` ở root layout import module này để việc đó xảy ra ở mọi trang.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform?: string }>;
}

export interface InstallState {
  deferred: BeforeInstallPromptEvent | null;
  installed: boolean;
}

let state: InstallState = { deferred: null, installed: false };
const serverState: InstallState = { deferred: null, installed: false };
const listeners = new Set<() => void>();

function set(next: InstallState) {
  state = next;
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    set({ ...state, deferred: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => set({ deferred: null, installed: true }));
}

export function subscribeInstall(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export const getInstallState = () => state;
export const getServerInstallState = () => serverState;

/** Gọi hộp thoại cài của trình duyệt; trả kết quả lựa chọn. Sự kiện chỉ dùng được một lần. */
export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const ev = state.deferred;
  if (!ev) return "unavailable";
  set({ ...state, deferred: null });
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  if (outcome === "accepted") set({ deferred: null, installed: true });
  return outcome;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true;
}

export function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
