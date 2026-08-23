import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.adani.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "25"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "no-reply-ai-agel@adani.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
ADMIN_EMAILS = os.getenv("ADMIN_EMAILS", "").split(",")
APP_BASE_URL = os.getenv("APP_BASE_URL", "https://aegis.adani.com/cobot")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USERNAME)

def send_admin_notification(new_user_email, new_user_name):
    """
    Sends an email notification to admins when a new user signs in for the first time.
    """
    if not ADMIN_EMAILS or not ADMIN_EMAILS[0]:
        print("MAIL ERROR: No admin emails configured.")
        return False

    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = ", ".join(ADMIN_EMAILS)
    msg['Subject'] = f"🔔 New User Alert: {new_user_name} has joined Co-Bot Console"

    # Professional HTML Body
    body = f"""
    <html>
    <body style="font-family: 'Adani', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b74b0; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">New User Access Request</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p>A new user has just signed in to the <b>AGEL Co-Bot Console</b> via SSO for the first time.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Name:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{new_user_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Email:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{new_user_email}</td>
                    </tr>
                </table>
                
                <p>By default, this user has been granted <b>"User"</b> (Read-Only) access. Please review if this user needs <b>"Admin"</b> privileges.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{APP_BASE_URL}/admin" style="background-color: #0b74b0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review User Access</a>
                </div>
            </div>
            <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                This represents an automated notification from the AGEL Co-Bot Console Platform.
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"MAIL SUCCESS: Notification sent to {ADMIN_EMAILS}")
        return True
    except Exception as e:
        print(f"MAIL ERROR: Failed to send email: {str(e)}")
        return False

def send_new_bot_notification(admin_emails, bot, department_name, spoc_name, spoc_email="N/A", spoc_phone="N/A"):
    """
    Sends an email notification to admins when a new bot is created.
    """
    if not admin_emails:
        print("MAIL ERROR: No admin emails provided for new bot notification.")
        return False

    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = ", ".join(admin_emails)
    msg['Subject'] = f"🤖 New Bot Added: {bot.bot_name} ({bot.use_case_name})"

    # Professional HTML Body
    body = f"""
    <html>
    <body style="font-family: 'Adani', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b74b0; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">New Bot Successfully Created</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p>A new RPA Bot has been added to the Co-Bot Console.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Bot Name:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.bot_name or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Use Case Name:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.use_case_name or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Department:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{department_name or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>SPOC:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{spoc_name or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>User Email ID:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{spoc_email or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Mobile Number:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{spoc_phone or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Activation Date:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.start_date or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Deactivation Date:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.deactivation_date or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Developer:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.developer or 'N/A'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Status:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.status or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Monthly Hours Saved:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.hours_saved_monthly or 0}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Description:</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.description or 'N/A'}</td>
                    </tr>
                    <tr style="background-color: #f9f9f9;">
                        <td style="padding: 10px; border: 1px solid #eee;"><b>Created At (IST):</b></td>
                        <td style="padding: 10px; border: 1px solid #eee;">{bot.created_at or 'N/A'}</td>
                    </tr>
                </table>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{APP_BASE_URL}/home" style="background-color: #0b74b0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View in Console</a>
                </div>
            </div>
            <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                This represents an automated notification from the AGEL Co-Bot Console Platform.
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"MAIL SUCCESS: New bot notification sent to {len(admin_emails)} admins")
        return True
    except Exception as e:
        print(f"MAIL ERROR: Failed to send new bot email: {str(e)}")
        return False

def send_weekly_summary_notification(admin_emails, active_count, new_count, inactive_count):
    """
    Sends a weekly summary report to admins.
    """
    if not admin_emails:
        print("MAIL ERROR: No admin emails provided for weekly summary.")
        return False

    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = ", ".join(admin_emails)
    msg['Subject'] = f"📊 Co-Bot Console: Weekly Bot Summary"

    # Professional HTML Body
    body = f"""
    <html>
    <body style="font-family: 'Adani', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #0b74b0; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Weekly Bot Execution Summary</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p>Here is the weekly status update for the RPA Bots registered in the Co-Bot Console.</p>
                
                <div style="display: flex; justify-content: space-around; margin: 30px 0; text-align: center;">
                    <div style="background-color: #e6f7ff; border: 1px solid #91d5ff; border-radius: 8px; padding: 15px; width: 30%;">
                        <h3 style="margin: 0; color: #0050b3; font-size: 24px;">{new_count}</h3>
                        <p style="margin: 5px 0 0; color: #096dd9; font-size: 14px;">New Bots Added</p>
                    </div>
                    <div style="background-color: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 15px; width: 30%;">
                        <h3 style="margin: 0; color: #389e0d; font-size: 24px;">{active_count}</h3>
                        <p style="margin: 5px 0 0; color: #52c41a; font-size: 14px;">Total Active Bots</p>
                    </div>
                    <div style="background-color: #fff1f0; border: 1px solid #ffa39e; border-radius: 8px; padding: 15px; width: 30%;">
                        <h3 style="margin: 0; color: #cf1322; font-size: 24px;">{inactive_count}</h3>
                        <p style="margin: 5px 0 0; color: #f5222d; font-size: 14px;">Total Inactive Bots</p>
                    </div>
                </div>
                
                <p style="text-align: center;">
                    {"<b>No new bots were added this week.</b>" if new_count == 0 else "<b>Great job! New bots were deployed this week.</b>"}
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{APP_BASE_URL}/home" style="background-color: #0b74b0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Complete Dashboard</a>
                </div>
            </div>
            <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                This represents an automated notification from the AGEL Co-Bot Console Platform.
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"MAIL SUCCESS: Weekly summary sent to {len(admin_emails)} admins")
        return True
    except Exception as e:
        print(f"MAIL ERROR: Failed to send weekly summary: {str(e)}")
        return False


def send_missing_data_notification(admin_emails, missing_dates, last_data_date):
    """
    Sends an email notification to admins when daily bot status report
    data is missing for 24+ hours.
    """
    if not admin_emails:
        print("MAIL ERROR: No admin emails provided for missing data notification.")
        return False

    missing_count = len(missing_dates)
    missing_dates_str = ", ".join(missing_dates)

    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = ", ".join(admin_emails)
    msg['Subject'] = f"⚠️ Co-Bot Console: Daily Report Data Missing ({missing_count} day{'s' if missing_count > 1 else ''})"

    # Build rows for missing dates table
    date_rows = ""
    for i, d in enumerate(missing_dates):
        bg = 'background-color: #fff1f0;' if i % 2 == 0 else 'background-color: #fff7e6;'
        date_rows += f"""
                    <tr style="{bg}">
                        <td style="padding: 10px; border: 1px solid #eee; text-align: center;">{d}</td>
                        <td style="padding: 10px; border: 1px solid #eee; text-align: center; color: #cf1322;">
                            <b>❌ Not Uploaded</b>
                        </td>
                    </tr>"""

    body = f"""
    <html>
    <body style="font-family: 'Adani', Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #d4380d; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">⚠️ Missing Daily Report Alert</h2>
            </div>
            <div style="padding: 20px;">
                <p>Hello Admin,</p>
                <p>The following daily bot status report(s) have <b>not been uploaded</b> to the Co-Bot Console for more than <b>24 hours</b>:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background-color: #0b74b0; color: white;">
                        <th style="padding: 10px; border: 1px solid #eee;">Date</th>
                        <th style="padding: 10px; border: 1px solid #eee;">Status</th>
                    </tr>
                    {date_rows}
                </table>
                
                <div style="background-color: #e6f7ff; border-left: 4px solid #1890ff; padding: 12px; margin: 20px 0;">
                    <b>Last Available Data:</b> {last_data_date or 'No data found'}
                </div>
                
                <p>Please upload the missing report(s) via <b>SharePoint sync</b> or <b>manual upload</b> to keep the dashboard metrics up to date.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="{APP_BASE_URL}/admin" style="background-color: #d4380d; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Upload Report Now</a>
                </div>
            </div>
            <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                This is an automated alert from the AGEL Co-Bot Console Platform.
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"MAIL SUCCESS: Missing data alert sent to {len(admin_emails)} admins for dates: {missing_dates_str}")
        return True
    except Exception as e:
        print(f"MAIL ERROR: Failed to send missing data alert: {str(e)}")
        return False


