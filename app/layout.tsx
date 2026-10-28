import type { Metadata } from "next";
import "./globals.css";
import "./styles/layout.css";
import "./styles/screens.css";
import "./styles/games.css";

export const metadata: Metadata = {
  title: "LEWTA · Learning English with Teacher Angélica",
  description: "Boost your English through fun TOEIC vocabulary missions, city stamps and alien rewards.",
  applicationName: "LEWTA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head>
    <meta name="theme-color" content="#061335" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout: fonts load on every page */}
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800&family=Nunito:wght@600;700;800;900&family=Poppins:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
  </head><body>{children}</body></html>;
}
