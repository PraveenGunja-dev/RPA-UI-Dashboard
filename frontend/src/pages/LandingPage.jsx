import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, ArrowDown, ArrowUp, ArrowRight,
    Database, FileText, Activity, Network
} from 'lucide-react';
import Orb from '../components/Orb';
import HierarchyTree from '../components/HierarchyTree';
import { getDepartments, getVisitCount, incrementVisitCount } from '../lib/api';
import './LandingPage.css';

const COLORS = ["honolulu-blue", "dark-lavender", "x11-maroon"];

const getDeptConfig = (dept, index) => {
    const color = COLORS[index % COLORS.length];
    return {
        color,
        icon: index % 3 === 0 ? <Activity className="h-6 w-6" /> :
            index % 3 === 1 ? <Database className="h-6 w-6" /> :
                <FileText className="h-6 w-6" />,
        features: [
            { label: "Active Bots", value: dept.deployed_bots || 0 },
            { label: "Yesterday Run Bots", value: dept.run_count_yesterday || 0 },
            { label: "Hours Saved / Month", value: Math.round(dept.total_hours_saved || 0).toLocaleString() },
            { label: "Man Hours / Month", value: (dept.man_hours_saved || 0).toLocaleString() }
        ]
    };
};

const getColorClasses = (color) => {
    switch (color) {
        case "honolulu-blue":
            return { bgClass: "bg-honolulu-blue/20", textClass: "text-honolulu-blue", btnColor: "#0B74B0" };
        case "dark-lavender":
            return { bgClass: "bg-dark-lavender/20", textClass: "text-dark-lavender", btnColor: "#75479C" };
        case "x11-maroon":
            return { bgClass: "bg-x11-maroon/20", textClass: "text-x11-maroon", btnColor: "#BD3861" };
        default:
            return { bgClass: "bg-gray-200/20", textClass: "text-gray-800", btnColor: "#333" };
    }
};

const getBorderColor = (color) => {
    switch (color) {
        case "honolulu-blue": return "#0B74B0";
        case "dark-lavender": return "#75479C";
        case "x11-maroon": return "#BD3861";
        default: return "#ccc";
    }
};

function LandingPage() {
    const navigate = useNavigate();
    const [visitCount, setVisitCount] = useState(0);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const hasIncremented = useRef(false);

    useEffect(() => {
        const initData = async () => {
            // 1. Fetch Departments (Run always to ensure state is set on mount)
            try {
                const dRes = await getDepartments();
                console.log("Full API response:", dRes);
                console.log("Departments data:", dRes.data);
                if (dRes.data && Array.isArray(dRes.data)) {
                    setDepartments(dRes.data);
                    console.log("Sample department:", dRes.data[0]);
                }
            } catch (error) {
                console.error("Error loading departments:", error);
            } finally {
                setLoading(false);
            }

            // 2. Handle Visit Counter
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
        initData();
    }, []);

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
            <div className="orb-section min-h-screen">
                <div className="w-full flex justify-center">
                    <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: '600px', height: '600px' }}>
                            <Orb />
                            <div className="absolute" style={{ inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
                                <img
                                    src="/adani-re.png"
                                    alt="Adani Logo"
                                    style={{ width: '200px', height: '200px', objectFit: 'contain', opacity: 0.9, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container" style={{ textAlign: 'center', paddingTop: '1.5rem', paddingBottom: '1.5rem' }}>
                    <h1 className="title-gradient p-2 text-6xl font-extrabold title-responsive" style={{ letterSpacing: '-0.025em' }}>
                        COBOT Dashboard
                    </h1>
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
                        {departments.map((dept, idx) => {
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
                                        <div className="flex align-center" style={{ gap: '1rem', alignItems: 'flex-start' }}>
                                            <div
                                                className={`flex-shrink-0 flex items-center justify-center ${colorClasses.bgClass} ${colorClasses.textClass}`}
                                                style={{ width: '48px', height: '48px', borderRadius: '0.5rem' }}
                                            >
                                                {icon}
                                            </div>
                                            <div className="flex-1" style={{ minWidth: 0 }}>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-lg truncate">{dept.name}</h3>
                                                    {/* Bot count with blinking dot */}
                                                    <div className="bot-count-badge">
                                                        <span className={`status-dot ${hasActiveBots ? 'active' : ''}`}></span>
                                                        <p className="font-bold text-gray-600">
                                                            <span style={{ color: colorClasses.btnColor, fontSize: '1.1em' }}>{dept.total_bots || 0}</span>
                                                            <span className="text-sm font-normal text-gray-500"> Bots</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-content">
                                        <div className="flex-1 pb-4">
                                            <h4 className="text-xs font-semibold uppercase tracking-wide mb-3">Key Metrics:</h4>
                                            <div className="space-y-2">
                                                {features.map((feature, fIdx) => (
                                                    <div key={fIdx} className="flex justify-between items-center" style={{ gap: '0.5rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '4px' }}>
                                                        <span className="text-xs text-gray-500 font-medium">{feature.label}:</span>
                                                        <span className="font-bold text-lg" style={{ color: colorClasses.btnColor }}>{feature.value}</span>
                                                    </div>
                                                ))}
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
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Organization Chart CTA */}
            <div className="container">
                <div
                    className="text-center relative overflow-hidden group cursor-pointer"
                    onClick={() => navigate('/tree')}
                >
                    <button href="/tree"
                        className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl border hover:shadow-2xl transition-all flex items-center gap-3 mx-auto relative z-10 transform group-hover:scale-105 active:scale-95 uppercase tracking-widest text-sm"
                    >
                        Open Interactive Chart
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="footer">
                <div className="container">
                    <div className="flex flex-col items-center gap-4">
                        <div style={{ marginTop: '1rem' }}>
                            Total Visits: {visitCount.toLocaleString()} | Powered By – Adani Green Energy Limited
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Top */}
            {showScrollTop && (
                <button onClick={scrollToTop} className="scroll-fab" aria-label="Scroll to top">
                    <ArrowUp size={16} />
                </button>
            )}
        </div>
    );
}

export default LandingPage;
