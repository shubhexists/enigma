"use client"

import { useState } from "react"
import { DashboardOverview } from "@/components/dashboard-overview"
import { CreateAPIForm } from "@/components/create-api-form"
import { APIsList } from "@/components/apis-list"
import { Navigation } from "@/components/navigation"

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<"overview" | "create" | "list">("overview")

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="pt-20">
        {currentPage === "overview" && <DashboardOverview />}
        {currentPage === "create" && <CreateAPIForm />}
        {currentPage === "list" && <APIsList />}
      </main>
    </div>
  )
}
