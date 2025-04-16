import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { CheckCheck, MessageSquare } from "lucide-react";
import { Conversation, Candidate, Message } from "@/lib/types";
import { candidates } from "@/data/candidates";

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  emptyMessage?: string;
}

const ConversationList = ({
  conversations,
  currentUserId,
  onSelectConversation,
  emptyMessage = "No messages yet"
}: ConversationListProps) => {
  const getParticipantDetails = (conversation: Conversation): Candidate | null => {
    const participantId = conversation.participants.find(id => id !== currentUserId);
    if (!participantId) return null;
    
    return candidates.find(candidate => candidate.id === participantId) || null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If same day, show time
    if (date.toDateString() === now.toDateString()) {
      return new Intl.DateTimeFormat('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).format(date);
    }
    
    // If within last 7 days, show day name
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    }
    
    // Otherwise show date
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }).format(date);
  };

  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessage) return "";
    
    const { content } = conversation.lastMessage;
    return content.length > 40 ? `${content.substring(0, 37)}...` : content;
  };

  const hasUnreadMessages = (conversation: Conversation) => {
    // In a real app, we would check if there are unread messages
    // For now, let's just assume some conversations have unread messages
    const storageKey = `messages-${conversation.id}`;
    const storedMessages = localStorage.getItem(storageKey);
    
    if (storedMessages) {
      const messages = JSON.parse(storedMessages) as Message[];
      return messages.some(msg => 
        msg.receiverId === currentUserId && !msg.isRead
      );
    }
    
    return false;
  };
  
  if (conversations.length === 0) {
    return (
      <div className="text-center p-8">
        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">No conversations</h3>
        <p className="text-muted-foreground mb-6">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <Card>
      <ScrollArea className="h-[calc(100vh-300px)]">
        {conversations.map((conversation) => {
          const participant = getParticipantDetails(conversation);
          const isUnread = hasUnreadMessages(conversation);
          
          return (
            <button
              key={conversation.id}
              className={`w-full text-left px-4 py-3 border-b hover:bg-accent/20 transition-colors ${
                isUnread ? 'bg-accent/10' : ''
              }`}
              onClick={() => onSelectConversation(conversation)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-lg font-semibold">
                    {participant?.name.charAt(0)}
                  </div>
                  {isUnread && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <span className={`font-medium ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                      {participant?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(conversation.updatedAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className={`text-sm truncate ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {getLastMessagePreview(conversation)}
                    </p>
                    {conversation.lastMessage?.senderId === currentUserId && (
                      <CheckCheck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </Card>
  );
};

export default ConversationList;
