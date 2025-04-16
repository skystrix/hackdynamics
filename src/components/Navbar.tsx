
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BriefcaseIcon,
  MenuIcon,
  UserIcon,
  LogOutIcon,
  ChevronRightIcon,
  MessageSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isRecruiter = user?.role === "recruiter";
  const isCandidate = user?.role === "candidate";

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <span className="text-xl font-bold">HackDynamics</span>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/" className={navigationMenuTriggerStyle()}>
                  Home
                </Link>
              </NavigationMenuItem>
              
              {/* Conditional navigation based on user role */}
              {(!isAuthenticated || isCandidate) && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Find Jobs</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          >
                            <BriefcaseIcon className="h-6 w-6" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Browse All Jobs
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Explore thousands of job opportunities across various
                              industries and locations.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem to="/salary-guide" title="Salary Guide">
                        Compare compensation across roles and locations
                      </ListItem>
                      <ListItem to="/resume-tips" title="Resume Tips">
                        Optimize your resume to stand out to employers
                      </ListItem>
                      <ListItem to="/recruiting" title="Recruiting Solutions">
                        Tools and services for employers and recruiters
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
              
              {(!isAuthenticated || isRecruiter) && (
                <NavigationMenuItem>
                  <Link to="/candidates" className={navigationMenuTriggerStyle()}>
                    Find Candidates
                  </Link>
                </NavigationMenuItem>
              )}
              
              {(!isAuthenticated || isCandidate) && (
                <NavigationMenuItem>
                  <Link to="/resources" className={navigationMenuTriggerStyle()}>
                    Resources
                  </Link>
                </NavigationMenuItem>
              )}
              
              {(!isAuthenticated || isRecruiter) && (
                <NavigationMenuItem>
                  <Link to="/pricing" className={navigationMenuTriggerStyle()}>
                    Pricing
                  </Link>
                </NavigationMenuItem>
              )}
              
              {isAuthenticated && (
                <NavigationMenuItem>
                  <Link to="/inbox" className={navigationMenuTriggerStyle()}>
                    <MessageSquare className="w-4 h-4 mr-1" /> Inbox
                  </Link>
                </NavigationMenuItem>
              )}
              
              {isAuthenticated && isRecruiter && (
                <NavigationMenuItem>
                  <Link to="/analytics" className={navigationMenuTriggerStyle()}>
                    Analytics
                  </Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/inbox" className="flex items-center gap-1 cursor-pointer">
                    <MessageSquare className="w-4 h-4" /> Inbox
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
          {(!isAuthenticated || isRecruiter) && (
            <Link to="/post-job">
              <Button variant="outline">
                <BriefcaseIcon className="mr-2 h-4 w-4" />
                Post a Job
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader className="mb-4">
              <SheetTitle>
                <Link
                  to="/"
                  className="flex items-center gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Logo className="h-6 w-6" />
                  <span className="text-lg font-bold">HackDynamics</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <ThemeToggle />
                <span>Toggle theme</span>
              </div>
              <MobileNavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </MobileNavLink>
              
              {/* Conditional mobile navigation */}
              {(!isAuthenticated || isCandidate) && (
                <MobileNavLink
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Jobs
                </MobileNavLink>
              )}
              
              {(!isAuthenticated || isRecruiter) && (
                <MobileNavLink
                  to="/candidates"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Find Candidates
                </MobileNavLink>
              )}
              
              {(!isAuthenticated || isCandidate) && (
                <MobileNavLink
                  to="/resources"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Resources
                </MobileNavLink>
              )}
              
              {(!isAuthenticated || isRecruiter) && (
                <MobileNavLink
                  to="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Pricing
                </MobileNavLink>
              )}
              
              {isAuthenticated && (
                <MobileNavLink
                  to="/inbox"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <MessageSquare className="w-4 h-4 mr-1" /> Inbox
                </MobileNavLink>
              )}
              
              {isAuthenticated && isRecruiter && (
                <MobileNavLink
                  to="/analytics"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Analytics
                </MobileNavLink>
              )}
              
              <div className="h-px bg-border my-2" />
              {isAuthenticated ? (
                <>
                  <MobileNavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </MobileNavLink>
                  <MobileNavLink
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </MobileNavLink>
                  <Button
                    variant="ghost"
                    className="justify-start px-2"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </>
              ) : (
                <>
                  <MobileNavLink
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </MobileNavLink>
                  <MobileNavLink
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </MobileNavLink>
                </>
              )}
              <div className="h-px bg-border my-2" />
              {(!isAuthenticated || isRecruiter) && (
                <MobileNavLink
                  to="/post-job"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <BriefcaseIcon className="mr-2 h-4 w-4" />
                  Post a Job
                </MobileNavLink>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

interface ListItemProps {
  to: string;
  title: string;
  children: React.ReactNode;
}

const ListItem = ({ to, title, children }: ListItemProps) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={to}
          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

interface MobileNavLinkProps {
  to: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const MobileNavLink = ({ to, children, onClick }: MobileNavLinkProps) => {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent"
      onClick={onClick}
    >
      <div className="flex items-center">{children}</div>
      <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
};

export default Navbar;
