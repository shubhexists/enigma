"use client";

import { usePathname } from "next/navigation";
import Footer from "../Footer/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Don't show footer on dashboard and auth pages
  if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/auth")) {
    return null;
  }

  return <Footer />;
}


