
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProfilePage = () => {
  // Use protected route hook to redirect if not authenticated
  const isAuthenticated = useProtectedRoute();
  const { user } = useAuth();

  if (!isAuthenticated || !user) {
    return null; // This will be handled by useProtectedRoute
  }

  const isRecruiter = user.role === "recruiter";
  const isCandidate = user.role === "candidate";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container py-10 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">My Profile</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Profile Summary Card */}
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.firstName || user.email}`} alt={user.firstName || "Profile"} />
                <AvatarFallback>
                  <UserIcon className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <CardTitle className="mt-4">{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant="outline" className="mt-2">
                {user.role === "candidate" ? "Job Seeker" : "Recruiter"}
              </Badge>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/settings">
                <Button variant="outline" className="mt-2 w-full">
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Your personal and professional information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRecruiter && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company</p>
                  <p>{user.company || "Not specified"}</p>
                  <Separator className="my-2" />
                </div>
              )}
            
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user.email}</p>
                <Separator className="my-2" />
              </div>
              
              {user.location && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p>{user.location}</p>
                  <Separator className="my-2" />
                </div>
              )}
              
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{user.phone}</p>
                  <Separator className="my-2" />
                </div>
              )}
              
              {user.linkedin && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">LinkedIn</p>
                  <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.linkedin}
                  </a>
                  <Separator className="my-2" />
                </div>
              )}
              
              {user.portfolio && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio</p>
                  <a href={user.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.portfolio}
                  </a>
                  <Separator className="my-2" />
                </div>
              )}
              
              {isCandidate && user.resumeName && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resume</p>
                  <p>{user.resumeName}</p>
                  <Separator className="my-2" />
                </div>
              )}
              
              {isCandidate && user.experience && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Experience</p>
                  <p>{user.experience}</p>
                  <Separator className="my-2" />
                </div>
              )}
              
              {isCandidate && user.expectedSalary && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Expected Salary</p>
                  <p>{user.expectedSalary}</p>
                  <Separator className="my-2" />
                </div>
              )}
              
              {isCandidate && user.availableFrom && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available From</p>
                  <p>{user.availableFrom}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Additional card for job preferences if the user is a candidate */}
          {isCandidate && (
            <Card className="md:col-span-2 mt-4">
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>Your job search preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Job Types</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge>Full-time</Badge>
                      <Badge variant="outline">Remote</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry Preferences</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge>Technology</Badge>
                      <Badge variant="outline">Healthcare</Badge>
                      <Badge variant="outline">Education</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Desired Locations</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge>{user.location || "Remote"}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge>React</Badge>
                      <Badge>JavaScript</Badge>
                      <Badge>UI/UX Design</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Additional card for recruiter information */}
          {isRecruiter && (
            <Card className="md:col-span-2 mt-4">
              <CardHeader>
                <CardTitle>Recruitment Activities</CardTitle>
                <CardDescription>Your active recruitment statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">5</p>
                    <p className="text-sm text-muted-foreground">Active Job Postings</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">28</p>
                    <p className="text-sm text-muted-foreground">Applications Received</p>
                  </div>
                  
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-primary">7</p>
                    <p className="text-sm text-muted-foreground">Interviews Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default ProfilePage;
