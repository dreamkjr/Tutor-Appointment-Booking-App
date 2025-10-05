// Teacher dashboard - main portal for teachers to manage their schedule and subjects
import React, { useState, useEffect } from 'react';
import {
  TutorSubject,
  TeacherSchedule,
  TeacherAppointment,
} from '../types/index';
import apiService from '../services/apiService';
import Modal from './ui/Modal';
import {
  BookIcon,
  GearIcon,
  CalendarIcon,
  EditIcon,
  PlusIcon,
  TrashIcon,
} from './ui/Icons';

interface TeacherDashboardProps {
  teacherId: number;
  teacherName: string;
  onLogout: () => void;
}

type TabType = 'subjects' | 'schedule' | 'appointments';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  teacherId,
  teacherName,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('subjects');
  // Removed subjects state - no longer needed since we don't manage subject assignment
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([]);
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherSchedule[]>([]);
  const [appointments, setAppointments] = useState<TeacherAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddTimeSlotModal, setShowAddTimeSlotModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });
  const [formData, setFormData] = useState({
    subjectId: '',
    selectedDate: '',
    startTime: '',
    endTime: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TeacherSchedule | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<TeacherSchedule | null>(
    null
  );

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  useEffect(() => {
    loadData();
  }, [teacherId, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'subjects') {
        // Only load assigned subjects, no need for all subjects
        const mySubjects = await apiService.getTutorSubjects(teacherId);
        setTutorSubjects(mySubjects);
      } else if (activeTab === 'schedule') {
        const schedule = await apiService.getTeacherSchedule(teacherId);
        setTeacherSchedule(schedule);
      } else if (activeTab === 'appointments') {
        const teacherAppointments = await apiService.getTeacherAppointments(
          teacherId
        );
        setAppointments(teacherAppointments);
      }
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Subjects are now assigned by admin, teachers can only view them

  const handleAddTimeSlot = () => {
    setShowAddTimeSlotModal(true);
  };

  const handleCloseModal = () => {
    setShowAddTimeSlotModal(false);
    setFormData({
      subjectId: '',
      selectedDate: '',
      startTime: '',
      endTime: '',
    });
    setEditingSlot(null);
    setError('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const selectedDate = new Date(formData.selectedDate);

      // Validate date is not in the past
      if (isDateInPast(selectedDate)) {
        setError('Cannot add time slots for past dates.');
        return;
      }

      // Check for overlapping slots
      const dayOfWeek = selectedDate.getDay();
      const existingSlots = teacherSchedule.filter(
        (slot) => slot.dayOfWeek === dayOfWeek
      );
      const hasOverlap = existingSlots.some((slot) => {
        const slotStart = slot.startTime;
        const slotEnd = slot.endTime;
        const newStart = formData.startTime;
        const newEnd = formData.endTime;

        return (
          (newStart >= slotStart && newStart < slotEnd) ||
          (newEnd > slotStart && newEnd <= slotEnd) ||
          (newStart <= slotStart && newEnd >= slotEnd)
        );
      });

      if (hasOverlap) {
        setError(
          'This time slot overlaps with an existing slot on the same day.'
        );
        return;
      }

      if (editingSlot) {
        // Update existing slot
        await apiService.updateScheduleSlot(teacherId, editingSlot.id, {
          subjectId: parseInt(formData.subjectId),
          dayOfWeek: dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
      } else {
        // Add new slot
        await apiService.addScheduleSlot(teacherId, {
          subjectId: parseInt(formData.subjectId),
          dayOfWeek: dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
        });
      }

      // Refresh schedule data
      const schedule = await apiService.getTeacherSchedule(teacherId);
      setTeacherSchedule(schedule);

      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to add time slot. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Helper functions for date management
  const getWeekDates = (weekStart: Date) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isDateInPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const handleEditSlot = (slot: TeacherSchedule) => {
    setEditingSlot(slot);
    const weekDates = getWeekDates(currentWeekStart);
    const slotDate = weekDates[slot.dayOfWeek];

    setFormData({
      subjectId: slot.subjectId.toString(),
      selectedDate: slotDate.toISOString().split('T')[0],
      startTime: slot.startTime.slice(0, 5), // Remove seconds
      endTime: slot.endTime.slice(0, 5),
    });
    setShowAddTimeSlotModal(true);
  };

  const handleDeleteSlot = (slot: TeacherSchedule) => {
    setSlotToDelete(slot);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!slotToDelete) return;

    try {
      setSubmitting(true);
      await apiService.deleteScheduleSlot(teacherId, slotToDelete.id);

      // Refresh schedule data
      const schedule = await apiService.getTeacherSchedule(teacherId);
      setTeacherSchedule(schedule);

      setShowDeleteConfirm(false);
      setSlotToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete time slot.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSubjectsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            My Assigned Subjects
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            These subjects have been assigned to you by the administration.
            Focus on managing your schedule for these subjects.
          </p>
          {tutorSubjects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tutorSubjects.map((tutorSubject) => (
                <div
                  key={tutorSubject.id}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <h4 className="font-medium text-gray-900 mb-2">
                    {tutorSubject.subjectName}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {tutorSubject.subjectDescription}
                  </p>
                  <div className="text-xs text-blue-600 font-medium">
                    ✓ Active Subject
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">No subjects assigned yet.</p>
              <p className="text-sm text-gray-400">
                Please contact administration to get subjects assigned.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderScheduleTab = () => {
    const weekDates = getWeekDates(currentWeekStart);
    const today = new Date();
    const isCurrentWeek = weekDates.some(
      (date) => date.toDateString() === today.toDateString()
    );

    const scheduleByDay = daysOfWeek.map((day, index) => {
      // Filter slots for this day of week
      let daySlots = teacherSchedule.filter((slot) => slot.dayOfWeek === index);

      // Temporary solution: Only show existing slots for current/future weeks
      // Hide slots for past weeks to simulate proper date-specific scheduling
      const weekDate = weekDates[index];
      const isThisWeekInFuture = currentWeekStart > today;
      const isThisWeekCurrent = isCurrentWeek;

      if (!isThisWeekCurrent && !isThisWeekInFuture) {
        // For past weeks, only show slots if this was the week they were actually created
        // This is imperfect but better than showing all slots everywhere
        daySlots = [];
      }

      return {
        day,
        dayIndex: index,
        date: weekDates[index],
        slots: daySlots,
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Weekly Schedule
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={goToPreviousWeek}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                title="Previous Week"
              >
                ←
              </button>
              <button
                onClick={goToCurrentWeek}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                title="Current Week"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors"
                title="Next Week"
              >
                →
              </button>
            </div>
            <button
              onClick={handleAddTimeSlot}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center shadow-sm transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Time Slot
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {scheduleByDay.map(({ day, dayIndex, date, slots }) => {
            const isPastDate = isDateInPast(date);
            return (
              <div
                key={day}
                className={`bg-white p-4 rounded-lg border-2 transition-colors ${
                  isPastDate
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4
                      className={`font-medium ${
                        isPastDate ? 'text-gray-500' : 'text-gray-900'
                      }`}
                    >
                      {day}
                    </h4>
                    <p
                      className={`text-sm ${
                        isPastDate ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {formatDate(date)}
                      {isPastDate && ' (Past)'}
                    </p>
                  </div>
                </div>
                {slots.length > 0 ? (
                  <div className="space-y-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {slot.subjectName}
                          </span>
                          <span className="text-gray-600 ml-2">
                            {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditSlot(slot)}
                            className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                            title="Edit Time Slot"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot)}
                            className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                            title="Delete Time Slot"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No schedule set for this day
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAppointmentsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Upcoming Appointments
      </h3>
      {appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {appointment.studentName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {appointment.subjectName}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <span>
                      📅{' '}
                      {new Date(
                        appointment.appointmentDate
                      ).toLocaleDateString()}
                    </span>
                    <span>
                      🕐 {appointment.startTime} - {appointment.endTime}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed'
                          ? 'bg-green-100 text-green-800'
                          : appointment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {appointment.status.charAt(0).toUpperCase() +
                        appointment.status.slice(1)}
                    </span>
                  </div>
                  {appointment.notes && (
                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      💬 {appointment.notes}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Edit"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarIcon className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-800">
            No appointments yet
          </h3>
          <p className="mt-1 text-gray-500">
            Students will be able to book appointments based on your schedule.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Teacher Portal
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {teacherName}!
              </p>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BookIcon className="w-5 h-5 inline mr-2" />
              My Subjects
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <GearIcon className="w-5 h-5 inline mr-2" />
              Schedule
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'appointments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarIcon className="w-5 h-5 inline mr-2" />
              Appointments
            </button>
          </nav>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <>
              {activeTab === 'subjects' && renderSubjectsTab()}
              {activeTab === 'schedule' && renderScheduleTab()}
              {activeTab === 'appointments' && renderAppointmentsTab()}
            </>
          )}
        </div>
      </div>

      {/* Add Time Slot Modal */}
      <Modal
        isOpen={showAddTimeSlotModal}
        onClose={handleCloseModal}
        title={editingSlot ? 'Edit Time Slot' : 'Add New Time Slot'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
            >
              <option value="" disabled>
                Choose your subject
              </option>
              {tutorSubjects.map((subject) => (
                <option key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="selectedDate"
              value={formData.selectedDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cannot select past dates
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            💡 Make sure the end time is after the start time and doesn't
            overlap with existing slots.
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !formData.subjectId ||
                !formData.selectedDate ||
                !formData.startTime ||
                !formData.endTime
              }
              className="px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Adding...
                </>
              ) : editingSlot ? (
                'Update Time Slot'
              ) : (
                'Add Time Slot'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSlotToDelete(null);
        }}
        title="Delete Time Slot"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-2 rounded-full">
              <span className="text-red-600 text-xl">⚠️</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                Are you sure you want to delete this time slot?
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {slotToDelete && (
                  <>
                    {slotToDelete.subjectName} • {slotToDelete.startTime} -{' '}
                    {slotToDelete.endTime}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <p className="text-sm text-yellow-700">
              ⚠️ This action cannot be undone. Any student bookings for this
              time slot will be affected.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSlotToDelete(null);
              }}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={submitting}
              className="px-6 py-3 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                'Delete Time Slot'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherDashboard;
