"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, DollarSign, Users, Briefcase, AlertTriangle } from "lucide-react"

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
  invoice?: {
    items: any[];
    total: number;
    company: string;
  };
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
}

export function DashboardOverview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkEntry[]>([]);
  
  useEffect(() => {
    // Load jobs from localStorage
    const savedJobs = localStorage.getItem('jobs');
    const savedWorkLogs = localStorage.getItem('workLogs');
    
    if (savedJobs) {
      const parsedJobs = JSON.parse(savedJobs);
      setJobs(parsedJobs);
    }

    if (savedWorkLogs) {
      const parsedWorkLogs = JSON.parse(savedWorkLogs);
      setWorkLogs(parsedWorkLogs);
    }
  }, []);

  // Calculate dashboard stats
  const activeJobs = jobs.filter(job => job.status === 'active');
  const totalBudget = jobs.reduce((sum, job) => sum + job.budget, 0);
  
  // Calculate days remaining for active jobs
  const calculateDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDaysRemaining = activeJobs
    .map(job => calculateDaysRemaining(job.endDate))
    .filter(days => days > 0)
    .reduce((a, b) => a + b, 0);

  const stats = [
    {
      title: "Active Projects",
      value: activeJobs.length.toString(),
      description: activeJobs.map(job => job.title).join(", ") || "No active projects",
      icon: Briefcase,
      color: "text-blue-600",
    },
    {
      title: "Total Budget",
      value: `R${totalBudget.toLocaleString()}`,
      description: "Current projects value",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Active Jobs",
      value: jobs.length.toString(),
      description: "Total jobs",
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Days Remaining",
      value: totalDaysRemaining.toString(),
      description: "Until completion",
      icon: CalendarDays,
      color: "text-orange-600",
    },
  ]

  // Format work logs for recent activities
  const recentActivities = workLogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(log => {
      const job = jobs.find(j => j.id === log.jobId);
      const timeAgo = getTimeAgo(new Date(log.date));
      
      return {
        id: log.id,
        activity: `${log.task} - ${job?.title || 'Unknown Job'}`,
        description: log.description,
        time: timeAgo,
        status: log.status,
      };
    });

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
            <CardDescription>Bathroom Renovation - 123 Main Street</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>25%</span>
              </div>
              <Progress value={25} className="h-2" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Demolition</span>
                <Badge variant="default">Completed</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Floor Installation</span>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wall Tiling</span>
                <Badge variant="outline">Pending</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Fixture Installation</span>
                <Badge variant="outline">Pending</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest project updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.activity}</p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant={activity.status === "completed" ? "default" : "secondary"}>
                    {activity.status === "completed" ? "Done" : "Active"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-yellow-600" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800">Material Delivery Scheduled</p>
                <p className="text-sm text-yellow-600">Wall tiles arriving tomorrow at 9:00 AM</p>
              </div>
              <Badge variant="outline">Tomorrow</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-800">Inspection Required</p>
                <p className="text-sm text-blue-600">Electrical work needs inspection before proceeding</p>
              </div>
              <Badge variant="outline">Pending</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
