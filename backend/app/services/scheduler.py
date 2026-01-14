from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from app.db.session import engine
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.WARNING)

jobstores = {
    'default': SQLAlchemyJobStore(engine=engine)
}

scheduler = AsyncIOScheduler(jobstores=jobstores)

def start_scheduler():
    """Start the scheduler if it's not already running"""
    if not scheduler.running:
        scheduler.start()
        print("[Scheduler] Started AsyncIOScheduler")

async def schedule_action_execution(action_func, run_date, args=None):
    """
    Schedule a function to run at a specific date.
    
    :param action_func: The async function to execute
    :param run_date: datetime object for when to run
    :param args: list of arguments to pass to the function
    """
    scheduler.add_job(
        action_func, 
        'date', 
        run_date=run_date, 
        args=args,
        misfire_grace_time=3600  # Allow 1 hour late execution if system was down
    )
    print(f"[Scheduler] Scheduled job for {run_date}")
