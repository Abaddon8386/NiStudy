"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { ChipGroup } from "@/ui/ChipGroup";
import { Dialog } from "@/ui/Dialog";
import { EmptyState } from "@/ui/EmptyState";
import { HeroBlock } from "@/ui/HeroBlock";
import { Logo } from "@/ui/Logo";
import { Mark } from "@/ui/Mark";
import { Notice } from "@/ui/Notice";
import { PageHeader } from "@/ui/PageHeader";
import { PasswordField } from "@/ui/PasswordField";
import { SectionTitle } from "@/ui/SectionTitle";
import { Seal } from "@/ui/Seal";
import { Stat } from "@/ui/Stat";
import { Switch } from "@/ui/Switch";
import { TextField } from "@/ui/TextField";

/** Mọi thành phần của src/ui ở một trang để chụp ảnh và soát bằng mắt (chỉ dev). */
export function UiGallery() {
  const [text, setText] = useState("hoc@example.test");
  const [bad, setBad] = useState("abc");
  const [pw, setPw] = useState("matkhau");
  const [level, setLevel] = useState<"N5" | "N4">("N5");
  const [on, setOn] = useState(true);
  const [open, setOpen] = useState(false);

  return (
    <main id="noi-dung" tabIndex={-1} className="mx-auto flex w-full max-w-[480px] flex-col gap-6 bg-paper px-4 py-6 min-[480px]:px-5">
      <PageHeader title="Bộ thành phần UI" mark="thành phần" back={{ href: "/dang-nhap", label: "Đăng nhập" }} meta="Trang xem mẫu, chỉ có khi chạy dev." />

      <div className="flex items-center gap-4">
        <Logo />
        <Seal char="学" size={48} rotate={-8} />
        <Seal char="日" size={24} />
      </div>

      <SectionTitle>Nút</SectionTitle>
      <div className="flex flex-col items-start gap-3">
        <Button size="lg" kbd="Space">Primary lớn</Button>
        <Button>Primary vừa</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Xóa tài khoản</Button>
        <Button disabled>Vô hiệu</Button>
        <Button loading>Đang gửi</Button>
        <Button href="/dang-nhap" variant="secondary">Liên kết dạng nút</Button>
      </div>
      <Card tone="hero">
        <Button variant="onHero" size="lg" className="w-full">Bắt đầu ôn (onHero)</Button>
      </Card>

      <SectionTitle>Ô nhập</SectionTitle>
      <div className="flex flex-col gap-4">
        <TextField label="Email" type="email" value={text} onChange={setText} hint="Gợi ý ngắn dưới ô." />
        <TextField label="Có lỗi" value={bad} onChange={setBad} error="Email chưa đúng định dạng." />
        <TextField label="Vô hiệu" value="Chỉ đọc" onChange={() => {}} disabled />
        <PasswordField label="Mật khẩu" value={pw} onChange={setPw} labelAside={<a className="inline-flex min-h-11 items-center text-[14px] font-medium underline underline-offset-4" href="/quen-mat-khau">Quên mật khẩu?</a>} />
        <ChipGroup legend="Cấp độ" name="level" value={level} onChange={setLevel} options={[{ value: "N5", label: "N5" }, { value: "N4", label: "N4" }]} />
        <Switch label="Gợi ý phím tắt" description="Hiện trên máy có bàn phím." checked={on} onChange={setOn} />
      </div>

      <SectionTitle>Khối</SectionTitle>
      <HeroBlock
        eyebrow="Hôm nay"
        bigNumber="12"
        unit={<>thẻ đến<br />hạn</>}
        sub="+ 5 thẻ mới"
      >
        <Button variant="onHero" size="lg" className="w-full">Bắt đầu ôn</Button>
      </HeroBlock>
      <Card tone="outlined">
        <p className="text-[40px] leading-[1.1] font-extrabold">18 <span className="text-[20px] font-normal">ngày đã học</span></p>
        <p className="text-[14px] text-ink-2">chuỗi 5 ngày</p>
      </Card>
      <div className="grid grid-cols-2 gap-3">
        <Card tone="sand"><Stat label="Thi JLPT N4 còn" value="18" unit="ngày" sub="6/12/2026" /></Card>
        <Card tone="sand"><Stat label="Điểm XP" value="1.234" sub="+0 hôm nay" /></Card>
      </div>
      <p className="text-[28px] leading-[1.2] font-extrabold">Hôm nay <Mark>2 phút</Mark> là đủ, <Mark>3</Mark> thẻ.</p>

      <SectionTitle>Thông báo</SectionTitle>
      <div className="flex flex-col gap-3">
        <Notice tone="info">Thông tin trung tính.</Notice>
        <Notice tone="warn">Cảnh báo: còn 3 lượt ôn chưa gửi.</Notice>
        <Notice tone="success">Đã lưu thay đổi.</Notice>
        <Notice tone="error">Email hoặc mật khẩu không đúng.</Notice>
      </div>
      <EmptyState title="Chưa có thẻ đến hạn" body="Quay lại sau, hoặc học thêm thẻ mới." action={<Button variant="secondary">Học thẻ mới</Button>} />

      <SectionTitle>Hộp thoại</SectionTitle>
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>Mở hộp thoại</Button>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Xóa tài khoản?">
        <p className="text-base">Mọi dữ liệu học sẽ bị xóa và không khôi phục được.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button autoFocus onClick={() => setOpen(false)}>Giữ lại</Button>
          <Button variant="danger" onClick={() => setOpen(false)}>Vẫn xóa</Button>
        </div>
      </Dialog>
    </main>
  );
}
