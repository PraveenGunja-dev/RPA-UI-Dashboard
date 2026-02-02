import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Bot, ArrowLeft, Clock, X, ExternalLink, Info
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { getBotDetail } from '../lib/api';
import './BotDetails.css';

function BotDetails({ botId, onClose, isModal = false }) {
    const params = useParams();
    const id = botId || params.id;
    const [selectedBot, setSelectedBot] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const botRes = await getBotDetail(id);
            const botData = botRes.data;

            // Calculate Totals for Template
            const deploymentDate = new Date(botData.deployed_date);
            const daysSinceDeployment = !isNaN(deploymentDate.getTime()) ? Math.max(0, (new Date() - deploymentDate) / (1000 * 60 * 60 * 24)) : 0;
            const dailySaving = (botData.hours_saved_monthly || 0) / 30;
            const totalHoursSaved = daysSinceDeployment * dailySaving;
            const totalManHours = totalHoursSaved / 9;

            setSelectedBot({
                ...botData,
                hours_till_now: Math.round(totalHoursSaved),
                man_hours_till_now: Math.round(totalManHours)
            });
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateChartData = (bots) => {
        if (!bots || bots.length === 0) return [];
        const bot = bots[0];
        if (!bot.deployed_date || !bot.hours_saved_monthly) return [];

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
        if (lower.includes('live') || lower.includes('deployed')) return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Live</span>;
        if (lower.includes('hold')) return <span className="px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-medium">Hold</span>;
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">{status}</span>;
    };

    const getRunStatusBadge = (status) => {
        if (!status || status === '-') return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">-</span>;
        if (status.includes('Fail')) return <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">Failed</span>;
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-600 font-medium">Success</span>;
    };

    if (loading) return <div className="flex h-96 items-center justify-center text-gray-500">Loading data...</div>;

    // TEMPLATE START
    const ModalContent = selectedBot && (
        <div
            className={`bg-white shadow-2xl w-full flex flex-col animate-in fade-in zoom-in duration-200 ${isModal ? 'rounded-xl max-w-6xl max-h-[90vh] overflow-hidden' : 'min-h-[600px] p-6'}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedBot.use_case_name}</h2>
                        <p className="text-sm text-gray-500">{selectedBot.department_name}</p>
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

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto">

                {/* Row 1: Bot Information (Row Wise) */}
                <div className="mb-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Bot Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 block mb-1">Developer</span>
                            <div className="font-semibold text-gray-900 truncate" title={selectedBot.developer}>{selectedBot.developer || '-'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 block mb-1">Business SPOC</span>
                            <div className="font-semibold text-gray-900 truncate" title={selectedBot.spoc_name}>{selectedBot.spoc_name || '-'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 block mb-1">Team</span>
                            <div className="font-semibold text-gray-900 truncate">{selectedBot.team || '-'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 block mb-1">Deployed Date</span>
                            <div className="font-semibold text-gray-900 truncate">{selectedBot.deployed_date || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Chart Section (2 cols wide) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-5 rounded-xl border border-gray-100 shadow-sm bg-white">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-semibold text-gray-700">Cumulative Savings Timeline</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    Hours Trend
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    {(() => {
                                        const isEstimate = !(selectedBot.status?.toLowerCase().includes('deployed') || selectedBot.status?.toLowerCase().includes('live'));
                                        const chartColor = isEstimate ? "#f59e0b" : "#3b82f6";

                                        return (
                                            <AreaChart data={generateChartData([selectedBot])}>
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
                                                <Area
                                                    type="monotone"
                                                    dataKey="hours"
                                                    stroke={chartColor}
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorBotHours)"
                                                    name={isEstimate ? "Projected Hours" : "Cumulative Hours"}
                                                    strokeDasharray={isEstimate ? "5 5" : undefined}
                                                />
                                            </AreaChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Run Status & PDD Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600">Last Run Status</span>
                                {getRunStatusBadge(selectedBot.last_run_status)}
                            </div>
                            {selectedBot.pdd_location ? (
                                <a href={selectedBot.pdd_location} target="_blank" rel="noopener noreferrer" className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between hover:bg-blue-100 transition-colors cursor-pointer group">
                                    <span className="text-sm font-medium text-blue-700">PDD Document</span>
                                    <ExternalLink size={16} className="text-blue-500 group-hover:text-blue-700" />
                                </a>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between opacity-50">
                                    <span className="text-sm font-medium text-gray-400">No PDD Available</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats Cards (1 col wide) */}
                    <div className="space-y-4">
                        <div className="p-5 rounded-xl bg-purple-50 border border-purple-100">
                            <div className="mb-2 text-purple-600 font-medium text-sm flex items-center gap-2">
                                <Clock size={16} /> Total Hours Saved
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {selectedBot.hours_till_now?.toLocaleString() || 0}
                                <span className="text-lg text-gray-500 font-normal ml-1">hrs</span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-purple-100 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Monthly Avg</span>
                                <span className="font-semibold text-purple-700">{selectedBot.hours_saved_monthly?.toFixed(1) || 0}h</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-xl bg-pink-50 border border-pink-100">
                            <div className="mb-2 text-pink-600 font-medium text-sm flex items-center gap-2">
                                <Bot size={16} /> Total Man Hours
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {selectedBot.man_hours_till_now?.toLocaleString() || 0}
                            </div>
                            <div className="mt-3 pt-3 border-t border-pink-100 flex justify-between items-center text-sm">
                                <span className="text-gray-500">Monthly Avg</span>
                                <span className="font-semibold text-pink-700">{Math.round((selectedBot.hours_saved_monthly || 0) / 9)}</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-500 leading-relaxed">
                            <Info size={14} className="inline mr-1 mb-0.5" />
                            Data is calculated from deployment date: <strong>{selectedBot.deployed_date || 'Unknown'}</strong>.
                        </div>
                    </div>
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
