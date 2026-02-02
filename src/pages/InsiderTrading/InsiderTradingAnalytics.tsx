import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Loader2, AlertCircle, Users, Building2, Network, TrendingUp, Lightbulb, Activity, DollarSign, AlertTriangle, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// Define TypeScript interfaces for our data
interface CompanyInsiderData {
  company_name: string;
  total_records: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
  unchanged_count: number;
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

interface InsiderTradingSummary {
  total_companies: number;
  total_records: number;
  added_count: number;
  removed_count: number;
  changed_count: number;
  unchanged_count: number;
}

interface AnalyticsData {
  company_data: CompanyInsiderData[];
  top_added: InsiderRecord[];
  top_removed: InsiderRecord[];
  top_changed: InsiderRecord[];
}

const InsiderTradingAnalytics = () => {
  const [activeView, setActiveView] = useState('overview');
  const [summary, setSummary] = useState<InsiderTradingSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all required data in parallel
      const [
        summaryRes,
        analyticsRes
      ] = await Promise.all([
        fetch('/api/insider-trading/summary'),
        fetch('/api/insider-trading/details')
      ]);

      // Check if all responses are ok
      if (!summaryRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch one or more data sets');
      }

      // Parse all data
      const summaryData = await summaryRes.json();
      const analyticsData = await analyticsRes.json();

      // Set all state
      setSummary(summaryData);
      setAnalytics(analyticsData);
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
    
    // Total records insight
    if (summary) {
      insights.push({
        title: "Total Insider Records",
        value: `${summary.total_records.toLocaleString()}`,
        icon: Activity
      });
    }
    
    // Companies with most changes
    if (analytics && analytics.company_data.length > 0) {
      const companyWithMostChanges = [...analytics.company_data]
        .sort((a, b) => (b.added_count + b.removed_count + b.changed_count) - (a.added_count + a.removed_count + a.changed_count))[0];
      
      if (companyWithMostChanges) {
        insights.push({
          title: "Most Active Company",
          value: `${companyWithMostChanges.company_name} with ${companyWithMostChanges.added_count + companyWithMostChanges.removed_count + companyWithMostChanges.changed_count} changes`,
          icon: Building2
        });
      }
    }
    
    // Net position change
    if (summary) {
      const netChange = summary.added_count - summary.removed_count;
      insights.push({
        title: "Net Position Change",
        value: `${netChange > 0 ? '+' : ''}${netChange.toLocaleString()} positions`,
        icon: TrendingUp
      });
    }
    
    // Largest position change
    if (analytics && analytics.top_changed.length > 0) {
      const largestChange = analytics.top_changed[0];
      insights.push({
        title: "Largest Position Change",
        value: `${largestChange.name} (${Math.abs(largestChange.position_difference)} shares)`,
        icon: AlertTriangle
      });
    }
    
    return insights;
  };

  const COLORS = ['#75479C', '#0B74B0', '#FF9800', '#4CAF50', '#8884D8', '#82CA9D'];

