// React component prop types for type-safe component interfaces

import { ReactNode } from 'react';
import { Appointment, TimeSlot, TabType } from './index';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export interface TimeSlotPickerProps {
  availableSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  loading?: boolean;
}

export interface BookingTabProps {
  availableSlots: TimeSlot[];
  onBook: (slot: TimeSlot) => void;
  loading: boolean;
}

export interface MyBookingsTabProps {
  myBookings: Appointment[];
  onEdit: (booking: Appointment) => void;
  onCancel: (booking: Appointment) => void;
  loading: boolean;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface BookingConfirmationModalProps {
  slot: TimeSlot;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export interface EditBookingModalProps {
  booking: Appointment;
  availableSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  loading: boolean;
}

export interface RescheduleConfirmationModalProps {
  originalBooking: Appointment;
  newSlot: TimeSlot;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export interface CancelConfirmationModalProps {
  booking: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export interface IconProps {
  className?: string;
}
