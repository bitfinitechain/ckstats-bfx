"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Globe, Mail } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-muted/50">
            <div className="container mx-auto py-12 px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <Link href="/" className="flex items-center space-x-3 mb-4">
                            <Image
                                src="/logo.png"
                                alt="BitFinite Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <span className="text-xl font-bold">
                                BIT<span className="text-primary">FINITE</span>
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground mb-4">
                            The future of decentralized finance. Fast, secure, and scalable blockchain infrastructure.
                        </p>
                        <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
                            <a href="https://bitfinitechain.org" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
                                <Globe className="w-4 h-4 mr-2" />
                                bitfinitechain.org
                            </a>
                            <a href="mailto:bitfinitechain@proton.me" className="flex items-center hover:text-primary transition-colors">
                                <Mail className="w-4 h-4 mr-2" />
                                bitfinitechain@proton.me
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Ecosystem</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="https://explorer.bitfinitechain.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Explorer</Link></li>
                            <li><Link href="/" className="hover:text-primary transition-colors">Mining Pool</Link></li>
                            <li><Link href="https://bitfinitechain.org/docs" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Documentation</Link></li>
                            <li><Link href="https://wallet.bitfinitechain.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Wallet</Link></li>
                            <li><Link href="https://bitfinitechain.org/whitepaper" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Whitepaper</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">Community</h3>
                        <div className="flex space-x-4">
                            <a href="https://x.com/bitfinitechain" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="X">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                <span className="sr-only">X</span>
                            </a>
                            <a href="https://github.com/bitfinitechain" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                                <span className="sr-only">GitHub</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} BitFinite Foundation. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
