import { useState, useEffect } from 'react';
import { getAllBots } from '../lib/api';
import { Bot, Users, Building2 } from 'lucide-react';
import BotDetails from '../pages/BotDetails';
import '../pages/OrgChart.css';

export default function HierarchyTree() {
    const [treeData, setTreeData] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedBotId, setSelectedBotId] = useState(null);

    useEffect(() => {
        const fetchTree = async () => {
            try {
                setLoading(true);
                const res = await getAllBots({ limit: 1000 });
                const bots = res.data || [];

                const grouped = {};
                bots.forEach(bot => {
                    const bu = (bot.bu_name || 'COE').trim();
                    const spoc = (bot.spoc_name || 'Unassigned').trim();
                    if (!grouped[bu]) grouped[bu] = {};
                    if (!grouped[bu][spoc]) grouped[bu][spoc] = [];
                    grouped[bu][spoc].push(bot);
                });

                setTreeData(grouped);
            } catch (err) {
                console.error("Failed to fetch org tree", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTree();
    }, []);

    if (loading) return (
        <div className="flex justify-center p-10 py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar">
            <div className="tree py-10 px-6">
                <ul>
                    <li>
                        <div className="tree-node node-root">
                            <img src="/adani-logo.svg" alt="Adani Group" className="h-10 w-auto object-contain" />
                        </div>

                        {Object.keys(treeData).length > 0 && (
                            <ul>
                                {Object.keys(treeData).map((buName) => (
                                    <li key={buName}>
                                        <div className="tree-node node-dept" title={`Business Unit: ${buName}`}>
                                            <div className="flex flex-col items-start leading-none">
                                                <span className="text-[10px] uppercase font-black text-blue-500 mb-1 tracking-widest">Business Unit</span>
                                                <span className="font-extrabold text-gray-900">{buName}</span>
                                            </div>
                                        </div>

                                        <ul>
                                            {Object.keys(treeData[buName]).map((spocName) => (
                                                <li key={spocName}>
                                                    <div className="tree-node node-spoc">
                                                        <div className="flex flex-col items-start leading-none">
                                                            <span className="text-[10px] uppercase font-black text-indigo-500 mb-1 tracking-widest">SPOC</span>
                                                            <span className="font-bold text-gray-800 text-sm whitespace-normal max-w-[140px] leading-tight">{spocName}</span>
                                                        </div>
                                                    </div>

                                                    <ul>
                                                        {treeData[buName][spocName].map((bot) => (
                                                            <li key={bot.id}>
                                                                <button
                                                                    onClick={() => setSelectedBotId(bot.id)}
                                                                    className="tree-node node-bot group hover:bg-blue-50"
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-1.5 rounded-lg ${bot.status?.toLowerCase().includes('live') ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                            <Bot size={14} />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <div className="font-bold text-xs text-gray-900 group-hover:text-blue-700 truncate w-32">{bot.use_case_name}</div>
                                                                            <div className="text-[9px] font-black uppercase text-gray-400 mt-0.5 tracking-widest">LIVE AUTOMATION</div>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                </ul>
            </div>

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
