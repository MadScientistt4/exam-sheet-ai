"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Bell, ChevronDown, ClipboardList, HelpCircle, Menu, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/layout/MobileNav";

type TopBarProps = {
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
};

export function TopBar({ mobileNavOpen, onToggleMobileNav }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleBack() {
    if (pathname === "/exams/mapping") {
      router.push("/exams/upload");
    } else {
      router.back();
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between rounded-full bg-white px-4 py-3">
      {/* Mobile app bar */}
      <div className="flex w-full items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Go back"
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <ArrowLeft className="h-[18px] w-[18px]" />
          </button>
          <span className="text-lg font-bold text-ink">VedaAI</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationsButton className="bg-canvas" />
          <Link
            href="/settings"
            aria-label="Profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-dark"
          >
            MR
          </Link>
          <button
            type="button"
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            onClick={onToggleMobileNav}
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
            onClick={handleBack}
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
          <Link
            href="/help"
            aria-label="Help"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
          </Link>
          <NotificationsButton />
          <Link
            href="/toolkit"
            aria-label="AI toolkit"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas"
          >
            <Sparkles className="h-[18px] w-[18px]" />
          </Link>

          <Link
            href="/settings"
            className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-canvas"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-dark">
              MR
            </div>
            <span className="text-sm font-semibold text-ink">ABC Name </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </Link>
        </div>
      </div>

      <MobileNav open={mobileNavOpen} onClose={onToggleMobileNav} />
    </header>
  );
}

function NotificationsButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-canvas ${className}`}
      >
        <Bell className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl bg-white p-4 text-left shadow-lg ring-1 ring-black/5">
            <p className="text-sm font-bold text-ink">Notifications</p>
            <p className="mt-1 text-sm text-muted">You&apos;re all caught up — no new notifications.</p>
          </div>
        </>
      )}
    </div>
  );
}
