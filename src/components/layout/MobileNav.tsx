"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Sparkles, X } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav-items";

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-1 bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white font-bold">
              V
            </div>
            <span className="text-lg font-bold text-ink">VedaAI</span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-canvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Link
          href="/toolkit"
          onClick={onClose}
          className="mb-4 flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white ring-2 ring-accent/60"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          AI Teacher&apos;s Toolkit
        </Link>

        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href.split("/").slice(0, 2).join("/"));
          return (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-canvas text-ink font-semibold" : "text-muted hover:bg-canvas"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}

        <Link
          href="/settings"
          onClick={onClose}
          className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-canvas"
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>

        <div className="mt-2 flex items-center gap-3 rounded-xl bg-canvas/70 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
            DP
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">XYZ School</p>
            <p className="truncate text-xs text-muted">Abc City</p>
          </div>
        </div>
      </div>
    </div>
  );
}
