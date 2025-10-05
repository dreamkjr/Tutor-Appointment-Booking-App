// MyBookingsTab component - displays user's current bookings with edit/cancel options
import React from 'react';
import { formatDateHeader, formatTimeRange } from '../utils/dateUtils';
import { CalendarIcon, ClockIcon, EditIcon, TrashIcon } from './ui/Icons';
import type { Appointment } from '../types/index';

interface MyBookingsTabProps {
  myBookings: Appointment[];
  onEdit: (booking: Appointment) => void;
  onCancel: (booking: Appointment) => void;
  loading: boolean;
}

const MyBookingsTab: React.FC<MyBookingsTabProps> = ({
  myBookings,
  onEdit,
  onCancel,
  loading,
}) => {
  // Debug logging
  console.log('📋 MyBookingsTab received:', { myBookings, loading });

  // Sort bookings by most recent appointment date first, then by creation date
  const sortedBookings = [...myBookings].sort((a, b) => {
    const dateA = new Date(a.dateTime).getTime();
    const dateB = new Date(b.dateTime).getTime();
    // If appointment dates are different, sort by appointment date (newest first)
    if (dateA !== dateB) {
      return dateB - dateA;
    }
    // If appointment dates are the same, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Helper function to check if appointment is in the past
  const isPastAppointment = (dateTime: string | Date): boolean => {
    return new Date(dateTime).getTime() < Date.now();
  };

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
          {sortedBookings.map((booking) => {
            const isPast = isPastAppointment(booking.dateTime);
            return (
              <div
                key={booking.id}
                className={`bg-white rounded-lg shadow-md p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-l-4 transition-all ${
                  isPast
                    ? 'border-gray-400 opacity-60 bg-gray-50'
                    : 'border-blue-500'
                }`}
              >
                <div className="mb-3 sm:mb-0">
                  <div
                    className={`flex items-center font-semibold text-lg ${
                      isPast ? 'text-gray-500' : 'text-gray-800'
                    }`}
                  >
                    <CalendarIcon
                      className={`w-5 h-5 mr-2 ${
                        isPast ? 'text-gray-400' : 'text-blue-600'
                      }`}
                    />
                    {formatDateHeader(new Date(booking.dateTime))}
                  </div>
                  <div
                    className={`flex items-center mt-1 ${
                      isPast ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    <ClockIcon
                      className={`w-5 h-5 mr-2 ${
                        isPast ? 'text-gray-400' : 'text-blue-600'
                      }`}
                    />
                    {formatTimeRange(new Date(booking.dateTime))}
                  </div>
                  {booking.tutor && (
                    <div
                      className={`text-sm mt-1 ${
                        isPast ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      with {booking.tutor.name} ({booking.tutor.subject})
                    </div>
                  )}
                  {isPast && (
                    <div className="text-xs text-gray-400 mt-1 font-medium">
                      Past Appointment
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!isPast && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            );
          })}
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

export default MyBookingsTab;
