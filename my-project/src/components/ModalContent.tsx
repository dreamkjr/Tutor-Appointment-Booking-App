// Modal content components for different types of modals
import React from 'react';
import { formatDateHeader, formatTime } from '../utils/dateUtils';
import { CalendarIcon, ClockIcon, AlertTriangleIcon } from './ui/Icons';
import TimeSlotPicker from './TimeSlotPicker';
import type { TimeSlot, Appointment } from '../types/index';

interface BookingConfirmationModalProps {
  slot: TimeSlot;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const BookingConfirmationModal: React.FC<BookingConfirmationModalProps> = ({
  slot,
  onConfirm,
  onCancel,
  loading,
}) => (
  <div>
    <div className="flex items-start">
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
        <CalendarIcon className="h-6 w-6 text-green-600" />
      </div>
      <div className="ml-4 text-left">
        <h3 className="text-xl font-bold text-gray-900">Confirm Booking</h3>
        <p className="text-gray-600 mt-1">
          Please confirm your appointment booking for:
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 my-4 text-sm">
          <div className="font-semibold text-green-800">
            {formatDateHeader(new Date(slot.dateTime))}
          </div>
          <div className="text-green-700">
            {formatTime(new Date(slot.dateTime))}
          </div>
          <div className="text-green-600 text-xs mt-1">
            with {slot.tutorName} ({slot.subject})
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-end space-x-3 mt-5">
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
      >
        Back
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        )}
        Confirm
      </button>
    </div>
  </div>
);

interface EditBookingModalProps {
  booking: Appointment;
  availableSlots: TimeSlot[];
  onSelectSlot: (slot: TimeSlot) => void;
  loading: boolean;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  availableSlots,
  onSelectSlot,
  loading,
}) => (
  <div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">
      Reschedule Appointment
    </h3>
    <p className="text-gray-600 mb-4">
      Select a new time slot for your appointment.
    </p>
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
      <div className="font-semibold text-blue-800">Current Appointment:</div>
      <div className="text-blue-700">
        {formatDateHeader(new Date(booking.dateTime))} at{' '}
        {formatTime(new Date(booking.dateTime))}
      </div>
    </div>
    <div className="max-h-64 overflow-y-auto pr-2">
      <TimeSlotPicker
        availableSlots={availableSlots}
        onSelectSlot={onSelectSlot}
        loading={loading}
      />
    </div>
  </div>
);

interface RescheduleConfirmationModalProps {
  originalBooking: Appointment;
  newSlot: TimeSlot;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}

export const RescheduleConfirmationModal: React.FC<RescheduleConfirmationModalProps> = ({
  originalBooking,
  newSlot,
  onConfirm,
  onBack,
  loading,
}) => (
  <div>
    <div className="flex items-start">
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
        <ClockIcon className="h-6 w-6 text-blue-600" />
      </div>
      <div className="ml-4 text-left">
        <h3 className="text-xl font-bold text-gray-900">Confirm Reschedule</h3>
        <p className="text-gray-600 mt-1">
          Are you sure you want to reschedule your appointment to this new time?
        </p>

        <div className="mt-4 space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <div className="font-semibold text-red-800">From:</div>
            <div className="text-red-700">
              {formatDateHeader(new Date(originalBooking.dateTime))} at{' '}
              {formatTime(new Date(originalBooking.dateTime))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <div className="font-semibold text-green-800">To:</div>
            <div className="text-green-700">
              {formatDateHeader(new Date(newSlot.dateTime))} at{' '}
              {formatTime(new Date(newSlot.dateTime))}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-end space-x-3 mt-5">
      <button
        onClick={onBack}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
      >
        Back
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        )}
        Confirm Reschedule
      </button>
    </div>
  </div>
);

interface CancelConfirmationModalProps {
  booking: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const CancelConfirmationModal: React.FC<CancelConfirmationModalProps> = ({
  booking,
  onConfirm,
  onCancel,
  loading,
}) => (
  <div>
    <div className="flex items-start">
      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
        <AlertTriangleIcon className="h-6 w-6 text-red-600" />
      </div>
      <div className="ml-4 text-left">
        <h3 className="text-xl font-bold text-gray-900">Cancel Appointment</h3>
        <p className="text-gray-600 mt-1">
          Are you sure you want to cancel this appointment? This action cannot
          be undone.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 my-4 text-sm">
          <div className="font-semibold text-red-800">
            {formatDateHeader(new Date(booking.dateTime))}
          </div>
          <div className="text-red-700">
            {formatTime(new Date(booking.dateTime))}
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-end space-x-3 mt-5">
      <button
        onClick={onCancel}
        disabled={loading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
      >
        Keep It
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        )}
        Yes, Cancel
      </button>
    </div>
  </div>
);
