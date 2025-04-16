import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getJobById } from "@/data/jobs";
import { Job } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import JobApplicationDialog from "@/components/JobApplicationDialog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BriefcaseIcon, 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon, 
  DollarSignIcon,
  ShareIcon,
  BookmarkIcon,
  Users2Icon,
  ArrowLeftIcon,
  CheckIcon
} from "lucide-react";

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      if (id) {
        const jobData = getJobById(id);
        if (jobData) {
          setJob(jobData);
          setError(null);
        } else {
          setError("Job not found");
        }
      }
      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleApplyClick = () => {
    if (!user) {
      window.location.href = `/login?redirect=/jobs/${id}`;
      return;
    }
    
    setIsApplicationDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="h-12 bg-muted rounded-md animate-pulse" />
            <div className="h-64 bg-muted rounded-md animate-pulse" />
            <div className="h-96 bg-muted rounded-md animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="max-w-4xl mx-auto text-center py-16">
            <h2 className="text-2xl font-semibold mb-4">Job Not Found</h2>
            <p className="text-muted-foreground mb-8">Sorry, we couldn't find the job you're looking for.</p>
            <Link to="/">
              <Button>Browse All Jobs</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ArrowLeftIcon className="h-4 w-4 mr-1" /> Back to jobs
          </Link>

          <div className="bg-card border rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-6 md:items-center">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                {job?.logo ? (
                  <img src={job.logo} alt={`${job.company} logo`} className="w-full h-full object-cover" />
                ) : (
                  <BriefcaseIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{job?.title}</h1>
                <p className="text-lg text-muted-foreground mb-3">{job?.company}</p>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{job?.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{job?.type}</span>
                  </div>
                  
                  {job?.salary && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{job.salary}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>Posted on {job ? new Date(job.postedAt).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button className="w-full" onClick={handleApplyClick}>
                  Apply Now
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" title="Save Job">
                    <BookmarkIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Share Job">
                    <ShareIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                <div className="prose max-w-none">
                  <p>{job.description}</p>
                  <p>
                    We are looking for a talented developer who is passionate about building high-quality software.
                    As part of our team, you will work on challenging projects and collaborate with other talented engineers.
                  </p>
                  <h3>Responsibilities:</h3>
                  <ul>
                    <li>Design, develop and maintain efficient, reusable, and reliable code</li>
                    <li>Collaborate with cross-functional teams to define, design, and ship new features</li>
                    <li>Ensure the performance, quality, and responsiveness of applications</li>
                    <li>Identify and correct bottlenecks and fix bugs</li>
                    <li>Help maintain code quality, organization, and automatization</li>
                  </ul>
                </div>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Requirements</h2>
                <div className="prose max-w-none">
                  <ul>
                    <li>Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model</li>
                    <li>Thorough understanding of React.js and its core principles</li>
                    <li>Experience with popular React workflows (such as Redux)</li>
                    <li>Familiarity with newer specifications of ECMAScript</li>
                    <li>Experience with data structure libraries (e.g., Immutable.js)</li>
                    <li>Knowledge of isomorphic React is a plus</li>
                    <li>Understanding of RESTful APIs</li>
                    <li>Knowledge of modern authorization mechanisms, such as JSON Web Token</li>
                    <li>Familiarity with modern front-end build pipelines and tools</li>
                    <li>Experience with common front-end development tools such as Babel, Webpack, NPM, etc.</li>
                  </ul>
                </div>
              </section>
              
              <Separator />
              
              <section>
                <h2 className="text-xl font-semibold mb-4">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm py-1.5">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            </div>
            
            <div>
              <div className="bg-card border rounded-lg p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Apply for this job</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Submit your application now and we'll contact you soon about the next steps.
                </p>
                <Button className="w-full mb-4" onClick={handleApplyClick}>
                  Apply Now
                </Button>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Job Overview</h3>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Job ID</span>
                    <span>{job.id}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Applications</span>
                    <div className="flex items-center gap-1">
                      <Users2Icon className="h-4 w-4" />
                      <span>{job.applicationCount || 0}</span>
                    </div>
                  </div>
                  
                  {job.deadline && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Deadline</span>
                      <span>{new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="bg-muted/50 p-4 rounded-md mt-4">
                    <h4 className="text-sm font-medium mb-2">Company Benefits</h4>
                    <ul className="space-y-2">
                      <li className="text-sm flex items-start gap-2">
                        <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                        <span>Remote work options</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                        <span>Competitive salary</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                        <span>Health insurance</span>
                      </li>
                      <li className="text-sm flex items-start gap-2">
                        <CheckIcon className="h-4 w-4 text-primary mt-0.5" />
                        <span>401(k) matching</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 mb-6 text-center">
            <h3 className="text-xl font-semibold mb-3">Not the right job?</h3>
            <p className="text-muted-foreground mb-6">Browse more jobs that match your skills and preferences</p>
            <Link to="/">
              <Button>View All Jobs</Button>
            </Link>
          </div>
        </div>

        {job && (
          <JobApplicationDialog 
            job={job}
            isOpen={isApplicationDialogOpen}
            onClose={() => setIsApplicationDialogOpen(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default JobDetails;
