import Image from 'next/image';
import Link from 'next/link';
import { Globe, Mail } from 'lucide-react';
import { SiX, SiGithub, SiDiscord, SiTelegram } from 'react-icons/si';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-card text-muted-foreground">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
              <span className="text-xl font-bold text-foreground">
                BIT<span className="text-primary">FINITE</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Open-source solo mining pool for the BitFinite network — keep the
              full block reward, no middleman.
            </p>
            <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
              <a
                href="https://bitfinitechain.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-primary transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                bitfinitechain.org
              </a>
              <a
                href="mailto:support@bitfinitechain.org"
                className="flex items-center hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                support@bitfinitechain.org
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Ecosystem</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://explorer.bitfinitechain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Explorer
                </a>
              </li>
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Mining Pool
                </Link>
              </li>
              <li>
                <a
                  href="https://wallet.bitfinitechain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Wallet
                </a>
              </li>
              <li>
                <a
                  href="https://bitfinitechain.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Website
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-foreground">Community</h3>
            <div className="flex space-x-4">
              <a
                href="https://x.com/bitfinitechain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiX className="w-5 h-5" />
                <span className="sr-only">X (Twitter)</span>
              </a>
              <a
                href="https://github.com/bitfinitechain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiGithub className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a
                href="https://t.me/bitfinitechain"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiTelegram className="w-5 h-5" />
                <span className="sr-only">Telegram</span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <SiDiscord className="w-5 h-5" />
                <span className="sr-only">Discord</span>
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} BitFinite. Open-source, community-run.</p>
          <p>Solo mining statistics for the BitFinite network</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
