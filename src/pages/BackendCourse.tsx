
import React, { useState } from "react";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  CollapsibleContent,
  CollapsibleTrigger,
  Collapsible
} from "@/components/ui/collapsible";
import { 
  FileTextIcon, 
  VideoIcon, 
  BookIcon, 
  CodeIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  BookOpenIcon,
  DatabaseIcon,
  ServerIcon,
  GlobeIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";

// Define the course content structure
interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isCompleted?: boolean;
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text";
  duration: string;
  content: string;
  isCompleted?: boolean;
}

const BackendCourse = () => {
  useProtectedRoute();
  const [activeModule, setActiveModule] = useState("fundamentals");
  const [activeLesson, setActiveLesson] = useState("intro");
  const [openModule, setOpenModule] = useState("fundamentals");
  const [activeContentType, setActiveContentType] = useState<"video" | "text">("video");

  // Course modules data
  const courseModules: CourseModule[] = [
    {
      id: "fundamentals",
      title: "Backend Fundamentals",
      description: "Core concepts and foundations of backend development",
      lessons: [
        {
          id: "intro",
          title: "Introduction to Backend Development",
          type: "video",
          duration: "8:25",
          content: "This comprehensive introduction covers what backend development is and why it's essential in modern web applications."
        },
        {
          id: "server-architecture",
          title: "Server Architecture Basics",
          type: "text",
          duration: "15 min read",
          content: "Learn about different server architectures, including monolithic, microservices, and serverless computing models."
        },
        {
          id: "rest-apis",
          title: "RESTful API Design",
          type: "video",
          duration: "12:30",
          content: "A deep dive into designing clean, efficient, and scalable REST APIs that follow industry best practices."
        }
      ]
    },
    {
      id: "databases",
      title: "Databases & Data Modeling",
      description: "Working with SQL, NoSQL, and data modeling techniques",
      lessons: [
        {
          id: "sql-intro",
          title: "SQL Database Fundamentals",
          type: "text",
          duration: "20 min read",
          content: "Master the basics of SQL databases, including schema design, relationships, and optimization techniques."
        },
        {
          id: "nosql",
          title: "NoSQL Database Solutions",
          type: "video",
          duration: "15:45",
          content: "Explore document, key-value, column-family, and graph databases and when to use each type."
        },
        {
          id: "orm",
          title: "Working with ORMs",
          type: "text",
          duration: "18 min read",
          content: "Learn how Object-Relational Mappers bridge the gap between object-oriented programming and relational databases."
        }
      ]
    },
    {
      id: "security",
      title: "Backend Security",
      description: "Essential security practices for backend systems",
      lessons: [
        {
          id: "auth",
          title: "Authentication & Authorization",
          type: "video",
          duration: "14:20",
          content: "Implement secure authentication systems using industry standards like OAuth 2.0 and JWT."
        },
        {
          id: "encryption",
          title: "Data Encryption Strategies",
          type: "text",
          duration: "15 min read",
          content: "Learn about encryption algorithms, hashing techniques, and how to properly store sensitive user data."
        },
        {
          id: "security-best",
          title: "Security Best Practices",
          type: "video",
          duration: "16:50",
          content: "Protect your backend from common vulnerabilities like SQL injection, XSS, and CSRF attacks."
        }
      ]
    },
    {
      id: "scaling",
      title: "Scaling & Performance",
      description: "Techniques for high-performance backend systems",
      lessons: [
        {
          id: "caching",
          title: "Caching Strategies",
          type: "text",
          duration: "12 min read",
          content: "Implement effective caching solutions to improve performance and reduce database load."
        },
        {
          id: "load-balancing",
          title: "Load Balancing Techniques",
          type: "video",
          duration: "13:15",
          content: "Learn how to distribute traffic across multiple servers to improve reliability and throughput."
        },
        {
          id: "optimization",
          title: "Query Optimization",
          type: "text",
          duration: "22 min read",
          content: "Master techniques for writing efficient database queries that scale with your application."
        }
      ]
    }
  ];

  // Get current module and lesson
  const currentModule = courseModules.find(module => module.id === activeModule);
  const currentLesson = currentModule?.lessons.find(lesson => lesson.id === activeLesson);

  // Handle module click
  const handleModuleClick = (moduleId: string) => {
    setOpenModule(openModule === moduleId ? "" : moduleId);
    if (openModule !== moduleId) {
      const module = courseModules.find(m => m.id === moduleId);
      if (module && module.lessons.length > 0) {
        setActiveModule(moduleId);
        setActiveLesson(module.lessons[0].id);
      }
    }
  };

  // Handle lesson click
  const handleLessonClick = (moduleId: string, lessonId: string) => {
    setActiveModule(moduleId);
    setActiveLesson(lessonId);
    const lesson = courseModules.find(m => m.id === moduleId)?.lessons.find(l => l.id === lessonId);
    if (lesson) {
      setActiveContentType(lesson.type);
    }
  };

  // Function to get the appropriate icon for a lesson
  const getLessonIcon = (type: "video" | "text") => {
    return type === "video" ? <VideoIcon className="h-4 w-4" /> : <FileTextIcon className="h-4 w-4" />;
  };

  // Function to get the appropriate module icon
  const getModuleIcon = (moduleId: string) => {
    switch (moduleId) {
      case "fundamentals":
        return <BookOpenIcon className="h-5 w-5" />;
      case "databases":
        return <DatabaseIcon className="h-5 w-5" />;
      case "security":
        return <ServerIcon className="h-5 w-5" />;
      case "scaling":
        return <GlobeIcon className="h-5 w-5" />;
      default:
        return <BookIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col dark:bg-gray-900">
      <Navbar />
      
      <div className="container max-w-7xl mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Course sidebar */}
          <div className="lg:w-1/4 space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-8 w-8">
                <Logo className="text-primary" />
              </div>
              <h2 className="text-xl font-bold">Backend Engineering</h2>
            </div>
            
            <div className="bg-card rounded-lg border shadow-sm p-2">
              <div className="space-y-1">
                {courseModules.map((module) => (
                  <div key={module.id} className="rounded-md overflow-hidden">
                    <Collapsible
                      open={openModule === module.id}
                      className="border-b last:border-b-0"
                    >
                      <CollapsibleTrigger 
                        className={`flex items-center justify-between w-full p-3 text-left hover:bg-accent rounded-md ${activeModule === module.id ? 'bg-accent/50' : ''}`}
                        onClick={() => handleModuleClick(module.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-primary">{getModuleIcon(module.id)}</span>
                          <span className="font-medium">{module.title}</span>
                        </div>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${openModule === module.id ? 'transform rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-1 pl-7">
                        {module.lessons.map((lesson) => (
                          <Button 
                            key={lesson.id}
                            variant="ghost"
                            className={`w-full justify-start text-left pl-4 ${activeLesson === lesson.id ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => handleLessonClick(module.id, lesson.id)}
                          >
                            <span className="mr-2">{getLessonIcon(lesson.type)}</span>
                            <span className="truncate">{lesson.title}</span>
                            {lesson.isCompleted && <CheckCircleIcon className="h-4 w-4 ml-2 text-green-500" />}
                          </Button>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="lg:w-3/4">
            {currentLesson && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">{currentLesson.title}</h1>
                    <p className="text-muted-foreground">{currentModule?.title} • {currentLesson.duration}</p>
                  </div>
                  <Tabs 
                    defaultValue={currentLesson.type} 
                    value={activeContentType}
                    onValueChange={(value) => setActiveContentType(value as "video" | "text")}
                    className="w-full md:w-auto"
                  >
                    <TabsList className="grid w-full md:w-auto grid-cols-2 md:inline-flex">
                      <TabsTrigger value="video" className="flex items-center gap-2" disabled={currentLesson.type !== "video"}>
                        <VideoIcon className="h-4 w-4" />
                        Video
                      </TabsTrigger>
                      <TabsTrigger value="text" className="flex items-center gap-2" disabled={currentLesson.type !== "text"}>
                        <FileTextIcon className="h-4 w-4" />
                        Text
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {activeContentType === "video" && currentLesson.type === "video" && (
                  <div className="relative rounded-lg overflow-hidden aspect-video bg-black">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white p-6 max-w-lg">
                        <CodeIcon className="h-16 w-16 mx-auto mb-4 opacity-75" />
                        <h3 className="text-xl font-semibold mb-2">Video Content Placeholder</h3>
                        <p className="text-gray-300">
                          This is where the video lecture would be embedded in a production environment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeContentType === "text" && currentLesson.type === "text" && (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="p-6 rounded-lg border bg-card">
                      <h2 className="text-2xl font-semibold mb-4">{currentLesson.title}</h2>
                      <p className="mb-4">{currentLesson.content}</p>
                      
                      <p className="mb-4">
                        Backend development forms the foundation of web applications, managing server-side operations, database 
                        interactions, and API integrations that power user experiences.
                      </p>
                      
                      <h3 className="text-xl font-semibold mb-3">Key Concepts</h3>
                      <ul className="list-disc pl-5 space-y-2 mb-4">
                        <li>Server-side programming languages (Node.js, Python, Java, etc.)</li>
                        <li>Database management and optimization</li>
                        <li>API design and implementation</li>
                        <li>Authentication and authorization</li>
                        <li>Server architecture and infrastructure</li>
                      </ul>
                      
                      <p className="mb-4">
                        Modern backend systems often employ microservices architecture, allowing for scalability and 
                        maintainability through decomposed services that communicate via APIs.
                      </p>
                      
                      <h3 className="text-xl font-semibold mb-3">Best Practices</h3>
                      <ol className="list-decimal pl-5 space-y-2 mb-4">
                        <li>Implement comprehensive error handling and logging</li>
                        <li>Design with security at the forefront</li>
                        <li>Cache frequently accessed data to improve performance</li>
                        <li>Follow RESTful principles for API design</li>
                        <li>Write automated tests for critical functionality</li>
                      </ol>
                    </div>
                  </div>
                )}
                
                {/* Course navigation */}
                <div className="flex justify-between pt-6 border-t mt-8">
                  <Button variant="outline" className="gap-2">
                    Previous Lesson
                  </Button>
                  <Button className="gap-2">
                    Next Lesson <ChevronDownIcon className="h-4 w-4 rotate-270" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default BackendCourse;
