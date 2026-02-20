"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-[11px] uppercase tracking-[0.08em] relative ${
        active ? "text-ink" : "text-ink-muted hover:text-ink"
      } transition-colors`}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-ink" />
      )}
    </Link>
  );
}

export function AuthNav({
  initial,
  followerBadge,
  isAdmin,
}: {
  initial: string;
  followerBadge: string | null;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 bg-[rgba(246,244,239,0.92)] backdrop-blur-[20px]">
      <Link href="/home">
        <Logo />
      </Link>
      <div className="flex items-center gap-2.5">
        <NavLink href="/home" active={isActive("/home")}>
          Feed
        </NavLink>
        <NavLink href="/discover" active={isActive("/discover")}>
          Browse
        </NavLink>
        <NavLink href="/recipes" active={isActive("/recipes")}>
          Recipes
        </NavLink>
        <NavLink href="/invites" active={isActive("/invites")}>
          Invite
        </NavLink>
        {isAdmin && (
          <NavLink href="/admin" active={isActive("/admin")}>
            Admin
          </NavLink>
        )}
        <Link href="/profile">
          <div className="relative w-7 h-7 rounded-full bg-ink text-bg text-[11px] font-bold flex items-center justify-center transition-transform duration-[250ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.12]">
            {initial}
            {followerBadge && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-white">
                {followerBadge}
              </span>
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
}
