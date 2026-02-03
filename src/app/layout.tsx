import type { Metadata } from "next";
import { Libre_Baskerville, DM_Sans } from "next/font/google";
import "./globals.css";

const libreBaskerville = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "I Can Only Imagine 2 | Bayside Church Exclusive Screening",
  description:
    "Join Bayside Church for an exclusive screening of I Can Only Imagine 2. Experience the inspiring next chapter of faith, family, and finding God in the fire. February 14-15, 2026.",
  keywords: [
    "I Can Only Imagine 2",
    "Bayside Church",
    "movie screening",
    "MercyMe",
    "faith movie",
    "Christian film",
  ],
  openGraph: {
    title: "I Can Only Imagine 2 | Bayside Church Exclusive Screening",
    description:
      "Join Bayside Church for an exclusive screening of I Can Only Imagine 2. February 14-15, 2026.",
    images: ["/images/home-poster.jpg"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${libreBaskerville.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
