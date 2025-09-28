// Custom hook for managing modal state and operations
import { useState } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: '',
    data: null,
  });
  const [selectedNewSlot, setSelectedNewSlot] = useState(null);

  // Open modal with specific type and data
  const openModal = (type, data) => {
    setModalState({ isOpen: true, type, data });
  };

  // Close modal and reset state
  const closeModal = () => {
    setModalState({ isOpen: false, type: '', data: null });
    setSelectedNewSlot(null);
  };

  // Handle slot selection for editing (before confirmation)
  const handleSlotSelectionForEdit = (newSlot, originalBooking) => {
    setSelectedNewSlot(newSlot);
    openModal('confirmReschedule', {
      originalBooking,
      newSlot,
    });
  };

  // Return to edit booking modal from confirmation
  const returnToEditBooking = (originalBooking) => {
    setSelectedNewSlot(null);
    openModal('editBooking', originalBooking);
  };

  return {
    // State
    modalState,
    selectedNewSlot,

    // Actions
    openModal,
    closeModal,
    handleSlotSelectionForEdit,
    returnToEditBooking,
    setSelectedNewSlot,
  };
};
