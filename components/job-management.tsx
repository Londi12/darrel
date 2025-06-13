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
import { Plus, Edit, Trash2, MapPin, Calendar, DollarSign, Clock } from "lucide-react"
import { DailyWorkLogDialog } from "./daily-work-log"
import { JobDetails } from "./job-details"

interface InvoiceItem {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  category: string;
}

interface Invoice {
  id: string;
  jobId: string;
  date: string;
  items: InvoiceItem[];
  total: number;
  company: string;
  originalDocument?: string; // Base64 PDF or original parsed content
  type: "original" | "generated"; // To distinguish between initial and auto-generated invoices
}

interface WorkCost {
  materials: { item: string; cost: number; quantity: number }[];
  labor: { worker: string; hours: number; rate: number }[];
  equipment: { item: string; cost: number; hours?: number }[];
}

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
  costs: WorkCost;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  assignedDate: string;
  totalHoursWorked: number;
}

interface Job {
  id: string;
  title: string;
  client: string;
  location: string;
  status: string;
  budget: number;
  startDate: string;
  endDate: string;
  description: string;
  team: TeamMember[];
  invoices: Invoice[];
  completedValue: number; // Value of completed work
  actualCost: number; // Total costs incurred
  profitMargin: number; // Calculated profit margin
}

interface JobCard {
  id: string
  jobId: string
  title: string
  description: string
  assignedTo: string
  status: "pending" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  dueDate: string
}

