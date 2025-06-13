"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Clock } from "lucide-react"
import { format } from "date-fns"
import { DailyWorkLogDialog } from "../daily-work-log"

interface WorkEntry {
  id: string
  jobId: string
  date: string
  worker: string
  task: string
  hoursWorked: number
  materials: { name: string; cost: number }[]
  equipment: { name: string; cost: number }[]
  laborCost: number
  description: string
  status: "completed" | "in-progress" | "delayed"
}

interface WorkLogTabProps {
  jobId: string
  onUpdate: () => void
}

export function WorkLogTab({ jobId, onUpdate }: WorkLogTabProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [workLogs, setWorkLogs] = useState<WorkEntry[]>([])

  useEffect(() => {
    loadWorkLogs()
  }, [jobId])

  const loadWorkLogs = () => {
    const saved = localStorage.getItem('workLogs')
    if (saved) {
      const all = JSON.parse(saved)
      setWorkLogs(all.filter((log: WorkEntry) => log.jobId === jobId))
    }
  }

  const calculateTotalCost = (log: WorkEntry) => {
    const materialsCost = log.materials.reduce((sum, m) => sum + m.cost, 0)
    const equipmentCost = log.equipment.reduce((sum, e) => sum + e.cost, 0)
    return materialsCost + equipmentCost + log.laborCost
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Work Log Entries</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Clock className="w-4 h-4 mr-2" />
          Log Work
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Materials</TableHead>
            <TableHead>Equipment</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{format(new Date(log.date), "MMM d, yyyy")}</TableCell>
              <TableCell>{log.worker}</TableCell>
              <TableCell>{log.task}</TableCell>
              <TableCell>{log.hoursWorked}</TableCell>
              <TableCell>
                {log.materials.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {log.materials.map((m, i) => (
                      <li key={i}>{m.name}: R{m.cost}</li>
                    ))}
                  </ul>
                ) : (
                  "None"
                )}
              </TableCell>
              <TableCell>
                {log.equipment.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {log.equipment.map((e, i) => (
                      <li key={i}>{e.name}: R{e.cost}</li>
                    ))}
                  </ul>
                ) : (
                  "None"
                )}
              </TableCell>
              <TableCell>R{calculateTotalCost(log).toLocaleString()}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    log.status === "completed"
                      ? "default"
                      : log.status === "in-progress"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {log.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <DailyWorkLogDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        jobId={jobId}
        onWorkLogged={() => {
          setShowDialog(false)
          loadWorkLogs()
          onUpdate()
        }}
      />
    </div>
  )
}
