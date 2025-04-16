
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Recruiting = () => {
  const companyLogos = [
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <div className="bg-gradient-to-b from-accent/50 to-background pt-20 pb-16">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Recruiting Solutions for Tech Teams
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Find and hire top engineering talent faster with our specialized recruiting platform
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg">Schedule a Demo</Button>
              <Link to="/pricing">
                <Button size="lg" variant="outline">View Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1">
        <section className="py-16 container">
          <h2 className="text-3xl font-bold text-center mb-12">Why Companies Choose HackDynamics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Targeted Talent Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Access a curated network of pre-screened software engineers, designers, and tech professionals across all specializations.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Our intelligent algorithms connect you with candidates who match not just skill requirements, but team culture and work style.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Streamlined Hiring</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Reduce your time-to-hire by up to 50% with our efficient applicant tracking, interview scheduling, and assessment tools.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 p-8 bg-muted rounded-lg">
            <div className="text-center mb-8">
              <h3 className="text-xl font-medium">Trusted by innovative companies</h3>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {companyLogos.map((logo, index) => (
                <div key={index} className="w-24 h-12 bg-background rounded flex items-center justify-center">
                  <img src={logo} alt="Company logo" className="h-6 opacity-70" />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-accent/20">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">Recruiting Packages</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Starter</CardTitle>
                    <CardDescription>For small teams or occasional hiring</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$299</span>
                      <span className="text-muted-foreground"> /month</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Up to 3 active job postings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Basic candidate search</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Email support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Get Started</Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle>Professional</CardTitle>
                    <CardDescription>For growing teams with regular hiring needs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$699</span>
                      <span className="text-muted-foreground"> /month</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Up to 10 active job postings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Advanced candidate search</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Candidate assessments</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">Most Popular</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Enterprise</CardTitle>
                    <CardDescription>For large teams with high-volume hiring</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">Custom</span>
                    </div>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Unlimited job postings</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Custom API integration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Premium analytics</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">Contact Sales</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your recruiting?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of companies finding their ideal tech talent through HackDynamics
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg">Schedule a Demo</Button>
              <Link to="/contact">
                <Button size="lg" variant="outline">Contact Us</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Recruiting;
