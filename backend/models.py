from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    
    bots = relationship("Bot", back_populates="department")


class SPOC(Base):
    __tablename__ = "spocs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200))
    phone = Column(String(50))
    
    bots = relationship("Bot", back_populates="spoc")


class Bot(Base):
    __tablename__ = "bots"
    
    id = Column(Integer, primary_key=True, index=True)
    sr_no = Column(Integer)
    use_case_name = Column(String(200), unique=True, nullable=False)
    bot_name = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"))
    spoc_id = Column(Integer, ForeignKey("spocs.id"))
    status = Column(String(50))  # Deployed, Hold, In Active, etc.
    developer = Column(String(200))
    hours_saved_monthly = Column(Float, default=0)
    deployed_date = Column(String(50))
    schedule = Column(String(200))
    description = Column(Text)
    bu_name = Column(String(100))
    pdd_location = Column(String(500))  # PDD document URL/path
    pdd_link = Column(String(1000))  # Clickable PDD link from Link column
    team = Column(String(200))  # Team responsible for the bot
    use_case_no = Column(String(50))  # Use Case No (e.g., AUC001)
    schedule_time = Column(String(200))  # Schedule Time IN Runner Machine
    created_at = Column(String(50))
    
    # New fields
    start_date = Column(String(50))
    end_date = Column(String(50))
    comments = Column(Text)
    machine_ip = Column(String(200))
    execution_time = Column(String(100))
    bot_running_status = Column(String(100))
    last_run_status = Column(String(100))
    key_benefits = Column(Text)
    
    # New columns for calculation logic
    frequency = Column(String(100))  # Daily, Monthly, On Demand, etc.
    schedule_details = Column(String(200))  # Detailed schedule info
    per_day_saving_hours = Column(Float, default=0)  # Per Day Saving hours from Excel
    
    department = relationship("Department", back_populates="bots")
    spoc = relationship("SPOC", back_populates="bots")
    runs = relationship("BotRun", back_populates="bot")


class BotRun(Base):
    __tablename__ = "bot_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"))
    run_status = Column(String(50))  # Completed, Failed, Running
    started_on = Column(String(100))
    ended_on = Column(String(100))
    device_name = Column(String(200))
    report_date = Column(String(50))
    automation_type = Column(String(50))
    
    bot = relationship("Bot", back_populates="runs")


class VisitCount(Base):
    __tablename__ = "visit_counts"
    
    id = Column(Integer, primary_key=True, index=True)
    count = Column(Integer, default=0)


class FileLog(Base):
    __tablename__ = "file_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255))
    upload_date = Column(String(50)) # When it was processed (IST)
    file_date = Column(String(50))   # The date extracted from file/content
    processed_count = Column(Integer, default=0) # Total rows processed
    unique_bots_count = Column(Integer, default=0) # Unique bots found
    hours_saved_estimate = Column(Float, default=0.0)
    file_path = Column(String(500)) # Path to archived file relative to backend
    status = Column(String(50)) # Success, Partial_Success, Failed
    error_message = Column(Text)


class RegisteredUser(Base):
    __tablename__ = "registered_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    role = Column(String(50), default="User") # Admin, User
    is_active = Column(Integer, default=1) # 1 for True, 0 for False
    created_at = Column(DateTime)

class AuditLog(Base):
    __tablename__ = "audit_log"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(100)) # e.g., "Bot", "User"
    entity_id = Column(String(100))
    action_type = Column(String(50)) # e.g., "CREATE", "UPDATE", "DELETE"
    old_value = Column(Text, nullable=True) # JSON representation of previous state
    new_value = Column(Text, nullable=True) # JSON representation of new state
    changed_by = Column(String(255))
    timestamp = Column(String(50))
