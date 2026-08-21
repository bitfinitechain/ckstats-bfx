"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname } from "next/navigation";
import { AppHeader, Wordmark } from "@bitfinitechain/brandkit";

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

    const ext = (item: { external?: boolean }) =>
        item.external ? { target: "_blank", rel: "noopener noreferrer" } : {};

    return (
        // Bar, rule, track, height, sticky and blur come from Brandkit. Three apps
        // drew this and produced two treatments; this one and web agreed, explorer
        // did not. The element is now <header> containing <nav>, rather than <nav>
        // wrapped around the brand and the theme button, which are not navigation.
        <AppHeader
            // 1600 matches this app's own content track (layout.tsx: max-w-[1600px])
            // and the explorer's header, so the three line up.
            //
            // This was maxWidth="100%" and that was a mistranslation of the header
            // it replaced. The original was `container mx-auto px-4`, and Tailwind's
            // `container` CAPS at each breakpoint (1536px at 2xl) — it is not full
            // width. Carrying the gutter across but dropping the cap put the logo
            // 144px to the LEFT of the page content at 1920px, while looking correct
            // at 1440 and below where the cap never applies. Measured, both sites:
            //   1920  explorer track 1600, brand 176, main 160  -> brand +16
            //   1920  ckpool   track 1920, brand  16, main 160  -> brand -144
            maxWidth={1600}
            // dense keeps the 12/16px gutters rather than inheriting the shared
            // default and widening at sm.
            padding="dense"
            brand={
                <Link href="/" className="flex items-center space-x-3">
                    <Image src="/logo.png" alt="BitFinite Logo" width={48} height={48}
                           className="w-12 h-12 rounded-full object-cover" />
                    <Wordmark size="lg" />
                </Link>
            }
            actions={
                <>
                    {/* The desktop nav lives in `actions`, NOT in children, and carries
                        no ml-auto. Two auto-margin siblings SPLIT the free space between
                        them, so a nav with ml-auto beside AppHeader's ml-auto actions
                        wrapper parked the links mid-bar with the toggle marooned at the
                        far right. One group, one auto margin -- which is how the explorer
                        does it, and what `justify-between` gave this header before. */}
                {/* gap-x-5 at md, opening to 8 at lg. With shrink-0 on the wordmark the
                    squeeze moved from the logo to the row: Geist needs 748px of nav in
                    the 736px a 768px tablet gives. Five links fit at the tighter gap, so
                    this keeps the full nav at tablet width instead of dropping to a
                    hamburger the way the ten-link web nav has to. */}
                <nav className="hidden md:flex items-center gap-x-5 lg:gap-x-8">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            {...ext(item)}
                            className={`text-lg font-bold transition-colors flex items-center gap-1 ${pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground hover:text-primary"}`}
                        >
                            {item.name}
                            {item.external && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                     strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                     aria-hidden="true" className="opacity-70">
                                    <path d="M7 17 17 7M9 7h8v8" />
                                </svg>
                            )}
                        </Link>
                    ))}
                </nav>
                    {/* One toggle, not two. This file rendered it twice — once inside
                        the desktop nav and once in the mobile cluster — which is only
                        invisible because the two are never shown at the same width. */}
                    <ThemeToggle />
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-muted-foreground hover:text-foreground md:hidden"
                        aria-label={isOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </>
            }
            below={isOpen ? (
                <nav className="md:hidden border-t border-border">
                    <div className="space-y-1 py-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                {...ext(item)}
                                onClick={() => setIsOpen(false)}
                                className={`block text-base font-medium py-2 ${pathname === item.href
                                    ? "text-primary bg-accent/50 rounded-md px-2"
                                    : "text-muted-foreground hover:text-primary px-2"}`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </nav>
            ) : null}
        />
    );
}
