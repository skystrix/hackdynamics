import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BriefcaseIcon, UserIcon } from "lucide-react";

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("candidate");
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    phone: "",
    location: "",
    experience: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    // For recruiters, validate company email
    if (selectedRole === "recruiter" && (!formData.companyName || !isCompanyEmail(formData.email))) {
      toast.error("Please provide a valid company email and company name");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Split name into first name and last name if not provided separately
      const nameParts = formData.name.split(" ");
      const firstName = formData.firstName || nameParts[0] || "";
      const lastName = formData.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : "");
      
      // Generate a UUID for the new user
      const userId = crypto.randomUUID();
      
      // In a real app, this would register a new user
      // For now we construct a user object with extended fields
      const userData = {
        id: userId,
        email: formData.email,
        role: selectedRole,
        firstName,
        lastName,
        phone: formData.phone || "",
        location: formData.location || "",
        experience: formData.experience || "",
        company: formData.companyName || "",
        // Default values for other fields
        resumeName: "resume.pdf",
        linkedin: "",
        portfolio: "",
        expectedSalary: "",
        availableFrom: new Date().toISOString(),
      };
      
      // Store the extended user data
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Create a profile in Supabase
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        role: selectedRole,
        company: formData.companyName || null,
        location: formData.location || null
      });
      
      if (error) {
        console.error("Error creating profile:", error);
        toast.error("Failed to create your profile. Please try again.");
        setIsLoading(false);
        return;
      }
      
      console.log("Created profile successfully with ID:", userId);
      
      // Login with basic info but the extended data is now in localStorage
      await login(formData.email, formData.password, selectedRole);
      toast.success("Registration successful!");
      
      // Redirect based on role
      if (selectedRole === "recruiter") {
        navigate("/candidates");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Basic company email validation
  const isCompanyEmail = (email: string): boolean => {
    // Avoid common personal email domains
    const personalDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"];
    const domain = email.split('@')[1]?.toLowerCase();
    return domain ? !personalDomains.includes(domain) : false;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs 
            defaultValue="candidate" 
            className="w-full mb-6" 
            onValueChange={(value) => setSelectedRole(value as UserRole)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="candidate" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> 
                Job Seeker
              </TabsTrigger>
              <TabsTrigger value="recruiter" className="flex items-center gap-2">
                <BriefcaseIcon className="h-4 w-4" /> 
                Recruiter
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              {selectedRole === "candidate" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="City, State"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience (Optional)</Label>
                    <Input
                      id="experience"
                      name="experience"
                      placeholder="e.g. 3"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={selectedRole === "recruiter" ? "you@yourcompany.com" : "example@example.com"}
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
                {selectedRole === "recruiter" && (
                  <p className="text-xs text-muted-foreground">Please use your company email address</p>
                )}
              </div>
              
              {selectedRole === "recruiter" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    placeholder="Acme Inc"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>
          
          <div className="mt-4 text-center text-sm">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="underline hover:text-primary">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
          </div>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="underline hover:text-primary">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
