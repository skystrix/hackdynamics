
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { BriefcaseIcon, LightbulbIcon, SparklesIcon, BuildingIcon, CheckIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";

// Define valid job types to match the expected types in the Job interface
type JobType = "Remote" | "Full-time" | "Part-time" | "Contract" | "Freelance";

const PostJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  
  // Use protected route hook to redirect if not authenticated or not a recruiter
  const isAuthenticated = useProtectedRoute("/login", "recruiter");
  
  // Fetch user profile from Supabase for additional verification
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }
        
        if (data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error processing profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 container flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null; // This will be handled by useProtectedRoute
  }
  
  console.log("Current user in PostJob:", user); // Debug user object
  console.log("Profile data:", profile); // Debug profile data
  
  // Form state
  const [jobData, setJobData] = useState({
    title: "",
    type: "Full-time" as JobType,
    location: "",
    salaryMin: "",
    salaryMax: "",
    skills: "",
    company: user.company || profile?.company || "",
    website: "",
    description: "",
    requirements: "",
    benefits: "",
    email: "",
    deadline: ""
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setJobData({
      ...jobData,
      [e.target.id]: e.target.value
    });
  };
  
  const handleSelectChange = (field: string, value: string) => {
    if (field === "type") {
      // Ensure job type is one of the allowed values
      const validType = ["Full-time", "Part-time", "Remote", "Contract", "Freelance"].includes(value) 
        ? value as JobType 
        : "Full-time";
        
      setJobData({
        ...jobData,
        [field]: validType
      });
    } else {
      setJobData({
        ...jobData,
        [field]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user exists and has an ID
    if (!user) {
      toast.error("You must be logged in to post a job");
      return;
    }
    
    // Get recruiter ID with multiple fallbacks
    const recruiterId = user.id || localStorage.getItem("recruiterId");
    
    // Better error handling
    if (!recruiterId) {
      console.error("No user ID found:", user);
      toast.error("Unable to identify recruiter account. Please try logging in again.");
      // Take user back to login page after 2 seconds
      setTimeout(() => navigate("/login"), 2000);
      return;
    }
    
    setIsSubmitting(true);
    console.log("Posting job with recruiter_id:", recruiterId);
    
    // Format salary if both min and max are provided
    const formatSalary = () => {
      if (jobData.salaryMin && jobData.salaryMax) {
        return `$${jobData.salaryMin} - $${jobData.salaryMax}`;
      } else if (jobData.salaryMin) {
        return `From $${jobData.salaryMin}`;
      } else if (jobData.salaryMax) {
        return `Up to $${jobData.salaryMax}`;
      }
      return undefined;
    };
    
    // Convert comma-separated strings to arrays
    const skillsArray = jobData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
      
    const requirementsArray = jobData.requirements
      .split('\n')
      .map(req => req.trim())
      .filter(req => req.length > 0);
      
    const benefitsArray = jobData.benefits
      .split('\n')
      .map(benefit => benefit.trim())
      .filter(benefit => benefit.length > 0);
    
    try {
      // Insert job into Supabase
      const { data, error } = await supabase.from('jobs').insert({
        title: jobData.title,
        company: jobData.company,
        location: jobData.location,
        type: jobData.type,
        salary: formatSalary(),
        description: jobData.description,
        skills: skillsArray,
        recruiter_id: recruiterId,
        requirements: requirementsArray.length ? requirementsArray : null,
        benefits: benefitsArray.length ? benefitsArray : null,
        deadline: jobData.deadline || null,
        is_active: true,
      }).select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      toast.success("Job posted successfully!", {
        description: "Your job listing is now live.",
      });
      
      navigate("/recruiter-dashboard");
    } catch (error) {
      console.error("Error posting job:", error);
      toast.error("Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-gradient-to-b from-accent/50 to-background pt-10 pb-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-2 text-center">Post a Job</h1>
          <p className="text-muted-foreground text-center max-w-lg mx-auto">
            Reach thousands of talented software engineers and find the perfect candidate for your team.
          </p>
        </div>
      </div>
      
      <main className="flex-1 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BriefcaseIcon className="h-5 w-5" />
                    Job Details
                  </CardTitle>
                  <CardDescription>
                    Provide the basic information about the job position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Senior Frontend Developer" 
                      value={jobData.title}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="type">Job Type</Label>
                      <Select 
                        value={jobData.type} 
                        onValueChange={(value) => handleSelectChange("type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                          <SelectItem value="Remote">Remote</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        placeholder="e.g. San Francisco, CA (Remote)" 
                        value={jobData.location}
                        onChange={handleChange}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="salaryMin">Salary Range (Min)</Label>
                      <Input 
                        id="salaryMin" 
                        type="number" 
                        placeholder="e.g. 80000" 
                        value={jobData.salaryMin}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salaryMax">Salary Range (Max)</Label>
                      <Input 
                        id="salaryMax" 
                        type="number" 
                        placeholder="e.g. 120000" 
                        value={jobData.salaryMax}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skills">Required Skills (comma separated)</Label>
                    <Input 
                      id="skills" 
                      placeholder="e.g. React, TypeScript, Node.js" 
                      value={jobData.skills}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BuildingIcon className="h-5 w-5" />
                    Company Information
                  </CardTitle>
                  <CardDescription>
                    Tell candidates about your company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input 
                      id="company" 
                      placeholder="e.g. TechCorp Inc." 
                      value={jobData.company}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website</Label>
                    <Input 
                      id="website" 
                      type="url" 
                      placeholder="e.g. https://techcorp.com" 
                      value={jobData.website}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SparklesIcon className="h-5 w-5" />
                    Job Description
                  </CardTitle>
                  <CardDescription>
                    Provide detailed information about the job position
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="description">Job Description</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Describe the job role, responsibilities, and requirements..." 
                      className="min-h-32"
                      value={jobData.description}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="requirements">Requirements (one per line)</Label>
                    <Textarea 
                      id="requirements" 
                      placeholder="List the qualifications, skills, and experience required..." 
                      className="min-h-32"
                      value={jobData.requirements}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="benefits">Benefits (one per line)</Label>
                    <Textarea 
                      id="benefits" 
                      placeholder="List the benefits, perks, and advantages..." 
                      className="min-h-24"
                      value={jobData.benefits}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LightbulbIcon className="h-5 w-5" />
                    Application Settings
                  </CardTitle>
                  <CardDescription>
                    Set up how candidates can apply for this job
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Application Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="e.g. careers@techcorp.com" 
                      value={jobData.email}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Application Deadline (optional)</Label>
                    <Input 
                      id="deadline" 
                      type="date" 
                      value={jobData.deadline}
                      onChange={handleChange}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button type="button" variant="outline">Save as Draft</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Posting..." : "Post Job"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Posting Tips</CardTitle>
                <CardDescription>
                  Tips to create an effective job posting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="font-medium text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Be specific with job titles</h4>
                    <p className="text-sm text-muted-foreground">
                      Use specific job titles that reflect the role's seniority and specialization.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="font-medium text-primary">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Include salary information</h4>
                    <p className="text-sm text-muted-foreground">
                      Job posts with salary ranges get 30% more applicants.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="font-medium text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Highlight benefits and perks</h4>
                    <p className="text-sm text-muted-foreground">
                      Don't forget to mention unique benefits your company offers.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="font-medium text-primary">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Describe your company culture</h4>
                    <p className="text-sm text-muted-foreground">
                      Help candidates understand if they'd be a good cultural fit.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Standard Job Posting</span>
                  <span className="font-medium">$299</span>
                </div>
                <Separator />
                <div className="py-2">
                  <h4 className="font-medium mb-2">What's included:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                      <span>30-day listing</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                      <span>Featured in our newsletter</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                      <span>Social media promotion</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                      <span>Application management tools</span>
                    </li>
                  </ul>
                </div>
                <Link to="/pricing">
                  <Button variant="link" className="p-0 h-auto">
                    View all pricing options
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostJob;
