from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Dict, Any
from datetime import datetime, timedelta
from app.db.session import get_db
from app.deps import get_current_user
from app.models import User, Client, Message, Tag, ClientTag

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard")
async def get_dashboard_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated metrics for the dashboard"""
    
    # 1. Pipeline Distribution (Clients by Tag)
    # Get all tags for user to ensure we include 0 counts
    user_tags = db.query(Tag).filter(Tag.user_id == current_user.id).order_by(Tag.order).all()
    
    pipeline_data = []
    total_tagged_clients = 0
    
    for tag in user_tags:
        count = db.query(func.count(ClientTag.client_id)).filter(
            ClientTag.tag_id == tag.id
        ).scalar()
        
        pipeline_data.append({
            "tag_id": tag.id,
            "tag_name": tag.name,
            "color": tag.color,
            "count": count
        })
        total_tagged_clients += count

    # 2. Total Clients count
    total_clients = db.query(Client).filter(Client.user_id == current_user.id).count()
    
    # 3. Message Stats (Last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Sent messages
    sent_count = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.direction == "outbound",
        Message.sent_at >= thirty_days_ago
    ).count()
    
    # Received messages (Clients don't map perfectly one-to-one sometimes, but we filter by user_id if attached or client owned)
    # Since Message.user_id is the owner, inbound messages are also stored with user_id
    received_count = db.query(Message).filter(
        Message.user_id == current_user.id,
        Message.direction == "inbound",
        Message.sent_at >= thirty_days_ago
    ).count()
    
    # 4. Daily Message Activity (Last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    daily_stats = db.query(
        func.date(Message.sent_at).label('date'),
        func.sum(case((Message.direction == 'outbound', 1), else_=0)).label('sent'),
        func.sum(case((Message.direction == 'inbound', 1), else_=0)).label('received')
    ).filter(
        Message.user_id == current_user.id,
        Message.sent_at >= seven_days_ago
    ).group_by(func.date(Message.sent_at)).all()
    
    # Format daily stats to ensure all days are present
    activity_chart = []
    for i in range(7):
        day = (datetime.utcnow() - timedelta(days=6-i)).date()
        day_stat = next((s for s in daily_stats if s.date == day), None)
        activity_chart.append({
            "date": day.strftime("%Y-%m-%d"),
            "sent": day_stat.sent if day_stat else 0,
            "received": day_stat.received if day_stat else 0
        })

    # 5. Conversion Rate (Clients with "Compró" tag / Total Clients with tags)
    # Assuming 'Compró' is a standard name, or we check based on is_default and name
    won_count = 0
    won_tag = next((t for t in user_tags if t.name == "Compró" or t.name == "Won"), None)
    if won_tag:
        won_count = next((p["count"] for p in pipeline_data if p["tag_id"] == won_tag.id), 0)
    
    conversion_rate = 0
    if total_clients > 0:
        conversion_rate = (won_count / total_clients) * 100

    return {
        "pipeline": pipeline_data,
        "total_clients": total_clients,
        "messages": {
            "sent_30d": sent_count,
            "received_30d": received_count,
            "total": sent_count + received_count
        },
        "activity_chart": activity_chart,
        "conversion_rate": round(conversion_rate, 1)
    }
