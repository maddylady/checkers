import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CheckMate Arena — Play Checkers Online",
  description:
    "Play checkers (draughts) online for free. Challenge AI at 3 difficulty levels, play with friends locally or online via room codes. Features Minimax AI, real-time multiplayer, and game analysis.",
  keywords: "checkers, draughts, online checkers, checkers game, play checkers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
