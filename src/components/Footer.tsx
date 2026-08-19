"use client";

import Link from "next/link";
import Image from "next/image";
import { Globe, Mail } from "lucide-react";
import { Footer as BrandFooter, SocialLinks, Wordmark, type FooterColumn } from "@bitfinitechain/brandkit";

// Shell, grid and link treatment come from Brandkit; the content is this site's.
const columns: FooterColumn[] = [
    {
        title: "Ecosystem",
        links: [
            { label: "Explorer", href: "https://explorer.bitfinitechain.org", external: true },
            { label: "Mining Pool", href: "/" },
            { label: "Documentation", href: "https://bitfinitechain.org/docs", external: true },
            { label: "Wallet", href: "https://wallet.bitfinitechain.org", external: true },
            { label: "Whitepaper", href: "https://bitfinitechain.org/whitepaper", external: true },
        ],
    },
    { title: "Community", content: <SocialLinks /> },
];

export default function Footer() {
    return (
        <BrandFooter
            columns={columns}
            brand={
                <>
                    <Link href="/" className="flex items-center space-x-3 mb-4">
                        <Image src="/logo.png" alt="BitFinite Logo" width={40} height={40}
                               className="w-10 h-10 rounded-full object-cover" />
                        <Wordmark size="md" />
                    </Link>
                    {/* Was "The future of decentralized finance. Fast, secure, and
                        scalable blockchain infrastructure." — inherited boilerplate
                        from the upstream fork. BFX is not DeFi, and "the future of"
                        is a claim about a chain with a handful of hobbyist miners.
                        This is the same description the explorer carries. */}
                    <p className="text-sm text-muted-foreground mb-4">
                        An open, fair-launch SHA-256 proof-of-work chain. Young and experimental — mined by the community from block one.
                    </p>
                    <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                        <a href="https://bitfinitechain.org" target="_blank" rel="noopener noreferrer"
                           className="flex items-center hover:text-primary transition-colors">
                            <Globe className="w-4 h-4 mr-2" />
                            bitfinitechain.org
                        </a>
                        <a href="mailto:bitfinitechain@proton.me"
                           className="flex items-center hover:text-primary transition-colors">
                            <Mail className="w-4 h-4 mr-2" />
                            bitfinitechain@proton.me
                        </a>
                    </div>
                </>
            }
            bottom={
                <div className="text-center">
                    {`© ${new Date().getFullYear()} the BitFinite project · open-source, no company or foundation behind it.`}
                </div>
            }
        />
    );
}
