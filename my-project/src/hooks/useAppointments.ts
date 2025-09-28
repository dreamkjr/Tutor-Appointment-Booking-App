// Custom hook for managing appointments data and operations
import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import type { Appointment, TimeSlot } from '../types/index';
import type { LoadingState, AppointmentOperationResult } from '../types/api';

interface UseAppointmentsReturn {
  // State
  bookings: Appointment[];
  availableSlots: TimeSlot[];
  loading: LoadingState;
  error: string | null;
  // Actions
  bookAppointment: (slot: TimeSlot) => Promise<AppointmentOperationResult>;
  updateAppointment: (
    appointmentId: number,
    newSlot: TimeSlot
  ) => Promise<AppointmentOperationResult>;
  cancelAppointment: (
    appointmentId: number
  ) => Promise<AppointmentOperationResult>;
  loadBookings: () => Promise<void>;
  loadAvailableSlots: () => Promise<void>;
  clearError: () => void;
}

export const useAppointments = (): UseAppointmentsReturn => {
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    bookings: false,
    slots: false,
    action: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load bookings from API
  const loadBookings = async () => {
    try {
      setLoading((prev) => ({ ...prev, bookings: true }));
      setError(null);
      const data = await apiService.getAppointments();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load your appointments. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  };

  // Load available slots from API
  const loadAvailableSlots = async () => {
    try {
      setLoading((prev) => ({ ...prev, slots: true }));
      const data = await apiService.getAvailableSlots();
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, slots: false }));
    }
  };

  // Book a new appointment
  const bookAppointment = async (
    slot: TimeSlot
  ): Promise<AppointmentOperationResult> => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      const appointmentData = {
        dateTime:
          typeof slot.dateTime === 'string'
            ? slot.dateTime
            : new Date(slot.dateTime).toISOString(),
        tutorId: slot.tutorId,
        notes: '',
      };

      console.log('📅 Booking appointment:', appointmentData);
      await apiService.bookAppointment(appointmentData);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      return { success: true };
    } catch (error) {
      console.error('Error booking appointment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError('Failed to book appointment. Please try again.');
      return { success: false, error: errorMessage };
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Update an existing appointment
  const updateAppointment = async (
    appointmentId: number,
    newSlot: TimeSlot
  ): Promise<AppointmentOperationResult> => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      const updateData = {
        dateTime:
          typeof newSlot.dateTime === 'string'
            ? newSlot.dateTime
            : new Date(newSlot.dateTime).toISOString(),
      };

      console.log('📝 Updating appointment:', { appointmentId, updateData });
      await apiService.updateAppointment(appointmentId, updateData);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to update appointment: ${errorMessage}`);
      return { success: false, error: errorMessage };
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Cancel an appointment
  const cancelAppointment = async (
    appointmentId: number
  ): Promise<AppointmentOperationResult> => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      console.log('🗑️ Cancelling appointment:', appointmentId);
      await apiService.cancelAppointment(appointmentId);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      return { success: true };
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setError('Failed to cancel appointment. Please try again.');
      return { success: false, error: errorMessage };
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Clear error state
  const clearError = () => setError(null);

  // Load initial data
  useEffect(() => {
    loadBookings();
    loadAvailableSlots();
  }, []);

  return {
    // State
    bookings,
    availableSlots,
    loading,
    error,

    // Actions
    bookAppointment,
    updateAppointment,
    cancelAppointment,
    loadBookings,
    loadAvailableSlots,
    clearError,
  };
};
