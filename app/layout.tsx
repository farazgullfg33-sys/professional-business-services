import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { FloatingWidgets, Footer, Navbar, TopBar } from "@/components/SiteChrome";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-plus-jakarta", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://pro.aiinvention.tech"),
  title: {
    default: "Professional Business Services | AI-Powered PRO Services in UAE",
    template: "%s | Professional Business Services"
  },
  description: "AI-powered PRO business services in Abu Dhabi, UAE — company formation, visa processing, licensing, compliance, and government liaison, backed by an 18-agent AI operations team.",
  openGraph: {
    type: "website",
    siteName: "Professional Business Services",
    title: "Professional Business Services | AI-Powered PRO Services in UAE",
    description: "AI-powered PRO business services in Abu Dhabi, UAE — company formation, visa processing, licensing, compliance, and government liaison."
  }
};

const noFlashScript = `try{if(!location.pathname.startsWith('/admin')&&localStorage.getItem('pbs-theme')==='light'){document.documentElement.classList.add('light')}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = headers().get("x-pathname") || "";

  return (
    <html lang="en" className={`${inter.variable} ${plusJakarta.variable}`}>
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
