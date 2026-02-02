import { useState, useEffect } from "react";
import { FileText, Database, AlertCircle, Download, Eye, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CompanyData {
  company_name: string;
  total_records: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
  unchanged_count: number;
}

interface DataSourceInfo {
  companies: string[];
}

const InsiderTradingDataSource = () => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const companyMap: Record<string, string> = {
    adanigreen: "Adani Green Energy",
    adanient: "Adani Enterprises",
    adanitrans: "Adani Energy Solutions",
    ambujac: "Ambuja Cements",
    sanghii: "Sanghi Cement",
    mundra : "Adani Ports"
  };

  const displayCompanyName = (name: string) => {
    const key = name?.toLowerCase();
    return companyMap[key] ?? name;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch company list
      const companiesRes = await fetch('/api/insider-trading/companies');
      
      if (!companiesRes.ok) {
        throw new Error('Failed to fetch company data');
      }

      const companiesData: DataSourceInfo = await companiesRes.json();
      setCompanies(companiesData.companies);
      
      // For demonstration, we'll create mock data for each company
      // In a real implementation, this would come from the backend
      const mockCompanyData: CompanyData[] = companiesData.companies.map((company, index) => ({
        company_name: company,
        total_records: Math.floor(Math.random() * 100000) + 50000,
        added_count: Math.floor(Math.random() * 5000) + 1000,
        removed_count: Math.floor(Math.random() * 3000) + 500,
        changed_count: Math.floor(Math.random() * 8000) + 2000,
        unchanged_count: Math.floor(Math.random() * 70000) + 30000
      }));
      
      setCompanyData(mockCompanyData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companyData.filter(company => 
    displayCompanyName(company.company_name).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75479C] mx-auto mb-4"></div>
          <p className="text-base" style={{ color: "#000000" }}>Loading data sources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center p-5 max-w-md">
          <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "#EF4444" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>Error Loading Data</h2>
          <p className="mb-3 text-sm" style={{ color: "#000000" }}>{error}</p>
          <Button 
            onClick={fetchData}
            className="bg-[#75479C] hover:bg-[#5a357a] text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#ffffff" }}>
      <div className="mb-6">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <div className="flex items-center gap-2.5">
              <Database className="h-7 w-7" style={{ color: "#75479C" }} />
              <div>
                <CardTitle className="text-xl font-semibold" style={{ color: "#000000" }}>
                  Data Sources
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  Insider trading data from multiple companies and sources
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="mb-6">
        <Card className="border rounded-md shadow-sm">
          <CardHeader className="border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold" style={{ color: "#000000" }}>
                  Data Overview
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  {companies.length} companies with insider trading data
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total Records</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">New Positions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Exited Positions</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCompanies.map((company, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{displayCompanyName(company.company_name)}</td>
                      <td className="py-3 px-4">{company.total_records.toLocaleString()}</td>
                      <td className="py-3 px-4 text-green-600">{company.added_count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600">{company.removed_count.toLocaleString()}</td>
                      <td className="py-3 px-4 text-yellow-600">{company.changed_count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCompanies.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No companies found matching your search
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Sources and Data Processing cards removed as per requirements */}
    </div>
  );
};

export default InsiderTradingDataSource;
