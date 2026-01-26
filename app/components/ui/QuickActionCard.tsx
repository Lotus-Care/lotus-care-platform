import Link from "next/link";
import { ReactNode } from "react";

interface QuickActionCardProps {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}

export default function QuickActionCard({
  href,
  title,
  description,
  icon,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 transition-all hover:border-[var(--primary)] hover:shadow-lg active:scale-[0.98]"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-foreground)]">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        <svg
          className="h-5 w-5 text-[var(--muted-foreground)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}

