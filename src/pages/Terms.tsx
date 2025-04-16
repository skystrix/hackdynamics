
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: April 9, 2025</p>

          <div className="prose max-w-none">
            <section>
              <p className="font-medium">
                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the JobSpark website 
                (the "Service") operated by JobSpark Inc. ("us", "we", or "our").
              </p>
              <p className="mb-4">
                Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms. 
                These Terms apply to all visitors, users, and others who wish to access or use the Service.
              </p>
              <p className="mb-4">
                By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms, 
                then you do not have permission to access the Service.
              </p>
            </section>

            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Accounts</h2>
              <p>
                When you create an account with us, you guarantee that the information you provide us is accurate, complete, and current at all times. 
                Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
              </p>
              <p className="mt-4">
                You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of 
                access to your computer and/or account. You agree to accept responsibility for any and all activities or actions that occur under your 
                account and/or password.
              </p>
              <p className="mt-4">
                You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
              <p className="mt-4">
                We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Content</h2>
              <p>
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, 
                or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, 
                reliability, and appropriateness.
              </p>
              <p className="mt-4">
                By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) and/or you have 
                the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your 
                Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other 
                rights of any person or entity.
              </p>
              <p className="mt-4">
                We reserve the right to terminate the account of any user found to be infringing on a copyright.
              </p>
              <p className="mt-4">
                You retain any and all of your rights to any Content you submit, post or display on or through the Service and you are responsible 
                for protecting those rights. We take no responsibility and assume no liability for Content you or any third party posts on or through the Service.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. JobSpark Rights</h2>
              <p>
                The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive 
                property of JobSpark and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and 
                foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written 
                consent of JobSpark.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Subscription and Billing</h2>
              <p>
                Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic 
                basis ("Billing Cycle"). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select 
                when purchasing a Subscription.
              </p>
              <p className="mt-4">
                At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or 
                JobSpark cancels it. You may cancel your Subscription renewal either through your online account management page or by contacting 
                JobSpark customer support team.
              </p>
              <p className="mt-4">
                A valid payment method, including credit card, is required to process the payment for your Subscription. You shall provide JobSpark with 
                accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information. 
                By submitting such payment information, you automatically authorize JobSpark to charge all Subscription fees incurred through your account to any 
                such payment instruments.
              </p>
              <p className="mt-4">
                Should automatic billing fail to occur for any reason, JobSpark will issue an electronic invoice indicating that you must proceed manually, 
                within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Prohibited Uses</h2>
              <p>You agree not to use the Service:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," 
                  "spam," or any other similar solicitation</li>
                <li>To impersonate or attempt to impersonate JobSpark, a JobSpark employee, another user, or any other person or entity</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which, as determined by us, 
                  may harm JobSpark or users of the Service or expose them to liability</li>
              </ul>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
              <p>
                In no event shall JobSpark, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, 
                special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; 
                (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, 
                contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Changes</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will provide at least 
                30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="mt-4">
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not 
                agree to the new terms, you are no longer authorized to use the Service.
              </p>
            </section>
            
            <Separator className="my-6" />
            
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4">
                <p className="font-medium">JobSpark Inc.</p>
                <p>123 Tech Avenue</p>
                <p>San Francisco, CA 94107</p>
                <p>Email: legal@jobspark.example.com</p>
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

export default Terms;
