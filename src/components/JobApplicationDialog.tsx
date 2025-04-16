
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Job } from "@/lib/types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileIcon, SendIcon } from "lucide-react";

// Define the application schema with Zod - only cover letter is required
const applicationSchema = z.object({
  coverLetter: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

interface JobApplicationDialogProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

const JobApplicationDialog = ({ job, isOpen, onClose }: JobApplicationDialogProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
    },
  });

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
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        appliedAt: new Date().toISOString(),
        status: "pending",
        // Use the user's profile data
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: user?.location || "",
        linkedin: user?.linkedin || "",
        portfolio: user?.portfolio || "",
        experience: user?.experience || "",
        resumeName: user?.resumeName || "resume.pdf",
        salary: user?.expectedSalary || "",
        startDate: user?.availableFrom || new Date().toISOString(),
        // Only the cover letter comes from the form
        coverLetter: data.coverLetter,
      };
      
      // Add new application to array
      existingApplications.push(newApplication);
      
      // Save updated applications array
      localStorage.setItem("jobApplications", JSON.stringify(existingApplications));
      
      // Success message and close dialog
      setTimeout(() => {
        toast.success("Application submitted successfully!", {
          description: "We've sent a confirmation to your email.",
        });
        setIsSubmitting(false);
        form.reset();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error saving application:", error);
      toast.error("Failed to submit application", {
        description: "Please try again later.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for: {job.title}</DialogTitle>
          <DialogDescription>
            Submit your application to {job.company} using your existing profile information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 rounded-md border p-2 mb-4">
          <FileIcon className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm">
            <span className="font-medium">{user?.resumeName || "Your resume"}</span> will be attached
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Briefly explain why you're a good fit for this position..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-4">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <SendIcon className="h-4 w-4" />
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationDialog;
