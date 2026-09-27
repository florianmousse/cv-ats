import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "CV-ATS — Ton parcours, bien lu",
  description: "Optimise ton CV pour les ATS à partir d’une annonce, sans inventer ton parcours.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
