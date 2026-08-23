import sqlite3
import pandas as pd
import datetime
import os
import argparse
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'rpa_console.db')
TEMPLATE_PATH = os.path.join(BASE_DIR, 'base_report_template.pptx')
OUT_PATH = os.path.join(BASE_DIR, 'uploads', 'Adani_Portfolio_RPA_Report.pptx')

def get_df(query, params=()):
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query(query, conn, params=params)
    conn.close()
    return df

def generate_deck(days=7):
    print(f"Generating Executive PPT for {days} days...")
    
    # Calculate cutoff relative to the latest data available in the DB
    max_date_str = get_df("SELECT MAX(report_date) as m FROM bot_runs")['m'][0]
    if max_date_str:
        latest_date = datetime.datetime.strptime(max_date_str, '%Y-%m-%d')
    else:
        latest_date = datetime.datetime.now()
        
    cutoff_date = (latest_date - datetime.timedelta(days=days)).strftime('%Y-%m-%d')
    
    # 1. High-level KPIs
    total_bots = get_df("SELECT COUNT(*) as c FROM bots WHERE status != 'Inactive'")['c'][0]
    runs_df = get_df(f"SELECT COUNT(*) as c, SUM(CASE WHEN run_status='Completed' THEN 1 ELSE 0 END) as s FROM bot_runs WHERE report_date >= '{cutoff_date}'")
    total_runs = runs_df['c'][0] or 0
    successful_runs = runs_df['s'][0] or 0
    success_rate = f"{(successful_runs / total_runs * 100):.1f}%" if total_runs > 0 else "0%"
    hours_df = get_df(f"SELECT SUM(b.per_day_saving_hours) as h FROM bot_runs r JOIN bots b ON r.bot_id = b.id WHERE r.run_status='Completed' AND r.report_date >= '{cutoff_date}'")
    total_hours_saved = round(hours_df['h'][0] or 0)
    
    # 2. Dept Data
    dept_df = get_df(f"""
        SELECT d.name as department, 
               COUNT(r.id) as runs, 
               SUM(CASE WHEN r.run_status='Completed' THEN 1 ELSE 0 END) as successful_runs,
               SUM(CASE WHEN r.run_status='Completed' THEN b.per_day_saving_hours ELSE 0 END) as hours
        FROM bot_runs r JOIN bots b ON r.bot_id = b.id JOIN departments d ON b.department_id = d.id 
        WHERE r.report_date >= '{cutoff_date}' GROUP BY d.name ORDER BY hours DESC LIMIT 6
    """)
    
    # 3. Newly Deployed Bots
    new_bots_df = get_df(f"SELECT bot_name, use_case_name, created_at FROM bots WHERE created_at >= '{cutoff_date}' LIMIT 5")
    
    # 4. Top Bots
    top_bots_df = get_df(f"""
        SELECT b.bot_name, SUM(b.per_day_saving_hours) as hours
        FROM bot_runs r JOIN bots b ON r.bot_id = b.id
        WHERE r.run_status='Completed' AND r.report_date >= '{cutoff_date}'
        GROUP BY b.bot_name ORDER BY hours DESC LIMIT 5
    """)
    
    # 5. Trend
    trend_df = get_df(f"""
        SELECT report_date, COUNT(*) as runs
        FROM bot_runs WHERE report_date >= '{cutoff_date}'
        GROUP BY report_date ORDER BY report_date
    """)

    prs = Presentation(TEMPLATE_PATH)
            
    # Slide 1: Title
    s1 = prs.slides[0]
    month_str = datetime.datetime.now().strftime("%B %Y")
    report_title = f"{month_str} – Automation Performance Review ({'Weekly' if days <= 7 else 'Monthly'})"
    for shape in s1.shapes:
        if shape.has_text_frame:
            text = shape.text.lower()
            if "february 2023" in text or "roadshow" in text:
                shape.text = report_title
            elif "adani portfolio" in text:
                shape.text = "Cobot Dashboard"

    # Slide 2: Executive Summary & Table
    s2 = prs.slides[1]
    
    # 1. Update text and REMOVE the old table
    old_table_shape = None
    for shape in s2.shapes:
        if shape.has_text_frame:
            text = shape.text.lower()
            if "adani portfolio: strong financial" in text:
                shape.text = "Executive Summary & Department Performance"
            elif "ebitda" in text and "y-o-y" in text:
                shape.text = (
                    f"• The automation portfolio registered strong, consistent execution with significant hours saved.\n"
                    f"• Infrastructure Bots achieved an impressive {success_rate} Success Rate over {total_runs:,} total executions.\n"
                    f"• Total Active Bots: {total_bots:,}\n"
                    f"• Total Hours Saved: {total_hours_saved:,}"
                )
            elif "holcim" in text or "edible oil" in text:
                shape.text = ""
        elif shape.has_table:
            old_table_shape = shape
            
    if old_table_shape:
        sp = old_table_shape._element
        sp.getparent().remove(sp)
        
    # 2. Add New Dynamic Table
    rows = len(dept_df) + 1
    cols = 4
    x, y, cx, cy = Inches(0.5), Inches(3.2), Inches(11.3), Inches(0.5 * rows)
    table_shape = s2.shapes.add_table(rows, cols, x, y, cx, cy)
    table = table_shape.table
    
    # Header Row Styling
    headers = ["Department", "Total Runs", "Success Rate", "Hours Saved"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = RGBColor(11, 78, 122) # Adani Blue
        for p in cell.text_frame.paragraphs:
            p.font.color.rgb = RGBColor(255, 255, 255)
            p.font.bold = True
            p.font.size = Pt(14)
            if i > 0: p.alignment = PP_ALIGN.CENTER
            
    # Data Rows Styling
    for r_idx in range(1, len(table.rows)):
        d = dept_df.iloc[r_idx - 1]
        sr = f"{(d['successful_runs'] / d['runs'] * 100):.0f}%" if d['runs'] > 0 else "0%"
        
        bg_color = RGBColor(245, 247, 250) if r_idx % 2 == 0 else RGBColor(255, 255, 255)
        
        data = [str(d['department']), f"{d['runs']:,}", sr, f"{round(d['hours']):,}"]
        
        for c_idx, val in enumerate(data):
            cell = table.cell(r_idx, c_idx)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = bg_color
            for p in cell.text_frame.paragraphs:
                p.font.size = Pt(14)
                p.font.color.rgb = RGBColor(40, 40, 40)
                if c_idx > 0: p.alignment = PP_ALIGN.CENTER

    layout = prs.slide_layouts[1] # Title and Content
    
    def format_title(slide, title):
        if slide.shapes.title:
            slide.shapes.title.text = title
            
    # Slide 3: Trend Chart
    s_trend = prs.slides.add_slide(layout)
    format_title(s_trend, "Execution Volume Trend")
    if not trend_df.empty:
        chart_data = CategoryChartData()
        chart_data.categories = trend_df['report_date'].tolist()
        chart_data.add_series('Runs', trend_df['runs'].tolist())
        s_trend.shapes.add_chart(XL_CHART_TYPE.LINE, Inches(1), Inches(2.0), Inches(11.3), Inches(4.5), chart_data)
        
    # Slide 4: Top Bots
    s_top = prs.slides.add_slide(layout)
    format_title(s_top, "Top Performing Bots (Hours Saved)")
    if not top_bots_df.empty:
        chart_data = CategoryChartData()
        chart_data.categories = top_bots_df['bot_name'].tolist()
        chart_data.add_series('Hours Saved', top_bots_df['hours'].tolist())
        s_top.shapes.add_chart(XL_CHART_TYPE.BAR_CLUSTERED, Inches(1), Inches(2.0), Inches(11.3), Inches(4.5), chart_data)

    # Slide 5: Newly Deployed Bots
    s_new = prs.slides.add_slide(layout)
    format_title(s_new, "Newly Deployed Bots")
    if not new_bots_df.empty:
        rows = len(new_bots_df) + 1
        table_shape = s_new.shapes.add_table(rows, 3, Inches(0.5), Inches(2.5), Inches(11.3), Inches(0.5 * rows))
        table = table_shape.table
        
        # Header Row
        headers = ["Bot Name", "Use Case", "Date Created"]
        for i, h in enumerate(headers):
            cell = table.cell(0, i)
            cell.text = h
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(11, 78, 122) # Adani Blue
            for p in cell.text_frame.paragraphs:
                p.font.color.rgb = RGBColor(255, 255, 255)
                p.font.bold = True
                p.font.size = Pt(14)
                if i > 0: p.alignment = PP_ALIGN.CENTER
                
        # Data Rows
        for i, row in new_bots_df.iterrows():
            bg_color = RGBColor(245, 247, 250) if (i+1) % 2 == 0 else RGBColor(255, 255, 255)
            data = [str(row['bot_name']), str(row['use_case_name']), str(row['created_at'])[:10]]
            
            for c_idx, val in enumerate(data):
                cell = table.cell(i+1, c_idx)
                cell.text = val
                cell.fill.solid()
                cell.fill.fore_color.rgb = bg_color
                for p in cell.text_frame.paragraphs:
                    p.font.size = Pt(14)
                    p.font.color.rgb = RGBColor(40, 40, 40)
                    if c_idx > 0: p.alignment = PP_ALIGN.CENTER
    else:
        # Fallback text
        txBox = s_new.shapes.add_textbox(Inches(2), Inches(3.5), Inches(9.3), Inches(1))
        p = txBox.text_frame.add_paragraph()
        p.text = "No new bots were deployed during this reporting period."
        p.font.size = Pt(20)
        p.font.color.rgb = RGBColor(100, 100, 100)
        p.font.italic = True
        p.alignment = PP_ALIGN.CENTER
            
    # Monthly Additions
    if days > 7:
        # Slide 6: ROI & FTE Impact (Pie Chart)
        s_roi = prs.slides.add_slide(layout)
        format_title(s_roi, "ROI & FTE Impact")
        
        # Left Side: Pie Chart
        valid_depts = dept_df[dept_df['hours'] > 0]
        if not valid_depts.empty:
            chart_data = CategoryChartData()
            chart_data.categories = valid_depts['department'].tolist()
            chart_data.add_series('Hours Saved', valid_depts['hours'].tolist())
            s_roi.shapes.add_chart(XL_CHART_TYPE.PIE, Inches(0.5), Inches(2.0), Inches(5.5), Inches(4.5), chart_data)
            
        # Right Side: FTE Metrics
        txBox = s_roi.shapes.add_textbox(Inches(6.5), Inches(2.8), Inches(5.0), Inches(3))
        tf = txBox.text_frame
        
        p1 = tf.add_paragraph()
        p1.text = "Value Delivered"
        p1.font.size = Pt(28)
        p1.font.bold = True
        p1.font.color.rgb = RGBColor(11, 78, 122) # Adani Blue
        
        p2 = tf.add_paragraph()
        p2.text = f"\nTotal Hours Saved:\n{total_hours_saved:,} Hours"
        p2.font.size = Pt(20)
        p2.font.color.rgb = RGBColor(60, 60, 60)
        
        # 1 FTE = 160 hours / month
        ftes_saved = total_hours_saved / 160
        p3 = tf.add_paragraph()
        p3.text = f"\nFull-Time Equivalents (FTEs) Saved:\n{ftes_saved:.1f} FTEs"
        p3.font.size = Pt(24)
        p3.font.bold = True
        p3.font.color.rgb = RGBColor(56, 180, 74) # Adani Green
        
        # Slide 7: Attention Required (Exceptions Table)
        fail_df = get_df(f"""
            SELECT b.bot_name, d.name as dept, COUNT(*) as failed_runs
            FROM bot_runs r JOIN bots b ON r.bot_id = b.id JOIN departments d ON b.department_id = d.id
            WHERE r.run_status != 'Completed' AND r.report_date >= '{cutoff_date}'
            GROUP BY b.bot_name ORDER BY failed_runs DESC LIMIT 5
        """)
        s_fail = prs.slides.add_slide(layout)
        format_title(s_fail, "Attention Required: Top Exceptions")
        
        if not fail_df.empty:
            rows = len(fail_df) + 1
            table_shape = s_fail.shapes.add_table(rows, 3, Inches(0.5), Inches(2.5), Inches(11.3), Inches(0.5 * rows))
            table = table_shape.table
            
            headers = ["Bot Name", "Department", "Failed Runs"]
            for i, h in enumerate(headers):
                cell = table.cell(0, i)
                cell.text = h
                cell.fill.solid()
                cell.fill.fore_color.rgb = RGBColor(11, 78, 122)
                for p in cell.text_frame.paragraphs:
                    p.font.color.rgb = RGBColor(255, 255, 255)
                    p.font.bold = True
                    p.font.size = Pt(14)
                    if i > 0: p.alignment = PP_ALIGN.CENTER
                    
            for i, row in fail_df.iterrows():
                bg_color = RGBColor(245, 247, 250) if (i+1) % 2 == 0 else RGBColor(255, 255, 255)
                data = [str(row['bot_name']), str(row['dept']), str(row['failed_runs'])]
                
                for c_idx, val in enumerate(data):
                    cell = table.cell(i+1, c_idx)
                    cell.text = val
                    cell.fill.solid()
                    cell.fill.fore_color.rgb = bg_color
                    for p in cell.text_frame.paragraphs:
                        p.font.size = Pt(14)
                        p.font.color.rgb = RGBColor(40, 40, 40)
                        if c_idx > 0: p.alignment = PP_ALIGN.CENTER

    # Cleanup body placeholder from layout slides
    for s in list(prs.slides)[2:]:
        for shape in s.shapes:
            if shape.is_placeholder and shape.placeholder_format.type == 2: # BODY
                sp = shape._sp
                sp.getparent().remove(sp)

    if not os.path.exists(os.path.dirname(OUT_PATH)):
        os.makedirs(os.path.dirname(OUT_PATH))
        
    prs.save(OUT_PATH)
    print(f"Successfully generated Executive PPT at: {OUT_PATH}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Executive PPT")
    parser.add_argument("--days", type=int, default=7, help="Generate PPT for the last N days")
    args = parser.parse_args()
    
    generate_deck(days=args.days)
