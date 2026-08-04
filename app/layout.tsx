import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: '#1a2a52',
}

export const metadata: Metadata = {
  title: "NOW. MUST. TILL DONE.",
  description: "Eisenhower Matrix 할 일 관리",
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'NMTD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        {children}
        <footer className="flex justify-center gap-4 py-4 text-xs text-neutral-400">
          <Link href="/about" className="hover:text-neutral-600">
            About
          </Link>
          <Link href="/blog" className="hover:text-neutral-600">
            Blog
          </Link>
          <Link href="/privacy" className="hover:text-neutral-600">
            Privacy
          </Link>
        </footer>
      </body>
    </html>
  );
}
