// TimeSlotPicker component - handles displaying and selecting available time slots
import React, { useMemo } from 'react';
import { formatDateHeader, formatTime } from '../utils/dateUtils';
import { CalendarIcon } from './ui/Icons';
import type { TimeSlot } from '../types/index';

interface TimeSlotPickerProps {
  availableSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  loading?: boolean;
}

interface DayGroup {
  date: Date;
  slots: TimeSlot[];
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  availableSlots,
  onSelectSlot,
  loading = false,
}) => {
  const slotsByDay = useMemo(() => {
    const grouped: Record<string, DayGroup> = {};

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
    return Object.values(grouped).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
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
      {slotsByDay.map(({ date, slots }: DayGroup) => (
        <div key={date.toISOString()}>
          <h3 className="text-lg font-semibold text-gray-700 pb-2 border-b mb-3">
            {formatDateHeader(date)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot: TimeSlot) => (
              <button
                key={slot.id}
                onClick={() => (slot.isBooked ? null : onSelectSlot(slot))}
                disabled={slot.isBooked}
                className={`font-medium py-2 px-3 rounded-lg transition-all duration-200 ${
                  slot.isBooked
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-md transform hover:-translate-y-0.5'
                }`}
                title={
                  slot.isBooked
                    ? 'This time slot is already booked'
                    : 'Click to book this slot'
                }
              >
                {formatTime(new Date(slot.dateTime))}
                {slot.isBooked && (
                  <span className="block text-xs mt-1 text-gray-400">
                    Booked
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimeSlotPicker;
