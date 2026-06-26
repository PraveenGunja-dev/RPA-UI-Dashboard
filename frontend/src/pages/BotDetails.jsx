import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Bot, ArrowLeft, Clock, X, ExternalLink, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { getBotDetail, getBotRuns } from '../lib/api';
import './BotDetails.css';

function BotDetails({ botId, onClose, isModal = false }) {
    const params = useParams();
    const id = botId || params.id;
    const [selectedBot, setSelectedBot] = useState(null);
    const [botRuns, setBotRuns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [botRes, runsRes] = await Promise.all([
                getBotDetail(id),
                getBotRuns(id, 30) // Get last 30 runs
            ]);
            setSelectedBot(botRes.data);
            // Reverse runs to show oldest to newest in chart
            setBotRuns((runsRes.data || []).reverse());
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (bot) => {
        if (!bot || !bot.deployed_date || !bot.hours_saved_monthly) return [];

        const start = new Date(bot.deployed_date);
        if (isNaN(start.getTime())) return [];

        const today = new Date();
        const end = new Date(today);
        end.setMonth(end.getMonth() + 6);

        const dailyRate = bot.hours_saved_monthly / 30;
        const data = [];
        let current = new Date(start);

        while (current <= end) {
            const daysDiff = (current - start) / (1000 * 60 * 60 * 24);
            data.push({
                name: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                hours: Math.round(Math.max(0, daysDiff * dailyRate))
            });
            current.setMonth(current.getMonth() + 1);
        }
        return data;
    };

    const getStatusBadge = (status) => {
        if (!status) return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">TBD</span>;
        const lower = status.toLowerCase();

        // Check for negative/specific statuses first
        if (lower.includes('inactive') || lower.includes('in active')) return <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 font-medium">Inactive</span>;
        if (lower.includes('hold')) return <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">Hold</span>;
        if (lower.includes('failed')) return <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700 font-medium">Failed</span>;

        // Then check for positive statuses
        if (lower.includes('live') || lower.includes('deployed') || lower.includes('active')) return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Live</span>;

        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">{status}</span>;
    };

    const getRunStatusBadge = (status) => {
        if (!status || status === '-') return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">-</span>;
        const lower = status.toLowerCase();
        if (lower.includes('fail')) return <span className="px-2 py-0.5 rounded text-xs bg-pink-100 text-pink-600 font-medium">Failed</span>;
        if (lower.includes('not run')) return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 font-medium">Not Run</span>;
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-600 font-medium">{status}</span>;
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isModal) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [isModal]);

    if (loading) return <div className="flex h-96 items-center justify-center text-gray-500">Loading data...</div>;

    // Name formatting helper
    const getFriendlyName = (useCaseName) => {
        if (!useCaseName) return '-';
        const parts = useCaseName.split('_');
        if (parts.length > 1) {
            return parts.slice(1).join(' ');
        }
        return useCaseName;
    };

    const ModalContent = selectedBot && (
        <div
            className={`bg-white shadow-2xl w-full flex flex-col animate-in fade-in zoom-in duration-200 ${isModal ? 'rounded-2xl max-w-6xl' : 'min-h-[500px] p-6'}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Modal Header */}
            <div className={`px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 ${isModal ? 'rounded-t-2xl' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{getFriendlyName(selectedBot.use_case_name)}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{selectedBot.department_name}</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-medium text-gray-600">{selectedBot.schedule}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {getStatusBadge(selectedBot.status)}
                    {isModal ? (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    ) : (
                        <Link to="/" className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                            <ArrowLeft size={24} />
                        </Link>
                    )}
                </div>
            </div>

            {/* Modal Body - Analytics View */}
            <div className="p-6 overflow-y-auto max-h-[85vh]">

                {/* Description */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description</h3>
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap ${selectedBot.description ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                        {selectedBot.description || '----.'}
                    </p>
                </div>

                {/* Top Metrics Row - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Business SPOC</div>
                        <div className="font-semibold text-gray-900 text-sm truncate" title={selectedBot.spoc_name}>{selectedBot.spoc_name || '-'}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Value Per Run</div>
                        <div className="font-semibold text-gray-900 text-sm">
                            {(() => {
                                const val = selectedBot.value_per_run || 0;
                                const h = Math.floor(val);
                                const m = Math.round((val - h) * 60);
                                if (m === 60) return `${h + 1} hrs`;
                                if (h === 0) return `${m} mins`;
                                return `${h} hrs ${m > 0 ? `${m} mins` : ''}`;
                            })()}
                        </div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Lifetime Runs</div>
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900 text-sm">{selectedBot.total_runs || 0}</div>
                            {selectedBot.total_runs > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${(selectedBot.successful_runs / selectedBot.total_runs) >= 0.9 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {Math.round((selectedBot.successful_runs / selectedBot.total_runs) * 100)}%
                                </span>
                            )}
                        </div>
                    </div>
                    {(() => {
                        const calculateFTESaved = (bot) => {
                            if (!bot.deployed_date || !bot.hours_saved_monthly) return 0;
                            const start = new Date(bot.deployed_date);
                            const now = new Date();
                            if (isNaN(start.getTime())) return 0;

                            const diffTime = Math.abs(now - start);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const dailySavings = bot.hours_saved_monthly / 30;

                            return dailySavings * diffDays; // Return raw float for formatting
                        };
                        const totalSavings = calculateFTESaved(selectedBot);

                        return (
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                <div className="text-[10px] text-blue-600 uppercase tracking-wide mb-1">Total Savings</div>
                                <div className="font-bold text-blue-700 text-sm flex items-center gap-1">
                                    {(() => {
                                        const val = totalSavings || 0;
                                        const h = Math.floor(val);
                                        const m = Math.round((val - h) * 60);
                                        if (m === 60) return `${h + 1} hrs`;
                                        if (h === 0 && m > 0) return `${m} mins`;
                                        if (h === 0 && m === 0) return `0 hrs`;
                                        return `${h} hrs ${m > 0 ? `${m} mins` : ''}`;
                                    })()}
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* Chart 1: Cumulative Savings */}
                    <div className="p-4 rounded-xl border border-gray-100 shadow-sm bg-white h-[280px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">Savings Growth</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Trend
                            </div>
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                {(() => {
                                    const isEstimate = !(selectedBot.status?.toLowerCase().includes('deployed') || selectedBot.status?.toLowerCase().includes('live'));
                                    const chartColor = isEstimate ? "#f59e0b" : "#3b82f6";
                                    return (
                                        <AreaChart data={generateChartData(selectedBot)}>
                                            <defs>
                                                <linearGradient id="colorBotHours" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} minTickGap={30} />
                                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Area type="monotone" dataKey="hours" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorBotHours)" dot={false} />
                                        </AreaChart>
                                    );
                                })()}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Run History */}
                    <div className="p-4 rounded-xl border border-gray-100 shadow-sm bg-white h-[280px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-semibold text-gray-700">Last 30 Runs</h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Success</div>
                                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> Failed</div>
                            </div>
                        </div>

                        {botRuns.length > 0 ? (
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={(() => {
                                            // Ensure exactly 30 items for consistent visual density
                                            const data = [...botRuns];
                                            while (data.length < 30) {
                                                data.unshift({ report_date: '', run_status: '', empty: true });
                                            }
                                            return data.map(r => ({ ...r, barValue: r.empty ? 0 : 1 }));
                                        })()}
                                        margin={{ top: 5, right: 5, bottom: 5, left: -40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="report_date"
                                            tick={{ fontSize: 9, fill: '#9ca3af' }}
                                            axisLine={false}
                                            tickLine={false}
                                            interval={1} // Show every other label (Alternate)
                                            tickFormatter={(val) => {
                                                if (!val) return '';
                                                const d = new Date(val);
                                                return isNaN(d.getTime()) ? val : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                                            }}
                                        />
                                        <YAxis hide domain={[0, 1]} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    if (data.empty) return null;
                                                    return (
                                                        <div className="bg-white p-2 border border-gray-100 shadow-lg rounded-lg text-xs">
                                                            <div className="font-semibold text-gray-700 mb-1">{data.report_date}</div>
                                                            <div className={`font-medium ${data.run_status?.toLowerCase().includes('fail') ? 'text-pink-600' : 'text-green-600'}`}>
                                                                {data.run_status || 'Unknown'}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="barValue" maxBarSize={20} radius={[4, 4, 4, 4]}>
                                            {(() => {
                                                // Ensure exactly 30 items for mapping colors
                                                const data = [...botRuns];
                                                while (data.length < 30) {
                                                    data.unshift({ report_date: '', run_status: '', empty: true });
                                                }
                                                return data.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.empty ? 'transparent' : (entry.run_status?.toLowerCase().includes('fail') ? '#ec4899' : '#22c55e')}
                                                        fillOpacity={0.8}
                                                    />
                                                ));
                                            })()}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm">
                                <Bot size={32} className="mb-2 opacity-20" />
                                No run history available
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Row: Last Run & PDD */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between px-5">
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide block mb-0.5">Deployed Date</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {selectedBot.deployed_date ? new Date(selectedBot.deployed_date).toLocaleDateString() : '-'}
                            </span>
                        </div>
                        <Clock size={16} className="text-gray-400" />
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between px-5">
                        <div>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wide block mb-0.5">Last Execution</span>
                            <span className="text-xs font-semibold text-gray-700">
                                {selectedBot.last_run_time ? new Date(selectedBot.last_run_time).toLocaleDateString() : '-'}
                            </span>
                        </div>
                        {getRunStatusBadge(selectedBot.last_run_status)}
                    </div>
                    {selectedBot.pdd_link ? (
                        <a href={selectedBot.pdd_link} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center justify-between px-5 hover:bg-blue-100 transition-colors cursor-pointer group">
                            <div>
                                <span className="text-[10px] text-blue-500 uppercase tracking-wide block mb-0.5">Documentation</span>
                                <span className="text-xs font-semibold text-blue-700">View PDD</span>
                            </div>
                            <ExternalLink size={16} className="text-blue-500 group-hover:text-blue-700" />
                        </a>
                    ) : (
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between px-5 opacity-50">
                            <div>
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide block mb-0.5">Documentation</span>
                                <span className="text-xs font-semibold text-gray-400">No PDD</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
                {ModalContent}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex justify-center items-start">
            <div className="w-full max-w-6xl">
                {ModalContent}
            </div>
        </div>
    );
}

export default BotDetails;
