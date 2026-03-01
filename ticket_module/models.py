from sqlalchemy import Column, Integer, String, DateTime, Text
from database import Base
import datetime

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String(100), index=True) # Could be a User ID in the future
    description = Column(Text)  # The issue text (or transcribed voice)
    status = Column(String(50), default="Open")  # Open, In Progress, Resolved
    priority = Column(String(50), default="Normal") # Low, Normal, High
    created_at = Column(DateTime, default=datetime.datetime.utcnow)