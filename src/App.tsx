
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClerkLoaded, ClerkLoading, useAuth as useClerkAuth } from "@clerk/clerk-react";
import Index from "./pages/Index";
import JobDetails from "./pages/JobDetails";
import PostJob from "./pages/PostJob";
import Candidates from "./pages/Candidates";
import Inbox from "./pages/Inbox";
import Resources from "./pages/Resources";
import BackendCourse from "./pages/BackendCourse";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import SalaryGuide from "./pages/SalaryGuide";
import ResumeTips from "./pages/ResumeTips";
import Recruiting from "./pages/Recruiting";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Jobs from "./pages/Jobs";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import RecruiterDashboard from "./pages/RecruiterDashboard";

// Create a client
const queryClient = new QueryClient();

// Create SSO callback component with simpler handling
const SSOCallback = () => {
  const { isSignedIn } = useClerkAuth();
  
  React.useEffect(() => {
    console.log("SSO Callback: Authentication status =", isSignedIn);
    
    // Simplified redirect approach
    if (isSignedIn) {
      console.log("User is signed in, redirecting to home page");
      window.location.href = "/";
    } else {
      console.log("User is not signed in yet");
    }
  }, [isSignedIn]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-xl font-medium">Processing sign in...</p>
    </div>
  );
};

// Role-based route guard
const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Not authenticated or role not allowed
  if (isAuthenticated && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Smart home page redirection
const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (isAuthenticated && user?.role === "recruiter") {
    return <Navigate to="/recruiter-dashboard" replace />;
  }
  
  return <Index />;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ClerkLoading>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ClerkLoading>
      <ClerkLoaded>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<HomeRedirect />} />
                  <Route path="/jobs" element={<Jobs />} />
                  <Route path="/jobs/:id" element={<JobDetails />} />
                  <Route path="/post-job" element={
                    <RoleRoute allowedRoles={["recruiter"]}>
                      <PostJob />
                    </RoleRoute>
                  } />
                  <Route path="/recruiter-dashboard" element={
                    <RoleRoute allowedRoles={["recruiter"]}>
                      <RecruiterDashboard />
                    </RoleRoute>
                  } />
                  <Route path="/candidates" element={
                    <RoleRoute allowedRoles={["recruiter"]}>
                      <Candidates />
                    </RoleRoute>
                  } />
                  <Route path="/inbox" element={<Inbox />} />
                  <Route path="/analytics" element={
                    <RoleRoute allowedRoles={["recruiter"]}>
                      <AnalyticsDashboard />
                    </RoleRoute>
                  } />
                  <Route path="/resources" element={
                    <RoleRoute allowedRoles={["candidate"]}>
                      <Resources />
                    </RoleRoute>
                  } />
                  <Route path="/backend-course" element={
                    <RoleRoute allowedRoles={["candidate"]}>
                      <BackendCourse />
                    </RoleRoute>
                  } />
                  <Route path="/pricing" element={
                    <RoleRoute allowedRoles={["recruiter"]}>
                      <Pricing />
                    </RoleRoute>
                  } />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/salary-guide" element={<SalaryGuide />} />
                  <Route path="/resume-tips" element={<ResumeTips />} />
                  <Route path="/recruiting" element={<Recruiting />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/sso-callback" element={<SSOCallback />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </ClerkLoaded>
    </QueryClientProvider>
  );
};

export default App;
