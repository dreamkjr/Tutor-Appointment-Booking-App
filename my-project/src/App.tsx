import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import Modal from './components/ui/Modal';
import TabNavigation from './components/TabNavigation';
import BookingTab from './components/BookingTab';
import MyBookingsTab from './components/MyBookingsTab';
import {
  BookingConfirmationModal,
  EditBookingModal,
  RescheduleConfirmationModal,
  CancelConfirmationModal,
} from './components/ModalContent';
import { useAppointments } from './hooks/useAppointments';
import { useModal } from './hooks/useModal';
import { GLOBAL_STYLES } from './constants';
import { runAndLogDiagnostics } from './utils/debug';
import type { TimeSlot, Appointment, TabType } from './types/index';

// Main authenticated app component
const AuthenticatedApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('booking');

  // Run diagnostics on app load (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      runAndLogDiagnostics();
    }
  }, []);

  // Custom hooks for business logic
  const {
    bookings,
    availableSlots,
    loading,
    error,
    bookAppointment,
    updateAppointment,
    cancelAppointment,
    clearError,
  } = useAppointments();

  const {
    modalState,
    selectedNewSlot,
    openModal,
    closeModal,
    handleSlotSelectionForEdit,
    returnToEditBooking,
  } = useModal();

  // Event handlers
  const handleBookAppointment = (slot: TimeSlot): void => {
    openModal('confirmBooking', slot);
  };

  const handleEditAppointment = (booking: Appointment): void => {
    openModal('editBooking', booking);
  };

  const handleCancelAppointment = (booking: Appointment): void => {
    openModal('confirmCancel', booking);
  };

  // Modal action handlers
  const confirmBooking = async () => {
    const result = await bookAppointment(modalState.data);
    if (result.success) {
      closeModal();
    }
  };

  const confirmEdit = async () => {
    if (!selectedNewSlot || !modalState.data?.originalBooking) {
      return;
    }

    const result = await updateAppointment(
      modalState.data.originalBooking.id,
      selectedNewSlot
    );

    if (result.success) {
      closeModal();
    }
  };

  const confirmCancel = async () => {
    const result = await cancelAppointment(modalState.data.id);
    if (result.success) {
      closeModal();
    }
  };

  // Render modal content based on type
  const renderModalContent = () => {
    const { type, data } = modalState;

    switch (type) {
      case 'confirmBooking':
        return (
          <BookingConfirmationModal
            slot={data}
            onConfirm={confirmBooking}
            onCancel={closeModal}
            loading={loading.action}
          />
        );

      case 'editBooking':
        return (
          <EditBookingModal
            booking={data}
            availableSlots={availableSlots}
            onSelectSlot={(newSlot: TimeSlot) =>
              handleSlotSelectionForEdit(newSlot, data)
            }
            loading={loading.slots}
          />
        );

      case 'confirmReschedule':
        return (
          <RescheduleConfirmationModal
            originalBooking={data.originalBooking}
            newSlot={data.newSlot}
            onConfirm={confirmEdit}
            onBack={() => returnToEditBooking(data.originalBooking)}
            loading={loading.action}
          />
        );

      case 'confirmCancel':
        return (
          <CancelConfirmationModal
            booking={data}
            onConfirm={confirmCancel}
            onCancel={closeModal}
            loading={loading.action}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{GLOBAL_STYLES}</style>

      {/* Header with user info */}
      <Header />

      {/* Main Content */}
      <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen pt-4">
        <div className="container mx-auto max-w-4xl p-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex justify-between items-center">
              <div className="text-red-800 font-medium">{error}</div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 font-bold text-lg"
              >
                ×
              </button>
            </div>
          )}

          {/* Tab Navigation */}
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {activeTab === 'booking' && (
              <BookingTab
                availableSlots={availableSlots}
                onBook={handleBookAppointment}
                loading={loading.slots}
              />
            )}
            {activeTab === 'mybookings' && (
              <MyBookingsTab
                myBookings={bookings}
                onEdit={handleEditAppointment}
                onCancel={handleCancelAppointment}
                loading={loading.bookings}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
        {renderModalContent()}
      </Modal>
    </>
  );
};

// Main App wrapper with authentication
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

// App content that checks authentication state
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show main app if authenticated
  return <AuthenticatedApp />;
};

export default App;
