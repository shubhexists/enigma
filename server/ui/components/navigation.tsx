"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

interface NavigationProps {
  currentPage: "overview" | "create" | "list"
  setCurrentPage: (page: "overview" | "create" | "list") => void
}

export function Navigation({ currentPage, setCurrentPage }: NavigationProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">SolanaAPI</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={currentPage === "overview" ? "default" : null}
            onClick={() => setCurrentPage("overview")}
            className="rounded-lg"
          >
            Overview
          </Button>
          <Button
            variant={currentPage === "create" ? "default" : null}
            onClick={() => setCurrentPage("create")}
            className="rounded-lg"
          >
            Create API
          </Button>
          <Button
            variant={currentPage === "list" ? "default" : null}
            onClick={() => setCurrentPage("list")}
            className="rounded-lg"
          >
            My APIs
          </Button>
        </div>
      </div>
    </nav>
  )
}
