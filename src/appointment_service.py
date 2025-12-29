"""
Appointment Service - Backend Logic for EMR Appointment Management
This simulates a Lambda function that would interact with Aurora PostgreSQL via AppSync/GraphQL
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

# Mock database - In production, this would be Aurora PostgreSQL
APPOINTMENTS_DB = [
    {
        "id": "apt-001",
        "patientName": "John Smith",
        "date": "2024-12-29",
        "time": "09:00",
        "duration": 30,
        "doctorName": "Dr. Sarah Johnson",
        "status": "Confirmed",
        "mode": "In-person"
    },
    {
        "id": "apt-002",
        "patientName": "Emma Davis",
        "date": "2024-12-29",
        "time": "10:00",
        "duration": 45,
        "doctorName": "Dr. Michael Chen",
        "status": "Scheduled",
        "mode": "Video"
    },
    {
        "id": "apt-003",
        "patientName": "Robert Wilson",
        "date": "2024-12-29",
        "time": "11:30",
        "duration": 30,
        "doctorName": "Dr. Sarah Johnson",
        "status": "Upcoming",
        "mode": "In-person"
    },
    {
        "id": "apt-004",
        "patientName": "Maria Garcia",
        "date": "2024-12-30",
        "time": "09:30",
        "duration": 60,
        "doctorName": "Dr. Emily Brown",
        "status": "Confirmed",
        "mode": "Phone"
    },
    {
        "id": "apt-005",
        "patientName": "James Anderson",
        "date": "2024-12-30",
        "time": "14:00",
        "duration": 30,
        "doctorName": "Dr. Michael Chen",
        "status": "Scheduled",
        "mode": "Video"
    },
    {
        "id": "apt-006",
        "patientName": "Lisa Martinez",
        "date": "2024-12-28",
        "time": "10:00",
        "duration": 45,
        "doctorName": "Dr. Sarah Johnson",
        "status": "Completed",
        "mode": "In-person"
    },
    {
        "id": "apt-007",
        "patientName": "David Lee",
        "date": "2024-12-28",
        "time": "15:30",
        "duration": 30,
        "doctorName": "Dr. Emily Brown",
        "status": "Completed",
        "mode": "Video"
    },
    {
        "id": "apt-008",
        "patientName": "Sarah Taylor",
        "date": "2024-12-27",
        "time": "11:00",
        "duration": 30,
        "doctorName": "Dr. Michael Chen",
        "status": "Cancelled",
        "mode": "In-person"
    },
    {
        "id": "apt-009",
        "patientName": "Kevin White",
        "date": "2025-01-02",
        "time": "09:00",
        "duration": 45,
        "doctorName": "Dr. Sarah Johnson",
        "status": "Upcoming",
        "mode": "In-person"
    },
    {
        "id": "apt-010",
        "patientName": "Jennifer Brown",
        "date": "2025-01-02",
        "time": "13:00",
        "duration": 30,
        "doctorName": "Dr. Emily Brown",
        "status": "Scheduled",
        "mode": "Phone"
    },
    {
        "id": "apt-011",
        "patientName": "Michael Johnson",
        "date": "2024-12-29",
        "time": "14:30",
        "duration": 30,
        "doctorName": "Dr. Michael Chen",
        "status": "Confirmed",
        "mode": "Video"
    },
    {
        "id": "apt-012",
        "patientName": "Amy Zhang",
        "date": "2024-12-31",
        "time": "10:00",
        "duration": 45,
        "doctorName": "Dr. Sarah Johnson",
        "status": "Upcoming",
        "mode": "In-person"
    }
]


def get_appointments(filters: Optional[Dict] = None) -> List[Dict]:
    """
    Query function to fetch appointments with optional filtering
    
    In production:
    - This would execute a GraphQL query via AppSync
    - Query would be: 
      query GetAppointments($date: String, $status: String, $doctorName: String) {
        listAppointments(filter: {
          date: { eq: $date }
          status: { eq: $status }
          doctorName: { contains: $doctorName }
        }) {
          items {
            id
            patientName
            date
            time
            duration
            doctorName
            status
            mode
          }
        }
      }
    - AppSync would resolve this to Aurora PostgreSQL query with indexes on date, status
    
    Args:
        filters: Dictionary with optional keys: date, status, doctorName
        
    Returns:
        List of appointment dictionaries matching the filters
    """
    if filters is None:
        filters = {}
    
    result = APPOINTMENTS_DB.copy()
    
    # Filter by date if provided
    if "date" in filters and filters["date"]:
        result = [apt for apt in result if apt["date"] == filters["date"]]
    
    # Filter by status if provided
    if "status" in filters and filters["status"]:
        result = [apt for apt in result if apt["status"] == filters["status"]]
    
    # Filter by doctor name if provided
    if "doctorName" in filters and filters["doctorName"]:
        result = [apt for apt in result if filters["doctorName"].lower() in apt["doctorName"].lower()]
    
    # Sort by date and time
    result.sort(key=lambda x: (x["date"], x["time"]))
    
    return result


def create_appointment(payload: Dict) -> Dict:
    """
    Mutation function to create a new appointment
    
    In production:
    - This would trigger an AppSync mutation:
      mutation CreateAppointment($input: CreateAppointmentInput!) {
        createAppointment(input: $input) {
          id
          patientName
          date
          time
          duration
          doctorName
          status
          mode
        }
      }
    - AppSync would execute Aurora PostgreSQL INSERT within a transaction
    - Idempotency would be ensured using a client-generated idempotency key
    - After successful insert, AppSync subscription would notify:
      subscription OnAppointmentCreated {
        onCreateAppointment {
          id
          patientName
          ...
        }
      }
    
    Args:
        payload: Dictionary with required keys: patientName, date, time, 
                duration, doctorName, mode. Optional: status
    
    Returns:
        Created appointment dictionary
        
    Raises:
        ValueError: If validation fails or time conflict exists
    """
    # Validate required fields
    required_fields = ["patientName", "date", "time", "duration", "doctorName", "mode"]
    for field in required_fields:
        if field not in payload or not payload[field]:
            raise ValueError(f"Missing required field: {field}")
    
    # Validate date format
    try:
        appointment_date = datetime.strptime(payload["date"], "%Y-%m-%d")
    except ValueError:
        raise ValueError("Invalid date format. Use YYYY-MM-DD")
    
    # Validate time format
    try:
        appointment_time = datetime.strptime(payload["time"], "%H:%M")
    except ValueError:
        raise ValueError("Invalid time format. Use HH:MM")
    
    # Validate duration
    if not isinstance(payload["duration"], int) or payload["duration"] <= 0:
        raise ValueError("Duration must be a positive integer (minutes)")
    
    # Check for time conflicts with the same doctor
    conflict = check_time_conflict(
        payload["doctorName"],
        payload["date"],
        payload["time"],
        payload["duration"]
    )
    
    if conflict:
        raise ValueError(
            f"Time conflict detected. Dr. {payload['doctorName']} has an appointment "
            f"at {conflict['time']} on {conflict['date']}"
        )
    
    # Generate unique ID (in production, Aurora would auto-generate)
    new_id = f"apt-{str(uuid.uuid4())[:8]}"
    
    # Set default status if not provided
    status = payload.get("status", "Scheduled")
    
    # Create new appointment
    new_appointment = {
        "id": new_id,
        "patientName": payload["patientName"],
        "date": payload["date"],
        "time": payload["time"],
        "duration": payload["duration"],
        "doctorName": payload["doctorName"],
        "status": status,
        "mode": payload["mode"]
    }
    
    # Add to mock database
    APPOINTMENTS_DB.append(new_appointment)
    
    # In production: This would trigger AppSync subscription notification
    # subscription OnAppointmentCreated would push this to all connected clients
    
    return new_appointment


def check_time_conflict(doctor_name: str, date: str, time: str, duration: int) -> Optional[Dict]:
    """
    Helper function to detect time conflicts for a doctor
    
    Args:
        doctor_name: Doctor's name
        date: Appointment date (YYYY-MM-DD)
        time: Appointment start time (HH:MM)
        duration: Appointment duration in minutes
        
    Returns:
        Conflicting appointment if found, None otherwise
    """
    # Get all appointments for this doctor on this date
    doctor_appointments = [
        apt for apt in APPOINTMENTS_DB
        if apt["doctorName"] == doctor_name and apt["date"] == date
        and apt["status"] not in ["Cancelled", "Completed"]
    ]
    
    # Parse new appointment time
    new_start = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    new_end = new_start + timedelta(minutes=duration)
    
    # Check for overlaps
    for apt in doctor_appointments:
        existing_start = datetime.strptime(f"{apt['date']} {apt['time']}", "%Y-%m-%d %H:%M")
        existing_end = existing_start + timedelta(minutes=apt["duration"])
        
        # Check if times overlap
        if (new_start < existing_end) and (new_end > existing_start):
            return apt
    
    return None


def update_appointment_status(appointment_id: str, new_status: str) -> Dict:
    """
    Mutation function to update appointment status
    
    In production:
    - This would trigger an AppSync mutation:
      mutation UpdateAppointmentStatus($id: ID!, $status: String!) {
        updateAppointment(input: { id: $id, status: $status }) {
          id
          status
          patientName
          ...
        }
      }
    - AppSync would execute Aurora PostgreSQL UPDATE within a transaction:
      BEGIN;
      UPDATE appointments 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2 AND deleted_at IS NULL;
      COMMIT;
    - After successful update, AppSync subscription would notify all subscribers:
      subscription OnAppointmentUpdated($id: ID!) {
        onUpdateAppointment(filter: { id: { eq: $id } }) {
          id
          status
          ...
        }
      }
    - Real-time UI updates across all connected clients
    
    Args:
        appointment_id: Unique appointment identifier
        new_status: New status value (Confirmed, Scheduled, Upcoming, Cancelled, Completed)
        
    Returns:
        Updated appointment dictionary
        
    Raises:
        ValueError: If appointment not found or invalid status
    """
    valid_statuses = ["Confirmed", "Scheduled", "Upcoming", "Cancelled", "Completed"]
    
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Find appointment
    for apt in APPOINTMENTS_DB:
        if apt["id"] == appointment_id:
            apt["status"] = new_status
            # In production: Trigger AppSync subscription notification here
            return apt
    
    raise ValueError(f"Appointment with id {appointment_id} not found")


def delete_appointment(appointment_id: str) -> bool:
    """
    Delete function to remove an appointment
    
    In production:
    - This would trigger an AppSync mutation:
      mutation DeleteAppointment($id: ID!) {
        deleteAppointment(input: { id: $id }) {
          id
        }
      }
    - Soft delete in Aurora PostgreSQL:
      UPDATE appointments SET deleted_at = NOW() WHERE id = $1;
    - Or hard delete if required:
      DELETE FROM appointments WHERE id = $1;
    - Transaction ensures atomicity
    - AppSync subscription notifies deletion:
      subscription OnAppointmentDeleted {
        onDeleteAppointment {
          id
        }
      }
    
    Args:
        appointment_id: Unique appointment identifier
        
    Returns:
        True if deleted successfully, False otherwise
    """
    for i, apt in enumerate(APPOINTMENTS_DB):
        if apt["id"] == appointment_id:
            APPOINTMENTS_DB.pop(i)
            # In production: Trigger AppSync subscription for deletion
            return True
    
    return False


# Data Consistency Explanation
"""
DATA CONSISTENCY IN PRODUCTION SYSTEM:

