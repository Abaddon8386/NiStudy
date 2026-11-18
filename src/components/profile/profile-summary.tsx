"use client";

import { useEffect, useState } from "react";
import { fetchProfile, type ProfileSettings } from "@/lib/profile/settings";

/** Tạm thời: hiện cấp và mục tiêu hiện tại để kiểm nối dữ liệu (dashboard làm ở sprint sau). */
export function ProfileSummary() {
  const [profile, setProfile] = useState<ProfileSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchProfile().then((r) => {
      if (!cancelled && r.ok) setProfile(r.data.profile);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!profile) return null;
  return (
    <p className="mt-3 text-base">
      Cấp {profile.level} · {profile.newPerDay} thẻ mới mỗi ngày
    </p>
  );
}
