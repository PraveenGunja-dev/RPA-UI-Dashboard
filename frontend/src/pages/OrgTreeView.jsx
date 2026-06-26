import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllBots } from '../lib/api';
import { Bot, ChevronDown, Search, X, ArrowLeft, Loader2, Home, Minimize2, Maximize2, Plus, Minus } from 'lucide-react';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import { Link } from 'react-router-dom';
import BotDetails from './BotDetails';

// ECharts Modular Imports
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TooltipComponent } from 'echarts/components';
import { TreeChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

// Register ECharts components
echarts.use([TooltipComponent, TreeChart, CanvasRenderer]);

export default function OrgTreeView() {
    const [allBots, setAllBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBotId, setSelectedBotId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [lastSelectedDeptCount, setLastSelectedDeptCount] = useState(0);
    const [selectedSpocs, setSelectedSpocs] = useState([]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await getAllBots({ limit: 2000 });
                setAllBots(res.data || []);
            } catch (err) {
                console.error("Failed to fetch bots:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Derive available Departments for filter
    const availableDepartments = useMemo(() => {
        const depts = new Set();
        allBots.forEach(bot => {
            let dept = (bot.department_name || "Unassigned").trim();
            if (!dept) dept = "Unassigned";
            depts.add(dept);
        });
        const sortedDepts = Array.from(depts).sort();
        return sortedDepts;
    }, [allBots]);

    // Initialize selectedDepartments with all available departments
    useEffect(() => {
        if (availableDepartments.length > 0 && selectedDepartments.length === 0 && lastSelectedDeptCount === 0) {
            setSelectedDepartments(availableDepartments);
            setLastSelectedDeptCount(availableDepartments.length);
        }
    }, [availableDepartments]);

    // Derive available SPOCs for filter
    const availableSpocs = useMemo(() => {
        const spocs = new Set();
        allBots.forEach(bot => {
            // Respect Dept Filter if set
            let dept = (bot.department_name || "Unassigned").trim();
            if (!dept) dept = "Unassigned";

            // If selectedDepartments is empty, treat as NONE selected (unless initial load handled above)
            // But if we want "Select All" to be default, we rely on the state being populated.
            if (selectedDepartments.length > 0 && !selectedDepartments.includes(dept)) return;

            let spoc = (bot.spoc_name || "Unassigned").trim();
            if (!spoc || spoc.toLowerCase() === 'nan' || spoc.toLowerCase() === 'none') spoc = "Unassigned";
            spocs.add(spoc);
        });
        return Array.from(spocs).sort();
    }, [allBots, selectedDepartments]);

    // Transform Data for ECharts
    const chartData = useMemo(() => {
        // Grouping: Dept -> SPOC -> Bots
        const groups = {};

        allBots.forEach(bot => {
            // Apply Filters
            let dept = (bot.department_name || "Unassigned").trim();
            if (!dept) dept = "Unassigned";

            if (selectedDepartments.length > 0 && !selectedDepartments.includes(dept)) return;

            // Search Filter
            const searchLower = searchQuery.toLowerCase();
            if (searchQuery && !dept.toLowerCase().includes(searchLower)) {
                // If dept doesn't match, check bot name or spoc
                const botName = (bot.bot_name || "").toLowerCase();
                const spocName = (bot.spoc_name || "").toLowerCase();
                const useCase = (bot.use_case_name || "").toLowerCase();

                if (!botName.includes(searchLower) && !spocName.includes(searchLower) && !useCase.includes(searchLower)) {
                    return; // Skip this bot if nothing matches
                }
            }

            let spoc = (bot.spoc_name || "Unassigned").trim();
            if (!spoc || spoc.toLowerCase() === 'nan' || spoc.toLowerCase() === 'none') spoc = "Unassigned";

            if (selectedSpocs.length > 0 && !selectedSpocs.includes(spoc)) return;

            if (!groups[dept]) groups[dept] = {};
            if (!groups[dept][spoc]) groups[dept][spoc] = [];
            groups[dept][spoc].push(bot);
        });

        // Initialize Root Stats
        let rootTotalBots = 0;
        let rootActiveBots = 0;
        let rootTotalSavings = 0;
        let rootFebSavings = 0;
        let rootDailySavings = 0;
        let rootDates = [];
        let rootRunDates = [];

        // Convert to Tree Structure
        const children = Object.keys(groups).map(deptName => {
            const spocs = groups[deptName];
            let deptTotalBots = 0;
            let deptActiveBots = 0;
            let deptTotalSavings = 0;
            let deptFebSavings = 0;
            let deptDates = [];
            let deptRunDates = [];
            let deptDailySavings = 0;

            const spocChildren = Object.keys(spocs).map(spocName => {
                const bots = spocs[spocName];

                // Aggregate SPOC stats
                const spocBotCount = bots.length;
                const spocActiveBotCount = bots.filter(b => {
                    const s = (b.status || "").toLowerCase().replace(/\s+/g, ''); // normalize like backend

                    // Specific negative checks first
                    if (['inactive', 'hold', 'suspended', 'stop', 'pending', 'tbd', 'notstarted', 'development', 'failed'].some(x => s.includes(x))) return false;

                    // Positive checks
                    return ['deployed', 'live', 'active', 'production', 'running'].some(x => s.includes(x));
                }).length;

                // Collect dates for min calculation
                const spocDepDates = bots.map(b => b.deployed_date ? new Date(b.deployed_date) : null).filter(d => d && !isNaN(d));
                const spocRunDates = bots.map(b => b.last_run_time ? new Date(b.last_run_time) : null).filter(d => d && !isNaN(d));

                // Update to sum HOURS (hours_till_now) instead of DAYS (man_hours_till_now) 
                // to match the "hrs" label in tooltip and Landing Page logic.
                const spocSavings = bots.reduce((sum, bot) => sum + (bot.hours_till_now || 0), 0);

                // Use ACTUAL Realized Savings from Backend API
                // hours_saved_month = Realized in Feb/Current Month
                const spocFebSavings = bots.reduce((sum, bot) => sum + (bot.hours_saved_month || 0), 0);

                // hours_saved_today = Realized Today
                // hours_saved_latest_run = Realized on Last Sync Date (USER REQUEST: "daily FTE mean last sync hours saved")
                const spocDailySavings = bots.reduce((sum, bot) => sum + (bot.hours_saved_latest_run || 0), 0);

                // Add to Dept totals
                deptTotalBots += spocBotCount;
                deptActiveBots += spocActiveBotCount;
                deptTotalSavings += spocSavings;
                deptFebSavings += spocFebSavings;
                deptDailySavings += spocDailySavings;
                deptDates.push(...spocDepDates);
                deptRunDates.push(...spocRunDates);

                // Find oldest date for SPOC
                const spocOldestDate = spocDepDates.length > 0 ? new Date(Math.min(...spocDepDates)) : null;
                const spocLatestRunDate = spocRunDates.length > 0 ? new Date(Math.max(...spocRunDates)) : null;

                return {
                    name: spocName,
                    _customId: `spoc_${deptName}_${spocName}`,
                    itemStyle: { color: '#75479C', borderColor: '#fff', borderWidth: 2 },
                    label: {
                        color: '#fff',
                        backgroundColor: '#75479C',
                        borderRadius: 16,
                        padding: [8, 16],
                        shadowBlur: 6,
                        shadowColor: 'rgba(117, 71, 156, 0.4)'
                    },
                    // Attach extended stats to SPOC
                    stats: {
                        bots: spocBotCount,
                        activeBots: spocActiveBotCount,
                        savings: spocSavings,
                        febSavings: spocFebSavings,
                        dailySavings: spocDailySavings,
                        oldestDate: spocOldestDate,
                        latestRunDate: spocLatestRunDate
                    },
                    children: bots.map(bot => ({
                        name: bot.use_case_name || bot.bot_name,
                        value: bot.id, // Store ID for click handler
                        botData: bot,
                        // Style leaf based on status
                        itemStyle: {
                            color: (() => {
                                const s = (bot.status || "").toLowerCase().replace(/\s+/g, '');
                                if (s.includes('failed')) return '#f472b6'; // Light Pink
                                if (['inactive', 'hold', 'suspended', 'stop', 'pending', 'tbd', 'notstarted', 'development'].some(x => s.includes(x))) return '#fbbf24'; // Amber (Yellow)
                                if (['deployed', 'live', 'active', 'production', 'running'].some(x => s.includes(x))) return '#10b981'; // Green
                                return '#fbbf24'; // Default to Amber for unknown/messy status
                            })()
                        },
                        label: {
                            fontWeight: 'bold'
                        }
                    }))
                };
            });

            // Add to Root totals
            rootTotalBots += deptTotalBots;
            rootActiveBots += deptActiveBots;
            rootTotalSavings += deptTotalSavings;
            rootFebSavings += deptFebSavings;
            rootDailySavings += deptDailySavings;
            rootDates.push(...deptDates);
            rootRunDates.push(...deptRunDates);

            const deptOldestDate = deptDates.length > 0 ? new Date(Math.min(...deptDates)) : null;
            const deptLatestRunDate = deptRunDates.length > 0 ? new Date(Math.max(...deptRunDates)) : null;

            return {
                name: deptName,
                _customId: `dept_${deptName}`,
                itemStyle: { color: '#0B74B0', borderColor: '#fff', borderWidth: 2 },
                label: {
                    color: '#fff',
                    backgroundColor: '#0B74B0',
                    borderRadius: 16,
                    padding: [8, 16],
                    shadowBlur: 6,
                    shadowColor: 'rgba(11, 116, 176, 0.4)'
                },
                stats: {
                    bots: deptTotalBots,
                    activeBots: deptActiveBots,
                    savings: deptTotalSavings,
                    febSavings: deptFebSavings,
                    dailySavings: deptDailySavings,
                    oldestDate: deptOldestDate,
                    latestRunDate: deptLatestRunDate
                },
                children: spocChildren
            };
        });

        const rootOldestDate = rootDates.length > 0 ? new Date(Math.min(...rootDates)) : null;
        const rootLatestRunDate = rootRunDates.length > 0 ? new Date(Math.max(...rootRunDates)) : null;

        const rootNode = {
            name: "Adani Renewables",
            _customId: "root",
            children: children,
            stats: {
                bots: rootTotalBots,
                activeBots: rootActiveBots,
                savings: rootTotalSavings,
                febSavings: rootFebSavings,
                dailySavings: rootDailySavings,
                oldestDate: rootOldestDate,
                latestRunDate: rootLatestRunDate
            },
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [
                        { offset: 0, color: '#0B74B0' },
                        { offset: 0.5, color: '#75479C' },
                        { offset: 1, color: '#BD3861' }
                    ]
                },
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: true,
                fontSize: 18,
                fontWeight: 'bold',
                fontFamily: 'Adani, sans-serif',
                color: '#fff',
                backgroundColor: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [
                        { offset: 0, color: '#0B74B0' },
                        { offset: 0.5, color: '#75479C' },
                        { offset: 1, color: '#BD3861' }
                    ]
                },
                padding: [10, 24],
                borderRadius: 24,
                shadowBlur: 10,
                shadowColor: 'rgba(11, 116, 176, 0.4)'
            }
        };

        return rootNode;
    }, [allBots, selectedDepartments, selectedSpocs, searchQuery]);

    // Expansion State
    const [isAllExpanded, setIsAllExpanded] = useState(true);
    // Track manual toggles: key = _customId, value = boolean (true=expanded, false=collapsed)
    const [expandedOverrides, setExpandedOverrides] = useState({});

    // Process Chart Data based on Expansion State
    const processedChartData = useMemo(() => {
        if (!chartData) return null;

        // Deep clone
        const clone = JSON.parse(JSON.stringify(chartData));

        const traverse = (node, depth) => {
            if (!node) return;

            // Determine collapsed state:
            // 1. Check override
            if (node._customId && expandedOverrides[node._customId] !== undefined) {
                node.collapsed = !expandedOverrides[node._customId]; // override stores isExpanded
            } else {
                // 2. Fallback to global mode
                if (isAllExpanded) {
                    node.collapsed = false;
                } else {
                    // Collapse Mode: Depts (depth 1) collapsed by default
                    if (depth >= 1) {
                        node.collapsed = true;
                    } else {
                        node.collapsed = false;
                    }
                }
            }

            if (node.children) {
                node.children.forEach(child => traverse(child, depth + 1));
            }
        };

        traverse(clone, 0);
        return clone;
    }, [chartData, isAllExpanded, expandedOverrides]);

    // Zoom State
    const [zoomLevel, setZoomLevel] = useState(1);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

    // Dynamic Height Calculation: Based on PROCESSED (Visible) nodes only
    const chartHeight = useMemo(() => {
        if (!processedChartData) return 200;

        let visibleLeaves = 0;

        // Recursive count of VISUAL leaves
        // If a node is collapsed, it is 1 visual leaf.
        // If expanded, sum its children.
        const countVisible = (node) => {
            if (node.collapsed) return 1;
            if (!node.children || node.children.length === 0) return 1;

            let sum = 0;
            node.children.forEach(c => sum += countVisible(c));
            return sum;
        };

        visibleLeaves = countVisible(processedChartData);

        // Fallback
        if (visibleLeaves === 0) return 200;

        const computed = visibleLeaves * 40;
        return Math.max(400, computed + 100); // 400 min height
    }, [processedChartData]);

    // ECharts Option
    const getOption = () => {
        return {
            tooltip: {
                trigger: 'item',
                triggerOn: 'mousemove',
                backgroundColor: 'rgba(255, 255, 255, 1)', // No glassmorphism
                borderColor: '#e2e8f0', // slate-200
                borderWidth: 1,
                textStyle: {
                    color: '#1e293b', // slate-800
                    fontSize: 12
                },
                padding: 0, // We control padding in HTML
                extraCssText: 'box-shadow: none; border-radius: 8px;', // No shadow
                formatter: (params) => {
                    // HELPER FUNCTIONS
                    const fmtDate = (dateStr) => {
                        if (!dateStr) return 'N/A';
                        const d = new Date(dateStr);
                        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-GB');
                    };
                    const fmtHrs = (val) => {
                        if (!val) return '0 hrs';
                        const h = Math.floor(val);
                        const m = Math.round((val - h) * 60);
                        if (h === 0 && m === 0) return '0 hrs';
                        if (h === 0) return `${m} mins`;
                        return `${h} hrs ${m > 0 ? `${m} mins` : ''}`;
                    };

                    const monthYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit' }).format(new Date()).replace(' ', ' - ');

                    // --- 1. LEAF NODE (BOT) ---
                    if (params.data.botData) {
                        const b = params.data.botData;
                        const st = (b.status || "").toLowerCase().replace(/\s+/g, '');

                        const isFailed = st.includes('failed');
                        const isInactive = ['inactive', 'hold', 'suspended', 'stop', 'pending', 'tbd', 'notstarted', 'development'].some(x => st.includes(x));
                        const isActive = !isFailed && !isInactive && ['deployed', 'live', 'active', 'production', 'running'].some(x => st.includes(x));

                        let statusColor = '#b45309'; // Default Amber
                        let statusBg = '#fef3c7';
                        if (isFailed) {
                            statusColor = '#be185d';
                            statusBg = '#fce7f3';
                        } else if (isActive) {
                            statusColor = '#15803d';
                            statusBg = '#dcfce7';
                        }

                        // Split name for readability
                        let rawName = b.use_case_name || b.bot_name || "";
                        let caseNo = b.use_case_no || "";
                        let readableName = rawName;

                        if (rawName.includes('_')) {
                            const parts = rawName.split('_');
                            if (!caseNo) caseNo = parts[0];
                            readableName = parts.slice(1).join(' ').replace(/_/g, ' ');
                        }

                        const statusLabel = b.status || "Unknown";
                        const lastRun = fmtDate(b.last_run_time);
                        const onboardDate = b.deployed_date ? fmtDate(b.deployed_date) : (b.end_date ? fmtDate(b.end_date) : 'N/A');
                        const monthlySavings = b.hours_saved_month !== undefined ? b.hours_saved_month : (b.hours_saved_monthly || 0);
                        const dailySavings = b.hours_saved_latest_run !== undefined ? b.hours_saved_latest_run : (b.hours_saved_monthly ? b.hours_saved_monthly / 30 : 0);
                        const fteSaved = b.hours_till_now !== undefined ? b.hours_till_now : 0;

                        return `
                        <div style="font-family: 'Adani', sans-serif; min-width: 350px; max-width: 450px; padding: 16px; border-radius: 12px; white-space: normal;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px; gap: 15px;">
                                <div style="font-weight: 800; font-size: 16px; color: #0f172a; line-height: 1.4; flex: 1;">
                                    ${readableName}
                                </div>
                                <div style="font-weight: 700; font-size: 11px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; white-space: nowrap; border: 1px solid #e2e8f0; text-transform: uppercase;">
                                    ${caseNo}
                                </div>
                            </div>

                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Description</div>
                                <div style="font-size: 13px; color: #334155; line-height: 1.5; font-weight: 500; white-space: normal;">
                                    ${b.description || '----.'}
                                </div>
                            </div>

                            ${b.key_benefits ? `
                            <div style="margin-bottom: 16px;">
                                <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em;">Key Benefits & Details</div>
                                <div style="font-size: 12px; color: #475569; line-height: 1.4; font-style: italic;">
                                    ${b.key_benefits}
                                </div>
                            </div>` : ''}
                            
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; gap: 12px;">
                                <span style="font-weight: 600; font-size: 13px; color: #64748b;">Current Status</span>
                                <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;">
                                    ${statusLabel}
                                </span>
                            </div>

                            <div style="padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #f1f5f9;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; gap: 12px;">
                                    <span style="color: #64748b;">FTE Hours on <span style="font-weight: 600;">${lastRun}</span></span>
                                    <span style="font-weight: 700; color: #0f172a;">${fmtHrs(dailySavings)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; gap: 12px;">
                                    <span style="color: #64748b;">Savings in ${monthYear}</span>
                                    <span style="font-weight: 700; color: #0f172a;">${fmtHrs(monthlySavings)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 12px; gap: 12px;">
                                    <span style="color: #64748b;">Cumulative FTE Savings</span>
                                    <span style="font-weight: 700; color: #0f172a;">${fmtHrs(fteSaved)}</span>
                                </div>
                            </div>

                             <div style="display: flex; justify-content: space-between; margin-top: 16px; font-size: 11px; padding-top: 12px; border-top: 1px solid #f1f5f9; gap: 12px;">
                                <span style="color: #94a3b8; font-weight: 500;">Deployed On</span>
                                <span style="font-weight: 600; color: #475569;">${onboardDate}</span>
                            </div>
                        </div>`;
                    }

                    // --- 2. GROUP NODE (ROOT / DEPT / SPOC) ---
                    if (params.data.stats) {
                        const { bots, activeBots, savings, febSavings, dailySavings, oldestDate, latestRunDate } = params.data.stats;

                        const oldestDateStr = oldestDate ? fmtDate(oldestDate) : 'N/A';
                        const activeColor = '#16a34a'; // green-600

                        return `
                        <div style="font-family: 'Adani', sans-serif; min-width: 350px; padding: 16px;">
                            <div style="font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px; font-size: 15px; color: #0f172a; line-height: 1.4;">
                                ${params.name}
                            </div>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; align-items: center; font-size: 13px; gap: 12px;">
                                <span style="color: #64748b; font-weight: 500;">Total Bots</span>
                                <div style="white-space: nowrap;">
                                    <span style="color: ${activeColor}; font-weight: 700;">${activeBots} Active</span>
                                    <span style="color: #cbd5e1;"> / </span>
                                    <span style="color: #64748b; font-weight: 600;">${bots} Total</span>
                                </div>
                            </div>

                            <div style="border-top: 1px dashed #e2e8f0; margin: 16px 0;"></div>

                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; gap: 12px;">
                                <span style="color: #64748b;">FTE Hours saved on <span style="font-size: 11px; color: #94a3b8;">${oldestDate ? fmtDate(latestRunDate) : 'N/A'}</span></span>
                                <span style="font-weight: 700; color: #0f172a; white-space: nowrap;">${fmtHrs(dailySavings)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; gap: 12px;">
                                <span style="color: #64748b;">FTE saved in ${monthYear}</span>
                                <span style="font-weight: 700; color: #0f172a; white-space: nowrap;">${fmtHrs(febSavings)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; gap: 12px;">
                                <span style="color: #64748b;">Total FTE as on <span style="font-size: 11px; color: #94a3b8;">${oldestDateStr}</span></span>
                                <span style="font-weight: 700; color: #0f172a; white-space: nowrap;">${fmtHrs(savings)}</span>
                            </div>
                        </div>`;
                    }

                    return `<div style="font-weight: bold; padding: 4px;">${params.name}</div>`;
                }
            },
            series: [
                {
                    type: 'tree',
                    data: [processedChartData],
                    top: '2%',
                    left: '15%',     // More space on left
                    bottom: '2%',
                    right: '25%',    // More space on right for leaves

                    symbolSize: (data, params) => {
                        if (params.treeAncestors.length === 1) return 24; // Root
                        if (params.treeAncestors.length === 2) return 18; // Dept
                        if (params.treeAncestors.length === 3) return 12; // SPOC
                        return 8; // Bot
                    },

                    edgeShape: 'curve',

                    // Disable roam, rely on native scroll ("we can scroll")
                    roam: false,
                    zoom: zoomLevel, // Use state for zoom
                    label: {
                        position: 'left',
                        verticalAlign: 'middle',
                        align: 'right',
                        fontSize: 14,
                        fontFamily: 'Adani, sans-serif',
                        fontWeight: 'bold',
                        backgroundColor: '#fff',
                        padding: [8, 12],
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        shadowBlur: 2,
                        shadowColor: 'rgba(0,0,0,0.05)',
                        distance: 12
                    },

                    leaves: {
                        label: {
                            position: 'right',
                            verticalAlign: 'middle',
                            align: 'left',
                            fontSize: 12,
                            fontWeight: 'normal',
                            backgroundColor: 'transparent',
                            padding: [4, 8],
                            borderRadius: 4,
                            borderWidth: 0,
                            distance: 10
                        }
                    },

                    emphasis: {
                        focus: 'ancestor', // Highlight path
                        scale: true
                    },

                    expandAndCollapse: false, // We control expansion via state
                    animationDuration: 300,
                    animationDurationUpdate: 300,
                    initialTreeDepth: -1 // Fully rely on data.collapsed property
                }
            ]
        };
    };

    // Click Handler
    const onChartClick = (params) => {
        if (!params.data) return;

        if (params.data.value && !params.data.children) {
            // It's a bot (leaf node has 'value' as id)
            setSelectedBotId(params.data.value);
        } else if (params.data._customId) {
            // Parent Node (Dept/Spoc) - Toggle Expansion
            setExpandedOverrides(prev => {
                // Current state comes from processedChartData (reflected in params.data.collapsed)
                // If collapsed is TRUE, we want to expand (set override to TRUE)
                // If collapsed is FALSE, we want to collapse (set override to FALSE)
                const isCollapsed = !!params.data.collapsed;
                return { ...prev, [params.data._customId]: isCollapsed };
            });
        }
    };



    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 uppercase tracking-widest font-black text-gray-400">
            <Loader2 className="animate-spin h-10 w-10 text-blue-600 mb-4" />
            Loading Organization Data...
        </div>
    );

    return (
        <div className="relative h-screen bg-[#f8fafc] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link to="/" className="px-5 py-2.5 bg-white text-gray-600 rounded-xl shadow-sm border border-gray-200 flex items-center gap-2 transition-all hover:bg-gray-50 hover:shadow-md group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform text-[#0B74B0]" />
                        <span className="font-bold text-[12px] tracking-wide uppercase">Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <h1
                            className="text-2xl font-black tracking-wide leading-none bg-clip-text text-transparent"
                            style={{
                                backgroundImage: 'linear-gradient(90deg, #0B74B0 0%, #75479C 50%, #BD3861 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}
                        >
                            COBOT Organization Chart
                        </h1>

                        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                            <button
                                onClick={() => {
                                    setIsAllExpanded(true);
                                    setExpandedOverrides({});
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${isAllExpanded ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Expand All"
                            >
                                <Maximize2 size={16} />
                                <span className="font-bold text-xs uppercase tracking-wide">Expand</span>
                            </button>
                            <button
                                onClick={() => {
                                    setIsAllExpanded(false);
                                    setExpandedOverrides({});
                                }}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${!isAllExpanded ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}
                                title="Collapse All"
                            >
                                <Minimize2 size={16} />
                                <span className="font-bold text-xs uppercase tracking-wide">Collapse</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex items-center gap-4">
                    {/* Department Dropdown (Multi-Select) */}
                    <div className="relative group w-64 hidden md:block">
                        <MultiSelectDropdown
                            options={availableDepartments}
                            selected={selectedDepartments}
                            onChange={(newSelection) => {
                                setSelectedDepartments(newSelection);
                                setLastSelectedDeptCount(newSelection.length);
                                setSelectedSpocs([]); // Reset SPOCs when Dept changes
                            }}
                            label="Departments"
                        />
                    </div>

                    {/* SPOC MultiSelect Dropdown */}
                    <div className="relative group w-64 hidden md:block">
                        <MultiSelectDropdown
                            options={availableSpocs}
                            selected={selectedSpocs}
                            onChange={(newSelection) => setSelectedSpocs(newSelection)}
                            label="SPOCs"
                        />
                    </div>


                    {/* Simple Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Chart Container Wrapper - Fixed relative to screen */}
            <div className="flex-1 w-full bg-slate-50 relative overflow-hidden">

                {/* Floating View Controls - Bottom Right */}
                <div className="absolute bottom-8 right-8 flex flex-col gap-2 z-10">

                    <div className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            title="Zoom In"
                        >
                            <Plus size={20} />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            title="Zoom Out"
                        >
                            <Minus size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="w-full h-full overflow-auto overflow-x-hidden relative">
                    <div style={{ height: chartHeight + 'px', minWidth: '100%' }}>
                        <ReactEChartsCore
                            echarts={echarts}
                            option={getOption()}
                            style={{ height: '100%', width: '100%' }}
                            onEvents={{
                                'click': onChartClick
                            }}
                            opts={{ renderer: 'canvas' }}
                        />
                    </div>
                </div>
            </div>

            {/* Bot Details Modal */}
            {selectedBotId && (
                <BotDetails
                    botId={selectedBotId}
                    isModal={true}
                    onClose={() => setSelectedBotId(null)}
                />
            )}
        </div>
    );
}
