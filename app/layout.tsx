import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { FloatingWidgets, Footer, Navbar, TopBar } from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://pro.aiinvention.tech"),
  title: {
    default: "Professional Business Services | PRO Services in UAE",
    template: "%s | Professional Business Services"
  },
  description: "Professional Business Services — PRO business services in Abu Dhabi, UAE — company formation, visa processing, licensing, compliance, and government liaison.",
  openGraph: {
    type: "website",
    siteName: "Professional Business Services",
    title: "Professional Business Services | PRO Services in UAE",
    description: "Professional Business Services — company formation, visa processing, licensing, compliance, and government liaison in Abu Dhabi, UAE."
  }
};

const noFlashScript = `try{if(!location.pathname.startsWith('/admin')&&localStorage.getItem('pbs-theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") || "";

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {!pathname.startsWith("/admin") ? <script dangerouslySetInnerHTML={{ __html: noFlashScript }} /> : null}
      </head>
      <body className="bg-base font-sans text-body antialiased">
        {pathname.startsWith("/admin") ? (
          children
        ) : (
          <ThemeProvider>
            <TopBar />
            <Navbar />
            {children}
            <Footer />
            <FloatingWidgets />
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
