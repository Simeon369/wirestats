import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WireStats",
  description: "Track Your Stats. Elevate Your Game.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WireStats",
  },
  openGraph: {
    title: "WireStats",
    description: "Track Your Stats. Elevate Your Game.",
    url: "https://wirestats.vercel.app",
    siteName: "WireStats",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "WireStats - Track Your Stats",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WireStats",
    description: "Track Your Stats. Elevate Your Game.",
    images: ["/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-nunito">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
