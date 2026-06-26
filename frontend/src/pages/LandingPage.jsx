import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, ArrowDown, ArrowUp, ArrowRight,
    Database, FileText, Activity, Network, Lock, Info, RefreshCw, LogOut, ShieldCheck
} from 'lucide-react';
import Orb from '../components/Orb';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getDepartments, getVisitCount, incrementVisitCount, getDailyStats, getFteTrend, getDailyTrend } from '../lib/api';
import './LandingPage.css';

const FteTrendModal = ({ isOpen, onClose, departmentId = null, departmentName = null, chartType = 'hours' }) => {
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDaily = ['runs', 'bots', 'hours_daily'].includes(chartType);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const isCumulative = chartType === 'hours' || chartType === 'fte';
            const fetchFn = isDaily ? getDailyTrend : getFteTrend;

            // For monthly trends, we now pass the cumulative flag
            const promise = isDaily
                ? fetchFn(departmentId)
                : fetchFn(departmentId, isCumulative);

            promise.then(res => {
                setTrendData(res.data);
                setLoading(false);
            })
                .catch(err => {
                    console.error("Failed to load trend data", err);
                    setLoading(false);
                });
        }
    }, [isOpen, departmentId, isDaily]);

    if (!isOpen) return null;

    // Determine config based on chartType
    let chartTitle = "Trend Statistics";
    let chartSubTitle = isDaily ? "Day-wise calculation (Last 30 Days)" : "Monthly calculation (Last 12 Months)";
    let yAxisName = "Value";
    let valueFormatter = (val) => val;
    let seriesData = [];

    if (chartType === 'hours' || chartType === 'hours_month' || chartType === 'hours_daily') {
        chartTitle = chartType === 'hours' ? "Total FTE Hours Saved Trend" :
            chartType === 'hours_month' ? "Monthly FTE Hours Saved Trend" : "Daily FTE Hours Saved Trend";
        yAxisName = "Hours Saved";
        valueFormatter = (val) => `${val} hrs`;
        seriesData = [
            {
                name: 'Hours Saved',
                type: 'bar',
                barWidth: '40%',
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#0B74B0' },
                        { offset: 1, color: '#75479C' }
                    ]),
                    borderRadius: [4, 4, 0, 0]
                },
                data: trendData.map(d => d.savings)
            },
            {
                name: 'Hours Saved (Line)',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 8,
                itemStyle: { color: '#fbbf24' },
                lineStyle: { width: 3, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetY: 5 },
                data: trendData.map(d => d.savings)
            }
        ];
    } else if (chartType === 'fte') {
        chartTitle = "FTE Saved Trend";
        chartSubTitle = "FTE calculation (Total Hours / 8 / 242)";
        yAxisName = "FTEs";
        valueFormatter = (val) => val.toFixed(2);
        seriesData = [
            {
                name: 'FTE Saved',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 10,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(22, 163, 74, 0.3)' },
                        { offset: 1, color: 'rgba(22, 163, 74, 0)' }
                    ])
                },
                itemStyle: { color: '#16a34a' },
                lineStyle: { width: 4 },
                data: trendData.map(d => (d.savings / 8 / 242).toFixed(4))
            }
        ];
    } else if (chartType === 'runs') {
        chartTitle = "Unique Jobs Run Trend";
        yAxisName = "Jobs Count";
        valueFormatter = (val) => `${val} jobs`;
        seriesData = [
            {
                name: 'Jobs Run',
                type: 'line',
                smooth: true,
                symbol: 'diamond',
                symbolSize: 10,
                itemStyle: { color: '#9333ea' },
                lineStyle: { width: 4, type: 'dashed' },
                data: trendData.map(d => d.runs || 0)
            }
        ];
    } else if (chartType === 'bots') {
        chartTitle = "Unique Co-Bots Runned";
        yAxisName = "Bots Count";
        valueFormatter = (val) => `${val} bots`;
        seriesData = [
            {
                name: 'Active Bots',
                type: 'line',
                step: 'end',
                symbol: 'square',
                symbolSize: 10,
                itemStyle: { color: '#2563eb' },
                lineStyle: { width: 4 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(37, 99, 235, 0.2)' },
                        { offset: 1, color: 'rgba(37, 99, 235, 0)' }
                    ])
                },
                data: trendData.map(d => d.bots || 0)
            }
        ];
    }

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '12%',
            containLabel: true
        },
        toolbox: {
            feature: { saveAsImage: { show: true } }
        },
        legend: {
            top: 0
        },
        xAxis: [
            {
                type: 'category',
                data: trendData.map(d => isDaily ? d.label : d.full_label),
                axisLabel: { rotate: 45 }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: yAxisName,
                axisLabel: { formatter: (val) => val.toLocaleString() },
                splitLine: { show: true, lineStyle: { type: 'dashed', color: '#eee' } }
            }
        ],
        series: seriesData.map(s => ({
            ...s,
            tooltip: { valueFormatter }
        }))
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-6 overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between mb-6">
                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-800">
                            {departmentName ? `${departmentName} - ${chartTitle}` : chartTitle}
                        </h3>
                        <p className="text-gray-500 text-sm">{chartSubTitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full transition-colors text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-100 p-4">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-gray-500">Loading trend data...</span>
                        </div>
                    ) : (
                        <ReactECharts option={option} style={{ width: '100%', height: '100%' }} theme="light" />
                    )}
                </div>
            </div>
        </div>
    );
};

