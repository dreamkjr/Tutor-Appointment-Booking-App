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
      <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
        <CalendarIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No slots available
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Please check back later or try selecting a different date for
          available appointments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {slotsByDay.map(({ date, slots }: DayGroup) => (
        <div
          key={date.toISOString()}
          className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm"
        >
          <div className="flex items-center mb-4">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {formatDateHeader(date)}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {slots.map((slot: TimeSlot) => (
              <button
                key={slot.id}
                onClick={() => (slot.isBooked ? null : onSelectSlot(slot))}
                disabled={slot.isBooked}
                className={`relative font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center min-h-[60px] flex flex-col justify-center ${
                  slot.isBooked
                    ? 'bg-red-50 border-2 border-red-200 text-red-600 cursor-not-allowed opacity-70'
                    : 'bg-green-50 border-2 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:shadow-lg transform hover:scale-105 active:scale-95'
                }`}
                title={
                  slot.isBooked
                    ? 'This time slot is already booked'
                    : 'Click to book this slot'
                }
              >
                <span className="text-sm font-semibold">
                  {formatTime(new Date(slot.dateTime))}
                </span>
                {slot.isBooked ? (
                  <span className="text-xs mt-1 font-medium">Booked</span>
                ) : (
                  <span className="text-xs mt-1 opacity-75">Available</span>
                )}
                {!slot.isBooked && (
                  <div className="absolute top-1 right-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
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
