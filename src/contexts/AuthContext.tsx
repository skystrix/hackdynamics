
import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "recruiter" | "candidate";

interface User {
  id?: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  experience?: string;
  resumeName?: string;
  expectedSalary?: string;
  availableFrom?: string;
  company?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: clerkUser, isSignedIn } = useUser();
  const { signOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to sync user data with Supabase profiles table
  const syncUserWithSupabase = async (userData: User) => {
    if (!userData.id) return;
    
    try {
      console.log("Syncing user with Supabase:", userData.id);
      
      // Check if user exists in profiles table
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select()
        .eq('id', userData.id)
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is expected if profile doesn't exist
        console.error("Error checking for existing profile:", fetchError);
      }
      
      if (!existingProfile) {
        // Create new profile if doesn't exist
        const { data, error } = await supabase.from('profiles').upsert({
          id: userData.id,
          first_name: userData.firstName || null,
          last_name: userData.lastName || null,
          role: userData.role || 'candidate',
          company: userData.company || null,
          location: userData.location || null
        }, {
          onConflict: 'id'
        });
        
        if (error) {
          console.error("Error creating profile in Supabase:", error);
        } else {
          console.log("Created new profile in Supabase");
        }
      } else {
        console.log("Profile already exists in Supabase");
      }
    } catch (error) {
      console.error("Error syncing user with Supabase:", error);
    }
  };

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
      const userRole = clerkUser.publicMetadata?.role as UserRole || "candidate";
      
      if (primaryEmail) {
        const userData: User = { 
          id: clerkUser.id, // Ensuring we set the user ID from Clerk
          email: primaryEmail, 
          role: userRole,
          firstName: clerkUser.firstName || undefined,
          lastName: clerkUser.lastName || undefined,
          phone: clerkUser.publicMetadata?.phone as string || undefined,
          location: clerkUser.publicMetadata?.location as string || undefined,
          linkedin: clerkUser.publicMetadata?.linkedin as string || undefined,
          portfolio: clerkUser.publicMetadata?.portfolio as string || undefined,
          experience: clerkUser.publicMetadata?.experience as string || undefined,
          resumeName: clerkUser.publicMetadata?.resumeName as string || undefined,
          expectedSalary: clerkUser.publicMetadata?.expectedSalary as string || undefined,
          availableFrom: clerkUser.publicMetadata?.availableFrom as string || undefined,
          company: clerkUser.publicMetadata?.company as string || undefined,
        };
        
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Sync with Supabase
        syncUserWithSupabase(userData);
      }
    } else {
      const storedUser = localStorage.getItem("user");
      const isLoggedIn = localStorage.getItem("isLoggedIn");
      
      if (isLoggedIn === "true" && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          if (!parsedUser.role) {
            parsedUser.role = "candidate";
          }
          setUser(parsedUser);
          setIsAuthenticated(true);
          
          // Sync with Supabase
          syncUserWithSupabase(parsedUser);
        } catch (err) {
          console.error("Failed to parse stored user:", err);
          localStorage.removeItem("user");
          localStorage.removeItem("isLoggedIn");
        }
      }
    }
  }, [isSignedIn, clerkUser]);

  const login = async (email: string, password: string, role: UserRole = "candidate"): Promise<void> => {
    // Generate a temporary ID for non-Clerk users
    const tempId = crypto.randomUUID(); 
    
    const userData: User = { 
      id: tempId,
      email, 
      role 
    };
    
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("recruiterId", tempId); // Store recruiter ID for backup
    
    setUser(userData);
    setIsAuthenticated(true);
    
    // Sync with Supabase
    await syncUserWithSupabase(userData);
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out from Clerk:", error);
    }
    
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("recruiterId");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
