// Custom hook for managing appointments data and operations
import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { formatDateTimeForAPI } from '../utils/dateUtils';

export const useAppointments = () => {
  const [bookings, setBookings] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState({
    bookings: false,
    slots: false,
    action: false,
  });
  const [error, setError] = useState(null);

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
  const bookAppointment = async (slot) => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      const appointmentData = {
        dateTime: formatDateTimeForAPI(slot.dateTime),
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
      setError('Failed to book appointment. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Update an existing appointment
  const updateAppointment = async (appointmentId, newSlot) => {
    try {
      setLoading((prev) => ({ ...prev, action: true }));
      setError(null);

      const updateData = {
        dateTime: formatDateTimeForAPI(newSlot.dateTime),
      };

      console.log('📝 Updating appointment:', { appointmentId, updateData });
      await apiService.updateAppointment(appointmentId, updateData);

      // Reload data
      await loadBookings();
      await loadAvailableSlots();

      return { success: true };
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(`Failed to update appointment: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading((prev) => ({ ...prev, action: false }));
    }
  };

  // Cancel an appointment
  const cancelAppointment = async (appointmentId) => {
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
      setError('Failed to cancel appointment. Please try again.');
      return { success: false, error: error.message };
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
