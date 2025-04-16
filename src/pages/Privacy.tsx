
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 9, 2025</p>

          <div className="prose max-w-none">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
              <p>
                This Privacy Policy explains how HackDynamics ("we", "us", "our") collects, uses, discloses, 
                and safeguards your information when you visit our website or use our services.
              </p>
              <p>
                We take your privacy seriously and are committed to protecting your personal data. Please 
                read this Privacy Policy carefully to understand our practices regarding your personal data.
              </p>
            </section>

            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Personal Data</h3>
              <p>We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>
                  <span className="font-medium">Identity Information:</span> Your name, username, or similar identifier.
                </li>
                <li>
                  <span className="font-medium">Contact Information:</span> Your email address, telephone number, and mailing address.
                </li>
                <li>
                  <span className="font-medium">Professional Information:</span> Your resume, work history, skills, education, certifications, 
                  and other career-related information.
                </li>
                <li>
                  <span className="font-medium">Account Information:</span> Your login details, password, account preferences, and feedback.
                </li>
                <li>
                  <span className="font-medium">Financial Information:</span> Your payment card details for subscription or service purchases.
                </li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Usage Data</h3>
              <p>We may also collect information about how you use our website and services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical data including your IP address, browser type and version, time zone setting, browser plug-in types and versions, 
                operating system and platform.</li>
                <li>Information about your visit, including the URLs of pages you visit, page response times, download errors, length of visits to certain pages, 
                page interaction information (such as scrolling, clicks, and mouse-overs).</li>
                <li>Job search preferences and interaction with job postings.</li>
              </ul>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
              <p>We use your personal information for the following purposes:</p>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Provide Our Services</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Creating and managing your account</li>
                <li>Processing job applications</li>
                <li>Matching candidates with appropriate job opportunities</li>
                <li>Enabling employers to search for and identify potential candidates</li>
                <li>Processing payments and subscriptions</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Improve Our Services</h3>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Troubleshooting technical issues</li>
                <li>Conducting research and development</li>
                <li>Gathering feedback to improve our offerings</li>
              </ul>
              
              <h3 className="text-xl font-medium mt-6 mb-3">Communication</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sending service notifications and updates</li>
                <li>Providing customer support</li>
                <li>Sending marketing communications (with your consent)</li>
                <li>Responding to your inquiries</li>
              </ul>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Sharing Your Information</h2>
              <p>We may share your personal data with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-medium">Employers:</span> If you apply for a job, your application information will be shared with the employer.
                </li>
                <li>
                  <span className="font-medium">Service Providers:</span> Third parties who provide services on our behalf, such as payment processing, 
                  data analysis, email delivery, hosting services, and customer service.
                </li>
                <li>
                  <span className="font-medium">Affiliated Companies:</span> Our subsidiaries and affiliates to provide our services and for the purposes 
                  described in this Privacy Policy.
                </li>
                <li>
                  <span className="font-medium">Legal Requirements:</span> If required by law or in response to valid requests by public authorities.
                </li>
                <li>
                  <span className="font-medium">Business Transfers:</span> In connection with any merger, sale of company assets, financing, or acquisition 
                  of all or a portion of our business by another company.
                </li>
              </ul>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Your Rights and Choices</h2>
              <p>Depending on your location, you may have certain rights regarding your personal data:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access to your personal data</li>
                <li>Correction of inaccurate or incomplete data</li>
                <li>Erasure of your personal data</li>
                <li>Restriction of processing of your personal data</li>
                <li>Data portability</li>
                <li>Objection to processing of your personal data</li>
                <li>Withdrawal of consent</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us using the information provided in the "Contact Us" section.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Security</h2>
              <p>
                We have implemented appropriate technical and organizational measures to protect the security of your personal data. However, 
                please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy 
                on this page and updating the "Last updated" date.
              </p>
              <p className="mt-4">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective 
                when they are posted on this page.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4">
                <p className="font-medium">HackDynamics Inc.</p>
                <p>123 Tech Avenue</p>
                <p>San Francisco, CA 94107</p>
                <p>Email: privacy@hackdynamics.example.com</p>
                <p>Phone: (555) 123-4567</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
