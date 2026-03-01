from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import models
import database

# 1. Create Tables in the DB (if they don't exist)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Ticket Management Service")

# --- Dependencies ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Pydantic Models (Input/Output Validation) ---
class TicketCreate(BaseModel):
    customer_name: str
    description: str
    priority: Optional[str] = "Normal"

class TicketResponse(TicketCreate):
    id: int
    status: str
    created_at: str

    class Config:
        # Allows Pydantic to read data from SQLAlchemy models
        from_attributes = True 

# --- API Endpoints ---

@app.post("/tickets/", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    """Create a new support ticket"""
    db_ticket = models.Ticket(
        customer_name=ticket.customer_name,
        description=ticket.description,
        priority=ticket.priority
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    # Convert datetime to string for JSON response
    db_ticket.created_at = str(db_ticket.created_at) 
    return db_ticket

@app.get("/tickets/", response_model=List[TicketResponse])
def read_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List all tickets"""
    tickets = db.query(models.Ticket).offset(skip).limit(limit).all()
    # Convert datetimes to strings
    for t in tickets:
        t.created_at = str(t.created_at)
    return tickets

@app.get("/tickets/{ticket_id}", response_model=TicketResponse)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    """Get details of a single ticket"""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.created_at = str(ticket.created_at)
    return ticket

@app.put("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: int, status: str, db: Session = Depends(get_db)):
    """Update status (e.g., Open -> Resolved)"""
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    ticket.status = status
    db.commit()
    return {"id": ticket_id, "new_status": ticket.status}