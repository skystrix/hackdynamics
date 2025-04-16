import { Job } from "@/lib/types";

export const jobs: Job[] = [
  {
    id: "1",
    title: "Software Engineer",
    company: "Tech Innovations Inc.",
    location: "San Francisco, CA",
    type: "Full-time",
    description: "We are looking for a skilled software engineer to join our dynamic team.",
    salary: "$120,000 - $150,000",
    requirements: ["Bachelor's degree in Computer Science", "3+ years of experience", "Proficiency in JavaScript, React, Node.js"],
    benefits: ["Health insurance", "Paid time off", "Stock options"],
    postedAt: "2024-01-20",
    postedDate: "2024-01-20",
    updatedDate: "2024-01-27",
    skills: ["JavaScript", "React", "Node.js", "TypeScript"],
    isActive: true
  },
  {
    id: "2",
    title: "Data Scientist",
    company: "Analytics Pro",
    location: "New York, NY",
    type: "Full-time",
    description: "Join our team as a Data Scientist and help us make data-driven decisions.",
    salary: "$110,000 - $140,000",
    requirements: ["Master's degree in Statistics or related field", "Experience with machine learning algorithms", "Proficiency in Python, R"],
    benefits: ["Health insurance", "Paid time off", "401(k)"],
    postedAt: "2024-01-22",
    postedDate: "2024-01-22",
    updatedDate: "2024-01-29",
    skills: ["Python", "R", "Machine Learning", "SQL", "Data Visualization"]
  },
  {
    id: "3",
    title: "Marketing Manager",
    company: "Global Marketing Solutions",
    location: "Chicago, IL",
    type: "Full-time",
    description: "We are seeking a Marketing Manager to lead our marketing efforts.",
    salary: "$90,000 - $120,000",
    requirements: ["Bachelor's degree in Marketing or related field", "5+ years of marketing experience", "Strong communication skills"],
    benefits: ["Health insurance", "Paid time off", "Bonus program"],
    postedAt: "2024-01-25",
    postedDate: "2024-01-25",
    updatedDate: "2024-02-01",
    skills: ["Digital Marketing", "Content Strategy", "SEO", "Social Media", "Analytics"]
  },
  {
    id: "4",
    title: "Frontend Developer",
    company: "WebDev Studios",
    location: "Austin, TX",
    type: "Contract",
    description: "Looking for a talented Frontend Developer for a contract position.",
    salary: "$60 - $80 per hour",
    requirements: ["Proficiency in HTML, CSS, JavaScript", "Experience with React or Angular", "Strong portfolio"],
    benefits: ["Flexible hours", "Remote work"],
    postedAt: "2024-01-28",
    postedDate: "2024-01-28",
    updatedDate: "2024-02-04",
    skills: ["HTML", "CSS", "JavaScript", "React", "Responsive Design"]
  },
  {
    id: "5",
    title: "Product Manager",
    company: "Innovation Labs",
    location: "Seattle, WA",
    type: "Full-time",
    description: "Join our team as a Product Manager and help us build innovative products.",
    salary: "$130,000 - $160,000",
    requirements: ["Bachelor's degree in related field", "5+ years of product management experience", "Strong analytical skills"],
    benefits: ["Health insurance", "Paid time off", "Stock options", "Free snacks"],
    postedAt: "2024-01-30",
    postedDate: "2024-01-30",
    updatedDate: "2024-02-06",
    skills: ["Product Management", "Agile", "User Research", "Roadmapping", "Data Analysis"]
  },
  {
    id: "6",
    title: "Customer Support Specialist",
    company: "Customer First Solutions",
    location: "Remote",
    type: "Full-time",
    description: "We are looking for a Customer Support Specialist to provide excellent customer service.",
    salary: "$40,000 - $50,000",
    requirements: ["High school diploma or equivalent", "Excellent communication skills", "Customer service experience"],
    benefits: ["Health insurance", "Paid time off", "Remote work"],
    postedAt: "2024-02-01",
    postedDate: "2024-02-01",
    updatedDate: "2024-02-08",
    skills: ["Customer Service", "Problem Solving", "Communication", "Ticketing Systems"]
  },
  {
    id: "7",
    title: "Sales Representative",
    company: "SalesForce Pro",
    location: "Boston, MA",
    type: "Full-time",
    description: "Join our sales team and help us grow our customer base.",
    salary: "$60,000 - $80,000 + Commission",
    requirements: ["Bachelor's degree in related field", "Sales experience", "Strong negotiation skills"],
    benefits: ["Health insurance", "Paid time off", "Commission"],
    postedAt: "2024-02-03",
    postedDate: "2024-02-03",
    updatedDate: "2024-02-10",
    skills: ["Sales", "Negotiation", "CRM Software", "Lead Generation", "Relationship Building"]
  },
  {
    id: "8",
    title: "UX Designer",
    company: "Design Innovations",
    location: "Los Angeles, CA",
    type: "Full-time",
    description: "We are seeking a talented UX Designer to create user-friendly designs.",
    salary: "$100,000 - $130,000",
    requirements: ["Bachelor's degree in Design or related field", "UX design experience", "Proficiency in design tools"],
    benefits: ["Health insurance", "Paid time off", "Stock options"],
    postedAt: "2024-02-05",
    postedDate: "2024-02-05",
    updatedDate: "2024-02-12",
    skills: ["UI/UX", "Wireframing", "Prototyping", "Figma", "User Research"]
  },
  {
    id: "9",
    title: "Backend Developer",
    company: "Code Wizards",
    location: "Remote",
    type: "Full-time",
    description: "Looking for a skilled Backend Developer to build and maintain our server-side logic.",
    salary: "$110,000 - $140,000",
    requirements: ["Proficiency in Node.js, Python, or Java", "Experience with databases", "Strong problem-solving skills"],
    benefits: ["Health insurance", "Paid time off", "Remote work"],
    postedAt: "2024-02-07",
    postedDate: "2024-02-07",
    updatedDate: "2024-02-14",
    skills: ["Node.js", "Python", "Databases", "API Design", "Server Management"]
  },
  {
    id: "10",
    title: "Financial Analyst",
    company: "Finance Solutions Inc.",
    location: "Dallas, TX",
    type: "Full-time",
    description: "Join our finance team as a Financial Analyst and help us make financial decisions.",
    salary: "$80,000 - $110,000",
    requirements: ["Bachelor's degree in Finance or related field", "Financial analysis experience", "Strong analytical skills"],
    benefits: ["Health insurance", "Paid time off", "Bonus program"],
    postedAt: "2024-02-09",
    postedDate: "2024-02-09",
    updatedDate: "2024-02-16",
    skills: ["Financial Analysis", "Excel", "Forecasting", "Budgeting", "Financial Modeling"]
  },
];

export const searchJobs = (query: string = "", location: string = "", type: string = ""): Job[] => {
  return jobs.filter((job) => {
    const matchesQuery =
      !query ||
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase());

    const matchesLocation =
      !location ||
      job.location.toLowerCase().includes(location.toLowerCase());

    const matchesType =
      !type || type === "" || job.type === type;

    return matchesQuery && matchesLocation && matchesType;
  });
};

export const getJobById = (id: string): Job | undefined => {
  return jobs.find(job => job.id === id);
};
