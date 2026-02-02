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
    team = Column(String(200))  # Team responsible for the bot
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