1. ACID Transactions (Aurora PostgreSQL):
   - All mutations wrapped in database transactions
   - BEGIN; ... COMMIT; ensures atomicity
   - Rollback on any failure maintains consistency

2. Unique Constraints:
   - Primary key on appointment.id (auto-generated UUID)
   - Unique index on (doctor_id, date, start_time) to prevent double-booking
   - Check constraints on status values, positive duration

3. Idempotency:
   - Client generates idempotency_key (UUID) for mutations
   - Table: idempotency_keys (key, response, created_at)
   - Before insert: Check if key exists
   - If exists: Return cached response (prevents duplicate creates on retry)
   - If new: Execute mutation, store key + response
   - TTL: Clean up keys after 24 hours

4. Optimistic Locking:
   - Add version field to appointments table
   - UPDATE only if version matches: 
     UPDATE appointments SET status = $1, version = version + 1 
     WHERE id = $2 AND version = $3
   - Prevents lost updates from concurrent modifications

5. AppSync Conflict Resolution:
   - Configure conflict detection version on updated_at
   - On conflict: Use automerge or reject strategy
   - Client receives conflict notification to retry

6. Rate Limiting:
   - API Gateway throttling per user/IP
   - Prevents system overload and abuse

7. Validation Layers:
   - Client-side: Immediate feedback
   - AppSync resolvers: Schema validation
   - Lambda: Business logic validation
   - Database: Constraint enforcement

8. Audit Trail:
   - Immutable audit_log table
   - Tracks all mutations with user, timestamp, old/new values
   - Enables compliance and debugging
"""