"use client";
// Shared responsive navigation. The same routes work with keyboard, touch, and pointer input.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";

export function Mark() {
  return <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 24V8l8 11L19 8v16M19 8l10 16V8" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" /></svg>;
}
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return <header className="site-header"><Link href="/" className="wordmark" aria-label="Marketwise home"><Mark />marketwise</Link>
    <button className="icon-button mobile-menu" aria-expanded={open} aria-controls="primary-navigation" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    <nav id="primary-navigation" aria-label="Main navigation" className={open ? "nav open" : "nav"}>
      {[["/markets", "Markets"], ["/simulator", "Simulator"], ["/learn", "Learn"], ["/explore", "Explore"], ["/pricing", "Plans"]].map(([url, label]) => <Link key={url} href={url} className={path === url ? "current" : ""} onClick={() => setOpen(false)}>{label}</Link>)}
      <Link href="/account" className="nav-signin" onClick={() => setOpen(false)}>Account <ArrowUpRight size={14} /></Link>
      <Link href="/markets" className="button small" onClick={() => setOpen(false)}>Explore markets <ArrowUpRight size={15} /></Link>
    </nav></header>;
}
export function Footer() {
  return <footer className="footer"><div className="footer-top"><Link href="/" className="wordmark"><Mark />marketwise</Link><p>A little perspective.<br />A wiser next move.</p><div className="footer-links">{[["/markets", "Markets"], ["/simulator", "Simulator"], ["/explore", "Explore"], ["/blogs", "Blogs"], ["/news", "News"], ["/grow", "Grow"], ["/faq", "FAQ"], ["/chat", "Help"], ["/about", "About"], ["/user_protection", "Privacy"], ["/pricing", "Plans"], ["/account", "Account"]].map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Marketwise. A project by <a href="https://bynevin.dev">Nevin.</a></span><span>Market data can be delayed. Educational tools, not financial advice.</span></div></footer>;
}
