
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ResumeTips = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Software Engineer Resume Tips</h1>
          <p className="text-muted-foreground mb-8">
            Stand out from the crowd with these expert resume tips for tech professionals.
          </p>

          <div className="space-y-12">
            <section>
              <h2 className="text-2xl font-semibold mb-6">Resume Structure</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="text-green-500 h-5 w-5" />
                      Do This
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Keep your resume to one page (two pages max if you have 10+ years of experience)</li>
                      <li>Use a clean, professional template with consistent formatting</li>
                      <li>Include your GitHub, portfolio, or LinkedIn URLs</li>
                      <li>Organize sections in order of relevance to the job</li>
                      <li>Use PDF format for submitting your resume</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <XCircle className="text-red-500 h-5 w-5" />
                      Avoid This
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Using generic objectives or summaries</li>
                      <li>Including irrelevant work experience</li>
                      <li>Using fancy fonts or complex designs</li>
                      <li>Including a photo (unless it's standard in your region)</li>
                      <li>Adding personal information like age or marital status</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Highlighting Technical Skills</h2>
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <p className="mb-4">
                    When it comes to showcasing your technical skills as a developer, organization and relevance 
                    are key. Here's how to effectively present your technical expertise:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Group Skills by Category</h3>
                      <p className="text-muted-foreground">
                        Organize your skills into clear categories such as:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 mt-2">
                        <ul className="list-disc pl-5">
                          <li>Programming Languages</li>
                          <li>Frameworks & Libraries</li>
                        </ul>
                        <ul className="list-disc pl-5">
                          <li>Tools & Platforms</li>
                          <li>Databases</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Prioritize Relevant Skills</h3>
                      <p className="text-muted-foreground">
                        List skills that match the job requirements first. For example, if applying for a React position, 
                        emphasize your React experience and related technologies.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Be Specific About Proficiency</h3>
                      <p className="text-muted-foreground">
                        Instead of just listing technologies, indicate your level of experience:
                      </p>
                      <div className="mt-2 pl-5">
                        <p className="text-green-600 font-medium">Good Example:</p>
                        <p className="pl-4">React (4 years, production experience), Node.js (3 years), PostgreSQL (2 years)</p>
                        <p className="text-red-600 font-medium mt-2">Poor Example:</p>
                        <p className="pl-4">JavaScript, HTML, CSS, React, Node</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Writing Effective Work Experience</h2>
              <Card>
                <CardHeader>
                  <CardTitle>The STAR Method</CardTitle>
                  <CardDescription>
                    Structure your accomplishments using the Situation, Task, Action, Result framework
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold w-24">Situation:</span>
                        <p>Describe the context</p>
                      </div>
                      <div className="pl-24">
                        <p className="text-muted-foreground italic text-sm">
                          "Legacy payment processing system with slow performance and high error rates..."
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold w-24">Task:</span>
                        <p>What was required</p>
                      </div>
                      <div className="pl-24">
                        <p className="text-muted-foreground italic text-sm">
                          "Tasked with redesigning the payment architecture to improve reliability and reduce processing time..."
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold w-24">Action:</span>
                        <p>What you did</p>
                      </div>
                      <div className="pl-24">
                        <p className="text-muted-foreground italic text-sm">
                          "Implemented a microservices architecture using Node.js and Redis for caching. Introduced unit and integration tests..."
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className="font-bold w-24">Result:</span>
                        <p>The outcome with metrics</p>
                      </div>
                      <div className="pl-24">
                        <p className="text-muted-foreground italic text-sm">
                          "Reduced payment processing time by 70% and decreased error rates from 4.5% to 0.5%. Improved system uptime to 99.9%..."
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                        <span>Always quantify your achievements with percentages, time saved, revenue increased, etc.</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">ATS Optimization</h2>
              <p className="mb-6">
                Most companies use Applicant Tracking Systems (ATS) to filter resumes before they reach human reviewers. 
                Here's how to ensure your resume passes the initial screening:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Keyword Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Include relevant keywords from the job description</li>
                      <li>Use standard terminology (e.g., "JavaScript" not "JS")</li>
                      <li>Include both acronyms and full terms (e.g., "CI/CD (Continuous Integration/Continuous Deployment)")</li>
                      <li>Place important keywords in context, not just in a skills list</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Formatting for ATS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Use standard section headings (e.g., "Work Experience", "Education")</li>
                      <li>Avoid tables, headers/footers, and text boxes</li>
                      <li>Use a single-column layout for better parsing</li>
                      <li>Save as a standard PDF (not image-based)</li>
                      <li>Use standard fonts like Arial, Calibri, or Times New Roman</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-8 text-center">
                <h3 className="text-xl font-medium mb-4">Ready to put these tips into action?</h3>
                <div className="flex justify-center gap-4">
                  <Link to="/">
                    <Button>Browse Jobs</Button>
                  </Link>
                  <Link to="/resources">
                    <Button variant="outline">More Resources</Button>
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ResumeTips;
