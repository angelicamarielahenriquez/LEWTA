import type { Metadata } from "next";
import "./styles/v10.css";
import "./styles/lewta-extras.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEWTA · Learning English with Teacher Angélica",
  description: "Boost your English through fun TOEIC vocabulary missions, city stamps and alien rewards.",
  applicationName: "LEWTA",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><meta name="theme-color" content="#061335" /></head><body>{children}</body></html>;
}
