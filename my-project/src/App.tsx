// Main App component - refactored following React best practices
import React, { useState } from 'react';
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
import type { TimeSlot, Appointment, TabType } from './types/index';

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('booking');

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
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      <style>{GLOBAL_STYLES}</style>

      <div className="container mx-auto max-w-4xl p-4">
        {/* Header */}
        <header className="text-center my-6 sm:my-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
            Tutor Scheduling
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Book and manage your tutoring sessions with ease.
          </p>
        </header>

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

      {/* Modal */}
      <Modal isOpen={modalState.isOpen} onClose={closeModal}>
        {renderModalContent()}
      </Modal>
    </div>
  );
}
