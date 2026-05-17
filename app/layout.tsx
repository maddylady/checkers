import type { Metadata } from "next";
import "./globals.css";

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
      <body className="antialiased" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{children}</body>
    </html>
  );
}
