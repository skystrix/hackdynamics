
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const About = () => {
  const teamMembers = [
    {
      name: "Alex Johnson",
      title: "CEO & Co-founder",
      image: "/placeholder.svg",
    },
    {
      name: "Sarah Williams",
      title: "CTO & Co-founder",
      image: "/placeholder.svg",
    },
    {
      name: "Michael Chen",
      title: "Head of Product",
      image: "/placeholder.svg",
    },
    {
      name: "Priya Patel",
      title: "Director of Engineering",
      image: "/placeholder.svg",
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-gradient-to-b from-accent/50 to-background pt-20 pb-16">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">About JobSpark</h1>
            <p className="text-xl text-muted-foreground">
              Connecting talented engineers with innovative companies since 2018
            </p>
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        <section className="py-16 container">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl mb-8">
              We believe that finding the right job—or the right candidate—shouldn't be left to chance. 
              JobSpark was founded with a simple goal: to create a more efficient, transparent, and 
              human-centered hiring process for the tech industry.
            </p>
            <p className="mb-8">
              Unlike traditional job boards that focus on quantity over quality, we've built a platform 
              that understands the unique needs of software engineers and the companies that hire them. 
              Our matching algorithm considers not just skills and experience, but also values, working 
              styles, and career goals.
            </p>
          </div>
        </section>
        
        <section className="py-16 bg-accent/20">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3">
                    <div className="aspect-square bg-muted rounded-lg"></div>
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-2">From Engineers, For Engineers</h3>
                    <p>
                      JobSpark was founded by software engineers who experienced firsthand the frustration 
                      of traditional job searching. After countless mismatched interviews and vague job descriptions, 
                      they decided to build the platform they wished existed.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                  <div className="md:w-1/3">
                    <div className="aspect-square bg-muted rounded-lg"></div>
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-2">Growing With The Community</h3>
                    <p>
                      What started as a small project has grown into a thriving platform serving thousands of 
                      engineers and companies worldwide. Our growth has been driven by community feedback and 
                      our commitment to continuous improvement.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="md:w-1/3">
                    <div className="aspect-square bg-muted rounded-lg"></div>
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-semibold mb-2">Looking Ahead</h3>
                    <p>
                      Today, JobSpark is leading the way in reimagining tech recruitment. We're constantly 
                      innovating with new features, insights, and tools that make hiring more efficient and 
                      finding the perfect job more accessible for everyone.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 container">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Leadership Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="aspect-square bg-muted rounded-full w-32 h-32 mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-center">{member.name}</h3>
                  <p className="text-muted-foreground text-center">{member.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        
        <section className="py-16 bg-accent/20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Transparency</h3>
                  <p>
                    We believe in clear, honest communication about jobs, compensation, and company culture.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quality</h3>
                  <p>
                    We focus on meaningful connections rather than quantity of applications or listings.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                  <p>
                    We continuously improve our platform based on user feedback and emerging technologies.
                  </p>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Link to="/careers">
                  <Button>Join Our Team</Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline">Contact Us</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
