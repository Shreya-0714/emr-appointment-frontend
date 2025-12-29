import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Video, Phone, MapPin, Plus, X, Check, XCircle } from 'lucide-react';

// Simulating Python backend functions (in real app, these would be API calls)
const appointmentService = {
  getAppointments: (filters = {}) => {
    let appointments = [...mockAppointments];
    
    if (filters.date) {
      appointments = appointments.filter(apt => apt.date === filters.date);
    }
    
    if (filters.status) {
      appointments = appointments.filter(apt => apt.status === filters.status);
    }
    
    if (filters.doctorName) {
      appointments = appointments.filter(apt => 
        apt.doctorName.toLowerCase().includes(filters.doctorName.toLowerCase())
      );
    }
    
    return appointments.sort((a, b) => {
      if (a.date === b.date) {
        return a.time.localeCompare(b.time);
      }
      return a.date.localeCompare(b.date);
    });
  },
  
  createAppointment: (payload) => {
    const required = ['patientName', 'date', 'time', 'duration', 'doctorName', 'mode'];
    for (let field of required) {
      if (!payload[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Check for time conflicts
    const conflicts = mockAppointments.filter(apt => 
      apt.doctorName === payload.doctorName && 
      apt.date === payload.date &&
      apt.status !== 'Cancelled' &&
      apt.status !== 'Completed'
    );
    
    for (let apt of conflicts) {
      const existingStart = new Date(`${apt.date}T${apt.time}`);
      const existingEnd = new Date(existingStart.getTime() + apt.duration * 60000);
      const newStart = new Date(`${payload.date}T${payload.time}`);
      const newEnd = new Date(newStart.getTime() + payload.duration * 60000);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        throw new Error(`Time conflict with appointment at ${apt.time}`);
      }
    }
    
    const newApt = {
      id: `apt-${Date.now()}`,
      ...payload,
      status: payload.status || 'Scheduled'
    };
    
    mockAppointments.push(newApt);
    return newApt;
  },
  
  updateAppointmentStatus: (id, newStatus) => {
    const apt = mockAppointments.find(a => a.id === id);
    if (!apt) throw new Error('Appointment not found');
    
    apt.status = newStatus;
    return apt;
  },
  
  deleteAppointment: (id) => {
    const index = mockAppointments.findIndex(a => a.id === id);
    if (index === -1) return false;
    
    mockAppointments.splice(index, 1);
    return true;
  }
};

// Mock data
let mockAppointments = [
  {
    id: "apt-001",
    patientName: "John Smith",
    date: "2024-12-29",
    time: "09:00",
    duration: 30,
    doctorName: "Dr. Sarah Johnson",
    status: "Confirmed",
    mode: "In-person"
  },
  {
    id: "apt-002",
    patientName: "Emma Davis",
    date: "2024-12-29",
    time: "10:00",
    duration: 45,
    doctorName: "Dr. Michael Chen",
    status: "Scheduled",
    mode: "Video"
  },
  {
    id: "apt-003",
    patientName: "Robert Wilson",
    date: "2024-12-29",
    time: "11:30",
    duration: 30,
    doctorName: "Dr. Sarah Johnson",
    status: "Upcoming",
    mode: "In-person"
  },
  {
    id: "apt-004",
    patientName: "Maria Garcia",
    date: "2024-12-30",
    time: "09:30",
    duration: 60,
    doctorName: "Dr. Emily Brown",
    status: "Confirmed",
    mode: "Phone"
  },
  {
    id: "apt-005",
    patientName: "James Anderson",
    date: "2024-12-30",
    time: "14:00",
    duration: 30,
    doctorName: "Dr. Michael Chen",
    status: "Scheduled",
    mode: "Video"
  },
  {
    id: "apt-006",
    patientName: "Lisa Martinez",
    date: "2024-12-28",
    time: "10:00",
    duration: 45,
    doctorName: "Dr. Sarah Johnson",
    status: "Completed",
    mode: "In-person"
  },
  {
    id: "apt-007",
    patientName: "David Lee",
    date: "2024-12-28",
    time: "15:30",
    duration: 30,
    doctorName: "Dr. Emily Brown",
    status: "Completed",
    mode: "Video"
  },
  {
    id: "apt-008",
    patientName: "Sarah Taylor",
    date: "2024-12-27",
    time: "11:00",
    duration: 30,
    doctorName: "Dr. Michael Chen",
    status: "Cancelled",
    mode: "In-person"
  },
  {
    id: "apt-009",
    patientName: "Kevin White",
    date: "2025-01-02",
    time: "09:00",
    duration: 45,
    doctorName: "Dr. Sarah Johnson",
    status: "Upcoming",
    mode: "In-person"
  },
  {
    id: "apt-010",
    patientName: "Jennifer Brown",
    date: "2025-01-02",
    time: "13:00",
    duration: 30,
    doctorName: "Dr. Emily Brown",
    status: "Scheduled",
    mode: "Phone"
  }
];

const AppointmentManagementView = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    patientName: '',
    date: '',
    time: '',
    duration: 30,
    doctorName: '',
    mode: 'In-person'
  });

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = appointmentService.getAppointments(filters);
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calendar date click handler
  const handleDateClick = (date) => {
    setSelectedDate(date);
    fetchAppointments({ date });
  };

  // Tab filtering
  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (selectedTab) {
      case 'today':
        return appointments.filter(apt => apt.date === today);
      case 'upcoming':
        return appointments.filter(apt => 
          apt.date >= today && ['Scheduled', 'Upcoming', 'Confirmed'].includes(apt.status)
        );
      case 'past':
        return appointments.filter(apt => 
          apt.date < today || apt.status === 'Completed'
        );
      default:
        return appointments;
    }
  };

  // Update appointment status
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      appointmentService.updateAppointmentStatus(id, newStatus);
      fetchAppointments(selectedDate ? { date: selectedDate } : {});
    } catch (err) {
      setError(err.message);
    }
  };

  // Create new appointment
  const handleCreateAppointment = (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const newApt = appointmentService.createAppointment({
        ...formData,
        duration: parseInt(formData.duration)
      });
      
      setShowCreateModal(false);
      setFormData({
        patientName: '',
        date: '',
        time: '',
        duration: 30,
        doctorName: '',
        mode: 'In-person'
      });
      
      fetchAppointments(selectedDate ? { date: selectedDate } : {});
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        appointmentService.deleteAppointment(id);
        fetchAppointments(selectedDate ? { date: selectedDate } : {});
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Simple calendar widget
  const CalendarWidget = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">
            {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <Calendar className="w-5 h-5 text-gray-500" />
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 pb-2">
              {day}
            </div>
          ))}
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={idx} />;
            }
            
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = day === today.getDate();
            
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(dateStr)}
                className={`
                  p-2 rounded-lg text-sm transition-colors
                  ${isSelected ? 'bg-blue-500 text-white font-semibold' : ''}
                  ${isToday && !isSelected ? 'bg-blue-100 text-blue-600 font-semibold' : ''}
                  ${!isSelected && !isToday ? 'hover:bg-gray-100 text-gray-700' : ''}
                `}
              >
                {day}
              </button>
            );
          })}
        </div>
        {selectedDate && (
          <button
            onClick={() => {
              setSelectedDate(null);
              fetchAppointments();
            }}
            className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700"
          >
            Clear date filter
          </button>
        )}
      </div>
    );
  };

  const AppointmentCard = ({ appointment }) => {
    const getModeIcon = () => {
      switch (appointment.mode) {
        case 'Video': return <Video className="w-4 h-4" />;
        case 'Phone': return <Phone className="w-4 h-4" />;
        default: return <MapPin className="w-4 h-4" />;
      }
    };

    const getStatusColor = () => {
      switch (appointment.status) {
        case 'Confirmed': return 'bg-green-100 text-green-700';
        case 'Scheduled': return 'bg-blue-100 text-blue-700';
        case 'Upcoming': return 'bg-yellow-100 text-yellow-700';
        case 'Cancelled': return 'bg-red-100 text-red-700';
        case 'Completed': return 'bg-gray-100 text-gray-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
              <User className="w-3 h-3" />
              {appointment.doctorName}
            </p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {appointment.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{appointment.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{appointment.time} ({appointment.duration} min)</span>
          </div>
          <div className="flex items-center gap-2">
            {getModeIcon()}
            <span>{appointment.mode}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t">
          {appointment.status === 'Scheduled' && (
            <button
              onClick={() => handleStatusUpdate(appointment.id, 'Confirmed')}
              className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              Confirm
            </button>
          )}
          {['Scheduled', 'Confirmed', 'Upcoming'].includes(appointment.status) && (
            <button
              onClick={() => handleStatusUpdate(appointment.id, 'Cancelled')}
              className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 flex items-center justify-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
          {appointment.status === 'Confirmed' && (
            <button
              onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
              className="flex-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Complete
            </button>
          )}
          <button
            onClick={() => handleDeleteAppointment(appointment.id)}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Appointment Management</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Appointment
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <CalendarWidget />
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <div className="flex gap-4 px-6 pt-4">
                  {[
                    { key: 'all', label: 'All Appointments' },
                    { key: 'today', label: 'Today' },
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'past', label: 'Past' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key)}
                      className={`pb-4 px-2 font-medium transition-colors ${
                        selectedTab === tab.key
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading appointments...</div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No appointments found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredAppointments.map(apt => (
                      <AppointmentCard key={apt.id} appointment={apt} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">New Appointment</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData({...formData, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor Name *
                </label>
                <select
                  value={formData.doctorName}
                  onChange={(e) => setFormData({...formData, doctorName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Doctor</option>
                  <option value="Dr. Sarah Johnson">Dr. Sarah Johnson</option>
                  <option value="Dr. Michael Chen">Dr. Michael Chen</option>
                  <option value="Dr. Emily Brown">Dr. Emily Brown</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (min) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode *
                  </label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({...formData, mode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="In-person">In-person</option>
                    <option value="Video">Video</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAppointment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentManagementView;