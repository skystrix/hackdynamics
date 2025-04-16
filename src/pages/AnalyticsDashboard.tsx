
import React, { useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Download,
  TrendingUp,
  User,
  Users,
  Clock,
  Check,
  X,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { RecruitingMetrics } from "@/lib/types";

// Sample data for demonstration
const sampleTimeToHireData = [
  { name: "Software Engineer", days: 45 },
  { name: "Product Designer", days: 36 },
  { name: "Data Analyst", days: 28 },
  { name: "Marketing Specialist", days: 22 },
  { name: "Sales Representative", days: 18 },
];

const sampleApplicationSourceData = [
  { name: "LinkedIn", value: 45 },
  { name: "Company Website", value: 28 },
  { name: "Indeed", value: 15 },
  { name: "Referral", value: 12 },
];

const sampleTrendsData = [
  { month: "Jan", applications: 45, interviews: 20, offers: 5 },
  { month: "Feb", applications: 52, interviews: 25, offers: 8 },
  { month: "Mar", applications: 61, interviews: 30, offers: 12 },
  { month: "Apr", applications: 58, interviews: 28, offers: 10 },
  { month: "May", applications: 65, interviews: 32, offers: 15 },
  { month: "Jun", applications: 75, interviews: 40, offers: 20 },
];

const sampleMetrics: RecruitingMetrics = {
  timeToHire: 32, // days
  applicantCount: 356,
  interviewedCount: 87,
  offersMade: 24,
  offersAccepted: 18,
  dropOffRate: 25, // percentage
  sourceEfficiency: {
    "LinkedIn": 45,
    "Company Website": 28,
    "Indeed": 15,
    "Referral": 12
  }
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AnalyticsDashboard = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTab, setSelectedTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Recruiting Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your hiring performance and optimize your recruitment process
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{date ? format(date, "MMM dd, yyyy") : "Select date"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Key metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Average Time to Hire</p>
              <h3 className="text-3xl font-bold mt-1">{sampleMetrics.timeToHire} days</h3>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Users className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Application Conversion</p>
              <h3 className="text-3xl font-bold mt-1">
                {Math.round((sampleMetrics.interviewedCount / sampleMetrics.applicantCount) * 100)}%
              </h3>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <Check className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Offer Acceptance Rate</p>
              <h3 className="text-3xl font-bold mt-1">
                {Math.round((sampleMetrics.offersAccepted / sampleMetrics.offersMade) * 100)}%
              </h3>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex flex-col items-center pt-6">
              <X className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Candidate Drop-off Rate</p>
              <h3 className="text-3xl font-bold mt-1">{sampleMetrics.dropOffRate}%</h3>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="time-to-hire">Time to Hire</TabsTrigger>
            <TabsTrigger value="sources">Application Sources</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Time to Hire by Position</CardTitle>
                  <CardDescription>Average days from application to hire</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[300px] p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sampleTimeToHireData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="days" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Application Sources</CardTitle>
                  <CardDescription>Where candidates are coming from</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[300px] p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sampleApplicationSourceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {sampleApplicationSourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Recruitment Trends</CardTitle>
                <CardDescription>Applications, interviews and offers over time</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="applications" stroke="#8884d8" />
                      <Line type="monotone" dataKey="interviews" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="offers" stroke="#ffc658" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="time-to-hire">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Time to Hire Analysis</CardTitle>
                <CardDescription>Breakdown of hiring stages by position</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Position</TableHead>
                      <TableHead>Application to Screen</TableHead>
                      <TableHead>Screen to Interview</TableHead>
                      <TableHead>Interview to Offer</TableHead>
                      <TableHead>Offer to Acceptance</TableHead>
                      <TableHead>Total (Days)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Software Engineer</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>21</TableCell>
                      <TableCell>7</TableCell>
                      <TableCell className="font-semibold">45</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Product Designer</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>5</TableCell>
                      <TableCell className="font-semibold">36</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Data Analyst</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell>8</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>4</TableCell>
                      <TableCell className="font-semibold">28</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Application Source Analysis</CardTitle>
                <CardDescription>Performance metrics by source</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead>Interviews</TableHead>
                      <TableHead>Offers</TableHead>
                      <TableHead>Conversion Rate</TableHead>
                      <TableHead>Cost Per Hire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">LinkedIn</TableCell>
                      <TableCell>160</TableCell>
                      <TableCell>40</TableCell>
                      <TableCell>8</TableCell>
                      <TableCell>5%</TableCell>
                      <TableCell>$1,250</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Company Website</TableCell>
                      <TableCell>98</TableCell>
                      <TableCell>25</TableCell>
                      <TableCell>6</TableCell>
                      <TableCell>6.1%</TableCell>
                      <TableCell>$850</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Indeed</TableCell>
                      <TableCell>54</TableCell>
                      <TableCell>12</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>5.6%</TableCell>
                      <TableCell>$1,100</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Referrals</TableCell>
                      <TableCell>44</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell>6.8%</TableCell>
                      <TableCell>$500</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Hiring Trends Over Time</CardTitle>
                <CardDescription>6-month recruitment performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="applications" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line yAxisId="left" type="monotone" dataKey="interviews" stroke="#82ca9d" />
                      <Line yAxisId="right" type="monotone" dataKey="offers" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default AnalyticsDashboard;
