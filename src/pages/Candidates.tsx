
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BriefcaseIcon, 
  SearchIcon, 
  MapPinIcon, 
  FilterIcon,
  StarIcon,
  MailIcon,
  PhoneIcon,
  Calendar,
  Users,
  BarChart3
} from "lucide-react";
import { candidates } from "../data/candidates";
import { Candidate } from "../lib/types";
import CandidateProfile from "@/components/CandidateProfile";
import MessagingSystem from "@/components/MessagingSystem";
import InterviewScheduler from "@/components/InterviewScheduler";
import CollaborativeFeedback from "@/components/CollaborativeFeedback";
import { Link } from "react-router-dom";

const Candidates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [showMessagingSystem, setShowMessagingSystem] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeProfileTab, setActiveProfileTab] = useState<"profile" | "schedule" | "feedback">("profile");
  
  // Filter candidates based on search query and selected skills
  const filteredCandidates = candidates.filter((candidate) => {
    const matchesQuery = searchQuery === "" || 
      candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSkills = selectedSkills.length === 0 || 
      selectedSkills.every(skill => candidate.skills.includes(skill));
    
    return matchesQuery && matchesSkills;
  });

  // All unique skills across candidates
  const allSkills = Array.from(new Set(candidates.flatMap(candidate => candidate.skills)));
  
  // Toggle skill selection
  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  // Handle view profile action
  const handleViewProfile = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowProfileModal(true);
    // Default to profile tab when opening
    setActiveProfileTab("profile");
  };

  // Handle contact action
  const handleContact = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowContactModal(true);
    setContactMessage("");
    setAttachments([]);
  };
  
  // Handle messaging system
  const handleOpenMessaging = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowMessagingSystem(true);
  };

  // Handle file attachment
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };
  
  // Remove an attachment
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!contactMessage.trim() && attachments.length === 0) {
      toast.error("Please enter a message or attach a document");
      return;
    }
    
    // In a real app, we would process the file uploads here
    const attachmentNames = attachments.map(file => file.name).join(", ");
    const attachmentMessage = attachments.length > 0 
      ? `with ${attachments.length} attachment${attachments.length > 1 ? 's' : ''} (${attachmentNames})` 
      : '';
    
    toast.success(`Message sent to ${selectedCandidate?.name} ${attachmentMessage}`);
    setContactMessage("");
    setAttachments([]);
    setShowContactModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl font-bold mb-6">Find Top Tech Talent</h1>
            <p className="text-xl mb-8">
              Connect with skilled software engineers ready to bring value to your team
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name, skills, position..."
                className="pl-10 h-12 bg-background/80 backdrop-blur-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Quick Access Buttons */}
        <div className="bg-secondary/30">
          <div className="container py-4">
            <div className="flex justify-center gap-4">
              <Link to="/analytics">
                <Button variant="outline" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics Dashboard
                </Button>
              </Link>
              <Link to="/inbox">
                <Button variant="outline" className="flex items-center gap-2">
                  <MailIcon className="h-4 w-4" />
                  Inbox
                </Button>
              </Link>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FilterIcon className="h-5 w-5" />
                  Filter by Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => (
                    <Button
                      key={skill}
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSkill(skill)}
                      className="text-xs"
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Looking to hire?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Post a job and reach thousands of qualified developers.
                </p>
                <Button className="w-full">
                  <BriefcaseIcon className="h-4 w-4 mr-2" />
                  Post a Job
                </Button>
              </div>
            </div>
            
            {/* Candidates List */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-semibold mb-6">
                {filteredCandidates.length} Candidates Available
              </h2>
              
              {filteredCandidates.length > 0 ? (
                <div className="grid gap-6">
                  {filteredCandidates.map((candidate) => (
                    <Card key={candidate.id} className="overflow-hidden job-card">
                      <CardContent className="p-0">
                        <div className="p-6 flex gap-4 flex-col sm:flex-row">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-xl font-bold">
                              {candidate.name.charAt(0)}
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="flex-grow space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                              <h3 className="text-xl font-semibold">{candidate.name}</h3>
                              <div className="flex items-center gap-1 text-amber-500">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <StarIcon 
                                    key={i} 
                                    className={`h-4 w-4 ${i < candidate.rating ? 'fill-current' : 'opacity-30'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            
                            <p className="font-medium text-primary">{candidate.title}</p>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPinIcon className="h-4 w-4" />
                              <span>{candidate.location}</span>
                              {candidate.isRemote && (
                                <span className="bg-accent/50 text-accent-foreground px-2 py-0.5 rounded text-xs ml-2">
                                  Remote
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              {candidate.skills.map((skill) => (
                                <span 
                                  key={skill}
                                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Call-to-action */}
                          <div className="flex-shrink-0 flex sm:flex-col gap-3 items-center justify-between sm:justify-start pt-4 sm:pt-0">
                            <Button onClick={() => handleViewProfile(candidate)}>View Profile</Button>
                            <Button variant="outline" onClick={() => handleOpenMessaging(candidate)}>Message</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">No candidates match your search criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Enhanced Profile Dialog with Tabs */}
      <Dialog 
        open={showProfileModal} 
        onOpenChange={(open) => {
          setShowProfileModal(open);
          if (!open) setSelectedCandidate(null);
        }}
      >
        {selectedCandidate && (
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <Tabs 
              value={activeProfileTab} 
              onValueChange={(value) => setActiveProfileTab(value as "profile" | "schedule" | "feedback")}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="schedule">Schedule Interview</TabsTrigger>
                <TabsTrigger value="feedback">Team Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <CandidateProfile 
                  candidate={selectedCandidate} 
                  onContact={() => {
                    setShowProfileModal(false);
                    setShowContactModal(true);
                  }} 
                />
              </TabsContent>
              
              <TabsContent value="schedule">
                <InterviewScheduler candidate={selectedCandidate} jobId="job-1" />
              </TabsContent>
              
              <TabsContent value="feedback">
                <CollaborativeFeedback candidate={selectedCandidate} jobId="job-1" />
              </TabsContent>
            </Tabs>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Contact Dialog */}
      <Dialog 
        open={showContactModal} 
        onOpenChange={(open) => {
          setShowContactModal(open);
          if (!open) setSelectedCandidate(null);
        }}
      >
        {selectedCandidate && (
          <DialogContent className="sm:max-w-lg">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-xl font-bold">
                  {selectedCandidate.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{selectedCandidate.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.title}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="grid gap-2">
                  <label htmlFor="message" className="text-sm font-medium">Your message</label>
                  <Textarea 
                    id="message" 
                    placeholder="Write your message here..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Attachments</label>
                  <div className="border rounded-md p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {attachments.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-1 text-sm bg-secondary rounded-full pl-3 pr-1 py-1"
                        >
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-5 w-5 rounded-full hover:bg-secondary/80"
                            onClick={() => removeAttachment(index)}
                          >
                            &times;
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-center border-2 border-dashed rounded-md py-4 px-2">
                      <label htmlFor="file-upload" className="cursor-pointer text-center">
                        <div className="flex flex-col items-center gap-1">
                          <MailIcon className="h-6 w-6 text-muted-foreground" />
                          <span className="text-sm font-medium">Click to attach files</span>
                          <span className="text-xs text-muted-foreground">PDF, DOC, DOCX, etc.</span>
                        </div>
                        <Input 
                          id="file-upload" 
                          type="file" 
                          className="hidden" 
                          multiple
                          onChange={handleFileChange} 
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowContactModal(false)}>Cancel</Button>
                <Button onClick={handleSendMessage}>Send Message</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
      
      {/* Messaging Dialog */}
      <Dialog 
        open={showMessagingSystem} 
        onOpenChange={(open) => {
          setShowMessagingSystem(open);
          if (!open) setSelectedCandidate(null);
        }}
      >
        {selectedCandidate && (
          <DialogContent className="sm:max-w-2xl h-[550px]">
            <MessagingSystem 
              candidate={selectedCandidate} 
              onClose={() => setShowMessagingSystem(false)}
            />
          </DialogContent>
        )}
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default Candidates;
