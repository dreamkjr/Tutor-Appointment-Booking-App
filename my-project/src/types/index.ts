// Core data type definitions for the tutor appointment application

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'tutor' | 'student';
  phone?: string;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface Tutor {
  id: number;
  name: string;
  email: string;
  user_id: number;
  experience_years: number;
  hourly_rate: number;
  bio?: string;
  is_active: boolean;
}

export interface TutorSubject {
  id: number;
  tutorId: number;
  subjectId: number;
  subjectName: string;
  subjectDescription?: string;
  isActive: boolean;
}

export interface TeacherSchedule {
  id: number;
  tutorId: number;
  subjectId: number;
  subjectName: string;
  subjectDescription?: string;
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface TutorWithSubject {
  id: number;
  name: string;
  email: string;
  experience_years: number;
  bio?: string;
  hourly_rate: number;
  subject_name: string;
}

export interface Appointment {
  id: number;
  dateTime: string | Date;
  status: AppointmentStatus;
  notes: string;
  tutor: {
    name: string;
    email: string;
    subject: string;
  };
  subject: {
    id: number;
    name: string;
  };
  createdAt: string | Date;
}

export interface TimeSlot {
  id: string;
  dateTime: string | Date;
  startTime: string;
  endTime: string;
  tutorId: number;
  subjectId: number;
  isBooked: boolean;
}

export interface AvailableSlot extends TimeSlot {
  tutorName?: string;
  subjectName?: string;
}

export interface AppointmentCreateData {
  dateTime: string;
  tutorId: number;
  subjectId: number;
  studentId: number;
  notes?: string;
}

export interface AppointmentUpdateData {
  dateTime?: string;
  notes?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'cancelled'
  | 'completed'
  | 'confirmed'
  | 'pending';

export interface TeacherAppointment {
  id: number;
  studentId: number;
  tutorId: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  subjectName: string;
  studentName: string;
  studentEmail: string;
}

export type ModalType =
  | 'confirmBooking'
  | 'editBooking'
  | 'confirmReschedule'
  | 'confirmCancel'
  | '';

export type TabType = 'booking' | 'mybookings';
