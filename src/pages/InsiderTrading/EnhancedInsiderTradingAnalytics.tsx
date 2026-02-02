import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Loader2, AlertCircle, Users, Building2, Network, TrendingUp, Lightbulb, Activity, DollarSign, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Define TypeScript interfaces for our data
interface InsiderTradingSummary {
  total_companies: number;
  total_investors: number;
  total_shares: number;
  net_investors_change: number;
  net_shares_change: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
  unchanged_count: number;
  total_records: number;
}

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

interface EnhancedInsiderTradingDetails {
  summary: InsiderTradingSummary;
  top_new_investors: InsiderRecord[];
  top_exits: InsiderRecord[];
  top_buyers: InsiderRecord[];
  top_sellers: InsiderRecord[];
}

interface FilterOptions {
  companies: string[];
  depositories: string[];
}

interface AnalyticsData {
  top_investors: InsiderRecord[];
  top_exits: InsiderRecord[];
  top_buyers: InsiderRecord[];
  top_sellers: InsiderRecord[];
  company_movement: {
    company: string;
    added_count: number;
    removed_count: number;
    changed_count: number;
    unchanged_count: number;
  }[];
  investor_movement: {
    investor: string;
    added_count: number;
    removed_count: number;
    changed_count: number;
    unchanged_count: number;
  }[];
  company_shares: {
    company: string;
    shares: number;
  }[];
  investor_shares: {
    investor: string;
    shares: number;
  }[];
}

