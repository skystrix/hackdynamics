
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import JobCard from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { jobs } from "@/data/jobs";
import { Job } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FilterIcon, ChevronDown, GridIcon, ListIcon } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

const Jobs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const jobsPerPage = 9;
  
  // Get filters from URL or use defaults
  const query = searchParams.get("query") || "";
  const location = searchParams.get("location") || "";
  const jobType = searchParams.get("type") || "";
  
  // Additional filters
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    jobType ? [jobType] : []
  );
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 200000]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Get unique job types and skills from data
  const availableJobTypes = Array.from(new Set(jobs.map((job) => job.type)));
  const availableSkills = Array.from(
    new Set(jobs.flatMap((job) => job.skills || []))
  );
  
  // Filter jobs based on all criteria
  useEffect(() => {
    const filtered = jobs.filter((job) => {
      // Basic filters (search query, location)
      const matchesQuery =
        !query ||
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase());

      const matchesLocation =
        !location ||
        job.location.toLowerCase().includes(location.toLowerCase());

      // Job type filter
      const matchesType =
        selectedJobTypes.length === 0 ||
        selectedJobTypes.includes(job.type);

      // Skills filter
      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((skill) =>
          (job.skills || []).includes(skill)
        );

      // Salary filter (rough estimate based on the range string)
      let matchesSalary = true;
      if (job.salary) {
        const salaryNumbers = job.salary.match(/\d+/g);
        if (salaryNumbers && salaryNumbers.length > 0) {
          const minJobSalary = parseInt(salaryNumbers[0], 10) * 1000;
          const maxJobSalary = salaryNumbers.length > 1 
            ? parseInt(salaryNumbers[1], 10) * 1000 
            : minJobSalary;
          
          matchesSalary = 
            (minJobSalary >= salaryRange[0] && minJobSalary <= salaryRange[1]) ||
            (maxJobSalary >= salaryRange[0] && maxJobSalary <= salaryRange[1]);
        }
      }

      return matchesQuery && matchesLocation && matchesType && matchesSkills && matchesSalary;
    });

    setFilteredJobs(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [
    query,
    location,
    selectedJobTypes,
    selectedSkills,
    salaryRange,
  ]);

  // Handle pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);
  
  const handleSearch = (query: string, location: string, type: string) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (location) params.set("location", location);
    if (type && type !== "all") params.set("type", type);
    setSearchParams(params);
    
    // Update filter state
    if (type && type !== "all") {
      setSelectedJobTypes([type]);
    }
  };

  // Generate pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (totalPages <= 1) return items;

    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Calculate range of visible page numbers
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Adjust to show up to maxVisiblePages
    if (startPage <= 2) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    }
    if (endPage >= totalPages - 1) {
      startPage = Math.max(2, totalPages - (maxVisiblePages - 2));
    }

    // Generate visible page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page if it's not the only page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Find Jobs</h1>
        
        <div className="mb-8">
          <SearchBar 
            onSearch={handleSearch} 
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {filteredJobs.length} jobs found
          </p>
          
          <div className="flex items-center gap-2">
            <Toggle 
              pressed={viewMode === "list"} 
              onPressedChange={() => setViewMode("list")}
              aria-label="List view"
              className="data-[state=on]:bg-muted"
            >
              <ListIcon className="h-4 w-4" />
            </Toggle>
            <Toggle 
              pressed={viewMode === "grid"} 
              onPressedChange={() => setViewMode("grid")}
              aria-label="Grid view"
              className="data-[state=on]:bg-muted"
            >
              <GridIcon className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <Collapsible
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <FilterIcon className="mr-2 h-4 w-4" /> 
                  Filters 
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card className="p-4 space-y-6">
                  {/* Mobile Filters */}
                  {/* Job Type Filter */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Job Type</h3>
                    <div className="space-y-2">
                      {availableJobTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-type-${type}`}
                            checked={selectedJobTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedJobTypes([...selectedJobTypes, type]);
                              } else {
                                setSelectedJobTypes(
                                  selectedJobTypes.filter((t) => t !== type)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`mobile-type-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Skills Filter */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Skills</h3>
                    <div className="space-y-2">
                      {availableSkills.slice(0, 10).map((skill) => (
                        <div key={skill} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-skill-${skill}`}
                            checked={selectedSkills.includes(skill)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSkills([...selectedSkills, skill]);
                              } else {
                                setSelectedSkills(
                                  selectedSkills.filter((s) => s !== skill)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`mobile-skill-${skill}`}>{skill}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Salary Range Filter */}
                  <div className="space-y-3">
                    <h3 className="font-medium">Salary Range</h3>
                    <div className="space-y-6">
                      <Slider
                        defaultValue={[0, 200000]}
                        max={200000}
                        step={10000}
                        value={salaryRange}
                        onValueChange={(value) => setSalaryRange(value as [number, number])}
                        className="w-full"
                      />
                      <div className="flex justify-between">
                        <p className="text-sm">${(salaryRange[0]/1000).toFixed(0)}k</p>
                        <p className="text-sm">${(salaryRange[1]/1000).toFixed(0)}k</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="p-4 space-y-6 sticky top-4">
              <h2 className="font-semibold text-lg">Filters</h2>
              
              {/* Job Type Filter */}
              <div className="space-y-3">
                <h3 className="font-medium">Job Type</h3>
                <div className="space-y-2">
                  {availableJobTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedJobTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedJobTypes([...selectedJobTypes, type]);
                          } else {
                            setSelectedJobTypes(
                              selectedJobTypes.filter((t) => t !== type)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`type-${type}`}>{type}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Skills Filter */}
              <div className="space-y-3">
                <h3 className="font-medium">Skills</h3>
                <div className="space-y-2 max-h-60 overflow-auto">
                  {availableSkills.map((skill) => (
                    <div key={skill} className="flex items-center space-x-2">
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={selectedSkills.includes(skill)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSkills([...selectedSkills, skill]);
                          } else {
                            setSelectedSkills(
                              selectedSkills.filter((s) => s !== skill)
                            );
                          }
                        }}
                      />
                      <Label htmlFor={`skill-${skill}`}>{skill}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Salary Range Filter */}
              <div className="space-y-3">
                <h3 className="font-medium">Salary Range</h3>
                <div className="space-y-6">
                  <Slider
                    defaultValue={[0, 200000]}
                    max={200000}
                    step={10000}
                    value={salaryRange}
                    onValueChange={(value) => setSalaryRange(value as [number, number])}
                    className="w-full"
                  />
                  <div className="flex justify-between">
                    <p className="text-sm">${(salaryRange[0]/1000).toFixed(0)}k</p>
                    <p className="text-sm">${(salaryRange[1]/1000).toFixed(0)}k</p>
                  </div>
                </div>
              </div>
              
              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedJobTypes([]);
                  setSelectedSkills([]);
                  setSalaryRange([0, 200000]);
                  setSearchParams({});
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </Card>
          </div>
          
          {/* Jobs List */}
          <div className="flex-1">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No jobs found matching your criteria</p>
                <p className="mt-2">Try adjusting your search filters</p>
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {renderPaginationItems()}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Jobs;
