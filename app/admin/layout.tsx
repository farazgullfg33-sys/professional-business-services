import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin | Professional Business Services",
    template: "%s | Admin"
  },
  robots: { index: false, follow: false }
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
