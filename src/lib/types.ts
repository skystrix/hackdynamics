export interface Job {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Freelance" | "Remote";
  salary?: string;
  description: string;
  skills: string[];
  postedAt: string;
  deadline?: string;
  applicationCount?: number;
  benefits?: string[];
  requirements?: string[];
  postedDate?: string;
  updatedDate?: string;
  isActive?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "employer" | "candidate";
  avatar?: string;
}

export interface Application {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl: string;
  coverLetter?: string;
  status: "pending" | "reviewed" | "rejected" | "accepted";
  appliedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
  rating: number;
  experience: number;
  isRemote: boolean;
  availableFrom: string;
  // Extended fields
  email?: string;
  phone?: string;
  bio?: string;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  education?: Education[];
  workHistory?: WorkExperience[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: Attachment[];
  timestamp: string;
  isRead: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

// New types for the recruiting features
export interface CalendarIntegration {
  provider: "google" | "calendly" | "outlook";
  connected: boolean;
  accountEmail?: string;
  lastSync?: string;
}

export interface InterviewSlot {
  id: string;
  candidateId: string;
  jobId: string;
  startTime: string;
  endTime: string;
  status: "scheduled" | "completed" | "cancelled" | "no-show";
  notes?: string;
  location?: string;
  meetingUrl?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "recruiter" | "hiring_manager" | "interviewer";
  avatar?: string;
}

export interface CandidateFeedback {
  id: string;
  candidateId: string;
  jobId: string;
  authorId: string;
  rating: number;
  comment: string;
  timestamp: string;
  stage: "resume_review" | "phone_screen" | "interview" | "final_decision";
}

export interface RecruitingMetrics {
  timeToHire: number; // in days
  applicantCount: number;
  interviewedCount: number;
  offersMade: number;
  offersAccepted: number;
  dropOffRate: number; // percentage
  sourceEfficiency: Record<string, number>; // efficiency per source
}
