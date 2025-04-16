
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, BriefcaseIcon } from "lucide-react";

interface SearchBarProps {
  onSearch?: (query: string, location: string, type: string) => void;
  inJobsPage?: boolean;
}

const SearchBar = ({ onSearch = () => {}, inJobsPage = false }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inJobsPage) {
      // Just use the provided onSearch callback if we're already on the jobs page
      onSearch(query, location, type);
    } else {
      // Navigate to jobs page with search parameters
      const searchParams = new URLSearchParams();
      if (query) searchParams.set("query", query);
      if (location) searchParams.set("location", location);
      if (type && type !== "all") searchParams.set("type", type);
      
      navigate({
        pathname: "/jobs",
        search: searchParams.toString()
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Job title, keywords, or company"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        <div className="relative md:w-64">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Location"
            className="pl-9"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        
        <div className="md:w-48">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Job Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Full-time">Full-time</SelectItem>
              <SelectItem value="Part-time">Part-time</SelectItem>
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Freelance">Freelance</SelectItem>
              <SelectItem value="Remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit">Search Jobs</Button>
      </div>
    </form>
  );
};

export default SearchBar;
