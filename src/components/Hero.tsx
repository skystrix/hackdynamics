
import { Button } from "@/components/ui/button";
import { SearchIcon, BriefcaseIcon, UsersIcon, TrendingUpIcon } from "lucide-react";
import SearchBar from "./SearchBar";

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-accent/50 to-background pt-16 pb-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 pb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-balance">
            Find Your Perfect <span className="text-primary">Engineering Job</span>
          </h1>
          <p className="text-xl text-muted-foreground md:w-3/4 text-balance">
            Connecting talented software engineers with the best tech companies worldwide
          </p>
          
          <div className="w-full max-w-3xl mt-6">
            <SearchBar />
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm">
              <BriefcaseIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">10,000+ Jobs</span>
            </div>
            <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm">
              <UsersIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">5,000+ Companies</span>
            </div>
            <div className="flex items-center gap-2 bg-card rounded-full px-4 py-2 shadow-sm">
              <TrendingUpIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Trending Tech Skills</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
