
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import SearchBar from "@/components/SearchBar";
import JobCard from "@/components/JobCard";
import { jobs } from "@/data/jobs";
import { Job } from "@/lib/types";

const Index = () => {
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(jobs.slice(0, 6)); // Show only the first 6 jobs on homepage

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      <main className="flex-1 container py-12">
        <SearchBar />

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Featured Jobs</h2>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">No jobs found matching your criteria</p>
              <p className="mt-2">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
