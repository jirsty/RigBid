import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "RigBid — Semi Truck Auctions",
    template: "%s | RigBid",
  },
  description:
    "Buy and sell semi trucks through curated, time-limited auctions. Transparent pricing, verified sellers, and a community that knows trucks.",
  openGraph: {
    type: "website",
    siteName: "RigBid",
    title: "RigBid — Semi Truck Auctions",
    description:
      "Buy and sell semi trucks through curated, time-limited auctions.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
