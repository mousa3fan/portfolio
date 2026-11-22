import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
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

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mohamed Saafan — Cinematographer & Post-Production Lead",
  description: "Award-winning cinematographer behind Telepathy, #ABtalks × Cartier, and campaigns for Red Bull, Netflix & Palm Hills. Portfolio of films, credits, awards, education and experience.",
  keywords: ["Mohamed Saafan", "cinematographer", "DP", "video editor", "Cannes", "showreel", "portfolio"],
  authors: [{ name: "Mohamed Saafan" }],
  icons: {
    icon: "/logo.svg",
    apple: "/cover-portrait.png",
  },
  openGraph: {
    title: "Mohamed Saafan — Portfolio",
    description: "Award-Winning Cinematographer & Senior Post-Production Lead",
    siteName: "Mohamed Saafan Portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohamed Saafan — Portfolio",
    description: "Award-Winning Cinematographer & Senior Post-Production Lead",
  },
};

/* Mobile browser tuning:
   • viewportFit: "cover" → page paints edge-to-edge under the iPhone
     notch / Android camera cut-out (safe-area padding handled in CSS)
   • themeColor → Safari / Chrome UI tint matches the page background
   • interactiveWidget → Android keyboard resizes the page instead of
     covering the dashboard PIN input */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
