# EMR Appointment Management System

A modern, responsive Electronic Medical Records (EMR) Appointment Management System built for the SDE Intern Hiring Assignment. This project features a React frontend that simulates real-time appointment scheduling, calendar filtering, and status management, backed by a Python service layer design.

🔗 **[View Live Demo](https://emr-appointment-frontend-b86l.vercel.app)**

---

## 🚀 Features

* **Interactive Calendar:** Filter appointments by selecting specific dates.
* **Smart Filtering:** View appointments by "Today", "Upcoming", or "Past" tabs.
* **Appointment Management:** Create, Cancel, Confirm, and Complete appointments.
* **Conflict Detection:** Prevents double-booking doctors for the same time slot.
* **Responsive Design:** Built with Tailwind CSS for a seamless mobile and desktop experience.

---

## 🛠️ Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Lucide React (Icons).
* **Backend Logic:** Python 3.x (Simulating AWS Lambda & AppSync).
* **Data Layer:** In-memory mock database (Simulating Aurora PostgreSQL).

---

## ⚙️ Local Setup & Installation

Follow these steps to run the project locally on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/Shreya-0714/emr-appointment-frontend.git](https://github.com/Shreya-0714/emr-appointment-frontend.git)
cd emr-appointment-frontend
2. Install Dependencies
Bash

npm install
3. Run the Frontend
Bash

npm run dev
Open http://localhost:5173 in your browser to view the app.

4. Test the Backend Logic
The backend logic is contained in appointment_service.py. You can verify the functions work by running:

Bash

python -c "import appointment_service; print(appointment_service.get_appointments())"
📄 Technical Explanation (Assignment Requirement)
1. GraphQL Query Structure
For the get_appointments function, the design simulates a GraphQL query structure to fetch data efficiently. This structure minimizes over-fetching by using specific filters.

Simulated Query Design:

GraphQL

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
2. Data Consistency Strategy
To ensure data consistency in a production environment (using Python and PostgreSQL/Aurora), the appointment_service.py logic implies the following strategies:

ACID Transactions: All mutation operations (Create, Update, Delete) would be wrapped in database transactions (BEGIN ... COMMIT). This ensures that if any part of the operation fails, the entire transaction rolls back, preventing partial data states.

Conflict Detection: Before creating an appointment, the system proactively queries for existing appointments for the specific doctor and time slot. If an overlap is detected, the write is immediately rejected.

Idempotency: In a real-world API, create_appointment would require an idempotency key to prevent duplicate appointments if a network request is retried.

Optimistic Locking: For updates, a version number check would be used to ensure the record hasn't been modified by another process since it was fetched.

📂 Project Structure
emr-appointment-frontend/
├── src/
│   ├── EMR_Frontend_Assignment.jsx  # Main UI Component
│   ├── App.jsx                      # App Entry Point
│   └── main.jsx                     # React Root
├── appointment_service.py           # Backend Logic (Python)
├── package.json                     # Dependencies
├── tailwind.config.js               # Tailwind Configuration
└── vite.config.js                   # Vite Configuration