
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import { 
  BookIcon,
  FileTextIcon,
  BookOpenIcon,
  GraduationCapIcon,
  NewspaperIcon,
  VideoIcon,
  LinkIcon,
  DownloadIcon,
  ExternalLinkIcon
} from "lucide-react";

const Resources = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16">
          <div className="container max-w-4xl mx-auto text-center px-4">
            <h1 className="text-4xl font-bold mb-6">Career Resources</h1>
            <p className="text-xl mb-8">
              Explore our curated resources to help you advance your career in tech
            </p>
          </div>
        </section>
        
        <div className="container py-12">
          <Tabs defaultValue="guides" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-xl mx-auto mb-8">
              <TabsTrigger value="guides">
                <BookOpenIcon className="mr-2 h-4 w-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="interviews">
                <FileTextIcon className="mr-2 h-4 w-4" />
                Interviews
              </TabsTrigger>
              <TabsTrigger value="learning">
                <GraduationCapIcon className="mr-2 h-4 w-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="trends">
                <NewspaperIcon className="mr-2 h-4 w-4" />
                Trends
              </TabsTrigger>
            </TabsList>
            
            {/* Guides Tab */}
            <TabsContent value="guides">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ResourceCard
                  title="Resume Writing Masterclass"
                  description="Learn how to craft a resume that stands out to hiring managers and passes ATS systems."
                  icon={<FileTextIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Salary Negotiation Guide"
                  description="Proven techniques to negotiate the best compensation package for your skills and experience."
                  icon={<BookIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Remote Work Playbook"
                  description="Best practices for finding, securing, and excelling in remote tech positions."
                  icon={<BookOpenIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Career Transition Guide"
                  description="Step-by-step playbook for professionals looking to switch to a career in technology."
                  icon={<BookOpenIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Portfolio Building Workshop"
                  description="Tips for creating an impressive portfolio that showcases your technical skills and projects."
                  icon={<FileTextIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Freelance Developer Guide"
                  description="How to build a successful freelance career in software development."
                  icon={<BookIcon />}
                  link="#"
                />
              </div>
            </TabsContent>
            
            {/* Interviews Tab */}
            <TabsContent value="interviews">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ResourceCard
                  title="Technical Interview Preparation"
                  description="Comprehensive guide to ace coding interviews at top tech companies."
                  icon={<FileTextIcon />}
                  link="#"
                />
                <ResourceCard
                  title="System Design Interview Questions"
                  description="Practice questions and solutions for system design interviews."
                  icon={<FileTextIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Behavioral Interview Questions"
                  description="Common behavioral questions and how to structure compelling answers using the STAR method."
                  icon={<FileTextIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Mock Interview Platform"
                  description="Practice with peer-to-peer technical interviews to gain confidence."
                  icon={<VideoIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Interview Success Stories"
                  description="Learn from candidates who successfully landed roles at top tech companies."
                  icon={<BookOpenIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Interview Question Database"
                  description="Searchable collection of real interview questions from leading tech companies."
                  icon={<FileTextIcon />}
                  link="#"
                />
              </div>
            </TabsContent>
            
            {/* Learning Tab */}
            <TabsContent value="learning">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ResourceCard
                  title="Front-End Development Path"
                  description="Comprehensive curriculum to master modern front-end development."
                  icon={<GraduationCapIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Back-End Engineering Resources"
                  description="Learning path for server-side programming, databases, and API design."
                  icon={<GraduationCapIcon />}
                  link="/backend-course"
                  isLinkInternal={true}
                />
                <ResourceCard
                  title="Machine Learning Foundations"
                  description="Introduction to machine learning concepts, algorithms, and practical applications."
                  icon={<GraduationCapIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Cloud Computing Essentials"
                  description="Learn AWS, Azure, and GCP fundamentals for modern cloud-native applications."
                  icon={<GraduationCapIcon />}
                  link="#"
                />
                <ResourceCard
                  title="DevOps & CI/CD Pipeline Workshop"
                  description="Practical guide to implementing efficient development operations workflows."
                  icon={<VideoIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Coding Challenge Platform"
                  description="Sharpen your algorithmic skills with our curated programming challenges."
                  icon={<LinkIcon />}
                  link="#"
                />
              </div>
            </TabsContent>
            
            {/* Trends Tab */}
            <TabsContent value="trends">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <ResourceCard
                  title="2025 Tech Salary Report"
                  description="Comprehensive analysis of software engineering compensation trends across roles and regions."
                  icon={<NewspaperIcon />}
                  link="#"
                  isDownloadable
                />
                <ResourceCard
                  title="Emerging Technologies Report"
                  description="Analysis of emerging tech trends and their impact on the job market."
                  icon={<NewspaperIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Remote Work Trends"
                  description="How remote and hybrid work is reshaping the tech industry landscape."
                  icon={<NewspaperIcon />}
                  link="#"
                />
                <ResourceCard
                  title="AI in Software Development"
                  description="How artificial intelligence is transforming the software development lifecycle."
                  icon={<NewspaperIcon />}
                  link="#"
                />
                <ResourceCard
                  title="Quarterly Tech Hiring Report"
                  description="Stay updated on hiring trends, in-demand skills, and market opportunities."
                  icon={<NewspaperIcon />}
                  link="#"
                  isDownloadable
                />
                <ResourceCard
                  title="Future of Work Podcast"
                  description="Interviews with industry leaders about the evolving nature of tech careers."
                  icon={<VideoIcon />}
                  link="#"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Newsletter Section */}
          <div className="mt-16 bg-accent/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="mb-6 max-w-lg mx-auto">
              Subscribe to our newsletter for the latest resources, job market insights, and career opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="px-4 py-2 rounded-md border flex-grow"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

// Helper component for resource cards
const ResourceCard = ({ 
  title, 
  description, 
  icon, 
  link, 
  isDownloadable = false, 
  isLinkInternal = false
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  link: string; 
  isDownloadable?: boolean;
  isLinkInternal?: boolean;
}) => {
  const cardContent = (
    <>
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {isLinkInternal ? (
        <Button variant="outline" className="w-full">
          <ExternalLinkIcon className="mr-2 h-4 w-4" /> View Course
        </Button>
      ) : (
        <Button variant="outline" className="w-full">
          {isDownloadable ? (
            <>
              <DownloadIcon className="mr-2 h-4 w-4" /> Download
            </>
          ) : (
            <>
              <ExternalLinkIcon className="mr-2 h-4 w-4" /> View Resource
            </>
          )}
        </Button>
      )}
    </>
  );

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all">
      <CardContent className="p-6">
        {isLinkInternal ? (
          <Link to={link} className="block">
            {cardContent}
          </Link>
        ) : (
          <a href={link} target="_blank" rel="noopener noreferrer">
            {cardContent}
          </a>
        )}
      </CardContent>
    </Card>
  );
};

export default Resources;
