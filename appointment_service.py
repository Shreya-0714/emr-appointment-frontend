"""
Appointment Service - Backend Logic for EMR Appointment Management
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

# Mock database
APPOINTMENTS_DB = [
    {"id": "apt-001", "patientName": "John Smith", "date": "2024-12-29", "time": "09:00", "duration": 30, "doctorName": "Dr. Sarah Johnson", "status": "Confirmed", "mode": "In-person"},
    {"id": "apt-002", "patientName": "Emma Davis", "date": "2024-12-29", "time": "10:00", "duration": 45, "doctorName": "Dr. Michael Chen", "status": "Scheduled", "mode": "Video"}
]

def get_appointments(filters: Optional[Dict] = None) -> List[Dict]:
    if filters is None: filters = {}
    result = APPOINTMENTS_DB.copy()
    if "date" in filters and filters["date"]:
        result = [apt for apt in result if apt["date"] == filters["date"]]
    return result

def create_appointment(payload: Dict) -> Dict:
    new_id = f"apt-{str(uuid.uuid4())[:8]}"
    new_appointment = {**payload, "id": new_id, "status": payload.get("status", "Scheduled")}
    APPOINTMENTS_DB.append(new_appointment)
    return new_appointment

def update_appointment_status(appointment_id: str, new_status: str) -> Dict:
    for apt in APPOINTMENTS_DB:
        if apt["id"] == appointment_id:
            apt["status"] = new_status
            return apt
    raise ValueError("Appointment not found")

def delete_appointment(appointment_id: str) -> bool:
    for i, apt in enumerate(APPOINTMENTS_DB):
        if apt["id"] == appointment_id:
            APPOINTMENTS_DB.pop(i)
            return True
    return False
