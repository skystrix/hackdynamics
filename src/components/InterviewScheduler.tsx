
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { format, addHours, parse, setHours, setMinutes } from "date-fns";
import { toast } from "sonner";
import { CalendarIntegration, InterviewSlot, Candidate } from "@/lib/types";
import { Calendar as CalendarIcon, Clock, Video, MapPin, Plus, Check, X, ExternalLink, Link2 } from "lucide-react";

interface InterviewSchedulerProps {
  candidate?: Candidate;
  jobId?: string;
}

const sampleTimeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", 
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", 
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM"
];

const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ candidate, jobId }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isConnectCalendarDialogOpen, setIsConnectCalendarDialogOpen] = useState(false);
  const [calendarProvider, setCalendarProvider] = useState<"google" | "calendly" | "outlook">("google");
  const [interviewType, setInterviewType] = useState<"video" | "in-person" | "phone">("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [calendarIntegrations, setCalendarIntegrations] = useState<CalendarIntegration[]>([
    { 
      provider: "google", 
      connected: false 
    },
    { 
      provider: "calendly", 
      connected: false 
    },
    { 
      provider: "outlook", 
      connected: false 
    }
  ]);

  const handleScheduleInterview = () => {
    if (!date || !selectedTimeSlot) {
      toast.error("Please select a date and time");
      return;
    }

    // Parse the time slot
    const [hours, minutes, period] = selectedTimeSlot.match(/(\d+):(\d+)\s(AM|PM)/)?.slice(1) || [];
    if (!hours || !minutes || !period) return;
    
    let hour = parseInt(hours);
    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    
    const startTime = new Date(date);
    startTime.setHours(hour);
    startTime.setMinutes(parseInt(minutes));
    
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    // Create interview object
    const interview: InterviewSlot = {
      id: `interview-${Date.now()}`,
      candidateId: candidate?.id || "unknown",
      jobId: jobId || "unknown",
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      status: "scheduled",
      notes: interviewNotes,
      location: interviewType === "in-person" ? location : undefined,
      meetingUrl: interviewType === "video" ? meetingLink : undefined
    };

    // In a real app, we would save this interview to a database or API
    // For now, just log it and show a success message
    console.log("Scheduled interview:", interview);
    
    toast.success(`Interview scheduled with ${candidate?.name || "candidate"} on ${format(startTime, "PPP")} at ${format(startTime, "h:mm a")}`);
    
    // Close the dialog and reset form
    setIsScheduleDialogOpen(false);
    setSelectedTimeSlot(null);
    setInterviewNotes("");
    setMeetingLink("");
    setLocation("");
  };

  const handleConnectCalendar = () => {
    // In a real app, this would redirect to OAuth flow
    console.log(`Connecting to ${calendarProvider} calendar`);
    
    // Simulating successful connection
    const updatedIntegrations = calendarIntegrations.map(integration => 
      integration.provider === calendarProvider 
        ? { 
            ...integration, 
            connected: true, 
            accountEmail: "user@example.com",
            lastSync: new Date().toISOString()
          }
        : integration
    );
    
    setCalendarIntegrations(updatedIntegrations);
    toast.success(`Successfully connected to ${calendarProvider}`);
    setIsConnectCalendarDialogOpen(false);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Interview Scheduling</CardTitle>
          <CardDescription>
            Schedule interviews with candidates and sync with your calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {calendarIntegrations.map(integration => (
                <Button
                  key={integration.provider}
                  variant={integration.connected ? "default" : "outline"}
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => integration.connected ? 
                    toast.info(`Connected to ${integration.provider} as ${integration.accountEmail}`) : 
                    setIsConnectCalendarDialogOpen(true)
                  }
                >
                  {integration.connected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span className="capitalize">{integration.provider}</span>
                </Button>
              ))}
            </div>

            {candidate ? (
              <div className="bg-secondary/30 p-3 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                    {candidate.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{candidate.name}</p>
                    <p className="text-sm text-muted-foreground">{candidate.title}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No candidate selected</p>
            )}

            <Button 
              className="w-full" 
              onClick={() => setIsScheduleDialogOpen(true)}
              disabled={!candidate}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Interview Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              {candidate ? `Schedule an interview with ${candidate.name}` : 'Select date and time for the interview'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Tabs defaultValue="date" className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="date">Date & Time</TabsTrigger>
                <TabsTrigger value="details">Interview Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="date" className="space-y-4">
                <div className="flex justify-center py-2">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(day) => day < new Date()}
                    initialFocus
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Select Time</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {sampleTimeSlots.map(timeSlot => (
                      <Button
                        key={timeSlot}
                        type="button"
                        variant={selectedTimeSlot === timeSlot ? "default" : "outline"}
                        className="text-xs"
                        onClick={() => setSelectedTimeSlot(timeSlot)}
                      >
                        {timeSlot}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label>Interview Type</Label>
                  <Select value={interviewType} onValueChange={(value: any) => setInterviewType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="in-person">In-person</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {interviewType === "video" && (
                  <div className="space-y-2">
                    <Label>Meeting Link</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={meetingLink}
                        onChange={(e) => setMeetingLink(e.target.value)}
                      />
                      <Button type="button" variant="outline" size="icon">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                {interviewType === "in-person" && (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input 
                      placeholder="Office address or meeting room"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Interview Notes</Label>
                  <Textarea
                    placeholder="Add notes or instructions for the candidate"
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleScheduleInterview}>Schedule Interview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connect Calendar Dialog */}
      <Dialog open={isConnectCalendarDialogOpen} onOpenChange={setIsConnectCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Calendar</DialogTitle>
            <DialogDescription>
              Connect your calendar to automatically sync interview schedules
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Calendar Provider</Label>
              <Select 
                value={calendarProvider} 
                onValueChange={(value: any) => setCalendarProvider(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google Calendar</SelectItem>
                  <SelectItem value="calendly">Calendly</SelectItem>
                  <SelectItem value="outlook">Microsoft Outlook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-secondary/30 p-3 rounded-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  {calendarProvider === "google" && <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M6 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-8.25 6h3v3h-3v-3zm0 4.5h3v3h-3v-3zm-4.5-4.5h3v3h-3v-3zm0 4.5h3v3h-3v-3zm9 0h3v3h-3v-3zm0-4.5h3v3h-3v-3z" fill="currentColor"/></svg>}
                  {calendarProvider === "calendly" && <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor"/></svg>}
                  {calendarProvider === "outlook" && <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M21.17 3.25H13.4c-1.24 0-2.25.77-2.25 1.72v14.05c0 .95 1.01 1.72 2.25 1.72h7.77c1.24 0 2.25-.77 2.25-1.72V4.97c0-.95-1.01-1.72-2.25-1.72zm.28 15.77c0 .09-.11.17-.28.17H13.4c-.17 0-.28-.08-.28-.17V4.97c0-.09.11-.17.28-.17h7.77c.17 0 .28.08.28.17v14.05zM8.38 4.56c.28.38.42.84.42 1.34 0 .5-.14.96-.42 1.34l-3.56 4.78v.36l3.56 4.78c.28.38.42.84.42 1.34 0 .5-.14.96-.42 1.34l-.36.5c-.39.5-1.06.81-1.77.8-.38 0-.75-.1-1.07-.3-.32-.2-.57-.47-.73-.8L.52 12l4.01-7.44c.16-.33.41-.6.73-.8.32-.2.69-.3 1.07-.3.71 0 1.38.31 1.77.8l.28.3z" fill="currentColor"/></svg>}
                </div>
                <div>
                  <p className="font-medium capitalize">{calendarProvider}</p>
                  <p className="text-xs text-muted-foreground">
                    {calendarProvider === "google" && "Sync with your Google Calendar"}
                    {calendarProvider === "calendly" && "Connect your Calendly account"}
                    {calendarProvider === "outlook" && "Sync with Microsoft Outlook Calendar"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {calendarProvider === "google" && "You'll be redirected to Google for authentication"}
              {calendarProvider === "calendly" && "You'll be redirected to Calendly for authentication"}
              {calendarProvider === "outlook" && "You'll be redirected to Microsoft for authentication"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsConnectCalendarDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleConnectCalendar}>
                Connect
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterviewScheduler;