def send_performance_report_notification(admin_emails, stats, report_type, period_str, ppt_path=None):
    """
    Sends a highly visual weekly/monthly report with embedded charts and tables.
    stats = {
        'total_runs': int,
        'success_rate': str (e.g. '94.2%'),
        'hours_saved': float,
        'labels': list,
        'data': list,
        'top_bots': list of dicts {'name': str, 'runs': int, 'hours': float},
        'failing_bots': list of dicts {'name': str, 'failed_runs': int, 'success_rate': str}
    }
    """
    if not admin_emails:
        print("MAIL ERROR: No admin emails provided for performance report.")
        return False

    import urllib.parse
    import json

    # Generate QuickChart URL for the Trend Graph
    chart_config = {
        "type": "line",
        "data": {
            "labels": stats.get('labels', []),
            "datasets": [{
                "label": "Runs",
                "data": stats.get('data', []),
                "fill": True,
                "backgroundColor": "rgba(11,116,176,0.1)",
                "borderColor": "#0b74b0",
                "tension": 0.4
            }]
        },
        "options": {
            "plugins": {
                "legend": {"display": False}
            }
        }
    }
    encoded_config = urllib.parse.quote(json.dumps(chart_config))
    chart_url = f"https://quickchart.io/chart?c={encoded_config}"

    # Build Top Bots Table
    top_bots_html = ""
    for i, bot in enumerate(stats.get('top_bots', [])):
        bg = '#f9f9f9' if i % 2 != 0 else '#ffffff'
        top_bots_html += f'''
        <tr style="background-color: {bg};">
            <td style="padding: 10px; border: 1px solid #eee;">{bot['name']}</td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: center;">{bot['runs']}</td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: center;"><strong>{bot['hours']}</strong></td>
        </tr>
        '''
    if not top_bots_html:
        top_bots_html = '<tr><td colspan="3" style="padding: 10px; text-align: center;">No data available</td></tr>'

    # Build Failing Bots Table
    failing_bots_html = ""
    for i, bot in enumerate(stats.get('failing_bots', [])):
        bg = '#fff1f0' if i % 2 == 0 else '#ffffff'
        failing_bots_html += f'''
        <tr style="background-color: {bg};">
            <td style="padding: 10px; border: 1px solid #eee;">{bot['name']}</td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: center; color: #cf1322;"><strong>{bot['failed_runs']}</strong></td>
            <td style="padding: 10px; border: 1px solid #eee; text-align: center;">{bot['success_rate']}</td>
        </tr>
        '''
    if not failing_bots_html:
        failing_bots_html = '<tr><td colspan="3" style="padding: 10px; text-align: center;">No critical failures</td></tr>'

    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM
    msg['To'] = ", ".join(admin_emails)
    msg['Subject'] = f"📊 Adani RPA - {report_type} Performance Report"

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
    <div style="max-width: 650px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background: #fff;">
      <!-- Header -->
      <div style="background-color: #0b74b0; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📊 Adani RPA - {report_type} Performance Report</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">{period_str}</p>
      </div>
      
      <div style="padding: 20px;">
        <p>Hello Admin,</p>
        <p>Here is your comprehensive summary of the Co-Bot Console automation performance.</p>

        <!-- KPI Dashboard -->
        <table width="100%" style="margin: 20px 0; text-align: center; border-collapse: separate; border-spacing: 10px 0;">
          <tr>
            <td style="background: #f6ffed; border: 1px solid #b7eb8f; border-radius: 8px; padding: 15px; width: 33%;">
              <h3 style="margin: 0; color: #389e0d; font-size: 26px;">{stats.get('total_runs', 0):,}</h3>
              <p style="margin: 5px 0 0; color: #52c41a; font-size: 12px; font-weight: bold;">Total Runs</p>
            </td>
            <td style="background: #e6f7ff; border: 1px solid #91d5ff; border-radius: 8px; padding: 15px; width: 33%;">
              <h3 style="margin: 0; color: #0050b3; font-size: 26px;">{stats.get('success_rate', '0%')}</h3>
              <p style="margin: 5px 0 0; color: #096dd9; font-size: 12px; font-weight: bold;">Success Rate</p>
            </td>
            <td style="background: #f9f0ff; border: 1px solid #d3adf7; border-radius: 8px; padding: 15px; width: 33%;">
              <h3 style="margin: 0; color: #531dab; font-size: 26px;">{stats.get('hours_saved', 0):,}</h3>
              <p style="margin: 5px 0 0; color: #722ed1; font-size: 12px; font-weight: bold;">Hours Saved</p>
            </td>
          </tr>
        </table>

        <!-- Embedded Trend Graph -->
        <h3 style="color: #0b74b0; border-bottom: 2px solid #eee; padding-bottom: 5px;">📈 Execution Trend</h3>
        <div style="text-align: center; margin: 20px 0;">
          <img src="{chart_url}" width="100%" alt="Trend Graph" style="max-width: 100%; border: 1px solid #eee; border-radius: 8px;"/>
        </div>

        <!-- Top Performing Bots Table -->
        <h3 style="color: #0b74b0; border-bottom: 2px solid #eee; padding-bottom: 5px;">🏆 Top Performing Bots</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #0b74b0; color: white;">
            <th style="padding: 10px; border: 1px solid #eee; text-align: left;">Bot Name</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: center;">Runs</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: center;">Hours Saved</th>
          </tr>
          {top_bots_html}
        </table>

        <!-- Attention Required Table -->
        <h3 style="color: #cf1322; border-bottom: 2px solid #eee; padding-bottom: 5px; margin-top: 30px;">⚠️ Attention Required (High Failure)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <tr style="background-color: #cf1322; color: white;">
            <th style="padding: 10px; border: 1px solid #eee; text-align: left;">Bot Name</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: center;">Failed Runs</th>
            <th style="padding: 10px; border: 1px solid #eee; text-align: center;">Success Rate</th>
          </tr>
          {failing_bots_html}
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="{APP_BASE_URL}/home" style="background-color: #0b74b0; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Dashboard</a>
        </div>
      </div>
      <!-- Footer -->
      <div style="background-color: #f4f4f4; color: #777; padding: 15px; text-align: center; font-size: 12px;">
        Automated Report via AGEL Co-Bot Console Platform
      </div>
    </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(body, 'html'))
    
    if ppt_path and os.path.exists(ppt_path):
        from email.mime.application import MIMEApplication
        with open(ppt_path, "rb") as f:
            part = MIMEApplication(f.read(), Name=os.path.basename(ppt_path))
        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(ppt_path)}"'
        msg.attach(part)

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            if SMTP_PASSWORD:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"MAIL SUCCESS: {report_type} performance report sent to {len(admin_emails)} admins")
        return True
    except Exception as e:
        print(f"MAIL ERROR: Failed to send {report_type} report: {str(e)}")
        return False
