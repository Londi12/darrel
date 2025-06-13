"use client"

import { useState } from "react"
import { DashboardOverview } from "@/components/dashboard-overview"
import { DailyWorkLog } from "@/components/daily-work-log"
import { InvoiceManagement } from "@/components/invoice-management"
import { ProfitAnalytics } from "@/components/profit-analytics"
import { LabourManagement } from "@/components/labour-management"
import { JobManagement } from "@/components/job-management"
import { Navigation } from "@/components/navigation"
import dynamic from "next/dynamic"

const DynamicInvoiceProcessor = dynamic(
  () => import("@/components/invoice-processor").then((mod) => mod.InvoiceProcessor),
  {
    ssr: false,
  }
)

export default function ConstructionPM() {
  const [activeTab, setActiveTab] = useState("dashboard")

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Construction Project Management</h1>
            <p className="text-gray-600">Manage your construction projects, teams, and profitability</p>
          </div>

          <div className="space-y-6">
            {activeTab === "dashboard" && <DashboardOverview />}
            {activeTab === "daily-work" && <DailyWorkLog />}
            {activeTab === "invoices" && <InvoiceManagement />}
            {activeTab === "analytics" && <ProfitAnalytics />}
            {activeTab === "labour" && <LabourManagement />}
            {activeTab === "jobs" && <JobManagement />}
            {activeTab === "process-invoice" && <DynamicInvoiceProcessor />}
          </div>
        </div>
      </main>
    </div>
  )
}
