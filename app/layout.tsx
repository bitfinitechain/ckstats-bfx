import './globals.css';
import { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';

import Footer from '../components/Footer';
import Header from '../components/Header';
import Providers from '../components/Providers';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BitFinite Ckpool Stats',
  description: 'Real-time and historical statistics for the BitFinite Ckpool.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
