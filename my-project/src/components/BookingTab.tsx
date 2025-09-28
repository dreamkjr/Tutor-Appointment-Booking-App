// BookingTab component - handles the booking interface
import React from 'react';
import TimeSlotPicker from './TimeSlotPicker';
import type { TimeSlot } from '../types/index';

interface BookingTabProps {
  availableSlots: TimeSlot[];
  onBook: (slot: TimeSlot) => void;
  loading: boolean;
}

const BookingTab: React.FC<BookingTabProps> = ({
  availableSlots,
  onBook,
  loading,
}) => {
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

export default BookingTab;
