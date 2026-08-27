import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type ComingSoonScreenProps = {
  title: string;
  description: string;
};

export function ComingSoonScreen({ title, description }: ComingSoonScreenProps) {
  return (
    <section
      className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl px-4 py-10 text-center"
      style={{
        background: "radial-gradient(circle at 30% 20%, #f8f8f9 0%, #e4e4e6 55%, #d7d7da 100%)",
      }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-tint text-accent-dark">
        <Sparkles className="h-6 w-6" strokeWidth={1.5} />
      </span>
      <div className="flex flex-col items-center gap-1.5">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="max-w-sm text-sm text-muted">{description}</p>
      </div>
      <Link
        href="/exams/upload"
        className="mt-2 flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/90"
      >
        Go to Exams
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
