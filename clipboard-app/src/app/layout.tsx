import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Figma to Webflow",
  description: "Convert Figma designs to Webflow clipboard format",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
