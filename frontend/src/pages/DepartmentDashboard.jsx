import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

import {
    Bot, LayoutDashboard, Home, Clock, CheckCircle, XCircle,
    Search, Eye, FileText, ExternalLink, X, Info, Activity, Calculator, Network, LogOut
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Brush } from 'recharts';
import { getDepartmentSummary, getDepartmentBots } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import BotDetails from './BotDetails';
import './DepartmentDashboard.css';

function DepartmentDashboard() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [summary, setSummary] = useState(null);
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedBot, setSelectedBot] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [infoModal, setInfoModal] = useState(null); // 'hours' or 'manhours' or null
    const [descriptionModal, setDescriptionModal] = useState(null); // stores bot object to view description
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    useEffect(() => {
        if (bots.length > 0) {
            // Only use deployed/live/active bots for the main dashboard aggregation
            const activeBots = bots.filter(b => {
                const s = b.status?.toLowerCase() || '';
                // Exclude inactive explicitly first
                if (s.includes('inactive') || s.includes('in active') || s.includes('hold')) return false;

                return s.includes('deployed') ||
                    s.includes('live') ||
                    s.includes('active') ||
                    s.includes('production') ||
                    s.includes('running');
            });
            setChartData(generateChartData(activeBots));
        }
    }, [bots]);

    const generateChartData = (botsList) => {
        // Use all provided bots (filtering is now done by caller)
        const deployedBots = botsList;

        if (deployedBots.length === 0) return [];

        // Find earliest deployment date and prepare bots
        let minDate = new Date();
        const validBots = [];

        // Handle dates - if missing, assume 30 days ago
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() - 30);

        deployedBots.forEach(bot => {
            const dateStr = bot.deployed_date || bot.end_date;
            let d = dateStr ? new Date(dateStr) : defaultDate;
            if (isNaN(d.getTime())) d = defaultDate;

            if (d < minDate) minDate = d;

            validBots.push({
                ...bot,
                deployDate: d,
                dailyHours: (bot.hours_saved_monthly || 0) / 30,
                dailyManHours: ((bot.hours_saved_monthly || 0) / 8) / 30
            });
        });

        // Generate raw daily series
        const rawData = [];
        const today = new Date();
        let currentDate = new Date(minDate);
        let cumulativeHours = 0;
        let cumulativeManHours = 0;

        while (currentDate <= today) {
            let dailyRate = 0;
            let dailyManRate = 0;

            validBots.forEach(bot => {
                if (bot.deployDate <= currentDate) {
                    dailyRate += bot.dailyHours;
                    dailyManRate += bot.dailyManHours;
                }
            });

            cumulativeHours += dailyRate;
            cumulativeManHours += dailyManRate;

            rawData.push({
                dateObj: new Date(currentDate),
                name: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                fullDate: currentDate.toISOString(),
                rawHours: cumulativeHours,
                rawManHours: cumulativeManHours,
                trend: dailyRate
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Normalize to match actual KPI totals exactly
        const lastPoint = rawData[rawData.length - 1];
        // Get totals from list logic (same as KPI)
        const totalHoursTarget = botsList.reduce((sum, b) => sum + (b.hours_till_now || 0), 0);
        const totalManHoursTarget = Math.round(totalHoursTarget / 8);

        // If calculated is 0 avoid division by zero
        const hourScale = (lastPoint && lastPoint.rawHours > 0) ? (totalHoursTarget / lastPoint.rawHours) : 1;
        const manHourScale = (lastPoint && lastPoint.rawManHours > 0) ? (totalManHoursTarget / lastPoint.rawManHours) : 1;

        return rawData.map(point => ({
            name: point.name,
            fullDate: point.fullDate,
            hours: Math.round(point.rawHours * hourScale),
            trend: Math.round(point.trend * hourScale),
            manHours: Math.round(point.rawHours * hourScale / 8)
        }));
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, botsRes] = await Promise.all([
                getDepartmentSummary(id),
                getDepartmentBots(id)
            ]);
            setSummary(summaryRes.data);
            setBots(botsRes.data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredBots = bots.filter(bot => {
        const matchesSearch =
            (bot.bot_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (bot.use_case_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (bot.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        const statusLower = bot.status?.toLowerCase() || '';
        const isActive = !statusLower.includes('inactive') && !statusLower.includes('in active') && !statusLower.includes('hold') && (
            statusLower.includes('deployed') ||
            statusLower.includes('live') ||
            statusLower.includes('active') ||
            statusLower.includes('production') ||
            statusLower.includes('running')
        );

        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'inactive' && !isActive);
        return matchesSearch && matchesStatus;
    });

    // Calculate totals
    const totalHoursTillNow = bots.reduce((sum, b) => sum + (b.hours_till_now || 0), 0);
    const totalManHours = Math.round(totalHoursTillNow / 8);
    const activeBots = bots.filter(b => {
        const s = b.status?.toLowerCase() || '';
        if (s.includes('inactive') || s.includes('in active') || s.includes('hold')) return false;
        return s.includes('deployed') ||
            s.includes('live') ||
            s.includes('active') ||
            s.includes('production') ||
            s.includes('running');
    }).length;
    const inactiveBots = bots.length - activeBots;

    // Calculate growth from chart data (compare current to ~30 days ago)
    const calculateGrowth = () => {
        if (chartData.length < 2) return { hoursGrowth: 0, manHoursGrowth: 0 };

        const latestData = chartData[chartData.length - 1];
        // Get data from ~30 days ago (or earliest if less than 30 days)
        const daysAgoIndex = Math.max(0, chartData.length - 30);
        const previousData = chartData[daysAgoIndex];

        let hoursGrowth = 0;
        let manHoursGrowth = 0;

        if (previousData && previousData.hours > 0) {
            hoursGrowth = ((latestData.hours - previousData.hours) / previousData.hours) * 100;
        }
        if (previousData && previousData.manHours > 0) {
            manHoursGrowth = ((latestData.manHours - previousData.manHours) / previousData.manHours) * 100;
        }

        return { hoursGrowth, manHoursGrowth };
    };

    const { hoursGrowth, manHoursGrowth } = calculateGrowth();

    const getStatusBadge = (status) => {
        if (!status) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">-</span>;
        const lower = status.toLowerCase();
        if (lower.includes('deployed') || lower.includes('live') || lower.includes('active')) {
            return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">Live</span>;
        }
        if (lower.includes('hold') || lower.includes('inactive')) {
            return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Hold</span>;
        }
        return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">TBD</span>;
    };

    const getRunStatusBadge = (status) => {
        if (!status) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">-</span>;
        const lower = status.toLowerCase();
        if (lower.includes('completed')) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">OK</span>;
        if (lower.includes('failed')) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-pink-100 text-pink-700">Fail</span>;
        if (lower.includes('running')) return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Run</span>;
        return <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">-</span>;
    };

    const getStatusClass = (status) => {
        if (!status) return 'bg-gray-100 text-gray-600';
        const lower = status.toLowerCase();
        // Check inactive FIRST to avoid matching 'active'
        if (lower.includes('inactive') || lower.includes('in active')) {
            return 'bg-yellow-100 text-yellow-800';
        }
        if (lower.includes('active') || lower.includes('deployed') || lower.includes('live')) {
            return 'bg-green-100 text-green-700';
        }
        if (lower.includes('development') || lower.includes('dev')) {
            return 'bg-blue-100 text-blue-700';
        }
        if (lower.includes('hold')) {
            return 'bg-pink-100 text-pink-700';
        }
        return 'bg-gray-100 text-gray-600';
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:block">
            {/* Mobile Header */}
            <div className="md:hidden bg-white p-4 flex items-center justify-between shadow-sm sticky top-0 z-30 mobile-only-header">
                <div className="flex flex-col items-start ml-2">
                    <img src={`${import.meta.env.BASE_URL}adani-logo.svg`} alt="Adani Logo" className="h-8 w-auto object-contain" />
                    <span className="text-xs font-semibold text-gray-500 mt-1 ml-1">Admin</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    {sidebarOpen ? <X size={24} /> : <div className="space-y-1.5">
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                        <span className="block w-6 h-0.5 bg-gray-600"></span>
                    </div>}
                </button>
            </div>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar - Light Theme */}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300 transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 flex flex-col items-start">
                    <img src={`${import.meta.env.BASE_URL}adani-logo.svg`} alt="Adani" className="h-12 w-auto object-contain mb-2" />
                    <span className="text-sm font-bold text-gray-600 ml-1">Admin</span>
                </div>
                <nav className="p-4 space-y-1">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                        <Home size={20} />
                        <span>Home</span>
                    </Link>
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </button>
                    <Link to="/tree" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                        <Network size={20} />
                        <span>Org Chart</span>
                    </Link>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors mt-4 border-t border-gray-100 pt-6"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 p-4 md:p-8 flex-1 min-w-0">
                {/* Header */}
                <header className="mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{summary?.name || 'Department'} Dashboard</h1>
                        <p className="text-gray-500">{bots.length} Bots in this department</p>
                    </div>
                </header>

                {/* KPI Cards - 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Total Bots Card */}
                    <div className="group bg-gradient-to-br from-blue-50/80 to-white rounded-2xl p-6 shadow-sm border border-blue-100 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wider">Total Bots</p>
                                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{bots.length}</h3>
                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    This Department
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300">
                                <Bot size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Active Bots Card */}
                    <div className="group bg-gradient-to-br from-green-50/80 to-white rounded-2xl p-6 shadow-sm border border-green-100 hover:shadow-lg hover:shadow-green-100/50 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-green-600 mb-1 uppercase tracking-wider">Active Bots</p>
                                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{activeBots}</h3>
                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></div>
                                    Operational
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-green-500 text-white flex items-center justify-center shadow-lg shadow-green-200 group-hover:scale-110 transition-transform duration-300">
                                <CheckCircle size={28} />
                            </div>
                        </div>
                    </div>

                    {/* Inactive Bots Card */}
                    <div className="group bg-gradient-to-br from-pink-50/80 to-white rounded-2xl p-6 shadow-sm border border-pink-100 hover:shadow-lg hover:shadow-pink-100/50 hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-semibold text-pink-600 mb-1 uppercase tracking-wider">Inactive Bots</p>
                                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">{inactiveBots}</h3>
                                <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    Pending / TBD
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-200 group-hover:scale-110 transition-transform duration-300">
                                <XCircle size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Charts - 2 charts side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    {/* Hours Saved Chart */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Hours Saved Variation (Monthly Trend)</h3>
                            <button onClick={() => setInfoModal('hours')} className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Info size={18} />
                            </button>
                        </div>
                        <div className="h-64 min-h-[256px]">
                            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} minTickGap={50} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#3b82f6' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Area yAxisId="left" type="monotone" dataKey="hours" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" name="Cumulative Hours" />
                                    <Area yAxisId="right" type="monotone" dataKey="trend" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" name="Daily Rate (Hours/Day)" />
                                    <Brush dataKey="name" height={30} stroke="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <p className="text-xs text-gray-500">Total Hours</p>
                                <p className="text-xl font-bold text-gray-800">{totalHoursTillNow.toLocaleString()}</p>
                            </div>
                            {hoursGrowth !== 0 && (
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${hoursGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-pink-50 text-pink-700'}`}>
                                        {hoursGrowth >= 0 ? '+' : ''}{hoursGrowth.toFixed(1)}% vs last 30 days
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Man Hours Chart */}
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-gray-700">Man Hours Saved Variation</h3>
                            <button onClick={() => setInfoModal('manhours')} className="text-gray-400 hover:text-blue-600 transition-colors">
                                <Info size={18} />
                            </button>
                        </div>
                        <div className="h-64 min-h-[256px]">
                            <ResponsiveContainer width="100%" height="100%" minHeight={256}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorManHours" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                        </linearGradient>
                                        {/* Removed unused colorPrev def */}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} minTickGap={50} />
                                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Legend iconType="circle" />
                                    <Area type="monotone" dataKey="manHours" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorManHours)" name="Cumulative Man Hours" />
                                    <Brush dataKey="name" height={30} stroke="#16a34a" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between items-end mt-2">
                            <div>
                                <p className="text-xs text-gray-500">Total Man Hours</p>
                                <p className="text-xl font-bold text-gray-800">{totalManHours.toLocaleString()}</p>
                            </div>
                            {manHoursGrowth !== 0 && (
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${manHoursGrowth >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {manHoursGrowth >= 0 ? '+' : ''}{manHoursGrowth.toFixed(1)}% Growth
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="relative flex- ml-auto max-w-xl">
                        <div className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search bots..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-3 py-2 text-sm border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>
                    <div className="relative w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-lg appearance-none bg-white shadow-sm cursor-pointer transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active (Deployed)</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Bot Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                        <table className="w-full border-separate border-spacing-0 min-w-[800px]">
                            <thead>
                                <tr>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 py-3 px-3 text-left text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Co-Bot Name
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 py-3 px-3 text-left text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Description
                                    </th>

                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-1 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm w-32">
                                        Status
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-2 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        PDD
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-2 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Name of User
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-2 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Hours
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-2 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Run
                                    </th>
                                    <th scope="col" className="sticky top-0 z-10 border-b border-gray-300 bg-white/95 px-3 py-3 text-center text-xs font-semibold text-gray-900 backdrop-blur-sm">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBots.map((bot, botIdx) => (
                                    <tr key={bot.id} className="hover:bg-gray-50">
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} py-3 px-3 text-sm text-gray-900`}>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                    <Bot size={14} className="text-blue-600" />
                                                </div>
                                                <div className="flex flex-col justify-center">
                                                    <span className="font-medium font-bold tracking-wide">{bot.use_case_name || '-'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} py-3 px-3 hidden md:table-cell w-16 text-center`}>
                                            <button
                                                onClick={() => {
                                                    setDescriptionModal(bot);
                                                }}
                                                className={`p-1.5 rounded-lg transition-colors inline-flex items-center justify-center ${bot.description
                                                    ? 'text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
                                                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50 cursor-pointer'
                                                    }`}
                                                title={bot.description ? "View Description" : "No Description"}
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>

                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-1 py-3 text-center text-sm w-32`}>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-bold uppercase rounded-full ${getStatusClass(bot.status)}`}>
                                                {bot.status || '-'}
                                            </span>
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-2 py-3 text-center text-sm text-gray-500`}>
                                            {bot.pdd_link ? (
                                                <a href={bot.pdd_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-medium">
                                                    <ExternalLink size={14} />
                                                    <span>PDD-JD</span>
                                                </a>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-2 py-3 text-center text-sm text-gray-500`}>
                                            {bot.spoc_name || '-'}
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-2 py-3 text-center text-sm text-gray-500`}>
                                            {bot.hours_saved_monthly?.toFixed(1) || 0}h
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-2 py-3 text-center text-sm`}>
                                            {getRunStatusBadge(bot.last_run_status)}
                                        </td>
                                        <td className={`${botIdx !== filteredBots.length - 1 ? 'border-b border-gray-200' : ''} px-3 py-3 text-center`}>
                                            <button onClick={() => setSelectedBot(bot)} className="text-indigo-600 hover:text-indigo-900 text-center text-sm font-medium">
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                        Showing <strong className="text-gray-700">{filteredBots.length}</strong> of <strong className="text-gray-700">{bots.length}</strong> bots
                    </div>
                </div>
            </main>

            {/* Description Modal */}
            {descriptionModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setDescriptionModal(null)}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200 transform transition-all border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-xl bg-white shadow-sm text-blue-600 border border-blue-100">
                                    <FileText size={22} className="stroke-[1.5]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                                        {descriptionModal.use_case_name || 'Bot Description'}
                                    </h3>
                                    <p className="text-xs text-blue-600 font-medium">Description & Details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setDescriptionModal(null)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-white/80 rounded-full transition-all duration-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                                <p className="text-gray-700 leading-7 whitespace-pre-wrap text-[15px] font-normal font-sans">
                                    {descriptionModal.description || 'No description provided.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {infoModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInfoModal(null)}>
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${infoModal === 'hours' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                    {infoModal === 'hours' ? <Activity size={20} /> : <Calculator size={20} />}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {infoModal === 'hours' ? 'Hours Saved Calculation' : 'Man Hours Calculation'}
                                </h3>
                            </div>
                            <button onClick={() => setInfoModal(null)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 text-sm text-gray-600">
                            {infoModal === 'hours' ? (
                                <div className="space-y-4">
                                    <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-100">
                                        <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div> Cumulative Hours (Left Axis)
                                        </h4>
                                        <p className="text-purple-800 text-xs leading-relaxed">
                                            Think of this as an <strong>Odometer</strong>. It shows the total running sum of hours saved since the first bot was deployed. It always goes up as time passes.
                                        </p>
                                    </div>

                                    <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-100">
                                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div> Daily Rate (Right Axis)
                                        </h4>
                                        <p className="text-blue-800 text-xs leading-relaxed">
                                            Think of this as a <strong>Speedometer</strong>. It shows how fast we are saving hours <em>per day</em> at any specific point in time.
                                        </p>
                                        <ul className="mt-2 space-y-1 text-blue-700 text-xs list-disc pl-4">
                                            <li><strong>Rising Line:</strong> Bots are becoming more active or new bots are deployed.</li>
                                            <li><strong>Flat Line:</strong> Consistent daily performance.</li>
                                        </ul>
                                    </div>

                                </div>
                            ) : (
                                <>
                                    <p className="leading-relaxed">
                                        This chart tracks <strong>man-hours returned</strong> to the business, translating raw hours into standard workforce equivalents.
                                    </p>
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                                        <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                                            <Calculator size={16} /> Conversion Formula:
                                        </p>
                                        <div className="bg-white/60 p-2 rounded border border-green-100 text-center font-mono text-green-700 mb-3 text-xs">
                                            Total Hours / 240 = Man Months
                                        </div>
                                        <ul className="space-y-2 text-green-800">
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5"></span>
                                                <span>Based on standard 8-hour workday * 30 days.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5"></span>
                                                <span>240 working hours per month.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => setInfoModal(null)}
                                className="px-5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg font-medium transition-all shadow-sm hover:shadow"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {/* Bot Detail Modal */}
            {selectedBot && (
                <BotDetails
                    botId={selectedBot.id}
                    isModal={true}
                    onClose={() => setSelectedBot(null)}
                />
            )}
        </div >
    );
}

export default DepartmentDashboard;
