
import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type PricingPeriod = "monthly" | "annual";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: PlanFeature[];
  buttonText: string;
  popular?: boolean;
}

const plans: PricingPlan[] = [
  {
    name: "Basic",
    description: "Essential tools for small businesses and individuals",
    price: {
      monthly: 0,
      annual: 0
    },
    features: [
      { text: "Post 1 job", included: true },
      { text: "Basic candidate search", included: true },
      { text: "Email support", included: true },
      { text: "Featured job listing", included: false },
      { text: "Premium placement", included: false },
      { text: "Candidate recommendations", included: false },
    ],
    buttonText: "Get Started"
  },
  {
    name: "Professional",
    description: "Advanced features for growing companies",
    price: {
      monthly: 49,
      annual: 39
    },
    popular: true,
    features: [
      { text: "Post 5 jobs", included: true },
      { text: "Advanced candidate search", included: true },
      { text: "Priority email support", included: true },
      { text: "Featured job listing", included: true },
      { text: "Premium placement", included: false },
      { text: "Candidate recommendations", included: false },
    ],
    buttonText: "Start Trial"
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: {
      monthly: 99,
      annual: 79
    },
    features: [
      { text: "Unlimited job posts", included: true },
      { text: "Premium candidate search", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Featured job listing", included: true },
      { text: "Premium placement", included: true },
      { text: "Candidate recommendations", included: true },
    ],
    buttonText: "Contact Sales"
  }
];

const Pricing = () => {
  const [pricingPeriod, setPricingPeriod] = useState<PricingPeriod>("monthly");
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handlePlanSelection = (plan: PricingPlan) => {
    if (plan.name === "Basic") {
      navigate("/post-job");
      return;
    }

    if (!isAuthenticated) {
      toast.info("Please sign in to subscribe to this plan", {
        description: "You need an account to continue with this subscription",
        action: {
          label: "Sign In",
          onClick: () => navigate("/login")
        }
      });
      return;
    }

    // In a real app, this would redirect to a checkout page
    toast.success(`Selected the ${plan.name} plan!`, {
      description: `You selected the ${pricingPeriod} billing option at $${plan.price[pricingPeriod]}/month.`
    });
  };

  const getDiscountPercentage = (plan: PricingPlan) => {
    if (plan.price.monthly === 0) return null;
    const monthlyTotal = plan.price.monthly * 12;
    const annualTotal = plan.price.annual * 12;
    const savings = monthlyTotal - annualTotal;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return percentage;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="bg-muted/40 py-16 md:py-24">
          <div className="container text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your hiring needs. No hidden fees or surprises.
            </p>

            <div className="mt-10">
              <Tabs defaultValue="monthly" className="w-full max-w-md mx-auto">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger 
                    value="monthly" 
                    onClick={() => setPricingPeriod("monthly")}
                  >
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger 
                    value="annual" 
                    onClick={() => setPricingPeriod("annual")}
                  >
                    Annual <span className="ml-1.5 text-xs py-0.5 px-1.5 bg-primary/10 text-primary rounded-sm">Save 20%</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="monthly"></TabsContent>
                <TabsContent value="annual"></TabsContent>
              </Tabs>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <Card 
                  key={plan.name} 
                  className={`relative flex flex-col border ${plan.popular ? 'border-primary shadow-lg' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                      <span className="bg-primary text-primary-foreground text-xs font-medium py-1 px-2 rounded-sm">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-bold">
                        ${plan.price[pricingPeriod]}
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        /month
                      </span>
                    </div>
                    {pricingPeriod === "annual" && plan.price.monthly > 0 && (
                      <div className="mt-1.5 text-sm text-muted-foreground">
                        Save {getDiscountPercentage(plan)}% with annual billing
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 py-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex">
                          <span className={`mr-2 mt-1 ${feature.included ? 'text-primary' : 'text-muted-foreground'}`}>
                            <CheckIcon className="h-4 w-4" />
                          </span>
                          <span className={feature.included ? '' : 'text-muted-foreground'}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => handlePlanSelection(plan)}
                      variant={plan.popular ? 'default' : 'outline'} 
                      className="w-full"
                    >
                      {plan.buttonText}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/40">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-6">Frequently Asked Questions</h2>
              <div className="space-y-6 text-left">
                <div>
                  <h3 className="text-lg font-medium mb-2">Can I change my plan later?</h3>
                  <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes will be applied at the start of your next billing cycle.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Do you offer discounts for nonprofits?</h3>
                  <p className="text-muted-foreground">Yes, we offer special discounts for nonprofit organizations. Please contact our sales team for more information.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">What happens when my trial ends?</h3>
                  <p className="text-muted-foreground">After your trial period, your account will automatically be charged for the plan you selected unless you cancel before the trial ends.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
