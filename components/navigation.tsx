"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ClipboardList, FileText, TrendingUp, Users, Briefcase, Upload } from "lucide-react"

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "daily-work", label: "Daily Work", icon: ClipboardList },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "process-invoice", label: "Process Invoice", icon: Upload },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "labour", label: "Labour", icon: Users },
    { id: "jobs", label: "Jobs", icon: Briefcase },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">ConstructPro</h2>
        <p className="text-sm text-gray-600">Project Management</p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeTab === item.id && "bg-blue-600 text-white hover:bg-blue-700",
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
