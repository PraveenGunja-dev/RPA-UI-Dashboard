import sqlite3
import os
import datetime
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'rpa_console.db')
LOGO_PATH = os.path.join(os.path.dirname(BASE_DIR), 'frontend', 'public', 'cb-logo.png')
OUT_PATH = os.path.join(BASE_DIR, 'uploads', 'Adani_Portfolio_RPA_Report.pptx')

# Connect to DB
def query_db(query):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def generate_deck():
    print("Fetching RPA metrics from database...")
    
    # 1. KPIs
    total_bots_res = query_db("SELECT COUNT(*) as count FROM bots WHERE status != 'Inactive'")
    total_bots = total_bots_res[0]['count']
    
    runs_res = query_db("SELECT COUNT(*) as count, SUM(CASE WHEN run_status='Completed' THEN 1 ELSE 0 END) as successful FROM bot_runs")
    total_runs = runs_res[0]['count']
    successful_runs = runs_res[0]['successful'] or 0
    success_rate = f"{(successful_runs / total_runs * 100):.1f}%" if total_runs > 0 else "0%"
    
    hours_res = query_db("SELECT SUM(b.per_day_saving_hours) as hours FROM bot_runs r JOIN bots b ON r.bot_id = b.id WHERE r.run_status='Completed'")
    total_hours_saved = round(hours_res[0]['hours'] or 0)
    
    # 2. Dept Breakdown
    dept_res = query_db("""
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
    """)
    
    # Init PPTX
    prs = Presentation()
    # Widescreen 16:9
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    
    ADANI_BLUE = RGBColor(11, 78, 122) # 0B4E7A
    ADANI_LIGHT_BLUE = RGBColor(17, 118, 188)
    ADANI_GREEN = RGBColor(56, 180, 74)
    ADANI_RED = RGBColor(212, 56, 13)
    MUTED_TEXT = RGBColor(92, 101, 112)
    WHITE = RGBColor(255, 255, 255)
    
    blank_slide_layout = prs.slide_layouts[6]
    
    def add_header(slide, title_text):
        txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.4), Inches(10), Inches(0.6))
        tf = txBox.text_frame
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.bold = True
        p.font.size = Pt(24)
        p.font.color.rgb = ADANI_BLUE
        
        # Line
        line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.5), Inches(1.0), Inches(12.3), Inches(0.05))
        line.fill.solid()
        line.fill.fore_color.rgb = ADANI_BLUE
        line.line.color.rgb = ADANI_BLUE
        
        # Logo
        if os.path.exists(LOGO_PATH):
            slide.shapes.add_picture(LOGO_PATH, Inches(11.5), Inches(0.2), height=Inches(0.6))

    def add_footer(slide, page_num):
        txBox = slide.shapes.add_textbox(Inches(0.5), Inches(7.0), Inches(4), Inches(0.3))
        p = txBox.text_frame.paragraphs[0]
        p.text = "STRICTLY CONFIDENTIAL"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = ADANI_RED
        
        txBox2 = slide.shapes.add_textbox(Inches(12.0), Inches(7.0), Inches(0.8), Inches(0.3))
        p2 = txBox2.text_frame.paragraphs[0]
        p2.text = str(page_num)
        p2.font.size = Pt(10)
        p2.font.color.rgb = MUTED_TEXT
        p2.alignment = PP_ALIGN.RIGHT

    # SLIDE 1: Title
    print("Generating Slide 1...")
    s1 = prs.slides.add_slide(blank_slide_layout)
    
    header_band = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.33), Inches(1.2))
    header_band.fill.solid()
    header_band.fill.fore_color.rgb = ADANI_BLUE
    header_band.line.color.rgb = ADANI_BLUE
    
    if os.path.exists(LOGO_PATH):
        s1.shapes.add_picture(LOGO_PATH, Inches(0.5), Inches(0.25), height=Inches(0.7))
        
    txBox = s1.shapes.add_textbox(Inches(5.0), Inches(2.5), Inches(7.8), Inches(0.6))
    p = txBox.text_frame.paragraphs[0]
    p.text = "Adani Portfolio"
    p.font.size = Pt(32)
    p.font.bold = True
    p.alignment = PP_ALIGN.RIGHT
    
    line = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.0), Inches(3.2), Inches(5.8), Inches(0.08))
    line.fill.solid()
    line.fill.fore_color.rgb = ADANI_GREEN
    line.line.color.rgb = ADANI_GREEN
    
    month_str = datetime.datetime.now().strftime("%B %Y")
    txBox2 = s1.shapes.add_textbox(Inches(5.0), Inches(3.4), Inches(7.8), Inches(0.5))
    p2 = txBox2.text_frame.paragraphs[0]
    p2.text = f"{month_str} – Automation Performance Review"
    p2.font.size = Pt(20)
    p2.alignment = PP_ALIGN.RIGHT

    # SLIDE 2: KPIs
    print("Generating Slide 2...")
    s2 = prs.slides.add_slide(blank_slide_layout)
    add_header(s2, "Adani Portfolio Results Overview & Salient Features")
    
    txBox = s2.shapes.add_textbox(Inches(0.5), Inches(1.2), Inches(12), Inches(1.0))
    tf = txBox.text_frame
    p1 = tf.add_paragraph()
    p1.text = "• Automation listed portfolio registered strong growth in execution and hours saved."
    p1.font.size = Pt(16)
    
    p2 = tf.add_paragraph()
    p2.text = f"• Core Infrastructure Bots achieved an impressive {success_rate} Success Rate over {total_runs:,} runs."
    p2.font.size = Pt(16)

    kpis = [
        {"title": "Total Active Bots", "val": f"{total_bots:,}", "color": ADANI_BLUE},
        {"title": "Total Executions", "val": f"{total_runs:,}", "color": ADANI_LIGHT_BLUE},
        {"title": "Total Hours Saved", "val": f"{total_hours_saved:,}", "color": ADANI_GREEN}
    ]
    
    for i, k in enumerate(kpis):
        x_pos = 1.0 + (i * 4.0)
        box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(x_pos), Inches(2.5), Inches(3.5), Inches(1.8))
        box.fill.solid()
        box.fill.fore_color.rgb = RGBColor(244, 247, 249)
        box.line.color.rgb = RGBColor(200, 200, 200)
        
        # Color bar
        bar = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x_pos), Inches(2.5), Inches(0.1), Inches(1.8))
        bar.fill.solid()
        bar.fill.fore_color.rgb = k["color"]
        bar.line.color.rgb = k["color"]
        
        tb = s2.shapes.add_textbox(Inches(x_pos + 0.2), Inches(2.8), Inches(3.1), Inches(0.8))
        p = tb.text_frame.paragraphs[0]
        p.text = k["val"]
        p.font.size = Pt(44)
        p.font.bold = True
        p.font.color.rgb = k["color"]
        p.alignment = PP_ALIGN.CENTER
        
        tb2 = s2.shapes.add_textbox(Inches(x_pos + 0.2), Inches(3.7), Inches(3.1), Inches(0.4))
        p2 = tb2.text_frame.paragraphs[0]
        p2.text = k["title"]
        p2.font.size = Pt(14)
        p2.font.color.rgb = MUTED_TEXT
        p2.alignment = PP_ALIGN.CENTER

    add_footer(s2, 2)

    # SLIDE 3: Table
    print("Generating Slide 3...")
    s3 = prs.slides.add_slide(blank_slide_layout)
    add_header(s3, "Adani Portfolio: Strong Financial Performance delivered across portfolio")
    
    rows = len(dept_res) + 1
    cols = 4
    table_shape = s3.shapes.add_table(rows, cols, Inches(0.5), Inches(2.0), Inches(12.3), Inches(0.5 * rows))
    table = table_shape.table
    
    headers = ["Department", "Total Runs", "Success Rate", "Hours Saved"]
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = ADANI_BLUE
        for p in cell.text_frame.paragraphs:
            p.font.color.rgb = WHITE
            p.font.bold = True
            
    for r_idx, d in enumerate(dept_res):
        row = r_idx + 1
        sr = f"{(d['successful_runs'] / d['runs'] * 100):.0f}%" if d['runs'] > 0 else "0%"
        table.cell(row, 0).text = str(d['department'])
        table.cell(row, 1).text = f"{d['runs']:,}"
        table.cell(row, 2).text = sr
        table.cell(row, 3).text = f"{round(d['hours']):,}"

    add_footer(s3, 3)

    # Save
    if not os.path.exists(os.path.dirname(OUT_PATH)):
        os.makedirs(os.path.dirname(OUT_PATH))
        
    prs.save(OUT_PATH)
    print(f"Successfully generated Executive PPT at: {OUT_PATH}")

if __name__ == "__main__":
    generate_deck()
