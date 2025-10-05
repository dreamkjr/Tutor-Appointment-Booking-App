// Custom hook for managing appointments data and operations
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    bookings: false,
    slots: false,
    action: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load bookings from API
  const loadBookings = useCallback(async () => {
    if (!user) {
      console.log('No user logged in, skipping bookings load');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, bookings: true }));
      setError(null);
      const data = await apiService.getAppointments(user.id);
      console.log(
        '📅 Raw API response for user',
        user.name,
        'ID:',
        user.id,
        ':',
        data
      );
      setBookings(data);
      console.log(
        '📅 Bookings state updated with:',
        data.length,
        'appointments'
      );
    } catch (error) {
      console.error('Error loading bookings:', error);
      setError('Failed to load your appointments. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, bookings: false }));
    }
  }, [user]);

  // Load available slots from API
  const loadAvailableSlots = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, slots: true }));
      const data = await apiService.getAvailableSlots();
      console.log('🕐 Loaded available slots:', data);
      setAvailableSlots(data);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, slots: false }));
    }
  }, []);

  // Book a new appointment
  const bookAppointment = async (
    slot: TimeSlot
  ): Promise<AppointmentOperationResult> => {
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      const appointmentData = {
        dateTime:
          typeof slot.dateTime === 'string'
            ? slot.dateTime
            : new Date(slot.dateTime).toISOString(),
        tutorId: slot.tutorId,
        subjectId: slot.subjectId || 1, // Use the subjectId from slot or default to 1
        studentId: user.id, // Include the authenticated user's ID
        notes: '',
      };

      console.log(
        '📅 Booking appointment for student:',
        user.name,
        'ID:',
        user.id,
        appointmentData
      );
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

  // Load initial data when user changes
  useEffect(() => {
    if (user) {
      loadBookings();
      loadAvailableSlots();
    } else {
      // Clear data when no user is logged in
      setBookings([]);
      setAvailableSlots([]);
    }
  }, [user, loadBookings, loadAvailableSlots]);

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
