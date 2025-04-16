
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getJobById } from "@/data/jobs";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { 
  ArrowLeftIcon, 
  BriefcaseIcon, 
  FileIcon, 
  UserIcon, 
  MapPinIcon,
  DollarSignIcon,
  SendIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Define the application schema with Zod - only cover letter is required
const applicationSchema = z.object({
  coverLetter: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const ApplyJob = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const job = id ? getJobById(id) : null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
    },
  });
  
  if (!job) {
    navigate("/");
    return null;
  }

  if (!user) {
    navigate("/login");
    return null;
  }
  
  const onSubmit = (data: ApplicationFormValues) => {
    setIsSubmitting(true);
    
    console.log("Application submitted:", data);
    
    // Store application data in localStorage
    try {
      // Get existing applications or initialize empty array
      const existingApplications = JSON.parse(localStorage.getItem("jobApplications") || "[]");
      
      // Create new application object with user profile data
      const newApplication = {
        id: `app-${Date.now()}`,
        jobId: id,
        jobTitle: job.title,
        company: job.company,
        appliedAt: new Date().toISOString(),
        status: "pending",
        // Use the user's profile data
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        linkedin: user.linkedin || "",
        portfolio: user.portfolio || "",
        experience: user.experience || "",
        resumeName: user.resumeName || "resume.pdf",
        salary: user.expectedSalary || "",
        startDate: user.availableFrom || new Date().toISOString(),
        // Only the cover letter comes from the form
        coverLetter: data.coverLetter,
      };
      
      // Add new application to array
      existingApplications.push(newApplication);
      
      // Save updated applications array
      localStorage.setItem("jobApplications", JSON.stringify(existingApplications));
      
      // Success message and redirect
      setTimeout(() => {
        toast.success("Application submitted successfully!", {
          description: "We've sent a confirmation to your email.",
        });
        setIsSubmitting(false);
        navigate(`/jobs/${id}`);
      }, 1500);
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again later.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-1 container py-8">
        <Link to={`/jobs/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to job details
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-8">Apply for: {job.title}</h1>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Your Profile Information (Pre-filled)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>First Name</Label>
                    <Input value={user.firstName || ""} disabled />
                  </div>
                  
                  <div>
                    <Label>Last Name</Label>
                    <Input value={user.lastName || ""} disabled />
                  </div>
                </div>
                
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={user.email || ""} disabled />
                </div>
                
                <div>
                  <Label>Phone Number</Label>
                  <Input type="tel" value={user.phone || ""} disabled />
                </div>
                
                <div>
                  <Label>Current Location</Label>
                  <Input value={user.location || ""} disabled />
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BriefcaseIcon className="h-5 w-5" />
                  Professional Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Resume/CV</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{user.resumeName || "Your resume on file"}</span>
                  </div>
                </div>
                
                <div>
                  <Label>LinkedIn Profile</Label>
                  <Input type="url" value={user.linkedin || ""} disabled />
                </div>
                
                <div>
                  <Label>Portfolio/GitHub</Label>
                  <Input type="url" value={user.portfolio || ""} disabled />
                </div>
                
                <Separator />
                
                <div>
                  <Label>Years of Experience</Label>
                  <Input type="text" value={user.experience || ""} disabled />
                </div>
              </CardContent>
            </Card>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileIcon className="h-5 w-5" />
                      Application Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Letter (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Briefly explain why you're a good fit for this position..."
                              className="min-h-40"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Optional but recommended
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="gap-2"
                    >
                      <SendIcon className="h-4 w-4" />
                      {isSubmitting ? "Submitting..." : "Submit Application"}
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <p className="text-muted-foreground">{job.company}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{job.type}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{job.location}</span>
                  </div>
                  
                  {job.salary && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Application Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Personalize your application</h4>
                  <p className="text-sm text-muted-foreground">
                    Include specific details about why you're interested in this role and company.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Be specific in your cover letter</h4>
                  <p className="text-sm text-muted-foreground">
                    Mention specific projects or achievements that demonstrate your skills.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Check for errors</h4>
                  <p className="text-sm text-muted-foreground">
                    Proofread your cover letter for any spelling or grammatical errors.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Follow up</h4>
                  <p className="text-sm text-muted-foreground">
                    If you don't hear back within a week, consider sending a polite follow-up email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ApplyJob;
