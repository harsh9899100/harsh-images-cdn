import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ImageCDN — Vercel Blob Storage",
  description: "Project-based image CDN powered by Vercel Blob",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
