
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPinIcon, ClockIcon, CalendarIcon, BriefcaseIcon, Users2Icon } from "lucide-react";
import { Link } from "react-router-dom";
import { Job } from "@/lib/types";

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const {
    id,
    title,
    company,
    logo,
    location,
    type,
    salary,
    skills = [], // Add default empty array for skills if undefined
    postedAt,
    applicationCount,
  } = job;

  // Format posted date as relative time (e.g., "2 days ago")
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="job-card overflow-hidden hover:border-primary/50">
      <CardHeader className="p-4 pb-0 flex flex-row items-start gap-4">
        <div className="w-12 h-12 rounded overflow-hidden bg-muted flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={`${company} logo`} className="w-full h-full object-cover" />
          ) : (
            <BriefcaseIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <Link to={`/jobs/${id}`} className="hover:underline">
            <h3 className="font-semibold text-lg">{title}</h3>
          </Link>
          <p className="text-muted-foreground">{company}</p>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPinIcon className="h-4 w-4" />
            <span>{location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClockIcon className="h-4 w-4" />
            <span>{type}</span>
            {salary && (
              <>
                <span className="mx-1">•</span>
                <span>{salary}</span>
              </>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="font-normal">
                {skill}
              </Badge>
            ))}
            {skills.length > 3 && (
              <Badge variant="outline" className="font-normal">
                +{skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Posted {formatRelativeDate(postedAt)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users2Icon className="h-4 w-4" />
          <span>{applicationCount || 0} applicants</span>
        </div>
      </CardFooter>
      
      <div className="bg-secondary/50 p-4 flex justify-end">
        <Link to={`/jobs/${id}`}>
          <Button>View Job</Button>
        </Link>
      </div>
    </Card>
  );
};

export default JobCard;
