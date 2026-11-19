import type { Metadata } from "next";
import { ReviewSession } from "@/components/review/review-session";

export const metadata: Metadata = { title: "Phiên ôn" };

export default function ReviewPage() {
  return <ReviewSession />;
}
