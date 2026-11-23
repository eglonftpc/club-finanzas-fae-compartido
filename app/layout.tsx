import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Club FAE Terminal",
  description: "Terminal de research estilo Bloomberg para el Club de Finanzas FAE",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body
        className="antialiased"
        style={
          {
            "--sans": "var(--font-plex-sans), system-ui, sans-serif",
            "--mono": "var(--font-plex-mono), ui-monospace, monospace",
          } as CSSProperties
        }
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
