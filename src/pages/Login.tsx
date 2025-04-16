
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"recruiter" | "candidate">("candidate");

  // If the user is already logged in, redirect them based on their role
  React.useEffect(() => {
    if (user) {
      navigate(user.role === "recruiter" ? "/recruiter-dashboard" : "/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demonstration purposes, we'll just assume login is successful
      // In a real app, you would validate credentials with your backend
      // For now, we'll detect the role based on email domain
      const isCompanyEmail = !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"].some(domain => 
        email.toLowerCase().endsWith(`@${domain}`)
      );
      
      // Infer role from email pattern (this is just for demo purposes)
      const inferredRole = isCompanyEmail ? "recruiter" : "candidate";
      
      // Give priority to explicitly selected role
      const finalRole = role || inferredRole;
      
      await login(email, password, finalRole);
      
      // Get the user data from localStorage to ensure we have the latest data
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        
        // Ensure we create a profile in Supabase
        if (parsedUser.id) {
          const { error } = await supabase.from('profiles').upsert({
            id: parsedUser.id,
            first_name: parsedUser.firstName || email.split('@')[0],
            last_name: parsedUser.lastName || '',
            role: finalRole,
            company: parsedUser.company || '',
            location: parsedUser.location || ''
          }, { onConflict: 'id' });
          
          if (error) {
            console.error("Error creating profile:", error);
          } else {
            console.log("Created/updated profile successfully");
          }
        }
      }
      
      toast.success("Login successful!");
      
      // Redirect based on role
      navigate(finalRole === "recruiter" ? "/recruiter-dashboard" : "/");
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">I am a:</Label>
              <div className="flex gap-4">
                <Button 
                  type="button" 
                  variant={role === "candidate" ? "default" : "outline"}
                  onClick={() => setRole("candidate")}
                  className="flex-1"
                >
                  Job Seeker
                </Button>
                <Button 
                  type="button" 
                  variant={role === "recruiter" ? "default" : "outline"}
                  onClick={() => setRole("recruiter")}
                  className="flex-1"
                >
                  Recruiter
                </Button>
              </div>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
        
        <Separator />
        
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="underline hover:text-primary">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
