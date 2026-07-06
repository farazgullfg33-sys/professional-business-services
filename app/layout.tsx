import type { Metadata } from "next";
import "./globals.css";
import { FloatingWidgets, Footer, Navbar, TopBar } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: {
    default: "Professional Business Services | PRO Services in UAE",
    template: "%s | Professional Business Services"
  },
  description: "Professional business setup, visa processing, and government liaison services in Abu Dhabi, UAE."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TopBar />
        <Navbar />
        {children}
        <Footer />
        <FloatingWidgets />
      </body>
    </html>
  );
}
