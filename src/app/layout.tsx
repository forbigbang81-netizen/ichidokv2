import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ichidok — anime, undiluted",
  description:
    "Stream anime with a clean black & white interface. Browse the catalog, dive into seasons, and watch episodes via gdriveplayer.",
  keywords: ["anime", "streaming", "ichidok", "gdriveplayer", "watch anime"],
  authors: [{ name: "ichidok" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ichidok",
    description: "Anime, undiluted. Black & white streaming experience.",
    siteName: "ichidok",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
