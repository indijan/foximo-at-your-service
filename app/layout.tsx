// app/layout.tsx
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

// 🔥 Itt állítjuk be a Foximo metaadatokat + a share képet
export const metadata: Metadata = {
  title: "Foximo the Courtier",
  description:
    "Your humble digital courtier, ever ready to flatter and delight.",
  openGraph: {
    title: "Foximo the Courtier",
    description:
      "Send and receive royal compliments with Foximo at your service.",
    url: "https://www.foximoatyourservice.today/",
    images: [
      {
        url: "/foximo_share.png",
        width: 800,
        height: 800,
        alt: "Foximo the Courtier bowing politely",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}