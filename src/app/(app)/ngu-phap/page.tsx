import type { Metadata } from "next";
import { GrammarList } from "@/components/grammar/grammar-list";

export const metadata: Metadata = { title: "Ngữ pháp" };

export default function GrammarPage() {
  return <GrammarList />;
}