export function JobManagement() {
  const { toast } = useToast()
  
  const [jobs, setJobs] = useState<Job[]>([])
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [showJobDialog, setShowJobDialog] = useState(false)
  const [showJobCardDialog, setShowJobCardDialog] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editingJobCard, setEditingJobCard] = useState<JobCard | null>(null)

  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: "",
    client: "",
    location: "",
    status: "active",
    budget: 0,
    startDate: "",
    endDate: "",
    description: "",
  })

  const [newJobCard, setNewJobCard] = useState<Partial<JobCard>>({
    jobId: "",
    title: "",
    description: "",
    assignedTo: "",
    status: "pending",
    priority: "medium",
    dueDate: "",
  })

  // Load jobs and work logs from localStorage when component mounts
  useEffect(() => {
    try {
      const savedJobs = localStorage.getItem('jobs');
      const savedWorkLogs = localStorage.getItem('workLogs');
      const savedJobCards = localStorage.getItem('jobCards');
      
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs);
        // Ensure all required properties are initialized
        const initializedJobs = parsedJobs.map((job: Job) => ({
          ...job,
          team: job.team || [],
          invoices: job.invoices || [],
          completedValue: job.completedValue || 0,
          actualCost: job.actualCost || 0,
          profitMargin: job.profitMargin || 0
        }));
        console.log('Loaded jobs:', initializedJobs);
        setJobs(initializedJobs);
        // Save back to localStorage to ensure consistency
        localStorage.setItem('jobs', JSON.stringify(initializedJobs));
      }
      
      if (savedWorkLogs) {
        const parsedWorkLogs = JSON.parse(savedWorkLogs);
        setWorkLogs(parsedWorkLogs);
      }

      if (savedJobCards) {
        const parsedJobCards = JSON.parse(savedJobCards);
        setJobCards(parsedJobCards);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data.",
      });
    }
  }, []);

  const handleAddJob = () => {
    if (newJob.title && newJob.client) {
      const job: Job = {
        id: Math.max(...jobs.map((j) => Number(j.id)), 0) + 1 + "",
        title: newJob.title || "",
        client: newJob.client || "",
        location: newJob.location || "",
        status: (newJob.status as Job["status"]) || "active",
        budget: newJob.budget || 0,
        startDate: newJob.startDate || "",
        endDate: newJob.endDate || "",
        description: newJob.description || "",
        team: [],
        invoices: [],
        completedValue: 0,
        actualCost: 0,
        profitMargin: 0,
      }
      setJobs([...jobs, job])
      setNewJob({
        title: "",
        client: "",
        location: "",
        status: "active",
        budget: 0,
        startDate: "",
        endDate: "",
        description: "",
      })
      setShowJobDialog(false)
      toast({
        title: "Job Created",
        description: `"${job.title}" has been successfully created.`,
      })
    }
  }

  const handleDeleteJob = (jobId: string) => {
    try {
      const savedJobs = localStorage.getItem('jobs')
      if (savedJobs) {
        const parsedJobs = JSON.parse(savedJobs)
        const updatedJobs = parsedJobs.filter((job: Job) => job.id !== jobId)
        localStorage.setItem('jobs', JSON.stringify(updatedJobs))
        setJobs(updatedJobs)
        toast({
          title: "Success",
          description: "Job deleted successfully.",
        })
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job.",
      })
    }
  }

  const handleEditJob = (job: Job, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingJob(job);
    setNewJob({
      title: job.title || "",
      client: job.client || "",
      location: job.location || "",
      status: job.status || "active",
      budget: job.budget || 0,
      startDate: job.startDate || "",
      endDate: job.endDate || "",
      description: job.description || "",
    });
    setShowJobDialog(true);
  };

  const handleSaveJob = () => {
    if (!newJob.title || !newJob.client) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    try {
      const savedJobs = localStorage.getItem('jobs') || '[]';
      const parsedJobs = JSON.parse(savedJobs);
      
      if (editingJob) {
        // Update existing job
        const updatedJobs = parsedJobs.map((j: Job) => 
          j.id === editingJob.id ? { 
            ...j,  // Preserve existing properties
            ...newJob,  // Update with new values
            team: j.team || [],  // Ensure team array exists
            invoices: j.invoices || [],  // Ensure invoices array exists
            completedValue: j.completedValue || 0,  // Ensure numeric values exist
            actualCost: j.actualCost || 0,
            profitMargin: j.profitMargin || 0
          } : j
        );
        localStorage.setItem('jobs', JSON.stringify(updatedJobs));
        setJobs(updatedJobs);
      }

      setShowJobDialog(false);
      setEditingJob(null);
      setNewJob({
        title: "",
        client: "",
        location: "",
        status: "active",
        budget: 0,
        startDate: "",
        endDate: "",
        description: "",
      });

      toast({
        title: "Success",
        description: `Job ${editingJob ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save job.",
      });
    }
  };

  const handleAddJobCard = () => {
    if (!newJobCard.jobId || !newJobCard.title) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    try {
      const jobCard: JobCard = {
        id: Date.now().toString(),
        jobId: newJobCard.jobId,
        title: newJobCard.title,
        description: newJobCard.description || "",
        assignedTo: newJobCard.assignedTo || "",
        status: newJobCard.status || "pending",
        priority: newJobCard.priority || "medium",
        dueDate: newJobCard.dueDate || "",
      }

      const updatedJobCards = [...jobCards, jobCard]
      localStorage.setItem('jobCards', JSON.stringify(updatedJobCards))
      setJobCards(updatedJobCards)
      setShowJobCardDialog(false)
      setNewJobCard({
        jobId: "",
        title: "",
        description: "",
        assignedTo: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
      })

      toast({
        title: "Success",
        description: "Job card created successfully.",
      })
    } catch (error) {
      console.error('Error creating job card:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create job card.",
      })
    }
  }

  const handleEditJobCard = (jobCard: JobCard) => {
    setEditingJobCard(jobCard)
    setNewJobCard({
      jobId: jobCard.jobId,
      title: jobCard.title,
      description: jobCard.description,
      assignedTo: jobCard.assignedTo,
      status: jobCard.status,
      priority: jobCard.priority,
      dueDate: jobCard.dueDate,
    })
    setShowJobCardDialog(true)
  }

  const handleUpdateJobCard = () => {
    if (!newJobCard.jobId || !newJobCard.title || !editingJobCard) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields.",
      })
      return
    }

    try {
      const updatedJobCard: JobCard = {
        id: editingJobCard.id,
        jobId: newJobCard.jobId,
        title: newJobCard.title,
        description: newJobCard.description || "",
        assignedTo: newJobCard.assignedTo || "",
        status: newJobCard.status as "pending" | "in-progress" | "completed",
        priority: newJobCard.priority as "low" | "medium" | "high",
        dueDate: newJobCard.dueDate || "",
      }

      const updatedJobCards = jobCards.map(card => 
        card.id === editingJobCard.id ? updatedJobCard : card
      )

      localStorage.setItem('jobCards', JSON.stringify(updatedJobCards))
      setJobCards(updatedJobCards)
      setShowJobCardDialog(false)
      setEditingJobCard(null)
      setNewJobCard({
        jobId: "",
        title: "",
        description: "",
        assignedTo: "",
        status: "pending",
        priority: "medium",
        dueDate: "",
      })

      toast({
        title: "Success",
        description: "Job card updated successfully.",
      })
    } catch (error) {
      console.error('Error updating job card:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update job card.",
      })
    }
  }

  const handleDeleteJobCard = (cardId: string) => {
    try {
      const updatedJobCards = jobCards.filter(card => card.id !== cardId)
      localStorage.setItem('jobCards', JSON.stringify(updatedJobCards))
      setJobCards(updatedJobCards)
      toast({
        title: "Success",
        description: "Job card deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting job card:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete job card.",
      })
    }
  }

  const resetJobCardForm = () => {
    setNewJobCard({
      jobId: "",
      title: "",
      description: "",
      assignedTo: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
    })
  }

  const resetJobDialog = () => {
    setEditingJob(null)
    setNewJob({
      title: "",
      client: "",
      location: "",
      status: "active",
      budget: 0,
      startDate: "",
      endDate: "",
      description: "",
    })
    setShowJobDialog(false)
  }

  const resetJobCardDialog = () => {
    setEditingJobCard(null)
    setNewJobCard({
      jobId: "",
      title: "",
      description: "",
      assignedTo: "",
      status: "pending",
      priority: "medium",
      dueDate: "",
    })
    setShowJobCardDialog(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Job Management</CardTitle>
              <CardDescription>Manage construction projects and job assignments</CardDescription>
            </div>
            <Dialog open={showJobDialog} onOpenChange={setShowJobDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingJob(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingJob ? "Edit Job" : "Add New Job"}</DialogTitle>
                  <DialogDescription>
                    {editingJob ? "Update job details" : "Create a new construction job"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Job Title</Label>
                      <Input
                        id="title"
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        placeholder="e.g., Bathroom Renovation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client">Client</Label>
                      <Input
                        id="client"
                        value={newJob.client}
                        onChange={(e) => setNewJob({ ...newJob, client: e.target.value })}
                        placeholder="Client name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="Job site address"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newJob.status}
                        onValueChange={(value) => setNewJob({ ...newJob, status: value as Job["status"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">Budget (R)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={newJob.budget}
                        onChange={(e) => setNewJob({ ...newJob, budget: Number(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={newJob.startDate}
                        onChange={(e) => setNewJob({ ...newJob, startDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newJob.endDate}
                      onChange={(e) => setNewJob({ ...newJob, endDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Job description and requirements"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetJobDialog}>
                    Cancel
                  </Button>
                  <Button onClick={editingJob ? handleSaveJob : handleAddJob}>
                    {editingJob ? "Update Job" : "Add Job"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <JobCard 
                key={job.id} 
                job={job} 
                onEdit={handleEditJob} 
                onDelete={handleDeleteJob}
                onUpdate={(updatedJob) => {
                  setJobs((prevJobs) => {
                    const newJobs = prevJobs.map(j => j.id === updatedJob.id ? { ...j, ...updatedJob } : j);
                    localStorage.setItem('jobs', JSON.stringify(newJobs));
                    return newJobs;
                  });
                }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Job Cards</CardTitle>
              <CardDescription>Task assignments and progress tracking</CardDescription>
            </div>
            <Dialog open={showJobCardDialog} onOpenChange={setShowJobCardDialog}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingJobCard(null)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Job Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingJobCard ? "Edit Job Card" : "Add New Job Card"}</DialogTitle>
                  <DialogDescription>
                    {editingJobCard ? "Update job card details" : "Create a new task assignment"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="jobId">Job</Label>
                    <Select
                      value={newJobCard.jobId}
                      onValueChange={(value) => setNewJobCard({ ...newJobCard, jobId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardTitle">Task Title</Label>
                    <Input
                      id="cardTitle"
                      value={newJobCard.title}
                      onChange={(e) => setNewJobCard({ ...newJobCard, title: e.target.value })}
                      placeholder="e.g., Install floor tiles"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cardDescription">Description</Label>
                    <Textarea
                      id="cardDescription"
                      value={newJobCard.description}
                      onChange={(e) => setNewJobCard({ ...newJobCard, description: e.target.value })}
                      placeholder="Task details and requirements"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Input
                        id="assignedTo"
                        value={newJobCard.assignedTo}
                        onChange={(e) => setNewJobCard({ ...newJobCard, assignedTo: e.target.value })}
                        placeholder="Worker name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newJobCard.status}
                        onValueChange={(value) => setNewJobCard({ ...newJobCard, status: value as "pending" | "in-progress" | "completed" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={newJobCard.priority}
                        onValueChange={(value) => setNewJobCard({ ...newJobCard, priority: value as "low" | "medium" | "high" })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={newJobCard.dueDate}
                        onChange={(e) => setNewJobCard({ ...newJobCard, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowJobCardDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingJobCard ? handleUpdateJobCard : handleAddJobCard}>
                    {editingJobCard ? "Update Job Card" : "Add Job Card"}
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
                <TableHead>Task</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobCards.map((jobCard) => {
                const job = jobs.find(j => j.id === jobCard.jobId)
                return (
                  <TableRow key={jobCard.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{jobCard.title}</div>
                        <div className="text-sm text-muted-foreground">{jobCard.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{job?.title || "Unknown Job"}</TableCell>
                    <TableCell>{jobCard.assignedTo}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          jobCard.status === "completed"
                            ? "default"
                            : jobCard.status === "in-progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {jobCard.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          jobCard.priority === "high"
                            ? "destructive"
                            : jobCard.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {jobCard.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{jobCard.dueDate}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditJobCard(jobCard)}>
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
                              <AlertDialogTitle>Delete Job Card</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this job card? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteJobCard(jobCard.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


    </div>
  )
}

function JobCard({ 
  job, 
  onEdit, 
  onDelete,
  onUpdate
}: { 
  job: Job; 
  onEdit: (job: Job) => void; 
  onDelete: (jobId: string) => void;
  onUpdate: (updatedJob: Job) => void;
}) {
  const [showWorkLogDialog, setShowWorkLogDialog] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{job.title}</CardTitle>
            <CardDescription>{job.client}</CardDescription>
          </div>
          <Badge variant={job.status === "active" ? "default" : "secondary"}>
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>R{job.budget.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowWorkLogDialog(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Log Work
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(job)}>
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
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the job
                    and all its data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(job.id)}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <JobDetails job={job} onUpdate={onUpdate} />
        </div>
      </CardContent>

      <DailyWorkLogDialog
        isOpen={showWorkLogDialog}
        onClose={() => setShowWorkLogDialog(false)}
        job={job}
        onWorkLogged={() => {
          setShowWorkLogDialog(false);
        }}
      />
    </Card>
  );
}

function WorkLogsList({ jobId }: { jobId: string }) {
  const [workLogs, setWorkLogs] = useState<WorkEntry[]>([]);

  useEffect(() => {
    const savedWorkLogs = localStorage.getItem('workLogs');
    if (savedWorkLogs) {
      const parsedWorkLogs = JSON.parse(savedWorkLogs);
      const jobWorkLogs = parsedWorkLogs.filter((log: WorkEntry) => log.jobId === jobId);
      setWorkLogs(jobWorkLogs);
    }
  }, [jobId]);

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2">Recent Work Logs</h4>
      <div className="space-y-2">
        {workLogs.length > 0 ? (
          workLogs
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 3)
            .map((log) => (
              <div key={log.id} className="text-sm">
                <Badge
                  variant={
                    log.status === "completed"
                      ? "default"
                      : log.status === "in-progress"
                        ? "secondary"
                        : "destructive"
                  }
                  className="mr-2"
                >
                  {log.status}
                </Badge>
                {log.task} - {log.hoursWorked}h ({new Date(log.date).toLocaleDateString()})
              </div>
            ))
        ) : (
          <p className="text-sm text-muted-foreground">No work logs yet</p>
        )}
      </div>
    </div>
  );
}
