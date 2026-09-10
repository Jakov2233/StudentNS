import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StudentNS | Studentski vodič kroz Novi Sad",
  description:
    "Interaktivna mapa Novog Sada sa fakultetima, domovima, menzama, kafićima, mestima za učenje i korisnim lokacijama za studente.",
  referrer: "strict-origin-when-cross-origin",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}