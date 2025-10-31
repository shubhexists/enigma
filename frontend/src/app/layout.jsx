import localFont from "next/font/local"
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const spaceMono = localFont({
  src: [
    {
      path: "../../public/Space_Mono/SpaceMono-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Space_Mono/SpaceMono-Italic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/Space_Mono/SpaceMono-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/Space_Mono/SpaceMono-BoldItalic.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-space-mono",
})

export const metadata = {
  title: "Enigma Labs - Discover and Integrate Powerful APIs",
  description: "Connect to thousands of APIs with seamless integration",
}

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
      }}
      routing="path"
      path="/sign-in"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" className={`${spaceMono.variable} antialiased`} suppressHydrationWarning>
        <body className="font-mono">
          {children}
          <Toaster position="bottom-right" richColors closeButton theme="light" />
        </body>
      </html>
    </ClerkProvider>
  )
}
