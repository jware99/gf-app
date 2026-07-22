import type { Metadata } from "next";
import { Space_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Crumb Trail",
  description:
    "Photograph gluten-free grocery receipts and track the extra cost toward your celiac medical-expense deduction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceMono.variable} ${ibmPlexSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
