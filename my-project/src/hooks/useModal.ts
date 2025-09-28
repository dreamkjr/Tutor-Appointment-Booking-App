// Custom hook for managing modal state and operations
import { useState } from 'react';
import type { Appointment, TimeSlot, ModalType } from '../types/index';

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data: any;
}

interface UseModalReturn {
  // State
  modalState: ModalState;
  selectedNewSlot: TimeSlot | null;
  // Actions
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
  handleSlotSelectionForEdit: (
    newSlot: TimeSlot,
    originalBooking: Appointment
  ) => void;
  returnToEditBooking: (originalBooking: Appointment) => void;
  setSelectedNewSlot: (slot: TimeSlot | null) => void;
}

export const useModal = (): UseModalReturn => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    type: '',
    data: null,
  });
  const [selectedNewSlot, setSelectedNewSlot] = useState<TimeSlot | null>(null);

  // Open modal with specific type and data
  const openModal = (type: ModalType, data?: any): void => {
    setModalState({ isOpen: true, type, data });
  };

  // Close modal and reset state
  const closeModal = (): void => {
    setModalState({ isOpen: false, type: '', data: null });
    setSelectedNewSlot(null);
  };

  // Handle slot selection for editing (before confirmation)
  const handleSlotSelectionForEdit = (
    newSlot: TimeSlot,
    originalBooking: Appointment
  ): void => {
    setSelectedNewSlot(newSlot);
    openModal('confirmReschedule', {
      originalBooking,
      newSlot,
    });
  };

  // Return to edit booking modal from confirmation
  const returnToEditBooking = (originalBooking: Appointment): void => {
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
