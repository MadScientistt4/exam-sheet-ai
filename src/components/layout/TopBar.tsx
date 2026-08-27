"use client";

import { ArrowLeft, Bell, ChevronDown, ClipboardList, HelpCircle, Menu, Sparkles } from "lucide-react";

export function TopBar() {
  return (
    <header className="flex shrink-0 items-center justify-between rounded-full bg-white px-4 py-3">
      {/* Mobile app bar */}
      <div className="flex w-full items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <span className="text-lg font-bold text-ink">VedaAI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-canvas text-ink"
          >
            <Bell className="h-[18px] w-[18px]" />
            {/* <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /> */}
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-dark">
            MR
          </div>
          <button
            type="button"
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Desktop bar */}
      <div className="hidden w-full items-center justify-between md:flex">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <div className="flex items-center gap-2 text-muted">
            <ClipboardList className="h-[18px] w-[18px]" />
            <span className="text-sm">Exams</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Help"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <Bell className="h-[18px] w-[18px]" />
            {/* <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" /> */}
          </button>
          <button
            type="button"
            aria-label="AI toolkit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-canvas"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-dark">
              MR
            </div>
            <span className="text-sm font-semibold text-ink">ABC Name </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}
