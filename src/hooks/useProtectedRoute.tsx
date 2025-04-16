
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useProtectedRoute = (redirectPath: string = "/login", requiredRole?: string) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Protected route check:", {
      isAuthenticated,
      user,
      requiredRole,
      hasCorrectRole: user && requiredRole ? user.role === requiredRole : true
    });

    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to", redirectPath);
      toast.error("Please log in to access this page");
      navigate(redirectPath);
      return;
    }

    if (requiredRole && user && user.role !== requiredRole) {
      console.log("Wrong role, has:", user.role, "needs:", requiredRole);
      toast.error(`Only ${requiredRole}s can access this page`);
      navigate("/");
      return;
    }
  }, [isAuthenticated, navigate, redirectPath, requiredRole, user]);

  return isAuthenticated && (!requiredRole || (user && user.role === requiredRole));
};
