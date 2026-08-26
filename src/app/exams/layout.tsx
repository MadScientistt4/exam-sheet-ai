"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ExamStoreProvider } from "@/components/exam/ExamStoreContext";

export default function ExamsLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <ExamStoreProvider>
      <div className="flex h-screen gap-4 overflow-hidden bg-canvas p-4">
        <Sidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <TopBar />
          <div className="flex flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      </div>
    </ExamStoreProvider>
  );
}
