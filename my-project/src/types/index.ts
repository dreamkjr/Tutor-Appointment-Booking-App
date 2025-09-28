// Core data type definitions for the tutor appointment application

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Tutor {
  id: number;
  name: string;
  email: string;
  subject: string;
  user_id: number;
  availability_start: string;
  availability_end: string;
  is_active: boolean;
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
  createdAt: string | Date;
}

export interface TimeSlot {
  id: string;
  dateTime: string | Date;
  tutorId: number;
  tutorName: string;
  subject: string;
  isBooked: boolean;
}

export interface AppointmentCreateData {
  dateTime: string;
  tutorId: number;
  notes?: string;
}

export interface AppointmentUpdateData {
  dateTime?: string;
  notes?: string;
}

export type AppointmentStatus = 'scheduled' | 'cancelled' | 'completed';

export type ModalType = 
  | 'confirmBooking' 
  | 'editBooking' 
  | 'confirmReschedule' 
  | 'confirmCancel' 
  | '';

export type TabType = 'booking' | 'mybookings';