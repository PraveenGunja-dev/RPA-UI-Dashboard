import { useState, useEffect, useRef, useMemo } from 'react';
import { getAllBots } from '../lib/api';
import { Bot, Users, Building2, ChevronRight, ChevronDown, Search, X, ExternalLink, Network, Plus, Minus, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import BotDetails from '../pages/BotDetails';
import './OrgChart.css';

export default function OrgTreeView() {
    const [allBots, setAllBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBotId, setSelectedBotId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedSpoc, setSelectedSpoc] = useState('');
    // Forced horizontal view
    const viewMode = 'horizontal';
    const [expanded, setExpanded] = useState({});

    // Pan & Zoom State (Infinite Canvas)
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const wrapperRef = useRef(null);
    const treeRef = useRef(null);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getAllBots({ limit: 2000 }); // Get all bots
                setAllBots(res.data || []);
            } catch (err) {
                console.error("Failed to fetch bots:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group Data: Dept -> SPOC -> Bots
    const treeData = useMemo(() => {
        const groups = {};
        allBots.forEach(bot => {
            // Normalize names
            let dept = (bot.department_name || "Unassigned").trim();
            if (!dept) dept = "Unassigned";

            let spoc = (bot.spoc_name || "Unassigned").trim();
            if (!spoc || spoc.toLowerCase() === 'nan' || spoc.toLowerCase() === 'none') spoc = "Unassigned";

            if (!groups[dept]) {
                groups[dept] = {};
            }
            if (!groups[dept][spoc]) {
                groups[dept][spoc] = [];
            }
            groups[dept][spoc].push(bot);
        });

        // Filter based on Search
        if (searchQuery) {
            const lowerQ = searchQuery.toLowerCase();
            const filteredGroups = {};

            Object.keys(groups).forEach(dept => {
                let deptMatches = dept.toLowerCase().includes(lowerQ);
                const matchingSpocs = {};

                Object.keys(groups[dept]).forEach(spoc => {
                    let spocMatches = spoc.toLowerCase().includes(lowerQ);
                    const matchingBots = groups[dept][spoc].filter(b =>
                        b.use_case_name.toLowerCase().includes(lowerQ) ||
                        (b.bot_name && b.bot_name.toLowerCase().includes(lowerQ))
                    );

                    if (spocMatches || matchingBots.length > 0 || deptMatches) {
                        matchingSpocs[spoc] = matchingBots.length > 0 ? matchingBots : groups[dept][spoc];
                    }
                });

                if (Object.keys(matchingSpocs).length > 0) {
                    filteredGroups[dept] = matchingSpocs;
                }
            });
            return filteredGroups;
        }

        return groups;
    }, [allBots, searchQuery]);

    // Derive available SPOCs based on selected Department
    const availableSpocs = useMemo(() => {
        let spocs = new Set();
        Object.keys(treeData).forEach(dept => {
            if (!selectedDepartment || dept === selectedDepartment) {
                Object.keys(treeData[dept]).forEach(s => spocs.add(s));
            }
        });
        return Array.from(spocs).sort();
    }, [treeData, selectedDepartment]);

    // Reset SPOC when Department changes
    useEffect(() => {
        setSelectedSpoc('');
    }, [selectedDepartment]);

    // Auto-expand logic
    useEffect(() => {
        // Default: Only Root is expanded
        let newExpanded = { 'root': true };

        const hasSelection = searchQuery || selectedDepartment || selectedSpoc;

        if (hasSelection) {
            Object.keys(treeData).forEach(bu => {
                const isDeptMatch = !selectedDepartment || bu === selectedDepartment;
                const buId = `bu-${bu}`;

                if (isDeptMatch) {
                    // Expand Department if it matches selection or if we are searching/showing all in a filtered view
                    if (selectedDepartment || searchQuery || selectedSpoc) {
                        newExpanded[buId] = true;
                    }

                    Object.keys(treeData[bu]).forEach(spoc => {
                        // Expand SPOC if it matches selection or if no specific SPOC selected (show all under dept)
                        const spocId = `spoc-${bu}-${spoc}`;
                        const isSpocMatch = !selectedSpoc || spoc === selectedSpoc;

                        if (selectedDepartment && isDeptMatch) {
                            newExpanded[spocId] = true;
                        } else if (selectedSpoc && isSpocMatch) {
                            newExpanded[spocId] = true;
                        } else if (searchQuery) {
                            newExpanded[spocId] = true;
                        }
                    });
                }
            });
        }
        setExpanded(newExpanded);
    }, [treeData, searchQuery, selectedDepartment, selectedSpoc]);


    const toggleNode = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isExpanded = (id) => !!expanded[id];


    //-------------------------------------------------------------------------
    // INFINITE CANVAS LOGIC (PAN & ZOOM)
    //-------------------------------------------------------------------------
    const isDragging = useRef(false);
    const startPan = useRef({ x: 0, y: 0 });
    const startMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        // Prevent dragging if interacting with controls
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('a')) {
            return;
        }

        isDragging.current = true;
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPan.current = { x: transform.x, y: transform.y };

        wrapperRef.current.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none'; // Prevent text selection globally

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current) return;
        e.preventDefault();

        const dx = e.clientX - startMouse.current.x;
        const dy = e.clientY - startMouse.current.y;

        setTransform(prev => ({
            ...prev,
            x: startPan.current.x + dx,
            y: startPan.current.y + dy
        }));
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        if (wrapperRef.current) {
            wrapperRef.current.style.cursor = 'grab';
        }
        document.body.style.removeProperty('user-select');
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    // Zoom Handlers
    const handleZoomIn = () => {
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
    };

    const handleZoomOut = () => {
        setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }));
    };

    const handleResetView = () => {
        // Center the view (approximate)
        if (wrapperRef.current && treeRef.current) {
            const wrapperRect = wrapperRef.current.getBoundingClientRect();
            const treeRect = treeRef.current.getBoundingClientRect();

            // Reset to center
            // Initial center assumption
            setTransform({ x: 0, y: 0, scale: 1 });
        } else {
            setTransform({ x: 0, y: 0, scale: 1 });
        }
    };

    // Cleanup listeners on unmount
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const calculateBotStats = (botsList) => {
        const now = new Date();
        let totalHours = 0;

        botsList.forEach(bot => {
            if (!bot.deployed_date || !bot.hours_saved_monthly) return;

            // Parse deployed date
            let deployDate = new Date(bot.deployed_date);
            if (isNaN(deployDate.getTime())) return;

            // Calculate days active
            const diffTime = Math.abs(now - deployDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Daily hours
            const dailyHours = (bot.hours_saved_monthly / 30);
            const hoursSaved = diffDays * dailyHours;

            totalHours += hoursSaved;
        });

        // Man Hours = Total Hours / 9 (aligned with Dashboard logic)
        const totalManHours = totalHours / 9;

        return {
            hours: Math.round(totalHours),
            manHours: Math.round(totalManHours)
        };
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 uppercase tracking-widest font-black text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            Loading Organization Data...
        </div>
    );

    return (
        <div className="relative h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center z-[50] shadow-sm">
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-all rounded-xl text-gray-400 hover:text-gray-900 font-bold">
                        <Network size={24} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none">Global Hierarchy</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Interactive Org Chart</p>
                    </div>
                </div>

                {/* Search & Filter Section */}
                <div className="flex-1 max-w-4xl mx-8 flex gap-4">

                    {/* Department Dropdown */}
                    <div className="relative group w-64">
                        <div className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-black text-blue-500 uppercase tracking-wider z-10">Department</div>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">All Departments</option>
                            {Object.keys(treeData).map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* SPOC Dropdown */}
                    <div className="relative group w-64">
                        <div className="absolute -top-2.5 left-3 px-1 bg-white text-[10px] font-black text-indigo-500 uppercase tracking-wider z-10">SPOC</div>
                        <select
                            value={selectedSpoc}
                            onChange={(e) => setSelectedSpoc(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-gray-800 text-sm shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="">All SPOCs</option>
                            {availableSpocs.map(spoc => (
                                <option key={spoc} value={spoc}>{spoc}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {/* Search Input */}
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search bots, usecases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-24 pr-10 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold text-gray-800 text-sm shadow-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600">
                                <X className='text-left' size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-50 bg-white p-2 rounded-xl shadow-lg border border-gray-100">
                <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors" title="Zoom In">
                    <Plus size={20} />
                </button>
                <button onClick={handleResetView} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors" title="Reset View">
                    <span className="text-xs font-bold">{Math.round(transform.scale * 100)}%</span>
                </button>
                <button onClick={handleResetView} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors" title="Center View">
                    <RotateCcw size={16} />
                </button>
                <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-blue-600 transition-colors" title="Zoom Out">
                    <Minus size={20} />
                </button>
            </div>

            {/* Tree Canvas - Infinite Container */}
            <div
                className={`flex-1 overflow-hidden bg-[#f8fafc] relative cursor-grab active:cursor-grabbing flex items-center justify-center`}
                ref={wrapperRef}
                onMouseDown={handleMouseDown}
            >
                <div
                    ref={treeRef}
                    className="absolute top-10 left-10 origin-top-left transition-transform duration-75 easelinear will-change-transform"
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
                    }}
                >
                    <ul className="tree tree-horizontal">
                        <li>
                            {/* Root Node */}
                            <div
                                className="tree-node node-root cursor-pointer hover:ring-4 ring-blue-500/10 transition-all"
                                onClick={() => toggleNode('root')}
                            >
                                <img src="/adani-logo.svg" alt="Adani" className="h-8 w-auto mb-2" />
                                <div className="font-black text-white-900">ADANI GROUP</div>
                                <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold">
                                    <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="Total Bots">
                                        {allBots.length} Bots
                                    </span>
                                    <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100" title="Total Hours Saved">
                                        {calculateBotStats(allBots).hours.toLocaleString()} h
                                    </span>
                                    <span className="text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100" title="Man Hours Saved">
                                        {calculateBotStats(allBots).manHours.toLocaleString()} mh
                                    </span>
                                </div>
                                {isExpanded('root') ? (
                                    <ChevronDown size={14} className="text-gray-400 mt-2" />
                                ) : (
                                    <ChevronRight size={14} className="text-gray-400 mt-2 rotate-90" />
                                )}
                            </div>

                            {/* Departments Group */}
                            {allBots.length > 0 && (
                                <ul className={`${isExpanded('root') ? 'flex' : 'hidden'}`}>
                                    {Object.keys(treeData)
                                        .filter(buName => !selectedDepartment || buName === selectedDepartment)
                                        .map((buName) => {
                                            const buId = `bu-${buName}`;
                                            const hasChildren = Object.keys(treeData[buName]).length > 0;
                                            const isOpen = isExpanded(buId);

                                            // Aggregate all bots for this Department to calculate total stats
                                            const deptBots = Object.values(treeData[buName]).flat();
                                            const deptStats = calculateBotStats(deptBots);

                                            return (
                                                <li key={buId}>
                                                    <div
                                                        className={`tree-node node-dept ${isOpen ? 'active' : ''}`}
                                                        onClick={() => toggleNode(buId)}
                                                    >
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <Building2 size={16} />
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Department</div>
                                                            <div className="font-bold text-gray-900 text-sm whitespace-nowrap">{buName}</div>

                                                            {/* Department Stats */}
                                                            <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold">
                                                                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="Total Bots">
                                                                    {deptBots.length} Bots
                                                                </span>
                                                                <span className="text-gray-300">/</span>
                                                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100" title="Hours Saved">
                                                                    {deptStats.hours.toLocaleString()} h
                                                                </span>
                                                                <span className="text-gray-300">/</span>
                                                                <span className="text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100" title="Man Hours Saved">
                                                                    {deptStats.manHours.toLocaleString()} mh
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {hasChildren && (
                                                            <div className="mt-2 text-gray-300">
                                                                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* SPOCs Group */}
                                                    {hasChildren && (
                                                        <ul className={`${isOpen ? 'flex' : 'hidden'}`}>
                                                            {Object.keys(treeData[buName])
                                                                .filter(spocName => !selectedSpoc || spocName === selectedSpoc)
                                                                .map((spocName) => {
                                                                    const spocId = `spoc-${buName}-${spocName}`;
                                                                    const bots = treeData[buName][spocName];
                                                                    const isSpocOpen = isExpanded(spocId);
                                                                    const spocStats = calculateBotStats(bots);

                                                                    return (
                                                                        <li key={spocId}>
                                                                            <div
                                                                                className={`tree-node node-spoc ${isSpocOpen ? 'active' : ''}`}
                                                                                onClick={() => toggleNode(spocId)}
                                                                            >
                                                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                                    <Users size={18} />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">SPOC</div>
                                                                                    <div className="font-bold text-gray-900 text-sm whitespace-nowrap">{spocName}</div>

                                                                                    {/* SPOC Stats */}
                                                                                    <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-bold">
                                                                                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="Total Bots">
                                                                                            {bots.length} Bots
                                                                                        </span>
                                                                                        <span className="text-gray-300">/</span>
                                                                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100" title="Hours Saved">
                                                                                            {spocStats.hours.toLocaleString()} h
                                                                                        </span>
                                                                                        <span className="text-gray-300">/</span>
                                                                                        <span className="text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100" title="Man Hours Saved">
                                                                                            {spocStats.manHours.toLocaleString()} mh
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                {bots.length > 0 && (
                                                                                    <div className="mt-2 text-gray-300">
                                                                                        {isSpocOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Bots Group (Vertical Stack) */}
                                                                            {bots.length > 0 && (
                                                                                <ul className={`bot-list-container ${isSpocOpen ? 'flex' : 'hidden'}`}>
                                                                                    {bots.map((bot) => {
                                                                                        const isActive = bot.status?.toLowerCase().includes('active');
                                                                                        return (
                                                                                            <div
                                                                                                key={bot.id}
                                                                                                className={`tree-node node-bot group hover:scale-105 transition-transform ${isActive ? '' : 'inactive'}`}
                                                                                                onClick={() => setSelectedBotId(bot.id)}
                                                                                            >
                                                                                                <div className={`p-1.5 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                                                                    <Bot size={16} />
                                                                                                </div>
                                                                                                <div className="min-w-[180px]">
                                                                                                    <div className={`font-bold text-xs truncate ${isActive ? 'text-gray-900' : 'text-rose-900'}`}>{bot.use_case_name}</div>
                                                                                                    <div className="text-[10px] font-bold mt-0.5 flex items-center justify-between">
                                                                                                        <span className={`uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                                            {bot.status}
                                                                                                        </span>
                                                                                                        <ExternalLink size={10} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </ul>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                })}
                                                        </ul>
                                                    )}
                                                </li>
                                            );
                                        })}
                                </ul>
                            )}
                        </li>
                    </ul>
                </div >
            </div >

            {
                selectedBotId && (
                    <BotDetails
                        botId={selectedBotId}
                        isModal={true}
                        onClose={() => setSelectedBotId(null)}
                    />
                )
            }
        </div >
    );
}
