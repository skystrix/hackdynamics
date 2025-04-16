
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Paperclip, Send, Download, User, Clock } from "lucide-react";
import { Message, Candidate, Attachment } from "@/lib/types";
import { toast } from "sonner";

interface MessagingSystemProps {
  candidate: Candidate;
  onClose: () => void;
}

const MessagingSystem = ({ candidate, onClose }: MessagingSystemProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const currentUserId = "recruiter-1"; // In a real app, this would be from auth
  
  // Load existing messages from localStorage on component mount
  useEffect(() => {
    const storedMessages = localStorage.getItem(`messages-${candidate.id}`);
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages) as Message[];
      
      // Mark all messages as read when opened
      const updatedMessages = parsedMessages.map(msg => {
        if (msg.receiverId === currentUserId && !msg.isRead) {
          return { ...msg, isRead: true };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      
      // Save the updated read status back to localStorage
      localStorage.setItem(`messages-${candidate.id}`, JSON.stringify(updatedMessages));
    } else {
      // Add a welcome message if no conversation exists
      const initialMessage: Message = {
        id: "welcome",
        senderId: candidate.id,
        receiverId: currentUserId,
        content: `Hello! I'm ${candidate.name}. Feel free to ask me any questions about my experience or skills.`,
        timestamp: new Date().toISOString(),
        isRead: true
      };
      setMessages([initialMessage]);
      localStorage.setItem(`messages-${candidate.id}`, JSON.stringify([initialMessage]));
    }
  }, [candidate.id]);

  const handleSendMessage = () => {
    if (!newMessage.trim() && attachments.length === 0) {
      toast.error("Please enter a message or attach a file");
      return;
    }
    
    // In a real app, we would upload attachments to a server and get URLs
    const messageAttachments: Attachment[] = attachments.map((file, index) => ({
      id: `att-${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      size: file.size
    }));
    
    const newMessageObj: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      receiverId: candidate.id,
      content: newMessage.trim(),
      attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    const updatedMessages = [...messages, newMessageObj];
    setMessages(updatedMessages);
    localStorage.setItem(`messages-${candidate.id}`, JSON.stringify(updatedMessages));
    
    setNewMessage("");
    setAttachments([]);
    
    toast.success("Message sent successfully");
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold">{candidate.name}</h3>
              <p className="text-sm text-muted-foreground">{candidate.title}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden pt-4">
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {messages.map((message) => {
              const isSelf = message.senderId === currentUserId;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isSelf 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.attachments.map((attachment) => (
                          <div 
                            key={attachment.id}
                            className="flex items-center gap-2 text-sm rounded bg-background/20 p-1.5"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="truncate">{attachment.name}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 ml-auto"
                              onClick={() => window.open(attachment.url)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`text-xs mt-1 ${isSelf ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatDate(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex flex-col border-t pt-3">
        {attachments.length > 0 && (
          <div className="mb-2 w-full">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-1.5 text-xs rounded-full bg-secondary px-2.5 py-1"
                >
                  <Paperclip className="h-3 w-3" />
                  <span className="max-w-[140px] truncate">{file.name}</span>
                  <button 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => removeAttachment(index)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex w-full items-end gap-2">
          <div className="flex-grow">
            <Textarea 
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="rounded-md p-2 hover:bg-secondary">
                <Paperclip className="h-5 w-5" />
              </div>
              <Input 
                id="file-upload" 
                type="file" 
                className="sr-only" 
                multiple
                onChange={handleFileChange} 
              />
            </Label>
            <Button 
              size="icon" 
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MessagingSystem;
