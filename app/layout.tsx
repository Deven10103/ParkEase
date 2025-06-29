import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Inter as FontSans } from "next/font/google"
import { cn } from '@/lib/utils'
import { Toaster } from "sonner";
import { ClerkLoaded, ClerkProvider } from "@clerk/nextjs";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Park Ease",
  description: "Gateless Parking Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={cn(inter.className,
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <ClerkLoaded>
            {children}
          </ClerkLoaded>
          <Toaster />
          </body>
      </html>
    </ClerkProvider>

  );
}
