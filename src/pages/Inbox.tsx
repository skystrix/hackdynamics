import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Reply,
  Trash,
  Archive,
  User,
  Briefcase,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Plus,
  Send,
  Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType, Message as MessageType } from "@/lib/types";

const mockUsers: UserType[] = [
  {
    id: "user-1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "employer",
    avatar: "https://github.com/shadcn.png",
  },
  {
    id: "user-2",
    name: "Alice Smith",
    email: "alice.smith@example.com",
    role: "candidate",
    avatar: "https://avatars.githubusercontent.com/u/8822082?v=4",
  },
  {
    id: "user-3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "candidate",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bob",
  },
];

const mockMessages: MessageType[] = [
  {
    id: "msg-1",
    senderId: "user-1",
    receiverId: "user-2",
    content: "Hello Alice, I'd like to schedule an interview.",
    timestamp: "2024-01-28T14:30:00Z",
    isRead: false,
  },
  {
    id: "msg-2",
    senderId: "user-2",
    receiverId: "user-1",
    content: "Hi John, that sounds great! How about Tuesday at 10 AM?",
    timestamp: "2024-01-28T15:00:00Z",
    isRead: true,
  },
  {
    id: "msg-3",
    senderId: "user-3",
    receiverId: "user-1",
    content: "Dear John, I am interested in the job posting...",
    timestamp: "2024-01-29T09:00:00Z",
    isRead: false,
  },
];

const Inbox = () => {
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messages, setMessages] = useState(mockMessages);
  const currentUser = mockUsers[0]; // Assuming the logged-in user is the first one

  const filteredUsers = mockUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) && user.id !== currentUser.id
  );

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    // Mark messages as read when user is selected
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.senderId === user.id && msg.receiverId === currentUser.id ? { ...msg, isRead: true } : msg
      )
    );
  };

  const handleSendMessage = () => {
    if (selectedUser && messageContent.trim() !== "") {
      const newMessage: MessageType = {
        id: `msg-${messages.length + 1}`,
        senderId: currentUser.id,
        receiverId: selectedUser.id,
        content: messageContent,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
      setMessages([...messages, newMessage]);
      setMessageContent("");
    }
  };

  const getUnreadMessagesCount = (user: UserType) => {
    return messages.filter((msg) => msg.senderId === user.id && msg.receiverId === currentUser.id && !msg.isRead)
      .length;
  };

  const getMessagesForSelectedUser = () => {
    if (!selectedUser) return [];
    return messages
      .filter(
        (msg) =>
          (msg.senderId === currentUser.id && msg.receiverId === selectedUser.id) ||
          (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id)
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const isEmployer = currentUser.role === "employer" as const;

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contacts</CardTitle>
              <CardDescription>
                {isEmployer ? "Candidates who have applied" : "Employers who have contacted you"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Separator className="my-4" />
              <ScrollArea className="h-[400px]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md hover:bg-secondary cursor-pointer",
                        selectedUser?.id === user.id ? "bg-accent" : ""
                      )}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      {getUnreadMessagesCount(user) > 0 && (
                        <Badge variant="secondary">{getUnreadMessagesCount(user)}</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No contacts found.</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Message Area */}
        <div className="md:col-span-2">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback>{selectedUser.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{selectedUser.name}</CardTitle>
                    <CardDescription>{selectedUser.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-[300px] pr-4">
                  {getMessagesForSelectedUser().map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "mb-2 p-3 rounded-md",
                        message.senderId === currentUser.id ? "bg-primary text-primary-foreground ml-auto w-fit" : "bg-secondary mr-auto w-fit"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </ScrollArea>
                <div className="flex items-center space-x-2">
                  <Textarea
                    placeholder="Type your message here..."
                    className="flex-grow"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  />
                  <Button type="button" onClick={handleSendMessage}>
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">Select a contact to view messages.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
