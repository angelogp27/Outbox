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
  title: "OutBox",
  description: "Autonomous batch procurement copilot for corporate events and supplies",
  icons: {
    icon: [
      { url: "/favicon.png?v=4" },
      { url: "/favicon-32.png?v=4", sizes: "32x32", type: "image/png" },
      { url: "/favicon-64.png?v=4", sizes: "64x64", type: "image/png" },
    ],
    shortcut: "/favicon.png?v=4",
    apple: "/favicon-64.png?v=4",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <link rel="icon" href="/favicon.png?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-64.png?v=3" />
        <link rel="apple-touch-icon" href="/favicon-64.png?v=3" />
      </head>
      <body className="min-h-screen bg-[#090a0f] text-[#f3f4f6] flex flex-col">{children}</body>
    </html>
  );
}
