import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2.5 sm:gap-6 sm:px-5">
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-md bg-accent font-display text-[15px] font-bold text-white"
          >
            {SITE.symbol}
          </span>
          <span className="hidden font-display text-[17px] font-semibold tracking-tight text-ink xs:inline">
            {SITE.name}
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto sm:gap-1" aria-label="เมนูหลัก">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-lg px-2 py-1.5 text-[14px] whitespace-nowrap text-ink-2 no-underline hover:bg-surface-2 hover:text-ink lg:px-3 lg:text-[14.5px] ${
                item.from === "md" ? "hidden md:block" : item.from === "lg" ? "hidden lg:block" : ""
              }`}
            >
              <span className="lg:hidden">{item.short}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/search"
            aria-label="ค้นหา"
            title="ค้นหา"
            className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-surface text-ink-2 no-underline hover:border-line-strong hover:text-ink"
          >
            <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden fill="none">
              <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12.6 12.6 17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </Link>
          <ThemeToggle />
          <Link
            href="/courses"
            className="hidden rounded-lg bg-accent px-3.5 py-1.5 text-[14px] font-medium text-white no-underline hover:opacity-90 sm:inline-block"
          >
            เริ่มเรียน
          </Link>
        </div>
      </div>
    </header>
  );
}
