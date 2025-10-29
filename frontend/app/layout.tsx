import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const spaceMono = localFont({
  src: [
    {
      path: "../public/Space_Mono/SpaceMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Space_Mono/SpaceMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/Space_Mono/SpaceMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/Space_Mono/SpaceMono-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-space-mono",
})

export const metadata: Metadata = {
  title: "RapidAPI - Discover and Integrate Powerful APIs",
  description: "Connect to thousands of APIs with seamless integration",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {await ClerkProvider({ children: (
        <html lang="en" className={`${spaceMono.variable} antialiased`} suppressHydrationWarning>
          <body className="font-mono">
            {children}
            <Toaster />
          </body>
        </html>
      )})}
    </>
  )
}
