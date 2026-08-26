"use client";

import {
  LayoutGrid,
  MonitorPlay,
  FileText,
  ClipboardList,
  PieChart,
  Settings,
  Sparkles,
  PanelLeft,
  PanelLeftOpen,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home", icon: LayoutGrid },
  { label: "My Classroom", icon: MonitorPlay },
  { label: "Assignments", icon: FileText },
  { label: "Exams", icon: ClipboardList, active: true },
  { label: "My Library", icon: PieChart },
];

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  if (collapsed) {
    return (
      <aside className="hidden h-full w-[76px] shrink-0 flex-col items-center rounded-2xl bg-white py-5 lg:flex">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-accent"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        <nav className="mt-6 flex flex-1 flex-col items-center gap-2">
          {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${
                active ? "bg-canvas text-ink" : "text-muted hover:bg-canvas/70 hover:text-ink"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-ink"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden h-full w-[260px] shrink-0 flex-col rounded-2xl bg-white p-5 lg:flex">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white font-bold">
            V
          </div>
          <span className="text-lg font-bold text-ink">VedaAI</span>
        </div>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Collapse sidebar"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-canvas"
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="mt-6 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white ring-2 ring-accent/60 shadow-[0_0_0_4px_rgba(239,106,36,0.12)]"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        AI Teacher&apos;s Toolkit
      </button>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-canvas text-ink font-semibold"
                : "text-muted hover:bg-canvas/70 hover:text-ink"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <button
          type="button"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-canvas/70 hover:text-ink"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </button>

        <div className="mt-2 flex items-center gap-3 rounded-xl bg-canvas/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            DP
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">Delhi Public School</p>
            <p className="truncate text-xs text-muted">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
