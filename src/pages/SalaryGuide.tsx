
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const salaryData = [
  { role: "Junior Developer", min: 50000, avg: 65000, max: 80000 },
  { role: "Mid-level Developer", min: 75000, avg: 95000, max: 115000 },
  { role: "Senior Developer", min: 100000, avg: 130000, max: 160000 },
  { role: "Tech Lead", min: 120000, avg: 150000, max: 180000 },
  { role: "Engineering Manager", min: 140000, avg: 170000, max: 200000 },
  { role: "CTO", min: 160000, avg: 200000, max: 250000 },
];

const locationFactors = {
  "San Francisco, CA": 1.5,
  "New York, NY": 1.4,
  "Seattle, WA": 1.3,
  "Austin, TX": 1.1,
  "Chicago, IL": 1.1,
  "Remote": 1.0,
  "Other": 0.9,
};

const chartData = salaryData.map(item => ({
  name: item.role,
  min: item.min,
  avg: item.avg,
  max: item.max,
}));

const SalaryGuide = () => {
  const [role, setRole] = useState("Mid-level Developer");
  const [location, setLocation] = useState("San Francisco, CA");
  const [experience, setExperience] = useState(3);
  const [estimatedSalary, setEstimatedSalary] = useState(0);

  const calculateSalary = () => {
    const baseData = salaryData.find(item => item.role === role);
    if (!baseData) return;
    
    const locationFactor = locationFactors[location as keyof typeof locationFactors] || 1;
    const experienceFactor = 1 + (Math.min(experience - 3, 7) * 0.05);
    
    const calculatedSalary = Math.round(baseData.avg * locationFactor * experienceFactor);
    setEstimatedSalary(calculatedSalary);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Tech Salary Guide</h1>
          <p className="text-muted-foreground mb-8">
            Explore current software engineering salaries based on role, experience, and location.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>Salary Calculator</CardTitle>
                <CardDescription>Estimate your market value</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {salaryData.map((item) => (
                        <SelectItem key={item.role} value={item.role}>
                          {item.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(locationFactors).map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Years of Experience: {experience}</label>
                  <Slider 
                    value={[experience]} 
                    min={0} 
                    max={15} 
                    step={1} 
                    onValueChange={(value) => setExperience(value[0])}
                  />
                </div>

                <Button onClick={calculateSalary} className="w-full mt-4">Calculate Salary</Button>

                {estimatedSalary > 0 && (
                  <div className="mt-4 p-4 border rounded-md text-center">
                    <p className="text-sm text-muted-foreground">Estimated Annual Salary</p>
                    <p className="text-2xl font-bold">${estimatedSalary.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Salary Ranges by Role</CardTitle>
                  <CardDescription>
                    Average salaries in the tech industry (USD)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={80} 
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${(value/1000)}k`}
                        />
                        <Tooltip 
                          formatter={(value) => [`$${value.toLocaleString()}`, '']}
                          labelFormatter={(value) => `Role: ${value}`}
                        />
                        <Bar dataKey="min" name="Minimum" fill="#94a3b8" />
                        <Bar dataKey="avg" name="Average" fill="#0ea5e9" />
                        <Bar dataKey="max" name="Maximum" fill="#0369a1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Understanding Tech Salaries</h2>
              <p className="mb-4">
                Software engineering salaries can vary widely based on many factors including location, company size, experience, 
                skills, and industry. The data presented here represents industry averages across major tech hubs in the United States.
              </p>
              <p>
                Keep in mind that compensation packages often include more than just base salary. Stock options, bonuses, benefits, 
                and other perks can significantly increase your total compensation.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Factors That Impact Your Salary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Tech hubs like San Francisco and New York consistently offer the highest salaries, 
                      but also have higher costs of living. Remote work is changing this landscape.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Experience remains one of the biggest salary drivers. Senior engineers with 5+ years 
                      experience often earn 50-100% more than junior developers.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Company Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Large tech companies typically offer higher salaries than startups, but startups 
                      may offer more equity which could be valuable long-term.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Skills</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Specialized skills in high-demand areas like AI, machine learning, 
                      and cybersecurity can command premium salaries.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SalaryGuide;
