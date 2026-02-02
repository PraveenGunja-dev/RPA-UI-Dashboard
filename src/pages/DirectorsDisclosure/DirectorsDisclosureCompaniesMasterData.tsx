import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Building2, Search, Loader2, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Company {
  name: string;
  type: string;
  director_count: number;
}

const DirectorsDisclosureCompaniesMasterData = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    let result = [...companies];
    
    // Apply search filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (company) =>
          company.name.toLowerCase().includes(term) ||
          company.type.toLowerCase().includes(term)
      );
    }
    
    // Apply type filter
    if (typeFilter !== "all") {
      result = result.filter((company) => company.type === typeFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "director_count":
          comparison = a.director_count - b.director_count;
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
    
    setFilteredCompanies(result);
  }, [searchTerm, typeFilter, sortBy, sortOrder, companies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/companies-with-director-count');
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const uniqueTypes = useMemo(() => {
    const types = new Set(companies.map(company => company.type));
    return Array.from(types).sort();
  }, [companies]);

  const publicCount = useMemo(() => {
    return companies.filter(company => company.type === 'Public').length;
  }, [companies]);

  const privateCount = useMemo(() => {
    return companies.filter(company => company.type.includes('Private')).length;
  }, [companies]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#75479C" }} />
          <p className="text-lg" style={{ color: "#000000" }}>Loading companies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: "#EF4444" }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#000000" }}>Error Loading Data</h2>
          <p className="mb-4" style={{ color: "#000000" }}>{error}</p>
          <Button onClick={fetchCompanies} style={{ backgroundColor: '#75479C', color: 'white' }}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: "#ffffff" }}>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg" style={{ borderTop: '4px solid #75479C' }}>
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-8 w-8" style={{ color: "#75479C" }} />
              <div>
                <CardTitle className="text-2xl font-bold" style={{ color: "#000000" }}>
                  Companies Master List
                </CardTitle>
                <CardDescription style={{ color: '#666666' }}>
                  Complete list of all 621 companies categorized by type with director counts
                </CardDescription>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#666666' }} />
                <Input
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{ borderColor: '#75479C' }}
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger style={{ borderColor: '#75479C' }}>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger style={{ borderColor: '#75479C' }}>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="director_count">Director Count</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                }}
                variant="outline"
                style={{ borderColor: '#75479C', color: '#75479C' }}
              >
                Clear Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm" style={{ color: '#666666' }}>
              Showing {filteredCompanies.length} of {companies.length} companies
            </div>

            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: '#f5f5f5' }}>
                    <TableHead className="font-semibold w-12">#</TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Company Name
                        {sortBy === "name" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center">
                        Type
                        {sortBy === "type" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-right cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("director_count")}
                    >
                      <div className="flex items-center justify-end">
                        Director Count
                        {sortBy === "director_count" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8" style={{ color: '#666666' }}>
                        {searchTerm || typeFilter !== "all" ? 'No companies found matching your filters' : 'No companies found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="font-medium" style={{ color: '#666666' }}>
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            company.type === 'Public' 
                              ? 'bg-blue-100 text-blue-800' 
                              : company.type === 'Private - Subsidiary of Public'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {company.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium" style={{ color: '#75479C' }}>
                          {company.director_count}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card style={{ backgroundColor: '#f0e6f7', borderColor: '#75479C' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#75479C' }}>
                      {companies.length}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Total Companies
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: '#e5f4fb', borderColor: '#0B74B0' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#0B74B0' }}>
                      {publicCount}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Public Companies
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: '#fde8ee', borderColor: '#BD3861' }}>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#BD3861' }}>
                      {privateCount}
                    </div>
                    <div className="text-sm mt-1" style={{ color: '#666666' }}>
                      Private Companies
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default DirectorsDisclosureCompaniesMasterData;