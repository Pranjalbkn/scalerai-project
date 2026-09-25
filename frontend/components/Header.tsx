"use client";

import { Globe2, Menu, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Brand from "./Brand";

export default function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Primary navigation">
          <Link className={path === "/" ? "active" : ""} href="/">Homes</Link>
          <Link className={path === "/trips" ? "active" : ""} href="/trips">Trips</Link>
          <Link className={path === "/wishlist" ? "active" : ""} href="/wishlist">Wishlists</Link>
        </nav>
        <div className="header-actions">
          <Link href="/host" className="host-link">Switch to hosting</Link>
          <button className="icon-button" aria-label="Choose language"><Globe2 size={18} /></button>
          <Link href="/host" className="profile-pill" aria-label="Open profile menu">
            <Menu size={18} />
            <span className="avatar-mini"><UserRound size={18} /></span>
          </Link>
        </div>
      </div>
    </header>
  );
}

