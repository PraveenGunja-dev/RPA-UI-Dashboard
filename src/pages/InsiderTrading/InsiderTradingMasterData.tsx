import { useState, useEffect } from "react";
import { Database, Search, Filter, Download, Eye, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InsiderRecord {
  pangir: string;
  name: string;
  email: string;
  position_latest: number;
  position_older: number;
  position_difference: number;
  status: string;
  source: string;
}

const InsiderTradingMasterData = () => {
  const [records, setRecords] = useState<InsiderRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<InsiderRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [records, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from the backend
      // For now, we'll create mock data
      const mockRecords: InsiderRecord[] = [
        {
          pangir: "AAACB7042E",
          name: "BIKAJI HOTELS PRIVATE LIMITED",
          email: "baidborarbkn@gmail.com",
          position_latest: 100,
          position_older: 0,
          position_difference: 100,
          status: "ADDED",
          source: "Adanient - CDSL"
        },
        {
          pangir: "AAACK1702C",
          name: "KAUSHIK SHAH SHARES AND SECURITIES PRIVATE LIMITED",
          email: "KSSSPL@GMAIL.COM",
          position_latest: 32,
          position_older: 0,
          position_difference: 32,
          status: "ADDED",
          source: "Adanient - NSDL"
        },
        {
          pangir: "AAACB2150P",
          name: "BHALJA LEASING & FINANCE PVT. LTD.",
          email: "alok_restaurant@yahoo.co.in",
          position_latest: 0,
          position_older: 150,
          position_difference: -150,
          status: "REMOVED",
          source: "Adanient - CDSL"
        },
        {
          pangir: "AAACB3469P",
          name: "VIKABH SECURITIES PVT.LTD.",
          email: "info@vikabh.com",
          position_latest: 2760,
          position_older: 2905,
          position_difference: -145,
          status: "CHANGED",
          source: "Adanient - NSDL"
        },
        {
          pangir: "AAAAM6145M",
          name: "MATA JHANDEWALAN EDUCATIONAL AND WELFARE SOCIETY",
          email: "AKS484770@GMAIL.COM",
          position_latest: 3350,
          position_older: 3350,
          position_difference: 0,
          status: "UNCHANGED",
          source: "Adanient - CDSL"
        },
        {
          pangir: "AAACA0032B",
          name: "ASHBEE SYSTEMS LIMITED",
          email: "ASHISH@ASHBEE.COM",
          position_latest: 1471,
          position_older: 1471,
          position_difference: 0,
          status: "UNCHANGED",
          source: "Adanient - NSDL"
        }
      ];
      
      setRecords(mockRecords);
      setFilteredRecords(mockRecords);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let result = records;
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(record => 
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.pangir.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(record => record.status === statusFilter);
    }
    
    setFilteredRecords(result);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ADDED":
        return "bg-green-100 text-green-800";
      case "REMOVED":
        return "bg-red-100 text-red-800";
      case "CHANGED":
        return "bg-yellow-100 text-yellow-800";
      case "UNCHANGED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ADDED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REMOVED":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "CHANGED":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "UNCHANGED":
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#75479C] mx-auto mb-4"></div>
          <p className="text-base" style={{ color: "#000000" }}>Loading master data...</p>
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
                  Insider Trading Master Data
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  Complete dataset of insider trading records
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
                  Records Overview
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  {filteredRecords.length} records found
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, PAN, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-md"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-md appearance-none bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ADDED">Added</option>
                    <option value="REMOVED">Removed</option>
                    <option value="CHANGED">Changed</option>
                    <option value="UNCHANGED">Unchanged</option>
                  </select>
                </div>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">PAN/GIR</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Latest Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Previous Position</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Difference</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{record.pangir}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{record.name}</td>
                      <td className="py-3 px-4 text-sm">{record.email}</td>
                      <td className="py-3 px-4">{record.position_latest.toLocaleString()}</td>
                      <td className="py-3 px-4">{record.position_older.toLocaleString()}</td>
                      <td className={`py-3 px-4 font-medium ${
                        record.position_difference > 0 ? 'text-green-600' : 
                        record.position_difference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {record.position_difference > 0 ? '+' : ''}{record.position_difference.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(record.status)}
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{record.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredRecords.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No records found matching your filters
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-md p-4 shadow-sm">
          <div className="text-2xl font-semibold text-gray-900">{records.filter(r => r.status === "ADDED").length}</div>
          <div className="text-gray-600 text-xs">New Positions</div>
        </div>
        <div className="bg-white border rounded-md p-4 shadow-sm">
          <div className="text-2xl font-semibold text-gray-900">{records.filter(r => r.status === "REMOVED").length}</div>
          <div className="text-gray-600 text-xs">Exited Positions</div>
        </div>
        <div className="bg-white border rounded-md p-4 shadow-sm">
          <div className="text-2xl font-semibold text-gray-900">{records.filter(r => r.status === "CHANGED").length}</div>
          <div className="text-gray-600 text-xs">Modified Positions</div>
        </div>
        <div className="bg-white border rounded-md p-4 shadow-sm">
          <div className="text-2xl font-semibold text-gray-900">{records.filter(r => r.status === "UNCHANGED").length}</div>
          <div className="text-gray-600 text-xs">Unchanged</div>
        </div>
      </div>
    </div>
  );
};

export default InsiderTradingMasterData;