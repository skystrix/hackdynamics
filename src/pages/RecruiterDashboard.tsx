import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BriefcaseIcon,
  PlusCircleIcon,
  UserIcon,
} from "lucide-react";
import { Job } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

const RecruiterDashboard = () => {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [inactiveJobs, setInactiveJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  // Protect route for recruiters only
  const isAuthenticated = useProtectedRoute("/login", "recruiter");
  
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('recruiter_id', user.id)
          .order('posted_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching jobs:", error);
          return;
        }
        
        const formattedJobs = data.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          logo: job.logo || '',
          location: job.location,
          type: job.type as "Remote" | "Full-time" | "Part-time" | "Contract" | "Freelance",
          salary: job.salary || '',
          description: job.description,
          skills: job.skills,
          postedAt: new Date(job.posted_at).toISOString(),
          deadline: job.deadline ? new Date(job.deadline).toISOString() : undefined,
          applicationCount: job.application_count || 0,
          benefits: job.benefits || [],
          requirements: job.requirements || [],
          isActive: job.is_active
        }));
        
        setActiveJobs(formattedJobs.filter(job => job.isActive));
        setInactiveJobs(formattedJobs.filter(job => !job.isActive));
      } catch (err) {
        console.error("Error processing jobs:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchJobs();
    }
  }, [user]);
  
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="container py-8 flex-1">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
          <Link to="/post-job">
            <Button>
              <PlusCircleIcon className="mr-2 h-4 w-4" />
              Post a Job
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Jobs</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Jobs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <p>Loading jobs...</p>
            ) : activeJobs.length > 0 ? (
              activeJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {job.company} - {job.location}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <p>Posted on: {new Date(job.postedAt).toLocaleDateString()}</p>
                    <Button variant="outline">View Details</Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p>No active jobs found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="inactive" className="space-y-4">
            {isLoading ? (
              <p>Loading jobs...</p>
            ) : inactiveJobs.length > 0 ? (
              inactiveJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {job.company} - {job.location}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <p>Posted on: {new Date(job.postedAt).toLocaleDateString()}</p>
                    <Button variant="outline">View Details</Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent>
                  <p>No inactive jobs found.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default RecruiterDashboard;