const StatsDisplay = () => {
    const [stats, setStats] = useState({ total_runs: 0, unique_bots: 0, hours_saved: 0 }); // Default state
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [modalState, setModalState] = useState({ isOpen: false, departmentId: null, departmentName: null, chartType: 'hours' });

    useEffect(() => {
        loadStats();

        // Auto-refresh every 30 seconds to detect changes
        const interval = setInterval(() => {
            loadStats();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDailyStats();
            const newData = res.data;

            // Check if data has actually changed
            const hasChanged =
                !lastSyncTime ||
                newData.last_sync_time !== lastSyncTime ||
                newData.total_runs !== stats.total_runs ||
                newData.unique_bots !== stats.unique_bots;

            if (hasChanged) {
                setStats(newData);
                setLastSyncTime(newData.last_sync_time);

                // Optional: Show subtle notification when data updates
                if (lastSyncTime && newData.last_sync_time !== lastSyncTime) {
                    console.log('📊 Data refreshed - New bot runs detected!');
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper for formatting hours (Rounded, Clean)
    const formatTime = (hours) => {
        if (!hours) return "0";
        // Round to nearest integer for cleaner UI as requested
        return `${Math.round(hours).toLocaleString()}`;
    };

    // Calculate man hours saved (hours / 8) -> keep as NUMBER
    const manHoursSaved = stats.man_hours_saved || (stats.hours_saved ? (stats.hours_saved / 8).toFixed(1) : 0);

    // Format date for label
    const statsDate = stats.date ? new Date(stats.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });

    const handleMouseEnter = (e, text) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltip({
            show: true,
            text,
            x: rect.left + rect.width / 2, // Center horizontally
            y: rect.top - 10 // Position slightly above the element
        });
    };

    const handleMouseLeave = () => {
        setTooltip(prev => ({ ...prev, show: false }));
    };

    // Tooltip styles
    const tooltipStyle = {
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translate(-50%, -100%)', // Center horizontally and move up by its own height
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        zIndex: 1000,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(4px)'
    };

    return (
        <div className="w-full mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                    {/* Stat Item Component */}
                    {[
                        {
                            label: "Total FTE Hours Saved",
                            subLabel: `since ${stats.oldest_bot_date || 'Inception'}`,
                            value: formatTime(stats.till_date_hours_saved),
                            isTime: true,
                            color: "text-indigo-600",
                            subColor: "text-indigo-600/10",
                            tooltip: "Cumulative hours saved since the deployment of all bots",
                            special: true,
                            chartType: 'hours'
                        },
                        {
                            label: "Total FTE saved",
                            subLabel: `since ${stats.oldest_bot_date || 'Inception'}`,
                            value: Math.round((stats.till_date_hours_saved || 0) / 8 / 242).toLocaleString(),
                            color: "text-green-600",
                            subColor: "text-green-600/10",
                            tooltip: "Total FTE Saved (Total Hours / 8 / 242)",
                            special: true,
                            chartType: 'fte'
                        },
                        {
                            label: "FTE Hours Saved",
                            subLabel: new Date().toLocaleString('default', { month: 'short', year: 'numeric' }),
                            value: formatTime(stats.month_hours_saved),
                            isTime: true,
                            color: "text-[#D2691E]",
                            subColor: "text-[#D2691E]/10",
                            tooltip: "Total full-time equivalent hours saved in the current month",
                            special: true,
                            chartType: 'hours_month'
                        },
                        {
                            label: "Unique Jobs Runned",
                            subLabel: `on ${statsDate || ''}`.trim(),
                            value: (stats.total_runs || 0),
                            color: "text-purple-600",
                            subColor: "text-purple-600/10",
                            tooltip: "Total count of unique automation jobs executed on this date",
                            special: true,
                            chartType: 'runs'
                        },
                        {
                            label: "Unique Co-Bots Runned",
                            subLabel: `on ${statsDate || ''}`.trim(),
                            value: (stats.unique_bots || 0),
                            color: "text-blue-600",
                            subColor: "text-blue-600/10",
                            tooltip: "Total number of unique bots deployed across all departments",
                            special: true,
                            chartType: 'bots'
                        },
                        {
                            label: "Daily FTE Hours",
                            subLabel: statsDate ? `on ${statsDate}` : '',
                            value: formatTime(stats.hours_saved || 0),
                            color: "text-emerald-600",
                            subColor: "text-emerald-600/10",
                            isTime: true,
                            tooltip: "Actual hours saved for this specific date",
                            showSync: true,
                            special: true,
                            chartType: 'hours_daily'
                        }

                    ].map((item, idx) => (
                        <div key={idx} className="relative p-6 text-center hover:bg-gray-50/80 transition-all duration-300 group flex flex-col items-center justify-center min-h-[140px]">
                            {/* Label */}
                            <div className="flex items-center justify-center gap-1.5 mb-3">
                                <div className="flex flex-col items-center">
                                    <span className="text-[11px] font-bold text-gray-400 tracking-wider group-hover:text-gray-600 transition-colors">
                                        {item.label}
                                    </span>
                                    {item.subLabel && (
                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest group-hover:text-gray-500 transition-colors mt-0.5">
                                            {item.subLabel}
                                        </span>
                                    )}
                                </div>
                                <div className="relative group/tooltip">
                                    <Info
                                        size={13}
                                        className={`text-gray-300 transition-colors ${item.special ? 'cursor-pointer hover:text-indigo-500' : 'cursor-pointer hover:text-gray-500'}`}
                                        onClick={(e) => {
                                            if (item.special) {
                                                e.stopPropagation();
                                                setModalState({
                                                    isOpen: true,
                                                    departmentId: null,
                                                    departmentName: null,
                                                    chartType: item.chartType
                                                });
                                            }
                                        }}
                                    />
                                    <div className={`absolute bottom-full mb-2 w-48 max-w-[90vw] p-2 bg-gray-900 text-white text-[10px] rounded shadow-lg pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-[9999] text-center font-medium ${idx === 0 ? 'left-0' : idx === 5 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                                        }`}>
                                        {item.tooltip}
                                        <div className={`absolute top-full border-4 border-transparent border-t-gray-900 ${idx === 0 ? 'left-4' : idx === 5 ? 'right-4' : 'left-1/2 -translate-x-1/2'
                                            }`}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Value */}
                            <div className={`font-black tracking-tight ${item.color} text-3xl`}>
                                {item.value}
                            </div>

                            {item.showSync && lastSyncTime && (
                                <div className="absolute bottom-3 right-4 flex justify-end">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-400">
                                        <RefreshCw size={10} className="text-gray-400" />
                                        Synced: {new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <FteTrendModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                departmentId={modalState.departmentId}
                departmentName={modalState.departmentName}
                chartType={modalState.chartType}
            />
        </div>
    );
};

const COLORS = ["honolulu-blue", "dark-lavender", "forest-green"];

const getDeptConfig = (dept, index) => {
    const color = COLORS[index % COLORS.length];
    return {
        color,
        icon: index % 3 === 0 ? <Activity className="h-6 w-6" /> :
            index % 3 === 1 ? <Database className="h-6 w-6" /> :
                <FileText className="h-6 w-6" />,
        features: [
            { label: "Active Bots", value: dept.deployed_bots || 0 },
            { label: "Hours Saved (Today)", value: (dept.hours_saved_today || 0).toFixed(1) },
            { label: "Man Hours (Today)", value: (dept.hours_saved_today / 8).toFixed(1) }
        ]
    };
};

const getColorClasses = (color) => {
    switch (color) {
        case "honolulu-blue":
            return { bgClass: "bg-honolulu-blue/20", textClass: "text-honolulu-blue", btnColor: "#0B74B0" };
        case "dark-lavender":
            return { bgClass: "bg-dark-lavender/20", textClass: "text-dark-lavender", btnColor: "#75479C" };
        case "forest-green":
            return { bgClass: "bg-forest-green/20", textClass: "text-forest-green", btnColor: "#16a34a" };
        default:
            return { bgClass: "bg-gray-200/20", textClass: "text-gray-800", btnColor: "#333" };
    }
};

const getBorderColor = (color) => {
    switch (color) {
        case "honolulu-blue": return "#0B74B0";
        case "dark-lavender": return "#75479C";
        case "forest-green": return "#16a34a";
        default: return "#ccc";
    }
};

import { useAuth } from '../context/AuthContext';

function LandingPage() {
    const navigate = useNavigate();
    const { user, isAdmin, logout } = useAuth();
    const [visitCount, setVisitCount] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deptModalState, setDeptModalState] = useState({ isOpen: false, departmentId: null, departmentName: null, chartType: 'hours' });
    const hasIncremented = useRef(false);

    useEffect(() => {
        const handleOpenDeptTrend = (e) => {
            setDeptModalState({
                isOpen: true,
                departmentId: e.detail.id,
                departmentName: e.detail.name,
                chartType: e.detail.chartType || 'hours'
            });
        };

        window.addEventListener('open-dept-trend', handleOpenDeptTrend);
        return () => window.removeEventListener('open-dept-trend', handleOpenDeptTrend);
    }, []);

    useEffect(() => {
        const initData = async () => {
            await loadDepartments();
            await loadVisitCount();
        };
        initData();

        // Auto-refresh departments every 45 seconds for dynamic FTE updates
        const deptInterval = setInterval(() => {
            loadDepartments();
        }, 45000); // 45 seconds

        return () => clearInterval(deptInterval);
    }, []);

    const loadDepartments = async () => {
        try {
            const dRes = await getDepartments();
            const deptData = Array.isArray(dRes.data) ? dRes.data : (Array.isArray(dRes) ? dRes : []);

            if (deptData.length > 0) {
                setDepartments(deptData);
            } else {
                setDepartments([]);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error loading departments:", error);
            setLoading(false);
        }
    };

    const loadVisitCount = async () => {
        try {
            // Only increment once per session/mount lifecycle
            if (!hasIncremented.current) {
                hasIncremented.current = true;
                await incrementVisitCount();
            }

            // Always fetch the latest count
            const vRes = await getVisitCount();
            setVisitCount(vRes.data?.count || 0);
        } catch (error) {
            console.warn("Visit counter not available");
        }
    };

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToContent = () => {
        document.querySelector('.products-grid')?.scrollIntoView({ behavior: 'smooth' });
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <div className="orb-section min-h-screen relative">
                {/* Header Actions (Top Right) */}
                <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                    {/* User Identity Display */}
                    {user && (
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Logged in as</span>
                            <span className="text-xs font-extrabold text-gray-700 truncate max-w-[150px] md:max-w-[300px]">{user.email}</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    {user.role} Access
                                </span>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-black shadow-xl shadow-indigo-500/40 hover:scale-[1.05] hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest pointer-events-auto ring-4 ring-indigo-50"
                        >
                            <ShieldCheck size={16} />
                            Admin Console
                        </button>
                    )}

                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/40 backdrop-blur-md border-[3px] border-red-500 rounded-full text-gray-700 hover:text-white hover:bg-red-500 shadow-lg transition-all text-[10px] font-black uppercase tracking-widest pointer-events-auto"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>

                <div className="w-full flex justify-center">
                    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', height: '600px' }}>
                            <Orb />
                            <div className="absolute" style={{ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                                <img
                                    src={`${import.meta.env.BASE_URL}adani-re.png`}
                                    alt="Adani Logo"
                                    style={{ width: '200px', height: '200px', objectFit: 'contain', opacity: 0.9, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container" style={{ textAlign: 'center', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                    <h1 className="title-gradient p-2 text-6xl font-extrabold title-responsive" style={{ letterSpacing: '-0.025em' }}>
                        COBOT Console
                    </h1>
                    <div className="flex justify-center items-center gap-4 mt-4">
                        <StatsDisplay />
                    </div>
                </div>
            </div>

            {/* Scroll Down FAB */}
            <button onClick={scrollToContent} className="scroll-fab" aria-label="Scroll down">
                <ArrowDown size={16} />
            </button>

            {/* Department Cards Grid */}
            <div className="container" style={{ paddingBottom: '4rem', minHeight: '100vh' }}>


                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : departments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
                        No departments found.
                    </div>
                ) : (
                    <div className="products-grid">
                        {departments.filter(dept => dept.deployed_bots > 0).map((dept, idx) => {
                            const { color, icon, features } = getDeptConfig(dept, idx);
                            const colorClasses = getColorClasses(color);
                            // Use deployed_bots for status since we might not have run data yet
                            const hasActiveBots = dept.deployed_bots > 0 || dept.running_bots > 0;

                            return (
                                <div
                                    key={dept.id || idx}
                                    className="product-card"
                                    onClick={() => navigate(`/department/${dept.id}`)}
                                    style={{
                                        cursor: 'pointer',
                                        borderColor: getBorderColor(color),
                                        borderWidth: '2px'
                                    }}
                                >
                                    <div className="card-header">
                                        <div className="flex align-center" style={{ gap: '1rem', alignItems: 'center' }}>
                                            <div
                                                className={`flex-shrink-0 flex items-center justify-center ${colorClasses.bgClass} ${colorClasses.textClass}`}
                                                style={{ width: '48px', height: '48px', borderRadius: '0.5rem' }}
                                            >
                                                {icon}
                                            </div>
                                            <div className="flex-1" style={{ minWidth: 0 }}>
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-bold text-base truncate">{dept.name}</h3>
                                                    {/* Bot count with blinking dot */}
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                    <div className="card-content">
                                        <div className="flex-1 pb-4">
                                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3">Key Metrics:</h4>
                                            <div className="space-y-2">
                                                {/* Active Bots */}
                                                <div className="flex justify-between items-center" style={{ gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                                                    <span className="text-xs text-gray-500 font-medium">Active Bots:</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                        <span className="font-bold text-lg" style={{ color: colorClasses.btnColor }}>{dept.deployed_bots || 0}</span>
                                                    </div>
                                                </div>

                                                {/* Last Data Date Savings */}
                                                <div className="flex justify-between items-center" style={{ gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                                                    <span className="text-xs text-gray-500 font-medium">
                                                        FTE Saved {dept.last_sync_date ? ` on ${new Date(dept.last_sync_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}:
                                                    </span>
                                                    <span className="font-bold text-lg" style={{ color: colorClasses.btnColor }}>
                                                        {(() => {
                                                            const val = dept.hours_saved_yesterday || 0;
                                                            const h = Math.floor(val);
                                                            const m = Math.round((val - h) * 60);
                                                            if (m === 60) return `${h + 1} hrs`;
                                                            if (h === 0 && m > 0) return `${m} mins`;
                                                            if (h === 0 && m === 0) return `0 hrs`;
                                                            if (m === 0) return `${h} hrs`;
                                                            return `${h} hrs ${m} mins`;
                                                        })()}
                                                    </span>
                                                </div>
                                                {/* Till Date Savings */}
                                                <div className="flex justify-between items-center" style={{ gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-gray-500 font-medium">FTE Saved - Till Date:</span>
                                                        <Info
                                                            size={12}
                                                            className="text-gray-300 cursor-pointer hover:text-blue-500 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // We need to pass state up or manage it locally. 
                                                                // Since StatsDisplay manages the modal, we should probably lift state up or create another modal instance here.
                                                                // Actually, wait, simpler: Let's use a local state in LandingPage for the DEPT modals.
                                                                // But StatsDisplay is inside LandingPage too.
                                                                // Let's dispatch a custom event or pass a handler if we could refactor.
                                                                // Given the structure, let's add a `onShowTrend` prop to `LandingPage` context? No, too complex.
                                                                // Let's just emit an event or simpler: 
                                                                // We cannot easily access StatsDisplay state from here without refactoring.
                                                                // Let's create a SEPARATE modal instance in LandingPage for departments.
                                                                window.dispatchEvent(new CustomEvent('open-dept-trend', { detail: { id: dept.id, name: dept.name } }));
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="font-bold text-lg" style={{ color: colorClasses.btnColor }}>
                                                        {(() => {
                                                            const val = dept.hours_saved_till_date || 0;
                                                            const h = Math.floor(val);
                                                            const m = Math.round((val - h) * 60);
                                                            if (m === 60) return `${h + 1} hrs`;
                                                            if (h === 0 && m > 0) return `${m} mins`;
                                                            if (h === 0 && m === 0) return `0 hrs`;
                                                            if (m === 0) return `${h} hrs`;
                                                            return `${h} hrs ${m} mins`;
                                                        })()}
                                                    </span>
                                                </div>

                                                {/* Monthly Savings */}
                                                <div className="flex justify-between items-center" style={{ gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                                                    <span className="text-xs text-gray-500 font-medium">FTE Saved in {new Date().toLocaleString('default', { month: 'long' })}:</span>
                                                    <span className="font-bold text-lg" style={{ color: colorClasses.btnColor }}>
                                                        {(() => {
                                                            const val = dept.hours_saved_month || 0;
                                                            const h = Math.floor(val);
                                                            const m = Math.round((val - h) * 60);
                                                            if (m === 60) return `${h + 1} hrs`;
                                                            if (h === 0 && m > 0) return `${m} mins`;
                                                            if (h === 0 && m === 0) return `0 hrs`;
                                                            if (m === 0) return `${h} hrs`;
                                                            return `${h} hrs ${m} mins`;
                                                        })()}
                                                    </span>
                                                </div>


                                            </div>
                                        </div>

                                        <div className="pb-6">
                                            <button
                                                className="btn btn-primary"
                                                style={{ backgroundColor: colorClasses.btnColor }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/department/${dept.id}`);
                                                }}
                                            >
                                                View Dashboard <ArrowRight size={16} className="ml-2" />
                                            </button>
                                        </div>
                                    </div>
                                </div >
                            );
                        })}
                    </div >
                )}
            </div >

            {/* Global Hierarchy Button (Bottom) */}
            < div className="container pb-20 flex justify-center" >
                <button
                    onClick={() => navigate('/tree')}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-full hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transform hover:-translate-y-1"
                >
                    <Network size={24} />
                    COBOT Organization Chart
                    <ArrowRight size={24} />
                </button>
            </div >

            {/* Footer */}
            < div className="footer mt-7" >
                <div className="container">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                            <FileText size={16} />
                            <a
                                href={`${import.meta.env.BASE_URL || '/'}COBOT_KPI's_Doc.pdf`.replace(/\/+/g, '/')}
                                download="COBOTManual.pdf"
                                className="font-semibold underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-600"
                            >
                                COBOT KPI's
                            </a>
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                            Total Visits: {visitCount.toLocaleString()} | Powered By – Adani Green Energy Limited
                        </div>
                    </div>
                </div>
            </div >

            {/* Scroll Top */}
            {
                showScrollTop && (
                    <button onClick={scrollToTop} className="scroll-fab" aria-label="Scroll to top">
                        <ArrowUp size={16} />
                    </button>
                )
            }

            {/* Department Trend Modal */}
            <FteTrendModal
                isOpen={deptModalState.isOpen}
                onClose={() => setDeptModalState({ ...deptModalState, isOpen: false })}
                departmentId={deptModalState.departmentId}
                departmentName={deptModalState.departmentName}
                chartType={deptModalState.chartType}
            />
        </div >
    );
}

export default LandingPage;
