import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster as Sonner } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ichidoki — Stream Anime",
  description:
    "Stream anime in glorious quality. Clean, fast, free — Ichidoki is the home for anime you love.",
  keywords: ["anime", "streaming", "ichidoki", "watch anime", "anime online"],
  authors: [{ name: "Ichidoki" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Ichidoki — Stream Anime",
    description:
      "Stream anime in glorious quality. Clean, fast, free — Ichidoki is the home for anime you love.",
    siteName: "Ichidoki",
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
        <Sonner
          theme="dark"
          position="bottom-center"
          toastOptions={{
            style: {
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}
