import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurum CDN - Dynamic Storage Studio",
  description: "A luxury, hyper-premium image CDN dashboard developed by Harsh Patel, powered by Vercel Blob Storage.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

