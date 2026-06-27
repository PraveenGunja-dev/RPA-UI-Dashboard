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

def send_new_bot_notification(admin_emails, bot, department_name, spoc_name):
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
