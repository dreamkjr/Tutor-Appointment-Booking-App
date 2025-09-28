import React, { useState, useMemo, useEffect } from 'react';
import apiService from './services/apiService';

// A helper function to format dates nicely. e.g., "Monday, Sep 29"
const formatDateHeader = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// A helper function to format time. e.g., "10:00 AM"
const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// --- SVG ICONS ---
// Using inline SVGs to avoid external dependencies.

const CalendarIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
    <line x1="16" x2="16" y1="2" y2="6"></line>
    <line x1="8" x2="8" y1="2" y2="6"></line>
    <line x1="3" x2="21" y1="10" y2="10"></line>
  </svg>
);

const ClockIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const EditIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

const TrashIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const AlertTriangleIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
    <line x1="12" x2="12" y1="9" y2="13"></line>
    <line x1="12" x2="12.01" y1="17" y2="17"></line>
  </svg>
);

// --- CORE UI COMPONENTS ---

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
        <div className="p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

// --- BOOKING LOGIC COMPONENTS ---

// --- BOOKING LOGIC COMPONENTS ---

const TimeSlotPicker = ({ availableSlots, onSelectSlot, loading = false }) => {
  // Group slots by day
  const slotsByDay = useMemo(() => {
    const grouped = {};

    availableSlots.forEach((slot) => {
      const date = new Date(slot.dateTime);
      const dayKey = date.toDateString();

      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          date: date,
          slots: [],
        };
      }

      grouped[dayKey].slots.push(slot);
    });

    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => a.date - b.date);
  }, [availableSlots]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading available slots...</span>
      </div>
    );
  }

  if (slotsByDay.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <CalendarIcon className="mx-auto w-12 h-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-800">
          No slots available
        </h3>
        <p className="mt-1 text-gray-500">
          Please check back later for available appointments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {slotsByDay.map(({ date, slots }) => (
        <div key={date.toISOString()}>
          <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b mb-3">
            {formatDateHeader(date)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => (
              <button
                key={slot.id}
                onClick={() => onSelectSlot(slot)}
                className="bg-blue-50 text-blue-700 font-medium py-2 px-3 rounded-lg hover:bg-blue-100 hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {formatTime(new Date(slot.dateTime))}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const BookingTab = ({ availableSlots, onBook, loading }) => {
  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">
        Book an Appointment
      </h2>
      <p className="text-gray-500 mb-6">
        Select an available time slot below to schedule your session.
      </p>
      <TimeSlotPicker
        availableSlots={availableSlots}
        onSelectSlot={onBook}
        loading={loading}
      />
    </div>
  );
};

const MyBookingsTab = ({ myBookings, onEdit, onCancel, loading }) => {
  // Sort bookings chronologically
  const sortedBookings = [...myBookings].sort(
    (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">My Bookings</h2>
        <p className="text-gray-500 mb-6">
          Here are your upcoming appointments. You can reschedule or cancel
          them.
        </p>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">
            Loading your appointments...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">My Bookings</h2>
      <p className="text-gray-500 mb-6">
        Here are your upcoming appointments. You can reschedule or cancel them.
      </p>
      {sortedBookings.length > 0 ? (
        <div className="space-y-4">
          {sortedBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-l-4 border-blue-500"
            >
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center text-gray-800 font-semibold text-lg">
                  <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
                  {formatDateHeader(new Date(booking.dateTime))}
                </div>
                <div className="flex items-center text-gray-600 mt-1">
                  <ClockIcon className="w-5 h-5 mr-2 text-blue-600" />
                  {formatTime(new Date(booking.dateTime))}
                </div>
                {booking.tutor && (
                  <div className="text-sm text-gray-500 mt-1">
                    with {booking.tutor.name} ({booking.tutor.subject})
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onEdit(booking)}
                  className="flex items-center justify-center bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  <EditIcon className="mr-1.5" /> Edit
                </button>
                <button
                  onClick={() => onCancel(booking)}
                  className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <TrashIcon className="mr-1.5" /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-800">
            No bookings yet
          </h3>
          <p className="mt-1 text-gray-500">
            Go to the "Booking" tab to schedule an appointment.
          </p>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [activeTab, setActiveTab] = useState('booking');
  const [bookings, setBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState({
    bookings: false,
    slots: false,
    action: false,
  });
  const [error, setError] = useState(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '',
    data: null,
  });

  // Load data on component mount
  useEffect(() => {
    loadBookings();
    loadAvailableSlots();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading((prev) => ({ ...prev, bookings: true }));
      setError(null);
      const data = await apiService.getAppointments();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load your appointments. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading((prev) => ({ ...prev, slots: true }));
      const data = await apiService.getAvailableSlots();
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, slots: false }));
    }
  };

  const openModal = (type, data) => setModalState({ isOpen: true, type, data });
  const closeModal = () =>
    setModalState({ isOpen: false, type: '', data: null });

  const handleBookAppointment = (slot) => {
    openModal('confirmBooking', slot);
  };

  const confirmBooking = async () => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      const slot = modalState.data;

      console.log('🎯 Frontend booking slot:', slot);

      const appointmentData = {
        dateTime:
          slot.dateTime instanceof Date
            ? slot.dateTime.toISOString()
            : slot.dateTime,
        tutorId: slot.tutorId || 1, // Default to first tutor
        notes: '',
      };

      console.log('📤 Sending appointment data:', appointmentData);

      await apiService.bookAppointment(appointmentData);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      setActiveTab('my-booking'); // Switch to my bookings tab
      closeModal();
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleEditAppointment = (booking) => {
    openModal('editBooking', booking);
  };

  const confirmEdit = async (newSlot) => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));

      const updateData = {
        dateTime: newSlot.dateTime || new Date(newSlot.dateTime),
      };

      await apiService.updateAppointment(modalState.data.id, updateData);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      closeModal();
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const handleCancelAppointment = (booking) => {
    openModal('confirmCancel', booking);
  };

  const confirmCancel = async () => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));

      await apiService.cancelAppointment(modalState.data.id);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      closeModal();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      setError('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  const renderModalContent = () => {
    const { type, data } = modalState;

    switch (type) {
      case 'confirmBooking':
        const bookingDate = new Date(data.dateTime);
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Confirm Booking
            </h3>
            <p className="text-gray-600">
              Are you sure you want to book this appointment?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
              <div className="font-semibold text-blue-800">
                {formatDateHeader(bookingDate)}
              </div>
              <div className="text-blue-700">{formatTime(bookingDate)}</div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                disabled={loading.action}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={confirmBooking}
                disabled={loading.action}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading.action && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Confirm
              </button>
            </div>
          </div>
        );
      case 'editBooking':
        return (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Reschedule Appointment
            </h3>
            <p className="text-gray-600 mb-4">
              Select a new time slot for your appointment.
            </p>
            <div className="max-h-64 overflow-y-auto pr-2">
              <TimeSlotPicker
                availableSlots={availableSlots}
                onSelectSlot={confirmEdit}
                loading={loading.slots}
              />
            </div>
          </div>
        );
      case 'confirmCancel':
        return (
          <div>
            <div className="flex items-start">
              <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-xl font-bold text-gray-900">
                  Cancel Appointment
                </h3>
                <p className="text-gray-600 mt-1">
                  Are you sure you want to cancel this appointment? This action
                  cannot be undone.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4 text-sm">
                  <div className="font-semibold text-red-800">
                    {formatDateHeader(new Date(data.dateTime))}
                  </div>
                  <div className="text-red-700">
                    {formatTime(new Date(data.dateTime))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-5">
              <button
                onClick={closeModal}
                disabled={loading.action}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Keep It
              </button>
              <button
                onClick={confirmCancel}
                disabled={loading.action}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {loading.action && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Yes, Cancel
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <style>{`
                @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease-in-out; }
                @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
            `}</style>

      <div className="container mx-auto max-w-4xl p-4">
        <header className="text-center my-6 sm:my-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Tutor Scheduling
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Book and manage your tutoring sessions with ease.
          </p>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px p-2 space-x-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('booking')}
                className={`flex items-center justify-center font-medium text-base py-3 px-5 rounded-lg transition-colors duration-200 ${
                  activeTab === 'booking'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CalendarIcon className="w-5 h-5 mr-2" /> Booking
              </button>
              <button
                onClick={() => setActiveTab('my-booking')}
                className={`flex items-center justify-center font-medium text-base py-3 px-5 rounded-lg transition-colors duration-200 ${
                  activeTab === 'my-booking'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ClockIcon className="w-5 h-5 mr-2" /> My Bookings
                {bookings.length > 0 && (
                  <span className="ml-2 bg-white text-blue-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {bookings.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <main>
            {activeTab === 'booking' ? (
              <BookingTab
                availableSlots={availableSlots}
                onBook={handleBookAppointment}
                loading={loading.slots}
              />
            ) : (
              <MyBookingsTab
                myBookings={bookings}
                onEdit={handleEditAppointment}
                onCancel={handleCancelAppointment}
                loading={loading.bookings}
              />
            )}
          </main>
        </div>
      </div>
      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
        {renderModalContent()}
      </Modal>
    </div>
  );
}
