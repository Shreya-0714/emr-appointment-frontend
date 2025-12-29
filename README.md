# 🏥 EMR Appointment Management System

A modern web-based **Electronic Medical Records (EMR) Appointment Management System** for healthcare providers, featuring appointment booking, scheduling, and queue management.

---

## 🚀 Features

- **Appointment Scheduling**: Create, view, and manage appointments
- **Calendar View**: Interactive calendar with date-based filtering
- **Status Management**: Confirm, cancel, or complete appointments
- **Real-time Filtering**: Filter by date, status, and time period
- **Conflict Detection**: Prevents double-booking of doctors
- **Responsive UI**: Works seamlessly on desktop and mobile devices

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Hooks (useState, useEffect)
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

**Backend Simulation:**
- Python 3.x service layer
- Mock data simulating Aurora PostgreSQL
- GraphQL-style query/mutation structure

---

## 📂 Project Structure

```
emr-appointment-system/
├── src/
│   ├── App.jsx                          # Root component
│   ├── EMR_Frontend_Assignment.jsx      # Main appointment view
│   ├── main.jsx                         # React entry point
│   └── index.css                        # Global styles
├── appointment_service.py               # Backend service logic
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.x (for backend service reference)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Shreya-0714/emr-appointment-frontend.git
cd emr-appointment-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Access the application**
```
http://localhost:5173
```

---

## 🔌 API Contract & GraphQL Structure

### GraphQL Query Structure

In a production environment, the frontend would communicate with AWS AppSync using GraphQL queries. Here's the designed structure:

#### Query: Get Appointments
```graphql
query GetAppointments(
  $date: String
  $status: String
  $doctorName: String
) {
  listAppointments(
    filter: {
      date: { eq: $date }
      status: { eq: $status }
      doctorName: { contains: $doctorName }
    }
  ) {
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
```

#### Mutation: Create Appointment
```graphql
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
```

#### Mutation: Update Appointment Status
```graphql
mutation UpdateAppointmentStatus($id: ID!, $status: String!) {
  updateAppointment(input: { id: $id, status: $status }) {
    id
    status
    patientName
    date
    time
  }
}
```

#### Mutation: Delete Appointment
```graphql
mutation DeleteAppointment($id: ID!) {
  deleteAppointment(input: { id: $id }) {
    id
  }
}
```

#### Subscription: Real-time Updates
```graphql
subscription OnAppointmentUpdated($id: ID!) {
  onUpdateAppointment(filter: { id: { eq: $id } }) {
    id
    status
    patientName
    date
    time
  }
}
```

---

## 🔒 Data Consistency Strategy

The backend service ensures data consistency through multiple layers:

### 1. **ACID Transactions (Aurora PostgreSQL)**
All mutations are wrapped in database transactions:
```python
BEGIN;
INSERT INTO appointments (...) VALUES (...);
COMMIT;  # Automatic rollback on failure
```

### 2. **Unique Constraints**
Database-level constraints prevent invalid data:
- Primary key on `appointment.id` (UUID)
- Unique index on `(doctor_id, date, start_time)` prevents double-booking
- Check constraints on status values and positive duration

### 3. **Idempotency Keys**
Prevents duplicate operations on network retries:
```python
# Client generates UUID for each mutation
idempotency_key = str(uuid.uuid4())

# Backend checks before executing
if idempotency_keys.exists(key):
    return cached_response  # Return previous result
else:
    execute_mutation()
    cache_response(key, result)
```

### 4. **Optimistic Locking**
Prevents lost updates from concurrent modifications:
```python
UPDATE appointments 
SET status = $1, version = version + 1 
WHERE id = $2 AND version = $3  # Only updates if version matches
```

### 5. **Time Conflict Detection**
Before creating appointments:
```python
def check_time_conflict(doctor, date, time, duration):
    existing = get_appointments(doctor=doctor, date=date)
    for apt in existing:
        if times_overlap(apt.time, apt.duration, time, duration):
            raise ConflictError("Doctor already booked")
```

### 6. **AppSync Conflict Resolution**
- **Conflict Detection**: Based on `updated_at` timestamp
- **Resolution Strategy**: Automerge or reject
- **Client Notification**: Conflict returned to client for retry

### 7. **Validation Layers**
Multiple validation levels ensure data integrity:
- **Client-side**: Immediate feedback (form validation)
- **AppSync Resolvers**: Schema validation (type checking)
- **Lambda Functions**: Business logic validation
- **Database**: Constraint enforcement

### 8. **Audit Trail**
Immutable audit log for compliance:
```python
audit_log.insert({
    'action': 'UPDATE_STATUS',
    'appointment_id': id,
    'old_value': 'Scheduled',
    'new_value': 'Confirmed',
    'user_id': current_user,
    'timestamp': now()
})
```

---

## 🎯 Key Implementation Details

### Calendar Filtering
- Clicking a date triggers `fetchAppointments({ date: selectedDate })`
- Instantly updates the appointment list
- Shows active state on selected date

### Tab Filtering
- **All**: Shows all appointments
- **Today**: Filters appointments where `date === today`
- **Upcoming**: Shows future appointments with active statuses
- **Past**: Shows completed or past-date appointments

### Status Management
- Click "Confirm" → Updates status to "Confirmed"
- Click "Cancel" → Updates status to "Cancelled"
- Click "Complete" → Updates status to "Completed"
- All updates trigger backend mutation and refresh UI

### Conflict Prevention
- Creates new appointment only through backend API
- Backend validates no overlapping times for same doctor
- Returns error if conflict detected

---

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Complete EMR appointment system"
git push origin main
```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel auto-detects Vite configuration
   - Click "Deploy"

### Environment Variables (if needed)
```env
VITE_API_BASE_URL=https://your-api-endpoint.com
```

---

## 📊 Mock Data

The system includes 12 pre-configured appointments spanning multiple dates and doctors:
- 3 doctors: Dr. Sarah Johnson, Dr. Michael Chen, Dr. Emily Brown
- Multiple appointment types: In-person, Video, Phone
- Various statuses: Confirmed, Scheduled, Upcoming, Cancelled, Completed

---

## 🎨 UI Features

- **Modern Design**: Clean, professional healthcare interface
- **Status Colors**: Visual indicators for appointment states
- **Interactive Calendar**: Click to filter by date
- **Modal Forms**: Smooth appointment creation experience
- **Responsive Layout**: Adapts to all screen sizes

---

## 🔮 Future Enhancements

- User authentication & role-based access
- Real-time notifications (SMS/Email)
- Doctor availability scheduling
- Patient medical history integration
- Analytics dashboard
- Payment processing
- Multi-language support

---

## 👩‍💻 Author

**Shreya N S**  
Bachelor of Engineering – Artificial Intelligence & Machine Learning  
Passionate about building real-world healthcare applications using modern web technologies.

🔗 **GitHub**: [Shreya-0714](https://github.com/Shreya-0714)

---

## 📜 License

This project is for educational and demonstration purposes as part of the SDE Intern Assignment.

---

## 🙏 Acknowledgments

- Assignment provided by hiring team
- Built with React, Tailwind CSS, and Vite
- Icons by Lucide React

---

**Note**: This is a frontend simulation. In production, the Python backend would be deployed as AWS Lambda functions, connected to Aurora PostgreSQL via AWS AppSync GraphQL API.