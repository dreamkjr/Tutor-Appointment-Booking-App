// BookingTab component - single page booking interface with teacher and subject dropdowns
import React, { useState, useEffect } from 'react';
import TimeSlotPicker from './TimeSlotPicker';
import apiService from '../services/apiService';
import { formatDateHeader } from '../utils/dateUtils';
import { BookIcon, UserIcon, CalendarIcon, ChevronDownIcon } from './ui/Icons';
import type { Subject, AvailableSlot } from '../types/index';

interface BookingTabProps {
  onBook: (slot: AvailableSlot, tutorName: string, subjectName: string) => void;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  experienceYears?: number;
  bio?: string;
}

const BookingTab: React.FC<BookingTabProps> = ({ onBook }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [fullyBookedDates, setFullyBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');

  // Load teachers on component mount
  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load subjects when teacher is selected
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherSubjects(selectedTeacher.id);
    } else {
      setSubjects([]);
      setSelectedSubject(null);
    }
  }, [selectedTeacher]);

  // Load available slots when teacher, subject, and date are selected
  useEffect(() => {
    const loadSlots = async () => {
      if (selectedTeacher && selectedSubject && selectedDate) {
        try {
          setLoadingSlots(true);
          setError('');
          const slots = await apiService.getAvailableTimeSlots(
            selectedTeacher.id,
            selectedSubject.id,
            selectedDate
          );
          setAvailableSlots(slots);
        } catch (err) {
          setError('Failed to load available slots. Please try again.');
          console.error('Error loading slots:', err);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };

    loadSlots();
  }, [selectedTeacher, selectedSubject, selectedDate]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError('');
      // Get all teachers - we'll create a new API endpoint for this
      const teachersData = await apiService.getAllTeachers();
      setTeachers(teachersData);

      // Set default teacher (first one) if available
      if (teachersData.length > 0) {
        const defaultTeacher = teachersData[0];
        setSelectedTeacher(defaultTeacher);
        // Load subjects for default teacher
        loadTeacherSubjects(defaultTeacher.id);
        // Load available dates for default teacher
        loadAvailableDates(defaultTeacher.id);
      }
    } catch (err) {
      setError('Failed to load teachers. Please try again.');
      console.error('Error loading teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherSubjects = async (teacherId: number) => {
    try {
      setLoadingSubjects(true);
      setError('');
      const subjectsData = await apiService.getTutorSubjects(teacherId);
      const mappedSubjects = subjectsData.map((ts) => ({
        id: ts.subjectId,
        name: ts.subjectName,
        description: ts.subjectDescription || '',
        is_active: ts.isActive,
      }));

      setSubjects(mappedSubjects);

      // Set default subject (first one) if available
      if (mappedSubjects.length > 0) {
        setSelectedSubject(mappedSubjects[0]);
      }
    } catch (err) {
      setError('Failed to load teacher subjects. Please try again.');
      console.error('Error loading teacher subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadAvailableDates = async (teacherId: number) => {
    try {
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);

      const startDateStr = today.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const availableDatesData = await apiService.getTeacherAvailableDates(
        teacherId,
        startDateStr,
        endDateStr
      );
      setAvailableDates(availableDatesData);

      // Check which dates are fully booked if we have a selected subject
      if (selectedSubject) {
        checkFullyBookedDates(
          teacherId,
          selectedSubject.id,
          availableDatesData
        );
      }
    } catch (err) {
      console.error('Error loading available dates:', err);
      // Don't show error for this as it's not critical
    }
  };

  const checkFullyBookedDates = async (
    teacherId: number,
    subjectId: number,
    dates: string[]
  ) => {
    try {
      const fullyBooked: string[] = [];

      // Check first few dates to avoid too many API calls
      const datesToCheck = dates.slice(0, 10); // Check first 10 dates

      for (const date of datesToCheck) {
        try {
          const slots = await apiService.getAvailableTimeSlots(
            teacherId,
            subjectId,
            date
          );
          const hasAvailableSlots = slots.some((slot) => !slot.isBooked);

          if (!hasAvailableSlots && slots.length > 0) {
            fullyBooked.push(date);
          }
        } catch (err) {
          // If error checking slots, assume date is available
          continue;
        }
      }

      setFullyBookedDates(fullyBooked);
    } catch (err) {
      console.error('Error checking fully booked dates:', err);
    }
  };

  const handleTeacherSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teacherId = parseInt(e.target.value);
    const teacher = teachers.find((t) => t.id === teacherId);
    setSelectedTeacher(teacher || null);
    setSelectedSubject(null);
    setAvailableSlots([]);

    if (teacher) {
      loadTeacherSubjects(teacher.id);
      loadAvailableDates(teacher.id);
    }
  };

  const handleSubjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = parseInt(e.target.value);
    const subject = subjects.find((s) => s.id === subjectId);
    setSelectedSubject(subject || null);
    setAvailableSlots([]);

    // Check fully booked dates when subject changes
    if (selectedTeacher && subject) {
      checkFullyBookedDates(selectedTeacher.id, subject.id, availableDates);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Function to refresh available slots (can be called after booking)
  const refreshSlots = async () => {
    if (selectedTeacher && selectedSubject && selectedDate) {
      try {
        setLoadingSlots(true);
        const slots = await apiService.getAvailableTimeSlots(
          selectedTeacher.id,
          selectedSubject.id,
          selectedDate
        );
        setAvailableSlots(slots);

        // Also refresh the fully booked dates to update styling
        checkFullyBookedDates(
          selectedTeacher.id,
          selectedSubject.id,
          availableDates
        );
      } catch (err) {
        console.error('Error refreshing slots:', err);
      } finally {
        setLoadingSlots(false);
      }
    }
  };

  const handleSlotSelect = (slot: AvailableSlot) => {
    if (selectedTeacher && selectedSubject) {
      // Ensure the slot has the correct subjectId from the selected subject
      const enhancedSlot = {
        ...slot,
        subjectId: selectedSubject.id,
        tutorId: selectedTeacher.id,
      };
      onBook(enhancedSlot, selectedTeacher.name, selectedSubject.name);

      // Refresh slots after booking (with a small delay to ensure backend is updated)
      setTimeout(refreshSlots, 1000);
    }
  };

  // Generate next 30 days for date selection
  const getNext30Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const value = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      days.push({
        value,
        label,
        isToday: i === 0,
      });
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Book an Appointment
          </h2>
          <p className="text-gray-600 text-lg">
            Select a teacher, subject, date and time slot for your tutoring
            session.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Teacher Selection */}
          <div className="bg-white">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
              Select Teacher
            </label>
            <div className="relative">
              <select
                value={selectedTeacher?.id || ''}
                onChange={handleTeacherSelect}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10 text-gray-900 shadow-sm hover:border-gray-300 transition-all duration-200"
                disabled={loading}
              >
                <option value="" className="text-gray-500">
                  Choose a teacher...
                </option>
                {teachers.map((teacher) => (
                  <option
                    key={teacher.id}
                    value={teacher.id}
                    className="text-gray-900"
                  >
                    {teacher.name}{' '}
                    {teacher.experienceYears &&
                      `(${teacher.experienceYears} years exp.)`}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {loading && (
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading teachers...
              </p>
            )}
          </div>

          {/* Subject Selection */}
          <div className="bg-white">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <BookIcon className="w-5 h-5 mr-2 text-blue-600" />
              Select Subject
            </label>
            <div className="relative">
              <select
                value={selectedSubject?.id || ''}
                onChange={handleSubjectSelect}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white pr-10 text-gray-900 shadow-sm transition-all duration-200 ${
                  !selectedTeacher || loadingSubjects
                    ? 'border-gray-200 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!selectedTeacher || loadingSubjects}
              >
                <option value="" className="text-gray-500">
                  {!selectedTeacher
                    ? 'Select a teacher first...'
                    : 'Choose a subject...'}
                </option>
                {subjects.map((subject) => (
                  <option
                    key={subject.id}
                    value={subject.id}
                    className="text-gray-900"
                  >
                    {subject.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {loadingSubjects && (
              <p className="text-sm text-gray-500 mt-2 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading subjects...
              </p>
            )}
          </div>

          {/* Date Selection */}
          <div className="bg-white">
            <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
              <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
              Select Date
            </label>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
              {getNext30Days().map((date) => {
                const isAvailable = selectedTeacher
                  ? availableDates.includes(date.value)
                  : false;
                const isFullyBooked = fullyBookedDates.includes(date.value);
                const isDisabled =
                  !selectedTeacher ||
                  !selectedSubject ||
                  !isAvailable ||
                  isFullyBooked;

                return (
                  <button
                    key={date.value}
                    onClick={() => handleDateSelect(date.value)}
                    className={`p-3 text-center border-2 rounded-lg transition-all duration-200 min-h-[70px] flex flex-col justify-center ${
                      selectedDate === date.value
                        ? 'border-blue-500 bg-blue-500 text-white shadow-lg transform scale-105'
                        : date.isToday && isAvailable && !isFullyBooked
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : isFullyBooked
                        ? 'border-orange-200 bg-orange-100 text-orange-600 cursor-not-allowed opacity-70'
                        : !isAvailable && selectedTeacher
                        ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                        : !selectedTeacher || !selectedSubject
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md'
                    }`}
                    disabled={isDisabled}
                  >
                    <div className="text-sm font-semibold">
                      {date.label.split(' ')[0]}
                    </div>
                    <div className="text-xs opacity-75">
                      {date.label.split(' ').slice(1).join(' ')}
                    </div>
                    {!isAvailable && selectedTeacher && (
                      <div className="text-xs text-red-400 mt-1">N/A</div>
                    )}
                    {isFullyBooked && (
                      <div className="text-xs text-orange-500 mt-1">Full</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedTeacher && selectedSubject && selectedDate && (
            <div className="bg-white border-t pt-8">
              <div className="flex items-center mb-6">
                <CalendarIcon className="w-6 h-6 mr-3 text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Available Time Slots
                </h3>
              </div>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <span className="text-gray-600 font-medium">
                    Loading available slots...
                  </span>
                </div>
              ) : (
                <>
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-blue-900 font-medium">
                          <strong>Selected:</strong> {selectedSubject.name} with{' '}
                          {selectedTeacher.name} on{' '}
                          {formatDateHeader(new Date(selectedDate))}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Timezone Display */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between text-sm text-blue-700">
                      <span>
                        Your timezone:{' '}
                        <strong>
                          {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </strong>
                      </span>
                      <span>
                        Current time:{' '}
                        <strong>{new Date().toLocaleTimeString()}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      All times are shown in your local timezone. Past time
                      slots are automatically disabled.
                    </p>
                  </div>

                  <TimeSlotPicker
                    availableSlots={availableSlots}
                    onSelectSlot={handleSlotSelect}
                    loading={loadingSlots}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingTab;
