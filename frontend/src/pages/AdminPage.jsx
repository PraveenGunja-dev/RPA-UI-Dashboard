import { useState, useEffect } from 'react';
import {
    ArrowLeft, Download, FileText, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Calendar,
    Bot, Users, Building2, Upload, Search, Plus, Edit2, Home,
    Trash2, X, Save, RefreshCw, ExternalLink, BarChart3, Clock, Shield, Database,
    HelpCircle, Layers, Cpu, Code2, Calculator, Palette, Info, BookOpen, Menu, LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Use Vite's BASE_URL (set in config) or default to /
const VITE_BASE = import.meta.env.BASE_URL || '/';
const API_BASE_URL = VITE_BASE.endsWith('/') ? `${VITE_BASE}api` : `${VITE_BASE}/api`;

// Helper: Format hours to "X hrs" (Rounded)
const formatTime = (hours) => {
    if (!hours) return "0 hrs";
    return `${Math.round(hours).toLocaleString()} hrs`;
};

// Tab Components
const TabButton = ({ active, onClick, icon: Icon, label, count }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all ${active
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-gray-600 hover:bg-gray-100'
            }`}
    >
        <Icon size={20} />
        <span className="font-semibold flex-1">{label}</span>
        {count !== undefined && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                {count}
            </span>
        )}
    </button>
);

// Stats Card
const StatCard = ({ icon: Icon, label, value, color, trend }) => (
    <div className={`bg-gradient-to-br ${color} p-5 rounded-2xl shadow-sm border border-white/50`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
                <p className="text-3xl font-black mt-1">{value}</p>
                {trend && (
                    <p className="text-xs mt-2 opacity-80">{trend}</p>
                )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Icon size={24} />
            </div>
        </div>
    </div>
);

// Bot Form Modal
const BotFormModal = ({ bot, onClose, onSave, departments, spocs, allBots = [] }) => {
    // When editing, we need to find department_id and spoc_id from names if not provided
    const getInitialFormData = () => {
        if (!bot) {
            let nextCode = 'AUC001';
            if (allBots && allBots.length > 0) {
                const aucBots = allBots.filter(b => b.use_case_no && String(b.use_case_no).startsWith('AUC'));
                if (aucBots.length > 0) {
                    const maxNum = Math.max(...aucBots.map(b => {
                        const match = String(b.use_case_no).match(/AUC(\d+)/);
                        return match ? parseInt(match[1], 10) : 0;
                    }));
                    nextCode = `AUC${String(maxNum + 1).padStart(3, '0')}`;
                }
            }
            return {
                use_case_name: '',
                bot_name: '',
                department_id: '',
                spoc_id: '',
                status: 'Active',
                developer: '',
                hours_saved_monthly: 0,
                pdd_link: '',
                schedule_time: '',
                use_case_no: nextCode,
                description: ''
            };
        }

        // Find department_id from department_name if not provided
        let deptId = bot.department_id;
        if (!deptId && bot.department_name) {
            const dept = departments.find(d => d.name === bot.department_name);
            deptId = dept?.id || '';
        }

        // Find spoc_id from spoc_name if not provided
        let spocId = bot.spoc_id;
        if (!spocId && bot.spoc_name) {
            const spoc = spocs.find(s => s.name === bot.spoc_name);
            spocId = spoc?.id || '';
        }

        return {
            ...bot,
            department_id: deptId || '',
            spoc_id: spocId || ''
        };
    };

    const [formData, setFormData] = useState(getInitialFormData());
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving bot:', error);
            alert('Failed to save bot');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Bot size={20} className="text-blue-600" />
                        {bot ? 'Edit Bot' : 'Add New Bot'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Agent Code</label>
                            <input
                                type="text"
                                list="agent-code-suggestions"
                                value={formData.use_case_no || ''}
                                onChange={(e) => setFormData({ ...formData, use_case_no: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${allBots.some(b => b.use_case_no === formData.use_case_no && b.id !== bot?.id) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                placeholder="e.g., AUC001"
                            />
                            <datalist id="agent-code-suggestions">
                                {allBots.map(b => b.use_case_no && (
                                    <option key={`code-${b.id}`} value={b.use_case_no} />
                                ))}
                            </datalist>
                            {allBots.some(b => b.use_case_no === formData.use_case_no && b.id !== bot?.id) && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                                    <AlertTriangle size={12} /> An agent with this code already exists
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Co-Bot Name *</label>
                            <input
                                type="text"
                                list="bot-name-suggestions"
                                value={formData.use_case_name || ''}
                                onChange={(e) => setFormData({ ...formData, use_case_name: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${allBots.some(b => b.use_case_name === formData.use_case_name && b.id !== bot?.id) ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                placeholder="e.g., AUC001_StoreMIS"
                                required
                            />
                            <datalist id="bot-name-suggestions">
                                {allBots.map(b => (
                                    <option key={b.id} value={b.use_case_name} />
                                ))}
                            </datalist>
                            {allBots.some(b => b.use_case_name === formData.use_case_name && b.id !== bot?.id) && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                                    <AlertTriangle size={12} /> A bot with this name already exists
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
                            <select
                                value={formData.department_id || ''}
                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">SPOC</label>
                            <select
                                value={formData.spoc_id || ''}
                                onChange={(e) => setFormData({ ...formData, spoc_id: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select SPOC</option>
                                {spocs.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                            <input
                                list="status-options"
                                value={formData.status || ''}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Select or type a status..."
                            />
                            <datalist id="status-options">
                                <option value="Active" />
                                <option value="Deployed" />
                                <option value="Under Development" />
                                <option value="In Active" />
                                <option value="On Hold" />
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Developer</label>
                            <input
                                type="text"
                                value={formData.developer || ''}
                                onChange={(e) => setFormData({ ...formData, developer: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Developer name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Hours Saved (Monthly)</label>
                            <input
                                type="number"
                                value={formData.hours_saved_monthly || 0}
                                onChange={(e) => setFormData({ ...formData, hours_saved_monthly: parseFloat(e.target.value) || 0 })}
                                className="w-full text-center px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Time</label>
                            <input
                                type="text"
                                value={formData.schedule_time || ''}
                                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., 07:00:00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                            <input
                                type="text"
                                value={formData.frequency || ''}
                                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="e.g., 30 or Daily"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Per Day Saving</label>
                            <input
                                type="number"
                                value={formData.per_day_saving_hours || 0}
                                onChange={(e) => setFormData({ ...formData, per_day_saving_hours: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                step="0.0001"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Schedule Details</label>
                            <input
                                type="text"
                                value={formData.schedule_details || ''}
                                onChange={(e) => setFormData({ ...formData, schedule_details: e.target.value })}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Details..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                            placeholder="Enter bot description..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">PDD Link</label>
                        <input
                            type="url"
                            value={formData.pdd_link || ''}
                            onChange={(e) => setFormData({ ...formData, pdd_link: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2"
                        >
                            <Save size={18} />
                            {saving ? 'Saving...' : 'Save Bot'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Bots Management Section
const BotsSection = ({ bots, departments, spocs, onRefresh }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingBot, setEditingBot] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8; // Show 8 items per page to fit screen nicely

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter]);

    // Extract friendly name from use_case_name (e.g., "AUC004_AGEL_StoreMIS" -> "AGEL StoreMIS")
    const getFriendlyName = (useCaseName) => {
        if (!useCaseName) return '-';
        const parts = useCaseName.split('_');
        if (parts.length > 1) {
            return parts.slice(1).join(' ');
        }
        return useCaseName;
    };

    const filteredBots = bots.filter(bot => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (bot.use_case_name || '').toLowerCase().includes(query) ||
            (bot.department_name || '').toLowerCase().includes(query) ||
            (bot.description || '').toLowerCase().includes(query);

        const botStatus = (bot.status || '').toLowerCase();
        const filterStatus = statusFilter.toLowerCase();

        let matchesStatus = statusFilter === 'all';
        if (!matchesStatus) {
            if (filterStatus === 'inactive') {
                matchesStatus = botStatus.includes('inactive') || botStatus.includes('in active');
            } else if (filterStatus === 'active') {
                matchesStatus = (botStatus.includes('active') || botStatus.includes('deployed')) &&
                    !botStatus.includes('inactive') &&
                    !botStatus.includes('in active');
            } else {
                matchesStatus = botStatus.includes(filterStatus);
            }
        }

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredBots.length / itemsPerPage);
    const paginatedBots = filteredBots.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSaveBot = async (formData) => {
        if (editingBot) {
            await axios.put(`${API_BASE_URL}/admin/bots/${editingBot.id}`, formData);
        } else {
            await axios.post(`${API_BASE_URL}/admin/bots`, formData);
        }
        onRefresh();
        setEditingBot(null);
    };

    const handleDeleteBot = async (botId) => {
        if (window.confirm('Are you sure you want to delete this bot?')) {
            await axios.delete(`${API_BASE_URL}/admin/bots/${botId}`);
            onRefresh();
        }
    };

    const getStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-600';
        const s = status.toLowerCase();
        if (s.includes('inactive') || s.includes('in active')) return 'bg-yellow-100 text-yellow-800';
        if (s.includes('active') || s.includes('deployed')) return 'bg-emerald-100 text-emerald-700';
        if (s.includes('development')) return 'bg-blue-100 text-blue-700';
        if (s.includes('hold')) return 'bg-pink-100 text-pink-700';
        return 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Bot Management</h2>
                    <p className="text-gray-500">Manage all automation bots in the system</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open(`${API_BASE_URL}/admin/export-bots`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <Download size={20} />
                        Download Report
                    </button>
                    <button
                        onClick={() => { setEditingBot(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                    >
                        <Plus size={20} />
                        Add New Bot
                    </button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search bots by name or department..."
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="deployed">Deployed</option>
                    <option value="development">Development</option>
                    <option value="inactive">In Active</option>
                </select>
            </div>

            {/* Bots Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
                {/* Changed overflow-y-auto to allow static table with pagination */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Co-Bot Name</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Description</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Department</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">SPOC</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Status</th>
                                <th className="px-6 py-4 text-right bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Hours/Month</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">PDD</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedBots.map((bot) => (
                                <tr key={bot.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                                                <Bot size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{getFriendlyName(bot.use_case_name)}</p>
                                                <p className="text-xs text-gray-500">{bot.use_case_no || bot.use_case_name?.split('_')[0] || '-'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={bot.description}>
                                        {bot.description || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{bot.department_name || '-'}</td>
                                    <td className="px-6 py-4 text-gray-600">{bot.spoc_name || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(bot.status)}`}>
                                            {bot.status || '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                                        {formatTime(bot.hours_saved_monthly)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {bot.pdd_link ? (
                                            <a href={bot.pdd_link} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800">
                                                <ExternalLink size={16} />
                                            </a>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setEditingBot(bot); setShowModal(true); }}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteBot(bot.id)}
                                                className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white relative z-20">
                    <div className="text-sm text-gray-500">
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredBots.length)}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredBots.length)}</strong> of <strong>{filteredBots.length}</strong> bots
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <BotFormModal
                    bot={editingBot}
                    onClose={() => { setShowModal(false); setEditingBot(null); }}
                    onSave={handleSaveBot}
                    departments={departments}
                    spocs={spocs}
                    allBots={bots}
                />
            )}
        </div>
    );
};

