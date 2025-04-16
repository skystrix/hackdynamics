
import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Github, 
  Linkedin, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  StarIcon 
} from "lucide-react";
import { Candidate } from "@/lib/types";

interface CandidateProfileProps {
  candidate: Candidate;
  onContact: () => void;
}

const CandidateProfile = ({ candidate, onContact }: CandidateProfileProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="h-24 w-24 rounded-full bg-accent flex items-center justify-center text-3xl font-bold">
          {candidate.name.charAt(0)}
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-lg text-primary">{candidate.title}</p>
          
          <div className="flex items-center gap-1 text-amber-500">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon 
                key={i} 
                className={`h-4 w-4 ${i < candidate.rating ? 'fill-current' : 'opacity-30'}`} 
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <MapPin className="h-4 w-4" />
            <span>{candidate.location}</span>
            {candidate.isRemote && (
              <span className="bg-accent/50 text-accent-foreground px-2 py-0.5 rounded text-xs">
                Remote
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 sm:ml-auto flex flex-wrap gap-2">
          <Button className="gap-2" onClick={onContact}>
            <Mail className="h-4 w-4" />
            Contact
          </Button>
          
          {candidate.resumeUrl && (
            <Button variant="outline" className="gap-2" onClick={() => window.open(candidate.resumeUrl)}>
              <Download className="h-4 w-4" />
              Resume
            </Button>
          )}
        </div>
      </div>
      
      <Separator />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-muted-foreground">{candidate.bio}</p>
          </div>
          
          {candidate.workHistory && candidate.workHistory.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Work Experience</h2>
              <div className="space-y-4">
                {candidate.workHistory.map((work) => (
                  <div key={work.id} className="relative pl-6 pb-2">
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary"></div>
                    <div className="absolute left-1.5 top-4 h-full w-0.5 bg-border"></div>
                    <h3 className="font-medium">{work.position}</h3>
                    <p className="text-sm text-primary">{work.company}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {work.startDate} - {work.endDate || 'Present'}
                    </p>
                    <p className="mt-2 text-sm">{work.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {candidate.education && candidate.education.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Education</h2>
              <div className="space-y-4">
                {candidate.education.map((edu) => (
                  <div key={edu.id} className="relative pl-6 pb-2">
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-primary"></div>
                    <div className="absolute left-1.5 top-4 h-full w-0.5 bg-border"></div>
                    <h3 className="font-medium">{edu.degree} in {edu.field}</h3>
                    <p className="text-sm text-primary">{edu.institution}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {edu.startDate} - {edu.endDate}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Skills</h2>
            <div className="space-y-3">
              {candidate.skills.map((skill) => (
                <div key={skill}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{skill}</span>
                    <span className="text-muted-foreground">
                      {Math.floor(Math.random() * 31) + 70}%
                    </span>
                  </div>
                  <Progress value={Math.floor(Math.random() * 31) + 70} className="h-2" />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-3">Contact Information</h2>
            <div className="space-y-3">
              {candidate.email && (
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${candidate.email}`} className="text-sm text-primary hover:underline">
                      {candidate.email}
                    </a>
                  </div>
                </div>
              )}
              
              {candidate.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-1 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href={`tel:${candidate.phone}`} className="text-sm text-primary hover:underline">
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-3">Links</h2>
            <div className="space-y-3">
              {candidate.githubUrl && (
                <a 
                  href={candidate.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub Profile
                </a>
              )}
              
              {candidate.linkedinUrl && (
                <a 
                  href={candidate.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </a>
              )}
              
              {candidate.portfolioUrl && (
                <a 
                  href={candidate.portfolioUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Portfolio Website
                </a>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Experience & Availability</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                <span>{candidate.experience} years of experience</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Available from {new Date(candidate.availableFrom).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
