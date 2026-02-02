import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, ChevronRight, Menu, X, FileText, Database, BarChart3, Shield, Users, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InsiderTradingDocumentation = () => {
  const [selectedSection, setSelectedSection] = useState('intro');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const contentRef = useRef(null);

  // Scroll to top when selectedSection changes
  useEffect(() => {
    // Small delay to ensure content has rendered
    const timer = setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [selectedSection]);

  const sections = [
    { id: 'intro', title: 'Introduction', icon: BookOpen, color: 'blue' },
    { id: 'purpose', title: 'Purpose & Benefits', icon: FileText, color: 'purple' },
    { id: 'overview', title: 'System Architecture', icon: BarChart3, color: 'green' },
    { id: 'data', title: 'Data Sources', icon: Database, color: 'orange' },
    { id: 'frontend', title: 'Frontend Guide', icon: Users, color: 'pink' },
    { id: 'backend', title: 'Backend Processing', icon: Database, color: 'indigo' },
    { id: 'metrics', title: 'Key Metrics', icon: AlertCircle, color: 'red' },
    { id: 'insights', title: 'Insights', icon: Shield, color: 'yellow' },
    { id: 'journey', title: 'User Journey', icon: Users, color: 'teal' },
    { id: 'takeaways', title: 'Best Practices', icon: Shield, color: 'cyan' },
  ];

  // Find previous and next sections
  const getCurrentSectionIndex = () => sections.findIndex(section => section.id === selectedSection);
  
  const goToPreviousSection = () => {
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex > 0) {
      setSelectedSection(sections[currentIndex - 1].id);
    }
  };
  
  const goToNextSection = () => {
    const currentIndex = getCurrentSectionIndex();
    if (currentIndex < sections.length - 1) {
      setSelectedSection(sections[currentIndex + 1].id);
    }
  };

  const content = {
    intro: {
      title: 'Introduction to Insider Trading',
      sections: [
        {
          subtitle: 'What is Insider Trading?',
          text: 'Insider trading refers to the buying or selling of a company\'s securities (stocks, bonds, etc.) by individuals who have access to material, non-public information about the company. While legal when conducted by corporate insiders (officers, directors, employees) who trade with public knowledge and report their transactions, it becomes illegal when based on material non-public information or when violating fiduciary duties.'
        },
        {
          subtitle: 'Why is Insider Trading Monitored?',
          points: [
            'Market Integrity: Ensures fair and transparent markets by detecting potentially illegal activities',
            'Investor Protection: Protects retail investors from being disadvantaged by those with privileged information',
            'Regulatory Compliance: Helps companies and regulators ensure adherence to securities laws',
            'Early Warning System: Identifies unusual trading patterns that may signal upcoming corporate events'
          ]
        },
        {
          subtitle: 'Regulatory and Compliance Significance',
          text: 'Insider trading surveillance is mandated by regulatory bodies such as Securities and Exchange Board of India (SEBI), Companies Act, 2013, and Stock Exchanges. Non-compliance can result in severe penalties including fines, imprisonment, and permanent market bans.'
        },
        {
          subtitle: 'Real-World Context and Risks',
          points: [
            'Early detection of mergers and acquisitions',
            'Identification of financial distress before public announcements',
            'Prevention of market manipulation schemes',
            'Protection against front-running activities'
          ]
        }
      ]
    },
    purpose: {
      title: 'Purpose & Benefits',
      sections: [
        {
          subtitle: 'What Problem This Insider Trading System Solves',
          points: [
            'Data Fragmentation: Consolidates trading data from multiple companies and depositories into a single platform',
            'Manual Monitoring: Automates the detection of unusual trading patterns that would be impossible to identify manually',
            'Time-Consuming Analysis: Reduces hours of manual work to minutes with automated categorization and analysis',
            'Compliance Reporting: Streamlines the process of generating regulatory reports and maintaining audit trails'
          ]
        },
        {
          subtitle: 'What the Application is Designed to Do',
          points: [
            'Monitor and analyze insider trading activities across multiple companies',
            'Categorize investors based on their trading behavior (new entries, exits, position changes)',
            'Identify unusual trading patterns that warrant further investigation',
            'Provide actionable insights for compliance teams and decision-makers',
            'Generate comprehensive reports for regulatory submissions'
          ]
        },
        {
          subtitle: 'Who the Intended Users Are',
          text: 'Primary users include Compliance Officers, Legal Teams, Risk Analysts, Audit Teams, and Senior Management. Secondary users may include Investment Analysts and Corporate Governance Teams.'
        }
      ]
    },
    overview: {
      title: 'System Architecture',
      sections: [
        {
          subtitle: 'High-Level Architecture',
          text: 'The AEGIS Insider Trading System follows a modern, scalable architecture with Frontend UI (React/TypeScript) → API Layer (FastAPI) → Database Storage (SQLite) → Data Processing & Analytics.',
          code: `
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
│   Frontend UI   │───▶│  API Layer   │───▶│ Database Storage │
│  (React/TypeScript) │    │ (FastAPI)    │    │ (SQLite)         │
└─────────────────┘    └──────────────┘    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Data Processing │
                    │   & Analytics    │
                    └──────────────────┘`
        },
        {
          subtitle: 'How the System Works End-to-End',
          points: [
            'Data Ingestion: Trading data is collected from depositories (CDSL, NSDL) and physical records',
            'Data Processing: Raw data is parsed, cleaned, and classified into categories',
            'Database Storage: Processed data is stored in company-specific SQLite databases',
            'API Layer: FastAPI endpoints provide access to categorized data',
            'Frontend Presentation: React-based UI displays analytics, insights, and raw data',
            'User Interaction: Users can filter, analyze, and export data for compliance purposes'
          ]
        },
        {
          subtitle: 'User Interaction Flow',
          points: [
            'Access: Users log into the AEGIS platform and navigate to the Insider Trading module',
            'Overview: Initial dashboard provides high-level summary of trading activities',
            'Drill-Down: Users can explore specific companies, depositories, or trading categories',
            'Analysis: Detailed views show top movers, position changes, and unusual activities',
            'Action: Users can export data, generate reports, or flag items for investigation'
          ]
        }
      ]
    },
    data: {
      title: 'Data Sources',
      sections: [
        {
          subtitle: 'Where the Data is Coming From',
          points: [
            'Central Depository Services (India) Limited (CDSL)',
            'National Securities Depository Limited (NSDL)',
            'Physical Records: Paper-based disclosures from company registrars'
          ]
        },
        {
          subtitle: 'Types of Data Used',
          points: [
            'PAN/GIR Numbers: Unique identifiers for investors',
            'Investor Names: Legal names of individuals or entities',
            'Email Addresses: Contact information for traceability',
            'Position Data: Shareholding quantities at different time periods',
            'Position Differences: Calculated changes in holdings',
            'Status Classifications: Categorization of trading activities',
            'Company Information: Associated corporate entities',
            'Depository Details: Source of the trading data'
          ]
        },
        {
          subtitle: 'How Data is Ingested and Processed',
          points: [
            'Collection: Data files are received from depositories and physical sources',
            'Parsing: Files are converted to structured format (typically SQLite databases)',
            'Classification: Investors are categorized into four statuses: ADDED, REMOVED, CHANGED, UNCHANGED',
            'Validation: Data quality checks ensure accuracy and completeness',
            'Storage: Organized in company-specific databases with standardized schemas'
          ]
        },
        {
          subtitle: 'Assumptions and Limitations of the Data',
          text: 'Assumptions include that data provided by depositories is accurate and complete. Limitations include data timeliness depending on reporting schedules, potential delays in processing physical records, and some beneficial ownership structures may not be fully captured.'
        }
      ]
    },
    frontend: {
      title: 'Frontend Guide',
      sections: [
        {
          subtitle: 'What is Shown on Each Screen/Dashboard',
          text: 'The Insider Trading module consists of three primary tabs: Analytics Dashboard (comprehensive visualizations and KPIs), Data Source View (underlying data sources and characteristics), and Master Data View (complete dataset for detailed analysis).'
        },
        {
          subtitle: 'Explanation of Charts, Tables, and Visual Elements',
          points: [
            'Key Metrics Cards: Display critical summary statistics like Total Records, Companies, New Positions, Largest Change',
            'Status Distribution Chart: A pie chart showing the proportion of investors in each category (Added, Removed, Changed, Unchanged)',
            'Company Activity Analysis: A horizontal bar chart comparing companies by trading activity',
            'Position Changes Timeline: A line chart displaying trends in different trading categories over time'
          ]
        },
        {
          subtitle: 'User Actions and Navigation',
          points: [
            'Switch Views: Navigate between Analytics, Data Source, and Master Data tabs',
            'Filter Data: Apply company and depository filters to focus analysis',
            'Search Records: Find specific investors or PAN numbers',
            'Sort Tables: Organize data by different criteria',
            'Export Data: Download information for offline analysis or reporting'
          ]
        },
        {
          subtitle: 'Filters, Searches, and Controls',
          text: 'Global filters include Company Filter (narrow focus to specific corporate entities) and Depository Filter (isolate data from CDSL, NSDL, or physical sources). Search functions include Text Search and Status Filter. Interactive controls include Refresh Button, Export Options, and Detail Views.'
        }
      ]
    },
    backend: {
      title: 'Backend Processing',
      sections: [
        {
          subtitle: 'What the Backend is Responsible For',
          points: [
            'Data Management: Storing, organizing, and maintaining insider trading data',
            'API Services: Providing programmatic access to frontend applications',
            'Data Processing: Classifying and categorizing investor records',
            'Performance Optimization: Ensuring fast response times for user queries',
            'Security: Protecting sensitive trading information'
          ]
        },
        {
          subtitle: 'Data Processing Logic',
          text: 'The backend implements sophisticated processing workflows including Data Ingestion Pipeline (File Reception, Format Conversion, Schema Validation, Quality Checks), Classification Algorithm (Position Comparison, Status Assignment, Duplicate Detection, Cross-Reference Validation), and Aggregation Process (Summary Generation, Category Analysis, Trend Calculation, Statistical Analysis).'
        },
        {
          subtitle: 'APIs and Services',
          points: [
            'Core Endpoints: /api/insider-trading/summary (high-level metrics), /api/insider-trading/details (comprehensive data sets), /api/insider-trading/companies (tracked entities), /api/insider-trading/filter-options (filtering parameters)',
            'Enhanced Endpoints: /api/insider-trading/enhanced-details (detailed categorized data), /api/insider-trading/filter-options (company and depository filters)'
          ]
        },
        {
          subtitle: 'How Calculations and Metrics are Generated',
          text: 'Primary metrics include Total Records (simple count), Net Investor Change ((Added Count) - (Removed Count)), and Net Share Change (sum of all position differences). Secondary calculations include Average Position Size, Turnover Rate, and Concentration Index. Comparative analytics include Company Rankings, Investor Profiles, and Temporal Trends.'
        }
      ]
    },
    metrics: {
      title: 'Key Metrics',
      sections: [
        {
          subtitle: 'Metric 1: Total Insider Records',
          text: 'Represents the total count of all investor positions tracked in the system. Important for indicating the scale of monitoring activity and providing baseline for other metrics. Calculated as simple count of all records across all companies and depositories. Higher values indicate more comprehensive monitoring. Red flags include sudden drops (data collection issues) or unexpected spikes (new corporate activities).'
        },
        {
          subtitle: 'Metric 2: New Investor Positions (Added)',
          text: 'Counts investors who have newly acquired positions. Important for identifying entry of new stakeholders and tracking expanding investor base. Calculated as count of records with "ADDED" status. High values may indicate positive market sentiment. Red flags include large positions acquired by connected parties or multiple new positions by same investor across companies.'
        },
        {
          subtitle: 'Metric 3: Exited Positions (Removed)',
          text: 'Counts investors who have completely divested positions. Important for identifying loss of confidence or strategic shifts. Calculated as count of records with "REMOVED" status. Normal turnover is expected in healthy markets. Red flags include key executives or major shareholders exiting or large-scale divestments by institutional investors.'
        },
        {
          subtitle: 'Metric 4: Modified Holdings (Changed)',
          text: 'Counts investors who have adjusted their position sizes. Important for showing ongoing engagement with company securities. Calculated as count of records with "CHANGED" status. Frequent changes may indicate active trading strategies. Red flags include substantial increases preceding major announcements or patterned trading by connected individuals.'
        },
        {
          subtitle: 'Metric 5: Static Holdings (Unchanged)',
          text: 'Counts investors maintaining consistent position sizes. Important for indicating stable long-term commitment. Calculated as count of records with "UNCHANGED" status. High percentages suggest mature, stable investor bases. Red flags include extremely low values (data quality issues) or unexpected changes in typically static holdings.'
        },
        {
          subtitle: 'Metric 6: Net Investor Change',
          text: 'Represents the difference between new entrants and complete exits. Important for indicating overall direction of investor sentiment. Calculated as (Added Count) - (Removed Count). Positive values indicate net growth in investor base. Red flags include large negative values during stable periods or extreme positive values without apparent catalysts.'
        },
        {
          subtitle: 'Metric 7: Net Share Change',
          text: 'Represents the aggregate change in total shares held by tracked investors. Important for measuring actual capital movement in/out of company. Calculated as sum of all position differences across all records. Positive values indicate net capital inflow. Red flags include large outflows during critical business periods or disproportionate changes compared to market conditions.'
        }
      ]
    },
    insights: {
      title: 'Insights',
      sections: [
        {
          subtitle: 'What the System is Telling the User',
          text: 'The Insider Trading system provides several layers of insight including Macro-Level Trends (overall market sentiment, comparative activity levels, seasonal patterns), Micro-Level Details (specific investor behaviors, individual position changes), and Compliance Intelligence (potential violations, reporting completeness, areas needing enhanced monitoring).'
        },
        {
          subtitle: 'How to Read and Analyze the Results',
          points: [
            'Start with the Overview: Review summary metrics, examine status distribution, compare current period to historical norms',
            'Drill Down to Details: Investigate companies with unusual activity levels, examine top movers, look for patterns across multiple data points',
            'Validate Findings: Cross-reference with public information, check for corroborating evidence, consider market context and recent events'
          ]
        },
        {
          subtitle: 'Examples of Insider Trading Patterns',
          points: [
            'Pattern 1: Preceding Major Announcements - Increased buying activity before public disclosures, concentrated among senior executives or major shareholders',
            'Pattern 2: Exit Signals - Gradual reduction in holdings by key stakeholders, accelerated divestment as announcement approaches',
            'Pattern 3: Institutional Rotation - Simultaneous entry and exit by different institutional investors, usually involving large position sizes',
            'Pattern 4: Connected Party Activity - Trading by family members, close associates, or business partners, timing correlated with material events'
          ]
        },
        {
          subtitle: 'What Conclusions Users Should Draw',
          text: 'For Compliance Teams: Identify potential violations, assess adequacy of current monitoring procedures, plan enhanced scrutiny. For Risk Analysts: Evaluate potential impact on company valuation, assess likelihood of upcoming corporate events. For Management: Gauge market perception of strategic initiatives, understand stakeholder confidence levels.'
        }
      ]
    },
    journey: {
      title: 'User Journey',
      sections: [
        {
          subtitle: 'Step-by-Step Walkthrough',
          points: [
            'Step 1: Access the System - Log into the AEGIS platform, navigate to the Insider Trading module, observe initial loading of summary data',
            'Step 2: Review Overview Analytics - Examine key metrics cards, review status distribution pie chart, note anomalies or trends',
            'Step 3: Explore Company Analysis - Switch to Company Analysis view, identify companies with highest trading activity, compare relative activity levels',
            'Step 4: Investigate Top Movers - Navigate to Top Movers section, review lists of new positions and significant exits, click on specific records for details',
            'Step 5: Apply Filters for Focused Analysis - Use company/depository filters, combine filters for targeted views, observe how filtering affects metrics',
            'Step 6: Access Detailed Data - Switch to Master Data view, use search functions, apply status filters, sort data by different criteria',
            'Step 7: Export Data for Further Analysis - Select relevant data subsets, choose appropriate export format, download data for offline analysis',
            'Step 8: Document Findings - Record notable observations, flag items requiring investigation, prepare summaries for management review'
          ]
        },
        {
          subtitle: 'What Decisions a User Can Make Using This System',
          text: 'Compliance Decisions (initiate investigations, enhance monitoring, adjust reporting procedures), Investment Decisions (assess market sentiment, identify opportunities/risks), and Strategic Decisions (plan corporate actions, adjust communication strategies).'
        }
      ]
    },
    takeaways: {
      title: 'Best Practices',
      sections: [
        {
          subtitle: 'What Users Must Understand Before Using the System',
          points: [
            'Data Limitations: System reflects reported positions (not all trading), timeliness depends on reporting schedules, some ownership structures may not be fully captured',
            'Privacy Considerations: Trading data contains sensitive information, access restricted to authorized personnel, all activities logged for audit',
            'Regulatory Context: Monitoring supports but does not replace legal compliance, suspicious activities must be reported, findings require human judgment'
          ]
        },
        {
          subtitle: 'How to Use Insights Responsibly',
          points: [
            'Verification Approach: Cross-reference findings with other sources, seek corroborating evidence, consider market context',
            'Escalation Protocol: Document investigative steps, follow established procedures, coordinate with legal/compliance teams',
            'Continuous Learning: Review system capabilities, participate in training, share insights with team members'
          ]
        },
        {
          subtitle: 'Compliance and Ethical Considerations',
          points: [
            'Legal Compliance: Ensure all monitoring complies with securities laws, maintain proper documentation, report findings to authorities when required',
            'Ethical Standards: Use insights solely for legitimate business purposes, avoid personal trading based on system information, maintain confidentiality',
            'Professional Responsibility: Exercise sound judgment, seek guidance when needed, collaborate with colleagues, continuously improve monitoring'
          ]
        }
      ]
    }
  };

  const currentContent = content[selectedSection];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100 ml-2"
              >
                <X size={24} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="text-blue-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AEGIS Insider Trading</h1>
                  <p className="text-sm text-slate-600">Comprehensive compliance monitoring system</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-80 bg-white border-r border-slate-200 sticky top-0 h-full shadow-lg`}>
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Documentation</h2>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 rounded hover:bg-slate-200"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-80px)]">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = selectedSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left ${
                    isActive
                      ? `bg-gradient-to-r from-${section.color}-50 to-${section.color}-100 text-${section.color}-700 border-l-4 border-${section.color}-500 shadow-sm`
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={18} className={isActive ? `text-${section.color}-600` : 'text-slate-400'} />
                  <span className="flex-1 text-left font-medium text-sm">{section.title}</span>
                  {isActive && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main ref={contentRef} className="flex-1 p-6 md:p-8 overflow-y-auto h-full bg-gradient-to-br from-white to-slate-50">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-6">
              <span className="font-medium text-slate-700">Docs</span>
              <ChevronRight size={14} />
              <span className="font-medium text-slate-900">{currentContent.title}</span>
            </div>

            {/* Title and Description */}
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">{currentContent.title}</h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto md:mx-0">
                Everything you need to know about this section of the AEGIS Insider Trading system
              </p>
            </div>

            {/* Table of Contents */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <BookOpen size={18} className="mr-2 text-blue-500" />
                In This Section
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentContent.sections.map((section, idx) => (
                  <div key={idx} className="flex items-start space-x-2">
                    <div className="mt-1 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-slate-700 text-sm">{section.subtitle}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
              {currentContent.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start mb-4">
                    <div className="mr-3 mt-1">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen size={16} className="text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900">{section.subtitle}</h2>
                  </div>
                  
                  {section.text && (
                    <p className="text-slate-700 leading-relaxed mb-4">{section.text}</p>
                  )}
                  
                  {section.points && (
                    <ul className="space-y-3">
                      {section.points.map((point, pointIdx) => (
                        <li key={pointIdx} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                          </div>
                          <span className="text-slate-700 leading-relaxed">{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {section.code && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between bg-slate-800 text-slate-200 px-4 py-2 rounded-t-lg text-sm">
                        <span>Code Example</span>
                        <button className="hover:bg-slate-700 px-2 py-1 rounded">
                          Copy
                        </button>
                      </div>
                      <pre className="bg-slate-800 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm">
                        <code>{section.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between mt-12 pt-8 border-t border-slate-200">
              <button 
                onClick={goToPreviousSection}
                disabled={getCurrentSectionIndex() === 0}
                className={`flex items-center space-x-2 transition ${getCurrentSectionIndex() === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900'}`}
              >
                <ChevronRight size={20} className="rotate-180" />
                <span>Previous</span>
              </button>
              <button 
                onClick={goToNextSection}
                disabled={getCurrentSectionIndex() === sections.length - 1}
                className={`flex items-center space-x-2 transition font-medium ${getCurrentSectionIndex() === sections.length - 1 ? 'text-slate-300 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <span>Next</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InsiderTradingDocumentation;