// File Logs Section
const FileLogsSection = ({ logs, onRefresh }) => {
    const [dateFilter, setDateFilter] = useState('7days'); // 7days, 30days, all
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const handleDownload = (logId) => {
        window.open(`${API_BASE_URL}/admin/download/${logId}`, '_blank');
    };

    // Filter Logs by Date
    const filteredLogs = logs.filter(log => {
        if (dateFilter === 'all') return true;

        const dateStr = log.file_date || log.upload_date;
        if (!dateStr) return false;

        const logDate = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cutoff = new Date(today);
        cutoff.setDate(today.getDate() - (dateFilter === '7days' ? 7 : 30));

        // Note: logDate comparison depends on log.file_date format. 
        // If it's YYYY-MM-DD it will parse to UTC 00:00. This is fine for approximation.
        return logDate >= cutoff;
    });

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">File Processing Logs</h2>
                    <p className="text-gray-500">View all processed SharePoint sync files</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium text-gray-700 appearance-none cursor-pointer hover:border-blue-400 transition-colors shadow-sm"
                            style={{ backgroundImage: 'none' }} // Remove default arrow if needed, but styling usually overrides it or keeps it
                        >
                            <option value="7days">Last 7 Days</option>
                            <option value="30days">Last 30 Days</option>
                            <option value="all">All Time</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </div>
                    <button
                        onClick={onRefresh}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Status</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Filename</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Report Date</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Uploaded At</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Jobs Runned</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Bots Runned</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Hours Saved</th>
                                <th className="px-6 py-4 text-center bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedLogs.length > 0 ? (
                                paginatedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${log.status === 'Success'
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                }`}>
                                                {log.status === 'Success' ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                                                {log.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{log.filename}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                                                {log.file_date}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-sm">
                                            {new Date(log.upload_date).toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-gray-600">{log.processed_count}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-indigo-600">{log.unique_bots_count}</td>
                                        <td className="px-6 py-4 text-center font-mono font-bold text-emerald-600">
                                            {formatTime(log.hours_saved_estimate)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {log.file_path && (
                                                <button
                                                    onClick={() => handleDownload(log.id)}
                                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                        No logs found within the selected period ({dateFilter === 'all' ? 'All Time' : dateFilter === '7days' ? 'Last 7 Days' : 'Last 30 Days'}).
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white relative z-20">
                    <div className="text-sm text-gray-500">
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, filteredLogs.length)}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> logs
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};



// User Manual Section
const UserManualSection = () => {
    return (
        <div className="space-y-8 h-full overflow-y-auto pr-4 pb-8 custom-scrollbar">
            {/* Header */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2">Admin User Guide</h1>
                    <p className="text-gray-500 max-w-3xl text-lg">
                        Complete documentation for managing the Adani Co-Bot Dashboard, including bot configuration, file uploads, and understanding system calculations.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Core Features */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. Bot Management */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Bot Management</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Plus size={16} className="text-green-600" /> Adding New Bots
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        To add a new bot manually, navigate to the <strong>"Bots"</strong> tab and click the <strong>"Add Bot"</strong> button. You will need to provide:
                                    </p>
                                    <ul className="text-sm text-gray-500 list-disc list-inside space-y-1 ml-2">
                                        <li><strong>Use Case Name:</strong> Must match the name in Daily Reports exactly.</li>
                                        <li><strong>Department & SPOC:</strong> For organizational grouping.</li>
                                        <li><strong>Frequency & Schedule:</strong> Critical for ROI calculations.</li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <Edit2 size={16} className="text-amber-600" /> Editing Bots
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Click the <strong>Edit icon</strong> on any bot card to update its details.
                                        Use this to correct names, update frequencies, or change the status (e.g., from 'Development' to 'Live').
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Logic & Calculations */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <Calculator size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">ROI Calculation Logic</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-gray-600 text-sm">
                                The system calculates <strong>Realized Savings</strong> differently based on the bot's schedule type.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                    <div className="font-bold text-blue-800 text-sm mb-2">Scenario A: On-Demand / Multiple Runs</div>
                                    <div className="text-xs text-blue-900 bg-blue-100/50 p-2 rounded font-mono mb-2">
                                        Savings = Per_Run_Hours × Run_Count
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        Used when Schedule contains "On Demand" or "Multiple". The <em>'Per Day Saving Hours'</em> field is treated as saving <strong>per run</strong>.
                                    </p>
                                </div>

                                <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100">
                                    <div className="font-bold text-purple-800 text-sm mb-2">Scenario B: Fixed Schedule (Daily/Weekly)</div>
                                    <div className="text-xs text-purple-900 bg-purple-100/50 p-2 rounded font-mono mb-2">
                                        Savings = (Monthly_Hours ÷ Frequency) × Run_Count
                                    </div>
                                    <p className="text-xs text-purple-700">
                                        Used for standard scheduled bots. We derive a 'per-run' value by dividing the total expected monthly savings by the expected run frequency.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <Info size={20} className="text-gray-400 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">Man-Hours Calculation</h4>
                                    <p className="text-xs text-gray-600 mt-1">
                                        <strong>1 Man-Day = 8 Hours.</strong> All display metrics showing "Man Hours" are simply the total generic hours divided by 8.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Files & Status */}
                <div className="space-y-8">

                    {/* 3. File Uploads */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                                <Upload size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">File Operations</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="relative pl-4 border-l-2 border-orange-200">
                                <h4 className="font-bold text-sm text-gray-900">Master File Upload</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload the full inventory of bots. <br />
                                    <strong>Key Columns:</strong> <code>Use Case Name</code>, <code>Status</code>, <code>Department</code>, <code>Frequency</code>.
                                    <br /><em>Re-uploading updates existing bots based on Use Case Name.</em>
                                </p>
                            </div>
                            <div className="relative pl-4 border-l-2 border-blue-200">
                                <h4 className="font-bold text-sm text-gray-900">Daily Report Upload</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Upload the daily run logs from the Control Room.
                                    <br />The system matches entries to the Master List to calculate that day's specific savings.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Terminology */}
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                                <FileText size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg">Definitions</h3>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Active Bot</span>
                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Status: Deployed / Live / Active</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Inactive Bot</span>
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold">Status: Hold / Inactive</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">Unique Run</span>
                                <span className="text-gray-400 italic text-xs">Distinct Bot ID runs in a day</span>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            {/* Footer */}
            <div className="text-center pt-8 text-gray-400 text-xs border-t border-gray-100 mt-8">
                <p>Adani Co-Bot Center of Excellence • Version 2.5.0</p>
            </div>
        </div>
    );
};

// Dashboard Overview Section
const DashboardSection = ({ stats, onSync, isSyncing }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500">System statistics and quick insights</p>
            </div>
            <button
                onClick={onSync}
                disabled={isSyncing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${isSyncing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50'}`}
            >
                <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <StatCard
                icon={Bot}
                label="Total Bots"
                value={stats.totalBots}
                color="from-blue-500 to-indigo-600 text-white"
            />
            <StatCard
                icon={Building2}
                label="Departments"
                value={stats.totalDepartments}
                color="from-purple-500 to-pink-600 text-white"
            />
            <StatCard
                icon={Users}
                label="SPOCs"
                value={stats.totalSpocs}
                color="from-emerald-500 to-teal-600 text-white"
            />
            <StatCard
                icon={Clock}
                label="Est. Monthly Savings"
                value={formatTime(stats.totalHoursSaved)}
                color="from-amber-500 to-orange-600 text-white"
                trend="Projected"
            />
            <StatCard
                icon={CheckCircle}
                label="Realized Savings"
                value={formatTime(stats.totalRealizedSavings)}
                color="from-green-600 to-emerald-700 text-white"
                trend="Actual (Till Date)"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-blue-500" />
                    Recent Activity
                </h3>
                <div className="space-y-3">
                    {stats.recentSyncs?.slice(0, 5).map((sync, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileText size={16} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">{sync.filename}</p>
                                    <p className="text-xs text-gray-500">{sync.file_date}</p>
                                </div>
                            </div>
                            <span className="text-emerald-600 font-bold text-sm">{sync.unique_bots_count} bots</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-purple-500" />
                    System Status
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Database</span>
                        <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Connected
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">SharePoint Integration</span>
                        <span className="flex items-center gap-2 text-emerald-600 font-semibold">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            Active
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Last Sync</span>
                        <span className="text-gray-900 font-semibold">
                            {stats.lastSyncTime || 'Never'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active Bots</span>
                        <span className="text-blue-600 font-semibold">{stats.activeBots}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// Users Management Section
const UsersSection = ({ users, onRefresh }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ email: '', name: '', role: 'User', is_active: 1 });
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (editingUser) {
            setFormData({
                email: editingUser.email,
                name: editingUser.name || '',
                role: editingUser.role || 'User',
                is_active: editingUser.is_active
            });
        } else {
            setFormData({ email: '', name: '', role: 'User', is_active: 1 });
        }
    }, [editingUser, showModal]);

    const filteredUsers = users.filter(user =>
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingUser) {
                await axios.put(`${API_BASE_URL}/admin/users/${editingUser.id}`, formData);
            } else {
                await axios.post(`${API_BASE_URL}/admin/users`, formData);
            }
            onRefresh();
            setShowModal(false);
            setEditingUser(null);
        } catch (error) {
            alert('Failed to save user: ' + (error.response?.data?.detail || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user) => {
        if (window.confirm(`Are you sure you want to remove ${user.email}?`)) {
            await axios.delete(`${API_BASE_URL}/admin/users/${user.id}`);
            onRefresh();
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Access Management</h2>
                    <p className="text-gray-500 font-medium">Manage registered users who can access the COBOT Console via SSO</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-sm min-w-[280px] shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setShowModal(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Register New User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left border-b border-gray-200">User</th>
                                <th className="px-6 py-4 text-left border-b border-gray-200">Role</th>
                                <th className="px-6 py-4 text-center border-b border-gray-200">Status</th>
                                <th className="px-6 py-4 text-center border-b border-gray-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                                {(user.name || user.email || '?')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{user.name || 'Admin User'}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-100 text-purple-700 font-black' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => { setEditingUser(user); setShowModal(true); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingUser ? 'Edit User Permissions' : 'Register New Team Member'}</h3>
                            <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                    placeholder="user@adani.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Display Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Access Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="User">User</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                                    <select
                                        value={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                                        className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold appearance-none cursor-pointer"
                                    >
                                        <option value={1}>Active</option>
                                        <option value={0}>Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4">
                            <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-500 font-bold hover:text-gray-700 transition-colors">Discard</button>
                            <button type="submit" disabled={saving} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50">
                                {saving ? 'Processing...' : 'Save Permissions'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

// Upload Section Component
const FileUploadSection = ({ onRefresh }) => {
    const [uploadType, setUploadType] = useState('daily'); // 'daily' or 'master'
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState(null);
    const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setMessage(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setMessage(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            let url = uploadType === 'master'
                ? `${API_BASE_URL}/upload-master`
                : `${API_BASE_URL}/upload-daily-report`;

            // Add report date for daily report
            if (uploadType === 'daily' && reportDate) {
                url += `?report_date=${reportDate}`;
            }

            const response = await axios.post(url, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const resData = response.data;
            let successMsg = resData.message || 'Upload successful';

            // Format detailed success message
            if (uploadType === 'master') {
                successMsg = `Processed ${resData.records_processed || 0} records. Created: ${resData.bots_created || 0} bots, ${resData.departments_created || 0} depts.`;
            } else {
                successMsg = `Processed ${resData.runs_processed || 0} runs. Matched ${resData.bots_matched || 0} bots for ${resData.report_date}.`;
            }

            setMessage({ type: 'success', text: successMsg });
            setFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-upload');
            if (fileInput) fileInput.value = '';

            if (onRefresh) onRefresh();

        } catch (error) {
            console.error('Upload failed:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.detail || 'Upload failed. Please check the file and try again.'
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 max-w-2xl w-full overflow-hidden flex flex-col">
                {/* Header Section */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 text-center">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Upload Data</h2>
                    <p className="text-gray-500 text-sm">Update your system with the latest reports or master lists</p>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-gray-50 border-b border-gray-100">
                    <button
                        onClick={() => { setUploadType('daily'); setMessage(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${uploadType === 'daily'
                            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                            }`}
                    >
                        <Clock size={16} />
                        Daily Report
                    </button>
                    <button
                        onClick={() => { setUploadType('master'); setMessage(null); }}
                        className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 ${uploadType === 'master'
                            ? 'bg-white text-purple-600 shadow-sm ring-1 ring-black/5'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                            }`}
                    >
                        <Database size={16} />
                        Master Bot List
                    </button>
                </div>

                {/* Main Content */}
                <div className="p-8 space-y-6">
                    {/* Date Picker for Daily Report */}
                    {uploadType === 'daily' && (
                        <div className="animate-fade-in relative z-20">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Report Date</label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all outline-none"
                            />
                        </div>
                    )}

                    {/* Drag & Drop Zone */}
                    <form onSubmit={handleUpload} className="space-y-6">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative group border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-300 min-h-[200px] ${isDragging
                                ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                                : file
                                    ? 'border-emerald-400 bg-emerald-50/30'
                                    : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/50'
                                }`}
                        >
                            <input
                                type="file"
                                id="file-upload"
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer w-full h-full flex flex-col items-center justify-center relative z-10"
                            >
                                {file ? (
                                    <div className="animate-fade-in">
                                        <div className="w-14 h-14 bg-white text-emerald-600 rounded-2xl flex items-center justify-center mb-3 mx-auto shadow-sm ring-4 ring-emerald-100">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 break-all max-w-[300px] line-clamp-1">{file.name}</h3>
                                        <p className="text-xs text-emerald-600 font-medium mt-1">Ready to upload</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-sm ring-4 transition-all duration-300 group-hover:scale-110 ${uploadType === 'master' ? 'bg-purple-100 text-purple-600 ring-purple-50' : 'bg-blue-100 text-blue-600 ring-blue-50'}`}>
                                            <Upload size={28} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Click to browse or drag file</p>
                                            <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls (Max 10MB)</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>

                        {/* Status Message */}
                        {message && (
                            <div className={`p-4 rounded-xl flex items-start gap-3 animate-fade-in ${message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-pink-50 text-pink-800'
                                }`}>
                                {message.type === 'success' ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                                <div>
                                    <p className="font-bold text-sm">{message.type === 'success' ? 'Success' : 'Error'}</p>
                                    <p className="text-xs opacity-90 mt-0.5">{message.text}</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={!file || uploading}
                            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 shadow-lg ${!file || uploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : `bg-gradient-to-r ${uploadType === 'master' ? 'from-purple-600 to-pink-600 shadow-purple-200' : 'from-blue-600 to-indigo-600 shadow-blue-200'} text-white hover:scale-[1.02] active:scale-[0.98]`
                                }`}
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={20} />
                                    <span>{uploadType === 'master' ? 'Upload Master List' : 'Upload Daily Report'}</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
                <p>Ensure your files follow the <button className="underline hover:text-gray-600" onClick={() => document.getElementById('template-info')?.scrollIntoView()}>standard template format</button>.</p>
            </div>
        </div>
    );
};



// Activity Logs Section
const ActivityLogsSection = ({ auditLogs, onRefresh }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const totalPages = Math.ceil(auditLogs.length / itemsPerPage);
    const paginatedLogs = auditLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const formatValue = (val) => {
        if (!val) return '-';
        try {
            const parsed = JSON.parse(val);
            return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(', ');
        } catch(e) {
            return val;
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Activity Logs</h2>
                    <p className="text-gray-500">View all admin actions and system events</p>
                </div>
                <button
                    onClick={onRefresh}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 min-h-0 flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Timestamp</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Action</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Entity</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">User</th>
                                <th className="px-6 py-4 text-left bg-gray-50 sticky top-0 z-10 border-b border-gray-200">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(log.timestamp).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                                            log.action_type === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                                            log.action_type === 'DELETE' ? 'bg-pink-100 text-pink-700' :
                                            'bg-blue-100 text-blue-700'
                                        }`}>
                                            {log.action_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {log.entity_type} #{log.entity_id}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {log.changed_by}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate" title={log.new_value || log.old_value}>
                                        {log.action_type === 'UPDATE' ? `Changed to: ${formatValue(log.new_value)}` : formatValue(log.new_value || log.old_value)}
                                    </td>
                                </tr>
                            ))}
                            {paginatedLogs.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                                        No activity logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-white relative z-20">
                    <div className="text-sm text-gray-500">
                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, auditLogs.length) || 0}</strong> to <strong>{Math.min(currentPage * itemsPerPage, auditLogs.length)}</strong> of <strong>{auditLogs.length}</strong> logs
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50 text-gray-600 transition-colors disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main Admin Page Component
export default function AdminPage() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [logs, setLogs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [bots, setBots] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [spocs, setSpocs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalBots: 0,
        totalDepartments: 0,
        totalSpocs: 0,
        totalHoursSaved: 0,
        activeBots: 0,
        totalRealizedSavings: 0,
        recentSyncs: [],
        lastSyncTime: null
    });

    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const handleSync = async () => {
        if (window.confirm('This will trigger a synchronization with SharePoint. Continue?')) {
            setSyncing(true);
            try {
                // Import dynamically if not at top, or just assume I add import at top later.
                // Better to add handleSync here and import at top.
                // Since I can't do multiple file edits easily in one go for top and bottom, I will validte imports first.
                // Wait, I can only replace one block.
                // I will add the handleSync here and then add the button.
                // I need to add import first?
                // I will use a separate tool call for import.
                // This tool call adds the state and logic.

                await axios.post(`${API_BASE_URL}/integration/sync-sharepoint`); // Direct call or use api lib?
                // The previous code used `syncSharePoint` from `../lib/api`.
                // Admin page uses axios directly mostly.
                // I'll stick to axios to match AdminPage style or import the function.
                // AdminPage uses axios mostly.
                // I'll use axios here for consistency with unrelated AdminPage code?
                // Actually `syncSharePoint` in `lib/api` likely does `axios.post('/integration/sync-sharepoint')`.
                // I'll just use axios here.

                alert('Sync started successfully. It may take a few moments to reflect.');
                await fetchAllData();
            } catch (error) {
                console.error('Sync failed:', error);
                alert('Sync failed: ' + (error.response?.data?.message || error.message));
            } finally {
                setSyncing(false);
            }
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [logsRes, auditRes, botsRes, deptsRes, spocsRes, usersRes, statsRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/admin/logs`),
                axios.get(`${API_BASE_URL}/admin/audit-logs`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/bots`),
                axios.get(`${API_BASE_URL}/departments`),
                axios.get(`${API_BASE_URL}/admin/spocs`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/admin/users`).catch(() => ({ data: [] })),
                axios.get(`${API_BASE_URL}/integration/daily-stats`).catch(() => ({ data: { till_date_hours_saved: 0 } }))
            ]);

            setLogs(logsRes.data);
            setAuditLogs(auditRes.data);
            setBots(botsRes.data);
            setDepartments(deptsRes.data);
            setSpocs(spocsRes.data);
            setUsers(usersRes.data);

            // Calculate stats
            const activeBots = botsRes.data.filter(b => {
                const s = (b.status || '').toLowerCase();
                return (s.includes('active') || s.includes('deployed')) &&
                    !s.includes('inactive') &&
                    !s.includes('in active');
            }).length;

            const totalHours = botsRes.data.reduce((sum, b) => sum + (b.hours_saved_monthly || 0), 0);

            // Use the dynamic unified calculation from daily-stats API
            const totalRealized = statsRes.data.till_date_hours_saved || 0;

            setStats({
                totalBots: botsRes.data.length,
                totalDepartments: deptsRes.data.length,
                totalSpocs: spocsRes.data.length || 0,
                totalHoursSaved: Math.round(totalHours),
                totalRealizedSavings: totalRealized, // Now consistent with dashboard
                activeBots,
                recentSyncs: logsRes.data.slice(0, 5),
                lastSyncTime: logsRes.data[0]?.upload_date
                    ? new Date(logsRes.data[0].upload_date).toLocaleString('en-IN')
                    : null
            });
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col md:block">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40 transition-transform duration-300 transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 border-b border-gray-100 flex flex-col items-center justify-center bg-gray-50/50">
                    <img src={`${import.meta.env.BASE_URL}adani-logo.svg`} alt="Adani Logo" className="h-10 w-auto object-contain mb-3" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Admin Console</span>
                </div>

                <nav className="p-4 space-y-2">
                    <Link
                        to="/"
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all text-gray-600 hover:bg-gray-100 mb-2 border-b border-gray-100 pb-4 rounded-b-none"
                    >
                        <Home size={20} className="text-blue-600" />
                        <span className="font-bold text-gray-900">Home</span>
                    </Link>

                    <TabButton
                        active={activeTab === 'dashboard'}
                        onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
                        icon={BarChart3}
                        label="Dashboard"
                    />
                    <TabButton
                        active={activeTab === 'bots'}
                        onClick={() => { setActiveTab('bots'); setSidebarOpen(false); }}
                        icon={Bot}
                        label="Bot Management"
                        count={bots.length}
                    />
                    <TabButton
                        active={activeTab === 'logs'}
                        onClick={() => { setActiveTab('logs'); setSidebarOpen(false); }}
                        icon={FileText}
                        label="File Logs"
                        count={logs.length}
                    />
                    <TabButton
                        active={activeTab === 'upload'}
                        onClick={() => { setActiveTab('upload'); setSidebarOpen(false); }}
                        icon={Upload}
                        label="Upload Files"
                    />
                    <TabButton
                        active={activeTab === 'users'}
                        onClick={() => { setActiveTab('users'); setSidebarOpen(false); }}
                        icon={Shield}
                        label="User Access"
                        count={users.length}
                    />
                    <TabButton
                        active={activeTab === 'audit'}
                        onClick={() => { setActiveTab('audit'); setSidebarOpen(false); }}
                        icon={Clock}
                        label="Activity Logs"
                    />
                    <TabButton
                        active={activeTab === 'manual'}
                        onClick={() => { setActiveTab('manual'); setSidebarOpen(false); }}
                        icon={BookOpen}
                        label="User Manual"
                    />

                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all text-gray-400 hover:text-red-500 hover:bg-red-50 mt-4 border-t border-gray-100 pt-6 rounded-t-none"
                    >
                        <LogOut size={20} />
                        <span className="font-semibold">Logout</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="md:ml-64 flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 md:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">
                            {activeTab === 'dashboard' && ''}
                            {activeTab === 'bots' && ''}
                            {activeTab === 'logs' && ''}
                            {activeTab === 'upload' && ''}
                            {activeTab === 'manual' && ''}
                        </h1>
                    </div>
                    <span></span>
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-8 flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'dashboard' && (
                                <div className="h-full overflow-y-auto pr-2 custom-scrollbar pb-8">
                                    <DashboardSection stats={stats} onSync={handleSync} isSyncing={syncing} />
                                </div>
                            )}
                            {activeTab === 'bots' && (
                                <BotsSection
                                    bots={bots}
                                    departments={departments}
                                    spocs={spocs}
                                    onRefresh={fetchAllData}
                                />
                            )}
                            {activeTab === 'logs' && <FileLogsSection logs={logs} onRefresh={fetchAllData} />}
                            {activeTab === 'audit' && <ActivityLogsSection auditLogs={auditLogs} onRefresh={fetchAllData} />}
                            {activeTab === 'upload' && <FileUploadSection onRefresh={fetchAllData} />}
                            {activeTab === 'users' && <UsersSection users={users} onRefresh={fetchAllData} />}
                            {activeTab === 'manual' && <UserManualSection />}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
