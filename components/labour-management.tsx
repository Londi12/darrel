"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Edit, Trash2, Users, Phone, Mail } from "lucide-react"

interface Worker {
  id: number
  name: string
  role: string
  phone: string
  email: string
  hourlyRate: number
  status: "active" | "inactive" | "on-leave"
  skills: string[]
}

export function LabourManagement() {
  const { toast } = useToast()

  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: 1,
      name: "Mike Johnson",
      role: "Site Foreman",
      phone: "+27 82 123 4567",
      email: "mike@construction.com",
      hourlyRate: 350,
      status: "active",
      skills: ["Demolition", "Project Management", "Safety"],
    },
    {
      id: 2,
      name: "Sarah Wilson",
      role: "Tile Specialist",
      phone: "+27 83 234 5678",
      email: "sarah@construction.com",
      hourlyRate: 280,
      status: "active",
      skills: ["Tiling", "Floor Installation", "Waterproofing"],
    },
    {
      id: 3,
      name: "David Brown",
      role: "General Laborer",
      phone: "+27 84 345 6789",
      email: "david@construction.com",
      hourlyRate: 180,
      status: "active",
      skills: ["General Labor", "Material Handling", "Cleanup"],
    },
    {
      id: 4,
      name: "Lisa Chen",
      role: "Electrician",
      phone: "+27 85 456 7890",
      email: "lisa@construction.com",
      hourlyRate: 420,
      status: "active",
      skills: ["Electrical", "Lighting", "Wiring"],
    },
  ])

  const [showDialog, setShowDialog] = useState(false)
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null)
  const [newWorker, setNewWorker] = useState<Partial<Worker>>({
    name: "",
    role: "",
    phone: "",
    email: "",
    hourlyRate: 0,
    status: "active",
    skills: [],
  })

  const handleAddWorker = () => {
    if (newWorker.name && newWorker.role) {
      const worker: Worker = {
        id: Math.max(...workers.map((w) => w.id), 0) + 1,
        name: newWorker.name || "",
        role: newWorker.role || "",
        phone: newWorker.phone || "",
        email: newWorker.email || "",
        hourlyRate: newWorker.hourlyRate || 0,
        status: (newWorker.status as Worker["status"]) || "active",
        skills: newWorker.skills || [],
      }
      setWorkers([...workers, worker])
      resetDialog()
      toast({
        title: "Worker Added",
        description: `${worker.name} has been successfully added to the team.`,
      })
    }
  }

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker)
    setNewWorker({ ...worker })
    setShowDialog(true)
  }

  const handleUpdateWorker = () => {
    if (editingWorker && newWorker.name && newWorker.role) {
      const updatedWorker: Worker = {
        ...editingWorker,
        name: newWorker.name || "",
        role: newWorker.role || "",
        phone: newWorker.phone || "",
        email: newWorker.email || "",
        hourlyRate: newWorker.hourlyRate || 0,
        status: (newWorker.status as Worker["status"]) || "active",
        skills: newWorker.skills || [],
      }
      setWorkers(workers.map((w) => (w.id === editingWorker.id ? updatedWorker : w)))
      resetDialog()
      toast({
        title: "Worker Updated",
        description: `${updatedWorker.name}'s information has been successfully updated.`,
      })
    }
  }

  const handleDeleteWorker = (workerId: number) => {
    const worker = workers.find((w) => w.id === workerId)
    if (worker) {
      setWorkers(workers.filter((w) => w.id !== workerId))
      toast({
        title: "Worker Deleted",
        description: `${worker.name} has been successfully removed from the team.`,
        variant: "destructive",
      })
    }
  }

  const resetDialog = () => {
    setEditingWorker(null)
    setNewWorker({
      name: "",
      role: "",
      phone: "",
      email: "",
      hourlyRate: 0,
      status: "active",
      skills: [],
    })
    setShowDialog(false)
  }

  const activeWorkers = workers.filter((w) => w.status === "active").length
  const totalPayroll = workers.filter((w) => w.status === "active").reduce((sum, w) => sum + w.hourlyRate * 8, 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkers}</div>
            <p className="text-xs text-muted-foreground">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Payroll</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per day (8 hours)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R
              {activeWorkers > 0
                ? Math.round(
                    workers.filter((w) => w.status === "active").reduce((sum, w) => sum + w.hourlyRate, 0) /
                      activeWorkers,
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per hour</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Labour Management</CardTitle>
              <CardDescription>Manage construction workers and their assignments</CardDescription>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingWorker(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingWorker ? "Edit Worker" : "Add New Worker"}</DialogTitle>
                  <DialogDescription>
                    {editingWorker ? "Update worker details" : "Add a new worker to the team"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newWorker.name}
                        onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={newWorker.role}
                        onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                        placeholder="Site Foreman"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newWorker.phone}
                        onChange={(e) => setNewWorker({ ...newWorker, phone: e.target.value })}
                        placeholder="+27 82 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newWorker.email}
                        onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                        placeholder="john@construction.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Hourly Rate (R)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={newWorker.hourlyRate}
                        onChange={(e) => setNewWorker({ ...newWorker, hourlyRate: Number(e.target.value) })}
                        placeholder="250"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newWorker.status}
                        onValueChange={(value) => setNewWorker({ ...newWorker, status: value as Worker["status"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="on-leave">On Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma separated)</Label>
                    <Input
                      id="skills"
                      value={newWorker.skills?.join(", ")}
                      onChange={(e) =>
                        setNewWorker({ ...newWorker, skills: e.target.value.split(", ").filter((s) => s.trim()) })
                      }
                      placeholder="Tiling, Plumbing, Electrical"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingWorker ? handleUpdateWorker : handleAddWorker}>
                    {editingWorker ? "Update Worker" : "Add Worker"}
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
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell>{worker.role}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="mr-1 h-3 w-3" />
                        {worker.phone}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="mr-1 h-3 w-3" />
                        {worker.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>R{worker.hourlyRate}/hr</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        worker.status === "active" ? "default" : worker.status === "on-leave" ? "secondary" : "outline"
                      }
                    >
                      {worker.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {worker.skills.slice(0, 2).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {worker.skills.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{worker.skills.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditWorker(worker)}>
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
                            <AlertDialogTitle>Delete Worker</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{worker.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteWorker(worker.id)}>Delete</AlertDialogAction>
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
