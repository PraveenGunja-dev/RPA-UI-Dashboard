from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Department Schemas
class DepartmentBase(BaseModel):
    name: str

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentSummary(BaseModel):
    id: int
    name: str
    total_bots: int
    deployed_bots: int
    running_bots: int
    idle_bots: int
    failed_bots: int
    total_hours_saved: float
    man_hours_saved: int
    run_count_yesterday: int
    run_count_today: int = 0
    hours_saved_today: float = 0.0
    hours_saved_yesterday: float = 0.0
    hours_saved_month: float = 0.0
    hours_saved_till_date: float = 0.0
    last_sync_date: Optional[str] = None  # Date when FTE data was last synced
    
    class Config:
        from_attributes = True


# SPOC Schemas
class SPOCBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None

class SPOCCreate(SPOCBase):
    pass

class SPOCResponse(SPOCBase):
    id: int
    bots_count: int
    
    class Config:
        from_attributes = True

class SPOCWithBots(SPOCBase):
    id: int
    bots: List["BotBasic"]
    
    class Config:
        from_attributes = True


# Bot Schemas
class BotBase(BaseModel):
    use_case_name: str
    bot_name: str
    status: Optional[str] = None
    developer: Optional[str] = None
    hours_saved_monthly: Optional[float] = 0
    deployed_date: Optional[str] = None
    schedule: Optional[str] = None
    description: Optional[str] = None
    bu_name: Optional[str] = None
    pdd_location: Optional[str] = None
    pdd_link: Optional[str] = None
    use_case_no: Optional[str] = None
    schedule_time: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    comments: Optional[str] = None
    machine_ip: Optional[str] = None
    execution_time: Optional[str] = None
    bot_running_status: Optional[str] = None
    last_run_status: Optional[str] = None
    sr_no: Optional[int] = None
    key_benefits: Optional[str] = None

class BotCreate(BotBase):
    department_id: Optional[int] = None
    spoc_id: Optional[int] = None

class BotBasic(BaseModel):
    id: int
    use_case_name: str
    bot_name: str
    status: Optional[str]
    run_status: Optional[str] = None  # Latest run status
    
    class Config:
        from_attributes = True

class BotListItem(BaseModel):
    id: int
    use_case_name: str
    bot_name: str
    department_name: Optional[str]
    department_id: Optional[int] = None
    status: Optional[str]
    developer: Optional[str]
    hours_saved_monthly: Optional[float]
    deployed_date: Optional[str]
    spoc_name: Optional[str]
    spoc_id: Optional[int] = None
    last_run_status: Optional[str]
    last_run_time: Optional[str]
    pdd_location: Optional[str] = None
    pdd_link: Optional[str] = None
    use_case_no: Optional[str] = None
    schedule_time: Optional[str] = None
    team: Optional[str] = None
    bu_name: Optional[str] = None
    description: Optional[str] = None
    sr_no: Optional[int] = None
    hours_till_now: Optional[float] = 0.0
    man_hours_till_now: Optional[int] = 0
    hours_per_day: Optional[float] = 0.0
    hours_saved_month: Optional[float] = 0.0
    hours_saved_today: Optional[float] = 0.0
    hours_saved_latest_run: Optional[float] = 0.0
    key_benefits: Optional[str] = None
    
    class Config:
        from_attributes = True

class BotDetail(BaseModel):
    id: int
    use_case_name: str
    bot_name: str
    department_name: Optional[str]
    department_id: Optional[int]
    status: Optional[str]
    developer: Optional[str]
    hours_saved_monthly: Optional[float]
    deployed_date: Optional[str]
    schedule: Optional[str]
    description: Optional[str]
    bu_name: Optional[str]
    spoc_name: Optional[str]
    spoc_id: Optional[int]
    pdd_location: Optional[str] = None
    pdd_link: Optional[str] = None
    use_case_no: Optional[str] = None
    schedule_time: Optional[str] = None
    created_at: Optional[str]
    total_runs: int
    successful_runs: int
    failed_runs: int
    last_run_status: Optional[str]
    last_run_time: Optional[str]
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    comments: Optional[str] = None
    machine_ip: Optional[str] = None
    execution_time: Optional[str] = None
    bot_running_status: Optional[str] = None
    sr_no: Optional[int] = None
    key_benefits: Optional[str] = None
    hours_saved_today: Optional[float] = 0.0
    run_status_today: Optional[str] = "Not Run"
    total_hours_saved: Optional[float] = 0.0
    total_man_hours_saved: Optional[float] = 0.0
    value_per_run: Optional[float] = 0.0
    
    class Config:
        from_attributes = True


# Bot Run Schemas
class BotRunBase(BaseModel):
    run_status: str
    started_on: Optional[str]
    ended_on: Optional[str]
    device_name: Optional[str]

class BotRunCreate(BotRunBase):
    bot_id: int
    report_date: str
    automation_type: Optional[str]

class BotRunResponse(BotRunBase):
    id: int
    report_date: str
    
    class Config:
        from_attributes = True


# Summary Schemas
class OrgSummary(BaseModel):
    total_bots: int
    deployed_bots: int
    running_bots: int
    idle_bots: int
    failed_bots: int
    total_departments: int
    total_spocs: int
    total_hours_saved_monthly: float
    total_realized_savings: float = 0.0
    total_runs_today: int
    successful_runs_today: int
    failed_runs_today: int


class UploadResponse(BaseModel):
    success: bool
    message: str
    records_processed: int
    departments_created: int
    spocs_created: int
    bots_created: int
    errors: List[str]


# Update forward references
SPOCWithBots.model_rebuild()
