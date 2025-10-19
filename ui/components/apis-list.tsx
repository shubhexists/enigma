"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit2, Eye } from "lucide-react"

const mockAPIs = [
  {
    id: 1,
    name: "Weather API",
    category: "Data & Analytics",
    status: "Active",
    requests: 12450,
    earnings: 450,
    created: "2024-01-15",
  },
  {
    id: 2,
    name: "Payment Processor",
    category: "Payment Processing",
    status: "Active",
    requests: 8920,
    earnings: 890,
    created: "2024-02-20",
  },
  {
    id: 3,
    name: "User Management",
    category: "Authentication",
    status: "Active",
    requests: 5630,
    earnings: 280,
    created: "2024-03-10",
  },
  {
    id: 4,
    name: "Data Analytics",
    category: "Data & Analytics",
    status: "Inactive",
    requests: 2100,
    earnings: 105,
    created: "2024-01-05",
  },
  {
    id: 5,
    name: "File Storage",
    category: "Storage",
    status: "Active",
    requests: 15200,
    earnings: 760,
    created: "2024-02-01",
  },
  {
    id: 6,
    name: "Email Service",
    category: "Other",
    status: "Active",
    requests: 9850,
    earnings: 492,
    created: "2024-03-25",
  },
]

export function APIsList() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-foreground">My APIs</h2>
        <p className="text-muted-foreground mt-2">Manage and monitor all your deployed APIs.</p>
      </div>

      <div className="grid gap-4">
        {mockAPIs.map((api) => (
          <Card key={api.id} className="bg-card border-border hover:border-accent/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-foreground">{api.name}</h3>
                    <Badge variant={api.status === "Active" ? "default" : "secondary"} className="rounded-full">
                      {api.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{api.category}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                      <p className="text-lg font-semibold text-foreground">{api.requests.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Earnings</p>
                      <p className="text-lg font-semibold text-accent">{api.earnings} SOL</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-lg font-semibold text-foreground">{api.created}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Response</p>
                      <p className="text-lg font-semibold text-foreground">142ms</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="default" size="default" className="text-muted-foreground hover:text-foreground">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="default" size="default" className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="default" size="default" className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total APIs</p>
              <p className="text-3xl font-bold text-foreground mt-2">{mockAPIs.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {mockAPIs.reduce((sum, api) => sum + api.requests, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-3xl font-bold text-accent mt-2">
                {mockAPIs.reduce((sum, api) => sum + api.earnings, 0)} SOL
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
