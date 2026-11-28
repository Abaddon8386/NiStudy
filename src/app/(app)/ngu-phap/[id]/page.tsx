import type { Metadata } from "next";
import { GrammarDetail } from "@/components/grammar/grammar-detail";

export const metadata: Metadata = { title: "Bài ngữ pháp" };

function decode(id: string): string {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
}

export default async function GrammarPointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GrammarDetail pointId={decode(id)} />;
}
