"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navigation: { name: string; href: string; external?: boolean }[] = [
        { name: "Dashboard", href: "/" },
        { name: "Workers", href: "/workers" },
        { name: "Blocks", href: "/blocks" },
        { name: "Payouts", href: "/transactions" },
        // Canonical setup guide lives on the main site — stratum URLs, worker-name
        // format and the :3333 / :3334 difference — so it isn't duplicated here.
        { name: "Mining Guide", href: "https://bitfinitechain.org/docs#mining", external: true },
    ];

    return (
        <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex h-16 justify-between items-center">
                    {/* shrink-0: a flex child defaults to min-width:auto but WILL be
                        squeezed below its content by a wider sibling. Geist is wider
                        than the system font this used to fall back to, and the
                        wordmark started overhanging its box by 15px at 768-900px. */}
                    <div className="flex items-center shrink-0">
                        <Link href="/" className="flex items-center space-x-3">
                            <Image
                                src="/logo.png"
                                alt="BitFinite Logo"
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <span className="text-2xl font-bold tracking-tight whitespace-nowrap">
                                BIT<span className="text-primary">FINITE</span>
                            </span>
                        </Link>
                    </div>

                    {/* gap-x-5 at md, opening to 8 at lg. With shrink-0 on the wordmark the
                        squeeze moved from the logo to the row: Geist needs 748px of nav in
                        the 736px a 768px tablet gives. Five links fit at the tighter gap, so
                        this keeps the full nav at tablet width instead of dropping to a
                        hamburger the way the ten-link web nav has to. */}
                    <div className="hidden md:flex items-center gap-x-5 lg:gap-x-8">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className={`text-lg font-bold transition-colors flex items-center gap-1 ${pathname === item.href
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary"
                                    }`}
                            >
                                {item.name}
                                {item.external && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="opacity-70">
                                        <path d="M7 17 17 7M9 7h8v8" />
                                    </svg>
                                )}
                            </Link>
                        ))}
                        <ThemeToggle />
                    </div>

                    <div className="flex items-center md:hidden gap-4">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                            aria-expanded={isOpen}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="md:hidden border-t border-border">
                    <div className="space-y-1 px-4 py-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                                className={`block text-base font-medium py-2 ${pathname === item.href
                                    ? "text-primary bg-accent/50 rounded-md px-2"
                                    : "text-muted-foreground hover:text-primary px-2"
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}{item.external ? " \u2197" : ""}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
}
