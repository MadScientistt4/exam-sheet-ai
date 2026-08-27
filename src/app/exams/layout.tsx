import { ExamStoreProvider } from "@/components/exam/ExamStoreContext";

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  return <ExamStoreProvider>{children}</ExamStoreProvider>;
}
