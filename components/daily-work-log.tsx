"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WorkEntry {
  id: string;
  jobId: string;
  date: string;
  worker: string;
  task: string;
  hoursWorked: number;
  description: string;
  materialsUsed: string;
  status: "completed" | "in-progress" | "delayed";
}

interface Job {
  id: string;
  title: string;
  client: string;
  status: string;
}

interface DailyWorkLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  onWorkLogged?: () => void;
}

export function DailyWorkLogDialog({ isOpen, onClose, job, onWorkLogged }: DailyWorkLogDialogProps) {
  const { toast } = useToast()
  const [workLogs, setWorkLogs] = useState<WorkEntry[]>([])
  const [newEntry, setNewEntry] = useState<Omit<WorkEntry, 'id' | 'jobId'>>({
    date: new Date().toISOString().split("T")[0],
    worker: "",
    task: "",
    hoursWorked: 0,
    description: "",
    materialsUsed: "",
    status: "in-progress",
  })

  useEffect(() => {
    // Load work logs from localStorage when component mounts
    const savedWorkLogs = localStorage.getItem('workLogs')
    if (savedWorkLogs) {
      const parsedWorkLogs = JSON.parse(savedWorkLogs)
      // Filter work logs for current job
      const jobWorkLogs = parsedWorkLogs.filter((log: WorkEntry) => log.jobId === job.id)
      setWorkLogs(jobWorkLogs)
    }
  }, [job.id])

  const handleSubmit = () => {
    if (!newEntry.worker || !newEntry.task || !newEntry.hoursWorked) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const workEntry: WorkEntry = {
      id: Date.now().toString(),
      jobId: job.id,
      ...newEntry
    }

    // Get all work logs from localStorage
    const savedWorkLogs = localStorage.getItem('workLogs')
    const allWorkLogs = savedWorkLogs ? JSON.parse(savedWorkLogs) : []
    
    // Add new work log
    const updatedWorkLogs = [...allWorkLogs, workEntry]
    
    // Save back to localStorage
    localStorage.setItem('workLogs', JSON.stringify(updatedWorkLogs))
    
    // Update local state with only this job's logs
    const jobWorkLogs = updatedWorkLogs.filter(log => log.jobId === job.id)
    setWorkLogs(jobWorkLogs)

    // Reset form
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      worker: "",
      task: "",
      hoursWorked: 0,
      description: "",
      materialsUsed: "",
      status: "in-progress",
    })

    toast({
      title: "Work Log Added",
      description: "The work log has been saved successfully.",
    })

    // Notify parent component
    if (onWorkLogged) {
      onWorkLogged()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Daily Work Log - {job.title}</DialogTitle>
          <DialogDescription>
            Record daily work activities and progress for this job.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="worker">Worker Name</Label>
              <Input
                id="worker"
                value={newEntry.worker}
                onChange={(e) => setNewEntry({ ...newEntry, worker: e.target.value })}
                placeholder="Enter worker name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="task">Task</Label>
            <Input
              id="task"
              value={newEntry.task}
              onChange={(e) => setNewEntry({ ...newEntry, task: e.target.value })}
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hoursWorked">Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                value={newEntry.hoursWorked}
                onChange={(e) => setNewEntry({ ...newEntry, hoursWorked: Number(e.target.value) })}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={newEntry.status}
                onValueChange={(value) => setNewEntry({ ...newEntry, status: value as "completed" | "in-progress" | "delayed" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="Enter detailed description of work done"
            />
          </div>

          <div>
            <Label htmlFor="materials">Materials Used</Label>
            <Textarea
              id="materials"
              value={newEntry.materialsUsed}
              onChange={(e) => setNewEntry({ ...newEntry, materialsUsed: e.target.value })}
              placeholder="List materials used (optional)"
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Add Work Log
            </Button>
          </div>

          {workLogs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Previous Work Logs</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Worker</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workLogs
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                          <TableCell>{log.worker}</TableCell>
                          <TableCell>{log.task}</TableCell>
                          <TableCell>{log.hoursWorked}</TableCell>
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
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function DailyWorkLog() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  
  // Load jobs and work entries when component mounts
  useEffect(() => {
    const savedJobs = localStorage.getItem('jobs')
    const savedEntries = localStorage.getItem('workLogs')
    
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs))
    }
    
    if (savedEntries) {
      setWorkEntries(JSON.parse(savedEntries))
    }
  }, [])

  const [showDialog, setShowDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null)
  const [newEntry, setNewEntry] = useState<Partial<WorkEntry>>({
    date: new Date().toISOString().split("T")[0],
    jobTitle: "",
    worker: "",
    task: "",
    hoursWorked: 0,
    description: "",
    status: "in-progress",
  })

  const handleAddEntry = () => {
    if (newEntry.jobTitle && newEntry.worker && newEntry.task) {
      const entry: WorkEntry = {
        id: Math.max(...workEntries.map((e) => e.id), 0) + 1,
        date: newEntry.date || new Date().toISOString().split("T")[0],
        jobTitle: newEntry.jobTitle || "",
        worker: newEntry.worker || "",
        task: newEntry.task || "",
        hoursWorked: newEntry.hoursWorked || 0,
        description: newEntry.description || "",
        status: (newEntry.status as WorkEntry["status"]) || "in-progress",
      }
      setWorkEntries([...workEntries, entry])
      resetDialog()
      toast({
        title: "Work Entry Added",
        description: `${entry.hoursWorked} hours logged for "${entry.task}" by ${entry.worker}.`,
      })
    }
  }

  const handleEditEntry = (entry: WorkEntry) => {
    setEditingEntry(entry)
    setNewEntry(entry)
    setShowDialog(true)
  }

  const handleUpdateEntry = () => {
    if (editingEntry && newEntry.jobTitle && newEntry.worker && newEntry.task) {
      const updatedEntry: WorkEntry = {
        ...editingEntry,
        date: newEntry.date || editingEntry.date,
        jobTitle: newEntry.jobTitle || "",
        worker: newEntry.worker || "",
        task: newEntry.task || "",
        hoursWorked: newEntry.hoursWorked || 0,
        description: newEntry.description || "",
        status: (newEntry.status as WorkEntry["status"]) || "in-progress",
      }
      setWorkEntries(workEntries.map((e) => (e.id === editingEntry.id ? updatedEntry : e)))
      resetDialog()
      toast({
        title: "Work Entry Updated",
        description: `Work entry for "${updatedEntry.task}" has been successfully updated.`,
      })
    }
  }

  const handleDeleteEntry = (entryId: number) => {
    const entry = workEntries.find((e) => e.id === entryId)
    setWorkEntries(workEntries.filter((e) => e.id !== entryId))
    toast({
      title: "Work Entry Deleted",
      description: `Work entry for "${entry?.task}" has been successfully deleted.`,
      variant: "destructive",
    })
  }

  const resetDialog = () => {
    setEditingEntry(null)
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      jobTitle: "",
      worker: "",
      task: "",
      hoursWorked: 0,
      description: "",
      status: "in-progress",
    })
    setShowDialog(false)
  }

  const totalHoursToday = workEntries
    .filter((entry) => entry.date === new Date().toISOString().split("T")[0])
    .reduce((sum, entry) => sum + entry.hoursWorked, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHoursToday}h</div>
            <p className="text-xs text-muted-foreground">Total hours logged today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workEntries.filter((e) => e.status === "in-progress").length}</div>
            <p className="text-xs text-muted-foreground">Tasks in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                workEntries.filter((e) => e.status === "completed" && e.date === new Date().toISOString().split("T")[0])
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Tasks completed today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Daily Work Log</CardTitle>
              <CardDescription>Track daily work activities and progress</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Edit Work Entry" : "Log Work Entry"}</DialogTitle>
                  <DialogDescription>
                    {editingEntry ? "Update work entry details" : "Record daily work activities"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hoursWorked">Hours Worked</Label>
                      <Input
                        id="hoursWorked"
                        type="number"
                        step="0.5"
                        value={newEntry.hoursWorked}
                        onChange={(e) => setNewEntry({ ...newEntry, hoursWorked: Number(e.target.value) })}
                        placeholder="8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Job</Label>
                    <Select
                      value={newEntry.jobTitle}
                      onValueChange={(value) => setNewEntry({ ...newEntry, jobTitle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select job" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bathroom Renovation">Bathroom Renovation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="worker">Worker</Label>
                    <Input
                      id="worker"
                      value={newEntry.worker}
                      onChange={(e) => setNewEntry({ ...newEntry, worker: e.target.value })}
                      placeholder="Worker name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task">Task</Label>
                    <Input
                      id="task"
                      value={newEntry.task}
                      onChange={(e) => setNewEntry({ ...newEntry, task: e.target.value })}
                      placeholder="e.g., Floor tile installation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newEntry.status}
                      onValueChange={(value) => setNewEntry({ ...newEntry, status: value as WorkEntry["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      placeholder="Work details and notes"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingEntry ? handleUpdateEntry : handleAddEntry}>
                    {editingEntry ? "Update Entry" : "Log Work"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell>{entry.jobTitle}</TableCell>
                  <TableCell>{entry.worker}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{entry.task}</div>
                      <div className="text-sm text-muted-foreground">{entry.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>{entry.hoursWorked}h</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.status === "completed"
                          ? "default"
                          : entry.status === "in-progress"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {entry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditEntry(entry)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Work Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this work entry for "{entry.task}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteEntry(entry.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
