"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const earningsData = [
  { month: "Jan", earnings: 120 },
  { month: "Feb", earnings: 240 },
  { month: "Mar", earnings: 180 },
  { month: "Apr", earnings: 390 },
  { month: "May", earnings: 490 },
  { month: "Jun", earnings: 640 },
]

const requestsData = [
  { day: "Mon", requests: 2400 },
  { day: "Tue", requests: 1398 },
  { day: "Wed", requests: 9800 },
  { day: "Thu", requests: 3908 },
  { day: "Fri", requests: 4800 },
  { day: "Sat", requests: 3800 },
  { day: "Sun", requests: 4300 },
]

export function DashboardOverview() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground mt-2">Welcome back! Here's your API performance overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">💰 Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">2,450 SOL</div>
            <p className="text-xs text-accent mt-1">↑ +12.5% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">⚡ Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">48,392</div>
            <p className="text-xs text-accent mt-1">↑ +8.2% from last week</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">👥 Active APIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">All running smoothly</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Earnings Over Time</CardTitle>
            <CardDescription>Monthly earnings in SOL</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={earningsData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 10% 20%)" />
                <XAxis dataKey="month" stroke="hsl(95 2% 75%)" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(95 2% 75%)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(270 10% 12%)",
                    border: "2px solid hsl(217 100% 60%)",
                    borderRadius: "8px",
                    color: "hsl(95 2% 95%)",
                  }}
                  cursor={{ fill: "rgba(217, 100%, 60%, 0.1)" }}
                />
                <Bar dataKey="earnings" fill="hsl(217 100% 60%)" radius={[8, 8, 0, 0]} strokeWidth={0} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Weekly Requests</CardTitle>
            <CardDescription>API requests per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={requestsData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(270 10% 20%)" />
                <XAxis dataKey="day" stroke="hsl(95 2% 75%)" style={{ fontSize: "12px" }} />
                <YAxis stroke="hsl(95 2% 75%)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(270 10% 12%)",
                    border: "2px solid hsl(200 100% 70%)",
                    borderRadius: "8px",
                    color: "hsl(95 2% 95%)",
                  }}
                  cursor={{ fill: "rgba(200, 100%, 70%, 0.1)" }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(200 100% 70%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(200 100% 70%)", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest API interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "API Request", api: "Weather API", time: "2 minutes ago", status: "Success" },
              { action: "API Created", api: "Payment Processor", time: "1 hour ago", status: "Active" },
              { action: "API Request", api: "Data Analytics", time: "3 hours ago", status: "Success" },
              { action: "API Updated", api: "User Management", time: "5 hours ago", status: "Updated" },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-foreground">{item.action}</p>
                  <p className="text-sm text-muted-foreground">{item.api}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{item.time}</p>
                  <p className="text-xs text-accent font-medium">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
