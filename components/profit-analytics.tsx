"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { TrendingUp, DollarSign, Target } from "lucide-react"

export function ProfitAnalytics() {
  const monthlyData = [
    { month: "Jan", revenue: 45000, costs: 32000, profit: 13000 },
    { month: "Feb", revenue: 52000, costs: 38000, profit: 14000 },
    { month: "Mar", revenue: 48000, costs: 35000, profit: 13000 },
    { month: "Apr", revenue: 61000, costs: 42000, profit: 19000 },
    { month: "May", revenue: 55000, costs: 39000, profit: 16000 },
    { month: "Jun", revenue: 67000, costs: 45000, profit: 22000 },
  ]

  const costBreakdown = [
    { name: "Labour", value: 45, color: "#8884d8" },
    { name: "Materials", value: 35, color: "#82ca9d" },
    { name: "Equipment", value: 12, color: "#ffc658" },
    { name: "Overhead", value: 8, color: "#ff7300" },
  ]

  const projectProfitability = [
    { project: "Bathroom Renovation", budget: 11720, actual: 9500, profit: 2220, margin: 18.9 },
    { project: "Kitchen Remodel", budget: 25000, actual: 22000, profit: 3000, margin: 12.0 },
    { project: "Office Renovation", budget: 45000, actual: 41000, profit: 4000, margin: 8.9 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R328,000</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +12% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costs</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R231,000</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-red-500" />
              +8% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R97,000</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +18% from last period
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">29.6%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +2.1% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue vs Costs</CardTitle>
            <CardDescription>Track revenue and cost trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue",
                  color: "hsl(var(--chart-1))",
                },
                costs: {
                  label: "Costs",
                  color: "hsl(var(--chart-2))",
                },
                profit: {
                  label: "Profit",
                  color: "hsl(var(--chart-3))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="revenue" fill="var(--color-revenue)" name="Revenue" />
                  <Bar dataKey="costs" fill="var(--color-costs)" name="Costs" />
                  <Bar dataKey="profit" fill="var(--color-profit)" name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Distribution of project costs</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                labour: {
                  label: "Labour",
                  color: "#8884d8",
                },
                materials: {
                  label: "Materials",
                  color: "#82ca9d",
                },
                equipment: {
                  label: "Equipment",
                  color: "#ffc658",
                },
                overhead: {
                  label: "Overhead",
                  color: "#ff7300",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profit Trend</CardTitle>
          <CardDescription>Monthly profit progression</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              profit: {
                label: "Profit",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="profit" stroke="var(--color-profit)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Profitability Analysis</CardTitle>
          <CardDescription>Compare budget vs actual costs and profit margins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectProfitability.map((project, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{project.project}</h4>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                    <div className="font-semibold text-green-600">{project.margin}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Budget</div>
                    <div className="font-medium">R{project.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Actual Cost</div>
                    <div className="font-medium">R{project.actual.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Profit</div>
                    <div className="font-medium text-green-600">R{project.profit.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
