import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto, Open_Sans, PT_Sans, PT_Serif } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import Navigation from "@/components/Navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Шрифты для сертификатов
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const ptSans = PT_Sans({
  variable: "--font-pt-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

const ptSerif = PT_Serif({
  variable: "--font-pt-serif",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Универсальная система олимпиад",
  description: "Система для проведения и оценки олимпиад любого типа",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} ${openSans.variable} ${ptSans.variable} ${ptSerif.variable} antialiased`}
      >
        <ErrorBoundary>
          <Navigation />
          <main>
            {children}
          </main>
        </ErrorBoundary>
      </body>
    </html>
  );
}
