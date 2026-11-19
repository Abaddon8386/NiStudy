import type { Metadata } from "next";
import { QuizSession } from "@/components/quiz/quiz-session";

export const metadata: Metadata = { title: "Trắc nghiệm" };

export default function QuizPage() {
  return <QuizSession />;
}
