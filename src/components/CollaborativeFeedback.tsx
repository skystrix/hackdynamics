
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";
import { CandidateFeedback, TeamMember, Candidate } from "@/lib/types";
import { Check, Plus, Star, User, Users, UserPlus, MessageSquare, ThumbsUp, ThumbsDown, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface CollaborativeFeedbackProps {
  candidate?: Candidate;
  jobId?: string;
}

// Sample team members
const sampleTeamMembers: TeamMember[] = [
  { id: "team-1", name: "Sarah Johnson", email: "sarah@example.com", role: "hiring_manager", avatar: undefined },
  { id: "team-2", name: "Michael Chen", email: "michael@example.com", role: "interviewer", avatar: undefined },
  { id: "team-3", name: "Emily Rodriguez", email: "emily@example.com", role: "recruiter", avatar: undefined },
  { id: "team-4", name: "David Kim", email: "david@example.com", role: "interviewer", avatar: undefined },
];

// Sample feedback data
const sampleFeedback: CandidateFeedback[] = [
  {
    id: "feedback-1",
    candidateId: "candidate-1",
    jobId: "job-1",
    authorId: "team-1",
    rating: 4,
    comment: "Strong technical skills, but could improve on communication. Overall, a good fit for the team.",
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    stage: "interview"
  },
  {
    id: "feedback-2",
    candidateId: "candidate-1",
    jobId: "job-1",
    authorId: "team-2",
    rating: 5,
    comment: "Excellent problem solving abilities. Handled all technical questions well and showed good thinking process.",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    stage: "interview"
  }
];

const CollaborativeFeedback: React.FC<CollaborativeFeedbackProps> = ({ candidate, jobId }) => {
  const [isAddFeedbackOpen, setIsAddFeedbackOpen] = useState(false);
  const [isInviteTeamOpen, setIsInviteTeamOpen] = useState(false);
  const [feedback, setFeedback] = useState<CandidateFeedback[]>(sampleFeedback);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [stage, setStage] = useState<"resume_review" | "phone_screen" | "interview" | "final_decision">("interview");
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"recruiter" | "hiring_manager" | "interviewer">("interviewer");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [open, setOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleAddFeedback = () => {
    if (newRating === 0) {
      toast.error("Please provide a rating");
      return;
    }
    
    if (newComment.trim() === "") {
      toast.error("Please provide feedback comments");
      return;
    }

    const newFeedbackItem: CandidateFeedback = {
      id: `feedback-${Date.now()}`,
      candidateId: candidate?.id || "unknown",
      jobId: jobId || "unknown",
      authorId: "team-3", // Assuming current user is Emily
      rating: newRating,
      comment: newComment,
      timestamp: new Date().toISOString(),
      stage
    };

    setFeedback([...feedback, newFeedbackItem]);
    toast.success("Feedback submitted successfully");
    setIsAddFeedbackOpen(false);
    setNewRating(0);
    setNewComment("");
  };

  const handleInviteTeamMember = () => {
    if (emailInput.trim() === "") {
      toast.error("Please enter an email address");
      return;
    }
    
    if (!emailInput.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    const newTeamMember: TeamMember = {
      id: `team-${Date.now()}`,
      name: emailInput.split('@')[0], // Placeholder name from email
      email: emailInput,
      role: roleInput,
      avatar: undefined
    };

    setTeamMembers([...teamMembers, newTeamMember]);
    toast.success(`Invitation sent to ${emailInput}`);
    setIsInviteTeamOpen(false);
    setEmailInput("");
  };

  const getTeamMemberById = (id: string) => {
    return teamMembers.find(member => member.id === id);
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case "resume_review": return "Resume Review";
      case "phone_screen": return "Phone Screen";
      case "interview": return "Interview";
      case "final_decision": return "Final Decision";
      default: return stage;
    }
  };

  const getOverallRating = (): number => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    return Math.round((sum / feedback.length) * 10) / 10;
  };

  const getHiringRecommendation = (): string => {
    const rating = getOverallRating();
    if (rating >= 4.5) return "Strong Hire";
    if (rating >= 3.5) return "Hire";
    if (rating >= 2.5) return "Consider";
    if (rating >= 1) return "Do Not Hire";
    return "Insufficient Data";
  };
  
  const getRecommendationColor = (): string => {
    const rating = getOverallRating();
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 3.5) return "text-emerald-600";
    if (rating >= 2.5) return "text-amber-500";
    if (rating >= 1) return "text-red-500";
    return "text-gray-500";
  };

  const getRecommendationIcon = () => {
    const rating = getOverallRating();
    if (rating >= 4.5) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (rating >= 3.5) return <ThumbsUp className="h-5 w-5 text-emerald-600" />;
    if (rating >= 2.5) return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    if (rating >= 1) return <ThumbsDown className="h-5 w-5 text-red-500" />;
    return null;
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hiring Team</CardTitle>
              <CardDescription>Collaborate with your team on candidate evaluation</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsInviteTeamOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {teamMembers.map(member => (
              <div key={member.id} className="flex items-center space-x-2 bg-secondary/50 rounded-full pl-1 pr-3 py-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{member.name}</span>
                <span className="text-xs text-muted-foreground capitalize">({member.role.replace('_', ' ')})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Candidate Feedback</CardTitle>
              <CardDescription>Evaluate and share thoughts on candidates</CardDescription>
            </div>
            <div className="flex items-center">
              <div className="mr-4 flex items-center gap-1">
                {getRecommendationIcon()}
                <span className={`font-medium ${getRecommendationColor()}`}>
                  {getHiringRecommendation()}
                </span>
              </div>
              <Button onClick={() => setIsAddFeedbackOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feedback
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {feedback.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6 p-4 rounded-md bg-secondary/30">
                <div className="text-center">
                  <div className="text-3xl font-bold">{getOverallRating()}</div>
                  <div className="text-sm text-muted-foreground">Overall Rating</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Team Alignment</span>
                    <span className="font-medium">
                      {feedback.length > 1 ? 'High' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Reviews</span>
                    <span className="font-medium">
                      {feedback.length} team member{feedback.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4 grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="positive">Positive</TabsTrigger>
                  <TabsTrigger value="concerns">Concerns</TabsTrigger>
                  <TabsTrigger value="final">Final Decision</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="space-y-4">
                  {feedback.map((item) => {
                    const author = getTeamMemberById(item.authorId);
                    return (
                      <div key={item.id} className="border rounded-md p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>{author?.name.charAt(0) || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{author?.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {getStageLabel(item.stage)} • {new Date(item.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm">{item.comment}</p>
                      </div>
                    );
                  })}
                </TabsContent>
                
                <TabsContent value="positive">
                  {feedback.filter(item => item.rating >= 4).length > 0 ? (
                    <div className="space-y-4">
                      {feedback
                        .filter(item => item.rating >= 4)
                        .map((item) => {
                          const author = getTeamMemberById(item.authorId);
                          return (
                            <div key={item.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{author?.name.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{author?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {getStageLabel(item.stage)} • {new Date(item.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm">{item.comment}</p>
                            </div>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No positive feedback yet
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="concerns">
                  {feedback.filter(item => item.rating < 4).length > 0 ? (
                    <div className="space-y-4">
                      {feedback
                        .filter(item => item.rating < 4)
                        .map((item) => {
                          const author = getTeamMemberById(item.authorId);
                          return (
                            <div key={item.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{author?.name.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{author?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {getStageLabel(item.stage)} • {new Date(item.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm">{item.comment}</p>
                            </div>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No concerns reported
                    </p>
                  )}
                </TabsContent>
                
                <TabsContent value="final">
                  {feedback.filter(item => item.stage === 'final_decision').length > 0 ? (
                    <div className="space-y-4">
                      {feedback
                        .filter(item => item.stage === 'final_decision')
                        .map((item) => {
                          const author = getTeamMemberById(item.authorId);
                          return (
                            <div key={item.id} className="border rounded-md p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarFallback>{author?.name.charAt(0) || '?'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{author?.name || 'Unknown'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Final Decision • {new Date(item.timestamp).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-4 w-4 ${
                                        star <= item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm">{item.comment}</p>
                            </div>
                          );
                        })
                      }
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No final decisions yet
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : candidate ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No feedback provided for this candidate yet</p>
              <Button 
                variant="outline" 
                onClick={() => setIsAddFeedbackOpen(true)}
                className="mt-4"
              >
                Add the first feedback
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Select a candidate to see or add feedback</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Feedback Dialog */}
      <Dialog open={isAddFeedbackOpen} onOpenChange={setIsAddFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Candidate Feedback</DialogTitle>
            <DialogDescription>
              Share your assessment of the candidate with the team
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`px-3 ${newRating >= rating ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                    onClick={() => setNewRating(rating)}
                  >
                    {rating}
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-foreground pt-1">
                <span>Not a fit</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Evaluation Stage</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={stage === "resume_review" ? "default" : "outline"}
                  onClick={() => setStage("resume_review")}
                  className="justify-start"
                >
                  Resume Review
                </Button>
                <Button
                  type="button"
                  variant={stage === "phone_screen" ? "default" : "outline"}
                  onClick={() => setStage("phone_screen")}
                  className="justify-start"
                >
                  Phone Screen
                </Button>
                <Button
                  type="button"
                  variant={stage === "interview" ? "default" : "outline"}
                  onClick={() => setStage("interview")}
                  className="justify-start"
                >
                  Interview
                </Button>
                <Button
                  type="button"
                  variant={stage === "final_decision" ? "default" : "outline"}
                  onClick={() => setStage("final_decision")}
                  className="justify-start"
                >
                  Final Decision
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Feedback</Label>
              <Textarea
                placeholder="Share your assessment of the candidate's skills, fit for the role, etc."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddFeedback}>
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Team Dialog */}
      <Dialog open={isInviteTeamOpen} onOpenChange={setIsInviteTeamOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add colleagues to collaborate on candidate evaluation
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                placeholder="colleague@company.com" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={roleInput === "recruiter" ? "default" : "outline"}
                  onClick={() => setRoleInput("recruiter")}
                  className="justify-start"
                >
                  Recruiter
                </Button>
                <Button
                  type="button"
                  variant={roleInput === "hiring_manager" ? "default" : "outline"}
                  onClick={() => setRoleInput("hiring_manager")}
                  className="justify-start"
                >
                  Hiring Manager
                </Button>
                <Button
                  type="button"
                  variant={roleInput === "interviewer" ? "default" : "outline"}
                  onClick={() => setRoleInput("interviewer")}
                  className="justify-start"
                >
                  Interviewer
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteTeamOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleInviteTeamMember}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaborativeFeedback;
