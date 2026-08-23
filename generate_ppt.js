const pptxgen = require("pptxgenjs");
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite Database
const dbPath = path.join(__dirname, 'backend', 'rpa_console.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
        process.exit(1);
    }
});

// Helper function to query DB
const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

async function generateExecutiveDeck() {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5

    // ---- Adani Brand Palette ----
    const ADANI_BLUE = "0B4E7A"; // Dark corporate blue
    const ADANI_LIGHT_BLUE = "1176BC";
    const ADANI_GREEN = "38B44A";
    const ADANI_RED = "D4380D";
    const ADANI_PURPLE = "722ED1";
    const BG_LIGHT = "F4F7F9";
    const WHITE = "FFFFFF";
    const DARK_TEXT = "1A1A1A";
    const MUTED_TEXT = "5C6570";

    const FONT_REGULAR = "Arial"; // Fallback to a standard corporate font similar to Calibri/Arial
    const FONT_HEAD = "Arial";

    const LOGO = path.join(__dirname, 'frontend', 'public', 'cb-logo.png'); // We will use the cb-logo for now as a placeholder for Adani
    
    // FETCH DATA FROM DB
    console.log("Fetching RPA metrics from database...");
    
    // 1. High Level KPIs
    const totalBotsRes = await queryDB("SELECT COUNT(*) as count FROM bots WHERE status != 'Inactive'");
    const totalBots = totalBotsRes[0].count;
    
    const runsRes = await queryDB("SELECT COUNT(*) as count, SUM(CASE WHEN run_status='Completed' THEN 1 ELSE 0 END) as successful FROM bot_runs");
    const totalRuns = runsRes[0].count;
    const successfulRuns = runsRes[0].successful;
    const successRate = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(1) + "%" : "0%";

    const hoursRes = await queryDB("SELECT SUM(b.per_day_saving_hours) as hours FROM bot_runs r JOIN bots b ON r.bot_id = b.id WHERE r.run_status='Completed'");
    const totalHoursSaved = Math.round(hoursRes[0].hours || 0);

    // 2. Departmental Breakdown
    const deptRes = await queryDB(`
        SELECT d.name as department, 
               COUNT(r.id) as runs, 
               SUM(CASE WHEN r.run_status='Completed' THEN 1 ELSE 0 END) as successful_runs,
               SUM(CASE WHEN r.run_status='Completed' THEN b.per_day_saving_hours ELSE 0 END) as hours
        FROM bot_runs r 
        JOIN bots b ON r.bot_id = b.id 
        JOIN departments d ON b.department_id = d.id 
        GROUP BY d.name
        ORDER BY hours DESC
        LIMIT 6
    `);

    // 3. Trend Data (Last 6 Months)
    const trendRes = await queryDB(`
        SELECT substr(r.report_date, 1, 7) as month, 
               SUM(CASE WHEN r.run_status='Completed' THEN b.per_day_saving_hours ELSE 0 END) as hours
        FROM bot_runs r 
        JOIN bots b ON r.bot_id = b.id 
        WHERE r.report_date IS NOT NULL AND r.report_date != ''
        GROUP BY month 
        ORDER BY month DESC 
        LIMIT 6
    `);
    const trendData = trendRes.reverse(); // oldest to newest

    // ============================================================
    // COMMON ELEMENTS
    // ============================================================
    function addHeader(slide, title) {
        slide.addText(title, {
            x: 0.5, y: 0.4, w: 10, h: 0.6, fontFace: FONT_HEAD, fontSize: 24, bold: true, color: ADANI_BLUE
        });
        slide.addShape("line", { x: 0.5, y: 1.0, w: 12.3, h: 0, line: { color: ADANI_BLUE, width: 2 } });
        try {
            slide.addImage({ path: LOGO, x: 11.5, y: 0.2, w: 1.3, h: 0.6 });
        } catch (e) {
            slide.addText("Adani Portfolio", { x: 10.5, y: 0.4, w: 2.3, h: 0.6, fontFace: FONT_HEAD, fontSize: 18, bold: true, color: ADANI_BLUE, align: "right" });
        }
    }

    function addFooter(slide, pageNum) {
        slide.addText("STRICTLY CONFIDENTIAL", {
            x: 0.5, y: 7.0, w: 4, h: 0.3, fontFace: FONT_REGULAR, fontSize: 10, color: ADANI_RED, bold: true
        });
        slide.addText(String(pageNum), {
            x: 12.0, y: 7.0, w: 0.8, h: 0.3, fontFace: FONT_REGULAR, fontSize: 10, color: MUTED_TEXT, align: "right"
        });
    }

    // ============================================================
    // SLIDE 1: TITLE SLIDE
    // ============================================================
    console.log("Generating Slide 1: Title...");
    const s1 = pres.addSlide();
    s1.background = { color: BG_LIGHT };

    // Corporate blue header band
    s1.addShape("rect", { x: 0, y: 0, w: 13.33, h: 1.2, fill: { color: ADANI_BLUE } });
    
    try {
        s1.addImage({ path: LOGO, x: 0.5, y: 0.25, w: 1.5, h: 0.7 });
    } catch(e) {
        s1.addText("adani", { x: 0.5, y: 0.25, w: 2, h: 0.7, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: WHITE });
    }

    s1.addText("Adani Portfolio", {
        x: 9.0, y: 2.5, w: 3.8, h: 0.6, fontFace: FONT_HEAD, fontSize: 32, bold: true, color: DARK_TEXT, align: "right"
    });
    
    s1.addShape("line", { x: 7.0, y: 3.2, w: 5.8, h: 0, line: { color: ADANI_GREEN, width: 3 } });

    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    s1.addText(`${monthName} – Automation Performance Review`, {
        x: 6.0, y: 3.4, w: 6.8, h: 0.5, fontFace: FONT_REGULAR, fontSize: 20, color: DARK_TEXT, align: "right"
    });

    // Decorative elements
    s1.addShape("ellipse", { x: -2, y: 4, w: 6, h: 6, fill: { color: ADANI_LIGHT_BLUE, transparency: 85 } });
    s1.addShape("ellipse", { x: 10, y: 5, w: 4, h: 4, fill: { color: ADANI_GREEN, transparency: 85 } });

    // ============================================================
    // SLIDE 2: SALIENT FEATURES & KPI
    // ============================================================
    console.log("Generating Slide 2: KPIs...");
    const s2 = pres.addSlide();
    s2.background = { color: WHITE };
    addHeader(s2, "Adani Portfolio Results Overview & Salient Features");

    s2.addText("- Automation listed portfolio registered strong growth in execution and hours saved.", {
        x: 0.5, y: 1.2, w: 12, h: 0.4, fontFace: FONT_REGULAR, fontSize: 14, color: DARK_TEXT, bullet: true
    });
    s2.addText(`- Core Infrastructure Bots achieved an impressive ${successRate} Success Rate over ${totalRuns.toLocaleString()} runs.`, {
        x: 0.5, y: 1.7, w: 12, h: 0.4, fontFace: FONT_REGULAR, fontSize: 14, color: DARK_TEXT, bullet: true
    });

    // Big KPI Blocks
    const kpiWidth = 3.5;
    const kpiY = 2.5;
    const kpis = [
        { title: "Total Active Bots", val: totalBots.toLocaleString(), color: ADANI_BLUE },
        { title: "Total Executions", val: totalRuns.toLocaleString(), color: ADANI_LIGHT_BLUE },
        { title: "Total Hours Saved", val: totalHoursSaved.toLocaleString(), color: ADANI_GREEN }
    ];

    kpis.forEach((k, idx) => {
        let x = 1.0 + (idx * (kpiWidth + 0.5));
        s2.addShape("roundRect", { x: x, y: kpiY, w: kpiWidth, h: 1.8, rectRadius: 0.1, fill: { color: BG_LIGHT } });
        s2.addShape("rect", { x: x, y: kpiY, w: 0.1, h: 1.8, fill: { color: k.color } });
        s2.addText(k.val, { x: x + 0.2, y: kpiY + 0.3, w: kpiWidth - 0.4, h: 0.8, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: k.color, align: "center" });
        s2.addText(k.title, { x: x + 0.2, y: kpiY + 1.2, w: kpiWidth - 0.4, h: 0.4, fontFace: FONT_REGULAR, fontSize: 14, color: MUTED_TEXT, align: "center" });
    });

    addFooter(s2, 2);

    // ============================================================
    // SLIDE 3: DEPARTMENTAL BREAKDOWN (TABLE)
    // ============================================================
    console.log("Generating Slide 3: Department Breakdown...");
    const s3 = pres.addSlide();
    s3.background = { color: WHITE };
    addHeader(s3, "Adani Portfolio: Strong Financial Performance delivered across portfolio");

    s3.addText("- Departmental business reported strong recovery with operational synergies leading to improvement in margins.", {
        x: 0.5, y: 1.2, w: 12, h: 0.4, fontFace: FONT_REGULAR, fontSize: 14, color: DARK_TEXT, bullet: true
    });

    // Generate Table Data
    const tableHeader = [
        { text: "Department", options: { bold: true, color: WHITE, fill: ADANI_BLUE, fontSize: 14, align: "left" } },
        { text: "Total Runs", options: { bold: true, color: WHITE, fill: ADANI_BLUE, fontSize: 14, align: "center" } },
        { text: "Success Rate", options: { bold: true, color: WHITE, fill: ADANI_BLUE, fontSize: 14, align: "center" } },
        { text: "Hours Saved", options: { bold: true, color: WHITE, fill: ADANI_BLUE, fontSize: 14, align: "center" } }
    ];

    const tableRows = [tableHeader];
    deptRes.forEach((d, idx) => {
        const bg = idx % 2 === 0 ? "F9F9F9" : "EAEAEA";
        const sr = d.runs > 0 ? ((d.successful_runs / d.runs) * 100).toFixed(0) + "%" : "0%";
        tableRows.push([
            { text: d.department || "Unknown", options: { fill: bg, fontSize: 14, align: "left" } },
            { text: d.runs.toLocaleString(), options: { fill: bg, fontSize: 14, align: "center" } },
            { text: sr, options: { fill: bg, fontSize: 14, align: "center" } },
            { text: Math.round(d.hours).toLocaleString(), options: { fill: bg, fontSize: 14, align: "center" } }
        ]);
    });

    s3.addTable(tableRows, {
        x: 0.5, y: 2.0, w: 12.3, 
        rowH: 0.5,
        border: { pt: 1, color: "FFFFFF" }
    });

    addFooter(s3, 3);

    // ============================================================
    // SLIDE 4: GROWTH WITH OPERATIONAL DISCIPLINE (CHART)
    // ============================================================
    console.log("Generating Slide 4: Growth Chart...");
    const s4 = pres.addSlide();
    s4.background = { color: WHITE };
    addHeader(s4, "Adani Portfolio: Growth with Operational Discipline");

    if (trendData.length > 0) {
        const labels = trendData.map(d => d.month);
        const data = trendData.map(d => Math.round(d.hours));

        s4.addChart(pres.ChartType.bar, 
            [ { name: "Hours Saved", labels: labels, values: data } ],
            {
                x: 1.0, y: 1.5, w: 11.3, h: 4.5,
                barDir: "col",
                chartColors: [ADANI_BLUE],
                dataLabelColor: DARK_TEXT,
                showValue: true,
                dataLabelFontSize: 12,
                showLegend: false,
                valAxisHidden: false,
                catAxisLabelColor: MUTED_TEXT,
                catAxisLabelFontSize: 12,
                valGridLine: { color: "EAEAEA", style: "solid" }
            }
        );
    } else {
        s4.addText("Not enough historical data to display growth trend.", {
            x: 1.0, y: 3.0, w: 10, h: 1.0, fontFace: FONT_REGULAR, fontSize: 16, color: MUTED_TEXT, align: "center"
        });
    }

    addFooter(s4, 4);

    // ============================================================
    // SAVE THE FILE
    // ============================================================
    const outPath = path.join(__dirname, "backend", "uploads", "Adani_Portfolio_RPA_Report.pptx");
    pres.writeFile({ fileName: outPath }).then(() => {
        console.log(`Successfully generated Executive PPT at: ${outPath}`);
        db.close();
    }).catch(err => {
        console.error("Error writing PPT:", err);
        db.close();
    });
}

generateExecutiveDeck();
