import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "VIDA ATIVA - FLEX",
  description: "Treinos de corrida flexíveis com zonas de ritmo personalizadas.",
  applicationName: "VIDA ATIVA - FLEX",
  manifest: "/manifest.webmanifest?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VIDA ATIVA FLEX",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
      { url: "/logo-icon.png?v=2", sizes: "64x64", type: "image/png" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png?v=2", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.svg?v=2",
  },
};

export const viewport: Viewport = { themeColor: "#101010", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/logo-icon.png?v=2" sizes="64x64" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" sizes="180x180" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
