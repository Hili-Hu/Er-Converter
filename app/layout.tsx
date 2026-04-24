import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthButton } from "@/components/auth-button";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased">
        <body className="min-h-full flex flex-col">
          <AuthButton />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
