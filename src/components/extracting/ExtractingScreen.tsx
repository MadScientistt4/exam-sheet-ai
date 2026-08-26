"use client";

import { Sparkles } from "lucide-react";

export function ExtractingScreen() {
  return (
    <section className="flex min-h-160 flex-1 flex-col items-center justify-center gap-4 rounded-2xl bg-white px-6 py-12 text-center">
      <Sparkles className="h-16 w-16 animate-pulse text-accent" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <p className="text-xl font-bold text-ink">Extracting...</p>
        <p className="text-sm text-muted">This may take a while</p>
      </div>
    </section>
  );
}
