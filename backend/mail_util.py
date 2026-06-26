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

def send_admin_notification(new_user_email, new_user_name):
    """
    Sends an email notification to admins when a new user signs in for the first time.
    """
    if not ADMIN_EMAILS or not ADMIN_EMAILS[0]:
        print("MAIL ERROR: No admin emails configured.")
        return False

    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = ", ".join(ADMIN_EMAILS)
    msg['Subject'] = f"🔔 New User Alert: {new_user_name} has joined Co-Bot Console"

    # Professional HTML Body
    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
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
