import type { Metadata } from "next";
import { KanaBoard } from "@/components/kana/kana-board";

export const metadata: Metadata = { title: "Bảng kana" };

export default function KanaPage() {
  return <KanaBoard />;
}