const EnhancedInsiderTradingAnalytics = () => {
  const [activeView, setActiveView] = useState('overview');
  const [activeTab, setActiveTab] = useState('new');
  const [summary, setSummary] = useState<InsiderTradingSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<EnhancedInsiderTradingDetails | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>("");
  const [depositoryFilter, setDepositoryFilter] = useState<string>("");
  const companyMap: Record<string, string> = {
    adanigreen: "Adani Green Energy",
    adanient: "Adani Enterprises",
    adanitrans: "Adani Energy Solutions",
    ambujac: "Ambuja Cements",
    sanghii: "Sanghi Cement",
    mundra : "Adani Ports"
  };

  const displayCompany = (name: string) => {
    const key = name?.toLowerCase();
    return companyMap[key] ?? name;
  };

  const displayName = (record: InsiderRecord) => {
    const name = record.name?.trim();
    const pan = record.pangir?.trim();
    const panPattern = /^[A-Z]{5}\d{4}[A-Z]$/i;
    if (!name || name === pan || panPattern.test(name)) {
      return "N/A";
    }
    return name;
  };

  const cleanFileName = (fn: string) => {
    if (!fn) return "";
    let out = fn.replace(/\.db$/i, "");
    out = out.replace(/_analysis_results.*$/i, "");
    out = out.replace(/_[A-Za-z]+$/i, "");
    return out;
  };

  const displaySource = (src?: string) => {
    if (!src) return "N/A";
    const parts = src.split(" - ");
    if (parts.length === 2) {
      const company = parts[0];
      const file = parts[1];
      return `${displayCompany(company)} - ${cleanFileName(file)}`;
    }
    return src;
  };
 
  useEffect(() => {
    fetchFilterOptions();
    fetchData();
  }, []);
 
  useEffect(() => {
    fetchData();
  }, [companyFilter, depositoryFilter]);
 
  const fetchFilterOptions = async () => {
    try {
      const res = await fetch('/api/insider-trading/filter-options');
      if (!res.ok) {
        throw new Error('Failed to fetch filter options');
      }
      const data: FilterOptions = await res.json();
      setFilterOptions(data);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };
 
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
     
      // Build query parameters
      const params = new URLSearchParams();
      if (companyFilter) params.append('company', companyFilter);
      if (depositoryFilter) params.append('depository', depositoryFilter);
     
      const res = await fetch(`/api/insider-trading/enhanced-details?${params.toString()}`);
     
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
 
      const data: EnhancedInsiderTradingDetails = await res.json();
      setDetails(data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };
 
  // Calculate insights dynamically
  const getTopInsights = () => {
    const insights = [];
   
    if (details && details.summary) {
      // Total investors insight
      insights.push({
        title: "Total Investors",
        value: details.summary.total_investors !== undefined && Number.isFinite(details.summary.total_investors) ? details.summary.total_investors?.toLocaleString() : '0',
        icon: Users,
        change: details.summary.net_investors_change !== undefined && Number.isFinite(details.summary.net_investors_change) ?
          (details.summary.net_investors_change > 0 ? `+${details.summary.net_investors_change}` : details.summary.net_investors_change?.toString()) : '0',
        changeType: details.summary.net_investors_change !== undefined && Number.isFinite(details.summary.net_investors_change) ?
          (details.summary.net_investors_change >= 0 ? 'positive' : 'negative') : 'neutral'
      });
     
      // Net investors change
      const addedCount = Number.isFinite(details.summary.added_count) ? details.summary.added_count : 0;
      const removedCount = Number.isFinite(details.summary.removed_count) ? details.summary.removed_count : 0;
      const netInvestorChange = addedCount - removedCount;
      insights.push({
        title: "Net Investor Change",
        value: `${netInvestorChange >= 0 ? '+' : ''}${netInvestorChange}`,
        icon: TrendingUp,
        change: "vs last period",
        changeType: netInvestorChange >= 0 ? 'positive' : 'negative'
      });
     
      // Net shares change
      insights.push({
        title: "Net Shares Change",
        value: details.summary.changed_count !== undefined && Number.isFinite(details.summary.changed_count) ?
          `${details.summary.changed_count?.toLocaleString()}` : '0',
        icon: Activity,
        change: "positions modified",
        changeType: 'neutral'
      });
    } else {
      // Default insights when no data is available
      insights.push({
        title: "Total Investors",
        value: '0',
        icon: Users,
        change: '0',
        changeType: 'neutral'
      });
     
      insights.push({
        title: "Net Investor Change",
        value: '0',
        icon: TrendingUp,
        change: "vs last period",
        changeType: 'neutral'
      });
     
      insights.push({
        title: "Net Shares Change",
        value: '0',
        icon: Activity,
        change: "positions modified",
        changeType: 'neutral'
      });
    }
   
    return insights;
  };
 
 
 
  // Calculate total for percentage calculations
  const totalMovement = details && details.summary ?
    (Number.isFinite(details.summary.added_count) ? details.summary.added_count : 0) +
    (Number.isFinite(details.summary.removed_count) ? details.summary.removed_count : 0) +
    (Number.isFinite(details.summary.changed_count) ? details.summary.changed_count : 0) +
    (Number.isFinite(details.summary.unchanged_count) ? details.summary.unchanged_count : 0) : 0;
 
  const topInsights = getTopInsights();
 
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" style={{ color: "#75479C" }} />
          <p className="text-base" style={{ color: "#000000" }}>Loading analytics...</p>
        </div>
      </div>
    );
  }
 
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#ffffff" }}>
        <div className="text-center p-5 max-w-md">
          <AlertCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "#EF4444" }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: "#000000" }}>Error Loading Analytics</h2>
          <p className="mb-3 text-sm" style={{ color: "#000000" }}>{error}</p>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 bg-[#75479C] text-white rounded text-sm hover:bg-[#5a357a] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: "#ffffff" }}>
      <div className="mb-5">
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <div className="flex items-center gap-2.5">
              <Activity className="h-7 w-7" style={{ color: "#75479C" }} />
              <div>
                <CardTitle className="text-xl font-semibold" style={{ color: "#000000" }}>
                  Insider Trading Analytics
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  Comprehensive analysis of {summary?.total_records.toLocaleString() || 0} insider trading records across {summary?.total_companies || 0} companies
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
  
      {/* Documentation Link */}
      <div className="mb-6">
        <Card className="border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">User Guide Documentation</h3>
                <p className="text-sm text-gray-600">Learn how to use this system effectively</p>
              </div>
            </div>
            <Button 
              onClick={() => {
                // Dispatch event to switch to documentation tab
                window.dispatchEvent(new CustomEvent('switchToDocumentationTab'));
              }}
              className="flex items-center gap-2"
              variant="outline"
            >
              <BookOpen className="h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </Card>
      </div>
      {/* Filters */}
      <div className="mb-6 bg-white border rounded-md shadow-sm">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "#000000" }}>
                Filters
              </h3>
              <p className="text-sm" style={{ color: '#666666' }}>
                Refine your analysis with specific filters
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {filterOptions && (
                <>
                  <Select value={companyFilter || "all"} onValueChange={(value) => setCompanyFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full md:w-[180px] bg-white">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent className="bg-white" style={{ backgroundColor: "#ffffff" }}>
                      <SelectItem value="all">All Companies</SelectItem>
                      {filterOptions.companies.map((company) => (
                        <SelectItem key={company} value={company}>{displayCompany(company)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 
                  <Select value={depositoryFilter || "all"} onValueChange={(value) => setDepositoryFilter(value === "all" ? "" : value)}>
                    <SelectTrigger className="w-full md:w-[180px] bg-white">
                      <SelectValue placeholder="All Depositories" />
                    </SelectTrigger>
                    <SelectContent className="bg-white" style={{ backgroundColor: "#ffffff" }}>
                      <SelectItem value="all">All Depositories</SelectItem>
                      {filterOptions.depositories.map((dep) => (
                        <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => { setCompanyFilter(""); setDepositoryFilter(""); }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
       
        {/* Data Sources and Last Updated - Integrated Section */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left side - Data Sources */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#75479C]"></div>
                <span className="text-sm font-medium text-gray-900">BSE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0B74B0]"></div>
                <span className="text-sm font-medium text-gray-900">NSE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF9800]"></div>
                <span className="text-sm font-medium text-gray-900">Physical filings</span>
              </div>
            </div>
           
            {/* Right side - Last Updated */}
            <div className="text-sm">
              <span className="text-gray-700 font-medium">Last Updated: </span>
              <span className="font-medium">30 Nov 2025</span>
            </div>
          </div>
        </div>
      </div>
 
      {/* Top Insights Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-[#75479C]" />
          <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topInsights.map((insight, index) => (
            <div key={index} className="bg-white border rounded-md p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <insight.icon className="h-5 w-5 text-[#75479C] flex-shrink-0" />
                <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <p className="text-2xl font-bold text-gray-900 text-center">{insight.value}</p>
                {insight.change && (
                  <p className={`text-xs text-center mt-1 ${
                    insight.changeType === 'positive' ? 'text-green-600' :
                    insight.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    {insight.change}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
 
      {/* Movement Section - Cards + Stacked Bar */}
      <div className="mb-6">
        <Card className="border rounded-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#75479C]" />
              Movement Analysis
            </CardTitle>
            <CardDescription className="text-sm" style={{ color: '#666666' }}>
              Overview of insider trading activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex flex-col items-center">
                <div className="text-2xl font-semibold text-green-800">{details?.summary?.added_count !== undefined && Number.isFinite(details?.summary?.added_count) ? details?.summary?.added_count?.toLocaleString() : '0'}</div>
                <div className="text-green-700 text-xs mt-1">New Investors</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-4 flex flex-col items-center">
                <div className="text-2xl font-semibold text-red-800">{details?.summary?.removed_count !== undefined && Number.isFinite(details?.summary?.removed_count) ? details?.summary?.removed_count?.toLocaleString() : '0'}</div>
                <div className="text-red-700 text-xs mt-1">Full Exits</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex flex-col items-center">
                <div className="text-2xl font-semibold text-yellow-800">{details?.summary?.changed_count !== undefined && Number.isFinite(details?.summary?.changed_count) ? details?.summary?.changed_count?.toLocaleString() : '0'}</div>
                <div className="text-yellow-700 text-xs mt-1">Modified Positions</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col items-center">
                <div className="text-2xl font-semibold text-gray-800">{details?.summary?.unchanged_count !== undefined && Number.isFinite(details?.summary?.unchanged_count) ? details?.summary?.unchanged_count?.toLocaleString() : '0'}</div>
                <div className="text-gray-700 text-xs mt-1">Unchanged</div>
              </div>
            </div>
 
          </CardContent>
        </Card>
      </div>
 
      {/* Detailed Tables */}
      <div className="mb-6">
        <Card className="border rounded-md shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-semibold" style={{ color: "#000000" }}>
                  Detailed Analysis
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: '#666666' }}>
                  Top movers in insider trading activities
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={activeTab === 'new' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('new')}
                  className={activeTab === 'new' ? 'bg-[#4CAF50] text-white' : ''}
                >
                  Top New Investors
                </Button>
                <Button
                  variant={activeTab === 'exits' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('exits')}
                  className={activeTab === 'exits' ? 'bg-[#EF4444] text-white' : ''}
                >
                  Top Exits
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {details ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">PAN/GIR</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Position Older</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Position Latest</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Position Difference</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === 'new' && details.top_new_investors.map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{record.pangir?.trim() || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{displayName(record)}</td>
                        <td className="py-3 px-4">{record.position_older !== undefined && Number.isFinite(record.position_older) ? record.position_older?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4">{record.position_latest !== undefined && Number.isFinite(record.position_latest) ? record.position_latest?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4 font-medium text-green-600">+{record.position_difference !== undefined && Number.isFinite(record.position_difference) ? record.position_difference?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4 text-sm">{record.email?.trim() || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{displaySource(record.source)}</td>
                      </tr>
                    ))}
                   
                    {activeTab === 'exits' && details.top_exits.map((record, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-mono text-sm">{record.pangir?.trim() || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{displayName(record)}</td>
                        <td className="py-3 px-4">{record.position_older !== undefined && Number.isFinite(record.position_older) ? record.position_older?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4">{record.position_latest !== undefined && Number.isFinite(record.position_latest) ? record.position_latest?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4 font-medium text-red-600">{record.position_difference !== undefined && Number.isFinite(record.position_difference) ? record.position_difference?.toLocaleString() : '0'}</td>
                        <td className="py-3 px-4 text-sm">{record.email?.trim() || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm">{displaySource(record.source)}</td>
                      </tr>
                    ))}
                   
 
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No data available
                </div>
              )}
            </div>
           
            {/* Show message when details are loaded but active tab has no data */}
            {details && (
              (() => {
                const arrays = {
                  'new': details.top_new_investors,
                  'exits': details.top_exits
                };
                const currentArray = arrays[activeTab] || [];
               
                if (currentArray.length === 0) {
                  return (
                    <div className="text-center py-10 text-gray-500">
                      No data available for the selected filters in the {activeTab} category
                    </div>
                  );
                }
                return null;
              })()
            )}
          </CardContent>
        </Card>
      </div>
 
      {/* Data Sources and Data Processing Card - removed as per requirements */}
 
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          📊 Data based on insider trading records | Analysis for {details?.summary?.total_investors !== undefined && Number.isFinite(details?.summary?.total_investors) ? details?.summary?.total_investors?.toLocaleString() : '0'} investors across {details?.summary?.total_companies !== undefined && Number.isFinite(details?.summary?.total_companies) ? details?.summary?.total_companies : '0'} companies
        </p>
      </div>
    </div>
  );
};
 
export default EnhancedInsiderTradingAnalytics;
 
