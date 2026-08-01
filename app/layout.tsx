import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EngUpdates",
  description: "A modern feed for engineering news and project updates",
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: 'EngUpdates',
    description: 'A modern feed for engineering news and project updates',
    type: 'website',
    siteName: 'EngUpdates',
    url: 'http://localhost:3000',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EngUpdates',
    description: 'A modern feed for engineering news and project updates',
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
      <body suppressHydrationWarning className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
