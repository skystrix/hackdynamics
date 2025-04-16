
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SettingsPage = () => {
  // Use protected route hook to redirect if not authenticated
  const isAuthenticated = useProtectedRoute();
  const { user } = useAuth();
  
  const [notifyNewMessages, setNotifyNewMessages] = useState(true);
  const [notifyJobMatches, setNotifyJobMatches] = useState(true);
  const [notifyUpdates, setNotifyUpdates] = useState(false);
  
  if (!isAuthenticated || !user) {
    return null; // This will be handled by useProtectedRoute
  }

  const handleSaveProfile = () => {
    toast.success("Profile settings saved!");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences updated!");
  };

  const handleSaveSecurity = () => {
    toast.success("Security settings updated!");
  };

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
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue={user.firstName || ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user.lastName || ""} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user.email} readOnly />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue={user.phone || ""} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" defaultValue={user.location || ""} />
                </div>
                
                {user.role === "recruiter" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" defaultValue={user.company || ""} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input id="linkedin" defaultValue={user.linkedin || ""} placeholder="https://linkedin.com/in/yourprofile" />
                </div>
                
                {user.role === "candidate" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio URL</Label>
                      <Input id="portfolio" defaultValue={user.portfolio || ""} placeholder="https://your-portfolio.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input id="experience" defaultValue={user.experience || ""} placeholder="e.g. 5 years" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expectedSalary">Expected Salary</Label>
                      <Input id="expectedSalary" defaultValue={user.expectedSalary || ""} placeholder="e.g. $80,000" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="availableFrom">Available From</Label>
                      <Input id="availableFrom" type="date" defaultValue={user.availableFrom || ""} />
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Messages</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications for new messages</p>
                  </div>
                  <Switch 
                    checked={notifyNewMessages}
                    onCheckedChange={setNotifyNewMessages}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Job Matches</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new job matches</p>
                  </div>
                  <Switch 
                    checked={notifyJobMatches}
                    onCheckedChange={setNotifyJobMatches}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Platform Updates</Label>
                    <p className="text-sm text-muted-foreground">Receive platform news and updates</p>
                  </div>
                  <Switch 
                    checked={notifyUpdates}
                    onCheckedChange={setNotifyUpdates}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSecurity}>Update Password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default SettingsPage;