  // Prepare chart data
  const statusDistributionData = summary ? [
    { name: 'Added', value: summary.added_count },
    { name: 'Removed', value: summary.removed_count },
    { name: 'Changed', value: summary.changed_count },
    { name: 'Unchanged', value: summary.unchanged_count }
  ] : [];

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
            onClick={fetchAllData}
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
      {/* Top Insights Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-[#75479C]" />
          <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topInsights.map((insight, index) => (
            <div key={index} className="bg-white border rounded-md p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <insight.icon className="h-5 w-5 text-[#75479C] flex-shrink-0" />
                <h4 className="font-medium text-sm text-gray-900">{insight.title}</h4>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <p className="text-sm text-gray-600 text-center">{insight.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation - Centered with proper spacing */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'changes', label: 'Position Changes', icon: Activity },
            { id: 'companies', label: 'Company Analysis', icon: Building2 },
            { id: 'top-movers', label: 'Top Movers', icon: AlertTriangle }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all whitespace-nowrap ${
                activeView === view.id
                  ? 'bg-[#75479C] text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <view.icon className="h-4 w-4" />
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-md p-5 shadow-sm">
              <Activity className="text-[#75479C] mb-2" size={26} />
              <div className="text-2xl font-semibold text-gray-900">{summary?.total_records.toLocaleString() || 0}</div>
              <div className="text-gray-600 text-xs">Total Records</div>
            </div>
            <div className="bg-white border rounded-md p-5 shadow-sm">
              <Building2 className="text-[#0B74B0] mb-2" size={26} />
              <div className="text-2xl font-semibold text-gray-900">{summary?.total_companies || 0}</div>
              <div className="text-gray-600 text-xs">Companies</div>
            </div>
            <div className="bg-white border rounded-md p-5 shadow-sm">
              <TrendingUp className="text-[#4CAF50] mb-2" size={26} />
              <div className="text-2xl font-semibold text-gray-900">{summary?.added_count.toLocaleString() || 0}</div>
              <div className="text-gray-600 text-xs">New Positions</div>
            </div>
            <div className="bg-white border rounded-md p-5 shadow-sm">
              <AlertTriangle className="text-[#FF9800] mb-2" size={26} />
              <div className="text-2xl font-semibold text-gray-900">{summary ? Math.max(
                summary.added_count, 
                summary.removed_count, 
                summary.changed_count
              ).toLocaleString() : '0'}</div>
              <div className="text-gray-600 text-xs">Largest Change</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-md p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border rounded-md p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Changes Over Time</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={[
                    { name: 'Added', value: summary?.added_count || 0 },
                    { name: 'Removed', value: summary?.removed_count || 0 },
                    { name: 'Changed', value: summary?.changed_count || 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                    labelStyle={{ color: '#000', fontSize: '12px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#75479C" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Position Changes */}
      {activeView === 'changes' && (
        <div className="bg-white border rounded-md p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Changes Analysis</h3>
          <p className="text-gray-600 text-sm mb-5">Detailed breakdown of position additions, removals, and modifications</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-[#4CAF50]" size={20} />
                <h4 className="font-medium text-gray-900">Additions</h4>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{summary?.added_count.toLocaleString() || 0}</div>
              <div className="text-gray-600 text-xs">New insider positions</div>
            </div>
            
            <div className="bg-[#FF9800]/10 border border-[#FF9800]/20 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-[#FF9800]" size={20} />
                <h4 className="font-medium text-gray-900">Modifications</h4>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{summary?.changed_count.toLocaleString() || 0}</div>
              <div className="text-gray-600 text-xs">Position adjustments</div>
            </div>
            
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-[#EF4444] rotate-180" size={20} />
                <h4 className="font-medium text-gray-900">Removals</h4>
              </div>
              <div className="text-2xl font-semibold text-gray-900">{summary?.removed_count.toLocaleString() || 0}</div>
              <div className="text-gray-600 text-xs">Exited positions</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-gray-900 text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Count</th>
                  <th className="text-left py-3 px-4 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {summary && (
                  <>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          Added
                        </div>
                      </td>
                      <td className="py-3 px-4">{summary.added_count.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {summary.total_records > 0 
                          ? `${((summary.added_count / summary.total_records) * 100).toFixed(1)}%` 
                          : '0%'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          Changed
                        </div>
                      </td>
                      <td className="py-3 px-4">{summary.changed_count.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {summary.total_records > 0 
                          ? `${((summary.changed_count / summary.total_records) * 100).toFixed(1)}%` 
                          : '0%'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          Removed
                        </div>
                      </td>
                      <td className="py-3 px-4">{summary.removed_count.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {summary.total_records > 0 
                          ? `${((summary.removed_count / summary.total_records) * 100).toFixed(1)}%` 
                          : '0%'}
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                          Unchanged
                        </div>
                      </td>
                      <td className="py-3 px-4">{summary.unchanged_count.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        {summary.total_records > 0 
                          ? `${((summary.unchanged_count / summary.total_records) * 100).toFixed(1)}%` 
                          : '0%'}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Company Analysis */}
      {activeView === 'companies' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-md p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Companies by Activity Level</h3>
            <p className="text-gray-600 text-sm mb-5">Companies with the most insider trading activity</p>
            {analytics && analytics.company_data.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={[...analytics.company_data]
                    .sort((a, b) => (b.added_count + b.removed_count + b.changed_count) - (a.added_count + a.removed_count + a.changed_count))
                    .slice(0, 10)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis type="number" stroke="#666" fontSize={12} />
                  <YAxis 
                    dataKey="company_name" 
                    type="category" 
                    stroke="#666" 
                    width={150}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                    labelStyle={{ color: '#000', fontSize: '12px' }}
                  />
                  <Legend />
                  <Bar dataKey="added_count" fill="#4CAF50" name="Added" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="removed_count" fill="#EF4444" name="Removed" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="changed_count" fill="#FF9800" name="Changed" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-gray-600">
                No company data available
              </div>
            )}
          </div>

          <div className="bg-white border rounded-md p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#75479C]/10 border border-[#75479C]/20 rounded-md p-4">
                <div className="text-2xl font-semibold text-gray-900">{analytics?.company_data.length || 0}</div>
                <div className="text-gray-600 text-xs">Total Companies</div>
              </div>
              <div className="bg-[#0B74B0]/10 border border-[#0B74B0]/20 rounded-md p-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {analytics && analytics.company_data.length > 0 
                    ? Math.max(...analytics.company_data.map(c => c.total_records)).toLocaleString() 
                    : 0}
                </div>
                <div className="text-gray-600 text-xs">Highest Record Count</div>
              </div>
              <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/20 rounded-md p-4">
                <div className="text-2xl font-semibold text-gray-900">
                  {analytics && analytics.company_data.length > 0 
                    ? (analytics.company_data.reduce((sum, c) => sum + c.total_records, 0) / analytics.company_data.length).toFixed(0) 
                    : 0}
                </div>
                <div className="text-gray-600 text-xs">Avg Records/Company</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Movers */}
      {activeView === 'top-movers' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-md p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top New Positions</h3>
            <p className="text-gray-600 text-sm mb-5">Insiders who have recently acquired new positions</p>
            {analytics && analytics.top_added.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-gray-900 text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-left py-3 px-4 font-medium">Shares</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_added.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{record.name}</td>
                        <td className="py-3 px-4">{record.source.split(' - ')[0]}</td>
                        <td className="py-3 px-4">{record.position_latest.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                No new positions found
              </div>
            )}
          </div>

          <div className="bg-white border rounded-md p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Largest Position Changes</h3>
            <p className="text-gray-600 text-sm mb-5">Significant increases or decreases in holdings</p>
            {analytics && analytics.top_changed.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-gray-900 text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium">Name</th>
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-left py-3 px-4 font-medium">Previous</th>
                      <th className="text-left py-3 px-4 font-medium">Current</th>
                      <th className="text-left py-3 px-4 font-medium">Change</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_changed.map((record, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{record.name}</td>
                        <td className="py-3 px-4">{record.source.split(' - ')[0]}</td>
                        <td className="py-3 px-4">{record.position_older.toLocaleString()}</td>
                        <td className="py-3 px-4">{record.position_latest.toLocaleString()}</td>
                        <td className={`py-3 px-4 font-medium ${record.position_difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {record.position_difference > 0 ? '+' : ''}{record.position_difference.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            record.position_difference > 0 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {record.position_difference > 0 ? 'Increased' : 'Decreased'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-600">
                No significant position changes found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-sm">
          📊 Data based on insider trading records | Analysis for {summary?.total_records.toLocaleString() || 0} records across {summary?.total_companies || 0} companies
        </p>
      </div>
    </div>
  );
};

export default InsiderTradingAnalytics;